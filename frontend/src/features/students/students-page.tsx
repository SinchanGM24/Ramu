"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UsersRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type Student = { id: string; name: string; student_number?: string; class_name?: string };
type ClassRoom = { id: string; name: string };

export function StudentsPage() {
	const queryClient = useQueryClient();
	const [error, setError] = useState("");
	const [addOpen, setAddOpen] = useState(false);
	const students = useQuery({ queryKey: ["students"], queryFn: () => api<{ items: Student[] }>("/students") });
	const classes = useQuery({ queryKey: ["academic", "class-periods"], queryFn: () => api<ClassRoom[]>("/academic/class-periods") });

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		const values = new FormData(event.currentTarget);
		try {
			await api("/students", { method: "POST", body: JSON.stringify({ name: values.get("name"), studentNumber: values.get("studentNumber") || undefined, classPeriodId: values.get("classPeriodId") || undefined, gender: values.get("gender") || undefined }) });
			event.currentTarget.reset();
			setAddOpen(false);
			await queryClient.invalidateQueries({ queryKey: ["students"] });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Tidak dapat menyimpan data murid");
		}
	}

	return <>
		<PageHeader eyebrow="Data murid" title="Murid" description="Tambahkan murid lalu lengkapi profilnya sebelum membuat penilaian individual." action={<Button onClick={() => { setError(""); setAddOpen(true); }}><Plus size={16} className="mr-1" />Tambah murid</Button>} />
		{error && !addOpen && <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
		<Card>
			<div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><UsersRound size={19} className="text-brand-600" /><h2 className="font-bold">Daftar murid</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{students.data?.items.length || 0} murid</span></div>
			<div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-slate-400"><tr><th className="pb-3 font-semibold">Nama</th><th className="pb-3 font-semibold">Nomor induk</th><th className="pb-3 font-semibold">Kelas</th><th className="pb-3" /></tr></thead><tbody>
				{students.isLoading ? <tr><td colSpan={4} className="py-6 text-slate-500">Memuat murid…</td></tr> : students.data?.items.length ? students.data.items.map((student) => <tr key={student.id} className="border-b border-slate-50"><td className="py-4 font-semibold text-slate-800">{student.name}</td><td className="py-4 text-slate-500">{student.student_number || "—"}</td><td className="py-4 text-slate-500">{student.class_name || "Belum ada kelas"}</td><td className="py-4 text-right"><Link href={`/app/academic/students/${student.id}`} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Kelola</Link></td></tr>) : <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada murid.</td></tr>}
			</tbody></table></div>
		</Card>
		{addOpen && <AddStudentPanel classes={classes.data || []} error={error} onClose={() => setAddOpen(false)} onSubmit={submit} />}
	</>;
}

function AddStudentPanel({ classes, error, onClose, onSubmit }: { classes: ClassRoom[]; error: string; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
	useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
	return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="add-student-title" className="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="add-student-title" className="text-xl font-bold">Tambah murid</h2><p className="mt-1 text-sm text-slate-500">Data dasar dapat dilengkapi kembali dari profil murid.</p></div><button onClick={onClose} aria-label="Tutup panel" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={(event) => void onSubmit(event)} className="mt-5 space-y-3"><input required name="name" placeholder="Nama lengkap murid" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /><input name="studentNumber" placeholder="Nomor induk (opsional)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /><select name="classPeriodId" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Belum ditempatkan di kelas</option>{classes.map((classRoom) => <option key={classRoom.id} value={classRoom.id}>{classRoom.name}</option>)}</select><select name="gender" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Jenis kelamin (opsional)</option><option value="MALE">Laki-laki</option><option value="FEMALE">Perempuan</option></select><div className="flex justify-end gap-2 pt-3"><Button type="button" variant="secondary" onClick={onClose}>Batal</Button><Button><Plus size={16} className="mr-1" />Simpan murid</Button></div></form></section></div>;
}
