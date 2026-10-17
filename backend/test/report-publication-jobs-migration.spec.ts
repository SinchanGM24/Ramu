import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("report publication jobs migration", () => {
  it("keeps batch jobs tenant-scoped and protects the global worker claim", async () => {
    const migration = await readFile(
      resolve(process.cwd(), "src/database/migrations/042_report_publication_jobs.sql"),
      "utf8",
    );

    expect(migration).toContain("CREATE TABLE report_publication_jobs");
    expect(migration).toContain("CREATE TABLE report_publication_job_items");
    expect(migration).toContain("ALTER TABLE report_publication_jobs ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("school_id = NULLIF(current_setting('app.school_id', true), '')::uuid");
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("REVOKE ALL ON FUNCTION claim_next_report_publication_job() FROM PUBLIC");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION claim_next_report_publication_job() TO ramu_app");
  });
});
