import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewStatus } from "./review-status";
import type { ReviewReport } from "../types";

type ReviewQueueItemProps = {
	report: ReviewReport;
	onOpenDetail: () => void;
};

export function ReviewQueueTableRow({ report, onOpenDetail }: ReviewQueueItemProps) {
	return (
		<tr className="border-b border-[#e7e7dc] transition-colors hover:bg-brand-50/35 last:border-0">
			<td className="px-5 py-4 sm:px-6">
				<p className="truncate font-semibold text-brand-950" title={report.student_name}>
					{report.student_name}
				</p>
				<p className="mt-1 text-xs text-[#637065]">Dikirim {submittedAt(report.submitted_at)}</p>
			</td>
			<td className="px-4 py-4 text-[#526156]">{report.semester_name}</td>
			<td className="px-4 py-4">
				<ReviewStatus status={report.status} />
			</td>
			<td className="px-5 py-4 text-right sm:px-6">
				<DetailButton onClick={onOpenDetail} />
			</td>
		</tr>
	);
}

export function ReviewQueueMobileItem({ report, onOpenDetail }: ReviewQueueItemProps) {
	return (
		<article className="rounded-2xl border border-[#e7e7dc] bg-white p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h2 className="truncate font-semibold text-brand-950">{report.student_name}</h2>
					<p className="mt-1 text-xs text-[#637065]">Dikirim {submittedAt(report.submitted_at)}</p>
				</div>
				<ReviewStatus status={report.status} />
			</div>
			<div className="mt-4 flex items-end justify-between gap-3 border-t border-[#edf0e8] pt-3">
				<p className="text-sm text-[#526156]">{report.semester_name}</p>
				<DetailButton onClick={onOpenDetail} />
			</div>
		</article>
	);
}

function DetailButton({ onClick }: { onClick: () => void }) {
	return (
		<Button variant="secondary" className="min-h-9 px-3" onClick={onClick}>
			<Eye className="size-4" />
			Detail
		</Button>
	);
}

function submittedAt(value: string | null) {
	if (!value) return "Belum tersedia";

	return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}
