import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewQueueItem } from "./review-queue-item";
import type { ReviewReport } from "../types";

export type ReviewQueueProps = {
	error: boolean;
	loading: boolean;
	queue: ReviewReport[];
	onOpenDetail: (report: ReviewReport) => void;
	onRetry: () => void;
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
		<Card className="overflow-hidden p-0">
			<div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.8fr)_auto_auto] gap-3 border-b border-[#e7e9df] bg-[#f5f7f1] px-6 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#637065] sm:grid">
				<span>Murid</span>
				<span>Semester</span>
				<span>Status</span>
				<span className="text-right">Tindakan</span>
			</div>
			{props.queue.map((report) => (
				<ReviewQueueItem
					key={report.id}
					report={report}
					onOpenDetail={() => props.onOpenDetail(report)}
				/>
			))}
		</Card>
	);
}
