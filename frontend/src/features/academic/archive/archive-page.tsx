"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
type Student = {
	id: string;
	name: string;
	student_number?: string | null;
	lifecycle_status: "ACTIVE" | "GRADUATED";
};
type History = {
	id: string;
	student_id?: string;
	student_name: string;
	action: string;
	effective_on: string;
	reason?: string | null;
};
export function ArchivePage() {
	const qc = useQueryClient(),
		[search, setSearch] = useState(""),
		[notice, setNotice] = useState(""),
		[error, setError] = useState("");
	const students = useQuery({
		queryKey: ["students"],
		queryFn: () => api<{ items: Student[] }>("/students?limit=100"),
	});
	const session = useQuery(authSessionQueryOptions);
	const canReverseGraduation = session.data?.role === "SCHOOL_ADMIN";
	const history = useQuery({
		queryKey: ["lifecycle", "history"],
		queryFn: () => api<History[]>("/lifecycle/history"),
	});
	const archived = useMemo(
		() =>
			students.data?.items.filter(
				(x) =>
					x.lifecycle_status === "GRADUATED" && x.name.toLowerCase().includes(search.toLowerCase()),
			) ?? [],
		[students.data, search],
	);
	async function reverse(studentId: string) {
		const reason = window.prompt("Tuliskan alasan pembatalan kelulusan.");
		if (!reason?.trim()) return;
		setError("");
		try {
			await api("/lifecycle/graduations/reverse", {
				method: "POST",
				body: JSON.stringify({
					studentId,
					effectiveOn: new Date().toISOString().slice(0, 10),
					reason,
				}),
			});
			setNotice("Kelulusan dibatalkan dan murid kembali aktif.");
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["students"] }),
				qc.invalidateQueries({ queryKey: ["lifecycle", "history"] }),
			]);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Kelulusan tidak dapat dibatalkan.");
		}
	}
	return (
		<>
			<PageHeader
				eyebrow="Manajemen siswa"
				title="Arsip"
				description="Riwayat murid yang telah dinyatakan lulus tetap tersimpan bersama riwayat akademiknya."
			/>
			{error && (
				<p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</p>
			)}
			{notice && (
				<p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
					{notice}
				</p>
			)}
			<Card>
				<div className="flex flex-col gap-4 border-b border-[#e7e7dc] pb-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="font-bold tracking-[-0.02em] text-brand-950">Murid dalam arsip</h2>
						<p className="mt-1 text-sm text-[#637065]">
							Riwayat akademik tetap tersimpan setelah murid dinyatakan lulus.
						</p>
					</div>
					<p className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
						{archived.length} murid
					</p>
				</div>
				<label className="relative mt-4 block">
					<span className="sr-only">Cari murid arsip</span>
					<Search
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#637065]"
						aria-hidden="true"
					/>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Cari nama atau nomor induk"
						className="w-full rounded-xl border border-[#dfe2d6] bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
				</label>
				<div className="mt-4 space-y-2">
					{archived.length ? (
						archived.map((x) => (
							<div
								key={x.id}
								className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7e7dc] bg-[#f7f7f1] p-4 text-sm"
							>
								<span>
									<b className="text-brand-950">{x.name}</b>
									<span className="ml-2 text-[#637065]">
										{x.student_number || "Tanpa nomor induk"}
									</span>
								</span>
								{canReverseGraduation && (
									<Button variant="secondary" onClick={() => void reverse(x.id)}>
										Batalkan kelulusan
									</Button>
								)}
							</div>
						))
					) : (
						<p className="py-8 text-center text-sm text-[#637065]">Belum ada murid dalam Arsip.</p>
					)}
				</div>
			</Card>
			<Card className="mt-5">
				<div className="flex items-center gap-3">
					<span className="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">
						<History size={19} />
					</span>
					<div>
						<h2 className="font-bold tracking-[-0.02em] text-brand-950">Riwayat administrasi</h2>
						<p className="mt-1 text-sm text-[#637065]">Catatan kelulusan dan pembatalannya.</p>
					</div>
				</div>
				<div className="mt-3 space-y-2">
					{history.data
						?.filter((x) => ["GRADUATED", "GRADUATION_REVERSED"].includes(x.action))
						.map((x) => (
							<div
								key={x.id}
								className="rounded-xl border border-[#e7e7dc] bg-[#f7f7f1] p-3 text-sm"
							>
								<b className="text-brand-950">{x.student_name}</b>
								<span className="ml-2 text-[#637065]">
									{x.action === "GRADUATED" ? "Dinyatakan lulus" : "Kelulusan dibatalkan"} ·{" "}
									{x.effective_on}
								</span>
								{x.reason && <p className="mt-1 text-[#4e5c50]">{x.reason}</p>}
							</div>
						))}
				</div>
			</Card>
		</>
	);
}
