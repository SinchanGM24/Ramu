import { CheckCircle2, ChevronDown, Circle, CircleDot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NarrativeEditor } from "./narrative-editor";
import { ReportAssessmentTable } from "./report-assessment-table";
import type { ReportArea, ReportScale } from "../types";
import { getAreaProgress } from "../utils";

type DevelopmentAreaCardProps = {
	area: ReportArea;
	editable: boolean;
	number: number;
	onChoose: (indicatorId: string, scaleOptionId: string) => void;
	pendingScaleOptionIds: Record<string, string>;
	reportId: string;
	refresh: () => void;
	savingIndicatorId?: string;
	scales: ReportScale[];
};

export function DevelopmentAreaCard({
	area,
	editable,
	number,
	onChoose,
	pendingScaleOptionIds,
	reportId,
	refresh,
	savingIndicatorId,
	scales,
}: DevelopmentAreaCardProps) {
	const progress = getAreaProgress(area);
	const complete = progress.assessed === progress.total;

	return (
		<Card>
			<div className="flex justify-between gap-3">
				<div>
					<p className="text-xs font-bold text-brand-700">{number}. ASPEK PERKEMBANGAN</p>
					<h2 className="mt-1 text-lg font-bold">{area.name}</h2>
					<p className="text-sm text-slate-500">
						{progress.assessed}/{progress.total} indikator dinilai
					</p>
				</div>
				{complete && area.narrative ? (
					<CheckCircle2 className="text-emerald-600" />
				) : progress.assessed ? (
					<CircleDot className="text-amber-600" />
				) : (
					<Circle className="text-slate-400" />
				)}
			</div>
			{area.subAreas.map((subArea, index) => (
				<details
					key={subArea.id}
					open={index === 0}
					className="mt-4 overflow-hidden rounded-xl border"
				>
					<summary className="flex cursor-pointer list-none justify-between bg-slate-50 p-4 font-semibold">
						{subArea.name}
						<ChevronDown className="size-4" />
					</summary>
					<div className="border-t">
						<ReportAssessmentTable
							subArea={subArea}
							scales={scales}
							editable={editable}
							savingIndicatorId={savingIndicatorId}
							pendingScaleOptionIds={pendingScaleOptionIds}
							onChoose={onChoose}
						/>
					</div>
				</details>
			))}
			<NarrativeEditor
				reportId={reportId}
				area={area}
				editable={editable}
				complete={complete}
				refresh={refresh}
			/>
		</Card>
	);
}
