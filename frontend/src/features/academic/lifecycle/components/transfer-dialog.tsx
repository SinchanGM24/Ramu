"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { LifecycleActionPanel } from "./lifecycle-action-panel";
import type { LifecycleClassGroup, LifecycleStudent } from "../types";

const today = () => new Date().toISOString().slice(0, 10);
export function TransferDialog({
	students,
	onClose,
	onSuccess,
	onError,
	isTeacher,
}: {
	students: LifecycleStudent[];
	onClose: () => void;
	onSuccess: (message: string) => Promise<void>;
	onError: (message: string) => void;
	isTeacher: boolean;
}) {
	const [defaultTarget, setDefaultTarget] = useState("");
	const [destinations, setDestinations] = useState<Record<string, string>>({});
	const [effectiveOn, setEffectiveOn] = useState(today());
	const [reason, setReason] = useState("");
	const [saving, setSaving] = useState(false);
	const classGroups = useQuery({
		queryKey: ["academic", "class-groups", "active"],
		queryFn: () => api<LifecycleClassGroup[]>("/academic/class-groups?activeOnly=true"),
	});
	const valid = students.every((student) => destinations[student.id] || defaultTarget);
	async function submit() {
		if (!valid) return;
		setSaving(true);
		onError("");
		try {
			const result = await api<{ processed?: number; submitted?: number }>(
				isTeacher ? "/lifecycle/proposals/transfers" : "/lifecycle/transfers",
				{
					method: "POST",
					body: JSON.stringify({
						items: students.map((student) => ({
							studentId: student.id,
							targetClassGroupId: destinations[student.id] || defaultTarget,
							effectiveOn,
							reason: reason || undefined,
						})),
						reason: reason || undefined,
					}),
				},
			);
			await onSuccess(
				isTeacher
					? `${result.submitted} pengajuan perpindahan telah dikirim ke Kepala Sekolah.`
					: `${result.processed} murid berhasil dipindahkan.`,
			);
		} catch (error) {
			onError(error instanceof Error ? error.message : "Perpindahan tidak dapat diproses.");
		} finally {
			setSaving(false);
		}
	}
	return (
		<LifecycleActionPanel title="Atur perpindahan kelas" onClose={onClose}>
			<div className="mt-5 grid gap-3 md:grid-cols-2">
				<label className="text-sm font-medium">
					Kelas tujuan default
					<select
						value={defaultTarget}
						onChange={(event) => setDefaultTarget(event.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					>
						<option value="">Pilih kelas</option>
						{classGroups.data?.map((group) => (
							<option key={group.id} value={group.id}>
								{group.name}
							</option>
						))}
					</select>
				</label>
				<label className="text-sm font-medium">
					Tanggal efektif
					<input
						type="date"
						value={effectiveOn}
						onChange={(event) => setEffectiveOn(event.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					/>
				</label>
				<label className="text-sm font-medium md:col-span-2">
					Alasan atau catatan (opsional)
					<textarea
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						className="mt-1 min-h-20 w-full rounded-xl border p-3"
					/>
				</label>
			</div>
			<h3 className="mt-6 font-bold">Tinjau murid dan tujuan</h3>
			<div className="mt-3 max-h-64 divide-y overflow-y-auto rounded-xl border">
				{students.map((student) => (
					<div key={student.id} className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_220px]">
						<span>
							<b>{student.name}</b>
							<span className="ml-2 text-slate-500">
								{student.class_name || "Belum ditempatkan"}
							</span>
						</span>
						<select
							value={destinations[student.id] || defaultTarget}
							onChange={(event) =>
								setDestinations((value) => ({ ...value, [student.id]: event.target.value }))
							}
							className="rounded-lg border p-2"
						>
							<option value="">Pilih tujuan</option>
							{classGroups.data?.map((group) => (
								<option key={group.id} value={group.id}>
									{group.name}
								</option>
							))}
						</select>
					</div>
				))}
			</div>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onClick={onClose}>
					Batal
				</Button>
				<Button disabled={!valid || saving} onClick={() => void submit()}>
					{saving ? "Memproses…" : isTeacher ? "Ajukan perpindahan" : "Konfirmasi perpindahan"}
				</Button>
			</div>
		</LifecycleActionPanel>
	);
}
