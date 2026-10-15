"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileWarning } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { api } from "@/lib/api";
import { FormalAssessmentTable } from "./presentation/formal-assessment-table";
import { ReportScaleLegend } from "./presentation/report-scale-legend";

type SnapshotAssessment = {
	area_name: string;
	sub_area_name?: string;
	description: string;
	code?: string | null;
};
type SnapshotNarrative = { name: string; content: string };
type Snapshot = {
	school?: { name?: string; address?: string | null; logo_storage_key?: string | null };
	student?: { name?: string; student_number?: string | null; class_name?: string | null };
	semester?: { name?: string; academic_year_name?: string };
	assessments?: SnapshotAssessment[];
	narratives?: SnapshotNarrative[];
	growth?: { weight_kg?: number | null; height_cm?: number | null } | null;
	attendance?: {
		sick_days?: number | null;
		permission_days?: number | null;
		unexcused_days?: number | null;
	} | null;
};
type PublishedVersion = {
	id: string;
	version_number: number;
	published_at: string;
	snapshot: Snapshot;
};

export function PublishedReportPage({
	id,
	returnTarget = { href: "/app/academic/students", label: "Kembali ke data murid" },
}: {
	id: string;
	returnTarget?: { href: string; label: string };
}) {
	const query = useQuery({
		queryKey: ["published-report", id],
		queryFn: () => api<PublishedVersion | null>(`/reports/${id}/published-version`),
	});
	if (query.isLoading) return <LoadingState label="Memuat raport terbit..." />;
	if (!query.data)
		return (
			<EmptyState
				className="max-w-xl"
				icon={FileWarning}
				title="Raport terbit tidak ditemukan"
				description="Raport ini belum pernah diterbitkan atau Anda tidak memiliki akses."
			/>
		);
	const { snapshot, version_number: versionNumber, published_at: publishedAt } = query.data;
	const assessments = snapshot.assessments ?? [];
	const areas = [...new Set(assessments.map((assessment) => assessment.area_name))];
	const narratives = new Map(
		(snapshot.narratives ?? []).map((narrative) => [narrative.name, narrative.content]),
	);
	const publishedDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
		new Date(publishedAt),
	);
	const logoUrl = snapshot.school?.logo_storage_key
		? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/api/reports/${id}/published-logo`
		: null;
	return (
		<>
			<div className="print:hidden">
				<PageHeader
					eyebrow="Raport terbit"
					title="Laporan Perkembangan Anak Didik"
					description={`Versi ${versionNumber} diterbitkan pada ${publishedDate}. Tampilan ini memakai snapshot yang tidak dapat diubah.`}
					action={
						<div className="flex flex-wrap gap-2">
							<Link
								href={returnTarget.href}
								className="rounded-xl border px-4 py-2 text-sm font-semibold"
							>
								{returnTarget.label}
							</Link>
							<Link
								href={`/app/reports/${id}/deliveries`}
								className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
							>
								Kirim ke wali
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
				<header className="border-b-2 border-slate-700 pb-4">
					<div className="grid grid-cols-[4rem_minmax(0,1fr)_4rem] items-center gap-3 text-center">
						{logoUrl ? (
							// Endpoint logo memakai sesi browser untuk menjaga akses snapshot tetap privat.
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={logoUrl}
								alt={`Logo ${snapshot.school?.name ?? "sekolah"}`}
								className="size-14 object-contain"
							/>
						) : (
							<span aria-hidden="true" />
						)}
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
								{snapshot.school?.name ?? "Sekolah"}
							</p>
							<h1 className="mt-1 text-xl font-bold uppercase">Laporan Perkembangan Anak Didik</h1>
						</div>
						<span aria-hidden="true" />
					</div>
					<p className="mt-2 text-sm">
						Nama: <b>{snapshot.student?.name ?? "-"}</b> · Nomor induk:{" "}
						{snapshot.student?.student_number || "-"} · {snapshot.semester?.name ?? "-"}
					</p>
					<p className="mt-1 text-sm">
						Kelas: {snapshot.student?.class_name || "-"} · Tahun ajaran:{" "}
						{snapshot.semester?.academic_year_name || "-"}
					</p>
				</header>
				<ReportScaleLegend />
				{areas.map((area, index) => (
					<section key={area} className="mt-7">
						<h2 className="border border-slate-500 bg-slate-100 px-3 py-2 font-bold uppercase">
							{["I", "II", "III", "IV", "V", "VI"][index] ?? index + 1}. {area}
						</h2>
						<FormalAssessmentTable
							items={assessments.filter((assessment) => assessment.area_name === area)}
						/>
						<div className="border border-t-0 border-slate-500 p-3 text-sm">
							<b>Narasi perkembangan</b>
							<p className="mt-2 whitespace-pre-wrap">{narratives.get(area) || "-"}</p>
						</div>
					</section>
				))}
				{(snapshot.growth || snapshot.attendance) && (
					<section className="mt-7 border border-slate-500 p-4 text-sm">
						<h2 className="font-bold">Data Akhir Semester</h2>
						{snapshot.growth && (
							<p className="mt-2">
								Pertumbuhan: {snapshot.growth.weight_kg ?? "-"} kg ·{" "}
								{snapshot.growth.height_cm ?? "-"} cm
							</p>
						)}
						{snapshot.attendance && (
							<p className="mt-1">
								Kehadiran: sakit {snapshot.attendance.sick_days ?? 0} hari · izin{" "}
								{snapshot.attendance.permission_days ?? 0} hari · tanpa keterangan{" "}
								{snapshot.attendance.unexcused_days ?? 0} hari
							</p>
						)}
					</section>
				)}
			</article>
		</>
	);
}
