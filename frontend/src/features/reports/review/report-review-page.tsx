"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { ParentAccessCard } from "./components/parent-access-card";
import { ReviewFeedback } from "./components/review-feedback";
import { ReviewQueue } from "./components/review-queue";
import type { PublishedReport, ReviewReport } from "./types";

export function ReportReviewPage() {
	const queryClient = useQueryClient();
	const [openRevisionFor, setOpenRevisionFor] = useState<string>();
	const [revisionNote, setRevisionNote] = useState("");
	const [notice, setNotice] = useState<string>();
	const [parentAccess, setParentAccess] = useState<{ link: string; pin: string }>();
	const session = useQuery({
		queryKey: ["session"],
		queryFn: () => api<{ role: string }>("/auth/session"),
	});
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
					? "Rapor mulai ditinjau."
					: variables.action === "approve"
						? "Rapor telah disetujui."
						: "Rapor dikembalikan untuk direvisi.",
			);
			setOpenRevisionFor(undefined);
			setRevisionNote("");
			queryClient.invalidateQueries({ queryKey: ["reports", "review-queue"] });
			queryClient.invalidateQueries({ queryKey: ["reports"] });
		},
	});
	const publish = useMutation({
		mutationFn: (id: string) => api<PublishedReport>(`/reports/${id}/publish`, { method: "POST" }),
		onSuccess: (published) => {
			setNotice("Rapor berhasil diterbitkan dan dikunci sebagai versi final.");
			setParentAccess(published.parentAccess);
			queryClient.invalidateQueries({ queryKey: ["reports"] });
			queryClient.invalidateQueries({ queryKey: ["reports", "review-queue"] });
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
				eyebrow="Rapor"
				title="Tinjauan rapor"
				description="Periksa rapor yang dikirim guru, minta revisi bila perlu, lalu setujui rapor yang sudah layak."
			/>
			{notice ? <ReviewFeedback tone="success">{notice}</ReviewFeedback> : null}
			{parentAccess ? <ParentAccessCard {...parentAccess} /> : null}
			{error ? <ReviewFeedback tone="error">{error}</ReviewFeedback> : null}
			<ReviewQueue
				canPublish={session.data?.role === "SCHOOL_ADMIN"}
				loading={reports.isLoading}
				error={reports.isError}
				queue={reports.data ?? []}
				openRevisionFor={openRevisionFor}
				publishPending={publish.isPending}
				revisionNote={revisionNote}
				transitionPending={transition.isPending}
				onRetry={() => void reports.refetch()}
				onApprove={(id) => transition.mutate({ id, action: "approve" })}
				onOpenRevision={(id) => {
					setOpenRevisionFor(openRevisionFor === id ? undefined : id);
					setRevisionNote("");
				}}
				onCancelRevision={() => {
					setOpenRevisionFor(undefined);
					setRevisionNote("");
				}}
				onPublish={(id) => publish.mutate(id)}
				onRevisionNoteChange={setRevisionNote}
				onStartReview={(id) => transition.mutate({ id, action: "review" })}
				onSubmitRevision={(id) => {
					const note = revisionNote.trim();
					if (note) transition.mutate({ id, action: "revision", note });
				}}
			/>
		</>
	);
}
