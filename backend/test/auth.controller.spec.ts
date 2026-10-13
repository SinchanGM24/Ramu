import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthController } from "../src/auth/auth.controller";

describe("AuthController login", () => {
  it("returns an unauthorized response for invalid credentials without creating a session", async () => {
    let createdSession = false;
    const db = {
      query: async () => ({
        rows: [{ id: "user-a", password_hash: "stored-password-hash" }],
      }),
    };
    const auth = {
      verifyPassword: async () => false,
      createSession: async () => {
        createdSession = true;
      },
    };
    const controller = new AuthController(db as never, auth as never);

    await expect(
      controller.login(
        { email: "guru.aisyah@ramu.test", password: "kata-sandi-salah" },
        {} as never,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(createdSession).toBe(false);
  });
});
