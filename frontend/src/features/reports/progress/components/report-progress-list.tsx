import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ProgressFilter, ProgressItem } from "../types";
import { getReportDestination, pageSize, statusCopy } from "../utils";

type Props = {
	counts: {
		total: number;
		notCreated: number;
		draft: number;
		review: number;
		publish: number;
		published: number;
	};
	filter: ProgressFilter;
	items: ProgressItem[];
	loading: boolean;
	page: number;
	search: string;
	total: number;
	onCreateDraft: (studentId: string) => void;
	onFilterChange: (filter: ProgressFilter) => void;
	onPageChange: (page: number) => void;
	onSearchChange: (value: string) => void;
};

export function ReportProgressList({
	counts,
	filter,
	items,
	loading,
	page,
	search,
	total,
	onCreateDraft,
	onFilterChange,
	onPageChange,
	onSearchChange,
}: Props) {
	const filters: { id: ProgressFilter; label: string; count: number }[] = [
		{
			id: "NOT_CREATED",
			label: "Belum dibuat",
			count: counts.notCreated,
		},
		{ id: "WORKING", label: "Sedang dikerjakan", count: counts.draft },
	];
	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-col gap-4 border-b border-[#e7e7dc] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div>
					<h2 className="font-bold text-[#17251b]">Rapor yang perlu diisi</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Pilih murid untuk membuat draf atau melanjutkan pengisian rapor.
					</p>
				</div>
				<div className="flex items-center gap-2 rounded-lg bg-[#f0f4ed] px-3 py-1.5 text-sm font-semibold text-[#526156]">
					<UsersRound className="size-4" />
					{counts.total} murid
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
				<div
					className="flex gap-2 overflow-x-auto pb-1"
					role="tablist"
					aria-label="Filter status rapor"
				>
					{filters.map((item) => (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={filter === item.id}
							onClick={() => onFilterChange(item.id)}
							className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${filter === item.id ? "bg-brand-700 text-white shadow-[0_6px_14px_rgba(23,75,49,0.16)]" : "bg-[#f0f3ed] text-[#5d695f] hover:bg-[#e5eadf]"}`}
						>
							{item.label}{" "}
							<span className={filter === item.id ? "text-brand-100" : "text-slate-400"}>
								{item.count}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="hidden border-t border-[#edf0e8] md:block">
				<table className="w-full text-left text-sm">
					<thead className="border-b border-[#e7e9df] bg-[#f5f7f1] text-xs text-[#667168]">
						<tr>
							<th className="pb-3 font-semibold">Murid</th>
							<th className="pb-3 font-semibold">Tahap rapor</th>
							<th className="pb-3 text-right font-semibold">Tindakan</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={3} className="px-5 py-10 text-[#68746a]">
									Memuat rapor murid…
								</td>
							</tr>
						) : !items.length ? (
							<tr>
								<td colSpan={3} className="px-5 py-12 text-center text-[#68746a]">
									Tidak ada murid pada filter ini.
								</td>
							</tr>
						) : (
							items.map((item) => {
								const next = getReportDestination(item);
								return (
									<tr
										key={item.id}
										className="border-b border-[#edf0e8] transition-colors hover:bg-[#f8faf5] last:border-0"
									>
										<td className="px-5 py-4 font-semibold text-[#17251b]">{item.name}</td>
										<td className="px-5 py-4">
											{item.status ? (
												<StatusBadge tone={statusCopy[item.status].tone}>
													{statusCopy[item.status].label}
												</StatusBadge>
											) : (
												<span className="text-[#68746a]">Belum dibuat</span>
											)}
										</td>
										<td className="px-5 py-4 text-right">
											{next ? (
												<Link href={next.href}>
													<Button variant="secondary">{next.label}</Button>
												</Link>
											) : (
												<Button onClick={() => onCreateDraft(item.id)}>Buat draf</Button>
											)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
			<div className="space-y-3 border-t border-[#edf0e8] p-4 md:hidden">
				{loading ? (
					<p className="py-6 text-center text-sm text-[#68746a]">Memuat rapor murid…</p>
				) : !items.length ? (
					<p className="py-8 text-center text-sm text-[#68746a]">
						Tidak ada murid pada filter ini.
					</p>
				) : (
					items.map((item) => {
						const next = getReportDestination(item);
						return (
							<article
								key={item.id}
								className="rounded-2xl border border-[#e7e9df] bg-[#fffefa] p-4"
							>
								<div className="flex items-start justify-between gap-3">
									<h3 className="font-semibold text-[#17251b]">{item.name}</h3>
									{item.status ? (
										<StatusBadge tone={statusCopy[item.status].tone}>
											{statusCopy[item.status].label}
										</StatusBadge>
									) : (
										<span className="text-xs text-[#68746a]">Belum dibuat</span>
									)}
								</div>
								<div className="mt-4 border-t border-[#edf0e8] pt-3">
									{next ? (
										<Link href={next.href}>
											<Button variant="secondary" className="w-full">
												{next.label}
											</Button>
										</Link>
									) : (
										<Button className="w-full" onClick={() => onCreateDraft(item.id)}>
											Buat draf
										</Button>
									)}
								</div>
							</article>
						);
					})
				)}
			</div>
			<div className="px-5 py-4 sm:px-6">
				<PaginationControls
					page={page}
					pageSize={pageSize}
					total={total}
					onPageChange={onPageChange}
				/>
			</div>
		</Card>
	);
}
