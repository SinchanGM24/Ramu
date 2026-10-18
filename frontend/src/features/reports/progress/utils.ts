import type { ProgressCounts, ProgressItem, ReportStatus } from "./types";

export const pageSize = 10;
export const statusCopy: Record<
	ReportStatus,
	{ label: string; tone: "green" | "amber" | "slate" }
> = {
	DRAFT: { label: "Draf", tone: "slate" },
	SUBMITTED: { label: "Menunggu ditinjau", tone: "amber" },
	IN_REVIEW: { label: "Sedang ditinjau", tone: "amber" },
	REVISION_REQUIRED: { label: "Perlu revisi", tone: "amber" },
	APPROVED: { label: "Siap diterbitkan", tone: "green" },
	PUBLISHED: { label: "Sudah diterbitkan", tone: "green" },
};

export function getReportDestination(item: ProgressItem) {
	if (!item.report_id) return null;
	if (!["DRAFT", "REVISION_REQUIRED"].includes(item.status ?? "")) return null;
	return {
		href: `/app/reports/${item.report_id}`,
		label: item.status === "REVISION_REQUIRED" ? "Lanjutkan revisi" : "Buka editor",
	};
}

export function getProgressCounts(items: ProgressItem[]): ProgressCounts {
	return {
		total: items.length,
		notCreated: items.filter((item) => !item.status).length,
		draft: items.filter((item) => item.status === "DRAFT" || item.status === "REVISION_REQUIRED")
			.length,
		review: items.filter((item) => ["SUBMITTED", "IN_REVIEW"].includes(item.status ?? "")).length,
		publish: items.filter((item) => item.status === "APPROVED").length,
		published: items.filter((item) => item.status === "PUBLISHED").length,
	};
}
