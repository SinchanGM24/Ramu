"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { LifecycleActionPanel } from "./lifecycle-action-panel";
import type { LifecycleStudent } from "../types";

const today = () => new Date().toISOString().slice(0, 10);
export function GraduationDialog({
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
	const [effectiveOn, setEffectiveOn] = useState(today());
	const [reason, setReason] = useState("");
	const [saving, setSaving] = useState(false);
	async function submit() {
		setSaving(true);
		onError("");
		try {
			const result = await api<{ processed?: number; submitted?: number }>(
				isTeacher ? "/lifecycle/proposals/graduations" : "/lifecycle/graduations",
				{
					method: "POST",
					body: JSON.stringify({
						studentIds: students.map((student) => student.id),
						effectiveOn,
						reason: reason || undefined,
					}),
				},
			);
			await onSuccess(
				isTeacher
					? `${result.submitted} pengajuan kelulusan telah dikirim ke Kepala Sekolah.`
					: `${result.processed} murid telah masuk ke Arsip.`,
			);
		} catch (error) {
			onError(error instanceof Error ? error.message : "Kelulusan tidak dapat diproses.");
		} finally {
			setSaving(false);
		}
	}
	return (
		<LifecycleActionPanel title="Tinjau kelulusan" onClose={onClose}>
			<p className="mt-3 text-sm leading-6 text-slate-600">
				Murid yang dikonfirmasi lulus akan dipindahkan ke Arsip. Riwayat akademik dan raport mereka
				tetap tersimpan.
			</p>
			<div className="mt-5 grid gap-3 md:grid-cols-2">
				<label className="text-sm font-medium">
					Tanggal kelulusan
					<input
						type="date"
						value={effectiveOn}
						onChange={(event) => setEffectiveOn(event.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					/>
				</label>
				<label className="text-sm font-medium">
					Alasan atau catatan (opsional)
					<input
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					/>
				</label>
			</div>
			<div className="mt-5 rounded-xl border p-3 text-sm">
				<b>{students.length} murid akan masuk ke Arsip</b>
				<ul className="mt-2 list-disc space-y-1 pl-5">
					{students.map((student) => (
						<li key={student.id}>{student.name}</li>
					))}
				</ul>
			</div>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onClick={onClose}>
					Batal
				</Button>
				<Button variant="danger" disabled={saving} onClick={() => void submit()}>
					{saving ? "Memproses…" : isTeacher ? "Ajukan kelulusan" : "Konfirmasi kelulusan"}
				</Button>
			</div>
		</LifecycleActionPanel>
	);
}
