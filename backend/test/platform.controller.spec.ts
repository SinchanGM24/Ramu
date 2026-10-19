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
});
