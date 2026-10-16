import { createHash, randomBytes, randomInt } from "crypto";
import {
  Controller,
  NotFoundException,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { assertReportAccess } from "./report-authorization";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

@Controller("reports")
export class ReportAccessController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  @Post(":id/access")
  async create(@Req() request: FastifyRequest, @Param("id") reportId: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);

    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER") {
        await assertReportAccess(client, actor, reportId);
      }

      const version = (
        await client.query<{ id: string }>(
          `SELECT version.id
					 FROM report_versions version
					 JOIN reports report ON report.id=version.report_id
					 WHERE version.report_id=$1
					   AND version.school_id=$2
					   AND report.school_id=$2
					   AND report.status='PUBLISHED'
					 ORDER BY version.version_number DESC
					 LIMIT 1`,
          [reportId, actor.schoolId],
        )
      ).rows[0];

      if (!version) {
        throw new NotFoundException("Raport terbit tidak ditemukan");
      }

      const token = randomBytes(32).toString("base64url");
      const pin = randomInt(0, 1_000_000).toString().padStart(6, "0");

      await client.query(
        `INSERT INTO report_access(school_id,report_version_id,token_hash,pin_hash)
				 VALUES($1,$2,$3,$4)`,
        [actor.schoolId, version.id, hash(token), hash(pin)],
      );
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report_access.created",
          entityType: "report_version",
          entityId: version.id,
        },
        client,
      );

      return { token, pin, link: `/r/${token}` };
    }, actor.schoolId);
  }
}
