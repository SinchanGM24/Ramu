"use client";

import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Staff = { id: string; name: string; email: string; role: "TEACHER" | "PRINCIPAL" | "SCHOOL_ADMIN"; is_active: boolean };
type ClassPeriod = { id: string; name: string; level_name: string; academic_year_name: string; homeroom_teacher_name?: string };
const roleLabel = { TEACHER: "Guru", PRINCIPAL: "Kepala sekolah", SCHOOL_ADMIN: "Admin sekolah" } as const;

export function StaffPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => api<Staff[]>("/staff") });
  const periods = useQuery({ queryKey: ["academic", "class-periods"], queryFn: () => api<ClassPeriod[]>("/academic/class-periods") });
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setError(""); try { await api("/staff", { method: "POST", body: JSON.stringify({ name: data.get("name"), email: data.get("email"), role: data.get("role"), password: data.get("password") }) }); form.reset(); await queryClient.invalidateQueries({ queryKey: ["staff"] }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Akun staf tidak dapat dibuat."); } }
  async function toggle(person: Staff) { try { await api(`/staff/${person.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !person.is_active }) }); await queryClient.invalidateQueries({ queryKey: ["staff"] }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Status akun tidak dapat diubah."); } }
  async function assignHomeroom(teacherUserId: string, classPeriodId: string) { if (!classPeriodId) return; setError(""); try { await api(`/staff/class-periods/${classPeriodId}/homeroom`, { method: "POST", body: JSON.stringify({ teacherUserId }) }); await queryClient.invalidateQueries({ queryKey: ["academic", "class-periods"] }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Wali kelas tidak dapat ditetapkan."); } }
  return <><PageHeader eyebrow="Pengaturan sekolah" title="Staf sekolah" description="Buat akun guru dan kepala sekolah, lalu tetapkan wali kelas untuk setiap kelas." />{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="grid gap-6 xl:grid-cols-[360px_1fr]"><Card><h2 className="font-bold">Tambah staf</h2><form onSubmit={submit} className="mt-4 space-y-3"><input required name="name" placeholder="Nama lengkap" className="w-full rounded-xl border p-3 text-sm" /><input required name="email" type="email" placeholder="email@sekolah.id" className="w-full rounded-xl border p-3 text-sm" /><select required name="role" className="w-full rounded-xl border p-3 text-sm"><option value="TEACHER">Guru</option><option value="PRINCIPAL">Kepala sekolah</option></select><input required minLength={8} name="password" type="password" placeholder="Kata sandi awal (minimal 8 karakter)" className="w-full rounded-xl border p-3 text-sm" /><Button className="w-full"><Plus size={16} />Buat akun staf</Button></form></Card><Card><div className="flex items-center gap-2"><UserRound size={19} className="text-brand-700" /><h2 className="font-bold">Daftar staf dan penugasan</h2></div><p className="mt-1 text-sm text-slate-500">Satu kelas hanya memiliki satu wali kelas utama. Memilih guru baru akan menggantikan penugasan sebelumnya.</p><div className="mt-4 space-y-2">{staff.data?.map((person) => <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><b>{person.name}</b><p className="text-slate-500">{person.email} · {roleLabel[person.role]}</p>{person.role === "TEACHER" && <label className="mt-2 block text-xs text-slate-600">Tetapkan sebagai wali kelas<select defaultValue="" onChange={(event) => void assignHomeroom(person.id, event.target.value)} className="ml-2 rounded border bg-white px-2 py-1"><option value="">Pilih kelas</option>{periods.data?.map((period) => <option key={period.id} value={period.id}>{period.name} · {period.level_name} · {period.academic_year_name}{period.homeroom_teacher_name ? ` (${period.homeroom_teacher_name})` : ""}</option>)}</select></label>}</div>{person.role !== "SCHOOL_ADMIN" && <Button variant="secondary" onClick={() => void toggle(person)}>{person.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>}</div>)}</div></Card></div></>;
}
