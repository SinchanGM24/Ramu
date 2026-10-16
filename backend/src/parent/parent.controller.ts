import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { DatabaseService } from "../database/database.service";
import { ReportPdfService } from "../files/report-pdf.service";
import {
  rateLimitFingerprint,
  RequestRateLimiter,
} from "../common/request-rate-limiter";

const sessionCookieName = "ramu_parent_session";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const fifteenMinutes = 15 * 60_000;

@Controller("parent")
export class ParentController {
  constructor(
    private readonly db: DatabaseService,
    private readonly pdf: ReportPdfService,
    private readonly rateLimiter: RequestRateLimiter = new RequestRateLimiter(),
  ) {}

  @Post("verify")
  async verify(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Req() request: FastifyRequest = {} as FastifyRequest,
  ) {
    const input = z
      .object({ token: z.string().min(20), pin: z.string().regex(/^\d{6}$/) })
      .parse(body);
    const ip = rateLimitFingerprint(request.ip ?? "unknown");
    const token = rateLimitFingerprint(input.token);
    this.rateLimiter.assert({
      key: `parent-verify:ip:${ip}`,
      limit: 120,
      windowMs: fifteenMinutes,
    });
    this.rateLimiter.assert({
      key: `parent-verify:token:${ip}:${token}`,
      limit: 30,
      windowMs: fifteenMinutes,
    });
    const verified = await this.db.query<{
      verify_parent_report: { reportVersionId: string } | null;
    }>("SELECT verify_parent_report($1,$2)", [input.token, input.pin]);
    const verifiedAccess = verified.rows[0]?.verify_parent_report;
    if (!verifiedAccess)
      throw new UnauthorizedException("Tautan atau PIN tidak valid");
    const reportVersionId = verifiedAccess.reportVersionId;

    const rawSession = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    await this.db.query(
      "INSERT INTO parent_report_sessions(report_version_id,token_hash,expires_at) VALUES($1,$2,$3)",
      [reportVersionId, hash(rawSession), expiresAt],
    );
    reply.setCookie(sessionCookieName, rawSession, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/parent",
      expires: expiresAt,
    });
    return { expiresAt };
  }

  @Get("report")
  async report(@Req() request: FastifyRequest) {
    const rawSession = request.cookies?.[sessionCookieName];
    if (!rawSession)
      throw new UnauthorizedException(
        "Sesi akses wali tidak valid atau telah berakhir",
      );
    const result = await this.db.query<{ report: unknown }>(
      "SELECT get_parent_report($1) AS report",
      [rawSession],
    );
    if (!result.rows[0]?.report)
      throw new UnauthorizedException(
        "Sesi akses wali tidak valid atau telah berakhir",
      );
    return { report: result.rows[0].report };
  }

  @Get("report-pdf")
  async reportPdf(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const rawSession = request.cookies?.[sessionCookieName];
    if (!rawSession)
      throw new UnauthorizedException(
        "Sesi akses wali tidak valid atau telah berakhir",
      );
    const result = await this.db.query<{ pdf_storage_key: string | null }>(
      "SELECT get_parent_report_pdf_key($1) AS pdf_storage_key",
      [rawSession],
    );
    const storageKey = result.rows[0]?.pdf_storage_key;
    if (!storageKey) throw new NotFoundException("File PDF raport belum tersedia");
    const pdf = await this.pdf.readPublishedReport(storageKey);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", "attachment; filename=raport-anak.pdf");
    return reply.send(pdf);
  }
}
