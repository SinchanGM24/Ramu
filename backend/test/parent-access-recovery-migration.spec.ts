import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("parent access recovery migration", () => {
  it("defines revocable access and a time-limited PIN lock", async () => {
    const migration = await readFile(
      resolve(
        process.cwd(),
        "src/database/migrations/034_parent_access_recovery.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("'ACTIVE', 'LOCKED', 'REVOKED'");
    expect(migration).toContain("now() + interval '15 minutes'");
    expect(migration).toContain("failed_attempts + 1 >= 5");
    expect(migration).toContain("status = 'REVOKED'");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION verify_parent_report");
  });
});
