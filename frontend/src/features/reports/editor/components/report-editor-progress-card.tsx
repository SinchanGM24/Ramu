import { Card } from "@/components/ui/card";
import { reportStatusLabels } from "../utils";

type ReportEditorProgressCardProps = { done: number; status: string; total: number };

export function ReportEditorProgressCard({ done, status, total }: ReportEditorProgressCardProps) {
	return (
		<Card className="mb-5 border-brand-100 bg-[linear-gradient(112deg,#f4f7ed_0%,#fffdf8_62%,#eef5ec_100%)]">
			<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
				Progress raport
			</p>
			<p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#17251b]">
				{total ? Math.round((done / total) * 100) : 0}% selesai
			</p>
			<p className="mt-1 text-sm text-[#637065]">
				{done}/{total} indikator dinilai · {reportStatusLabels[status]}
			</p>
		</Card>
	);
}
