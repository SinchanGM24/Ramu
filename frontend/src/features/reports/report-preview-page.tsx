"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { FormalAssessmentTable } from "./presentation/formal-assessment-table";
import { ReportScaleLegend } from "./presentation/report-scale-legend";
import { PublishedReportPage } from "./published-report-page";

type Data = {
	report: { student_name: string; student_number?: string | null; semester_name: string };
	areas: { id: string; name: string; narrative?: string | null }[];
	assessments: {
		area_id: string;
		sub_area_name: string;
		description: string;
		scale_code?: string | null;
	}[];
};

export function ReportPreviewPage({ id }: { id: string }) {
	const published = useQuery({
		queryKey: ["published-report", id],
		queryFn: () => api<unknown | null>(`/reports/${id}/published-version`),
	});
	const query = useQuery({
		queryKey: ["report-preview", id],
		queryFn: () => api<Data | null>(`/reports/${id}/editor`),
		enabled: published.isSuccess && !published.data,
	});
	if (published.isLoading) return <LoadingState label="Menyiapkan pratinjau raport..." />;
	if (published.isError) {
		const message =
			published.error instanceof ApiError
				? published.error.message
				: "Pratinjau raport tidak dapat dimuat. Coba lagi beberapa saat lagi.";

		return <PreviewError message={message} onRetry={() => void published.refetch()} />;
	}
	if (published.data) return <PublishedReportPage id={id} />;
	if (query.isLoading || !published.isSuccess) {
		return <LoadingState label="Menyiapkan pratinjau raport..." />;
	}
	if (query.isError) {
		const message =
			query.error instanceof ApiError
				? query.error.message
				: "Pratinjau raport tidak dapat dimuat. Coba lagi beberapa saat lagi.";

		return <PreviewError message={message} onRetry={() => void query.refetch()} />;
	}
	if (!query.data) {
		return (
			<EmptyState
				title="Data raport tidak ditemukan"
				description="Raport mungkin telah dihapus atau Anda tidak memiliki akses ke data ini."
			/>
		);
	}
	if (published.data) return <PublishedReportPage id={id} />;
	if (!query.data) return <Card className="text-sm text-[#68746a]">Memuat pratinjau raport…</Card>;
	const data = query.data;
	return (
		<>
			<div className="print:hidden">
				<PageHeader
					eyebrow="Pratinjau raport"
					title="Laporan Perkembangan Anak Didik"
					description="Dokumen baca-saja dengan tabel penilaian formal."
					action={
						<div className="flex gap-2">
							<Link
								href={`/app/reports/${id}`}
								className="rounded-xl border px-4 py-2 text-sm font-semibold"
							>
								Kembali
							</Link>
							<button
								onClick={() => window.print()}
								className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
							>
								Cetak
							</button>
						</div>
					}
				/>
			</div>
			<article className="mx-auto max-w-5xl bg-white p-5 shadow-soft print:max-w-none print:p-0 print:shadow-none sm:p-8">
				<header className="border-b-2 border-slate-700 pb-4 text-center">
					<h1 className="text-xl font-bold uppercase">Laporan Perkembangan Anak Didik</h1>
					<p className="mt-2 text-sm">
						Nama: <b>{data.report.student_name}</b> · Nomor induk:{" "}
						{data.report.student_number || "-"} · {data.report.semester_name}
					</p>
				</header>
				<ReportScaleLegend />
				{data.areas.map((area, index) => (
					<section key={area.id} className="mt-7">
						<h2 className="border border-slate-500 bg-slate-100 px-3 py-2 font-bold uppercase">
							{["I", "II", "III", "IV", "V", "VI"][index]}. {area.name}
						</h2>
						<FormalAssessmentTable
							items={data.assessments.filter((item) => item.area_id === area.id)}
						/>
						<div className="border border-t-0 border-slate-500 p-3 text-sm">
							<b>Narasi perkembangan</b>
							<p className="mt-2 whitespace-pre-wrap">{area.narrative || "-"}</p>
						</div>
					</section>
				))}
			</article>
		</>
	);
}

function PreviewError({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<Card className="max-w-xl border-red-200 bg-red-50 text-sm text-red-800">
			<p className="font-semibold">Pratinjau raport tidak tersedia</p>
			<p className="mt-1 leading-6">{message}</p>
			<Button className="mt-4" variant="secondary" onClick={onRetry}>
				Coba lagi
			</Button>
		</Card>
	);
}
