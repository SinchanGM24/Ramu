import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";

const service = new AuthService({} as never);
const request = { auth: { userId: "u1", schoolId: "s1", role: "SCHOOL_ADMIN", email: "admin@example.test", sessionId: "session" } } as never;

describe("AuthService.require", () => {
  it("accepts an allowed authenticated role", () => {
    expect(service.require(request, ["SCHOOL_ADMIN"]).schoolId).toBe("s1");
  });
  it("rejects a missing or disallowed session", () => {
    expect(() => service.require({} as never)).toThrow(UnauthorizedException);
    expect(() => service.require(request, ["TEACHER"])).toThrow(UnauthorizedException);
  });
});
