import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";
import { DatabaseService } from "../src/database/database.service";

describe("DatabaseService transaction recovery", () => {
  it("rolls back and releases the connection when a statement times out", async () => {
    const timeout = Object.assign(
      new Error("canceling statement due to statement timeout"),
      { code: "57014" },
    );
    const query = vi.fn(async (sql: string) => {
      if (sql === "ROLLBACK") return { rows: [] };
      return { rows: [] };
    });
    const release = vi.fn();
    const client = { query, release } as unknown as PoolClient;
    const service = new DatabaseService();
    vi.spyOn(service.pool, "connect").mockResolvedValue(client);

    await expect(
      service.transaction(async () => {
        throw timeout;
      }, "school-a"),
    ).rejects.toBe(timeout);

    expect(query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "SELECT set_config('statement_timeout', $1, true)",
      "SELECT set_config('lock_timeout', $1, true)",
      "SELECT set_config('app.school_id', $1, true)",
      "ROLLBACK",
    ]);
    expect(release).toHaveBeenCalledOnce();

    await service.onModuleDestroy();
  });
});
