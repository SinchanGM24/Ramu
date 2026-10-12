import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";
import { LifecycleController } from "../src/lifecycle/lifecycle.controller";

const request = (role: "SCHOOL_ADMIN" | "TEACHER") => ({ auth: { userId: "user-1", schoolId: "school-1", role, email: "user@example.test", sessionId: "session-1" } }) as never;

describe("LifecycleController authorization", () => {
  it("does not allow a teacher to transfer a student", async () => {
    const controller = new LifecycleController(new AuthService({} as never), {} as never, {} as never);
    await expect(controller.transfer(request("TEACHER"), { items: [{ studentId: "00000000-0000-4000-8000-000000000001", targetClassGroupId: "00000000-0000-4000-8000-000000000002", effectiveOn: "2026-07-01" }] })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("does not allow a teacher to graduate a student", async () => {
    const controller = new LifecycleController(new AuthService({} as never), {} as never, {} as never);
    await expect(controller.graduate(request("TEACHER"), { studentIds: ["00000000-0000-4000-8000-000000000001"], effectiveOn: "2026-07-01" })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("stores a teacher transfer as a request, not an applied operation", async () => {
    const sql: string[] = [];
    const db = { transaction: async (callback: (client: { query: (statement: string) => Promise<{ rowCount: number; rows: Array<{ id?: string; status?: string }> }> }) => unknown) => callback({ query: async statement => { sql.push(statement); if (statement.includes("SELECT DISTINCT enrollment.student_id")) return { rowCount: 1, rows: [{}] }; return { rowCount: 1, rows: [{ id: "request-1", status: "PENDING" }] }; } }) } as never;
    const audit = { record: async () => undefined } as never;
    const controller = new LifecycleController(new AuthService({} as never), db, audit);

    await expect(controller.proposeTransfer(request("TEACHER"), { items: [{ studentId: "00000000-0000-4000-8000-000000000001", targetClassGroupId: "00000000-0000-4000-8000-000000000002", effectiveOn: "2026-10-12" }] })).resolves.toMatchObject({ requestId: "request-1", status: "PENDING" });
    expect(sql.some(statement => statement.includes("INSERT INTO lifecycle_requests"))).toBe(true);
    expect(sql.some(statement => statement.includes("INSERT INTO lifecycle_operations"))).toBe(false);
  });
});
