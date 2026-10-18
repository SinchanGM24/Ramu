import { Controller, Get, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthService, type AuthContext } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

type DashboardStat = {
  id: string;
  label: string;
  value: number;
  description: string;
  href: string;
};

type QueryClient = {
  query: <T>(query: string, values?: unknown[]) => Promise<{ rows: T[] }>;
};

@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
  ) {}

  @Get("summary")
  async summary(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request, [
      "SCHOOL_ADMIN",
      "TEACHER",
      "PRINCIPAL",
    ]);
    return this.db.transaction(async (client) => {
      const context = (
        await client.query<{
          school_name: string;
          academic_year_name: string | null;
          semester_name: string | null;
        }>(
          `SELECT school.name AS school_name,year.name AS academic_year_name,semester.name AS semester_name
					FROM schools school
					LEFT JOIN academic_years year ON year.school_id=school.id AND year.is_active
					LEFT JOIN LATERAL (
						SELECT name FROM semesters
						WHERE academic_year_id=year.id AND is_active
						LIMIT 1
					) semester ON true
					WHERE school.id=$1`,
          [actor.schoolId],
        )
      ).rows[0];

      const stats = await this.statsForRole(client, actor);
      return {
        role: actor.role,
        schoolName: context?.school_name ?? "Sekolah",
        academicYearName: context?.academic_year_name,
        semesterName: context?.semester_name,
        stats,
      };
    }, actor.schoolId);
  }

  private async statsForRole(
    client: QueryClient,
    actor: AuthContext,
  ): Promise<DashboardStat[]> {
    if (actor.role === "TEACHER") return this.teacherStats(client, actor);
    if (actor.role === "PRINCIPAL") return this.principalStats(client, actor);
    return this.adminStats(client, actor);
  }

  private async teacherStats(
    client: QueryClient,
    actor: AuthContext,
  ): Promise<DashboardStat[]> {
    const row = (
      await client.query<{
        active_students: number;
        reports_not_created: number;
        reports_created: number;
        revisions: number;
      }>(
        `WITH active_semester AS (
					SELECT semester.id
					FROM semesters semester
					JOIN academic_years year ON year.id=semester.academic_year_id AND year.school_id=semester.school_id
					WHERE year.school_id=$1 AND year.is_active AND semester.is_active
					LIMIT 1
				), students_in_scope AS (
					SELECT DISTINCT enrollment.student_id
					FROM student_enrollments enrollment
					JOIN students student ON student.id=enrollment.student_id AND student.school_id=enrollment.school_id
					JOIN academic_years year ON year.id=enrollment.academic_year_id AND year.school_id=enrollment.school_id AND year.is_active
					JOIN teacher_class_assignments assignment ON assignment.class_period_id=enrollment.class_period_id AND assignment.school_id=enrollment.school_id AND assignment.ended_at IS NULL
					WHERE enrollment.school_id=$1 AND assignment.teacher_user_id=$2 AND student.lifecycle_status='ACTIVE'
						AND enrollment.effective_start_on<=CURRENT_DATE AND (enrollment.effective_end_on IS NULL OR enrollment.effective_end_on>CURRENT_DATE)
				)
				SELECT count(DISTINCT scope.student_id)::int AS active_students,
					count(DISTINCT scope.student_id) FILTER (WHERE report.id IS NULL)::int AS reports_not_created,
					count(DISTINCT report.id)::int AS reports_created,
					count(DISTINCT report.id) FILTER (WHERE report.status='REVISION_REQUIRED')::int AS revisions
				FROM students_in_scope scope
				LEFT JOIN reports report ON report.student_id=scope.student_id AND report.school_id=$1
					AND report.semester_id=(SELECT id FROM active_semester)`,
        [actor.schoolId, actor.userId],
      )
    ).rows[0];

    return [
      {
        id: "students",
        label: "Murid aktif",
        value: Number(row?.active_students ?? 0),
        description: "Pada kelas penugasan Anda",
        href: "/app/academic/students",
      },
      {
        id: "missing-reports",
        label: "Raport belum dibuat",
        value: Number(row?.reports_not_created ?? 0),
        description: "Untuk semester aktif",
        href: "/app/reports/progress",
      },
      {
        id: "reports",
        label: "Raport sudah dibuat",
        value: Number(row?.reports_created ?? 0),
        description: "Untuk semester aktif",
        href: "/app/reports/progress",
      },
      {
        id: "revisions",
        label: "Perlu revisi",
        value: Number(row?.revisions ?? 0),
        description: "Raport yang dikembalikan",
        href: "/app/reports/progress",
      },
    ];
  }

  private async principalStats(
    client: QueryClient,
    actor: AuthContext,
  ): Promise<DashboardStat[]> {
    const row = (
      await client.query<{
        reports_to_review: number;
        transfer_requests: number;
        graduation_requests: number;
      }>(
        `SELECT
					(SELECT count(*)::int FROM reports WHERE school_id=$1 AND status IN ('SUBMITTED','IN_REVIEW')) AS reports_to_review,
					(SELECT count(*)::int FROM lifecycle_requests WHERE school_id=$1 AND status='PENDING' AND request_type IN ('TRANSFER','CONTINUATION')) AS transfer_requests,
					(SELECT count(*)::int FROM lifecycle_requests WHERE school_id=$1 AND status='PENDING' AND request_type='GRADUATION') AS graduation_requests`,
        [actor.schoolId],
      )
    ).rows[0];

    return [
      {
        id: "reports-to-review",
        label: "Raport perlu ditinjau",
        value: Number(row?.reports_to_review ?? 0),
        description: "Menunggu keputusan Anda",
        href: "/app/reports/review",
      },
      {
        id: "transfer-requests",
        label: "Pengajuan perpindahan",
        value: Number(row?.transfer_requests ?? 0),
        description: "Menunggu persetujuan",
        href: "/app/academic/lifecycle",
      },
      {
        id: "graduation-requests",
        label: "Pengajuan kelulusan",
        value: Number(row?.graduation_requests ?? 0),
        description: "Menunggu persetujuan",
        href: "/app/academic/lifecycle",
      },
    ];
  }

  private async adminStats(
    client: QueryClient,
    actor: AuthContext,
  ): Promise<DashboardStat[]> {
    const row = (
      await client.query<{
        active_students: number;
        active_reports: number;
        active_classes: number;
      }>(
        `SELECT
					(SELECT count(*)::int FROM students WHERE school_id=$1 AND lifecycle_status='ACTIVE') AS active_students,
					(SELECT count(*)::int FROM reports report JOIN semesters semester ON semester.id=report.semester_id JOIN academic_years year ON year.id=semester.academic_year_id WHERE report.school_id=$1 AND year.is_active AND report.status<>'PUBLISHED') AS active_reports,
					(SELECT count(DISTINCT period.class_group_id)::int FROM class_periods period JOIN class_groups grouping ON grouping.id=period.class_group_id AND grouping.school_id=period.school_id JOIN academic_years year ON year.id=period.academic_year_id AND year.school_id=period.school_id WHERE period.school_id=$1 AND year.is_active AND grouping.is_active) AS active_classes`,
        [actor.schoolId],
      )
    ).rows[0];

    return [
      {
        id: "students",
        label: "Murid aktif",
        value: Number(row?.active_students ?? 0),
        description: "Belum masuk Arsip",
        href: "/app/academic/students",
      },
      {
        id: "active-reports",
        label: "Raport berjalan",
        value: Number(row?.active_reports ?? 0),
        description: "Belum diterbitkan",
        href: "/app/reports/progress",
      },
      {
        id: "active-classes",
        label: "Kelas aktif",
        value: Number(row?.active_classes ?? 0),
        description: "Pada tahun ajaran aktif",
        href: "/app/academic",
      },
    ];
  }
}
