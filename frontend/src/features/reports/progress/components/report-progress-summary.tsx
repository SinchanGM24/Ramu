import { CheckCircle2, ClipboardCheck, FilePenLine, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProgressCounts } from "../types";

export function ReportProgressSummary({ counts }: { counts: ProgressCounts }) {
	const cards = [
		{
			icon: <FilePenLine className="size-5" />,
			label: "Sedang dikerjakan",
			value: counts.draft,
			description: "Draf atau perlu revisi",
		},
		{
			icon: <ClipboardCheck className="size-5" />,
			label: "Perlu ditinjau",
			value: counts.review,
			description: "Menunggu tindakan peninjau",
		},
		{
			icon: <Send className="size-5" />,
			label: "Siap diterbitkan",
			value: counts.publish,
			description: "Sudah disetujui",
		},
		{
			icon: <CheckCircle2 className="size-5" />,
			label: "Sudah diterbitkan",
			value: counts.published,
			description: "Versi rapor telah dikunci",
		},
	];
	return (
		<div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.label} className="p-4">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-sm font-medium text-slate-600">{card.label}</p>
							<p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
							<p className="mt-1 text-xs text-slate-500">{card.description}</p>
						</div>
						<span className="rounded-xl bg-brand-50 p-2.5 text-brand-700">{card.icon}</span>
					</div>
				</Card>
			))}
		</div>
	);
}
