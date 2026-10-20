import { readFile } from "fs/promises";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("platform self-password audit migration", () => {
  it("records only the authenticated platform administrator's own password change", async () => {
    const sql = await readFile(
      resolve(
        __dirname,
        "../src/database/migrations/048_platform_self_password_audit.sql",
      ),
      "utf8",
    );

    expect(sql).toContain("platform_assert_admin(p_actor_user_id)");
    expect(sql).toContain("'platform.password_changed'");
    expect(sql).toContain("'user', p_actor_user_id");
    expect(sql).toContain("ramu_runtime_permissions");
  });
});
