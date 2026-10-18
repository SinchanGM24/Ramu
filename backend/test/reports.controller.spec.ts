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

function publicationPreparationClient(
  queries: Array<{ sql: string; values: unknown[] }>,
  finalizationFails = false,
) {
  return {
    query: async (sql: string, values: unknown[]) => {
      queries.push({ sql, values });
      if (sql.includes("FROM reports r JOIN schools school")) {
        return {
          rows: [
            {
              id: "report-1",
              status: "APPROVED",
              student_id: "student-1",
              semester_id: "semester-1",
              student_enrollment_id: "enrollment-1",
              school_name: "TK Contoh Ceria",
            },
          ],
        };
      }
      if (sql.includes("SELECT i.description")) return { rows: [] };
      if (sql.includes("SELECT da.name\n    FROM development_areas"))
        return { rows: [] };
      if (sql.includes("EXISTS(SELECT 1 FROM attendance_summaries")) {
        return { rows: [{ ready: true }] };
      }
      if (sql.includes("SELECT COALESCE(max(version_number),0)+1")) {
        return { rows: [{ next: 1 }] };
      }
      if (sql.includes("FROM reports\n             WHERE id=$1")) {
        return { rows: finalizationFails ? [] : [{ id: "report-1" }] };
      }
      return { rows: [] };
    },
  };
}

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
        return {
          rows: [
            {
              items: [],
              total: 0,
              summary: {
                total: 0,
                notCreated: 0,
                draft: 0,
                review: 0,
                publish: 0,
                published: 0,
                waitingReview: 0,
                approved: 0,
                correction: 0,
              },
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
      controller.progress(schoolAdminRequest, "semester-1"),
    ).resolves.toMatchObject({ items: [], total: 0, page: 1, limit: 10 });

    expect(queries[0].sql).toContain("latest_published_version_number");
    expect(queries[0].sql).toContain("latest_published_at");
    expect(queries[0].values).toEqual([
      "semester-1",
      null,
      expect.any(String),
      "school-1",
      "ALL",
      "",
      "ALL",
      10,
      0,
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

  it("rejects a second publication attempt while the first attempt holds the report lock", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    let pdfCalls = 0;
    const pdf = {
      storePublishedReport: async () => {
        pdfCalls += 1;
      },
    };
    const client = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        return {
          rows: [
            {
              id: "report-1",
              status: "APPROVED",
              publication_lock_token: "lock-first-publication",
              publication_locked_at: new Date(),
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
      pdf as never,
    );

    await expect(
      controller.publishForActor(schoolAdminRequest.auth, "report-1"),
    ).rejects.toThrow("Raport sedang diproses untuk diterbitkan");

    expect(queries).toHaveLength(1);
    expect(queries[0]?.sql).toContain("FOR UPDATE OF r");
    expect(pdfCalls).toBe(0);
  });

  it("releases the publication lock when PDF storage fails", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const client = publicationPreparationClient(queries);
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      {} as never,
      {
        storePublishedReport: async () => {
          throw new Error("Object storage tidak tersedia");
        },
      } as never,
    );

    await expect(
      controller.publishForActor(schoolAdminRequest.auth, "report-1"),
    ).rejects.toThrow("PDF raport belum dapat dibuat atau disimpan");

    expect(
      queries.some(({ sql }) =>
        sql.includes(
          "SET publication_lock_token=NULL,publication_locked_at=NULL",
        ),
      ),
    ).toBe(true);
  });

  it("deletes an uploaded PDF and releases the lock when finalization fails", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const client = publicationPreparationClient(queries, true);
    const deletedKeys: string[] = [];
    const db = {
      transaction: async (
        callback: (input: typeof client) => Promise<unknown>,
      ) => callback(client),
    };
    const controller = new ReportsController(
      new AuthService({} as never),
      db as never,
      {} as never,
      {
        storePublishedReport: async () =>
          "schools/school-1/reports/report-1/orphan.pdf",
        deleteStoredObject: async (storageKey: string) => {
          deletedKeys.push(storageKey);
        },
      } as never,
    );

    await expect(
      controller.publishForActor(schoolAdminRequest.auth, "report-1"),
    ).rejects.toThrow("Proses penerbitan raport tidak lagi berlaku");

    expect(deletedKeys).toEqual([
      "schools/school-1/reports/report-1/orphan.pdf",
    ]);
    expect(
      queries.some(({ sql }) =>
        sql.includes(
          "SET publication_lock_token=NULL,publication_locked_at=NULL",
        ),
      ),
    ).toBe(true);
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

    expect(queries[0]?.sql).toContain("FOR UPDATE");
    expect(queries[0]?.values).toEqual(["report-1", "school-1"]);
    const update = queries.find(({ sql }) => sql.startsWith("UPDATE reports"));
    expect(update?.sql).toContain("status=$1::report_status");
    expect(update?.sql).toContain("status=$6::report_status");
    expect(update?.values).toEqual([
      "IN_REVIEW",
      "report-1",
      false,
      false,
      "school-1",
      "SUBMITTED",
    ]);
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
        {
          id: "student-2",
          name: "Bima",
          report_id: "report-2",
          status: "DRAFT",
        },
        {
          id: "student-3",
          name: "Citra",
          report_id: "report-3",
          status: "SUBMITTED",
        },
      ],
      {
        page: 1,
        limit: 1,
        search: "",
        view: "EDITOR",
        deliveryFilter: "ALL",
      },
    );

    expect(result.items).toEqual([
      { id: "student-1", name: "Alya", status: null },
    ]);
    expect(result.total).toBe(2);
    expect(result.summary).toMatchObject({
      notCreated: 1,
      draft: 1,
      review: 0,
    });
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

    expect(result.items.map((item) => item.id)).toEqual([
      "student-1",
      "student-2",
    ]);
  });
});
