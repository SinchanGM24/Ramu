import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("retention migration", () => {
  it("adds cleanup indexes and a restricted audit-pruning function", async () => {
    const migration = await readFile(
      resolve(
        process.cwd(), "src/database/migrations/040_retention_indexes_and_audit_pruning.sql"),
      "utf8",
    );

    expect(migration).toContain("idx_sessions_expired_cleanup");
    expect(migration).toContain("idx_parent_report_sessions_expired_cleanup");
    expect(migration).toContain("idx_audit_logs_created_at");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = pg_catalog");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.prune_expired_audit_logs(integer) FROM PUBLIC");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.prune_expired_audit_logs(integer) TO ramu_app");
  });
});
