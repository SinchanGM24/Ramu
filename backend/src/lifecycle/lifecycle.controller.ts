import { BadRequestException, Body, Controller, Get, NotFoundException, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

const date = z.string().date();
const transferItem = z.object({ studentId: z.string().uuid(), targetClassPeriodId: z.string().uuid(), effectiveOn: date, reason: z.string().trim().max(1000).optional() });
const transferSchema = z.object({ items: z.array(transferItem).min(1).max(200), reason: z.string().trim().max(1000).optional() });
const graduationSchema = z.object({ studentIds: z.array(z.string().uuid()).min(1).max(200), effectiveOn: date, reason: z.string().trim().max(1000).optional() });
const reversalSchema = z.object({ studentId: z.string().uuid(), effectiveOn: date, reason: z.string().trim().min(1).max(1000) });

@Controller("lifecycle")
export class LifecycleController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}

  @Get("history")
  history(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    return this.db.transaction(async c => (await c.query(`SELECT event.*, student.name AS student_name, operation.operation_type, operation.actor_user_id
      FROM student_lifecycle_events event JOIN students student ON student.id=event.student_id JOIN lifecycle_operations operation ON operation.id=event.operation_id
      WHERE event.school_id=$1 ORDER BY event.effective_on DESC,event.created_at DESC`, [actor.schoolId])).rows, actor.schoolId);
  }

  @Post("transfers")
  async transfer(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = transferSchema.parse(body);
    return this.db.transaction(async c => {
      const operation = (await c.query("INSERT INTO lifecycle_operations(school_id,operation_type,actor_user_id,reason) VALUES($1,'TRANSFER',$2,$3) RETURNING id", [actor.schoolId, actor.userId, input.reason ?? null])).rows[0];
      const results: unknown[] = [];
      for (const item of input.items) results.push(await this.place(c, actor, operation.id, item, "TRANSFER", input.reason));
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.transfer.processed", entityType: "lifecycle_operation", entityId: operation.id, metadata: { count: results.length } }, c);
      return { operationId: operation.id, processed: results.length, results };
    }, actor.schoolId);
  }

  @Post("continuations")
  async continueStudents(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = transferSchema.parse(body);
    return this.db.transaction(async c => {
      const operation = (await c.query("INSERT INTO lifecycle_operations(school_id,operation_type,actor_user_id,reason) VALUES($1,'CONTINUATION',$2,$3) RETURNING id", [actor.schoolId, actor.userId, input.reason ?? null])).rows[0];
      const results: unknown[] = [];
      for (const item of input.items) results.push(await this.place(c, actor, operation.id, item, "CONTINUATION", input.reason));
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.continuation.processed", entityType: "lifecycle_operation", entityId: operation.id, metadata: { count: results.length } }, c);
      return { operationId: operation.id, processed: results.length, results };
    }, actor.schoolId);
  }

  @Post("graduations")
  async graduate(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = graduationSchema.parse(body);
    return this.db.transaction(async c => {
      const operation = (await c.query("INSERT INTO lifecycle_operations(school_id,operation_type,actor_user_id,reason) VALUES($1,'GRADUATION',$2,$3) RETURNING id", [actor.schoolId, actor.userId, input.reason ?? null])).rows[0];
      for (const studentId of input.studentIds) {
        const student = (await c.query("SELECT id,lifecycle_status FROM students WHERE id=$1 AND school_id=$2 FOR UPDATE", [studentId, actor.schoolId])).rows[0];
        if (!student) throw new NotFoundException("Murid tidak ditemukan.");
        if (student.lifecycle_status === "GRADUATED") throw new BadRequestException("Murid sudah tercatat sebagai alumni.");
        await c.query("UPDATE students SET lifecycle_status='GRADUATED',updated_at=now() WHERE id=$1", [studentId]);
        await c.query("UPDATE student_enrollments SET status='GRADUATED',effective_end_on=LEAST(COALESCE(effective_end_on,$2::date),GREATEST($2::date,effective_start_on + 1)),ended_at=now() WHERE student_id=$1 AND school_id=$3 AND effective_start_on <= $2 AND (effective_end_on IS NULL OR effective_end_on > $2)", [studentId, input.effectiveOn, actor.schoolId]);
        await this.event(c, actor.schoolId, studentId, operation.id, "GRADUATED", input.effectiveOn, { lifecycleStatus: student.lifecycle_status }, { lifecycleStatus: "GRADUATED" }, input.reason);
      }
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.graduation.processed", entityType: "lifecycle_operation", entityId: operation.id, metadata: { count: input.studentIds.length } }, c);
      return { operationId: operation.id, processed: input.studentIds.length };
    }, actor.schoolId);
  }

  @Post("graduations/reverse")
  async reverseGraduation(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = reversalSchema.parse(body);
    return this.db.transaction(async c => {
      const student = (await c.query("SELECT id,lifecycle_status FROM students WHERE id=$1 AND school_id=$2 FOR UPDATE", [input.studentId, actor.schoolId])).rows[0];
      if (!student) throw new NotFoundException("Murid tidak ditemukan."); if (student.lifecycle_status !== "GRADUATED") throw new BadRequestException("Murid bukan alumni.");
      const operation = (await c.query("INSERT INTO lifecycle_operations(school_id,operation_type,actor_user_id,reason) VALUES($1,'GRADUATION_REVERSAL',$2,$3) RETURNING id", [actor.schoolId, actor.userId, input.reason])).rows[0];
      await c.query("UPDATE students SET lifecycle_status='ACTIVE',updated_at=now() WHERE id=$1", [student.id]);
      await this.event(c, actor.schoolId, student.id, operation.id, "GRADUATION_REVERSED", input.effectiveOn, { lifecycleStatus: "GRADUATED" }, { lifecycleStatus: "ACTIVE" }, input.reason);
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.graduation.reversed", entityType: "lifecycle_operation", entityId: operation.id, metadata: { studentId: student.id } }, c);
      return { operationId: operation.id, studentId: student.id };
    }, actor.schoolId);
  }

  private async place(c: any, actor: { schoolId: string; userId: string }, operationId: string, item: z.infer<typeof transferItem>, action: string, reason?: string) {
    const target = (await c.query("SELECT id,academic_year_id FROM class_periods WHERE id=$1 AND school_id=$2", [item.targetClassPeriodId, actor.schoolId])).rows[0];
    if (!target) throw new NotFoundException("Kelas tujuan tidak ditemukan.");
    const student = (await c.query("SELECT id,lifecycle_status FROM students WHERE id=$1 AND school_id=$2 FOR UPDATE", [item.studentId, actor.schoolId])).rows[0];
    if (!student || student.lifecycle_status !== "ACTIVE") throw new BadRequestException("Murid aktif tidak ditemukan.");
    const source = (await c.query(`SELECT * FROM student_enrollments WHERE student_id=$1 AND school_id=$2 AND academic_year_id=$3 AND effective_start_on <= $4 AND (effective_end_on IS NULL OR effective_end_on > $4) FOR UPDATE`, [item.studentId, actor.schoolId, target.academic_year_id, item.effectiveOn])).rows[0] ?? null;
    if (source?.class_period_id === target.id) throw new BadRequestException("Murid sudah berada pada kelas tujuan.");
    if (source) await c.query("UPDATE student_enrollments SET effective_end_on=$2,status='TRANSFERRED',ended_at=CASE WHEN $2 <= CURRENT_DATE THEN now() ELSE ended_at END WHERE id=$1", [source.id, item.effectiveOn]);
    const status = item.effectiveOn > new Date().toISOString().slice(0, 10) ? "SCHEDULED" : "ACTIVE";
    const enrollment = (await c.query("INSERT INTO student_enrollments(school_id,student_id,academic_year_id,class_period_id,status,started_at,effective_start_on) VALUES($1,$2,$3,$4,$5,now(),$6) RETURNING *", [actor.schoolId, item.studentId, target.academic_year_id, target.id, status, item.effectiveOn])).rows[0];
    if (status === "ACTIVE") await c.query("UPDATE reports SET student_enrollment_id=$1,updated_at=now() WHERE student_id=$2 AND status IN ('DRAFT','REVISION_REQUIRED') AND semester_id IN (SELECT id FROM semesters WHERE academic_year_id=$3)", [enrollment.id, item.studentId, target.academic_year_id]);
    await this.event(c, actor.schoolId, item.studentId, operationId, action, item.effectiveOn, { enrollmentId: source?.id ?? null, classPeriodId: source?.class_period_id ?? null }, { enrollmentId: enrollment.id, classPeriodId: target.id, status }, item.reason ?? reason);
    return { studentId: item.studentId, enrollmentId: enrollment.id, status };
  }
  private async event(c: any, schoolId: string, studentId: string, operationId: string, action: string, effectiveOn: string, previous: object, next: object, reason?: string) {
    await c.query("INSERT INTO student_lifecycle_events(school_id,student_id,operation_id,action,effective_on,previous_state,new_state,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [schoolId, studentId, operationId, action, effectiveOn, JSON.stringify(previous), JSON.stringify(next), reason ?? null]);
  }
}
