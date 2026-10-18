"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LifecycleProposal } from "../types";

type PrincipalProposalQueueProps = {
	proposals: LifecycleProposal[];
	loading: boolean;
	pending: boolean;
	onDecide: (id: string, decision: "APPROVED" | "REJECTED", note?: string) => void;
};

export function PrincipalProposalQueue({
	proposals,
	loading,
	pending,
	onDecide,
}: PrincipalProposalQueueProps) {
	const [notes, setNotes] = useState<Record<string, string>>({});

	return (
		<>
			<PageHeader
				eyebrow="Persetujuan"
				title="Pengajuan perpindahan & kelulusan"
				description="Tinjau pengajuan guru sebelum perubahan administratif diterapkan."
				action={
					<Link href="/app/academic/archive">
						<Button variant="secondary">Lihat Arsip</Button>
					</Link>
				}
			/>
			{loading ? (
				<Card>Memuat pengajuan…</Card>
			) : proposals.length ? (
				<div className="space-y-4">
					{proposals.map((proposal) => (
						<Card key={proposal.id}>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<h2 className="font-bold">
										{proposal.operation_type === "TRANSFER" ? "Perpindahan kelas" : "Kelulusan"}
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										Diajukan oleh {proposal.requester_name} · {proposal.students.length} murid
									</p>
									{proposal.reason ? (
										<p className="mt-3 text-sm text-slate-700">Catatan guru: {proposal.reason}</p>
									) : null}
								</div>
								<div className="flex gap-2">
									<Button disabled={pending} onClick={() => onDecide(proposal.id, "APPROVED")}>
										Setujui
									</Button>
									<Button
										variant="danger"
										disabled={pending || !notes[proposal.id]?.trim()}
										onClick={() => onDecide(proposal.id, "REJECTED", notes[proposal.id])}
									>
										Tolak
									</Button>
								</div>
							</div>
							<div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
								<div className="divide-y divide-slate-100">
									{proposal.students.map((student) => (
										<div
											key={student.studentId}
											className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
										>
											<div>
												<p className="font-semibold text-slate-800">{student.studentName}</p>
												<p className="text-slate-500">
													{student.className || "Belum ditempatkan"}
													{student.targetClassName ? ` → ${student.targetClassName}` : ""}
												</p>
											</div>
											{student.effectiveOn ? (
												<span className="text-slate-500">Berlaku {student.effectiveOn}</span>
											) : null}
										</div>
									))}
								</div>
							</div>
							<label className="mt-4 block text-sm font-medium">
								Catatan keputusan{" "}
								<span className="font-normal text-slate-500">(wajib bila ditolak)</span>
								<textarea
									value={notes[proposal.id] ?? ""}
									onChange={(event) =>
										setNotes((value) => ({ ...value, [proposal.id]: event.target.value }))
									}
									className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm"
									placeholder="Tuliskan alasan bila pengajuan ditolak"
								/>
							</label>
						</Card>
					))}
				</div>
			) : (
				<Card className="py-10 text-center">
					<h2 className="font-bold">Tidak ada pengajuan menunggu</h2>
					<p className="mt-1 text-sm text-slate-500">
						Pengajuan guru yang baru akan tampil di sini.
					</p>
				</Card>
			)}
		</>
	);
}
