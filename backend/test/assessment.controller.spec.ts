import { describe, expect, it } from "vitest";
import { AssessmentController } from "../src/assessment/assessment.controller";
import { AuthService } from "../src/auth/auth.service";

const request = {
  auth: {
    userId: "admin-1",
    schoolId: "school-1",
    role: "SCHOOL_ADMIN",
    email: "admin@example.test",
    sessionId: "session-1",
  },
} as never;

describe("AssessmentController", () => {
  it("uses one tenant-scoped upsert for rapid updates to the same indicator", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        if (sql.includes("SELECT 1 FROM students"))
          return { rowCount: 1, rows: [] };
        return { rowCount: 1, rows: [{ id: "assessment-1" }] };
      },
    };
    const controller = new AssessmentController(
      new AuthService({} as never),
      {
        transaction: async (
          callback: (input: typeof client) => Promise<unknown>,
        ) => callback(client),
      } as never,
      { record: async () => undefined } as never,
    );

    await expect(
      controller.save(request, "student-1", {
        semesterId: "00000000-0000-4000-8000-000000000001",
        indicatorId: "00000000-0000-4000-8000-000000000002",
        scaleOptionId: "00000000-0000-4000-8000-000000000003",
      }),
    ).resolves.toMatchObject({ id: "assessment-1" });

    const save = queries.find(({ sql }) =>
      sql.includes("INSERT INTO student_assessments"),
    );
    expect(save?.sql).toContain(
      "ON CONFLICT(student_id,semester_id,indicator_id) DO UPDATE",
    );
    expect(save?.values).toEqual([
      "school-1",
      "student-1",
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
      "admin-1",
    ]);
  });
});
