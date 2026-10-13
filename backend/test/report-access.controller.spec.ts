import { describe, expect, it } from "vitest";
import { ReportAccessController } from "../src/reports/report-access.controller";

describe("ReportAccessController", () => {
  it("limits new parent-access links to school admins and assigned teachers", async () => {
    let requiredRoles: string[] = [];
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auth = {
      require: (_request: unknown, roles: string[]) => {
        requiredRoles = roles;
        return {
          role: "TEACHER",
          schoolId: "school-a",
          userId: "teacher-a",
        };
      },
    };
    const db = {
      transaction: async (
        callback: (client: { query: typeof query }) => Promise<unknown>,
      ) => callback({ query }),
    };
    async function query(sql: string, values: unknown[]) {
      queries.push({ sql, values });
      if (sql.includes("assignment.school_id=$3")) {
        return { rowCount: 1, rows: [{}] };
      }
      if (sql.includes("FROM report_versions version")) {
        return { rowCount: 1, rows: [{ id: "version-a" }] };
      }
      return { rowCount: 1, rows: [{}] };
    }

    const audit = { record: async () => undefined };
    const controller = new ReportAccessController(
      auth as never,
      db as never,
      audit as never,
    );

    await controller.create({} as never, "report-a");

    expect(requiredRoles).toEqual(["SCHOOL_ADMIN", "TEACHER"]);
    expect(
      queries.some((query) => query.sql.includes("assignment.school_id=$3")),
    ).toBe(true);
    expect(
      queries.some((query) => query.sql.includes("version.school_id=$2")),
    ).toBe(true);
  });
});
