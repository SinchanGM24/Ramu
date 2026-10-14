"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Completeness = {
	complete: boolean;
	missingAssessments: string[];
	missingNarratives: string[];
	missingSemesterData: boolean;
};

type ReportCompletenessPanelProps = {
	compact?: boolean;
	feedback?: { message: string; tone: "error" | "success" };
	onSubmitFailed?: (message: string) => void;
	onSubmitted?: () => void;
	reportStatus: string;
	reportId: string;
};

export function ReportCompletenessPanel({
	compact = false,
	feedback,
	onSubmitFailed,
	onSubmitted,
	reportStatus,
	reportId,
}: ReportCompletenessPanelProps) {
	const queryClient = useQueryClient();
	const completeness = useQuery({
		queryKey: ["report-completeness", reportId],
		queryFn: () => api<Completeness>(`/reports/${reportId}/completeness`),
	});
	const submit = useMutation({
		mutationFn: () => api(`/reports/${reportId}/workspace/submit`, { method: "POST" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["report-completeness", reportId] });
			queryClient.invalidateQueries({ queryKey: ["report-workspace", reportId] });
			onSubmitted?.();
		},
		onError: (error) => {
			onSubmitFailed?.(
				error instanceof Error ? error.message : "Raport tidak dapat dikirim. Coba lagi.",
			);
		},
	});
	if (completeness.isLoading) {
		return compact ? null : (
			<Card className="mb-4 text-sm text-slate-500">Memeriksa kelengkapan raport…</Card>
		);
	}
	if (completeness.isError || !completeness.data) return null;
	const data = completeness.data;
	const missing = [
		...data.missingAssessments.map((item) => `Penilaian: ${item}`),
		...data.missingNarratives.map((item) => `Narasi: ${item}`),
		...(data.missingSemesterData ? ["Data kehadiran"] : []),
	];
	const submitted = reportStatus === "SUBMITTED";

	function goToFirstMissingField() {
		const selector = data.missingAssessments.length
			? "[data-report-missing-assessment='true']"
			: data.missingNarratives.length
				? "[data-report-missing-narrative='true']"
				: "[data-report-semester-data='true'] input";
		const target = document.querySelector<HTMLElement>(selector);

		if (!target) return;
		target.closest("details")?.setAttribute("open", "");
		target.scrollIntoView({ behavior: "smooth", block: "center" });
		window.setTimeout(() => target.focus({ preventScroll: true }), 300);
	}

	function handleSubmit() {
		if (!data.complete) {
			goToFirstMissingField();
			return;
		}
		submit.mutate();
	}

	if (compact) {
		if (submitted) return null;
		return (
			<div className="mt-6 flex justify-end border-t border-[#e7e9df] pt-5">
				<Button disabled={submit.isPending} onClick={handleSubmit}>
					{submit.isPending ? "Mengirim…" : "Kirim untuk ditinjau"}
				</Button>
			</div>
		);
	}

	return (
		<Card
			id="report-submission-status"
			className={`mb-5 ${data.complete ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-3">
					<span className={data.complete ? "text-emerald-700" : "text-amber-700"}>
						{data.complete ? <CheckCircle2 /> : <CircleAlert />}
					</span>
					<div>
						<h2 className="font-bold text-[#17251b]">
							{submitted
								? "Raport telah dikirim untuk ditinjau"
								: data.complete
									? "Raport siap dikirim untuk ditinjau"
									: "Raport belum lengkap"}
						</h2>
						<p className="mt-1 text-sm leading-6 text-[#526156]">
							{submitted
								? "Raport menunggu tinjauan Kepala Sekolah."
								: data.complete
									? "Semua indikator, narasi, dan data akhir semester sudah tersedia."
									: "Lengkapi data berikut sebelum mengirim raport."}
						</p>
						{!data.complete && (
							<ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
								{missing.slice(0, 5).map((item) => (
									<li key={item}>{item}</li>
								))}
								{missing.length > 5 && <li>dan {missing.length - 5} data lainnya</li>}
							</ul>
						)}
					</div>
				</div>
				{!submitted ? (
					<Button disabled={submit.isPending} onClick={handleSubmit}>
						{submit.isPending ? "Mengirim…" : "Kirim untuk ditinjau"}
					</Button>
				) : null}
			</div>
			{feedback ? (
				<p
					role={feedback.tone === "error" ? "alert" : "status"}
					className={`mt-3 text-sm font-medium ${feedback.tone === "error" ? "text-red-700" : "text-emerald-700"}`}
				>
					{feedback.message}
				</p>
			) : null}
		</Card>
	);
}
