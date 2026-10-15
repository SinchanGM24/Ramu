import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { RevisionRequestForm } from "./revision-request-form";
import { ReviewStatus } from "./review-status";
import type { ReviewReport } from "../types";

type ReviewDetailDialogProps = {
	error?: string;
	pending: boolean;
	report: ReviewReport;
	revisionNote: string;
	onApprove: () => void;
	onClose: () => void;
	onNoteChange: (note: string) => void;
	onRequestRevision: () => void;
	onStartReview: () => void;
};

export function ReviewDetailDialog({
	error,
	pending,
	report,
	revisionNote,
	onApprove,
	onClose,
	onNoteChange,
	onRequestRevision,
	onStartReview,
}: ReviewDetailDialogProps) {
	return (
		<ModalDialog
			labelledBy="review-detail-dialog-title"
			eyebrow="Tinjauan raport"
			title={`Tinjau ${report.student_name}`}
			description="Periksa ringkasan terlebih dahulu, lalu buka raport lengkap bila diperlukan."
			onClose={onClose}
			closeOnBackdrop={!pending}
			closeOnEscape={!pending}
			contentClassName="mx-auto my-8 w-full max-w-2xl rounded-3xl border border-[#e2e6dc] bg-[#fffefa] p-5 shadow-2xl sm:p-6"
			bodyClassName="mt-6"
		>
			{error ? (
				<p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800">
					{error}
				</p>
			) : null}
			<section className="grid gap-3 rounded-2xl border border-[#e5e9df] bg-[#f7f9f3] p-4 sm:grid-cols-3">
				<SummaryItem label="Murid" value={report.student_name} />
				<SummaryItem label="Semester" value={report.semester_name} />
				<SummaryItem label="Status" value={<ReviewStatus status={report.status} />} />
				<div className="sm:col-span-3">
					<SummaryItem label="Dikirim untuk ditinjau" value={submittedAt(report.submitted_at)} />
				</div>
			</section>

			<Link href={`/app/reports/${report.id}/preview?from=review`} className="mt-4 inline-flex">
				<Button variant="secondary">
					<ExternalLink className="size-4" />
					Buka raport lengkap
				</Button>
			</Link>

			{report.status === "SUBMITTED" ? (
				<div className="mt-6 flex justify-end border-t border-[#e7e9df] pt-5">
					<Button disabled={pending} onClick={onStartReview}>
						Mulai tinjau
					</Button>
				</div>
			) : (
				<div className="mt-6 border-t border-[#e7e9df] pt-5">
					<p className="text-sm leading-6 text-[#637065]">
						Setujui bila seluruh isi sudah layak diterbitkan. Bila ada perbaikan, tuliskan alasan
						revisi agar guru dapat menindaklanjutinya.
					</p>
					<RevisionRequestForm
						note={revisionNote}
						pending={pending}
						onCancel={onClose}
						onNoteChange={onNoteChange}
						onSubmit={onRequestRevision}
					/>
					<div className="mt-4 flex justify-end">
						<Button disabled={pending} onClick={onApprove}>
							<Check className="size-4" />
							Setujui raport
						</Button>
					</div>
				</div>
			)}
		</ModalDialog>
	);
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6c776e]">{label}</p>
			<div className="mt-1 text-sm font-semibold text-[#17251b]">{value}</div>
		</div>
	);
}

function submittedAt(value: string | null) {
	if (!value) return "Belum tersedia";
	return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
		new Date(value),
	);
}
