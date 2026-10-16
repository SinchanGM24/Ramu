import Link from "next/link";
import { Check, Circle, Info, RotateCcw, Search, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { BatchPublishAction } from "./batch-publish-action";
import { PublishReportAction } from "./publish-report-action";
import type {
	DeliveryFilter,
	DeliveryStatus,
	PublicationReport,
	PublicationStatus,
} from "../types";

type PublicationReportListProps = {
	canPublish: boolean;
	batchPending: boolean;
	batchProgress?: { completed: number; total: number } | null;
	counts: { approved: number; published: number; waitingReview: number };
	deliveryFilter: DeliveryFilter;
	loading: boolean;
	page: number;
	pending: boolean;
	reports: PublicationReport[];
	search: string;
	total: number;
	onPageChange: (page: number) => void;
	onDeliveryFilterChange: (filter: DeliveryFilter) => void;
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

const deliveryStatusCopy: Record<
	DeliveryStatus,
	{ Icon: LucideIcon; label: string; className: string }
> = {
	QUEUED: {
		Icon: Send,
		label: "Belum dibuka di WhatsApp",
		className: "bg-slate-100 text-slate-500",
	},
	SENT: {
		Icon: Check,
		label: "Sudah dibuka di WhatsApp",
		className: "bg-emerald-50 text-emerald-700",
	},
	DELIVERED: {
		Icon: Check,
		label: "WhatsApp pernah dibuka",
		className: "bg-emerald-50 text-emerald-700",
	},
	READ: {
		Icon: Check,
		label: "WhatsApp pernah dibuka",
		className: "bg-emerald-50 text-emerald-700",
	},
	FAILED: {
		Icon: RotateCcw,
		label: "Perlu dikirim ulang",
		className: "bg-amber-50 text-amber-700",
	},
};

const deliveryLegend = [
	{
		filter: "NEEDS_DELIVERY" as const,
		Icon: Send,
		label: "Belum dibuka",
		className: "bg-slate-100 text-slate-500",
	},
	{
		filter: "OPENED" as const,
		Icon: Check,
		label: "WhatsApp pernah dibuka",
		className: "bg-emerald-50 text-emerald-700",
	},
	{
		filter: "FAILED" as const,
		Icon: RotateCcw,
		label: "Perlu dicoba lagi",
		className: "bg-amber-50 text-amber-700",
	},
];

export function PublicationReportList({
	canPublish,
	batchPending,
	batchProgress,
	counts,
	deliveryFilter,
	loading,
	page,
	pending,
	reports,
	search,
	total,
	onPageChange,
	onDeliveryFilterChange,
	onPublish,
	onPublishBatch,
	onSearchChange,
}: PublicationReportListProps) {
	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-col gap-4 border-b border-[#e7e7dc] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h2 className="font-bold text-[#17251b]">Daftar publikasi raport</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Raport terbit yang belum dikirim ditampilkan lebih dahulu, lalu diurutkan dari perubahan
						terbaru.
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
			<div className="space-y-3 px-5 py-4 sm:px-6">
				<DeliveryStatusLegend filter={deliveryFilter} onFilterChange={onDeliveryFilterChange} />
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
				<table className="w-full table-fixed text-left text-sm">
					<colgroup>
						<col className="w-[30%]" />
						<col className="w-[22%]" />
						<col className="w-[28%]" />
						<col className="w-[10.5rem]" />
					</colgroup>
					<thead className="border-b border-[#e7e9df] bg-[#f5f7f1] text-xs text-[#667168]">
						<tr>
							<th className="px-5 py-3 font-semibold sm:px-6">Murid</th>
							<th className="px-4 py-3 font-semibold">Tahap</th>
							<th className="px-4 py-3 font-semibold">Pengiriman</th>
							<th className="px-5 py-3 text-right font-semibold sm:px-6">Tindakan</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={4} className="px-5 py-10 text-[#68746a]">
									Memuat daftar publikasi raport…
								</td>
							</tr>
						) : !reports.length ? (
							<tr>
								<td colSpan={4} className="px-5 py-12 text-center text-[#68746a]">
									Tidak ada raport yang cocok dengan pencarian.
								</td>
							</tr>
						) : (
							reports.map((report) => (
								<tr
									key={report.report_id}
									className="border-b border-[#edf0e8] transition-colors hover:bg-[#f8faf5] last:border-0"
								>
									<td className="px-5 py-4 font-semibold text-[#17251b] sm:px-6">
										<p className="truncate" title={report.name}>
											{report.name}
										</p>
									</td>
									<td className="px-4 py-4">
										<StatusBadge tone={statusCopy[report.status].tone}>
											{statusCopy[report.status].label}
										</StatusBadge>
									</td>
									<td className="px-4 py-4">
										<DeliveryStatusBadge
											status={report.delivery_status}
											whatsAppOpenedAt={report.delivery_whatsapp_opened_at}
										/>
									</td>
									<td className="px-5 py-4 text-right sm:px-6">
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
					<p className="py-6 text-center text-sm text-[#68746a]">Memuat daftar publikasi raport…</p>
				) : !reports.length ? (
					<p className="py-8 text-center text-sm text-[#68746a]">
						Tidak ada raport yang cocok dengan pencarian.
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
								<div className="mb-3">
									<DeliveryStatusBadge
										status={report.delivery_status}
										whatsAppOpenedAt={report.delivery_whatsapp_opened_at}
									/>
								</div>
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

function DeliveryStatusLegend({
	filter,
	onFilterChange,
}: {
	filter: DeliveryFilter;
	onFilterChange: (filter: DeliveryFilter) => void;
}) {
	return (
		<div className="rounded-2xl border border-brand-100 bg-[linear-gradient(105deg,#f3f8ef_0%,#fffefa_52%,#f7faf4_100%)] p-3 shadow-[0_4px_16px_rgba(28,64,39,0.05)] sm:p-4">
			<div className="flex items-start gap-3">
				<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
					<Info aria-hidden="true" size={17} strokeWidth={2.4} />
				</span>
				<div className="min-w-0">
					<p className="text-sm font-bold text-[#1d3524]">Arti ikon pengiriman</p>
					<p className="mt-0.5 text-xs leading-5 text-[#637065]">
						Pilih ikon untuk memfilter. Ikon hanya menandai handoff WhatsApp, bukan bukti pesan
						terkirim.
					</p>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap gap-2">
				<button
					type="button"
					aria-pressed={filter === "ALL"}
					className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${filter === "ALL" ? "border-brand-500 bg-brand-600 text-white shadow-sm" : "border-white/80 bg-white/70 text-[#4b594e] hover:border-brand-200 hover:bg-white"}`}
					onClick={() => onFilterChange("ALL")}
				>
					Semua
				</button>
				{deliveryLegend.map(({ Icon, className, filter: itemFilter, label }) => (
					<button
						key={label}
						type="button"
						aria-pressed={filter === itemFilter}
						className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition ${filter === itemFilter ? "border-brand-500 bg-white text-[#1d3524] ring-2 ring-brand-100" : "border-white/80 bg-white/70 text-[#4b594e] hover:border-brand-200 hover:bg-white"}`}
						onClick={() => onFilterChange(itemFilter)}
					>
						<span className={`grid size-7 shrink-0 place-items-center rounded-lg ${className}`}>
							<Icon aria-hidden="true" size={14} strokeWidth={2.3} />
						</span>
						<span className="leading-4">{label}</span>
					</button>
				))}
			</div>
		</div>
	);
}

function DeliveryStatusBadge({
	status,
	whatsAppOpenedAt,
}: {
	status?: DeliveryStatus | null;
	whatsAppOpenedAt?: string | null;
}) {
	const copy =
		status === "FAILED"
			? deliveryStatusCopy.FAILED
			: status === "DELIVERED" || status === "READ"
				? deliveryStatusCopy[status]
				: whatsAppOpenedAt || status === "SENT"
					? deliveryStatusCopy.SENT
					: status === "QUEUED"
						? deliveryStatusCopy.QUEUED
						: {
								Icon: Circle,
								label: "Belum dikirim",
								className: "bg-slate-100 text-slate-400",
							};
	const Icon = copy.Icon;

	return (
		<span
			aria-label={copy.label}
			className={`grid size-8 place-items-center rounded-full ${copy.className}`}
			role="img"
		>
			<Icon aria-hidden="true" size={15} strokeWidth={2.25} />
			<span className="sr-only">{copy.label}</span>
		</span>
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
			<p className="text-sm leading-6 text-slate-500">Menunggu Admin Sekolah menerbitkan raport.</p>
		);
	}

	if (report.status === "PUBLISHED") {
		return (
			<Link href={`/app/reports/${report.report_id}/deliveries?from=publication`}>
				<Button variant="secondary" className={mobile ? "w-full" : undefined}>
					Kirim ke wali
				</Button>
			</Link>
		);
	}

	return (
		<p className="text-sm leading-6 text-slate-500">
			Raport sedang menunggu tinjauan Kepala Sekolah.
		</p>
	);
}
