"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type Staff = { id: string; name: string; email: string; phone: string | null; role: "TEACHER" | "PRINCIPAL" | "SCHOOL_ADMIN"; is_active: boolean };
type StaffResponse = { items: Staff[]; total: number; page: number };
const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm";
const pageSize = 5;

export function StaffPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Staff | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => { setPage(1); }, [debouncedSearch]);
  const staff = useQuery({ queryKey: ["staff", page, debouncedSearch], queryFn: () => api<StaffResponse>(`/staff?page=${page}&limit=${pageSize}&search=${encodeURIComponent(debouncedSearch)}`) });

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api("/staff", { method: "POST", body: JSON.stringify({ name: data.get("name"), email: data.get("email"), phone: data.get("phone") || undefined, role: data.get("role"), password: data.get("password") }) });
      form.reset();
      setCreating(false);
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Akun tidak dapat dibuat.");
    }
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    try {
      await api(`/staff/${editing.id}`, { method: "PATCH", body: JSON.stringify({ name: data.get("name"), phone: data.get("phone") || undefined, role: data.get("role"), isActive: data.get("isActive") === "true", password: data.get("password") || undefined }) });
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Akun tidak dapat diperbarui.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Pengaturan sekolah" title="Kelola akun" description="Buat dan perbarui nama, peran, kata sandi, serta status akun sekolah." action={<Button onClick={() => { setError(""); setCreating(true); }}><Plus size={16} />Tambah akun</Button>} />
      {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Daftar akun</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{staff.data?.total || 0} akun</span></div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, email, atau nomor telepon" className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Nomor telepon</th><th className="px-4 py-3">Peran</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody>{staff.data?.items.map((account) => <tr key={account.id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold"><span className="block">{account.name}</span><span className="font-normal text-slate-500">{account.email}</span></td><td className="px-4 py-3 text-slate-600">{account.phone || "Belum diisi"}</td><td className="px-4 py-3">{roleName(account.role)}</td><td className="px-4 py-3">{account.is_active ? "Aktif" : "Nonaktif"}</td><td className="px-4 py-3 text-right"><Button variant="ghost" className="min-h-9 px-3" onClick={() => setEditing(account)}><Edit3 size={15} />Edit</Button></td></tr>)}</tbody>
          </table>
        </div>
        <PaginationControls page={page} pageSize={pageSize} total={staff.data?.total || 0} onPageChange={setPage} />
      </Card>
      {creating && <Modal title="Tambah akun" onClose={() => setCreating(false)}><form autoComplete="off" onSubmit={create} className="space-y-3"><label className="block text-sm font-semibold">Nama lengkap<input required name="name" autoComplete="off" className={`${inputClass} mt-1`} /></label><label className="block text-sm font-semibold">Email<input required name="email" type="email" autoComplete="off" placeholder="email@sekolah.id" className={`${inputClass} mt-1`} /></label><label className="block text-sm font-semibold">Nomor telepon<span className="mt-1 block text-xs font-normal text-slate-500">Dipakai sebagai kontak guru pada rapor.</span><input name="phone" type="tel" autoComplete="off" placeholder="08xxxxxxxxxx" className={`${inputClass} mt-1`} /></label><label className="block text-sm font-semibold">Peran<select required name="role" autoComplete="off" className={`${inputClass} mt-1`}><option value="TEACHER">Guru</option><option value="PRINCIPAL">Kepala sekolah</option></select></label><label className="block text-sm font-semibold">Kata sandi awal<input required minLength={8} name="password" type="password" autoComplete="new-password" className={`${inputClass} mt-1`} /></label><div className="flex justify-end gap-2 pt-3"><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Batal</Button><Button type="submit"><Plus size={16} />Buat akun</Button></div></form></Modal>}
      {editing && <StaffEditModal editing={editing} onClose={() => setEditing(null)} onSubmit={update} />}
    </>
  );
}

function roleName(role: Staff["role"]) { return role === "TEACHER" ? "Guru" : role === "PRINCIPAL" ? "Kepala sekolah" : "Admin sekolah"; }
function StaffEditModal({ editing, onClose, onSubmit }: { editing: Staff; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [isActive, setIsActive] = useState(editing.is_active);
  return <Modal title="Edit akun" onClose={onClose}><form autoComplete="off" onSubmit={onSubmit} className="space-y-3"><label className="block text-sm font-semibold">Nama<input required name="name" autoComplete="off" defaultValue={editing.name} className={`${inputClass} mt-1`} /></label><label className="block text-sm font-semibold">Nomor telepon<input name="phone" type="tel" autoComplete="off" defaultValue={editing.phone || ""} className={`${inputClass} mt-1`} /></label><label className="block text-sm font-semibold">Peran<select name="role" autoComplete="off" defaultValue={editing.role} className={`${inputClass} mt-1`}><option value="TEACHER">Guru</option><option value="PRINCIPAL">Kepala sekolah</option></select></label><label className="block text-sm font-semibold">Kata sandi baru<span className="mt-1 block text-xs font-normal text-slate-500">Kosongkan jika tidak ingin mengganti.</span><input name="password" minLength={8} type="password" autoComplete="new-password" className={`${inputClass} mt-1`} /></label><div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><div><p className="text-sm font-semibold text-slate-700">Status akun</p><p className="text-xs text-slate-500">{isActive ? "Akun dapat digunakan" : "Akun tidak dapat digunakan"}</p></div><Switch name="isActive" checked={isActive} onChange={setIsActive} aria-label="Ubah status akun" /></div><div className="flex justify-end gap-2 pt-3"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit">Simpan perubahan</Button></div></form></Modal>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" className="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-bold">{title}</h2><button type="button" onClick={onClose} aria-label="Tutup dialog" className="text-xl text-slate-500">×</button></div><div className="mt-5">{children}</div></section></div>; }
