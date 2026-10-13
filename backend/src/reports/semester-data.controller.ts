import { Body, Controller, Param, Put, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { assertReportAccess } from "./report-authorization";

const optionalMeasurement = z.preprocess(
	(value) => (value === "" || value === null || value === undefined ? undefined : value),
	z.coerce.number().min(0).optional(),
);

const schema = z.object({
	weightKg: optionalMeasurement,
	heightCm: optionalMeasurement,
	headCircumferenceCm: optionalMeasurement,
	sickDays: z.coerce.number().int().min(0),
	permissionDays: z.coerce.number().int().min(0),
	unexcusedDays: z.coerce.number().int().min(0),
});

@Controller("reports")
export class SemesterDataController {
	constructor(
		private auth: AuthService,
		private db: DatabaseService,
		private audit: AuditService,
	) {}

	@Put(":id/semester-data")
	async save(@Req() req: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
		const actor = this.auth.require(req, ["SCHOOL_ADMIN", "TEACHER"]);
		const input = schema.parse(body);

		return this.db.transaction(async (client) => {
			const report = (
				await client.query<{ student_id: string; semester_id: string; status: string }>(
					"SELECT student_id,semester_id,status FROM reports WHERE id=$1",
					[id],
				)
			).rows[0];
			if (!report) throw new Error("Rapor tidak ditemukan");

			await assertReportAccess(client, actor, id);
			if (report.status === "PUBLISHED") throw new Error("Rapor terbit tidak dapat diubah");

			await client.query(
				`INSERT INTO growth_records(school_id,student_id,semester_id,weight_kg,height_cm,head_circumference_cm)
				 VALUES($1,$2,$3,$4,$5,$6)
				 ON CONFLICT(student_id,semester_id) DO UPDATE SET
				 weight_kg=EXCLUDED.weight_kg,
				 height_cm=EXCLUDED.height_cm,
				 head_circumference_cm=EXCLUDED.head_circumference_cm`,
				[
					actor.schoolId,
					report.student_id,
					report.semester_id,
					input.weightKg ?? null,
					input.heightCm ?? null,
					input.headCircumferenceCm ?? null,
				],
			);
			const saved = (
				await client.query(
					`INSERT INTO attendance_summaries(school_id,student_id,semester_id,sick_days,permission_days,unexcused_days)
					 VALUES($1,$2,$3,$4,$5,$6)
					 ON CONFLICT(student_id,semester_id) DO UPDATE SET
					 sick_days=EXCLUDED.sick_days,
					 permission_days=EXCLUDED.permission_days,
					 unexcused_days=EXCLUDED.unexcused_days
					 RETURNING *`,
					[
						actor.schoolId,
						report.student_id,
						report.semester_id,
						input.sickDays,
						input.permissionDays,
						input.unexcusedDays,
					],
				)
			).rows[0];
			await this.audit.record(
				{
					schoolId: actor.schoolId,
					actorUserId: actor.userId,
					action: "report_semester_data.saved",
					entityType: "attendance_summary",
					entityId: saved.id,
				},
				client,
			);
			return saved;
		}, actor.schoolId);
	}
}
