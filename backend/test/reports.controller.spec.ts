import { describe, expect, it } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import {
  paginateProgressRows,
  ReportsController,
} from "../src/reports/reports.controller";

const request = {
  auth: {
    userId: "principal-1",
    schoolId: "school-1",
    role: "PRINCIPAL",
    email: "kepala@example.test",
    sessionId: "session-1",
  },
} as never;

const schoolAdminRequest = {
  auth: {
    userId: "admin-1",
    schoolId: "school-1",
    role: "SCHOOL_ADMIN",
    email: "admin@example.test",
    sessionId: "session-1",
  },
} as never;

const principalRequest = {
  auth: {
    userId: "principal-1",
    schoolId: "school-1",
    role: "PRINCIPAL",
    email: "kepala@example.test",
    sessionId: "session-1",
  },
} as never;

describe("ReportsController", () => {
  it("scopes the review queue to the current school and review stages", async () => {
    const queries: Array<{ sql: string; values?: unknown[] }> = [];
    const client = {
      query: async (sql: string, values?: unknown[]) => {
        queries.push({ sql, values });
        return { rows: [] };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      { record: async () => undefined } as never,
      {} as never,
    );

    await expect(controller.reviewQueue(request)).resolves.toEqual([]);

    expect(queries[0]?.sql).toContain("WHERE r.school_id=$1");
    expect(queries[0]?.sql).toContain("r.status IN ('SUBMITTED','IN_REVIEW')");
    expect(queries[0]?.values).toEqual(["school-1"]);
  });

  it("returns prior publication metadata with progress so an active correction stays distinct", async () => {
    const queries: Array<{ sql: string; values?: unknown[] }> = [];
    const client = {
      query: async (sql: string, values?: unknown[]) => {
        queries.push({ sql, values });
        return { rows: [] };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.progress(schoolAdminRequest, "semester-1"),
    ).resolves.toMatchObject({ items: [], total: 0, page: 1, limit: 10 });

    expect(queries[0].sql).toContain("latest_published_version_number");
    expect(queries[0].sql).toContain("latest_published_at");
    expect(queries[0].values).toEqual([
      "semester-1",
      null,
      expect.any(String),
      "school-1",
    ]);
  });

  it("returns current report status with the immutable published version", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        return {
          rows: [
            {
              current_status: "DRAFT",
              id: "version-1",
              version_number: 1,
            },
          ],
        };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.publishedVersion(schoolAdminRequest, "report-1"),
    ).resolves.toMatchObject({ current_status: "DRAFT", id: "version-1" });

    expect(queries[0].sql).toContain("report.status AS current_status");
    expect(queries[0].values).toEqual(["report-1", "school-1"]);
  });

  it("locks only the report row while loading publication data", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        return { rows: [] };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const audit = { record: async () => undefined };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      audit as never,
      {} as never,
    );

    await expect(
      controller.publish(schoolAdminRequest, "report-1"),
    ).rejects.toThrow("Raport tidak ditemukan");

    expect(queries[0]?.sql).toContain("FOR UPDATE OF r");
  });

  it("casts the report status update and uses boolean transition flags", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        if (sql.startsWith("SELECT status"))
          return { rows: [{ status: "SUBMITTED" }] };
        return { rows: [{ id: "report-1", status: "IN_REVIEW" }] };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const audit = { record: async () => undefined };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      audit as never,
      {} as never,
    );

    await expect(
      controller.move(request, "report-1", { action: "review" }),
    ).resolves.toEqual({ id: "report-1", status: "IN_REVIEW" });

    const update = queries.find(({ sql }) =>
      sql.startsWith("UPDATE reports SET status"),
    );
    expect(update?.sql).toContain("status=$1::report_status");
    expect(update?.values).toEqual(["IN_REVIEW", "report-1", false, false]);
  });

  it("requires a revision reason before returning a report to a teacher", async () => {
    const controller = new ReportsController(
      new AuthService({} as never),
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.move(request, "report-1", { action: "revision" }),
    ).rejects.toThrow("Alasan revisi wajib diisi");
  });

  it("allows a principal to preview a report only within the current school", async () => {
    const queries: Array<{ sql: string; values?: unknown[] }> = [];
    const client = {
      query: async (sql: string, values?: unknown[]) => {
        queries.push({ sql, values });
        if (sql.startsWith("SELECT r.*")) {
          return {
            rows: [
              {
                id: "report-1",
                student_id: "student-1",
                semester_id: "semester-1",
              },
            ],
          };
        }
        return { rows: [] };
      },
    };
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.editor(principalRequest, "report-1"),
    ).resolves.toMatchObject({
      report: { id: "report-1" },
    });
    expect(queries[0]?.sql).toContain("WHERE r.id=$1 AND r.school_id=$2");
    expect(queries[0]?.values).toEqual(["report-1", "school-1"]);
  });
});

describe("report progress pagination", () => {
  it("filters the editor list before paginating it", () => {
    const result = paginateProgressRows(
      [
        { id: "student-1", name: "Alya", status: null },
        { id: "student-2", name: "Bima", report_id: "report-2", status: "DRAFT" },
        { id: "student-3", name: "Citra", report_id: "report-3", status: "SUBMITTED" },
      ],
      {
        page: 1,
        limit: 1,
        search: "",
        view: "EDITOR",
        deliveryFilter: "ALL",
      },
    );

    expect(result.items).toEqual([{ id: "student-1", name: "Alya", status: null }]);
    expect(result.total).toBe(2);
    expect(result.summary).toMatchObject({ notCreated: 1, draft: 1, review: 0 });
  });

  it("prioritizes published reports that still need WhatsApp handoff", () => {
    const result = paginateProgressRows(
      [
        {
          id: "student-1",
          name: "Alya",
          report_id: "report-1",
          status: "PUBLISHED",
          delivery_status: "QUEUED",
          report_updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "student-2",
          name: "Bima",
          report_id: "report-2",
          status: "APPROVED",
          report_updated_at: "2026-02-01T00:00:00.000Z",
        },
      ],
      {
        page: 1,
        limit: 10,
        search: "",
        view: "PUBLICATION",
        deliveryFilter: "ALL",
      },
    );

    expect(result.items.map((item) => item.id)).toEqual(["student-1", "student-2"]);
  });
});
