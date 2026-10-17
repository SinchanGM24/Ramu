import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Pool, type PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: resolve(process.cwd(), ".env") });

const runIntegration = process.env.DATABASE_TENANT_INTEGRATION_TEST === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

type TenantFixture = {
  classGroupId: string;
  deliveryId: string;
  guardianId: string;
  lifecycleEventId: string;
  reportId: string;
  reportVersionId: string;
  schoolId: string;
  studentId: string;
};

async function insertTenantFixture(
  client: PoolClient,
  input: { suffix: string; label: string },
): Promise<TenantFixture> {
  const school = await client.query<{ id: string }>(
    `INSERT INTO schools(name, slug)
     VALUES($1, $2)
     RETURNING id`,
    [`Sekolah Isolasi ${input.label}`, `rls-${input.label}-${input.suffix}`],
  );
  const schoolId = school.rows[0]?.id;
  if (!schoolId) throw new Error("Sekolah fixture tidak dapat dibuat.");

  const user = await client.query<{ id: string }>(
    `INSERT INTO users(name, email, password_hash)
     VALUES($1, $2, $3)
     RETURNING id`,
    [
      `Admin Isolasi ${input.label}`,
      `rls-${input.label}-${input.suffix}@example.test`,
      "not-a-real-password-hash",
    ],
  );
  const userId = user.rows[0]?.id;
  if (!userId) throw new Error("Pengguna fixture tidak dapat dibuat.");

  const academicYear = await client.query<{ id: string }>(
    `INSERT INTO academic_years(school_id, name, starts_on, ends_on)
     VALUES($1, '2090', '2090-07-01', '2091-06-30')
     RETURNING id`,
    [schoolId],
  );
  const academicYearId = academicYear.rows[0]?.id;
  if (!academicYearId)
    throw new Error("Tahun ajaran fixture tidak dapat dibuat.");

  const semester = await client.query<{ id: string }>(
    `INSERT INTO semesters(school_id, academic_year_id, name, starts_on, ends_on)
     VALUES($1, $2, 'Semester I', '2090-07-01', '2090-12-31')
     RETURNING id`,
    [schoolId, academicYearId],
  );
  const semesterId = semester.rows[0]?.id;
  if (!semesterId) throw new Error("Semester fixture tidak dapat dibuat.");

  const classGroup = await client.query<{ id: string }>(
    `INSERT INTO class_groups(school_id, name)
     VALUES($1, $2)
     RETURNING id`,
    [schoolId, `Kelas Isolasi ${input.label}`],
  );
  const classGroupId = classGroup.rows[0]?.id;
  if (!classGroupId) throw new Error("Kelas fixture tidak dapat dibuat.");

  const classPeriod = await client.query<{ id: string }>(
    `INSERT INTO class_periods(school_id, class_group_id, academic_year_id)
     VALUES($1, $2, $3)
     RETURNING id`,
    [schoolId, classGroupId, academicYearId],
  );
  const classPeriodId = classPeriod.rows[0]?.id;
  if (!classPeriodId)
    throw new Error("Periode kelas fixture tidak dapat dibuat.");

  const student = await client.query<{ id: string }>(
    `INSERT INTO students(school_id, name)
     VALUES($1, $2)
     RETURNING id`,
    [schoolId, `Murid Isolasi ${input.label}`],
  );
  const studentId = student.rows[0]?.id;
  if (!studentId) throw new Error("Murid fixture tidak dapat dibuat.");

  const enrollment = await client.query<{ id: string }>(
    `INSERT INTO student_enrollments(
       school_id, student_id, academic_year_id, class_period_id, status, effective_start_on
     ) VALUES($1, $2, $3, $4, 'ACTIVE', '2090-07-01')
     RETURNING id`,
    [schoolId, studentId, academicYearId, classPeriodId],
  );
  const enrollmentId = enrollment.rows[0]?.id;
  if (!enrollmentId) throw new Error("Penempatan fixture tidak dapat dibuat.");

  const guardian = await client.query<{ id: string }>(
    `INSERT INTO guardian_contacts(
       school_id, student_id, name, relationship, phone, is_delivery_recipient
     ) VALUES($1, $2, $3, 'Orang Tua', '081234567890', true)
     RETURNING id`,
    [schoolId, studentId, `Wali Isolasi ${input.label}`],
  );
  const guardianId = guardian.rows[0]?.id;
  if (!guardianId) throw new Error("Wali fixture tidak dapat dibuat.");

  const report = await client.query<{ id: string }>(
    `INSERT INTO reports(school_id, student_id, semester_id, student_enrollment_id, status)
     VALUES($1, $2, $3, $4, 'PUBLISHED')
     RETURNING id`,
    [schoolId, studentId, semesterId, enrollmentId],
  );
  const reportId = report.rows[0]?.id;
  if (!reportId) throw new Error("Raport fixture tidak dapat dibuat.");

  const reportVersion = await client.query<{ id: string }>(
    `INSERT INTO report_versions(
       school_id, report_id, version_number, snapshot, pdf_storage_key, published_by
     ) VALUES($1, $2, 1, '{}'::jsonb, $3, $4)
     RETURNING id`,
    [schoolId, reportId, `fixtures/${input.label}.pdf`, userId],
  );
  const reportVersionId = reportVersion.rows[0]?.id;
  if (!reportVersionId)
    throw new Error("Versi raport fixture tidak dapat dibuat.");

  const delivery = await client.query<{ id: string }>(
    `INSERT INTO report_deliveries(
       school_id, report_version_id, guardian_contact_id, recipient_phone
     ) VALUES($1, $2, $3, '081234567890')
     RETURNING id`,
    [schoolId, reportVersionId, guardianId],
  );
  const deliveryId = delivery.rows[0]?.id;
  if (!deliveryId) throw new Error("Pengiriman fixture tidak dapat dibuat.");

  const operation = await client.query<{ id: string }>(
    `INSERT INTO lifecycle_operations(school_id, operation_type, actor_user_id)
     VALUES($1, 'TRANSFER', $2)
     RETURNING id`,
    [schoolId, userId],
  );
  const operationId = operation.rows[0]?.id;
  if (!operationId)
    throw new Error("Operasi lifecycle fixture tidak dapat dibuat.");

  const lifecycleEvent = await client.query<{ id: string }>(
    `INSERT INTO student_lifecycle_events(
       school_id, student_id, operation_id, action, effective_on
     ) VALUES($1, $2, $3, 'TRANSFERRED', '2090-12-31')
     RETURNING id`,
    [schoolId, studentId, operationId],
  );
  const lifecycleEventId = lifecycleEvent.rows[0]?.id;
  if (!lifecycleEventId)
    throw new Error("Event lifecycle fixture tidak dapat dibuat.");

  return {
    classGroupId,
    deliveryId,
    guardianId,
    lifecycleEventId,
    reportId,
    reportVersionId,
    schoolId,
    studentId,
  };
}

describeIntegration("tenant RLS isolation", () => {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL,
  });
  let client: PoolClient;

  beforeAll(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
  });

  afterAll(async () => {
    if (client) {
      await client.query("ROLLBACK");
      client.release();
    }
    await pool.end();
  });

  it("shows only one tenant's student, class, report, delivery, and lifecycle rows to ramu_app", async () => {
    const suffix = randomUUID();
    const first = await insertTenantFixture(client, {
      suffix,
      label: "satu",
    });
    const second = await insertTenantFixture(client, {
      suffix,
      label: "dua",
    });

    await client.query("SET ROLE ramu_app");
    try {
      await client.query("SELECT set_config('app.school_id', $1, true)", [
        first.schoolId,
      ]);

      const rows = await client.query<{
        class_group_id: string;
        delivery_id: string;
        guardian_id: string;
        lifecycle_event_id: string;
        report_id: string;
        report_version_id: string;
        student_id: string;
      }>(
        `SELECT
           (SELECT id FROM students WHERE id=$1) AS student_id,
           (SELECT id FROM class_groups WHERE id=$2) AS class_group_id,
           (SELECT id FROM guardian_contacts WHERE id=$3) AS guardian_id,
           (SELECT id FROM reports WHERE id=$4) AS report_id,
           (SELECT id FROM report_versions WHERE id=$5) AS report_version_id,
           (SELECT id FROM report_deliveries WHERE id=$6) AS delivery_id,
           (SELECT id FROM student_lifecycle_events WHERE id=$7) AS lifecycle_event_id`,
        [
          first.studentId,
          first.classGroupId,
          first.guardianId,
          first.reportId,
          first.reportVersionId,
          first.deliveryId,
          first.lifecycleEventId,
        ],
      );

      expect(rows.rows[0]).toEqual({
        class_group_id: first.classGroupId,
        delivery_id: first.deliveryId,
        guardian_id: first.guardianId,
        lifecycle_event_id: first.lifecycleEventId,
        report_id: first.reportId,
        report_version_id: first.reportVersionId,
        student_id: first.studentId,
      });

      const hidden = await client.query(
        `SELECT 1
         FROM students student
         JOIN class_groups class_group ON class_group.id=$2
         JOIN guardian_contacts guardian ON guardian.id=$3
         JOIN reports report ON report.id=$4
         JOIN report_versions report_version ON report_version.id=$5
         JOIN report_deliveries delivery ON delivery.id=$6
         JOIN student_lifecycle_events lifecycle_event ON lifecycle_event.id=$7
         WHERE student.id=$1`,
        [
          second.studentId,
          second.classGroupId,
          second.guardianId,
          second.reportId,
          second.reportVersionId,
          second.deliveryId,
          second.lifecycleEventId,
        ],
      );

      expect(hidden.rowCount).toBe(0);
    } finally {
      await client.query("RESET ROLE");
    }
  });
});
