"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
			{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
			{notice && (
				<p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>
			)}
			<Card>
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Cari nama atau nomor induk"
					className="w-full rounded-xl border p-3 text-sm"
				/>
				<div className="mt-4 space-y-2">
					{archived.length ? (
						archived.map((x) => (
							<div
								key={x.id}
								className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm"
							>
								<span>
									<b>{x.name}</b>
									<span className="ml-2 text-slate-500">
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
						<p className="py-6 text-center text-sm text-slate-500">Belum ada murid dalam Arsip.</p>
					)}
				</div>
			</Card>
			<Card className="mt-5">
				<h2 className="font-bold">Riwayat administrasi</h2>
				<div className="mt-3 space-y-2">
					{history.data
						?.filter((x) => ["GRADUATED", "GRADUATION_REVERSED"].includes(x.action))
						.map((x) => (
							<div key={x.id} className="rounded-xl bg-slate-50 p-3 text-sm">
								<b>{x.student_name}</b>
								<span className="ml-2 text-slate-500">
									{x.action === "GRADUATED" ? "Dinyatakan lulus" : "Kelulusan dibatalkan"} ·{" "}
									{x.effective_on}
								</span>
								{x.reason && <p className="mt-1 text-slate-600">{x.reason}</p>}
							</div>
						))}
				</div>
			</Card>
		</>
	);
}
