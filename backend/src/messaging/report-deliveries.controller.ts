import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { createHash, randomBytes, randomInt } from "crypto";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { assertReportAccess } from "../reports/report-authorization";
import {
  decryptParentAccessCredentials,
  encryptParentAccessCredentials,
} from "./parent-access-credentials";

const deliveryRequestSchema = z.object({
  guardianContactIds: z.array(z.string().uuid()).min(1).max(20).optional(),
});

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

function whatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;

  if (normalized.length < 10 || normalized.length > 15) {
    throw new Error("Nomor WhatsApp wali tidak valid");
  }

  return normalized;
}

@Controller()
export class ReportDeliveriesController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  @Get("reports/:reportId/deliveries")
  async list(
    @Req() request: FastifyRequest,
    @Param("reportId") reportId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER")
        await assertReportAccess(client, actor, reportId);
      const result = await client.query(
        `SELECT d.id, d.channel, d.recipient_phone, d.status, d.attempt_count, d.failure_reason,
                d.queued_at, d.sent_at, d.delivered_at, d.read_at, d.failed_at, d.whatsapp_opened_at, d.created_at,
                g.name AS guardian_name, g.relationship, rv.version_number
         FROM report_deliveries d
         JOIN report_versions rv ON rv.id = d.report_version_id AND rv.school_id = d.school_id
         JOIN reports r ON r.id = rv.report_id AND r.school_id = d.school_id
         JOIN guardian_contacts g ON g.id = d.guardian_contact_id AND g.school_id = d.school_id
         WHERE rv.report_id = $1 AND d.school_id = $2
         ORDER BY d.created_at DESC`,
        [reportId, actor.schoolId],
      );
      return result.rows;
    }, actor.schoolId);
  }

  @Get("reports/:reportId/delivery-recipients")
  async recipients(
    @Req() request: FastifyRequest,
    @Param("reportId") reportId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER")
        await assertReportAccess(client, actor, reportId);
      const report = (
        await client.query<{
          student_id: string;
          lifecycle_status: "ACTIVE" | "GRADUATED";
        }>(
          `SELECT r.student_id, student.lifecycle_status
        FROM reports r JOIN report_versions version ON version.report_id=r.id AND version.school_id=$2
        JOIN students student ON student.id=r.student_id AND student.school_id=r.school_id
        WHERE r.id=$1 AND r.school_id=$2
        ORDER BY version.version_number DESC LIMIT 1`,
          [reportId, actor.schoolId],
        )
      ).rows[0];
      if (!report) throw new Error("Raport terbit tidak ditemukan");
      return (
        await client.query(
          `SELECT id,name,relationship,phone,is_primary,$3::text AS student_lifecycle_status
        FROM guardian_contacts
        WHERE student_id=$1 AND school_id=$2 AND is_active AND is_delivery_recipient
        ORDER BY is_primary DESC,name`,
          [report.student_id, actor.schoolId, report.lifecycle_status],
        )
      ).rows;
    }, actor.schoolId);
  }

  @Get("reports/:reportId/delivery-context")
  async deliveryContext(
    @Req() request: FastifyRequest,
    @Param("reportId") reportId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER")
        await assertReportAccess(client, actor, reportId);
      const report = (
        await client.query<{ student_id: string }>(
          "SELECT student_id FROM reports WHERE id=$1 AND school_id=$2 AND status='PUBLISHED'",
          [reportId, actor.schoolId],
        )
      ).rows[0];
      if (!report) throw new Error("Raport terbit tidak ditemukan");
      return { studentId: report.student_id };
    }, actor.schoolId);
  }

  @Post("reports/:reportId/deliveries")
  async queue(
    @Req() request: FastifyRequest,
    @Param("reportId") reportId: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = deliveryRequestSchema.parse(body ?? {});

    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER")
        await assertReportAccess(client, actor, reportId);
      const version = (
        await client.query<{ id: string; student_id: string }>(
          `SELECT rv.id, r.student_id
         FROM report_versions rv
         JOIN reports r ON r.id = rv.report_id
         WHERE rv.report_id = $1 AND rv.school_id = $2 AND r.school_id = $2
         ORDER BY rv.version_number DESC
         LIMIT 1`,
          [reportId, actor.schoolId],
        )
      ).rows[0];

      if (!version) throw new Error("Raport terbit tidak ditemukan");

      const guardians = await client.query<{ id: string; phone: string }>(
        `SELECT id, phone
         FROM guardian_contacts
         WHERE student_id = $1 AND school_id = $2 AND is_active AND is_delivery_recipient
           AND ($3::uuid[] IS NULL OR id = ANY($3::uuid[]))
         ORDER BY is_primary DESC, name`,
        [version.student_id, actor.schoolId, input.guardianContactIds ?? null],
      );

      if (!guardians.rowCount) {
        throw new Error("Kontak wali penerima tidak ditemukan");
      }
      if (
        input.guardianContactIds &&
        guardians.rowCount !== input.guardianContactIds.length
      ) {
        throw new Error(
          "Satu atau lebih kontak wali tidak terkait dengan siswa pada raport ini",
        );
      }

      const queued = [];
      for (const guardian of guardians.rows) {
        const delivery = (
          await client.query(
            `INSERT INTO report_deliveries
             (school_id, report_version_id, guardian_contact_id, recipient_phone, status, queued_at)
           VALUES ($1, $2, $3, $4, 'QUEUED', now())
           ON CONFLICT (report_version_id, guardian_contact_id) DO UPDATE
             SET recipient_phone = EXCLUDED.recipient_phone,
                 status = CASE WHEN report_deliveries.status = 'FAILED' THEN 'QUEUED'::report_delivery_status ELSE report_deliveries.status END,
                 failure_reason = CASE WHEN report_deliveries.status = 'FAILED' THEN NULL ELSE report_deliveries.failure_reason END,
                 queued_at = CASE WHEN report_deliveries.status = 'FAILED' THEN now() ELSE report_deliveries.queued_at END,
                 updated_at = now()
           RETURNING *`,
            [actor.schoolId, version.id, guardian.id, guardian.phone],
          )
        ).rows[0];
        queued.push(delivery);
      }

      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report_delivery.queued",
          entityType: "report_version",
          entityId: version.id,
          metadata: {
            deliveryCount: queued.length,
            guardianContactIds: guardians.rows.map((guardian) => guardian.id),
          },
        },
        client,
      );

      return queued;
    }, actor.schoolId);
  }

  @Post("deliveries/:deliveryId/retry")
  async retry(
    @Req() request: FastifyRequest,
    @Param("deliveryId") deliveryId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER") {
        const report = (
          await client.query<{ report_id: string }>(
            `SELECT version.report_id FROM report_deliveries delivery JOIN report_versions version ON version.id=delivery.report_version_id WHERE delivery.id=$1 AND delivery.school_id=$2`,
            [deliveryId, actor.schoolId],
          )
        ).rows[0];
        if (!report) throw new Error("Pengiriman gagal tidak ditemukan");
        await assertReportAccess(client, actor, report.report_id);
      }
      const delivery = (
        await client.query<{ id: string; report_version_id: string }>(
          `UPDATE report_deliveries
         SET status = 'QUEUED', failure_reason = NULL, queued_at = now(), updated_at = now()
         WHERE id = $1 AND school_id = $2 AND status = 'FAILED'
         RETURNING id, report_version_id`,
          [deliveryId, actor.schoolId],
        )
      ).rows[0];

      if (!delivery) throw new Error("Pengiriman gagal tidak ditemukan");
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report_delivery.retry_queued",
          entityType: "report_delivery",
          entityId: delivery.id,
          metadata: { reportVersionId: delivery.report_version_id },
        },
        client,
      );
      return delivery;
    }, actor.schoolId);
  }

  @Post("deliveries/:deliveryId/regenerate-access")
  async regenerateAccess(
    @Req() request: FastifyRequest,
    @Param("deliveryId") deliveryId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);

    return this.db.transaction(async (client) => {
      const delivery = (
        await client.query<{
          id: string;
          report_version_id: string;
          student_name: string;
          guardian_name: string;
          recipient_phone: string;
          school_name: string;
        }>(
          `SELECT delivery.id, delivery.report_version_id,
            student.name AS student_name, guardian.name AS guardian_name,
            delivery.recipient_phone, school.name AS school_name
          FROM report_deliveries delivery
          JOIN report_versions version ON version.id=delivery.report_version_id AND version.school_id=delivery.school_id
          JOIN reports report ON report.id=version.report_id AND report.school_id=delivery.school_id
          JOIN students student ON student.id=report.student_id AND student.school_id=delivery.school_id
          JOIN guardian_contacts guardian ON guardian.id=delivery.guardian_contact_id AND guardian.school_id=delivery.school_id
          JOIN schools school ON school.id=delivery.school_id
          WHERE delivery.id=$1 AND delivery.school_id=$2
          FOR UPDATE`,
          [deliveryId, actor.schoolId],
        )
      ).rows[0];

      if (!delivery) throw new Error("Pengiriman tidak ditemukan");

      const phone = whatsappPhone(delivery.recipient_phone);
      const token = randomBytes(32).toString("base64url");
      const pin = randomInt(0, 1_000_000).toString().padStart(6, "0");
      const origin = (
        process.env.FRONTEND_ORIGIN || "http://localhost:3001"
      ).replace(/\/$/, "");
      const reportLink = `${origin}/r/${token}`;

      await client.query(
        `UPDATE report_access
         SET status='REVOKED', revoked_at=now(), revoked_by=$3
         WHERE school_id=$1 AND report_version_id=$2 AND status IN ('ACTIVE','LOCKED')`,
        [actor.schoolId, delivery.report_version_id, actor.userId],
      );
      await client.query(
        `DELETE FROM parent_report_sessions
         WHERE report_version_id=$1`,
        [delivery.report_version_id],
      );
      const access = (
        await client.query<{ id: string }>(
          `INSERT INTO report_access(school_id,report_version_id,token_hash,pin_hash,status)
           VALUES($1,$2,$3,$4,'ACTIVE')
           RETURNING id`,
          [actor.schoolId, delivery.report_version_id, hash(token), hash(pin)],
        )
      ).rows[0];
      await client.query(
        `UPDATE report_deliveries
         SET report_access_id=$3, access_credentials_ciphertext=$4, whatsapp_opened_at=now(),
             attempt_count=attempt_count+1, updated_at=now()
         WHERE id=$1 AND school_id=$2`,
        [
          delivery.id,
          actor.schoolId,
          access.id,
          encryptParentAccessCredentials({ token, pin }),
        ],
      );
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report_access.regenerated",
          entityType: "report_version",
          entityId: delivery.report_version_id,
          metadata: { deliveryId: delivery.id },
        },
        client,
      );

      const message = [
        `Assalamu'alaikum Bapak/Ibu ${delivery.guardian_name},`,
        `Raport perkembangan ${delivery.student_name} dari ${delivery.school_name} telah tersedia.`,
        "",
        `Tautan raport: ${reportLink}`,
        `PIN: ${pin}`,
        "",
        "Tautan sebelumnya sudah tidak berlaku. Silakan simpan tautan ini untuk membuka raport kembali kapan saja.",
      ].join("\n");

      return {
        whatsAppUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      };
    }, actor.schoolId);
  }

  @Post("deliveries/:deliveryId/open-whatsapp")
  async openWhatsApp(
    @Req() request: FastifyRequest,
    @Param("deliveryId") deliveryId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);

    return this.db.transaction(async (client) => {
      const delivery = (
        await client.query<{
          id: string;
          status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
          report_id: string;
          report_version_id: string;
          report_access_id: string | null;
          access_credentials_ciphertext: string | null;
          student_name: string;
          guardian_name: string;
          recipient_phone: string;
          school_name: string;
        }>(
          `SELECT delivery.id, delivery.status, delivery.report_version_id,
          delivery.report_access_id, delivery.access_credentials_ciphertext,
          report.id AS report_id, student.name AS student_name,
          guardian.name AS guardian_name, delivery.recipient_phone,
          school.name AS school_name
        FROM report_deliveries delivery
        JOIN report_versions version ON version.id=delivery.report_version_id AND version.school_id=delivery.school_id
        JOIN reports report ON report.id=version.report_id AND report.school_id=delivery.school_id
        JOIN students student ON student.id=report.student_id AND student.school_id=delivery.school_id
        JOIN guardian_contacts guardian ON guardian.id=delivery.guardian_contact_id AND guardian.school_id=delivery.school_id
        JOIN schools school ON school.id=delivery.school_id
        WHERE delivery.id=$1 AND delivery.school_id=$2
        FOR UPDATE`,
          [deliveryId, actor.schoolId],
        )
      ).rows[0];

      if (!delivery) throw new Error("Pengiriman tidak ditemukan");
      if (actor.role === "TEACHER")
        await assertReportAccess(client, actor, delivery.report_id);
      const phone = whatsappPhone(delivery.recipient_phone);
      let token: string;
      let pin: string;
      let reusedAccess = false;

      if (delivery.report_access_id && delivery.access_credentials_ciphertext) {
        const access = (
          await client.query<{ id: string }>(
            `SELECT id FROM report_access
             WHERE id=$1 AND school_id=$2 AND report_version_id=$3 AND status='ACTIVE'`,
            [
              delivery.report_access_id,
              actor.schoolId,
              delivery.report_version_id,
            ],
          )
        ).rows[0];
        if (!access) {
          throw new Error(
            "Tautan wali sudah tidak berlaku. Admin Sekolah dapat membuat tautan baru.",
          );
        }

        ({ token, pin } = decryptParentAccessCredentials(
          delivery.access_credentials_ciphertext,
        ));
        reusedAccess = true;
      } else {
        token = randomBytes(32).toString("base64url");
        pin = randomInt(0, 1_000_000).toString().padStart(6, "0");
      }
      const origin = (
        process.env.FRONTEND_ORIGIN || "http://localhost:3001"
      ).replace(/\/$/, "");
      const reportLink = `${origin}/r/${token}`;

      if (!reusedAccess) {
        const access = (
          await client.query<{ id: string }>(
            `INSERT INTO report_access(school_id,report_version_id,token_hash,pin_hash,status)
             VALUES($1,$2,$3,$4,'ACTIVE')
             RETURNING id`,
            [actor.schoolId, delivery.report_version_id, hash(token), hash(pin)],
          )
        ).rows[0];
        await client.query(
          `UPDATE report_deliveries
           SET report_access_id=$3, access_credentials_ciphertext=$4
           WHERE id=$1 AND school_id=$2`,
          [
            delivery.id,
            actor.schoolId,
            access.id,
            encryptParentAccessCredentials({ token, pin }),
          ],
        );
      }
      await client.query(
        `UPDATE report_deliveries
         SET whatsapp_opened_at=now(), attempt_count=attempt_count+1, updated_at=now()
         WHERE id=$1 AND school_id=$2`,
        [delivery.id, actor.schoolId],
      );
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report_delivery.whatsapp_opened",
          entityType: "report_delivery",
          entityId: delivery.id,
          metadata: {
            reportVersionId: delivery.report_version_id,
            reusedAccess,
          },
        },
        client,
      );

      const message = [
        `Assalamu'alaikum Bapak/Ibu ${delivery.guardian_name},`,
        `Raport perkembangan ${delivery.student_name} dari ${delivery.school_name} telah tersedia.`,
        "",
        `Tautan raport: ${reportLink}`,
        `PIN: ${pin}`,
        "",
        "Silakan simpan tautan ini untuk membuka raport kembali kapan saja.",
      ].join("\n");

      return {
        whatsAppUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      };
    }, actor.schoolId);
  }
}
