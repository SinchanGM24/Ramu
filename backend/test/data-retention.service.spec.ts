import { describe, expect, it } from "vitest";
import {
  DataRetentionService,
  getRetentionSettings,
} from "../src/common/data-retention.service";

describe("data retention settings", () => {
  it("uses safe defaults and keeps audit retention disabled until configured", () => {
    expect(getRetentionSettings({})).toEqual({
      sessionRetentionDays: 30,
      auditRetentionDays: null,
      cleanupIntervalMinutes: 60,
    });
  });

  it("rejects unsafe cleanup intervals and audit retention periods", () => {
    expect(() =>
      getRetentionSettings({ RETENTION_CLEANUP_INTERVAL_MINUTES: "10" }),
    ).toThrow("minimal 15 menit");
    expect(() => getRetentionSettings({ AUDIT_RETENTION_DAYS: "7" })).toThrow(
      "minimal 30 hari",
    );
  });
});

describe("DataRetentionService", () => {
  it("purges expired sessions and invokes audit pruning only when configured", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const service = new DataRetentionService({
      query: async (sql: string, values: unknown[] = []) => {
        queries.push({ sql, values });
        if (sql.includes("pg_total_relation_size"))
          return {
            rowCount: 1,
            rows: [
              {
                sessions_bytes: "1",
                parent_sessions_bytes: "2",
                audit_logs_bytes: "3",
              },
            ],
          };
        return { rowCount: 2, rows: [] };
      },
    } as never);

    await service.runCleanup();

    expect(queries[0]?.sql).toContain("DELETE FROM sessions");
    expect(queries[1]?.sql).toContain("DELETE FROM parent_report_sessions");
    expect(
      queries.some((query) => query.sql.includes("prune_expired_audit_logs")),
    ).toBe(false);
  });
});
