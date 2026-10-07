"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Circle, CircleDot, Save } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type Scale = { id: string; code: string; label: string };
type Indicator = { id: string; description: string; scaleOptionId?: string | null; scaleCode?: string | null };
type Area = { id: string; name: string; narrative: string; subAreas: Array<{ id: string; name: string; indicators: Indicator[] }> };
type Workspace = { report: { id: string; status: string; student_name: string; nickname?: string | null; student_number?: string | null; class_name?: string | null; semester_name: string; academic_year_name: string }; scales: Scale[]; areas: Area[]; growth: { weight_kg: string | number; height_cm: string | number } | null; attendance: { sick_days: number; permission_days: number; unexcused_days: number } | null };
type Extracurricular = { id: string; activity_name: string; grade: "A" | "B" | "C" | "D" };

const statusLabel: Record<string, string> = { DRAFT: "Draf", SUBMITTED: "Dikirim", IN_REVIEW: "Sedang ditinjau", REVISION_REQUIRED: "Perlu revisi", APPROVED: "Disetujui", PUBLISHED: "Diterbitkan" };

function countArea(area: Area) {
  const indicators = area.subAreas.flatMap((subArea) => subArea.indicators);
  return { total: indicators.length, assessed: indicators.filter((indicator) => indicator.scaleOptionId).length };
}

export function ReportEditorPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const workspace = useQuery({ queryKey: ["report-workspace", id], queryFn: () => api<Workspace | null>(`/reports/${id}/workspace`) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["report-workspace", id] });
  const saveAssessment = useMutation({ mutationFn: ({ indicatorId, scaleOptionId }: { indicatorId: string; scaleOptionId: string }) => api(`/reports/${id}/assessments/${indicatorId}`, { method: "PUT", body: JSON.stringify({ scaleOptionId }) }), onSuccess: refresh });
  const resumeRevision = useMutation({ mutationFn: () => api(`/reports/${id}/resume-revision`, { method: "POST" }), onSuccess: refresh });
  const startCorrection = useMutation({ mutationFn: () => api(`/reports/${id}/correction`, { method: "POST" }), onSuccess: refresh });

  if (workspace.isLoading) return <Card>Memuat ruang kerja rapor…</Card>;
  if (workspace.isError || !workspace.data) return <Card><h1 className="font-bold">Rapor tidak dapat dimuat</h1><p className="mt-2 text-sm text-slate-500">Periksa kembali akses atau template penilaian sekolah.</p></Card>;

  const data = workspace.data;
  const published = data.report.status === "PUBLISHED";
  const editable = ["DRAFT", "REVISION_REQUIRED"].includes(data.report.status);
  const total = data.areas.reduce((sum, area) => sum + countArea(area).total, 0);
  const assessed = data.areas.reduce((sum, area) => sum + countArea(area).assessed, 0);
  const progress = total ? Math.round((assessed / total) * 100) : 0;

  return <>
    <PageHeader eyebrow="Editor rapor" title={data.report.student_name} description={`${data.report.class_name || "Kelas belum diatur"} · ${data.report.semester_name} · ${data.report.academic_year_name}`} action={<div className="flex flex-wrap gap-2"><Link href={`/app/reports/${id}/preview`}><Button variant="secondary">Pratinjau</Button></Link>{data.report.status === "REVISION_REQUIRED" && <Button disabled={resumeRevision.isPending} onClick={() => resumeRevision.mutate()}>{resumeRevision.isPending ? "Membuka draf…" : "Kerjakan revisi"}</Button>}{published && <><Button disabled={startCorrection.isPending} variant="secondary" onClick={() => startCorrection.mutate()}>{startCorrection.isPending ? "Membuka koreksi…" : "Mulai koreksi"}</Button><Link href={`/app/reports/${id}/deliveries`}><Button>Distribusi ke wali</Button></Link></>}</div>} />
    {published && <Card className="mb-4 border-amber-200 bg-amber-50 text-sm text-amber-900">Rapor ini telah diterbitkan dan terkunci. Koreksi akan membuat draf versi baru tanpa mengubah versi yang sudah dibagikan.</Card>}
    <Card className="mb-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-brand-700">Progress rapor</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{progress}% selesai</h2><p className="mt-1 text-sm text-slate-600">{assessed}/{total} indikator dinilai · Status {statusLabel[data.report.status] || "Belum tersedia"}</p></div><div className="grid grid-cols-2 gap-2 text-xs sm:max-w-md">{data.areas.map((area) => { const count = countArea(area); const done = count.assessed === count.total && !!area.narrative.trim(); const partial = count.assessed > 0 || !!area.narrative.trim(); return <span key={area.id} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-2 text-slate-600">{done ? <CheckCircle2 className="size-4 text-emerald-600" /> : partial ? <CircleDot className="size-4 text-amber-600" /> : <Circle className="size-4 text-slate-400" />}{area.name}</span>; })}</div></div></Card>
    <div className="space-y-4">{data.areas.map((area, index) => <AreaEditor key={area.id} reportId={id} number={index + 1} area={area} scales={data.scales} editable={editable} savingAssessment={saveAssessment.isPending} onChoose={(indicatorId, scaleOptionId) => saveAssessment.mutate({ indicatorId, scaleOptionId })} onRefresh={refresh} />)}<SemesterDataCards reportId={id} growth={data.growth} attendance={data.attendance} disabled={!editable} onRefresh={refresh} /><ExtracurricularPanel id={id} disabled={!editable} /></div>
  </>;
}

function AreaEditor({ reportId, number, area, scales, editable, savingAssessment, onChoose, onRefresh }: { reportId: string; number: number; area: Area; scales: Scale[]; editable: boolean; savingAssessment: boolean; onChoose: (indicatorId: string, scaleOptionId: string) => void; onRefresh: () => void }) {
  const count = countArea(area);
  const complete = count.assessed === count.total && !!area.narrative.trim();
  return <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-700">{number}. Aspek perkembangan</p><h2 className="mt-1 text-lg font-bold text-slate-900">{area.name}</h2><p className="mt-1 text-sm text-slate-500">{count.assessed}/{count.total} indikator dinilai · {complete ? "Lengkap" : "Belum lengkap"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{complete ? "Lengkap" : "Sedang diisi"}</span></div><div className="mt-5 space-y-3">{area.subAreas.map((subArea, index) => { const completeSubArea = subArea.indicators.filter((indicator) => indicator.scaleOptionId).length; return <details key={subArea.id} open={index === 0} className="rounded-xl border border-slate-200"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-slate-800"><span>{subArea.name}</span><span className="flex items-center gap-2 text-xs font-medium text-slate-500">{completeSubArea}/{subArea.indicators.length} selesai <ChevronDown className="size-4" /></span></summary><div className="space-y-4 border-t border-slate-100 p-4">{subArea.indicators.map((indicator) => <div key={indicator.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"><p className="text-sm font-medium leading-6 text-slate-800">{indicator.description}</p><div className="mt-3 flex flex-wrap gap-2">{scales.map((scale) => <button key={scale.id} type="button" disabled={!editable || savingAssessment} onClick={() => onChoose(indicator.id, scale.id)} className={`min-w-14 rounded-xl px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${indicator.scaleOptionId === scale.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-50"}`}>{scale.code}</button>)}</div></div>)}</div></details>; })}</div><NarrativeField reportId={reportId} area={area} disabled={!editable} onSaved={onRefresh} /></Card>;
}

function NarrativeField({ reportId, area, disabled, onSaved }: { reportId: string; area: Area; disabled: boolean; onSaved: () => void }) {
  const [value, setValue] = useState(area.narrative || "");
  const [state, setState] = useState<"saved" | "saving" | "error">("saved");
  const lastSaved = useRef(area.narrative || "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setValue(area.narrative || ""); lastSaved.current = area.narrative || ""; }, [area.id, area.narrative]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function persist(next: string) { if (next === lastSaved.current || disabled) return; setState("saving"); try { await api(`/reports/${reportId}/workspace/narratives/${area.id}`, { method: "PUT", body: JSON.stringify({ content: next }) }); lastSaved.current = next; setState("saved"); onSaved(); } catch { setState("error"); } }
  function change(next: string) { setValue(next); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => persist(next), 700); }
  function blur() { if (timer.current) clearTimeout(timer.current); persist(value); }
  return <label className="mt-5 block text-sm font-semibold text-slate-800">Narasi perkembangan<textarea disabled={disabled} value={value} onChange={(event) => change(event.target.value)} onBlur={blur} maxLength={5000} placeholder="Tuliskan narasi perkembangan anak pada aspek ini…" className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-brand-500 disabled:bg-slate-50" /></label>;
}

function SemesterDataCards({ reportId, growth, attendance, disabled, onRefresh }: { reportId: string; growth: Workspace["growth"]; attendance: Workspace["attendance"]; disabled: boolean; onRefresh: () => void }) {
  const [values, setValues] = useState({ weightKg: growth?.weight_kg ?? "", heightCm: growth?.height_cm ?? "", sickDays: attendance?.sick_days ?? 0, permissionDays: attendance?.permission_days ?? 0, unexcusedDays: attendance?.unexcused_days ?? 0 });
  const [state, setState] = useState<"saved" | "saving" | "error">("saved");
  useEffect(() => setValues({ weightKg: growth?.weight_kg ?? "", heightCm: growth?.height_cm ?? "", sickDays: attendance?.sick_days ?? 0, permissionDays: attendance?.permission_days ?? 0, unexcusedDays: attendance?.unexcused_days ?? 0 }), [growth, attendance]);
  async function save() { if (disabled || values.weightKg === "" || values.heightCm === "") return; setState("saving"); try { await api(`/reports/${reportId}/semester-data`, { method: "PUT", body: JSON.stringify(values) }); setState("saved"); onRefresh(); } catch { setState("error"); } }
  const field = (label: string, key: keyof typeof values, suffix: string) => <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-2 flex items-center gap-2"><input disabled={disabled} value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} onBlur={save} type="number" min="0" step={key === "weightKg" || key === "heightCm" ? "0.1" : "1"} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 disabled:bg-slate-50" /><span className="text-sm text-slate-500">{suffix}</span></div></label>;
  return <Card><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Data akhir semester</p><h2 className="mt-1 text-lg font-bold">Pertumbuhan dan kehadiran</h2></div><span className="text-xs text-slate-500">{state === "saving" ? "Menyimpan…" : state === "error" ? "Perubahan belum tersimpan" : "Semua perubahan tersimpan"}</span></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">Pertumbuhan</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{field("Berat badan", "weightKg", "kg")}{field("Tinggi badan", "heightCm", "cm")}</div></div><div className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">Kehadiran</h3><div className="mt-4 grid gap-3 sm:grid-cols-3">{field("Sakit", "sickDays", "hari")}{field("Izin", "permissionDays", "hari")}{field("Tanpa keterangan", "unexcusedDays", "hari")}</div></div></div></Card>;
}

function ExtracurricularPanel({ id, disabled }: { id: string; disabled: boolean }) {
  const queryClient = useQueryClient(); const [activityName, setActivityName] = useState(""); const [grade, setGrade] = useState<Extracurricular["grade"]>("A");
  const records = useQuery({ queryKey: ["report-extracurricular", id], queryFn: () => api<Extracurricular[]>(`/reports/${id}/extracurricular`) });
  const add = useMutation({ mutationFn: () => api(`/reports/${id}/extracurricular`, { method: "POST", body: JSON.stringify({ activityName, grade }) }), onSuccess: () => { setActivityName(""); queryClient.invalidateQueries({ queryKey: ["report-extracurricular", id] }); } });
  const remove = useMutation({ mutationFn: (recordId: string) => api(`/reports/${id}/extracurricular/${recordId}`, { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["report-extracurricular", id] }) });
  return <Card><h2 className="text-lg font-bold">Ekstrakurikuler</h2><p className="mt-1 text-sm text-slate-500">Tambahkan kegiatan yang diikuti murid pada semester ini.</p>{!disabled && <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_110px_auto]"><input value={activityName} onChange={(event) => setActivityName(event.target.value)} maxLength={160} placeholder="Nama kegiatan" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><select value={grade} onChange={(event) => setGrade(event.target.value as Extracurricular["grade"])} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="A">Nilai A</option><option value="B">Nilai B</option><option value="C">Nilai C</option><option value="D">Nilai D</option></select><Button disabled={!activityName.trim() || add.isPending} onClick={() => add.mutate()}><Save className="mr-1 size-4" />Tambah</Button></div>}<div className="mt-4 space-y-2">{records.data?.map((record) => <div key={record.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-medium">{record.activity_name}</span><span className="flex items-center gap-3"><strong className="text-brand-700">{record.grade}</strong>{!disabled && <button className="text-red-700" onClick={() => remove.mutate(record.id)}>Hapus</button>}</span></div>)}</div></Card>;
}
