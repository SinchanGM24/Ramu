"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { ReviewDetailDialog } from "./components/review-detail-dialog";
import { ReviewFeedback } from "./components/review-feedback";
import { ReviewQueue } from "./components/review-queue";
import type { ReviewReport } from "./types";

export function ReportReviewPage() {
	const queryClient = useQueryClient();
	const [selectedReport, setSelectedReport] = useState<ReviewReport>();
	const [revisionNote, setRevisionNote] = useState("");
	const [notice, setNotice] = useState<string>();
	const reports = useQuery({
		queryKey: ["reports", "review-queue"],
		queryFn: () => api<ReviewReport[]>("/reports/review-queue"),
	});
	const transition = useMutation({
		mutationFn: ({
			id,
			action,
			note,
		}: {
			id: string;
			action: "review" | "revision" | "approve";
			note?: string;
		}) =>
			api(`/reports/${id}/transition`, { method: "POST", body: JSON.stringify({ action, note }) }),
		onSuccess: (_, variables) => {
			setNotice(
				variables.action === "review"
					? "Raport mulai ditinjau."
					: variables.action === "approve"
						? "Raport telah disetujui."
						: "Raport dikembalikan untuk direvisi.",
			);
			if (variables.action === "review") {
				setSelectedReport((current) =>
					current?.id === variables.id ? { ...current, status: "IN_REVIEW" } : current,
				);
			} else {
				setSelectedReport(undefined);
			}
			setRevisionNote("");
			queryClient.invalidateQueries({ queryKey: ["reports", "review-queue"] });
			queryClient.invalidateQueries({ queryKey: ["reports"] });
		},
	});
	const error =
		transition.error instanceof ApiError
			? transition.error.message
			: transition.error
				? "Tindakan tidak dapat diproses. Coba lagi."
				: undefined;
	return (
		<>
			<PageHeader
				eyebrow="Raport"
				title="Tinjauan raport"
				description="Periksa raport yang dikirim guru, minta revisi bila perlu, lalu setujui raport yang sudah layak diterbitkan."
			/>
			{notice ? <ReviewFeedback tone="success">{notice}</ReviewFeedback> : null}
			{error ? <ReviewFeedback tone="error">{error}</ReviewFeedback> : null}
			<ReviewQueue
				loading={reports.isLoading}
				error={reports.isError}
				queue={reports.data ?? []}
				onRetry={() => void reports.refetch()}
				onOpenDetail={(report) => {
					transition.reset();
					setSelectedReport(report);
					setRevisionNote("");
				}}
			/>
			{selectedReport ? (
				<ReviewDetailDialog
					error={error}
					pending={transition.isPending}
					report={selectedReport}
					revisionNote={revisionNote}
					onClose={() => {
						if (transition.isPending) return;
						transition.reset();
						setSelectedReport(undefined);
						setRevisionNote("");
					}}
					onNoteChange={setRevisionNote}
					onStartReview={() => transition.mutate({ id: selectedReport.id, action: "review" })}
					onApprove={() => transition.mutate({ id: selectedReport.id, action: "approve" })}
					onRequestRevision={() => {
						const note = revisionNote.trim();
						if (note) transition.mutate({ id: selectedReport.id, action: "revision", note });
					}}
				/>
			) : null}
		</>
	);
}
