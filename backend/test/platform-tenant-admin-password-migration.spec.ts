import { readFile } from "fs/promises";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("platform tenant admin password migration", () => {
  it("limits password recovery to the selected tenant School Admin", async () => {
    const sql = await readFile(
      resolve(
        __dirname,
        "../src/database/migrations/046_platform_tenant_admin_password.sql",
      ),
      "utf8",
    );

    expect(sql).toContain("membership.school_id = p_school_id");
    expect(sql).toContain("membership.user_id = p_admin_user_id");
    expect(sql).toContain("membership.role = 'SCHOOL_ADMIN'");
    expect(sql).toContain("platform.tenant_admin_password_reset");
    expect(sql).toContain("UPDATE public.sessions");
    expect(sql).toContain("must_change_password = true");
  });
});
