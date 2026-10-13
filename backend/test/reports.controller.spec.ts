import { describe, expect, it } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { ReportsController } from "../src/reports/reports.controller";

const request = {
	auth: {
		userId: "principal-1",
		schoolId: "school-1",
		role: "PRINCIPAL",
		email: "kepala@example.test",
		sessionId: "session-1",
	},
} as never;

describe("ReportsController", () => {
	it("casts the report status update and uses boolean transition flags", async () => {
		const queries: Array<{ sql: string; values: unknown[] }> = [];
		const client = {
			query: async (sql: string, values: unknown[]) => {
				queries.push({ sql, values });
				if (sql.startsWith("SELECT status")) return { rows: [{ status: "SUBMITTED" }] };
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

		const update = queries.find(({ sql }) => sql.startsWith("UPDATE reports SET status"));
		expect(update?.sql).toContain("status=$1::report_status");
		expect(update?.values).toEqual(["IN_REVIEW", "report-1", false, false]);
	});
});
