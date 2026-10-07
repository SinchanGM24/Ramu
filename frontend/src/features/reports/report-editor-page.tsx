"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

type Editor = { report: { student_name: string; semester_name: string; status: string }; areas: { id: string; name: string; indicator_count: number; assessed_count: number; narrative?: string }[] };
type Extracurricular = { id: string; activity_name: string; grade: "A" | "B" | "C" | "D" };

export function ReportEditorPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string>();
  const data = useQuery({ queryKey: ["report-editor", id], queryFn: () => api<Editor>(`/reports/${id}/editor`) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["report-editor", id] });
  const resumeRevision = useMutation({ mutationFn: () => api(`/reports/${id}/resume-revision`, { method: "POST" }), onSuccess: refresh });
  const startCorrection = useMutation({ mutationFn: () => api(`/reports/${id}/correction`, { method: "POST" }), onSuccess: refresh });
  async function save(areaId: string, content: string) { setSaving(areaId); try { await api(`/reports/${id}/narratives/${areaId}`, { method: "PUT", body: JSON.stringify({ content }) }); refresh(); } finally { setSaving(undefined); } }
  const published = data.data?.report.status === "PUBLISHED";
  const revisionRequired = data.data?.report.status === "REVISION_REQUIRED";
  return <>
    <PageHeader eyebrow="Editor rapor" title={data.data?.report.student_name || "Memuat…"} description={`Semester ${data.data?.report.semester_name || ""} · Narasi tersimpan otomatis saat kolom kehilangan fokus.`} action={<div className="flex flex-wrap gap-2"><Link href={`/app/reports/${id}/preview`}><Button variant="secondary">Pratinjau</Button></Link>{revisionRequired && <Button disabled={resumeRevision.isPending} onClick={() => resumeRevision.mutate()}>{resumeRevision.isPending ? "Membuka draf…" : "Kerjakan revisi"}</Button>}{published && <><Button disabled={startCorrection.isPending} variant="secondary" onClick={() => startCorrection.mutate()}>{startCorrection.isPending ? "Membuka koreksi…" : "Mulai koreksi"}</Button><Link href={`/app/reports/${id}/deliveries`}><Button>Distribusi ke wali</Button></Link></>}</div>} />
    {published && <Card className="mb-4 border-amber-200 bg-amber-50 text-sm text-amber-900">Rapor ini telah diterbitkan dan tidak dapat diubah. Pilih <strong>Mulai koreksi</strong> untuk membuat draf perbaikan; versi terbit sebelumnya tetap aman.</Card>}
    <div className="space-y-4">{data.data?.areas.map((area) => { const complete = area.assessed_count === area.indicator_count && !!area.narrative; return <Card key={area.id}><h2 className="font-bold">{area.name}</h2><p className="mt-1 text-sm text-slate-500">{area.assessed_count}/{area.indicator_count} indikator dinilai · {complete ? "Lengkap" : "Belum lengkap"}</p><label className="mt-4 block text-sm font-semibold">Narasi perkembangan<textarea readOnly={published} defaultValue={area.narrative || ""} onBlur={(event) => { if (!published && event.currentTarget.value.trim()) save(area.id, event.currentTarget.value); }} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-500 read-only:bg-slate-50" placeholder="Tuliskan perkembangan anak pada area ini…" /></label><p className="mt-2 text-xs text-slate-500">{published ? "Rapor terbit tidak dapat diubah" : saving === area.id ? "Menyimpan…" : "Tersimpan otomatis"}</p></Card>; })}<SemesterDataForm id={id} disabled={published} /><ExtracurricularPanel id={id} disabled={published} /></div>
  </>;
}

function SemesterDataForm({ id, disabled }: { id: string; disabled: boolean }) {
  async function save(event: React.FocusEvent<HTMLFormElement>) { if (disabled) return; const form = new FormData(event.currentTarget); if (![...form.values()].every(Boolean)) return; await api(`/reports/${id}/semester-data`, { method: "PUT", body: JSON.stringify({ weightKg: form.get("weightKg"), heightCm: form.get("heightCm"), sickDays: form.get("sickDays"), permissionDays: form.get("permissionDays"), unexcusedDays: form.get("unexcusedDays") }) }); }
  return <Card><h2 className="font-bold">Data Akhir Semester</h2><form onBlur={save} className="mt-4 grid gap-3 sm:grid-cols-2"><input disabled={disabled} required name="weightKg" type="number" min="0" step="0.1" placeholder="Berat badan (kg)" className="rounded-xl border p-3 disabled:bg-slate-50" /><input disabled={disabled} required name="heightCm" type="number" min="0" step="0.1" placeholder="Tinggi badan (cm)" className="rounded-xl border p-3 disabled:bg-slate-50" /><input disabled={disabled} required name="sickDays" type="number" min="0" placeholder="Sakit (hari)" className="rounded-xl border p-3 disabled:bg-slate-50" /><input disabled={disabled} required name="permissionDays" type="number" min="0" placeholder="Izin (hari)" className="rounded-xl border p-3 disabled:bg-slate-50" /><input disabled={disabled} required name="unexcusedDays" type="number" min="0" placeholder="Tanpa keterangan (hari)" className="rounded-xl border p-3 disabled:bg-slate-50" /></form><p className="mt-3 text-xs text-slate-500">{disabled ? "Data pada rapor terbit tidak dapat diubah." : "Tersimpan otomatis setelah data lengkap."}</p></Card>;
}

function ExtracurricularPanel({ id, disabled }: { id: string; disabled: boolean }) {
  const queryClient = useQueryClient();
  const [activityName, setActivityName] = useState("");
  const [grade, setGrade] = useState<Extracurricular["grade"]>("A");
  const records = useQuery({ queryKey: ["report-extracurricular", id], queryFn: () => api<Extracurricular[]>(`/reports/${id}/extracurricular`) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["report-extracurricular", id] });
  const add = useMutation({ mutationFn: () => api(`/reports/${id}/extracurricular`, { method: "POST", body: JSON.stringify({ activityName, grade }) }), onSuccess: () => { setActivityName(""); refresh(); } });
  const remove = useMutation({ mutationFn: (recordId: string) => api(`/reports/${id}/extracurricular/${recordId}`, { method: "DELETE" }), onSuccess: refresh });
  return <Card><h2 className="font-bold">Ekstrakurikuler</h2><p className="mt-1 text-sm text-slate-500">Tambahkan kegiatan sesuai kebutuhan; jumlah kegiatan tidak dibatasi.</p>{!disabled && <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_110px_auto]"><input value={activityName} onChange={(event) => setActivityName(event.target.value)} maxLength={160} placeholder="Nama kegiatan" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><select value={grade} onChange={(event) => setGrade(event.target.value as Extracurricular["grade"])} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="A">Nilai A</option><option value="B">Nilai B</option><option value="C">Nilai C</option><option value="D">Nilai D</option></select><Button disabled={!activityName.trim() || add.isPending} onClick={() => add.mutate()}>{add.isPending ? "Menambah…" : "Tambah"}</Button></div>}<div className="mt-4 space-y-2">{records.data?.map((record) => <div key={record.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-800">{record.activity_name}</span><span className="flex items-center gap-3"><strong className="text-brand-700">{record.grade}</strong>{!disabled && <button className="text-red-700" onClick={() => remove.mutate(record.id)}>Hapus</button>}</span></div>)}{records.data?.length === 0 && <p className="text-sm text-slate-500">Belum ada kegiatan ekstrakurikuler.</p>}</div></Card>;
}
