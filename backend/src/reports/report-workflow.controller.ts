import { Controller, Param, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { assertReportAccess } from "./report-authorization";

@Controller("reports")
export class ReportWorkflowController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}

  @Post(":id/resume-revision")
  async resumeRevision(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      await assertReportAccess(client, actor, id);
      const report = (await client.query("UPDATE reports SET status='DRAFT',updated_at=now() WHERE id=$1 AND school_id=$2 AND status='REVISION_REQUIRED' RETURNING *", [id, actor.schoolId])).rows[0];
      if (!report) throw new Error("Rapor yang perlu direvisi tidak ditemukan");
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report.revision_resumed", entityType: "report", entityId: id }, client);
      return report;
    }, actor.schoolId);
  }

  @Post(":id/correction")
  async startCorrection(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "PRINCIPAL"]);
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ id: string }>("SELECT id FROM reports WHERE id=$1 AND school_id=$2 AND status='PUBLISHED' FOR UPDATE", [id, actor.schoolId])).rows[0];
      if (!report) throw new Error("Hanya rapor terbit yang dapat dibuatkan koreksi");
      const previousVersion = (await client.query<{ id: string; version_number: number }>("SELECT id,version_number FROM report_versions WHERE report_id=$1 ORDER BY version_number DESC LIMIT 1", [id])).rows[0];
      if (!previousVersion) throw new Error("Versi rapor terbit tidak ditemukan");
      const updated = (await client.query("UPDATE reports SET status='DRAFT',submitted_at=NULL,approved_at=NULL,updated_at=now() WHERE id=$1 RETURNING *", [id])).rows[0];
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report.correction_started", entityType: "report", entityId: id, metadata: { previousVersionId: previousVersion.id, previousVersionNumber: previousVersion.version_number } }, client);
      return updated;
    }, actor.schoolId);
  }
}
