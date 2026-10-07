import { Controller, Get, Param, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { DEFAULT_TK_TEMPLATE_NAME } from "../assessment/default-tk-template";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { assertReportAccess } from "./report-authorization";

@Controller("reports")
export class ReportCompletenessController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService) {}

  @Get(":id/completeness")
  async check(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"]);
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ student_id: string; semester_id: string }>("SELECT student_id,semester_id FROM reports WHERE id=$1 AND school_id=$2", [id, actor.schoolId])).rows[0];
      if (!report) throw new Error("Rapor tidak ditemukan");
      await assertReportAccess(client, actor, id);
      const missingAssessments = (await client.query<{ description: string }>(`SELECT i.description FROM indicators i JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id
        LEFT JOIN student_assessments assessment ON assessment.indicator_id=i.id AND assessment.student_id=$1 AND assessment.semester_id=$2
        WHERE f.name=$3 AND f.is_active AND assessment.id IS NULL ORDER BY da.position,sa.position,i.position`, [report.student_id, report.semester_id, DEFAULT_TK_TEMPLATE_NAME])).rows.map((row) => row.description);
      const missingNarratives = (await client.query<{ name: string }>(`SELECT da.name FROM development_areas da JOIN assessment_frameworks f ON f.id=da.framework_id
        LEFT JOIN report_narratives narrative ON narrative.development_area_id=da.id AND narrative.report_id=$1
        WHERE f.name=$2 AND f.is_active AND (narrative.id IS NULL OR btrim(narrative.content)='') ORDER BY da.position`, [id, DEFAULT_TK_TEMPLATE_NAME])).rows.map((row) => row.name);
      const semesterData = (await client.query<{ ready: boolean }>("SELECT EXISTS(SELECT 1 FROM growth_records WHERE student_id=$1 AND semester_id=$2) AND EXISTS(SELECT 1 FROM attendance_summaries WHERE student_id=$1 AND semester_id=$2) AS ready", [report.student_id, report.semester_id])).rows[0].ready;
      return { complete: missingAssessments.length === 0 && missingNarratives.length === 0 && semesterData, missingAssessments, missingNarratives, missingSemesterData: !semesterData };
    }, actor.schoolId);
  }
}
