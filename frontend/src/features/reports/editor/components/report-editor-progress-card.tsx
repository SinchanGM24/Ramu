import { Card } from "@/components/ui/card";
import { reportStatusLabels } from "../utils";

type ReportEditorProgressCardProps = { done: number; status: string; total: number };

export function ReportEditorProgressCard({ done, status, total }: ReportEditorProgressCardProps) {
	return (
		<Card className="mb-4">
			<p className="text-sm font-semibold text-brand-700">Progress rapor</p>
			<p className="mt-1 text-2xl font-bold">
				{total ? Math.round((done / total) * 100) : 0}% selesai
			</p>
			<p className="text-sm text-slate-600">
				{done}/{total} indikator dinilai · {reportStatusLabels[status]}
			</p>
		</Card>
	);
}
