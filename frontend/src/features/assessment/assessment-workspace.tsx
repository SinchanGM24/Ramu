"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type Semester = { id: string; name: string; academic_year_name: string };
type Data = { student: { name: string }; scales: { id: string; code: string }[]; indicators: { id: string; description: string; area_name: string; scale_option_id?: string }[] };

export function AssessmentWorkspace({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient();
  const [semesterId, setSemesterId] = useState("");
  const semesters = useQuery({ queryKey: ["academic", "semesters"], queryFn: () => api<Semester[]>("/academic/semesters") });
  useEffect(() => {
    if (!semesterId && semesters.data?.[0]) setSemesterId(semesters.data[0].id);
  }, [semesterId, semesters.data]);
  const work = useQuery({ queryKey: ["assessment", studentId, semesterId], enabled: Boolean(semesterId), queryFn: () => api<Data>(`/assessment/students/${studentId}?semesterId=${semesterId}`) });

  async function choose(indicatorId: string, scaleOptionId: string) {
    if (!semesterId) return;
    await api(`/assessment/students/${studentId}`, { method: "POST", body: JSON.stringify({ semesterId, indicatorId, scaleOptionId }) });
    await queryClient.invalidateQueries({ queryKey: ["assessment", studentId, semesterId] });
  }

  if (!semesters.isLoading && !semesters.data?.length) return <><PageHeader title="Penilaian murid" description="Semester diperlukan agar penilaian tersimpan terpisah untuk setiap periode." /><Card className="space-y-3"><p className="font-semibold">Semester belum tersedia.</p><Link href="/app/academic"><Button>Atur semester</Button></Link></Card></>;

  return <><PageHeader eyebrow="Penilaian individual" title={work.data?.student.name || "Memuat murid…"} description="Pilih semester dan satu tingkat perkembangan untuk setiap indikator. Perubahan tersimpan otomatis." /><Card className="mb-4"><label htmlFor="assessment-semester" className="text-sm font-semibold">Semester aktif</label><select id="assessment-semester" value={semesterId} onChange={(event) => setSemesterId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:max-w-sm">{semesters.data?.map((semester) => <option key={semester.id} value={semester.id}>{semester.name} · {semester.academic_year_name}</option>)}</select></Card><div className="space-y-4">{work.data?.indicators.map((indicator) => <Card key={indicator.id}><p className="text-xs font-bold text-brand-700">{indicator.area_name}</p><p className="mt-1 font-semibold text-slate-800">{indicator.description}</p><div className="mt-4 flex flex-wrap gap-2">{work.data.scales.map((scale) => <button key={scale.id} onClick={() => void choose(indicator.id, scale.id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${indicator.scale_option_id === scale.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-50"}`}>{scale.code}</button>)}</div></Card>)}{work.data?.indicators.length === 0 && <Card>Framework belum diatur. Admin dapat membuat framework default dari Pengaturan Penilaian.</Card>}</div></>;
}
