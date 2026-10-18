import { AlertCircle, Clock3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LifecycleProposal } from "../types";

type TeacherProposalListProps = {
	proposals: LifecycleProposal[];
	loading: boolean;
	onResubmit: (proposal: LifecycleProposal) => void;
};

function formatDate(value?: string | null) {
	if (!value) return null;

	return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function proposalLabel(type: LifecycleProposal["operation_type"]) {
	return type === "TRANSFER" ? "Perpindahan kelas" : "Kelulusan";
}

export function TeacherProposalList({ proposals, loading, onResubmit }: TeacherProposalListProps) {
	if (loading) {
		return <Card className="mb-6 text-sm text-slate-500">Memuat pengajuan Anda…</Card>;
	}

	if (!proposals.length) {
		return null;
	}

	return (
		<section className="mb-6">
			<div className="mb-3 flex items-end justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-brand-700">Status pengajuan</p>
					<h2 className="mt-1 text-lg font-bold text-slate-900">Pengajuan saya</h2>
				</div>
				<p className="text-sm text-slate-500">Pantau keputusan Kepala Sekolah di sini.</p>
			</div>
			<div className="grid gap-3 lg:grid-cols-2">
				{proposals.map((proposal) => {
					const rejected = proposal.status === "REJECTED";

					return (
						<Card key={proposal.id} className={rejected ? "border-amber-200" : undefined}>
							<div className="flex items-start justify-between gap-3">
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="font-bold text-slate-900">
											{proposalLabel(proposal.operation_type)}
										</h3>
										<span
											className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
												rejected ? "bg-amber-50 text-amber-800" : "bg-sky-50 text-sky-700"
											}`}
										>
											{rejected ? "Perlu diperbaiki" : "Menunggu persetujuan"}
										</span>
									</div>
									<p className="mt-1 text-sm text-slate-500">
										{proposal.students.length} murid · Diajukan {formatDate(proposal.created_at)}
									</p>
								</div>
								{rejected ? (
									<AlertCircle className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
								) : (
									<Clock3 className="size-5 shrink-0 text-sky-700" aria-hidden="true" />
								)}
							</div>
							<div className="mt-4 space-y-1.5 text-sm text-slate-700">
								{proposal.students.slice(0, 3).map((student) => (
									<p key={student.studentId}>
										<b>{student.studentName}</b>
										{student.className ? ` · ${student.className}` : ""}
										{student.targetClassName ? ` → ${student.targetClassName}` : ""}
									</p>
								))}
								{proposal.students.length > 3 ? (
									<p>dan {proposal.students.length - 3} murid lainnya</p>
								) : null}
							</div>
							{rejected ? (
								<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
									<p className="font-semibold">Catatan Kepala Sekolah</p>
									<p className="mt-1">{proposal.review_note}</p>
								</div>
							) : null}
							{rejected ? (
								<Button className="mt-4" variant="secondary" onClick={() => onResubmit(proposal)}>
									<RotateCcw className="mr-2 size-4" aria-hidden="true" />
									Perbaiki dan ajukan ulang
								</Button>
							) : null}
						</Card>
					);
				})}
			</div>
		</section>
	);
}
