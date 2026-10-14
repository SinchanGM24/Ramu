import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { ReportPdfService } from "../files/report-pdf.service";

@Controller("schools/current")
export class SchoolsController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly files: ReportPdfService,
  ) {}
  @Get() async current(@Req() request: FastifyRequest) {
    const session = this.auth.require(request);
    return this.db.transaction(
      async (client) =>
        (
          await client.query(
            "SELECT id,name,slug,address,phone,logo_storage_key IS NOT NULL AS has_logo,updated_at FROM schools WHERE id=$1",
            [session.schoolId],
          )
        ).rows[0],
      session.schoolId,
    );
  }
  @Patch() async update(@Req() request: FastifyRequest, @Body() body: unknown) {
    const session = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = z
      .object({
        name: z.string().min(2).max(160),
        address: z.string().max(500).optional(),
        phone: z.string().max(40).optional(),
      })
      .parse(body);
    return this.db.transaction(async (client) => {
      const { rows } = await client.query(
        "UPDATE schools SET name=$1,address=$2,phone=$3,updated_at=now() WHERE id=$4 RETURNING id,name,slug,address,phone,logo_storage_key IS NOT NULL AS has_logo",
        [
          input.name,
          input.address ?? null,
          input.phone ?? null,
          session.schoolId,
        ],
      );
      await this.audit.record(
        {
          schoolId: session.schoolId,
          actorUserId: session.userId,
          action: "school.updated",
          entityType: "school",
          entityId: session.schoolId,
        },
        client,
      );
      return rows[0];
    }, session.schoolId);
  }
  @Post("logo") async uploadLogo(@Req() request: FastifyRequest) {
    const session = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const file = await request.file();
    if (!file || !["image/jpeg", "image/png"].includes(file.mimetype))
      throw new BadRequestException("Pilih logo berformat JPG atau PNG.");
    const body = await file.toBuffer();
    if (!body.length || body.length > 2 * 1024 * 1024)
      throw new BadRequestException("Ukuran logo maksimal 2 MB.");
    const storageKey = await this.files.storeSchoolLogo({
      schoolId: session.schoolId,
      contentType: file.mimetype,
      body,
    });
    return this.db.transaction(async (client) => {
      const saved = (
        await client.query(
          "UPDATE schools SET logo_storage_key=$1,logo_content_type=$2,updated_at=now() WHERE id=$3 RETURNING id,name,slug,address,phone,logo_storage_key IS NOT NULL AS has_logo",
          [storageKey, file.mimetype, session.schoolId],
        )
      ).rows[0];
      await this.audit.record(
        {
          schoolId: session.schoolId,
          actorUserId: session.userId,
          action: "school.logo_uploaded",
          entityType: "school",
          entityId: session.schoolId,
        },
        client,
      );
      return saved;
    }, session.schoolId);
  }
  @Get("logo") async logo(
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const session = this.auth.require(request);
    const logo = await this.db.transaction(
      async (client) =>
        (
          await client.query<{
            logo_storage_key: string;
            logo_content_type: string;
          }>(
            "SELECT logo_storage_key,logo_content_type FROM schools WHERE id=$1",
            [session.schoolId],
          )
        ).rows[0],
      session.schoolId,
    );
    if (!logo?.logo_storage_key || !logo.logo_content_type)
      throw new NotFoundException("Logo sekolah belum diunggah.");
    const body = await this.files.readStoredImage(logo.logo_storage_key);
    reply
      .header("Content-Type", logo.logo_content_type)
      .header("Cache-Control", "private, max-age=300")
      .send(body);
  }
}
