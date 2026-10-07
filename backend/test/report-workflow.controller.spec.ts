import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";
import { ReportWorkflowController } from "../src/reports/report-workflow.controller";

const request = (role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL") => ({ auth: { userId: "user-1", schoolId: "school-1", role, email: "admin@example.test", sessionId: "session-1" } }) as never;

describe("ReportWorkflowController", () => {
  it("resumes a revision only inside the authenticated school and records the action", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const audit = { record: async () => undefined };
    const db = { transaction: async (callback: (client: { query: (sql: string, values: unknown[]) => Promise<{ rows: Array<{ id: string }> }> }) => Promise<unknown>) => callback({ query: async (sql, values) => { queries.push({ sql, values }); return { rows: [{ id: "report-1" }] }; } }) };
    const controller = new ReportWorkflowController(new AuthService({} as never), db as never, audit as never);

    await expect(controller.resumeRevision(request("TEACHER"), "report-1")).resolves.toEqual({ id: "report-1" });
    expect(queries[0].sql).toContain("school_id=$2");
    expect(queries[0].values).toEqual(["report-1", "school-1"]);
  });

  it("rejects correction attempts by a teacher", async () => {
    const controller = new ReportWorkflowController(new AuthService({} as never), {} as never, {} as never);
    await expect(controller.startCorrection(request("TEACHER"), "report-1")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
