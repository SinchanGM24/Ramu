"use client";

import { useEffect, useState } from "react";
import { FileWarning } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { DevelopmentAreaCard } from "./components/development-area-card";
import { ReportEditorHeader } from "./components/report-editor-header";
import { ReportEditorProgressCard } from "./components/report-editor-progress-card";
import { ScaleGuide } from "./components/scale-guide";
import { SemesterDataForm } from "./components/semester-data-form";
import { useReportWorkspace } from "./hooks/use-report-workspace";
import { ReportCompletenessPanel } from "./report-completeness-panel";
import { getAreaProgress } from "./utils";
import { ReportRevisionNote } from "../components/report-revision-note";

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

	if (workspace.isLoading) return <LoadingState label="Memuat ruang kerja raport..." />;
	if (!workspace.data) {
		return (
			<EmptyState
				icon={FileWarning}
				title="Raport tidak dapat dimuat"
				description="Coba muat ulang halaman. Jika masalah berlanjut, pastikan Anda memiliki akses ke raport ini."
			/>
		);
	}

	const { areas, report, scales } = workspace.data;
	const editable = ["DRAFT", "REVISION_REQUIRED"].includes(report.status);
	const done = areas.reduce((sum, area) => sum + getAreaProgress(area).assessed, 0);
	const total = areas.reduce((sum, area) => sum + getAreaProgress(area).total, 0);
	const handleSubmitted = () => {
		setSubmissionFeedback({
			message: "Raport berhasil dikirim untuk ditinjau Kepala Sekolah.",
			tone: "success",
		});
	};
	const handleSubmitFailed = (message: string) => {
		setSubmissionFeedback({ message, tone: "error" });
	};

	return (
		<>
			<ReportEditorHeader reportId={id} report={report} />
			{report.status === "REVISION_REQUIRED" ? (
				<ReportRevisionNote note={report.revision_note} />
			) : null}
			<ReportCompletenessPanel
				feedback={submissionFeedback}
				onSubmitFailed={handleSubmitFailed}
				onSubmitted={handleSubmitted}
				reportId={id}
				reportStatus={report.status}
			/>
			<ReportEditorProgressCard done={done} total={total} status={report.status} />
			<ScaleGuide scales={scales} />
			<div className="mt-6 space-y-5">
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
			<div className="mt-5">
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
