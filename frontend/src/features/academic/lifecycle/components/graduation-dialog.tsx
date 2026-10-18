"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { LifecycleActionPanel } from "./lifecycle-action-panel";
import type { LifecycleProposal, LifecycleStudent } from "../types";

const today = () => new Date().toISOString().slice(0, 10);
export function GraduationDialog({
	students,
	onClose,
	onSuccess,
	onError,
	isTeacher,
	initialProposal,
}: {
	students: LifecycleStudent[];
	onClose: () => void;
	onSuccess: (message: string) => Promise<void>;
	onError: (message: string) => void;
	isTeacher: boolean;
	initialProposal?: LifecycleProposal | null;
}) {
	const [effectiveOn, setEffectiveOn] = useState(initialProposal?.payload.effectiveOn ?? today());
	const [reason, setReason] = useState(initialProposal?.reason ?? "");
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
						resubmittedFromRequestId: initialProposal?.id,
					}),
				},
			);
			await onSuccess(
				isTeacher
					? initialProposal
						? `${result.submitted} pengajuan kelulusan yang diperbaiki telah dikirim ke Kepala Sekolah.`
						: `${result.submitted} pengajuan kelulusan telah dikirim ke Kepala Sekolah.`
					: `${result.processed} murid telah masuk ke Arsip.`,
			);
		} catch (error) {
			onError(error instanceof Error ? error.message : "Kelulusan tidak dapat diproses.");
		} finally {
			setSaving(false);
		}
	}
	return (
		<LifecycleActionPanel
			title={initialProposal ? "Perbaiki pengajuan kelulusan" : "Tinjau kelulusan"}
			onClose={onClose}
		>
			{initialProposal?.review_note ? (
				<p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
					<b>Catatan Kepala Sekolah:</b> {initialProposal.review_note}
				</p>
			) : null}
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
