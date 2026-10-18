export type ReportNavigationOrigin = "deliveries" | "editor" | "publication" | "review" | "student";

type ReturnTargetInput = {
	from?: string | null;
	reportId: string;
	returnTo?: string | null;
	studentId?: string | null;
};

export function reportPreviewHref(
	reportId: string,
	from: ReportNavigationOrigin,
	options: { returnTo?: "publication"; studentId?: string } = {},
) {
	const params = new URLSearchParams({ from });
	if (options.returnTo === "publication") params.set("returnTo", "publication");
	if (options.studentId) params.set("studentId", options.studentId);

	return `/app/reports/${reportId}/preview?${params.toString()}`;
}

export function getReportReturnTarget({ from, reportId, returnTo, studentId }: ReturnTargetInput) {
	if (from === "review") {
		return { href: "/app/reports/review", label: "Kembali ke tinjauan" };
	}
	if (from === "publication") {
		return { href: "/app/reports/publication", label: "Kembali ke publikasi" };
	}
	if (from === "deliveries") {
		const query = returnTo === "publication" ? "?from=publication" : "";
		return { href: `/app/reports/${reportId}/deliveries${query}`, label: "Kembali ke pengiriman" };
	}
	if (from === "student" && studentId) {
		return { href: `/app/academic/students/${studentId}`, label: "Kembali ke profil murid" };
	}

	return { href: `/app/reports/${reportId}`, label: "Kembali ke raport" };
}
