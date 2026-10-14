import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewQueueItem } from "./review-queue-item";
import type { ReviewReport } from "../types";

export type ReviewQueueProps = {
	error: boolean;
	loading: boolean;
	openRevisionFor?: string;
	queue: ReviewReport[];
	revisionNote: string;
	transitionPending: boolean;
	onApprove: (id: string) => void;
	onCancelRevision: () => void;
	onOpenRevision: (id: string) => void;
	onRetry: () => void;
	onRevisionNoteChange: (note: string) => void;
	onStartReview: (id: string) => void;
	onSubmitRevision: (id: string) => void;
};

export function ReviewQueue(props: ReviewQueueProps) {
	if (props.loading) return <Card>Memuat antrean raport…</Card>;
	if (props.error)
		return (
			<Card className="max-w-xl border-red-100">
				<p className="text-red-700">Antrean raport tidak dapat dimuat.</p>
				<Button className="mt-4" variant="secondary" onClick={props.onRetry}>
					Coba lagi
				</Button>
			</Card>
		);
	if (!props.queue.length)
		return (
			<Card className="py-12 text-center">
				<ClipboardCheck className="mx-auto size-9 text-brand-600" />
				<h2 className="mt-3 font-bold text-[#17251b]">Belum ada raport untuk ditinjau</h2>
				<p className="mt-1 text-sm leading-6 text-[#637065]">
					Raport yang dikirim guru akan muncul di sini.
				</p>
			</Card>
		);
	return (
		<div className="space-y-4">
			{props.queue.map((report) => (
				<ReviewQueueItem
					key={report.id}
					report={report}
					openRevision={props.openRevisionFor === report.id}
					pending={props.transitionPending}
					revisionNote={props.revisionNote}
					onApprove={() => props.onApprove(report.id)}
					onCancelRevision={props.onCancelRevision}
					onOpenRevision={() => props.onOpenRevision(report.id)}
					onRevisionNoteChange={props.onRevisionNoteChange}
					onStartReview={() => props.onStartReview(report.id)}
					onSubmitRevision={() => props.onSubmitRevision(report.id)}
				/>
			))}
		</div>
	);
}
