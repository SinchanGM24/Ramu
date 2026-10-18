import { describe, expect, it } from "vitest";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";
import { ReportWorkflowController } from "../src/reports/report-workflow.controller";

const request = (role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL") =>
  ({
    auth: {
      userId: "user-1",
      schoolId: "school-1",
      role,
      email: "admin@example.test",
      sessionId: "session-1",
    },
  }) as never;

describe("ReportWorkflowController", () => {
  it("resumes a revision only inside the authenticated school and records the action", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auditCalls: Array<{ action: string; entityId: string }> = [];
    const audit = {
      record: async (event: { action: string; entityId: string }) => {
        auditCalls.push(event);
      },
    };
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rows: Array<{ id: string }> }>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            return { rows: [{ id: "report-1" }] };
          },
        }),
    };
    const controller = new ReportWorkflowController(
      new AuthService({} as never),
      db as never,
      audit as never,
    );

    await expect(
      controller.resumeRevision(request("SCHOOL_ADMIN"), "report-1"),
    ).resolves.toEqual({ id: "report-1" });
    expect(queries[0].sql).toContain("school_id=$2");
    expect(queries[0].values).toEqual(["report-1", "school-1"]);
    expect(auditCalls).toMatchObject([
      { action: "report.revision_resumed", entityId: "report-1" },
    ]);
  });

  it("rejects correction attempts by a teacher", async () => {
    const controller = new ReportWorkflowController(
      new AuthService({} as never),
      {} as never,
      {} as never,
    );
    await expect(
      controller.startCorrection(request("TEACHER"), "report-1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns a conflict when the report is not published before a correction starts", async () => {
    const db = {
      transaction: async (
        callback: (client: {
          query: () => Promise<{ rows: Array<{ id: string }> }>;
        }) => Promise<unknown>,
      ) => callback({ query: async () => ({ rows: [] }) }),
    };
    const controller = new ReportWorkflowController(
      new AuthService({} as never),
      db as never,
      {} as never,
    );

    await expect(
      controller.startCorrection(request("SCHOOL_ADMIN"), "report-1"),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("starts a correction without mutating the previous version, parent access, or delivery history", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const auditCalls: Array<{ action: string; metadata?: Record<string, unknown> }> = [];
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            sql: string,
            values: unknown[],
          ) => Promise<{ rows: Array<Record<string, unknown>> }>;
        }) => Promise<unknown>,
      ) =>
        callback({
          query: async (sql, values) => {
            queries.push({ sql, values });
            if (sql.startsWith("SELECT id FROM reports")) return { rows: [{ id: "report-1" }] };
            if (sql.startsWith("SELECT id,version_number FROM report_versions")) {
              return { rows: [{ id: "version-1", version_number: 1 }] };
            }
            if (sql.startsWith("UPDATE reports")) return { rows: [{ id: "report-1", status: "DRAFT" }] };
            return { rows: [] };
          },
        }),
    };
    const audit = {
      record: async (event: { action: string; metadata?: Record<string, unknown> }) => {
        auditCalls.push(event);
      },
    };
    const controller = new ReportWorkflowController(
      new AuthService({} as never),
      db as never,
      audit as never,
    );

    await expect(
      controller.startCorrection(request("SCHOOL_ADMIN"), "report-1"),
    ).resolves.toMatchObject({ id: "report-1", status: "DRAFT" });

    expect(queries[0].values).toEqual(["report-1", "school-1"]);
    expect(
      queries.some((query) => /(?:UPDATE|DELETE)\s+report_versions/i.test(query.sql)),
    ).toBe(false);
    expect(
      queries.some((query) => /(?:UPDATE|DELETE)\s+report_access/i.test(query.sql)),
    ).toBe(false);
    expect(
      queries.some((query) => /(?:UPDATE|DELETE)\s+report_deliveries/i.test(query.sql)),
    ).toBe(false);
    expect(auditCalls).toContainEqual(
      expect.objectContaining({
        action: "report.correction_started",
        metadata: { previousVersionId: "version-1", previousVersionNumber: 1 },
      }),
    );
  });
});
