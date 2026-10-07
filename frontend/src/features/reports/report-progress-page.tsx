"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type Semester = { id: string; name: string; academic_year_name: string };
type Item = { id: string; name: string; report_id?: string; status?: string };
const label: Record<string, string> = { DRAFT: "Draf", SUBMITTED: "Dikirim", IN_REVIEW: "Sedang ditinjau", REVISION_REQUIRED: "Perlu revisi", APPROVED: "Disetujui", PUBLISHED: "Diterbitkan" };

export function ReportProgressPage() {
  const queryClient = useQueryClient();
  const [semesterId, setSemesterId] = useState("");
  const [error, setError] = useState("");
  const semesters = useQuery({ queryKey: ["academic", "semesters"], queryFn: () => api<Semester[]>("/academic/semesters") });
  useEffect(() => {
    if (!semesterId && semesters.data?.[0]) setSemesterId(semesters.data[0].id);
  }, [semesterId, semesters.data]);
  const progress = useQuery({ queryKey: ["reports", semesterId], enabled: Boolean(semesterId), queryFn: () => api<Item[]>(`/reports/progress?semesterId=${semesterId}`) });

  async function draft(studentId: string) {
    if (!semesterId) return;
    setError("");
    try {
      await api(`/reports/students/${studentId}/draft`, { method: "POST", body: JSON.stringify({ semesterId }) });
      await queryClient.invalidateQueries({ queryKey: ["reports", semesterId] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Draf rapor tidak dapat dibuat.");
    }
  }

  return <>
    <PageHeader eyebrow="Rapor" title="Progress rapor" description="Pilih semester aktif, lalu buat dan pantau rapor tiap murid." action={<Link href="/app/reports/review"><Button variant="secondary">Tinjauan rapor</Button></Link>} />
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!semesters.data?.length ? <Card className="space-y-3"><h2 className="font-bold">Tahun ajaran belum tersedia</h2><p className="text-sm text-slate-600">Buat tahun ajaran pada Data Akademik. Sistem akan menambahkan Semester I dan Semester II secara otomatis.</p><Link href="/app/academic"><Button>Buat tahun ajaran</Button></Link></Card> : <>
      <Card className="mb-5"><label className="block text-sm font-semibold text-slate-700" htmlFor="active-semester">Semester aktif</label><select id="active-semester" value={semesterId} onChange={(event) => setSemesterId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:max-w-sm">{semesters.data.map((semester) => <option key={semester.id} value={semester.id}>{semester.name} · {semester.academic_year_name}</option>)}</select></Card>
      <Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="pb-3">Murid</th><th className="pb-3">Status</th><th className="pb-3" /></tr></thead><tbody>{progress.isLoading ? <tr><td colSpan={3} className="py-6 text-slate-500">Memuat progress rapor…</td></tr> : progress.data?.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-4 font-semibold">{item.name}</td><td className="py-4 text-slate-600">{item.status ? label[item.status] : "Belum dibuat"}</td><td className="py-4 text-right">{item.report_id ? <Link href={`/app/reports/${item.report_id}`}><Button variant="secondary">Buka editor</Button></Link> : <Button onClick={() => void draft(item.id)}>Buat draf</Button>}</td></tr>)}</tbody></table></div></Card>
    </>}
  </>;
}
