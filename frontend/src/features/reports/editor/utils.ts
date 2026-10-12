import type { ReportArea } from "./types";

export const reportStatusLabels: Record<string, string> = {
	DRAFT: "Draf",
	SUBMITTED: "Dikirim",
	IN_REVIEW: "Sedang ditinjau",
	REVISION_REQUIRED: "Perlu revisi",
	APPROVED: "Disetujui",
	PUBLISHED: "Diterbitkan",
};

export function getAreaProgress(area: ReportArea) {
	const indicators = area.subAreas.flatMap((item) => item.indicators);
	return {
		total: indicators.length,
		assessed: indicators.filter((item) => item.scaleOptionId).length,
	};
}
