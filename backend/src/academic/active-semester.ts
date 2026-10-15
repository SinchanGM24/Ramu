import { ForbiddenException } from "@nestjs/common";
import type { PoolClient } from "pg";
import type { AuthContext } from "../auth/auth.service";

/** Ensures teachers work only in the academic context selected by School Admin. */
export async function assertTeacherActiveSemester(
  client: Pick<PoolClient, "query">,
  actor: AuthContext,
  semesterId: string,
) {
  if (actor.role !== "TEACHER") return;

  const activeSemester = await client.query(
    `SELECT 1
     FROM semesters semester
     JOIN academic_years year
       ON year.id=semester.academic_year_id
       AND year.school_id=semester.school_id
     WHERE semester.id=$1
       AND semester.school_id=$2
       AND semester.is_active
       AND year.is_active`,
    [semesterId, actor.schoolId],
  );

  if (!activeSemester.rowCount) {
    throw new ForbiddenException(
      "Semester ini tidak aktif. Gunakan semester yang dipilih Admin Sekolah.",
    );
  }
}
