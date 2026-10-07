import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

const extracurricularInput = z.object({ activityName: z.string().trim().min(2).max(160), grade: z.enum(["A", "B", "C", "D"]) });

@Controller("reports")
export class ReportExtracurricularController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}

  @Get(":id/extracurricular")
  async list(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"]);
    return this.db.transaction(async (client) => (await client.query(`SELECT e.id,e.activity_name,e.grade FROM extracurricular_records e JOIN reports r ON r.student_id=e.student_id AND r.semester_id=e.semester_id WHERE r.id=$1 AND r.school_id=$2 ORDER BY e.activity_name`, [id, actor.schoolId])).rows, actor.schoolId);
  }

  @Post(":id/extracurricular")
  async create(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = extracurricularInput.parse(body);
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ student_id: string; semester_id: string }>("SELECT student_id,semester_id FROM reports WHERE id=$1 AND school_id=$2 AND status<>'PUBLISHED'", [id, actor.schoolId])).rows[0];
      if (!report) throw new Error("Rapor tidak ditemukan atau sudah diterbitkan");
      const saved = (await client.query("INSERT INTO extracurricular_records(school_id,student_id,semester_id,activity_name,grade) VALUES($1,$2,$3,$4,$5) ON CONFLICT(student_id,semester_id,activity_name) DO UPDATE SET grade=EXCLUDED.grade RETURNING *", [actor.schoolId, report.student_id, report.semester_id, input.activityName, input.grade])).rows[0];
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report_extracurricular.saved", entityType: "extracurricular_record", entityId: saved.id }, client);
      return saved;
    }, actor.schoolId);
  }

  @Delete(":id/extracurricular/:recordId")
  async remove(@Req() request: FastifyRequest, @Param("id") id: string, @Param("recordId") recordId: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      const deleted = (await client.query(`DELETE FROM extracurricular_records e USING reports r WHERE e.id=$1 AND r.id=$2 AND r.school_id=$3 AND r.status<>'PUBLISHED' AND e.student_id=r.student_id AND e.semester_id=r.semester_id RETURNING e.id`, [recordId, id, actor.schoolId])).rows[0];
      if (!deleted) throw new Error("Data ekstrakurikuler tidak ditemukan atau rapor sudah diterbitkan");
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report_extracurricular.deleted", entityType: "extracurricular_record", entityId: deleted.id }, client);
      return deleted;
    }, actor.schoolId);
  }
}
