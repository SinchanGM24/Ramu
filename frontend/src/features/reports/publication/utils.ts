import type { PublicationReport } from "./types";

export function isActiveCorrection(report: PublicationReport) {
	return (
		Boolean(report.latest_published_version_number) &&
		["DRAFT", "REVISION_REQUIRED"].includes(report.status)
	);
}
