import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { RevisionRequestForm } from "./revision-request-form";
import type { ReviewReport } from "../types";

const status: Record<ReviewReport["status"], { label: string; tone: "green" | "amber" | "slate" }> =
	{
		SUBMITTED: { label: "Menunggu ditinjau", tone: "amber" },
		IN_REVIEW: { label: "Sedang ditinjau", tone: "amber" },
	};

type ReviewQueueItemProps = {
	openRevision: boolean;
	pending: boolean;
	report: ReviewReport;
	revisionNote: string;
	onApprove: () => void;
	onOpenRevision: () => void;
	onRevisionNoteChange: (note: string) => void;
	onStartReview: () => void;
	onSubmitRevision: () => void;
	onCancelRevision: () => void;
};

export function ReviewQueueItem({
	openRevision,
	pending,
	report,
	revisionNote,
	onApprove,
	onCancelRevision,
	onOpenRevision,
	onRevisionNoteChange,
	onStartReview,
	onSubmitRevision,
}: ReviewQueueItemProps) {
	return (
		<Card className="border-[#e5e7dc] bg-[#fffefa]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-bold text-[#17251b]">{report.student_name}</h2>
						<StatusBadge tone={status[report.status].tone}>
							{status[report.status].label}
						</StatusBadge>
					</div>
					<p className="mt-1 text-sm text-[#637065]">
						{report.semester_name} · Dikirim {submittedAt(report.submitted_at)}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{report.status === "SUBMITTED" ? (
						<Button disabled={pending} onClick={onStartReview}>
							Mulai tinjau
						</Button>
					) : null}
					{report.status === "IN_REVIEW" ? (
						<>
							<Button disabled={pending} variant="secondary" onClick={onOpenRevision}>
								<RotateCcw className="mr-1 size-4" />
								Minta revisi
							</Button>
							<Button disabled={pending} onClick={onApprove}>
								<Check className="mr-1 size-4" />
								Setujui raport
							</Button>
						</>
					) : null}
				</div>
			</div>
			{openRevision ? (
				<RevisionRequestForm
					note={revisionNote}
					pending={pending}
					onCancel={onCancelRevision}
					onNoteChange={onRevisionNoteChange}
					onSubmit={onSubmitRevision}
				/>
			) : null}
		</Card>
	);
}

function submittedAt(value: string | null) {
	if (!value) return "Belum tersedia";
	return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
		new Date(value),
	);
}
