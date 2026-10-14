import Link from "next/link";
import { Search } from "lucide-react";
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
		<Card className="overflow-hidden p-0">
			<div className="flex flex-col gap-4 border-b border-[#e7e7dc] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div>
					<h2 className="font-bold text-[#17251b]">Daftar publikasi rapor</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Terbitkan rapor yang sudah disetujui, lalu kirimkan kepada wali.
					</p>
				</div>
				<div className="flex gap-2 text-sm text-slate-500">
					<span>{counts.approved} siap terbit</span>
					<span aria-hidden="true">·</span>
					<span>{counts.published} telah terbit</span>
				</div>
			</div>
			<div className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] sm:px-6">
				<label className="relative block">
					<span className="sr-only">Cari nama murid</span>
					<Search
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b867d]"
						aria-hidden="true"
					/>
					<input
						value={search}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="Cari nama murid"
						className="w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] py-2.5 pl-10 pr-3 text-sm text-[#17251b] outline-none transition placeholder:text-[#899188] focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
					/>
				</label>
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
			<div className="overflow-x-auto border-t border-[#edf0e8]">
				<table className="w-full text-left text-sm">
					<thead className="border-b border-[#e7e9df] bg-[#f5f7f1] text-xs text-[#667168]">
						<tr>
							<th className="pb-3 font-semibold">Murid</th>
							<th className="pb-3 font-semibold">Tahap</th>
							<th className="pb-3 text-right font-semibold">Tindakan</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={3} className="px-5 py-10 text-[#68746a]">
									Memuat daftar publikasi rapor…
								</td>
							</tr>
						) : !reports.length ? (
							<tr>
								<td colSpan={3} className="px-5 py-12 text-center text-[#68746a]">
									Tidak ada rapor pada tahap ini.
								</td>
							</tr>
						) : (
							reports.map((report) => (
								<tr
									key={report.report_id}
									className="border-b border-[#edf0e8] transition-colors hover:bg-[#f8faf5] last:border-0"
								>
									<td className="px-5 py-4 font-semibold text-[#17251b]">{report.name}</td>
									<td className="px-5 py-4">
										<StatusBadge tone={statusCopy[report.status].tone}>
											{statusCopy[report.status].label}
										</StatusBadge>
									</td>
									<td className="px-5 py-4 text-right">
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
			<div className="px-5 py-4 sm:px-6">
				<PaginationControls page={page} pageSize={10} total={total} onPageChange={onPageChange} />
			</div>
		</Card>
	);
}
