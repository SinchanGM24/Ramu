import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReportRevisionNote } from "@/features/reports/components/report-revision-note";
import type { ProgressItem } from "../types";
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
	items: ProgressItem[];
	loading: boolean;
	page: number;
	search: string;
	total: number;
	onCreateDraft: (studentId: string) => void;
	onPageChange: (page: number) => void;
	onSearchChange: (value: string) => void;
};

export function ReportProgressList({
	counts,
	items,
	loading,
	page,
	search,
	total,
	onCreateDraft,
	onPageChange,
	onSearchChange,
}: Props) {
	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-col gap-4 border-b border-[#e7e7dc] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div>
					<h2 className="font-bold text-[#17251b]">Raport yang perlu diisi</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Pilih murid untuk membuat draf atau melanjutkan pengisian raport.
					</p>
				</div>
				<div className="flex items-center gap-2 rounded-lg bg-[#f0f4ed] px-3 py-1.5 text-sm font-semibold text-[#526156]">
					<UsersRound className="size-4" />
					{counts.notCreated + counts.draft} murid
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
							<th className="pb-3 font-semibold">Tahap raport</th>
							<th className="pb-3 font-semibold">Kelengkapan</th>
							<th className="pb-3 text-right font-semibold">Tindakan</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={4} className="px-5 py-10 text-[#68746a]">
									Memuat raport murid…
								</td>
							</tr>
						) : !items.length ? (
							<tr>
								<td colSpan={4} className="px-5 py-12 text-center text-[#68746a]">
									Tidak ada murid yang cocok dengan pencarian.
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
										<td className="px-5 py-4 font-semibold text-[#17251b]">
											{item.name}
											{item.status === "REVISION_REQUIRED" ? (
												<ReportRevisionNote compact note={item.revision_note} />
											) : null}
										</td>
										<td className="px-5 py-4">
											{item.status ? (
												<StatusBadge tone={statusCopy[item.status].tone}>
													{statusCopy[item.status].label}
												</StatusBadge>
											) : (
												<span className="text-[#68746a]">Belum dibuat</span>
											)}
										</td>
										<td className="px-5 py-4">
											<CompletionProgress percent={item.completion_percent} />
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
					<p className="py-6 text-center text-sm text-[#68746a]">Memuat raport murid…</p>
				) : !items.length ? (
					<p className="py-8 text-center text-sm text-[#68746a]">
						Tidak ada murid yang cocok dengan pencarian.
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
									<div>
										<h3 className="font-semibold text-[#17251b]">{item.name}</h3>
										{item.status === "REVISION_REQUIRED" ? (
											<ReportRevisionNote compact note={item.revision_note} />
										) : null}
									</div>
									{item.status ? (
										<StatusBadge tone={statusCopy[item.status].tone}>
											{statusCopy[item.status].label}
										</StatusBadge>
									) : (
										<span className="text-xs text-[#68746a]">Belum dibuat</span>
									)}
								</div>
								<div className="mt-4 border-t border-[#edf0e8] pt-3">
									<CompletionProgress percent={item.completion_percent} />
									<div className="mt-3">
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

function CompletionProgress({ percent }: { percent: number }) {
	const safePercent = Math.min(100, Math.max(0, percent));

	return (
		<div className="min-w-28">
			<div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#526156]">
				<span>{safePercent}%</span>
				<span className="font-normal text-[#7b867d]">terisi</span>
			</div>
			<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e4eadf]">
				<div className="h-full rounded-full bg-brand-600" style={{ width: `${safePercent}%` }} />
			</div>
		</div>
	);
}
