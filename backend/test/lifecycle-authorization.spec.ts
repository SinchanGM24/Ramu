import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";
import { LifecycleController } from "../src/lifecycle/lifecycle.controller";

const request = (role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL") =>
  ({
    auth: {
      userId: "user-1",
      schoolId: "school-1",
      role,
      email: "user@example.test",
      sessionId: "session-1",
    },
  }) as never;

describe("LifecycleController authorization", () => {
  it("does not allow a teacher to transfer a student", async () => {
    const controller = new LifecycleController(
      new AuthService({} as never),
      {} as never,
      {} as never,
    );
    await expect(
      controller.transfer(request("TEACHER"), {
        items: [
          {
            studentId: "00000000-0000-4000-8000-000000000001",
            targetClassGroupId: "00000000-0000-4000-8000-000000000002",
            effectiveOn: "2026-07-01",
          },
        ],
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("does not allow a teacher to graduate a student", async () => {
    const controller = new LifecycleController(
      new AuthService({} as never),
      {} as never,
      {} as never,
    );
    await expect(
      controller.graduate(request("TEACHER"), {
        studentIds: ["00000000-0000-4000-8000-000000000001"],
        effectiveOn: "2026-07-01",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("stores a teacher transfer as a request, not an applied operation", async () => {
    const sql: string[] = [];
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            statement: string,
          ) => Promise<{
            rowCount: number;
            rows: Array<{ id?: string; status?: string }>;
          }>;
        }) => unknown,
      ) =>
        callback({
          query: async (statement) => {
            sql.push(statement);
            if (statement.includes("SELECT DISTINCT enrollment.student_id"))
              return { rowCount: 1, rows: [{}] };
            return {
              rowCount: 1,
              rows: [{ id: "request-1", status: "PENDING" }],
            };
          },
        }),
    } as never;
    const audit = { record: async () => undefined } as never;
    const controller = new LifecycleController(
      new AuthService({} as never),
      db,
      audit,
    );

    await expect(
      controller.proposeTransfer(request("TEACHER"), {
        items: [
          {
            studentId: "00000000-0000-4000-8000-000000000001",
            targetClassGroupId: "00000000-0000-4000-8000-000000000002",
            effectiveOn: "2026-10-12",
          },
        ],
      }),
    ).resolves.toMatchObject({ requestId: "request-1", status: "PENDING" });
    expect(
      sql.some((statement) =>
        statement.includes("INSERT INTO lifecycle_requests"),
      ),
    ).toBe(true);
    expect(
      sql.some((statement) =>
        statement.includes("INSERT INTO lifecycle_operations"),
      ),
    ).toBe(false);
  });

  it("rejects a proposal without applying a lifecycle operation", async () => {
    const sql: string[] = [];
    const audit = { record: async (...args: unknown[]) => args } as never;
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            statement: string,
          ) => Promise<{ rowCount: number; rows: Array<{ request_type?: string }> }>;
        }) => unknown,
      ) =>
        callback({
          query: async (statement) => {
            sql.push(statement);
            if (statement.startsWith("SELECT * FROM lifecycle_requests")) {
              return { rowCount: 1, rows: [{ request_type: "TRANSFER" }] };
            }
            return { rowCount: 1, rows: [] };
          },
        }),
    } as never;
    const controller = new LifecycleController(
      new AuthService({} as never),
      db,
      audit,
    );

    await expect(
      controller.decide(request("PRINCIPAL"), "request-1", {
        decision: "REJECTED",
        note: "Kelas tujuan perlu diperbaiki.",
      }),
    ).resolves.toEqual({ id: "request-1", status: "REJECTED" });
    expect(sql.some((statement) => statement.includes("status='REJECTED'"))).toBe(true);
    expect(sql.some((statement) => statement.includes("INSERT INTO lifecycle_operations"))).toBe(false);
  });

  it("links a corrected teacher proposal to its rejected request", async () => {
    const sql: string[] = [];
    const auditCalls: Array<{ action?: string }> = [];
    const db = {
      transaction: async (
        callback: (client: {
          query: (
            statement: string,
          ) => Promise<{
            rowCount: number;
            rows: Array<{ id?: string; status?: string }>;
          }>;
        }) => unknown,
      ) =>
        callback({
          query: async (statement) => {
            sql.push(statement);
            if (statement.includes("SELECT DISTINCT enrollment.student_id")) {
              return { rowCount: 1, rows: [{}] };
            }
            if (statement.startsWith("SELECT id FROM lifecycle_requests")) {
              return { rowCount: 1, rows: [{ id: "previous-request" }] };
            }
            return { rowCount: 1, rows: [{ id: "request-2", status: "PENDING" }] };
          },
        }),
    } as never;
    const audit = {
      record: async (entry: { action?: string }) => {
        auditCalls.push(entry);
      },
    } as never;
    const controller = new LifecycleController(
      new AuthService({} as never),
      db,
      audit,
    );

    await expect(
      controller.proposeTransfer(request("TEACHER"), {
        items: [
          {
            studentId: "00000000-0000-4000-8000-000000000001",
            targetClassGroupId: "00000000-0000-4000-8000-000000000002",
            effectiveOn: "2026-10-12",
          },
        ],
        resubmittedFromRequestId: "00000000-0000-4000-8000-000000000003",
      }),
    ).resolves.toMatchObject({ requestId: "request-2", status: "PENDING" });
    expect(sql.some((statement) => statement.includes("resubmitted_from_request_id"))).toBe(true);
    expect(auditCalls).toContainEqual(expect.objectContaining({ action: "lifecycle.request_resubmitted" }));
  });
});
