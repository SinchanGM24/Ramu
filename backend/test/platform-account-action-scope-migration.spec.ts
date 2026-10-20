import { readFile } from "fs/promises";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("platform account action scope migration", () => {
  it("keeps teacher and principal accounts read-only from the platform", async () => {
    const sql = await readFile(
      resolve(
        __dirname,
        "../src/database/migrations/047_platform_account_action_scope.sql",
      ),
      "utf8",
    );

    expect(sql).toContain("membership.role = 'SCHOOL_ADMIN'");
    expect(sql).toContain("platform_assert_school_admin_target");
    expect(sql).toContain(
      "Hanya akun Admin Sekolah yang dapat diubah dari panel platform",
    );
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.platform_set_account_status",
    );
  });
});
