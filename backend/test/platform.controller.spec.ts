import { describe, expect, it, vi } from "vitest";
import type { AuthService } from "../src/auth/auth.service";
import type { DatabaseService } from "../src/database/database.service";
import { PlatformController } from "../src/platform/platform.controller";

describe("PlatformController query filters", () => {
  it("treats legacy empty filter values as no filter", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const controller = new PlatformController(
      { query } as unknown as DatabaseService,
      {
        requirePlatform: () => ({
          userId: "00000000-0000-4000-8000-000000000001",
        }),
      } as unknown as AuthService,
    );

    await controller.tenants({} as never, {
      page: "1",
      query: "",
      status: "",
    });
    await controller.accounts({} as never, {
      page: "1",
      query: "",
      status: "",
      role: "",
    });

    expect(query.mock.calls[0][1]).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "",
      "",
      15,
      0,
    ]);
    expect(query.mock.calls[1][1]).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "",
      "",
      null,
      "",
      15,
      0,
    ]);
  });

  it("resets only through the tenant-admin password function", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const hashPassword = vi.fn().mockResolvedValue("hashed-password");
    const controller = new PlatformController(
      { query } as unknown as DatabaseService,
      {
        requirePlatform: () => ({
          userId: "00000000-0000-4000-8000-000000000001",
        }),
        hashPassword,
      } as unknown as AuthService,
    );

    await controller.updateTenantAdminPassword(
      {} as never,
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
      {
        password: "sandi-baru-yang-aman",
        passwordConfirmation: "sandi-baru-yang-aman",
      },
    );

    expect(hashPassword).toHaveBeenCalledWith("sandi-baru-yang-aman");
    expect(query).toHaveBeenCalledWith(
      "SELECT platform_set_tenant_admin_password($1,$2,$3,$4)",
      [
        "00000000-0000-4000-8000-000000000001",
        "00000000-0000-4000-8000-000000000002",
        "00000000-0000-4000-8000-000000000003",
        "hashed-password",
      ],
    );
  });
});
