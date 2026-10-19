import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthController } from "../src/auth/auth.controller";
import { RequestRateLimiter } from "../src/common/request-rate-limiter";

describe("AuthController login", () => {
  it("limits repeated login attempts before another credential query runs", async () => {
    let queryCount = 0;
    const controller = new AuthController(
      {
        query: async () => {
          queryCount += 1;
          return { rows: [] };
        },
      } as never,
      { verifyPassword: async () => false } as never,
      {} as never,
      new RequestRateLimiter(),
    );
    const request = { ip: "203.0.113.4" } as never;
    const body = { email: "guru@contoh.test", password: "kata-sandi" };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(
        controller.login(body, {} as never, request),
      ).rejects.toThrow(UnauthorizedException);
    }
    await expect(
      controller.login(body, {} as never, request),
    ).rejects.toMatchObject({ status: 429 });
    expect(queryCount).toBe(10);
  });

  it("returns an unauthorized response for invalid credentials without creating a session", async () => {
    let createdSession = false;
    const db = {
      query: async () => ({
        rows: [
          {
            id: "user-a",
            password_hash: "stored-password-hash",
            is_active: true,
          },
        ],
      }),
    };
    const auth = {
      verifyPassword: async () => false,
      createSession: async () => {
        createdSession = true;
      },
    };
    const controller = new AuthController(
      db as never,
      auth as never,
      {} as never,
    );

    await expect(
      controller.login(
        { email: "guru.aisyah@ramu.test", password: "kata-sandi-salah" },
        {} as never,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(createdSession).toBe(false);
  });

  it("creates a session from the account's sole active school membership", async () => {
    const queries: string[] = [];
    const db = {
      query: async () => ({
        rows: [
          {
            id: "user-a",
            password_hash: "stored-password-hash",
            is_active: true,
          },
        ],
      }),
      transaction: async (
        callback: (client: {
          query: (sql: string) => Promise<unknown>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql: string) => {
            queries.push(sql);
            if (sql.startsWith("SELECT school_id")) {
              return { rows: [{ school_id: "school-a", role: "TEACHER" }] };
            }
            return { rows: [] };
          },
        }),
    };
    const createdSessions: Array<[string, string]> = [];
    const auth = {
      verifyPassword: async () => true,
      createSession: async (userId: string, schoolId: string) => {
        createdSessions.push([userId, schoolId]);
      },
    };
    const controller = new AuthController(
      db as never,
      auth as never,
      {} as never,
    );

    await expect(
      controller.login(
        { email: "guru.aisyah@ramu.test", password: "kata-sandi" },
        {} as never,
      ),
    ).resolves.toEqual({ schoolId: "school-a", role: "TEACHER" });

    expect(createdSessions).toEqual([["user-a", "school-a"]]);
    expect(queries.some((sql) => sql.includes("ORDER BY"))).toBe(false);
  });

  it("rejects ambiguous active school memberships without revealing account state", async () => {
    const db = {
      query: async () => ({
        rows: [
          {
            id: "user-a",
            password_hash: "stored-password-hash",
            is_active: true,
          },
        ],
      }),
      transaction: async (
        callback: (client: {
          query: () => Promise<unknown>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async () => ({
            rows: [
              { school_id: "school-a", role: "TEACHER" },
              { school_id: "school-b", role: "PRINCIPAL" },
            ],
          }),
        }),
    };
    let createdSession = false;
    const auth = {
      verifyPassword: async () => true,
      createSession: async () => {
        createdSession = true;
      },
    };
    const controller = new AuthController(
      db as never,
      auth as never,
      {} as never,
    );

    await expect(
      controller.login(
        { email: "guru.aisyah@ramu.test", password: "kata-sandi" },
        {} as never,
      ),
    ).rejects.toMatchObject({
      message: "Email atau kata sandi salah",
      status: 401,
    });
    expect(createdSession).toBe(false);
  });

  it("requires the current password before changing a profile password", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        if (sql.startsWith("SELECT password_hash")) {
          return { rows: [{ password_hash: "stored-password-hash" }] };
        }
        return { rows: [{ id: "user-a", name: "Guru Aisyah" }] };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const audit = { record: async () => undefined };
    const auth = {
      require: () => ({ userId: "user-a", schoolId: "school-a" }),
      verifyPassword: async () => false,
      hashPassword: async () => "new-password-hash",
      revokeAllUserSessions: async () => undefined,
      createSessionWithClient: async () => undefined,
    };
    const controller = new AuthController(
      db as never,
      auth as never,
      audit as never,
    );

    await expect(
      controller.updateProfile({} as never, {
        name: "Guru Aisyah",
        currentPassword: "kata-sandi-lama",
        password: "kata-sandi-baru",
        passwordConfirmation: "kata-sandi-baru",
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queries).toHaveLength(1);
  });

  it("updates a profile password after verification and records the change", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auditEvents: unknown[] = [];
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        if (sql.startsWith("SELECT password_hash")) {
          return { rows: [{ password_hash: "stored-password-hash" }] };
        }
        return {
          rows: [
            { id: "user-a", name: "Guru Aisyah", email: "guru@example.test" },
          ],
        };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const audit = {
      record: async (event: unknown) => {
        auditEvents.push(event);
      },
    };
    const revokedUsers: string[] = [];
    const createdSessions: Array<[string, string]> = [];
    const auth = {
      require: () => ({ userId: "user-a", schoolId: "school-a" }),
      verifyPassword: async () => true,
      hashPassword: async () => "new-password-hash",
      revokeAllUserSessions: async (userId: string) => {
        revokedUsers.push(userId);
      },
      createSessionWithClient: async (userId: string, schoolId: string) => {
        createdSessions.push([userId, schoolId]);
      },
    };
    const controller = new AuthController(
      db as never,
      auth as never,
      audit as never,
    );

    await expect(
      controller.updateProfile({} as never, {
        name: "Guru Aisyah",
        currentPassword: "kata-sandi-lama",
        password: "kata-sandi-baru",
        passwordConfirmation: "kata-sandi-baru",
      }),
    ).resolves.toMatchObject({ id: "user-a" });

    expect(queries[1]?.values).toEqual([
      "user-a",
      "Guru Aisyah",
      null,
      "new-password-hash",
    ]);
    expect(auditEvents).toEqual([
      expect.objectContaining({
        action: "auth.password_changed",
        entityId: "user-a",
      }),
    ]);
    expect(revokedUsers).toEqual(["user-a"]);
    expect(createdSessions).toEqual([["user-a", "school-a"]]);
  });
});
