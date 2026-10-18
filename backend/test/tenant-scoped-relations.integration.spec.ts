import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: resolve(process.cwd(), ".env") });

const runIntegration = process.env.DATABASE_TENANT_INTEGRATION_TEST === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration("tenant-scoped relation constraints", () => {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL,
  });

  beforeAll(async () => {
    await pool.query("SELECT 1");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("rejects a guardian contact that joins a student from another school", async () => {
    const client = await pool.connect();
    const suffix = randomUUID();

    try {
      await client.query("BEGIN");
      const firstSchool = await client.query<{ id: string }>(
        "INSERT INTO schools (name, slug) VALUES ($1, $2) RETURNING id",
        ["Sekolah Pengujian Satu", `tenant-check-one-${suffix}`],
      );
      const secondSchool = await client.query<{ id: string }>(
        "INSERT INTO schools (name, slug) VALUES ($1, $2) RETURNING id",
        ["Sekolah Pengujian Dua", `tenant-check-two-${suffix}`],
      );
      const firstSchoolId = firstSchool.rows[0]?.id;
      const secondSchoolId = secondSchool.rows[0]?.id;
      if (!firstSchoolId || !secondSchoolId)
        throw new Error("Sekolah pengujian tidak dapat dibuat.");

      const student = await client.query<{ id: string }>(
        "INSERT INTO students (school_id, name) VALUES ($1, $2) RETURNING id",
        [secondSchoolId, "Murid Pengujian Tenant"],
      );
      const studentId = student.rows[0]?.id;
      if (!studentId) throw new Error("Murid pengujian tidak dapat dibuat.");

      await expect(
        client.query(
          "INSERT INTO guardian_contacts (school_id, student_id, name, relationship, phone) VALUES ($1, $2, $3, $4, $5)",
          [
            firstSchoolId,
            studentId,
            "Wali Pengujian Tenant",
            "Orang Tua",
            "081234567890",
          ],
        ),
      ).rejects.toMatchObject({ code: "23503" });
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
