import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { BatchPublishAction } from "./batch-publish-action";
import { PublishReportAction } from "./publish-report-action";
import type { PublicationReport, PublicationStatus } from "../types";

type PublicationReportListProps = {
	canPublish: boolean;
	batchPending: boolean;
	batchProgress?: { completed: number; total: number } | null;
	counts: { approved: number; published: number; waitingReview: number };
	loading: boolean;
	page: number;
	pending: boolean;
	reports: PublicationReport[];
	search: string;
	total: number;
	onPageChange: (page: number) => void;
	onPublish: (reportId: string) => void;
	onPublishBatch: () => void;
	onSearchChange: (value: string) => void;
};

const statusCopy: Record<PublicationStatus, { label: string; tone: "green" | "amber" }> = {
	SUBMITTED: { label: "Menunggu ditinjau", tone: "amber" },
	IN_REVIEW: { label: "Sedang ditinjau", tone: "amber" },
	APPROVED: { label: "Menunggu diterbitkan", tone: "amber" },
	PUBLISHED: { label: "Sudah diterbitkan", tone: "green" },
};

export function PublicationReportList({
	canPublish,
	batchPending,
	batchProgress,
	counts,
	loading,
	page,
	pending,
	reports,
	search,
	total,
	onPageChange,
	onPublish,
	onPublishBatch,
	onSearchChange,
}: PublicationReportListProps) {
	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-col gap-4 border-b border-[#e7e7dc] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h2 className="font-bold text-[#17251b]">Daftar publikasi rapor</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Pantau proses tinjauan, penerbitan, dan pengiriman rapor kepada wali.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-slate-500">
					<span>{counts.waitingReview} menunggu tinjauan</span>
					<span aria-hidden="true">·</span>
					<span>{counts.approved} menunggu terbit</span>
					<span aria-hidden="true">·</span>
					<span>{counts.published} telah terbit</span>
					{canPublish ? (
						<BatchPublishAction
							count={counts.approved}
							pending={batchPending}
							progress={batchProgress}
							onPublish={onPublishBatch}
						/>
					) : null}
				</div>
			</div>
			<div className="px-5 py-4 sm:px-6">
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
			</div>
			<div className="hidden border-t border-[#edf0e8] md:block">
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
									Tidak ada rapor yang cocok dengan pencarian.
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
										<PublicationAction
											canPublish={canPublish}
											pending={pending}
											report={report}
											onPublish={onPublish}
										/>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<div className="space-y-3 border-t border-[#edf0e8] p-4 md:hidden">
				{loading ? (
					<p className="py-6 text-center text-sm text-[#68746a]">Memuat daftar publikasi rapor…</p>
				) : !reports.length ? (
					<p className="py-8 text-center text-sm text-[#68746a]">
						Tidak ada rapor yang cocok dengan pencarian.
					</p>
				) : (
					reports.map((report) => (
						<article
							key={report.report_id}
							className="rounded-2xl border border-[#e7e9df] bg-[#fffefa] p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<h3 className="font-semibold text-[#17251b]">{report.name}</h3>
								<StatusBadge tone={statusCopy[report.status].tone}>
									{statusCopy[report.status].label}
								</StatusBadge>
							</div>
							<div className="mt-4 border-t border-[#edf0e8] pt-3">
								<PublicationAction
									canPublish={canPublish}
									mobile
									pending={pending}
									report={report}
									onPublish={onPublish}
								/>
							</div>
						</article>
					))
				)}
			</div>
			<div className="px-5 py-4 sm:px-6">
				<PaginationControls page={page} pageSize={10} total={total} onPageChange={onPageChange} />
			</div>
		</Card>
	);
}

function PublicationAction({
	canPublish,
	mobile = false,
	pending,
	report,
	onPublish,
}: {
	canPublish: boolean;
	mobile?: boolean;
	pending: boolean;
	report: PublicationReport;
	onPublish: (reportId: string) => void;
}) {
	if (report.status === "APPROVED") {
		if (canPublish) {
			return (
				<PublishReportAction
					reportId={report.report_id}
					pending={pending}
					onPublish={() => onPublish(report.report_id)}
				/>
			);
		}
		return (
			<p className="text-sm leading-6 text-slate-500">Menunggu Admin Sekolah menerbitkan rapor.</p>
		);
	}

	if (report.status === "PUBLISHED") {
		return (
			<Link href={`/app/reports/${report.report_id}/deliveries`}>
				<Button variant="secondary" className={mobile ? "w-full" : undefined}>
					Kirim ke wali
				</Button>
			</Link>
		);
	}

	return (
		<p className="text-sm leading-6 text-slate-500">
			Rapor sedang menunggu tinjauan Kepala Sekolah.
		</p>
	);
}
