import { describe, expect, it } from "vitest";
import { assertSafeRuntimeDatabaseRole } from "../src/database/database.service";

describe("runtime database role security", () => {
  it("accepts a normal application role", () => {
    expect(() =>
      assertSafeRuntimeDatabaseRole({
        roleName: "ramu_app",
        isSuperuser: false,
        bypassesRls: false,
      }),
    ).not.toThrow();
  });

  it("rejects a superuser runtime role", () => {
    expect(() =>
      assertSafeRuntimeDatabaseRole({
        roleName: "postgres",
        isSuperuser: true,
        bypassesRls: false,
      }),
    ).toThrow("SUPERUSER");
  });

  it("rejects a role that can bypass row-level security", () => {
    expect(() =>
      assertSafeRuntimeDatabaseRole({
        roleName: "unsafe_api",
        isSuperuser: false,
        bypassesRls: true,
      }),
    ).toThrow("BYPASSRLS");
  });
});
