import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";

const service = new AuthService({} as never);
const request = {
  auth: {
    userId: "u1",
    schoolId: "s1",
    role: "SCHOOL_ADMIN",
    email: "admin@example.test",
    sessionId: "session",
  },
} as never;

describe("AuthService.require", () => {
  it("accepts an allowed authenticated role", () => {
    expect(service.require(request, ["SCHOOL_ADMIN"]).schoolId).toBe("s1");
  });
  it("rejects a missing or disallowed session", () => {
    expect(() => service.require({} as never)).toThrow(UnauthorizedException);
    expect(() => service.require(request, ["TEACHER"])).toThrow(
      UnauthorizedException,
    );
  });
});

describe("AuthService session revocation", () => {
  it("revokes every active session and never attaches a revoked token", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const service = new AuthService({
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        return { rows: [] };
      },
    } as never);
    const request = { cookies: { ramu_session: "sesi-lama" } } as never;

    await service.revokeAllUserSessions("u1");
    await service.attach(request);

    expect(queries[0]).toEqual({
      sql: "UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",
      values: ["u1"],
    });
    expect(queries[1]?.sql).toContain("s.revoked_at IS NULL");
    expect(request.auth).toBeUndefined();
  });
});
