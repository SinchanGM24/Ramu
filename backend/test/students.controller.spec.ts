import { describe, expect, it } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { StudentsController } from "../src/students/students.controller";

const request = (role: "SCHOOL_ADMIN" | "TEACHER") =>
  ({
    auth: {
      userId: "00000000-0000-4000-8000-000000000001",
      schoolId: "00000000-0000-4000-8000-000000000002",
      role,
      email: "user@example.test",
      sessionId: "session-1",
    },
  }) as never;

describe("StudentsController list", () => {
  it("uses only filter parameters for the total query", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rows: Array<{ total?: number }> }>;
        }) => unknown,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            return {
              rows: sql.includes("count(DISTINCT") ? [{ total: 0 }] : [],
            };
          },
        }),
    } as never;
    const controller = new StudentsController(
      new AuthService({} as never),
      db,
      {} as never,
    );

    await expect(
      controller.list(request("SCHOOL_ADMIN"), "1", "10", "", undefined),
    ).resolves.toEqual({ items: [], total: 0, page: 1, limit: 10 });
    expect(queries).toHaveLength(2);
    expect(queries[0].sql).toContain("$5::uuid IS NULL");
    expect(queries[0].values).toHaveLength(8);
    expect(queries[0].values[4]).toBeNull();
    expect(queries[1].sql).toContain("$5::uuid IS NULL");
    expect(queries[1].values).toHaveLength(6);
    expect(queries[1].values[4]).toBeNull();
  });

  it("binds the teacher identifier when filtering assigned students", async () => {
    const queries: Array<{ values: unknown[] }> = [];
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rows: Array<{ total?: number }> }>;
        }) => unknown,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ values });
            return {
              rows: sql.includes("count(DISTINCT") ? [{ total: 0 }] : [],
            };
          },
        }),
    } as never;
    const controller = new StudentsController(
      new AuthService({} as never),
      db,
      {} as never,
    );

    await controller.list(request("TEACHER"), "1", "10", "", undefined);
    expect(queries).toHaveLength(2);
    expect(queries[0].values[4]).toBe("00000000-0000-4000-8000-000000000001");
    expect(queries[1].values[4]).toBe("00000000-0000-4000-8000-000000000001");
  });
});

describe("StudentsController student admission resubmission", () => {
  it("creates an auditable pending request without creating a student or placement", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auditEntries: unknown[] = [];
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rowCount?: number; rows: Array<Record<string, unknown>> }>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            if (sql.includes("status='REJECTED' FOR UPDATE")) {
              return { rows: [{ id: "request-old" }] };
            }
            if (sql.includes("FROM teacher_class_assignments")) {
              return { rows: [{}] };
            }
            if (sql.startsWith("SELECT id FROM student_admission_requests")) {
              return { rowCount: 0, rows: [] };
            }
            if (sql.startsWith("INSERT INTO student_admission_requests")) {
              return {
                rows: [
                  {
                    id: "request-new",
                    resubmitted_from_request_id: "request-old",
                    status: "PENDING",
                  },
                ],
              };
            }
            return { rows: [] };
          },
        }),
    };
    const audit = { record: async (entry: unknown) => auditEntries.push(entry) };
    const controller = new StudentsController(
      new AuthService({} as never),
      db as never,
      audit as never,
    );

    await expect(
      controller.resubmitRequest(
        request("TEACHER"),
        "request-old",
        {
          classGroupId: "00000000-0000-4000-8000-000000000004",
          name: "Murid Perbaikan",
        },
      ),
    ).resolves.toMatchObject({
      id: "request-new",
      requestPending: true,
      status: "PENDING",
    });

    expect(queries[0].values).toEqual([
      "request-old",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000001",
    ]);
    expect(
      queries.some((query) => query.sql.startsWith("INSERT INTO students")),
    ).toBe(false);
    expect(
      queries.some((query) => query.sql.includes("INSERT INTO student_enrollments")),
    ).toBe(false);
    expect(auditEntries).toContainEqual(
      expect.objectContaining({ action: "student_admission.resubmitted" }),
    );
  });
});
