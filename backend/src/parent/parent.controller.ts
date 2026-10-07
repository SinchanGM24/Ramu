import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { DatabaseService } from "../database/database.service";
import { ReportPdfService } from "../files/report-pdf.service";

const sessionCookieName = "ramu_parent_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

@Controller("parent")
export class ParentController {
  constructor(private readonly db: DatabaseService, private readonly pdf: ReportPdfService) {}

  @Post("verify")
  async verify(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const input = z.object({ token: z.string().min(20), pin: z.string().regex(/^\d{6}$/) }).parse(body);
    const verified = await this.db.query<{ verify_parent_report: unknown }>("SELECT verify_parent_report($1,$2)", [input.token, input.pin]);
    if (!verified.rows[0]?.verify_parent_report) throw new Error("Tautan atau PIN tidak valid");
    const access = await this.db.query<{ report_version_id: string }>("SELECT report_version_id FROM report_access WHERE token_hash=$1", [hash(input.token)]);
    const reportVersionId = access.rows[0]?.report_version_id;
    if (!reportVersionId) throw new Error("Tautan atau PIN tidak valid");

    const rawSession = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    await this.db.query("INSERT INTO parent_report_sessions(report_version_id,token_hash,expires_at) VALUES($1,$2,$3)", [reportVersionId, hash(rawSession), expiresAt]);
    reply.setCookie(sessionCookieName, rawSession, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/parent", expires: expiresAt });
    return { expiresAt };
  }

  @Get("report")
  async report(@Req() request: FastifyRequest) {
    const rawSession = request.cookies?.[sessionCookieName];
    if (!rawSession) throw new Error("Sesi akses wali tidak valid atau telah berakhir");
    const result = await this.db.query<{ snapshot: unknown }>(`SELECT rv.snapshot FROM parent_report_sessions session JOIN report_versions rv ON rv.id = session.report_version_id WHERE session.token_hash=$1 AND session.expires_at > now()`, [hash(rawSession)]);
    if (!result.rows[0]) throw new Error("Sesi akses wali tidak valid atau telah berakhir");
    return { report: result.rows[0].snapshot };
  }

  @Get("report-pdf")
  async reportPdf(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const rawSession = request.cookies?.[sessionCookieName];
    if (!rawSession) throw new Error("Sesi akses wali tidak valid atau telah berakhir");
    const result = await this.db.query<{ pdf_storage_key: string | null }>(`SELECT rv.pdf_storage_key FROM parent_report_sessions session JOIN report_versions rv ON rv.id = session.report_version_id WHERE session.token_hash=$1 AND session.expires_at > now()`, [hash(rawSession)]);
    const storageKey = result.rows[0]?.pdf_storage_key;
    if (!storageKey) throw new Error("File PDF rapor belum tersedia");
    const pdf = await this.pdf.readPublishedReport(storageKey);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", "attachment; filename=rapor-anak.pdf");
    return reply.send(pdf);
  }
}
