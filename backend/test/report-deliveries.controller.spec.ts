import { describe, expect, it } from "vitest";
import { ReportDeliveriesController } from "../src/messaging/report-deliveries.controller";

const teacherRequest = {
  auth: {
    email: "guru@example.test",
    role: "TEACHER",
    schoolId: "school-a",
    sessionId: "session-1",
    userId: "teacher-a",
  },
} as never;

const adminRequest = {
  auth: {
    email: "admin@example.test",
    role: "SCHOOL_ADMIN",
    schoolId: "school-a",
    sessionId: "session-1",
    userId: "admin-a",
  },
} as never;

describe("ReportDeliveriesController", () => {
  it("scopes a teacher manual WhatsApp handoff to the authenticated school and report assignment", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auth = { require: (request: { auth: unknown }) => request.auth };
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rowCount: number; rows: unknown[] }>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            if (sql.includes("FROM report_deliveries delivery")) {
              return {
                rowCount: 1,
                rows: [
                  {
                    guardian_name: "Ibu Alya",
                    id: "delivery-a",
                    recipient_phone: "081234567890",
                    report_id: "report-a",
                    report_version_id: "version-a",
                    school_name: "TK Ceria",
                    status: "QUEUED",
                    student_name: "Alya",
                  },
                ],
              };
            }
            if (sql.includes("assignment.school_id=$3")) {
              return { rowCount: 1, rows: [{}] };
            }
            if (sql.includes("INSERT INTO report_access")) {
              return { rowCount: 1, rows: [{ id: "access-a" }] };
            }
            return { rowCount: 1, rows: [{}] };
          },
        }),
    };
    const audit = { record: async () => undefined };
    const controller = new ReportDeliveriesController(
      auth as never,
      db as never,
      audit as never,
    );

    const result = await controller.openWhatsApp(teacherRequest, "delivery-a");

    expect(queries[0].sql).toContain("delivery.school_id=$2");
    expect(queries[0].values).toEqual(["delivery-a", "school-a"]);
    expect(
      queries.some((query) => query.sql.includes("assignment.school_id=$3")),
    ).toBe(true);
    expect(result.whatsAppUrl).toContain("https://wa.me/6281234567890?");
    expect(
      queries.some((query) => query.sql.includes("status='SENT'")),
    ).toBe(false);
  });

  it("rejects an invalid WhatsApp number before creating access credentials or changing delivery status", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auth = { require: (request: { auth: unknown }) => request.auth };
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rowCount: number; rows: unknown[] }>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            if (sql.includes("FROM report_deliveries delivery")) {
              return {
                rowCount: 1,
                rows: [
                  {
                    guardian_name: "Ibu Alya",
                    id: "delivery-a",
                    recipient_phone: "123",
                    report_id: "report-a",
                    report_version_id: "version-a",
                    school_name: "TK Ceria",
                    status: "QUEUED",
                    student_name: "Alya",
                  },
                ],
              };
            }
            if (sql.includes("assignment.school_id=$3")) {
              return { rowCount: 1, rows: [{}] };
            }
            return { rowCount: 1, rows: [{}] };
          },
        }),
    };
    const audit = { record: async () => undefined };
    const controller = new ReportDeliveriesController(
      auth as never,
      db as never,
      audit as never,
    );

    await expect(
      controller.openWhatsApp(teacherRequest, "delivery-a"),
    ).rejects.toThrow("Nomor WhatsApp wali tidak valid");
    expect(
      queries.some((query) => query.sql.includes("INSERT INTO report_access")),
    ).toBe(false);
    expect(
      queries.some((query) => query.sql.includes("UPDATE report_deliveries")),
    ).toBe(false);
  });

  it("revokes prior parent access and creates a new credential without changing the published report version", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auditEntries: unknown[] = [];
    const auth = { require: (request: { auth: unknown }) => request.auth };
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rowCount: number; rows: unknown[] }>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            if (sql.includes("FROM report_deliveries delivery")) {
              return {
                rowCount: 1,
                rows: [
                  {
                    guardian_name: "Ibu Alya",
                    id: "delivery-a",
                    recipient_phone: "081234567890",
                    report_version_id: "version-a",
                    school_name: "TK Ceria",
                    student_name: "Alya",
                  },
                ],
              };
            }
            if (sql.includes("INSERT INTO report_access")) {
              return { rowCount: 1, rows: [{ id: "access-a" }] };
            }
            return { rowCount: 1, rows: [] };
          },
        }),
    };
    const audit = {
      record: async (entry: unknown) => {
        auditEntries.push(entry);
      },
    };
    const controller = new ReportDeliveriesController(
      auth as never,
      db as never,
      audit as never,
    );

    const result = await controller.regenerateAccess(adminRequest, "delivery-a");

    expect(queries[0].values).toEqual(["delivery-a", "school-a"]);
    expect(
      queries.some((query) => query.sql.includes("SET status='REVOKED'")),
    ).toBe(true);
    expect(
      queries.some((query) => query.sql.includes("DELETE FROM parent_report_sessions")),
    ).toBe(true);
    expect(
      queries.some((query) => query.sql.includes("INSERT INTO report_access")),
    ).toBe(true);
    expect(
      queries.some((query) => query.sql.includes("INSERT INTO report_versions")),
    ).toBe(false);
    expect(auditEntries).toContainEqual(
      expect.objectContaining({ action: "report_access.regenerated" }),
    );
    expect(result.whatsAppUrl).toContain("https://wa.me/6281234567890?");
  });

  it("reopens a WhatsApp handoff with its existing encrypted access credentials", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auth = { require: (request: { auth: unknown }) => request.auth };
    const { encryptParentAccessCredentials } = await import(
      "../src/messaging/parent-access-credentials"
    );
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rowCount: number; rows: unknown[] }>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            if (sql.includes("FROM report_deliveries delivery")) {
              return {
                rowCount: 1,
                rows: [
                  {
                    access_credentials_ciphertext: encryptParentAccessCredentials({
                      pin: "123456",
                      token: "existing-parent-token",
                    }),
                    guardian_name: "Ibu Alya",
                    id: "delivery-a",
                    recipient_phone: "081234567890",
                    report_access_id: "access-a",
                    report_id: "report-a",
                    report_version_id: "version-a",
                    school_name: "TK Ceria",
                    status: "QUEUED",
                    student_name: "Alya",
                  },
                ],
              };
            }
            if (sql.includes("assignment.school_id=$3")) {
              return { rowCount: 1, rows: [{}] };
            }
            if (sql.includes("SELECT id FROM report_access")) {
              return { rowCount: 1, rows: [{ id: "access-a" }] };
            }
            return { rowCount: 1, rows: [] };
          },
        }),
    };
    const controller = new ReportDeliveriesController(
      auth as never,
      db as never,
      { record: async () => undefined } as never,
    );

    const result = await controller.openWhatsApp(teacherRequest, "delivery-a");

    expect(result.whatsAppUrl).toContain("%2Fr%2Fexisting-parent-token");
    expect(result.whatsAppUrl).toContain("PIN%3A%20123456");
    expect(
      queries.some((query) => query.sql.includes("INSERT INTO report_access")),
    ).toBe(false);
    expect(
      queries.some((query) => query.sql.includes("whatsapp_opened_at=now()")),
    ).toBe(true);
  });
});
