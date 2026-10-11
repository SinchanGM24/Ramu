"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { api } from "@/lib/api";

type SnapshotAssessment = { area_name: string; sub_area_name?: string; description: string; code?: string | null };
type SnapshotNarrative = { name: string; content: string };
type Snapshot = {
	school?: { name?: string; address?: string | null };
	student?: { name?: string; student_number?: string | null; class_name?: string | null };
	semester?: { name?: string; academic_year_name?: string };
	assessments?: SnapshotAssessment[];
	narratives?: SnapshotNarrative[];
	growth?: { weight_kg?: number | null; height_cm?: number | null } | null;
	attendance?: { sick_days?: number; permission_days?: number; unexcused_days?: number } | null;
};
type PublishedVersion = { id: string; version_number: number; published_at: string; snapshot: Snapshot };
const scales = ["BB", "MB", "BSH", "BSB"];
const scaleCopy: Record<string, string> = { BB: "Belum Berkembang", MB: "Mulai Berkembang", BSH: "Berkembang Sesuai Harapan", BSB: "Berkembang Sangat Baik" };

function ScaleLegend() { return <div className="mt-4 grid gap-2 border border-slate-400 p-3 text-xs sm:grid-cols-4">{scales.map((scale) => <span key={scale}><b>{scale}</b> — {scaleCopy[scale]}</span>)}</div>; }
function FormalTable({ items }: { items: { sub_area_name?: string; description: string; code?: string | null }[] }) { return <div className="overflow-x-auto"><table className="min-w-full border-collapse text-left text-xs"><thead><tr className="bg-slate-200"><th className="border border-slate-500 p-2">No</th><th className="border border-slate-500 p-2">Aspek perkembangan</th>{scales.map((scale) => <th key={scale} className="border border-slate-500 p-2 text-center">{scale}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={`${item.description}-${index}`}><td className="border border-slate-400 p-2 text-center">{index + 1}</td><td className="border border-slate-400 p-2"><small className="block text-slate-500">{item.sub_area_name || "Indikator"}</small>{item.description}</td>{scales.map((scale) => <td key={scale} className="border border-slate-400 p-2 text-center text-base">{item.code === scale ? "✓" : ""}</td>)}</tr>)}</tbody></table></div>; }

export function PublishedReportPage({ id }: { id: string }) {
	const query = useQuery({ queryKey: ["published-report", id], queryFn: () => api<PublishedVersion | null>(`/reports/${id}/published-version`) });
	if (query.isLoading) return <Card>Memuat rapor terbit…</Card>;
	if (!query.data) return <Card><h1 className="font-bold">Rapor terbit tidak ditemukan</h1><p className="mt-2 text-sm text-slate-500">Rapor ini belum pernah diterbitkan atau Anda tidak memiliki akses.</p></Card>;

	const { snapshot, version_number: versionNumber, published_at: publishedAt } = query.data;
	const assessments = snapshot.assessments ?? [];
	const areas = [...new Set(assessments.map((assessment) => assessment.area_name))];
	const narratives = new Map((snapshot.narratives ?? []).map((narrative) => [narrative.name, narrative.content]));
	const publishedDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(publishedAt));

	return <><div className="print:hidden"><PageHeader eyebrow="Rapor terbit" title="Laporan Perkembangan Anak Didik" description={`Versi ${versionNumber} diterbitkan pada ${publishedDate}. Tampilan ini memakai snapshot yang tidak dapat diubah.`} action={<div className="flex gap-2"><Link href="/app/academic/students" className="rounded-xl border px-4 py-2 text-sm font-semibold">Kembali</Link><button onClick={() => window.print()} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Cetak</button></div>} /></div><article className="mx-auto max-w-5xl bg-white p-5 shadow-soft print:max-w-none print:p-0 print:shadow-none sm:p-8"><header className="border-b-2 border-slate-700 pb-4 text-center"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{snapshot.school?.name ?? "Sekolah"}</p><h1 className="mt-1 text-xl font-bold uppercase">Laporan Perkembangan Anak Didik</h1><p className="mt-2 text-sm">Nama: <b>{snapshot.student?.name ?? "-"}</b> · Nomor induk: {snapshot.student?.student_number || "-"} · {snapshot.semester?.name ?? "-"}</p><p className="mt-1 text-sm">Kelas: {snapshot.student?.class_name || "-"} · Tahun ajaran: {snapshot.semester?.academic_year_name || "-"}</p></header><ScaleLegend />{areas.map((area, index) => <section key={area} className="mt-7"><h2 className="border border-slate-500 bg-slate-100 px-3 py-2 font-bold uppercase">{["I", "II", "III", "IV", "V", "VI"][index] ?? index + 1}. {area}</h2><FormalTable items={assessments.filter((assessment) => assessment.area_name === area)} /><div className="border border-t-0 border-slate-500 p-3 text-sm"><b>Narasi perkembangan</b><p className="mt-2 whitespace-pre-wrap">{narratives.get(area) || "-"}</p></div></section>)}{(snapshot.growth || snapshot.attendance) && <section className="mt-7 border border-slate-500 p-4 text-sm"><h2 className="font-bold">Data Akhir Semester</h2>{snapshot.growth && <p className="mt-2">Pertumbuhan: {snapshot.growth.weight_kg ?? "-"} kg · {snapshot.growth.height_cm ?? "-"} cm</p>}{snapshot.attendance && <p className="mt-1">Kehadiran: sakit {snapshot.attendance.sick_days ?? 0} hari · izin {snapshot.attendance.permission_days ?? 0} hari · tanpa keterangan {snapshot.attendance.unexcused_days ?? 0} hari</p>}</section>}</article></>;
}
