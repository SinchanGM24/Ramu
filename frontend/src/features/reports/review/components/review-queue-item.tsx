import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewStatus } from "./review-status";
import type { ReviewReport } from "../types";

type ReviewQueueItemProps = {
	report: ReviewReport;
	onOpenDetail: () => void;
};

export function ReviewQueueItem({ report, onOpenDetail }: ReviewQueueItemProps) {
	return (
		<article className="grid gap-3 border-b border-[#edf0e8] px-5 py-4 last:border-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.8fr)_auto_auto] sm:items-center sm:px-6">
			<div className="min-w-0">
				<h2 className="truncate font-semibold text-[#17251b]" title={report.student_name}>
					{report.student_name}
				</h2>
				<p className="mt-1 text-xs text-[#637065]">Dikirim {submittedAt(report.submitted_at)}</p>
			</div>
			<p className="text-sm text-[#526156]">{report.semester_name}</p>
			<ReviewStatus status={report.status} />
			<div className="sm:text-right">
				<Button variant="secondary" className="min-h-9 px-3" onClick={onOpenDetail}>
					<Eye className="size-4" />
					Detail
				</Button>
			</div>
		</article>
	);
}

function submittedAt(value: string | null) {
	if (!value) return "Belum tersedia";

	return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}
