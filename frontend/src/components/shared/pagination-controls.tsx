"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function nearbyPages(page: number, pageCount: number) {
	const pages = new Set<number>();
	const targetSize = Math.min(4, pageCount - 1);

	for (let offset = 1; offset <= 2; offset += 1) {
		if (page - offset >= 1) pages.add(page - offset);
		if (page + offset <= pageCount) pages.add(page + offset);
	}

	for (let offset = 3; pages.size < targetSize; offset += 1) {
		const nextPage = page + offset;
		const previousPage = page - offset;

		if (nextPage <= pageCount) pages.add(nextPage);
		if (pages.size >= targetSize) break;
		if (previousPage >= 1) pages.add(previousPage);
	}

	return [...pages].sort((first, second) => first - second);
}

export function PaginationControls({
	page,
	pageSize,
	total,
	onPageChange,
}: {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
}) {
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const pages = nearbyPages(page, pageCount);
	const previousPages = pages.filter((pageNumber) => pageNumber < page);
	const followingPages = pages.filter((pageNumber) => pageNumber > page);

	if (pageCount <= 1) return null;

	return (
		<nav
			className="mt-4 flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-100 pt-4 sm:justify-end"
			aria-label="Navigasi halaman"
		>
			<Button
				type="button"
				variant="secondary"
				className="min-h-9 px-2.5 sm:px-3"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
			>
				<ChevronLeft size={16} />
				<span className="hidden sm:inline">Sebelumnya</span>
			</Button>
			{previousPages.map((pageNumber) => (
				<Button
					key={pageNumber}
					type="button"
					variant="secondary"
					className="min-h-9 min-w-9 px-2.5"
					aria-label={`Buka halaman ${pageNumber}`}
					onClick={() => onPageChange(pageNumber)}
				>
					{pageNumber}
				</Button>
			))}
			<span
				className="inline-flex min-h-9 items-center rounded-xl bg-brand-700 px-3 text-sm font-semibold text-white"
				aria-current="page"
			>
				{page}
			</span>
			{followingPages.map((pageNumber) => (
				<Button
					key={pageNumber}
					type="button"
					variant="secondary"
					className="min-h-9 min-w-9 px-2.5"
					aria-label={`Buka halaman ${pageNumber}`}
					onClick={() => onPageChange(pageNumber)}
				>
					{pageNumber}
				</Button>
			))}
			<Button
				type="button"
				variant="secondary"
				className="min-h-9 px-2.5 sm:px-3"
				disabled={page >= pageCount}
				onClick={() => onPageChange(page + 1)}
			>
				<span className="hidden sm:inline">Berikutnya</span>
				<ChevronRight size={16} />
			</Button>
		</nav>
	);
}
