import { describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { assertReportAccess } from "../src/reports/report-authorization";

describe("assertReportAccess", () => {
  const teacher = { userId: "teacher-1", schoolId: "school-a", role: "TEACHER", email: "teacher@example.test", sessionId: "session-1" } as never;

  it("scopes a teacher assignment check to the authenticated school", async () => {
    let values: unknown[] = [];
    const client = { query: async (sql: string, input: unknown[]) => { values = input; expect(sql).toContain("report.school_id=$3"); expect(sql).toContain("assignment.school_id=$3"); return { rowCount: 1, rows: [{}] }; } } as never;
    await expect(assertReportAccess(client, teacher, "report-1")).resolves.toBeUndefined();
    expect(values).toEqual(["report-1", "teacher-1", "school-a"]);
  });

  it("rejects a teacher without a class assignment", async () => {
    const client = { query: async () => ({ rowCount: 0, rows: [] }) } as never;
    await expect(assertReportAccess(client, teacher, "report-1")).rejects.toBeInstanceOf(ForbiddenException);
  });
});
