import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("report publication locks migration", () => {
  it("adds a transient, tenant-selective publication lock", async () => {
    const migration = await readFile(
      resolve(process.cwd(), "src/database/migrations/044_report_publication_locks.sql"),
      "utf8",
    );

    expect(migration).toContain("publication_lock_token uuid");
    expect(migration).toContain("publication_locked_at timestamptz");
    expect(migration).toContain("idx_reports_publication_lock");
    expect(migration).toContain("WHERE publication_lock_token IS NOT NULL");
  });
});
