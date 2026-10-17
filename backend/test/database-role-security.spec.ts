import { describe, expect, it } from "vitest";
import {
  assertSafeRuntimeDatabaseRole,
  getDatabaseRuntimeConfig,
} from "../src/database/database.service";

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

describe("database runtime configuration", () => {
  it("uses bounded defaults that protect the connection pool", () => {
    expect(getDatabaseRuntimeConfig({})).toMatchObject({
      maxConnections: 12,
      idleTimeoutMs: 30_000,
      connectionTimeoutMs: 5_000,
      statementTimeoutMs: 15_000,
      lockTimeoutMs: 3_000,
      slowTransactionMs: 1_000,
    });
  });

  it("clamps unsafe environment values instead of creating an unbounded pool", () => {
    expect(
      getDatabaseRuntimeConfig({
        DATABASE_POOL_MAX: "999",
        DATABASE_IDLE_TIMEOUT_MS: "not-a-number",
        DATABASE_LOCK_TIMEOUT_MS: "1",
      }),
    ).toMatchObject({
      maxConnections: 100,
      idleTimeoutMs: 30_000,
      lockTimeoutMs: 250,
    });
  });
});
