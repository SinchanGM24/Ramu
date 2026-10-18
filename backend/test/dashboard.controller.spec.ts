import { describe, expect, it } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { DashboardController } from "../src/dashboard/dashboard.controller";

function request(role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL") {
  return {
    auth: {
      userId: "user-1",
      schoolId: "school-1",
      role,
      email: "user@example.test",
      sessionId: "session-1",
    },
  } as never;
}

function controllerFor(queries: Array<{ sql: string; values?: unknown[] }>) {
  const client = {
    query: async (sql: string, values?: unknown[]) => {
      queries.push({ sql, values });
      if (sql.includes("FROM schools school")) {
        return {
          rows: [
            {
              school_name: "TK Contoh Ceria",
              academic_year_name: "2026",
              semester_name: "Semester I",
            },
          ],
        };
      }
      return {
        rows: [
          {
            active_students: 2,
            reports_not_created: 1,
            reports_created: 1,
            revisions: 0,
            reports_to_review: 1,
            transfer_requests: 2,
            graduation_requests: 3,
            active_reports: 2,
            active_classes: 1,
          },
        ],
      };
    },
  };
  const db = {
    transaction: async (callback: (input: typeof client) => Promise<unknown>) =>
      callback(client),
  };
  return new DashboardController(new AuthService({} as never), db as never);
}

describe("DashboardController", () => {
  it("limits teacher summary counts to the assigned classes in the current school", async () => {
    const queries: Array<{ sql: string; values?: unknown[] }> = [];
    const controller = controllerFor(queries);

    const result = await controller.summary(request("TEACHER"));
    const statsQuery = queries[1];

    expect(result.stats.map((stat) => stat.id)).toEqual([
      "students",
      "missing-reports",
      "reports",
      "revisions",
    ]);
    expect(statsQuery.sql).toContain("assignment.teacher_user_id=$2");
    expect(statsQuery.sql).toContain("enrollment.school_id=$1");
    expect(statsQuery.sql).toContain("semester.is_active");
    expect(statsQuery.values).toEqual(["school-1", "user-1"]);
  });

  it("shows only principal approval queues for a principal", async () => {
    const queries: Array<{ sql: string; values?: unknown[] }> = [];
    const controller = controllerFor(queries);

    const result = await controller.summary(request("PRINCIPAL"));
    const statsQuery = queries[1];

    expect(result.stats.map((stat) => stat.id)).toEqual([
      "reports-to-review",
      "transfer-requests",
      "graduation-requests",
    ]);
    expect(statsQuery.sql).toContain("lifecycle_requests");
    expect(statsQuery.values).toEqual(["school-1"]);
  });
});
