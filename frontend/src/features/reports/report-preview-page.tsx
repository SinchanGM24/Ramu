"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { api } from "@/lib/api";

type ReportEditorData = {
  report: {
    student_name: string;
    student_number?: string | null;
    semester_name: string;
    status: string;
  };
  areas: Array<{
    id: string;
    name: string;
    indicator_count: number;
    assessed_count: number;
    narrative?: string | null;
  }>;
  assessments: Array<{ area_id: string; sub_area_name: string; description: string; scale_code?: string | null }>;
  growth: {
    weight_kg: string | number;
    height_cm: string | number;
    head_circumference_cm?: string | number | null;
  } | null;
  attendance: {
    sick_days: number;
    permission_days: number;
    unexcused_days: number;
  } | null;
};

const statusLabel: Record<string, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Dikirim untuk ditinjau",
  IN_REVIEW: "Sedang ditinjau",
  REVISION_REQUIRED: "Perlu revisi",
  APPROVED: "Disetujui",
  PUBLISHED: "Diterbitkan",
};

function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "Belum diisi";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(Number(value));
}

export function ReportPreviewPage({ id }: { id: string }) {
  const reportQuery = useQuery({
    queryKey: ["report-preview", id],
    queryFn: () => api<ReportEditorData | null>(`/reports/${id}/editor`),
  });

  if (reportQuery.isLoading) {
    return <p className="text-sm text-slate-500">Memuat pratinjau rapor…</p>;
  }

  if (reportQuery.isError || !reportQuery.data) {
    return <Card><h1 className="font-bold">Rapor tidak dapat dimuat</h1><p className="mt-2 text-sm text-slate-500">Periksa kembali akses Anda atau coba muat ulang halaman.</p></Card>;
  }

  const { report, areas, assessments, growth, attendance } = reportQuery.data;

  return <div className="print:mx-0">
    <div className="print:hidden">
      <PageHeader
        eyebrow="Pratinjau rapor"
        title="Laporan Perkembangan Anak Didik"
        description="Tampilan baca saja ini mengikuti struktur rapor. Perubahan tetap dilakukan dari editor rapor."
        action={<div className="flex gap-2"><Link href={`/app/reports/${id}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Kembali ke editor</Link><button type="button" onClick={() => window.print()} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Cetak pratinjau</button></div>}
      />
    </div>

    <article className="mx-auto max-w-4xl space-y-5 rounded-2xl bg-white p-5 shadow-soft print:max-w-none print:rounded-none print:p-0 print:shadow-none sm:p-8">
      <header className="border-b border-slate-200 pb-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Laporan Perkembangan Anak Didik</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{report.student_name}</h1>
        <p className="mt-1 text-sm text-slate-600">Semester {report.semester_name}</p>
      </header>

      <section aria-labelledby="identitas-title">
        <h2 id="identitas-title" className="text-lg font-bold text-slate-900">Keterangan Anak Didik</h2>
        <dl className="mt-3 grid overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2">
          <IdentityItem label="Nama anak didik" value={report.student_name} />
          <IdentityItem label="Nomor induk" value={report.student_number || "Belum diisi"} />
          <IdentityItem label="Semester" value={report.semester_name} />
          <IdentityItem label="Status rapor" value={statusLabel[report.status] || "Belum tersedia"} />
        </dl>
      </section>

      <section aria-labelledby="perkembangan-title">
        <h2 id="perkembangan-title" className="text-lg font-bold text-slate-900">Perkembangan Anak Didik</h2>
        <p className="mt-1 text-sm text-slate-600">Ringkasan penilaian dan narasi guru per area perkembangan.</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700"><tr><th className="px-4 py-3 font-semibold">Area perkembangan</th><th className="px-4 py-3 text-right font-semibold">Indikator dinilai</th></tr></thead>
            <tbody>{areas.map((area) => <tr key={area.id} className="border-t border-slate-200"><td className="px-4 py-3 font-medium text-slate-900">{area.name}</td><td className="px-4 py-3 text-right text-slate-700">{area.assessed_count} dari {area.indicator_count}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-4 space-y-3">{areas.map((area) => <section key={area.id} className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-slate-900">{area.name}</h3><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr><th className="pb-2">Subarea dan indikator</th><th className="pb-2 text-right">Penilaian</th></tr></thead><tbody>{assessments.filter((item)=>item.area_id===area.id).map((item,index)=><tr key={`${item.description}-${index}`} className="border-t border-slate-100"><td className="py-2"><span className="font-medium text-slate-600">{item.sub_area_name}</span><br/>{item.description}</td><td className="py-2 text-right font-bold text-brand-700">{item.scale_code || "Belum dinilai"}</td></tr>)}</tbody></table></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{area.narrative || "Narasi perkembangan belum diisi."}</p></section>)}</div>
      </section>

      <section aria-labelledby="semester-title">
        <h2 id="semester-title" className="text-lg font-bold text-slate-900">Data Akhir Semester</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SummaryCard title="Pertumbuhan"><SummaryRow label="Berat badan" value={`${formatNumber(growth?.weight_kg)}${growth ? " kg" : ""}`} /><SummaryRow label="Tinggi badan" value={`${formatNumber(growth?.height_cm)}${growth ? " cm" : ""}`} />{growth?.head_circumference_cm !== null && growth?.head_circumference_cm !== undefined && <SummaryRow label="Lingkar kepala" value={`${formatNumber(growth.head_circumference_cm)} cm`} />}</SummaryCard>
          <SummaryCard title="Kehadiran"><SummaryRow label="Sakit" value={`${attendance?.sick_days ?? "Belum diisi"}${attendance ? " hari" : ""}`} /><SummaryRow label="Izin" value={`${attendance?.permission_days ?? "Belum diisi"}${attendance ? " hari" : ""}`} /><SummaryRow label="Tanpa keterangan" value={`${attendance?.unexcused_days ?? "Belum diisi"}${attendance ? " hari" : ""}`} /></SummaryCard>
        </div>
      </section>

      <section className="grid gap-8 border-t border-slate-200 pt-8 text-center sm:grid-cols-2" aria-label="Pengesahan">
        <div><p className="text-sm text-slate-600">Guru kelas</p><div className="h-20" /><p className="border-t border-slate-300 pt-2 text-sm">Nama dan tanda tangan</p></div>
        <div><p className="text-sm text-slate-600">Kepala PAUD</p><div className="h-20" /><p className="border-t border-slate-300 pt-2 text-sm">Nama dan tanda tangan</p></div>
      </section>
    </article>
  </div>;
}

function IdentityItem({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-200 p-3 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0 sm:odd:border-r"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>;
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-slate-900">{title}</h3><dl className="mt-3 space-y-2">{children}</dl></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-baseline justify-between gap-4 text-sm"><dt className="text-slate-600">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>;
}
