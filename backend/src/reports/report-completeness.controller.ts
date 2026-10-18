import { Controller, Get, NotFoundException, Param, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { assertReportAccess } from "./report-authorization";
import { getReportCompleteness } from "./report-completeness";

@Controller("reports")
export class ReportCompletenessController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
  ) {}

  @Get(":id/completeness")
  async check(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, [
      "SCHOOL_ADMIN",
      "TEACHER",
      "PRINCIPAL",
    ]);
    return this.db.transaction(async (client) => {
      const report = (
        await client.query<{
          id: string;
          student_id: string;
          semester_id: string;
        }>(
          "SELECT id,student_id,semester_id FROM reports WHERE id=$1 AND school_id=$2",
          [id, actor.schoolId],
        )
      ).rows[0];
      if (!report) throw new NotFoundException("Raport tidak ditemukan");
      await assertReportAccess(client, actor, id);
      return getReportCompleteness(client, {
        id: report.id,
        studentId: report.student_id,
        semesterId: report.semester_id,
        schoolId: actor.schoolId,
      });
    }, actor.schoolId);
  }
}
