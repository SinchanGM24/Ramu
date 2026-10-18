import { useMemo } from "react";
import { FormalAssessmentTable } from "@/features/reports/presentation/formal-assessment-table";
import { ReportScaleLegend } from "@/features/reports/presentation/report-scale-legend";
import { ParentReportToolbar } from "./parent-report-toolbar";
import type { ParentReport, ParentReportItem } from "../types";

type ParentReportContentProps = { error: string; report: ParentReport; onDownload: () => void };

export function ParentReportContent({ error, report, onDownload }: ParentReportContentProps) {
	const areas = useMemo(() => groupAreas(report.assessments ?? []), [report.assessments]);
	const narratives = new Map((report.narratives ?? []).map((item) => [item.name, item.content]));
	return (
		<main className="min-h-screen bg-[#f8f5ed]">
			<ParentReportToolbar studentName={report.student?.name} onDownload={onDownload} />
			<article className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
				<section className="rounded-[1.75rem] bg-[#2c704d] p-6 text-white shadow-[0_16px_32px_rgba(31,93,62,0.2)] sm:p-8">
					<p>Laporan Perkembangan Anak Didik</p>
					<h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
						{report.student?.name}
					</h1>
					<p className="mt-2 text-sm">
						{report.student?.class_name} · {report.semester?.name} ·{" "}
						{report.semester?.academic_year_name}
					</p>
				</section>
				<section className="rounded-2xl border border-[#e5e7dc] bg-[#fffdf8] p-5 shadow-soft">
					<h2 className="font-bold text-[#17251b]">Keterangan skala penilaian</h2>
					<ReportScaleLegend />
				</section>
				{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
				{areas.map(([name, items], index) => (
					<section
						key={name}
						className="rounded-2xl border border-[#e5e7dc] bg-[#fffdf8] p-5 shadow-soft"
					>
						<h2 className="font-bold uppercase text-[#17251b]">
							{["I", "II", "III", "IV", "V", "VI"][index]}. {name}
						</h2>
						<div className="mt-4">
							<FormalAssessmentTable items={items} />
						</div>
						<div className="mt-4 rounded-xl bg-[#f4f6f0] p-4">
							<b className="text-sm text-[#35443a]">Narasi perkembangan</b>
							<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#35443a]">
								{narratives.get(name) || "-"}
							</p>
						</div>
					</section>
				))}
				<section className="grid gap-4 sm:grid-cols-2">
					<SummaryBox
						title="Pertumbuhan"
						rows={[
							[
								"Berat badan",
								report.growth?.weight_kg == null ? "-" : `${report.growth.weight_kg} kg`,
							],
							[
								"Tinggi badan",
								report.growth?.height_cm == null ? "-" : `${report.growth.height_cm} cm`,
							],
						]}
					/>
					<SummaryBox
						title="Kehadiran"
						rows={[
							["Sakit", `${report.attendance?.sick_days ?? "-"} hari`],
							["Izin", `${report.attendance?.permission_days ?? "-"} hari`],
							["Tanpa keterangan", `${report.attendance?.unexcused_days ?? "-"} hari`],
						]}
					/>
				</section>
			</article>
		</main>
	);
}

function groupAreas(items: ParentReportItem[]) {
	const map = new Map<string, ParentReportItem[]>();
	for (const item of items) {
		const name = item.area_name || "Perkembangan Anak Didik";
		map.set(name, [...(map.get(name) || []), item]);
	}
	return [...map.entries()];
}

function SummaryBox({ title, rows }: { title: string; rows: string[][] }) {
	return (
		<section className="rounded-2xl border border-[#e5e7dc] bg-[#fffdf8] p-5 shadow-soft">
			<h2 className="font-bold text-[#17251b]">{title}</h2>
			{rows.map(([label, value]) => (
				<p key={label} className="mt-2 flex justify-between text-sm text-[#526156]">
					<span>{label}</span>
					<b>{value}</b>
				</p>
			))}
		</section>
	);
}
