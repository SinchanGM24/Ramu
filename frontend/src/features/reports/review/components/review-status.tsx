import { StatusBadge } from "@/components/shared/status-badge";
import type { ReviewReport } from "../types";

const statusCopy: Record<ReviewReport["status"], { label: string; tone: "amber" }> = {
	SUBMITTED: { label: "Menunggu ditinjau", tone: "amber" },
	IN_REVIEW: { label: "Sedang ditinjau", tone: "amber" },
};

export function ReviewStatus({ status }: { status: ReviewReport["status"] }) {
	const copy = statusCopy[status];
	return <StatusBadge tone={copy.tone}>{copy.label}</StatusBadge>;
}
