"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Circle, CircleDot, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { ReportAssessmentTable } from "./report-assessment-table";

type Scale = { id: string; code: string; label: string };
type Indicator = { id: string; description: string; scaleOptionId?: string | null };
type Area = { id: string; name: string; narrative: string; narrativeStale?: boolean; subAreas: { id: string; name: string; indicators: Indicator[] }[] };
type Workspace = { report: { status: string; student_name: string; class_name?: string | null; semester_name: string; academic_year_name: string }; scales: Scale[]; areas: Area[]; growth: { weight_kg: string | number; height_cm: string | number } | null; attendance: { sick_days: number; permission_days: number; unexcused_days: number } | null };

const labels: Record<string, string> = { DRAFT: "Draf", SUBMITTED: "Dikirim", IN_REVIEW: "Sedang ditinjau", REVISION_REQUIRED: "Perlu revisi", APPROVED: "Disetujui", PUBLISHED: "Diterbitkan" };
const count = (area: Area) => {
  const indicators = area.subAreas.flatMap((item) => item.indicators);
  return { total: indicators.length, assessed: indicators.filter((item) => item.scaleOptionId).length };
};

export function ReportEditorPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [pendingScaleOptionIds, setPendingScaleOptionIds] = useState<Record<string, string>>({});
  const workspace = useQuery({ queryKey: ["report-workspace", id], queryFn: () => api<Workspace | null>(`/reports/${id}/workspace`) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["report-workspace", id] });
  const assessment = useMutation({
    mutationFn: ({ indicatorId, scaleOptionId }: { indicatorId: string; scaleOptionId: string }) => api(`/reports/${id}/assessments/${indicatorId}`, { method: "PUT", body: JSON.stringify({ scaleOptionId }) }),
    onMutate: ({ indicatorId, scaleOptionId }) => setPendingScaleOptionIds((current) => ({ ...current, [indicatorId]: scaleOptionId })),
    onSuccess: refresh,
    onSettled: (_result, _error, variables) => setPendingScaleOptionIds((current) => {
      const next = { ...current };
      delete next[variables.indicatorId];
      return next;
    }),
  });

  if (workspace.isLoading) return <Card>Memuat ruang kerja rapor…</Card>;
  if (!workspace.data) return <Card>Rapor tidak dapat dimuat.</Card>;

  const data = workspace.data;
  const editable = ["DRAFT", "REVISION_REQUIRED"].includes(data.report.status);
  const done = data.areas.reduce((sum, area) => sum + count(area).assessed, 0);
  const total = data.areas.reduce((sum, area) => sum + count(area).total, 0);

  return <>
    <PageHeader eyebrow="Editor rapor" title={data.report.student_name} description={`${data.report.class_name || "Kelas belum diatur"} · ${data.report.semester_name} · ${data.report.academic_year_name}`} action={<Link href={`/app/reports/${id}/preview`}><Button variant="secondary">Pratinjau formal</Button></Link>} />
    <Card className="mb-4"><p className="text-sm font-semibold text-brand-700">Progress rapor</p><p className="mt-1 text-2xl font-bold">{total ? Math.round(done / total * 100) : 0}% selesai</p><p className="text-sm text-slate-600">{done}/{total} indikator dinilai · {labels[data.report.status]}</p></Card>
    <ScaleGuide scales={data.scales} />
    <div className="mt-4 space-y-4">
      {data.areas.map((area, index) => <AreaCard key={area.id} area={area} number={index + 1} scales={data.scales} editable={editable} savingIndicatorId={assessment.isPending ? assessment.variables?.indicatorId : undefined} pendingScaleOptionIds={pendingScaleOptionIds} onChoose={(indicatorId, scaleOptionId) => assessment.mutate({ indicatorId, scaleOptionId })} reportId={id} refresh={refresh} />)}
    </div>
  </>;
}

function ScaleGuide({ scales }: { scales: Scale[] }) {
  const details: Record<string, string> = { BB: "Belum Berkembang", MB: "Mulai Berkembang", BSH: "Berkembang Sesuai Harapan", BSB: "Berkembang Sangat Baik" };
  return <Card><h2 className="font-bold">Keterangan penilaian</h2><p className="mt-1 text-sm text-slate-600">Pilih satu radio pada setiap baris indikator. Nilai disimpan otomatis.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{scales.map((scale) => <div key={scale.id} className="rounded-xl bg-slate-50 p-3"><b className="text-brand-700">{scale.code}</b><p className="mt-1 text-sm text-slate-600">{details[scale.code] || scale.label}</p></div>)}</div></Card>;
}

function AreaCard({ area, number, scales, editable, savingIndicatorId, pendingScaleOptionIds, onChoose, reportId, refresh }: { area: Area; number: number; scales: Scale[]; editable: boolean; savingIndicatorId?: string; pendingScaleOptionIds: Record<string, string>; onChoose: (indicatorId: string, scaleOptionId: string) => void; reportId: string; refresh: () => void }) {
  const progress = count(area);
  const complete = progress.assessed === progress.total;
  return <Card>
    <div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-brand-700">{number}. ASPEK PERKEMBANGAN</p><h2 className="mt-1 text-lg font-bold">{area.name}</h2><p className="text-sm text-slate-500">{progress.assessed}/{progress.total} indikator dinilai</p></div>{complete && area.narrative ? <CheckCircle2 className="text-emerald-600" /> : progress.assessed ? <CircleDot className="text-amber-600" /> : <Circle className="text-slate-400" />}</div>
    {area.subAreas.map((subArea, index) => <details key={subArea.id} open={index === 0} className="mt-4 overflow-hidden rounded-xl border"><summary className="flex cursor-pointer list-none justify-between bg-slate-50 p-4 font-semibold">{subArea.name}<ChevronDown className="size-4" /></summary><div className="border-t"><ReportAssessmentTable subArea={subArea} scales={scales} editable={editable} savingIndicatorId={savingIndicatorId} pendingScaleOptionIds={pendingScaleOptionIds} onChoose={onChoose} /></div></details>)}
    <Narrative reportId={reportId} area={area} editable={editable} complete={complete} refresh={refresh} />
  </Card>;
}

function Narrative({ reportId, area, editable, complete, refresh }: { reportId: string; area: Area; editable: boolean; complete: boolean; refresh: () => void }) {
  const [value, setValue] = useState(area.narrative || "");
  const [state, setState] = useState("saved");
  const [confirmReplacement, setConfirmReplacement] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const saved = useRef(area.narrative || "");
  const generated = useRef(false);
  useEffect(() => { setValue(area.narrative || ""); saved.current = area.narrative || ""; }, [area.id, area.narrative]);
  async function persist(text: string) { if (!editable || text === saved.current) return; setState("saving"); try { await api(`/reports/${reportId}/workspace/narratives/${area.id}`, { method: "PUT", body: JSON.stringify({ content: text }) }); saved.current = text; setState("saved"); refresh(); } catch { setState("error"); } }
  async function generate(replaceExisting = false) { if (!editable || !complete) return; if (value.trim() && !replaceExisting) { setConfirmReplacement(true); return; } setConfirmReplacement(false); setState("saving"); try { const result = await api<{ content: string; generation: { warnings: string[] } }>(`/reports/${reportId}/workspace/narratives/${area.id}/generate`, { method: "POST" }); generated.current = true; saved.current = result.content; setValue(result.content); setWarnings(result.generation.warnings); setState("saved"); refresh(); } catch { setState("error"); } }
  useEffect(() => { if (complete && !area.narrative && !generated.current) void generate(); }, [complete, area.narrative]);
  return <div className="mt-5"><div className="flex justify-between gap-2"><b className="text-sm">Narasi perkembangan</b><Button type="button" variant="secondary" disabled={!editable || !complete || state === "saving"} onClick={() => void generate()}><Sparkles className="mr-1 size-4" />Buat draf dari nilai</Button></div>{area.narrativeStale && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Nilai indikator telah berubah setelah draf otomatis dibuat. Tinjau narasi ini atau buat draf baru.</p>}{warnings.map((warning) => <p key={warning} className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{warning}</p>)}<textarea value={value} disabled={!editable} onChange={(event) => setValue(event.target.value)} onBlur={() => void persist(value)} className="mt-2 min-h-32 w-full rounded-xl border p-3 text-sm" placeholder="Lengkapi semua indikator untuk membuat draf otomatis." /><ConfirmationDialog open={confirmReplacement} title="Ganti narasi yang sudah ada?" description="Draf baru dari nilai akan menggantikan teks yang telah Anda tulis." confirmLabel="Ganti dengan draf baru" onCancel={() => setConfirmReplacement(false)} onConfirm={() => void generate(true)} /><p className={`mt-2 text-xs ${state === "error" ? "text-red-700" : "text-slate-500"}`}>{state === "saving" ? "Menyusun draf…" : state === "error" ? "Perubahan belum tersimpan. Coba lagi." : "Draf memakai nilai indikator dan tetap dapat diedit guru."}</p></div>;
}
