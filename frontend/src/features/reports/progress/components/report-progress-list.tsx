import Link from "next/link";
import { UsersRound } from "lucide-react";
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
		<Card>
			<div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-bold text-slate-900">Rapor yang perlu diisi</h2>
					<p className="mt-1 text-sm text-slate-500">
						Pilih murid untuk membuat draf atau melanjutkan pengisian rapor.
					</p>
				</div>
				<div className="flex items-center gap-2 text-sm text-slate-500">
					<UsersRound className="size-4" />
					{counts.total} murid
				</div>
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
				<input
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Cari nama murid"
					className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
				/>
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
							className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${filter === item.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
						>
							{item.label}{" "}
							<span className={filter === item.id ? "text-brand-100" : "text-slate-400"}>
								{item.count}
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
							<th className="pb-3 font-semibold">Tahap rapor</th>
							<th className="pb-3 text-right font-semibold">Tindakan</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={3} className="py-8 text-slate-500">
									Memuat rapor murid…
								</td>
							</tr>
						) : !items.length ? (
							<tr>
								<td colSpan={3} className="py-10 text-center text-slate-500">
									Tidak ada murid pada filter ini.
								</td>
							</tr>
						) : (
							items.map((item) => {
								const next = getReportDestination(item);
								return (
									<tr key={item.id} className="border-b border-slate-100 last:border-0">
										<td className="py-4 font-semibold text-slate-900">{item.name}</td>
										<td className="py-4">
											{item.status ? (
												<StatusBadge tone={statusCopy[item.status].tone}>
													{statusCopy[item.status].label}
												</StatusBadge>
											) : (
												<span className="text-slate-500">Belum dibuat</span>
											)}
										</td>
										<td className="py-4 text-right">
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
			<PaginationControls
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={onPageChange}
			/>
		</Card>
	);
}
