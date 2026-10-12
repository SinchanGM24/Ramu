import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewQueueItem } from "./review-queue-item";
import type { ReviewReport } from "../types";

export type ReviewQueueProps = {
	canPublish: boolean;
	error: boolean;
	loading: boolean;
	openRevisionFor?: string;
	publishPending: boolean;
	queue: ReviewReport[];
	revisionNote: string;
	transitionPending: boolean;
	onApprove: (id: string) => void;
	onCancelRevision: () => void;
	onOpenRevision: (id: string) => void;
	onPublish: (id: string) => void;
	onRetry: () => void;
	onRevisionNoteChange: (note: string) => void;
	onStartReview: (id: string) => void;
	onSubmitRevision: (id: string) => void;
};

export function ReviewQueue(props: ReviewQueueProps) {
	if (props.loading) return <Card>Memuat antrean rapor…</Card>;
	if (props.error)
		return (
			<Card>
				<p className="text-red-700">Antrean rapor tidak dapat dimuat.</p>
				<Button className="mt-4" variant="secondary" onClick={props.onRetry}>
					Coba lagi
				</Button>
			</Card>
		);
	if (!props.queue.length)
		return (
			<Card className="py-10 text-center">
				<ClipboardCheck className="mx-auto size-9 text-brand-600" />
				<h2 className="mt-3 font-bold text-slate-900">Belum ada rapor untuk ditinjau</h2>
				<p className="mt-1 text-sm text-slate-500">Rapor yang dikirim guru akan muncul di sini.</p>
			</Card>
		);
	return (
		<div className="space-y-4">
			{props.queue.map((report) => (
				<ReviewQueueItem
					key={report.id}
					report={report}
					canPublish={props.canPublish}
					openRevision={props.openRevisionFor === report.id}
					pending={props.transitionPending}
					publishPending={props.publishPending}
					revisionNote={props.revisionNote}
					onApprove={() => props.onApprove(report.id)}
					onCancelRevision={props.onCancelRevision}
					onOpenRevision={() => props.onOpenRevision(report.id)}
					onPublish={() => props.onPublish(report.id)}
					onRevisionNoteChange={props.onRevisionNoteChange}
					onStartReview={() => props.onStartReview(report.id)}
					onSubmitRevision={() => props.onSubmitRevision(report.id)}
				/>
			))}
		</div>
	);
}
