import { describe, expect, it } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { ReportExtracurricularController } from "../src/reports/report-extracurricular.controller";

const request = { auth: { userId: "user-1", schoolId: "school-1", role: "SCHOOL_ADMIN", email: "admin@example.test", sessionId: "session-1" } } as never;

describe("ReportExtracurricularController", () => {
  it("lists extracurricular records only through the authenticated school scope", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const db = { transaction: async (callback: (client: { query: (sql: string, values: unknown[]) => Promise<{ rows: unknown[] }> }) => Promise<unknown>) => callback({ query: async (sql, values) => { queries.push({ sql, values }); return { rows: [] }; } }) };
    const controller = new ReportExtracurricularController(new AuthService({} as never), db as never, {} as never);
    await expect(controller.list(request, "report-1")).resolves.toEqual([]);
    expect(queries[0].sql).toContain("r.school_id=$2");
    expect(queries[0].values).toEqual(["report-1", "school-1"]);
  });
});
