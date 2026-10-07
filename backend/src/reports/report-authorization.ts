import { ForbiddenException } from "@nestjs/common";
import type { PoolClient } from "pg";
import type { AuthContext } from "../auth/auth.service";

/** Applies class-level authorization after the tenant transaction is established. */
export async function assertReportAccess(client: PoolClient, actor: AuthContext, reportId: string) {
  if (actor.role !== "TEACHER") return;
  const allowed = await client.query(`SELECT 1 FROM reports report
    JOIN student_enrollments enrollment ON enrollment.id=report.student_enrollment_id
    JOIN teacher_class_assignments assignment ON assignment.class_period_id=enrollment.class_period_id AND assignment.ended_at IS NULL
    WHERE report.id=$1 AND assignment.teacher_user_id=$2`, [reportId, actor.userId]);
  if (!allowed.rowCount) throw new ForbiddenException("Anda bukan wali kelas untuk rapor ini.");
}
