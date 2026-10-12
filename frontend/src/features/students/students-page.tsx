"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type Student = { id: string; name: string; student_number?: string | null; class_name?: string | null; class_group_id?: string | null };
type StudentList = { items: Student[]; total: number; page: number };
type ClassGroup = { id: string; name: string };
type AdmissionRequest = { id: string; status: "PENDING" | "APPROVED" | "REJECTED"; payload: { name: string }; class_name: string; requester_name: string; review_note?: string | null; created_at: string };
type Tab = "students" | "requests";

const pageSize = 10;
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function StudentsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("students");
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [classGroupId, setClassGroupId] = useState("");
  const [formError, setFormError] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const session = useQuery({ queryKey: ["session"], queryFn: () => api<{ role: string }>("/auth/session") });
  const isTeacher = session.data?.role === "TEACHER";
  const classes = useQuery({ queryKey: ["academic", "class-groups", "active"], queryFn: () => api<ClassGroup[]>("/academic/class-groups?activeOnly=true") });
  const students = useQuery({
    queryKey: ["students", page, debouncedSearch, classGroupId],
    queryFn: () => api<StudentList>(`/students?page=${page}&limit=${pageSize}&search=${encodeURIComponent(debouncedSearch)}${classGroupId ? `&classGroupId=${classGroupId}` : ""}`),
  });
  const requests = useQuery({ queryKey: ["student-requests"], queryFn: () => api<AdmissionRequest[]>("/students/requests"), enabled: tab === "requests" });
  const decide = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: "APPROVED" | "REJECTED"; note?: string }) => api(`/students/requests/${id}/decision`, { method: "POST", body: JSON.stringify({ decision, note }) }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["student-requests"] }); void queryClient.invalidateQueries({ queryKey: ["students"] }); },
  });

  useEffect(() => { setPage(1); }, [debouncedSearch, classGroupId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFormError("");
    try {
      const result = await api<{ requestPending?: boolean }>("/students", { method: "POST", body: JSON.stringify({ name: form.get("name"), studentNumber: form.get("studentNumber") || undefined, classGroupId: form.get("classGroupId"), gender: form.get("gender") || undefined }) });
      setModalOpen(false);
      if (result.requestPending) setTab("requests");
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      await queryClient.invalidateQueries({ queryKey: ["student-requests"] });
    } catch (error) { setFormError(error instanceof Error ? error.message : "Data murid belum dapat disimpan."); }
  }

  return <>
    <PageHeader eyebrow="Data murid" title="Murid" description={isTeacher ? "Lihat dan lengkapi data murid pada kelas penugasan Anda. Murid baru menunggu persetujuan Admin Sekolah." : "Kelola data murid, penempatan kelas, dan tinjau pengajuan murid dari guru."} action={<Button onClick={() => { setFormError(""); setModalOpen(true); }}><Plus className="mr-1.5 size-4" />Tambah murid</Button>} />
    <div className="mb-5 flex gap-5 border-b border-slate-200" role="tablist" aria-label="Data murid">
      <TabButton active={tab === "students"} onClick={() => setTab("students")}>Daftar murid</TabButton>
      <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>{isTeacher ? "Pengajuan saya" : "Pengajuan guru"}</TabButton>
    </div>
    {tab === "students" ? <Card>
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="font-bold text-slate-900">Daftar murid</h2><p className="mt-1 text-sm text-slate-500">Gunakan pencarian atau filter kelas untuk mempersempit daftar.</p></div>
        <p className="text-sm text-slate-500">{students.data?.total ?? 0} murid</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
        <label className="relative"><span className="sr-only">Cari murid</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari nama atau nomor induk" className={`${inputClass} pl-9`} /></label>
        <label><span className="sr-only">Filter kelas</span><select value={classGroupId} onChange={event => setClassGroupId(event.target.value)} className={inputClass}><option value="">Semua kelas</option>{classes.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[580px] text-left text-sm"><thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="pb-3">Murid</th><th className="pb-3">Kelas saat ini</th><th className="pb-3 text-right">Aksi</th></tr></thead><tbody>
          {students.isLoading ? <LoadingRows /> : students.isError ? <tr><td colSpan={3} className="py-10 text-center text-red-700">Daftar murid tidak dapat dimuat. <button type="button" className="font-semibold underline" onClick={() => void students.refetch()}>Coba lagi</button></td></tr> : students.data?.items.length ? students.data.items.map(student => <tr key={student.id} className="border-b border-slate-100 last:border-0"><td className="py-4"><p className="font-semibold text-slate-900">{student.name}</p><p className="mt-1 text-xs text-slate-500">{student.student_number ? `Nomor induk: ${student.student_number}` : "Nomor induk belum diisi"}</p></td><td className="py-4"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{student.class_name || "Belum ditempatkan"}</span></td><td className="py-4 text-right"><Link href={`/app/academic/students/${student.id}`} className="font-semibold text-brand-700 hover:text-brand-800">Kelola</Link></td></tr>) : <tr><td colSpan={3} className="py-12 text-center"><p className="font-semibold text-slate-700">Tidak ada murid yang ditemukan</p><p className="mt-1 text-sm text-slate-500">Ubah pencarian atau filter kelas, atau tambahkan murid baru.</p></td></tr>}
        </tbody></table>
      </div>
      <PaginationControls page={page} pageSize={pageSize} total={students.data?.total ?? 0} onPageChange={setPage} />
    </Card> : <Requests rows={requests.data ?? []} loading={requests.isLoading} isTeacher={isTeacher} pending={decide.isPending} onDecide={(id, decision, note) => decide.mutate({ id, decision, note })} />}
    {modalOpen && <StudentModal title="Tambah murid" onClose={() => setModalOpen(false)}><p className="text-sm leading-6 text-slate-500">{isTeacher ? "Pengajuan akan ditinjau Admin Sekolah sebelum murid ditempatkan pada kelas." : "Murid akan langsung disimpan dan ditempatkan pada kelas pilihan."}</p>{formError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2"><input required name="name" placeholder="Nama lengkap murid" className={inputClass} /><input name="studentNumber" placeholder="Nomor induk (opsional)" className={inputClass} /><select required name="classGroupId" className={inputClass}><option value="">Pilih kelas</option>{classes.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="gender" className={inputClass}><option value="">Jenis kelamin (opsional)</option><option value="MALE">Laki-laki</option><option value="FEMALE">Perempuan</option></select><div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button><Button>Simpan murid</Button></div></form></StudentModal>}
  </>;
}

function Requests({ rows, loading, isTeacher, pending, onDecide }: { rows: AdmissionRequest[]; loading: boolean; isTeacher: boolean; pending: boolean; onDecide: (id: string, decision: "APPROVED" | "REJECTED", note?: string) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  return <div className="space-y-3">{loading ? <Card className="py-10 text-center text-sm text-slate-500">Memuat pengajuan murid…</Card> : rows.length ? rows.map(item => <Card key={item.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{item.payload.name}</h2><RequestStatus status={item.status} /></div><p className="mt-1 text-sm text-slate-500">{item.class_name} · {isTeacher ? "Pengajuan Anda" : `Diajukan oleh ${item.requester_name}`}</p>{item.review_note && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Catatan: {item.review_note}</p>}</div>{!isTeacher && item.status === "PENDING" && <div className="flex gap-2"><Button disabled={pending} onClick={() => onDecide(item.id, "APPROVED")}>Setujui</Button><Button variant="danger" disabled={pending || !notes[item.id]?.trim()} onClick={() => onDecide(item.id, "REJECTED", notes[item.id])}>Tolak</Button></div>}</div>{!isTeacher && item.status === "PENDING" && <label className="mt-4 block text-sm font-medium text-slate-700">Catatan keputusan <span className="font-normal text-slate-500">(wajib bila ditolak)</span><textarea value={notes[item.id] ?? ""} onChange={event => setNotes(value => ({ ...value, [item.id]: event.target.value }))} placeholder="Tuliskan alasan bila pengajuan ditolak" className={`${inputClass} mt-2 min-h-20`} /></label>}</Card>) : <Card className="py-12 text-center"><h2 className="font-bold text-slate-700">Belum ada pengajuan murid</h2><p className="mt-1 text-sm text-slate-500">Pengajuan penambahan murid dari guru akan tampil di sini.</p></Card>}</div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`border-b-2 px-1 py-3 text-sm font-semibold transition ${active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{children}</button>; }
function RequestStatus({ status }: { status: AdmissionRequest["status"] }) { const copy = status === "PENDING" ? ["Menunggu", "bg-amber-50 text-amber-700"] : status === "APPROVED" ? ["Disetujui", "bg-emerald-50 text-emerald-700"] : ["Ditolak", "bg-red-50 text-red-700"]; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${copy[1]}`}>{copy[0]}</span>; }
function LoadingRows() { return <>{Array.from({ length: 4 }, (_, index) => <tr key={index} className="border-b border-slate-100"><td className="py-4"><div className="h-4 w-40 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" /></td><td><div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" /></td><td /></tr>)}</>; }
function StudentModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]); return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="student-modal-title" className="mx-auto my-10 w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Data murid</p><h2 id="student-modal-title" className="mt-1 text-xl font-bold text-slate-950">{title}</h2></div><button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="size-5" /></button></div>{children}</section></div>; }
