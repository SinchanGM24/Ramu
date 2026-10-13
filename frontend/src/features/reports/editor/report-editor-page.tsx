"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DevelopmentAreaCard } from "./components/development-area-card";
import { ReportEditorHeader } from "./components/report-editor-header";
import { ReportEditorProgressCard } from "./components/report-editor-progress-card";
import { ScaleGuide } from "./components/scale-guide";
import { SemesterDataForm } from "./components/semester-data-form";
import { useReportWorkspace } from "./hooks/use-report-workspace";
import { ReportCompletenessPanel } from "./report-completeness-panel";
import { getAreaProgress } from "./utils";

export function ReportEditorPage({ id }: { id: string }) {
	const { assessment, pendingScaleOptionIds, refresh, workspace } = useReportWorkspace(id);
	const [submissionFeedback, setSubmissionFeedback] = useState<{
		message: string;
		tone: "error" | "success";
	}>();

	useEffect(() => {
		if (!submissionFeedback) return;
		document.getElementById("report-submission-status")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, [submissionFeedback]);

	if (workspace.isLoading) return <Card>Memuat ruang kerja rapor…</Card>;
	if (!workspace.data) return <Card>Rapor tidak dapat dimuat.</Card>;

	const { areas, report, scales } = workspace.data;
	const editable = ["DRAFT", "REVISION_REQUIRED"].includes(report.status);
	const done = areas.reduce((sum, area) => sum + getAreaProgress(area).assessed, 0);
	const total = areas.reduce((sum, area) => sum + getAreaProgress(area).total, 0);
	const handleSubmitted = () => {
		setSubmissionFeedback({
			message: "Rapor berhasil dikirim untuk ditinjau Kepala Sekolah.",
			tone: "success",
		});
	};
	const handleSubmitFailed = (message: string) => {
		setSubmissionFeedback({ message, tone: "error" });
	};

	return (
		<>
			<ReportEditorHeader reportId={id} report={report} />
			<ReportCompletenessPanel
				feedback={submissionFeedback}
				onSubmitFailed={handleSubmitFailed}
				onSubmitted={handleSubmitted}
				reportId={id}
				reportStatus={report.status}
			/>
			<ReportEditorProgressCard done={done} total={total} status={report.status} />
			<ScaleGuide scales={scales} />
			<div className="mt-4 space-y-4">
				{areas.map((area, index) => (
					<DevelopmentAreaCard
						key={area.id}
						area={area}
						number={index + 1}
						scales={scales}
						editable={editable}
						savingIndicatorId={assessment.isPending ? assessment.variables?.indicatorId : undefined}
						pendingScaleOptionIds={pendingScaleOptionIds}
						onChoose={(indicatorId, scaleOptionId) =>
							assessment.mutate({ indicatorId, scaleOptionId })
						}
						reportId={id}
						refresh={refresh}
					/>
				))}
			</div>
			<div className="mt-4">
				<SemesterDataForm
					attendance={workspace.data.attendance}
					editable={editable}
					growth={workspace.data.growth}
					reportId={id}
					onSaved={refresh}
				/>
				<ReportCompletenessPanel
					compact
					onSubmitFailed={handleSubmitFailed}
					onSubmitted={handleSubmitted}
					reportId={id}
					reportStatus={report.status}
				/>
			</div>
		</>
	);
}
