import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("tenant-scoped relations migration", () => {
  it("enforces same-school relationships for critical student and report data", async () => {
    const migration = (
      await readFile(
        resolve(
          process.cwd(),
          "src/database/migrations/039_enforce_tenant_scoped_relations.sql",
        ),
        "utf8",
      )
    ).replace(/\r\n/g, "\n");

    for (const table of [
      "students",
      "academic_years",
      "semesters",
      "class_periods",
      "student_enrollments",
      "reports",
      "report_versions",
      "report_access",
      "guardian_contacts",
      "lifecycle_operations",
    ]) {
      expect(migration).toContain(
        `ALTER TABLE ${table}\n  ADD CONSTRAINT ${table}_school_id_id_unique UNIQUE (school_id, id)`,
      );
    }

    for (const relation of [
      "guardian_contacts_student_same_school_fkey",
      "enrollments_student_same_school_fkey",
      "enrollments_class_period_same_school_fkey",
      "student_assessments_student_same_school_fkey",
      "reports_student_same_school_fkey",
      "reports_enrollment_same_school_fkey",
      "report_versions_report_same_school_fkey",
      "report_deliveries_guardian_same_school_fkey",
      "lifecycle_events_operation_same_school_fkey",
    ]) {
      expect(migration).toContain(relation);
    }

    expect(migration).toContain("FOREIGN KEY (school_id, student_id)");
    expect(migration).toContain("REFERENCES students (school_id, id)");
    expect(migration).toContain("FOREIGN KEY (school_id, report_version_id)");
    expect(migration).toContain("REFERENCES report_versions (school_id, id)");
  });
});
