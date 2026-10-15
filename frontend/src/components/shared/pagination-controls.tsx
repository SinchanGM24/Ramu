"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
	const windowSize = 3;
	const firstPage = Math.max(1, Math.min(page, pageCount - windowSize + 1));
	const pages = Array.from(
		{ length: Math.min(windowSize, pageCount) },
		(_, index) => firstPage + index,
	);

	if (pageCount <= 1) return null;

	return (
		<nav
			className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 sm:justify-end"
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
			{pages.map((pageNumber) => {
				const isCurrentPage = pageNumber === page;

				return (
					<Button
						key={pageNumber}
						type="button"
						variant={isCurrentPage ? "primary" : "secondary"}
						className="min-h-9 min-w-9 px-2.5"
						aria-current={isCurrentPage ? "page" : undefined}
						aria-label={`Halaman ${pageNumber}`}
						onClick={() => onPageChange(pageNumber)}
					>
						{pageNumber}
					</Button>
				);
			})}
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
