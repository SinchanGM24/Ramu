import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewQueueMobileItem, ReviewQueueTableRow } from "./review-queue-item";
import type { ReviewReport } from "../types";

export type ReviewQueueProps = {
	error: boolean;
	loading: boolean;
	queue: ReviewReport[];
	onOpenDetail: (report: ReviewReport) => void;
	onRetry: () => void;
};

export function ReviewQueue({ error, loading, queue, onOpenDetail, onRetry }: ReviewQueueProps) {
	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-col gap-3 border-b border-[#e7e7dc] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
				<div>
					<h2 className="font-bold tracking-[-0.02em] text-brand-950">Antrean tinjauan</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Buka detail untuk memeriksa isi raport sebelum mengambil keputusan.
					</p>
				</div>
				<p className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
					{queue.length} raport
				</p>
			</div>

			<div className="hidden md:block">
				<table className="w-full table-fixed text-left text-sm">
					<colgroup>
						<col className="w-[42%]" />
						<col className="w-[24%]" />
						<col className="w-[20%]" />
						<col className="w-[9rem]" />
					</colgroup>
					<thead className="border-b border-[#e7e7dc] text-xs font-semibold uppercase tracking-[0.12em] text-[#637065]">
						<tr>
							<th className="px-5 py-3 sm:px-6">Murid</th>
							<th className="px-4 py-3">Semester</th>
							<th className="px-4 py-3">Tahap</th>
							<th className="px-5 py-3 text-right sm:px-6">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<LoadingRows />
						) : error ? (
							<ErrorRow onRetry={onRetry} />
						) : queue.length ? (
							queue.map((report) => (
								<ReviewQueueTableRow
									key={report.id}
									report={report}
									onOpenDetail={() => onOpenDetail(report)}
								/>
							))
						) : (
							<EmptyRow />
						)}
					</tbody>
				</table>
			</div>

			<div className="space-y-3 p-4 md:hidden">
				{loading ? (
					<MobileLoadingCards />
				) : error ? (
					<MobileError onRetry={onRetry} />
				) : queue.length ? (
					queue.map((report) => (
						<ReviewQueueMobileItem
							key={report.id}
							report={report}
							onOpenDetail={() => onOpenDetail(report)}
						/>
					))
				) : (
					<EmptyState />
				)}
			</div>
		</Card>
	);
}

function LoadingRows() {
	return (
		<>
			{Array.from({ length: 4 }, (_, index) => (
				<tr key={index} className="border-b border-[#e7e7dc]">
					<td className="px-5 py-4 sm:px-6">
						<div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
						<div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
					</td>
					<td className="px-4">
						<div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
					</td>
					<td className="px-4">
						<div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
					</td>
					<td className="px-5 sm:px-6" />
				</tr>
			))}
		</>
	);
}

function ErrorRow({ onRetry }: { onRetry: () => void }) {
	return (
		<tr>
			<td colSpan={4} className="px-5 py-10 text-center text-red-700 sm:px-6">
				Antrean raport tidak dapat dimuat.{" "}
				<button type="button" className="font-semibold underline" onClick={onRetry}>
					Coba lagi
				</button>
			</td>
		</tr>
	);
}

function EmptyRow() {
	return (
		<tr>
			<td colSpan={4} className="px-5 py-12 text-center sm:px-6">
				<EmptyState />
			</td>
		</tr>
	);
}

function EmptyState() {
	return (
		<div className="text-center">
			<ClipboardCheck className="mx-auto size-9 text-brand-600" />
			<h3 className="mt-3 font-semibold text-[#17251b]">Belum ada raport untuk ditinjau</h3>
			<p className="mt-1 text-sm leading-6 text-[#637065]">
				Raport yang dikirim guru akan muncul di sini.
			</p>
		</div>
	);
}

function MobileLoadingCards() {
	return (
		<>
			{Array.from({ length: 3 }, (_, index) => (
				<div key={index} className="rounded-2xl border border-[#e7e7dc] bg-white p-4">
					<div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
					<div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
					<div className="mt-4 h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
				</div>
			))}
		</>
	);
}

function MobileError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			Antrean raport tidak dapat dimuat.{" "}
			<button type="button" className="font-semibold underline" onClick={onRetry}>
				Coba lagi
			</button>
		</div>
	);
}
