"use client";

import { FormEvent, type ReactNode, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Layers3, Plus, School } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type AcademicYear = { id: string; name: string; starts_on: string; ends_on: string };
type Semester = { id: string; name: string; starts_on: string; ends_on: string; academic_year_id: string; academic_year_name: string };
type ClassRoom = { id: string; name: string; academic_year_name: string };

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500";

export function AcademicPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const years = useQuery({ queryKey: ["academic", "years"], queryFn: () => api<AcademicYear[]>("/academic/years") });
  const semesters = useQuery({ queryKey: ["academic", "semesters"], queryFn: () => api<Semester[]>("/academic/semesters") });
  const classes = useQuery({ queryKey: ["academic", "classes"], queryFn: () => api<ClassRoom[]>("/academic/classes") });

  async function submit(form: HTMLFormElement, path: string, body: Record<string, FormDataEntryValue | null>, key: string[]) {
    setError("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      form.reset();
      await queryClient.invalidateQueries({ queryKey: key });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Data tidak dapat disimpan.");
    }
  }

  function addYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    void submit(form, "/academic/years", { name: values.get("name"), startsOn: values.get("startsOn"), endsOn: values.get("endsOn") }, ["academic", "years"]);
  }

  function addSemester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    void submit(form, "/academic/semesters", { name: values.get("name"), academicYearId: values.get("academicYearId"), startsOn: values.get("startsOn"), endsOn: values.get("endsOn") }, ["academic", "semesters"]);
  }

  function addClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    void submit(form, "/academic/classes", { name: values.get("name"), academicYearId: values.get("academicYearId") }, ["academic", "classes"]);
  }

  return <>
    <PageHeader eyebrow="Data akademik" title="Tahun ajaran, semester, dan kelas" description="Siapkan urutan data akademik sebelum membuat rapor murid." />
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-6 xl:grid-cols-3">
      <Card>
        <Heading icon={CalendarDays} title="1. Tahun ajaran" description="Periode utama pembelajaran sekolah." />
        <form onSubmit={addYear} className="mt-5 grid gap-3">
          <input required name="name" pattern="[0-9]{4}/[0-9]{4}" placeholder="2026/2027" className={inputClass} />
          <input required name="startsOn" type="date" className={inputClass} />
          <input required name="endsOn" type="date" className={inputClass} />
          <Button><Plus size={16} className="mr-1" />Tambah tahun ajaran</Button>
        </form>
        <List loading={years.isLoading} empty="Belum ada tahun ajaran.">{years.data?.map((year) => <Row key={year.id} title={year.name} detail={`${year.starts_on} — ${year.ends_on}`} />)}</List>
      </Card>

      <Card>
        <Heading icon={Layers3} title="2. Semester" description="Buat Semester I dan Semester II untuk setiap tahun ajaran." />
        <form onSubmit={addSemester} className="mt-5 grid gap-3">
          <select required name="academicYearId" disabled={!years.data?.length} className={inputClass}><option value="">Pilih tahun ajaran</option>{years.data?.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select>
          <select required name="name" disabled={!years.data?.length} className={inputClass}><option value="Semester I">Semester I</option><option value="Semester II">Semester II</option></select>
          <input required name="startsOn" type="date" disabled={!years.data?.length} className={inputClass} />
          <input required name="endsOn" type="date" disabled={!years.data?.length} className={inputClass} />
          <Button disabled={!years.data?.length}><Plus size={16} className="mr-1" />Tambah semester</Button>
        </form>
        <List loading={semesters.isLoading} empty="Buat tahun ajaran, lalu Semester I dan Semester II.">{semesters.data?.map((semester) => <Row key={semester.id} title={`${semester.name} · ${semester.academic_year_name}`} detail={`${semester.starts_on} — ${semester.ends_on}`} />)}</List>
      </Card>

      <Card>
        <Heading icon={School} title="3. Kelas" description="Kelompokkan murid berdasarkan tahun ajaran." />
        <form onSubmit={addClass} className="mt-5 grid gap-3">
          <input required name="name" placeholder="Contoh: Kelompok A" className={inputClass} />
          <select required name="academicYearId" disabled={!years.data?.length} className={inputClass}><option value="">Pilih tahun ajaran</option>{years.data?.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select>
          <Button disabled={!years.data?.length}><Plus size={16} className="mr-1" />Tambah kelas</Button>
        </form>
        <List loading={classes.isLoading} empty="Buat tahun ajaran sebelum menambahkan kelas.">{classes.data?.map((classRoom) => <Row key={classRoom.id} title={classRoom.name} detail={classRoom.academic_year_name} />)}</List>
      </Card>
    </div>
  </>;
}

function Heading({ icon: Icon, title, description }: { icon: typeof CalendarDays; title: string; description: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={20} /></span><div><h2 className="font-bold">{title}</h2><p className="text-sm text-slate-500">{description}</p></div></div>;
}

function List({ loading, empty, children }: { loading: boolean; empty: string; children?: ReactNode }) {
  return <div className="mt-5 space-y-2">{loading ? <p className="text-sm text-slate-500">Memuat data…</p> : children ? children : <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">{empty}</p>}</div>;
}

function Row({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm"><strong className="block text-slate-800">{title}</strong><span className="mt-1 block text-slate-500">{detail}</span></div>;
}
