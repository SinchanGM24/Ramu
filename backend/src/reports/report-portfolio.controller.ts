import { Controller, Get, Param, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { ReportPdfService } from "../files/report-pdf.service";
import { assertReportAccess } from "./report-authorization";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

@Controller("reports")
export class ReportPortfolioController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService, private readonly files: ReportPdfService) {}

  @Get(":id/portfolio")
  async list(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"]);
    return this.db.transaction(async (client) => { await assertReportAccess(client, actor, id); return (await client.query("SELECT id,original_filename,content_type,byte_size,caption,included_in_report,created_at FROM portfolio_items WHERE report_id=$1 AND school_id=$2 ORDER BY created_at DESC", [id, actor.schoolId])).rows; }, actor.schoolId);
  }

  @Post(":id/portfolio")
  async upload(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const file = await request.file();
    if (!file || !acceptedImageTypes.has(file.mimetype)) throw new Error("Pilih foto JPG, PNG, atau WebP");
    const buffer = await file.toBuffer();
    if (!buffer.length) throw new Error("Foto portfolio kosong");
    const fields = file.fields as Record<string, { value?: string }>;
    const caption = fields.caption?.value?.trim().slice(0, 500) || null;
    const included = fields.includedInReport?.value !== "false";
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ student_id: string; semester_id: string }>("SELECT student_id,semester_id FROM reports WHERE id=$1 AND school_id=$2 AND status<>'PUBLISHED'", [id, actor.schoolId])).rows[0];
      if (!report) throw new Error("Rapor tidak ditemukan atau sudah diterbitkan");
      await assertReportAccess(client, actor, id);
      const storageKey = await this.files.storePortfolioImage({ schoolId: actor.schoolId, reportId: id, filename: file.filename, contentType: file.mimetype, body: buffer });
      const saved = (await client.query("INSERT INTO portfolio_items(school_id,report_id,student_id,semester_id,storage_key,original_filename,content_type,byte_size,caption,included_in_report,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,original_filename,content_type,byte_size,caption,included_in_report,created_at", [actor.schoolId, id, report.student_id, report.semester_id, storageKey, file.filename.slice(0, 255), file.mimetype, buffer.length, caption, included, actor.userId])).rows[0];
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report_portfolio.uploaded", entityType: "portfolio_item", entityId: saved.id }, client);
      return saved;
    }, actor.schoolId);
  }
}
