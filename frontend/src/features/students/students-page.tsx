"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type Student = { id: string; name: string; student_number?: string; class_name?: string };
type ClassRoom = { id: string; name: string };

export function StudentsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const students = useQuery({ queryKey: ["students"], queryFn: () => api<{ items: Student[] }>("/students") });
  const classes = useQuery({ queryKey: ["academic", "classes"], queryFn: () => api<ClassRoom[]>("/academic/classes") });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/students", { method: "POST", body: JSON.stringify({ name: form.get("name"), studentNumber: form.get("studentNumber") || undefined, classId: form.get("classId") || undefined, gender: form.get("gender") || undefined }) });
      event.currentTarget.reset(); queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Tidak dapat menyimpan data murid"); }
  }

  return <>
    <PageHeader eyebrow="Data murid" title="Murid" description="Tambahkan murid lalu lengkapi profilnya sebelum membuat penilaian individual." />
    {error && <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card><h2 className="font-bold">Tambah murid</h2><form onSubmit={submit} className="mt-4 space-y-3"><input required name="name" placeholder="Nama lengkap murid" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /><input name="studentNumber" placeholder="Nomor induk (opsional)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /><select name="classId" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Belum ditempatkan di kelas</option>{classes.data?.map((classRoom) => <option key={classRoom.id} value={classRoom.id}>{classRoom.name}</option>)}</select><select name="gender" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Jenis kelamin (opsional)</option><option value="MALE">Laki-laki</option><option value="FEMALE">Perempuan</option></select><Button className="w-full"><Plus size={16} className="mr-1" />Tambah murid</Button></form></Card>
      <Card><div className="flex items-center gap-2"><UsersRound size={19} className="text-brand-600" /><h2 className="font-bold">Daftar murid</h2></div><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-slate-400"><tr><th className="pb-3 font-semibold">Nama</th><th className="pb-3 font-semibold">Nomor induk</th><th className="pb-3 font-semibold">Kelas</th><th className="pb-3" /></tr></thead><tbody>{students.isLoading ? <tr><td colSpan={4} className="py-6 text-slate-500">Memuat murid…</td></tr> : students.data?.items.length ? students.data.items.map((student) => <tr key={student.id} className="border-b border-slate-50"><td className="py-4 font-semibold text-slate-800">{student.name}</td><td className="py-4 text-slate-500">{student.student_number || "—"}</td><td className="py-4 text-slate-500">{student.class_name || "Belum ada kelas"}</td><td className="py-4 text-right"><Link href={`/app/academic/students/${student.id}`} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Lengkapi profil</Link></td></tr>) : <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada murid.</td></tr>}</tbody></table></div></Card>
    </div>
  </>;
}
