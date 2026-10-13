import { describe, expect, it } from "vitest";
import { ParentController } from "../src/parent/parent.controller";

describe("ParentController", () => {
  it("creates a parent session from the verified database function without directly reading report access", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const db = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        if (sql.includes("verify_parent_report")) {
          return {
            rows: [{ verify_parent_report: { reportVersionId: "version-a" } }],
          };
        }
        return { rows: [] };
      },
    };
    const reply = { setCookie: () => undefined };
    const pdf = {};
    const controller = new ParentController(db as never, pdf as never);

    await controller.verify(
      { pin: "123456", token: "a-valid-parent-token-value" },
      reply as never,
    );

    expect(queries[0].sql).toContain("verify_parent_report($1,$2)");
    expect(
      queries.some((query) => query.sql.includes("FROM report_access")),
    ).toBe(false);
    expect(
      queries.some((query) => query.sql.includes("parent_report_sessions")),
    ).toBe(true);
  });

  it("retrieves the report and PDF key only through scoped parent-session functions", async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const db = {
      query: async (sql: string, values: unknown[]) => {
        queries.push({ sql, values });
        if (sql.includes("get_parent_report_pdf_key")) {
          return { rows: [{ pdf_storage_key: "schools/a/reports/a.pdf" }] };
        }
        if (sql.includes("get_parent_report")) {
          return { rows: [{ report: { student: { name: "Alya" } } }] };
        }
        return { rows: [] };
      },
    };
    const pdf = {
      readPublishedReport: async () => Buffer.from("pdf"),
    };
    const controller = new ParentController(db as never, pdf as never);
    const request = { cookies: { ramu_parent_session: "parent-session" } };
    const reply = {
      header: () => reply,
      send: (value: Buffer) => value,
    };

    const report = await controller.report(request as never);
    await controller.reportPdf(request as never, reply as never);

    expect(report).toEqual({ report: { student: { name: "Alya" } } });
    expect(
      queries.some((query) => query.sql.includes("get_parent_report($1)")),
    ).toBe(true);
    expect(
      queries.some((query) =>
        query.sql.includes("get_parent_report_pdf_key($1)"),
      ),
    ).toBe(true);
    expect(
      queries.some((query) => query.sql.includes("JOIN report_versions")),
    ).toBe(false);
  });
});
