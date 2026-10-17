import { describe, expect, it } from "vitest";
import { StaffController } from "../src/staff/staff.controller";

describe("StaffController password reset", () => {
  it("revokes every active session when an admin resets a staff password", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const revokedUsers: string[] = [];
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        if (sql.startsWith("SELECT user_id"))
          return { rows: [{ user_id: "teacher-a", role: "TEACHER" }] };
        return { rows: [{ id: "teacher-a" }] };
      },
    };
    const controller = new StaffController(
      {
        require: () => ({ userId: "admin-a", schoolId: "school-a" }),
        hashPassword: async () => "new-password-hash",
        revokeAllUserSessions: async (userId: string) => {
          revokedUsers.push(userId);
        },
      } as never,
      {
        transaction: async (callback: (input: typeof client) => Promise<unknown>) =>
          callback(client),
      } as never,
      { record: async () => undefined } as never,
    );

    await expect(
      controller.update({} as never, "teacher-a", {
        password: "kata-sandi-baru",
      }),
    ).resolves.toEqual({ ok: true });

    expect(revokedUsers).toEqual(["teacher-a"]);
    expect(
      queries.some((entry) => entry.sql.startsWith("UPDATE users SET")),
    ).toBe(true);
  });
});
