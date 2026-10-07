"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Plus, School, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Year = { id: string; name: string; is_active: boolean };
type Level = { id: string; name: string; code: string; position: number; next_level_name?: string };
type ClassPeriod = { id: string; name: string; level_name: string; homeroom_teacher_name?: string };
const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm";

export function AcademicPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const years = useQuery({ queryKey: ["academic", "years"], queryFn: () => api<Year[]>("/academic/years") });
  const levels = useQuery({ queryKey: ["academic", "levels"], queryFn: () => api<Level[]>("/academic/levels") });
  const activeYear = years.data?.find((year) => year.is_active);
  const periods = useQuery({ queryKey: ["academic", "class-periods", activeYear?.id], enabled: Boolean(activeYear), queryFn: () => api<ClassPeriod[]>(`/academic/class-periods?academicYearId=${activeYear?.id}`) });

  async function submit(form: HTMLFormElement, path: string, body: object, key: readonly unknown[]) {
    setError("");
    try { await api(path, { method: "POST", body: JSON.stringify(body) }); form.reset(); await queryClient.invalidateQueries({ queryKey: key }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Data tidak dapat disimpan."); }
  }
  function addYear(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; void submit(form, "/academic/years", { name: new FormData(form).get("name") }, ["academic", "years"]); }
  function addLevel(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void submit(form, "/academic/levels", { name: data.get("name"), code: data.get("code"), position: Number(data.get("position")), nextLevelId: data.get("nextLevelId") || null }, ["academic", "levels"]); }
  function addClass(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!activeYear) return; const form = event.currentTarget; const data = new FormData(form); void submit(form, "/academic/class-periods", { name: data.get("name"), academicYearId: activeYear.id, educationLevelId: data.get("educationLevelId") }, ["academic", "class-periods", activeYear.id]); }
  async function activateYear(id: string) { setError(""); try { await api(`/academic/years/${id}/activate`, { method: "POST" }); await queryClient.invalidateQueries({ queryKey: ["academic", "years"] }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Tahun ajaran tidak dapat diaktifkan."); } }

  return <>
    <PageHeader eyebrow="Akademik" title="Tahun ajaran dan kelas" description="Semester I dan Semester II dibuat otomatis saat tahun ajaran dibuat." action={<Link href="/app/academic/promotion"><Button variant="secondary">Kenaikan kelas</Button></Link>} />
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-3">
      <Card><SectionTitle icon={School} text="Tahun ajaran" /><form className="mt-4 space-y-3" onSubmit={addYear}><input required name="name" pattern="[0-9]{4}/[0-9]{4}" placeholder="2026/2027" className={inputClass} /><Button className="w-full"><Plus size={16} />Buat tahun ajaran</Button></form><div className="mt-4 space-y-2">{years.data?.map((year) => <div key={year.id} className="rounded-xl bg-slate-50 p-3 text-sm"><b>{year.name}</b>{year.is_active ? <span className="ml-2 text-xs text-brand-700">Aktif</span> : <button className="ml-2 text-xs text-brand-700" onClick={() => void activateYear(year.id)}>Jadikan aktif</button>}</div>)}</div></Card>
      <Card><SectionTitle icon={Layers3} text="Tingkat perkembangan" /><form className="mt-4 space-y-3" onSubmit={addLevel}><input required name="name" placeholder="Kelompok A" className={inputClass} /><div className="grid grid-cols-2 gap-2"><input required name="code" placeholder="A" className={inputClass} /><input required type="number" min="1" name="position" placeholder="Urutan" className={inputClass} /></div><select name="nextLevelId" className={inputClass}><option value="">Tidak ada tingkat berikutnya</option>{levels.data?.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select><Button className="w-full"><Plus size={16} />Tambah tingkat</Button></form><div className="mt-4 space-y-2">{levels.data?.map((level) => <div key={level.id} className="rounded-xl bg-slate-50 p-3 text-sm"><b>{level.name}</b><span className="ml-2 text-slate-500">→ {level.next_level_name || "Lulus"}</span></div>)}</div></Card>
      <Card><SectionTitle icon={UsersRound} text="Kelas tahun aktif" /><p className="mt-2 text-sm text-slate-500">{activeYear ? `${activeYear.name} · Semester I dan II` : "Buat tahun ajaran terlebih dahulu."}</p><form className="mt-4 space-y-3" onSubmit={addClass}><input required disabled={!activeYear} name="name" placeholder="Kelas Apel" className={inputClass} /><select required disabled={!activeYear} name="educationLevelId" className={inputClass}><option value="">Pilih tingkat</option>{levels.data?.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select><Button disabled={!activeYear || !levels.data?.length} className="w-full"><Plus size={16} />Tambah kelas</Button></form><div className="mt-4 space-y-2">{periods.data?.map((period) => <div key={period.id} className="rounded-xl bg-slate-50 p-3 text-sm"><b>{period.name}</b><p className="text-slate-500">{period.level_name} · {period.homeroom_teacher_name || "Wali kelas belum ditetapkan"}</p></div>)}</div></Card>
    </div>
  </>;
}

function SectionTitle({ icon: Icon, text }: { icon: typeof School; text: string }) { return <div className="flex items-center gap-2"><span className="rounded-lg bg-brand-50 p-2 text-brand-700"><Icon size={18} /></span><h2 className="font-bold">{text}</h2></div>; }
