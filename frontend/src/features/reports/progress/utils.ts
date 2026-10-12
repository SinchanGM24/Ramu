import type { ProgressCounts, ProgressFilter, ProgressItem, ReportStatus } from "./types";

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

export function matchesProgressFilter(item: ProgressItem, filter: ProgressFilter) {
	if (filter === "ALL") return true;
	if (filter === "NOT_CREATED") return !item.status;
	if (filter === "WORKING") return item.status === "DRAFT" || item.status === "REVISION_REQUIRED";
	return item.status === filter;
}

export function getReportDestination(item: ProgressItem) {
	if (!item.report_id) return null;
	if (["SUBMITTED", "IN_REVIEW", "APPROVED"].includes(item.status ?? "")) {
		return { href: "/app/reports/review", label: "Buka tinjauan" };
	}
	if (item.status === "PUBLISHED")
		return { href: `/app/reports/${item.report_id}/preview`, label: "Lihat rapor" };
	return {
		href: `/app/reports/${item.report_id}`,
		label: item.status === "REVISION_REQUIRED" ? "Lanjutkan revisi" : "Buka editor",
	};
}

export function getProgressCounts(items: ProgressItem[]): ProgressCounts {
	return {
		total: items.length,
		draft: items.filter(
			(item) => !item.status || item.status === "DRAFT" || item.status === "REVISION_REQUIRED",
		).length,
		review: items.filter((item) => ["SUBMITTED", "IN_REVIEW"].includes(item.status ?? "")).length,
		publish: items.filter((item) => item.status === "APPROVED").length,
		published: items.filter((item) => item.status === "PUBLISHED").length,
	};
}
