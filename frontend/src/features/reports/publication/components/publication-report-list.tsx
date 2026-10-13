import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { PublishReportAction } from "./publish-report-action";
import type { PublicationReport, PublicationStatus } from "../types";

type PublicationReportListProps = {
	canPublish: boolean;
	counts: { approved: number; published: number };
	loading: boolean;
	page: number;
	pending: boolean;
	reports: PublicationReport[];
	search: string;
	status: PublicationStatus;
	total: number;
	onPageChange: (page: number) => void;
	onPublish: (reportId: string) => void;
	onSearchChange: (value: string) => void;
	onStatusChange: (status: PublicationStatus) => void;
};

const statusCopy: Record<PublicationStatus, { label: string; tone: "green" | "amber" }> = {
	APPROVED: { label: "Siap diterbitkan", tone: "amber" },
	PUBLISHED: { label: "Sudah diterbitkan", tone: "green" },
};

export function PublicationReportList({
	canPublish,
	counts,
	loading,
	page,
	pending,
	reports,
	search,
	status,
	total,
	onPageChange,
	onPublish,
	onSearchChange,
	onStatusChange,
}: PublicationReportListProps) {
	return (
		<Card>
			<div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-bold text-slate-900">Daftar publikasi rapor</h2>
					<p className="mt-1 text-sm text-slate-500">
						Terbitkan rapor yang sudah disetujui, lalu kirimkan kepada wali.
					</p>
				</div>
				<div className="flex gap-2 text-sm text-slate-500">
					<span>{counts.approved} siap terbit</span>
					<span aria-hidden="true">·</span>
					<span>{counts.published} telah terbit</span>
				</div>
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
				<input
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Cari nama murid"
					className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
				/>
				<div className="flex gap-2" role="tablist" aria-label="Tahap publikasi rapor">
					{(
						[
							["APPROVED", "Siap diterbitkan", counts.approved],
							["PUBLISHED", "Sudah diterbitkan", counts.published],
						] as const
					).map(([value, label, count]) => (
						<button
							key={value}
							type="button"
							role="tab"
							aria-selected={status === value}
							onClick={() => onStatusChange(value)}
							className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold ${status === value ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
						>
							{label}{" "}
							<span className={status === value ? "text-brand-100" : "text-slate-400"}>
								{count}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="mt-4 overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead className="border-b text-xs text-slate-500">
						<tr>
							<th className="pb-3 font-semibold">Murid</th>
							<th className="pb-3 font-semibold">Tahap</th>
							<th className="pb-3 text-right font-semibold">Tindakan</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={3} className="py-8 text-slate-500">
									Memuat daftar publikasi rapor…
								</td>
							</tr>
						) : !reports.length ? (
							<tr>
								<td colSpan={3} className="py-10 text-center text-slate-500">
									Tidak ada rapor pada tahap ini.
								</td>
							</tr>
						) : (
							reports.map((report) => (
								<tr key={report.report_id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 font-semibold text-slate-900">{report.name}</td>
									<td className="py-4">
										<StatusBadge tone={statusCopy[report.status].tone}>
											{statusCopy[report.status].label}
										</StatusBadge>
									</td>
									<td className="py-4 text-right">
										{report.status === "APPROVED" ? (
											canPublish ? (
												<PublishReportAction
													reportId={report.report_id}
													pending={pending}
													onPublish={() => onPublish(report.report_id)}
												/>
											) : (
												<span className="text-sm text-slate-500">
													Menunggu Admin Sekolah menerbitkan rapor.
												</span>
											)
										) : (
											<Link href={`/app/reports/${report.report_id}/deliveries`}>
												<Button variant="secondary">Kirim ke wali</Button>
											</Link>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<PaginationControls page={page} pageSize={10} total={total} onPageChange={onPageChange} />
		</Card>
	);
}
