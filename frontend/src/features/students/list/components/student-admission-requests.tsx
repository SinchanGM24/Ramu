import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdmissionRequest } from "../types";

type StudentAdmissionRequestsProps = {
	isTeacher: boolean;
	loading: boolean;
	pending: boolean;
	resubmittingId?: string;
	rows: AdmissionRequest[];
	onDecide: (id: string, decision: "APPROVED" | "REJECTED", note?: string) => void;
	onResubmit: (request: AdmissionRequest) => void;
};

export function StudentAdmissionRequests({
	isTeacher,
	loading,
	pending,
	resubmittingId,
	rows,
	onDecide,
	onResubmit,
}: StudentAdmissionRequestsProps) {
	const [notes, setNotes] = useState<Record<string, string>>({});
	const resubmittedRequestIds = new Set(
		rows.flatMap((item) =>
			item.resubmitted_from_request_id ? [item.resubmitted_from_request_id] : [],
		),
	);

	if (loading) {
		return (
			<Card className="py-10 text-center text-sm text-slate-500">Memuat pengajuan murid…</Card>
		);
	}
	if (!rows.length) {
		return (
			<Card className="py-12 text-center">
				<h2 className="font-bold text-slate-700">Belum ada pengajuan murid</h2>
				<p className="mt-1 text-sm text-slate-500">
					Pengajuan penambahan murid dari guru akan tampil di sini.
				</p>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			{rows.map((item) => (
				<Card key={item.id}>
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="font-bold text-slate-900">{item.payload.name}</h2>
								<RequestStatus status={item.status} />
							</div>
							<p className="mt-1 text-sm text-slate-500">
								{item.class_name} ·{" "}
								{isTeacher ? "Pengajuan Anda" : `Diajukan oleh ${item.requester_name}`}
							</p>
							{item.review_note ? (
								<p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
									Catatan: {item.review_note}
								</p>
							) : null}
						</div>
						{!isTeacher && item.status === "PENDING" ? (
							<div className="flex gap-2">
								<Button disabled={pending} onClick={() => onDecide(item.id, "APPROVED")}>
									Setujui
								</Button>
								<Button
									variant="danger"
									disabled={pending || !notes[item.id]?.trim()}
									onClick={() => onDecide(item.id, "REJECTED", notes[item.id])}
								>
									Tolak
								</Button>
							</div>
						) : null}
						{isTeacher && item.status === "REJECTED" && !resubmittedRequestIds.has(item.id) ? (
							<Button
								className="shrink-0"
								variant="secondary"
								disabled={Boolean(resubmittingId)}
								onClick={() => onResubmit(item)}
							>
								{resubmittingId === item.id ? "Menyiapkan formulir…" : "Perbaiki dan ajukan ulang"}
							</Button>
						) : null}
						{isTeacher && item.status === "REJECTED" && resubmittedRequestIds.has(item.id) ? (
							<p className="text-sm font-medium text-slate-500">Pengajuan ulang sudah dibuat</p>
						) : null}
					</div>
					{!isTeacher && item.status === "PENDING" ? (
						<label className="mt-4 block text-sm font-medium text-slate-700">
							Catatan keputusan{" "}
							<span className="font-normal text-slate-500">(wajib bila ditolak)</span>
							<textarea
								value={notes[item.id] ?? ""}
								onChange={(event) =>
									setNotes((value) => ({ ...value, [item.id]: event.target.value }))
								}
								placeholder="Tuliskan alasan bila pengajuan ditolak"
								className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
							/>
						</label>
					) : null}
				</Card>
			))}
		</div>
	);
}

function RequestStatus({ status }: { status: AdmissionRequest["status"] }) {
	const copy =
		status === "PENDING"
			? ["Menunggu", "bg-amber-50 text-amber-700"]
			: status === "APPROVED"
				? ["Disetujui", "bg-emerald-50 text-emerald-700"]
				: ["Ditolak", "bg-red-50 text-red-700"];
	return (
		<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${copy[1]}`}>{copy[0]}</span>
	);
}
