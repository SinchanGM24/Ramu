"use client";

import { type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { ParentAccessCard } from "./components/parent-access-card";
import { ReviewQueueItem } from "./components/review-queue-item";
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
	const queue = reports.data ?? [];
	const canPublish = session.data?.role === "SCHOOL_ADMIN";

	function submitRevision(id: string) {
		const note = revisionNote.trim();
		if (note) transition.mutate({ id, action: "revision", note });
	}

	return (
		<>
			<PageHeader
				eyebrow="Rapor"
				title="Tinjauan rapor"
				description="Periksa rapor yang dikirim guru, minta revisi bila perlu, lalu setujui rapor yang sudah layak."
			/>
			{notice ? <Feedback tone="success">{notice}</Feedback> : null}
			{parentAccess ? <ParentAccessCard {...parentAccess} /> : null}
			{error ? <Feedback tone="error">{error}</Feedback> : null}
			<ReviewQueue
				canPublish={canPublish}
				loading={reports.isLoading}
				error={reports.isError}
				queue={queue}
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
				onSubmitRevision={submitRevision}
			/>
		</>
	);
}

function ReviewQueue({
	canPublish,
	error,
	loading,
	openRevisionFor,
	publishPending,
	queue,
	revisionNote,
	transitionPending,
	onApprove,
	onCancelRevision,
	onOpenRevision,
	onPublish,
	onRetry,
	onRevisionNoteChange,
	onStartReview,
	onSubmitRevision,
}: {
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
}) {
	if (loading) return <Card>Memuat antrean rapor…</Card>;
	if (error) {
		return (
			<Card>
				<p className="text-red-700">Antrean rapor tidak dapat dimuat.</p>
				<Button className="mt-4" variant="secondary" onClick={onRetry}>
					Coba lagi
				</Button>
			</Card>
		);
	}
	if (!queue.length) {
		return (
			<Card className="py-10 text-center">
				<ClipboardCheck className="mx-auto size-9 text-brand-600" />
				<h2 className="mt-3 font-bold text-slate-900">Belum ada rapor untuk ditinjau</h2>
				<p className="mt-1 text-sm text-slate-500">Rapor yang dikirim guru akan muncul di sini.</p>
			</Card>
		);
	}
	return (
		<div className="space-y-4">
			{queue.map((report) => (
				<ReviewQueueItem
					key={report.id}
					report={report}
					canPublish={canPublish}
					openRevision={openRevisionFor === report.id}
					pending={transitionPending}
					publishPending={publishPending}
					revisionNote={revisionNote}
					onApprove={() => onApprove(report.id)}
					onCancelRevision={onCancelRevision}
					onOpenRevision={() => onOpenRevision(report.id)}
					onPublish={() => onPublish(report.id)}
					onRevisionNoteChange={onRevisionNoteChange}
					onStartReview={() => onStartReview(report.id)}
					onSubmitRevision={() => onSubmitRevision(report.id)}
				/>
			))}
		</div>
	);
}

function Feedback({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
	return (
		<div
			role={tone === "error" ? "alert" : "status"}
			className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
		>
			{children}
		</div>
	);
}
