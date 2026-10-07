import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

const studentSchema = z.object({
  name: z.string().trim().min(2).max(120), studentNumber: z.string().trim().max(50).nullable().optional(), classPeriodId: z.string().uuid().nullable().optional(), birthDate: z.string().date().nullable().optional(), birthPlace: z.string().trim().max(120).nullable().optional(), nickname: z.string().trim().max(120).nullable().optional(), gender: z.enum(["MALE", "FEMALE"]).nullable().optional(), religion: z.string().trim().max(80).nullable().optional(), childOrder: z.number().int().positive().nullable().optional(), address: z.string().trim().max(2000).nullable().optional(),
});
const guardianSchema = z.object({ name: z.string().trim().min(2).max(120), relationship: z.string().trim().min(2).max(50), phone: z.string().trim().min(8).max(30), occupation: z.string().trim().max(120).nullable().optional(), isPrimary: z.boolean().default(false) });

@Controller("students")
export class StudentsController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}

  @Get()
  list(@Req() request: FastifyRequest, @Query("page") page = "1", @Query("limit") limit = "20") {
    const actor = this.auth.require(request); const safePage = Math.max(Number(page), 1); const safeLimit = Math.min(Math.max(Number(limit), 1), 100);
    return this.db.transaction(async (client) => {
      const items = await client.query("SELECT s.*,grouping.name AS class_name,level.name AS level_name,enrollment.class_period_id FROM students s LEFT JOIN student_enrollments enrollment ON enrollment.student_id=s.id AND enrollment.status='ACTIVE' LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id LEFT JOIN education_levels level ON level.id=period.education_level_id WHERE s.school_id=$1 ORDER BY s.created_at DESC LIMIT $2 OFFSET $3", [actor.schoolId, safeLimit, (safePage - 1) * safeLimit]);
      const total = await client.query<{ total: number }>("SELECT count(*)::int AS total FROM students WHERE school_id=$1", [actor.schoolId]);
      return { items: items.rows, total: total.rows[0].total, page: safePage };
    }, actor.schoolId);
  }

  @Post()
  async create(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = studentSchema.parse(body);
    return this.db.transaction(async (client) => {
      const result = await client.query("INSERT INTO students(school_id,name,student_number,birth_date,birth_place,nickname,gender,religion,child_order,address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [actor.schoolId, input.name, input.studentNumber ?? null, input.birthDate ?? null, input.birthPlace ?? null, input.nickname ?? null, input.gender ?? null, input.religion ?? null, input.childOrder ?? null, input.address ?? null]);
      if (input.classPeriodId) { const period=(await client.query("SELECT academic_year_id FROM class_periods WHERE id=$1",[input.classPeriodId])).rows[0]; if(!period) throw new Error("Kelas tidak ditemukan"); await client.query("INSERT INTO student_enrollments(school_id,student_id,academic_year_id,class_period_id) VALUES($1,$2,$3,$4)",[actor.schoolId,result.rows[0].id,period.academic_year_id,input.classPeriodId]); } await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.created", entityType: "student", entityId: result.rows[0].id }, client); return result.rows[0];
    }, actor.schoolId);
  }

  @Get(":id")
  detail(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request);
    return this.db.transaction(async (client) => { const student = (await client.query("SELECT s.*,grouping.name AS class_name,enrollment.class_period_id FROM students s LEFT JOIN student_enrollments enrollment ON enrollment.student_id=s.id AND enrollment.status='ACTIVE' LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id WHERE s.id=$1 AND s.school_id=$2", [id, actor.schoolId])).rows[0]; if (!student) return null; const guardians = (await client.query("SELECT * FROM guardian_contacts WHERE student_id=$1 AND school_id=$2 ORDER BY is_primary DESC,name", [id, actor.schoolId])).rows; const enrollments=(await client.query("SELECT enrollment.*,year.name AS academic_year_name,grouping.name AS class_name,level.name AS level_name FROM student_enrollments enrollment JOIN academic_years year ON year.id=enrollment.academic_year_id LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id LEFT JOIN education_levels level ON level.id=period.education_level_id WHERE enrollment.student_id=$1 ORDER BY year.starts_on DESC",[id])).rows; return { ...student, guardians,enrollments }; }, actor.schoolId);
  }

  @Patch(":id")
  async update(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = studentSchema.parse(body);
    return this.db.transaction(async (client) => {
      const result = await client.query("UPDATE students SET name=$3,student_number=$4,birth_date=$5,birth_place=$6,nickname=$7,gender=$8,religion=$9,child_order=$10,address=$11,updated_at=now() WHERE id=$1 AND school_id=$2 RETURNING *", [id, actor.schoolId, input.name, input.studentNumber ?? null, input.birthDate ?? null, input.birthPlace ?? null, input.nickname ?? null, input.gender ?? null, input.religion ?? null, input.childOrder ?? null, input.address ?? null]);
      if (!result.rowCount) throw new Error("Murid tidak ditemukan"); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.updated", entityType: "student", entityId: id }, client); return result.rows[0];
    }, actor.schoolId);
  }

  @Post(":id/guardians")
  async createGuardian(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); return this.saveGuardian(actor, id, guardianSchema.parse(body));
  }

  @Patch(":id/guardians/:guardianId")
  async updateGuardian(@Req() request: FastifyRequest, @Param("id") id: string, @Param("guardianId") guardianId: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = guardianSchema.parse(body);
    return this.db.transaction(async (client) => {
      await this.assertStudent(client, id, actor.schoolId); if (input.isPrimary) await client.query("UPDATE guardian_contacts SET is_primary=false WHERE student_id=$1 AND school_id=$2", [id, actor.schoolId]);
      const result = await client.query("UPDATE guardian_contacts SET name=$4,relationship=$5,phone=$6,occupation=$7,is_primary=$8 WHERE id=$1 AND student_id=$2 AND school_id=$3 RETURNING *", [guardianId, id, actor.schoolId, input.name, input.relationship, input.phone, input.occupation ?? null, input.isPrimary]);
      if (!result.rowCount) throw new Error("Data wali tidak ditemukan"); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "guardian.updated", entityType: "guardian_contact", entityId: guardianId }, client); return result.rows[0];
    }, actor.schoolId);
  }

  private async saveGuardian(actor: { schoolId: string; userId: string }, studentId: string, input: z.infer<typeof guardianSchema>) {
    return this.db.transaction(async (client) => { await this.assertStudent(client, studentId, actor.schoolId); if (input.isPrimary) await client.query("UPDATE guardian_contacts SET is_primary=false WHERE student_id=$1 AND school_id=$2", [studentId, actor.schoolId]); const result = await client.query("INSERT INTO guardian_contacts (school_id,student_id,name,relationship,phone,occupation,is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", [actor.schoolId, studentId, input.name, input.relationship, input.phone, input.occupation ?? null, input.isPrimary]); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "guardian.created", entityType: "guardian_contact", entityId: result.rows[0].id }, client); return result.rows[0]; }, actor.schoolId);
  }

  private async assertStudent(client: { query: Function }, studentId: string, schoolId: string) { const student = (await client.query("SELECT id FROM students WHERE id=$1 AND school_id=$2", [studentId, schoolId])).rows[0]; if (!student) throw new Error("Siswa tidak ditemukan"); return student; }
}
