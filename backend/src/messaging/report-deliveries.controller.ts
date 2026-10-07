import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

const deliveryRequestSchema = z.object({
  guardianContactIds: z.array(z.string().uuid()).min(1).max(20).optional(),
});

@Controller()
export class ReportDeliveriesController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  @Get("reports/:reportId/deliveries")
  async list(@Req() request: FastifyRequest, @Param("reportId") reportId: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "PRINCIPAL"]);
    return this.db.transaction(async (client) => {
      const result = await client.query(
        `SELECT d.id, d.channel, d.recipient_phone, d.status, d.attempt_count, d.failure_reason,
                d.queued_at, d.sent_at, d.delivered_at, d.read_at, d.failed_at, d.created_at,
                g.name AS guardian_name, g.relationship, rv.version_number
         FROM report_deliveries d
         JOIN report_versions rv ON rv.id = d.report_version_id
         JOIN guardian_contacts g ON g.id = d.guardian_contact_id
         WHERE rv.report_id = $1 AND d.school_id = $2
         ORDER BY d.created_at DESC`,
        [reportId, actor.schoolId],
      );
      return result.rows;
    }, actor.schoolId);
  }

  @Post("reports/:reportId/deliveries")
  async queue(
    @Req() request: FastifyRequest,
    @Param("reportId") reportId: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "PRINCIPAL"]);
    const input = deliveryRequestSchema.parse(body ?? {});

    return this.db.transaction(async (client) => {
      const version = (await client.query<{ id: string; student_id: string }>(
        `SELECT rv.id, r.student_id
         FROM report_versions rv
         JOIN reports r ON r.id = rv.report_id
         WHERE rv.report_id = $1 AND rv.school_id = $2
         ORDER BY rv.version_number DESC
         LIMIT 1`,
        [reportId, actor.schoolId],
      )).rows[0];

      if (!version) throw new Error("Rapor terbit tidak ditemukan");

      const guardians = await client.query<{ id: string; phone: string }>(
        `SELECT id, phone
         FROM guardian_contacts
         WHERE student_id = $1 AND school_id = $2
           AND ($3::uuid[] IS NULL OR id = ANY($3::uuid[]))
         ORDER BY is_primary DESC, name`,
        [version.student_id, actor.schoolId, input.guardianContactIds ?? null],
      );

      if (!guardians.rowCount) {
        throw new Error("Kontak wali penerima tidak ditemukan");
      }
      if (input.guardianContactIds && guardians.rowCount !== input.guardianContactIds.length) {
        throw new Error("Satu atau lebih kontak wali tidak terkait dengan siswa pada rapor ini");
      }

      const queued = [];
      for (const guardian of guardians.rows) {
        const delivery = (await client.query(
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
        )).rows[0];
        queued.push(delivery);
      }

      await this.audit.record({
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "report_delivery.queued",
        entityType: "report_version",
        entityId: version.id,
        metadata: { deliveryCount: queued.length, guardianContactIds: guardians.rows.map((guardian) => guardian.id) },
      }, client);

      return queued;
    }, actor.schoolId);
  }

  @Post("deliveries/:deliveryId/retry")
  async retry(@Req() request: FastifyRequest, @Param("deliveryId") deliveryId: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "PRINCIPAL"]);
    return this.db.transaction(async (client) => {
      const delivery = (await client.query<{ id: string; report_version_id: string }>(
        `UPDATE report_deliveries
         SET status = 'QUEUED', failure_reason = NULL, queued_at = now(), updated_at = now()
         WHERE id = $1 AND school_id = $2 AND status = 'FAILED'
         RETURNING id, report_version_id`,
        [deliveryId, actor.schoolId],
      )).rows[0];

      if (!delivery) throw new Error("Pengiriman gagal tidak ditemukan");
      await this.audit.record({
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "report_delivery.retry_queued",
        entityType: "report_delivery",
        entityId: delivery.id,
        metadata: { reportVersionId: delivery.report_version_id },
      }, client);
      return delivery;
    }, actor.schoolId);
  }
}
