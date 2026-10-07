import { Controller, Get, Param, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

@Controller("reports")
export class ReportCompletenessController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService) {}
  @Get(":id/completeness")
  async check(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"]);
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ student_id: string; semester_id: string }>("SELECT student_id,semester_id FROM reports WHERE id=$1 AND school_id=$2", [id, actor.schoolId])).rows[0];
      if (!report) throw new Error("Rapor tidak ditemukan");
      const missingAssessments = (await client.query<{ description: string }>(`SELECT i.description FROM indicators i LEFT JOIN student_assessments sa ON sa.indicator_id=i.id AND sa.student_id=$1 AND sa.semester_id=$2 WHERE sa.id IS NULL ORDER BY i.position`, [report.student_id, report.semester_id])).rows.map((row) => row.description);
      const missingNarratives = (await client.query<{ name: string }>(`SELECT da.name FROM development_areas da LEFT JOIN report_narratives rn ON rn.development_area_id=da.id AND rn.report_id=$1 WHERE rn.id IS NULL ORDER BY da.position`, [id])).rows.map((row) => row.name);
      const semesterData = (await client.query<{ ready: boolean }>("SELECT EXISTS(SELECT 1 FROM growth_records WHERE student_id=$1 AND semester_id=$2) AND EXISTS(SELECT 1 FROM attendance_summaries WHERE student_id=$1 AND semester_id=$2) AS ready", [report.student_id, report.semester_id])).rows[0].ready;
      return { complete: missingAssessments.length === 0 && missingNarratives.length === 0 && semesterData, missingAssessments, missingNarratives, missingSemesterData: !semesterData };
    }, actor.schoolId);
  }
}
