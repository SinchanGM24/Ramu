import { ForbiddenException } from "@nestjs/common";
import type { PoolClient } from "pg";
import type { AuthContext } from "../auth/auth.service";

/** Applies class-level authorization after the tenant transaction is established. */
export async function assertReportAccess(
  client: PoolClient,
  actor: AuthContext,
  reportId: string,
) {
  if (actor.role !== "TEACHER") return;
  const allowed = await client.query(
    `SELECT 1 FROM reports report
    JOIN student_enrollments linked_enrollment ON linked_enrollment.id=report.student_enrollment_id
    JOIN semesters semester ON semester.id=report.semester_id
    LEFT JOIN LATERAL (
      SELECT current_enrollment.class_period_id FROM student_enrollments current_enrollment
      WHERE current_enrollment.student_id=report.student_id AND current_enrollment.school_id=report.school_id
        AND current_enrollment.academic_year_id=semester.academic_year_id
        AND current_enrollment.effective_start_on <= CURRENT_DATE
        AND (current_enrollment.effective_end_on IS NULL OR current_enrollment.effective_end_on > CURRENT_DATE)
      ORDER BY current_enrollment.effective_start_on DESC LIMIT 1
    ) current_enrollment ON report.status IN ('DRAFT','REVISION_REQUIRED')
    JOIN teacher_class_assignments assignment ON assignment.class_period_id=COALESCE(current_enrollment.class_period_id,linked_enrollment.class_period_id) AND assignment.ended_at IS NULL
    WHERE report.id=$1 AND assignment.teacher_user_id=$2 AND report.school_id=$3 AND linked_enrollment.school_id=$3 AND assignment.school_id=$3`,
    [reportId, actor.userId, actor.schoolId],
  );
  if (!allowed.rowCount)
    throw new ForbiddenException("Anda bukan wali kelas untuk raport ini.");
}
