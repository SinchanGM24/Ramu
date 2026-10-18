import { Search, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LifecycleClassGroup } from "../types";
export function StudentSelectionFilters({
	classes,
	classGroupId,
	search,
	onClassFilterChange,
	onSearchChange,
}: {
	classes: LifecycleClassGroup[];
	classGroupId: string;
	search: string;
	onClassFilterChange: (value: string) => void;
	onSearchChange: (value: string) => void;
}) {
	return (
		<Card>
			<div className="flex flex-col gap-4 border-b border-[#e7e7dc] pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-bold tracking-[-0.02em] text-brand-950">Temukan murid</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Gunakan kelas atau pencarian sebelum memilih murid.
					</p>
				</div>
				<SlidersHorizontal className="size-5 text-brand-700" aria-hidden="true" />
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-2">
				<label>
					<span className="sr-only">Filter kelas</span>
					<select
						value={classGroupId}
						onChange={(event) => onClassFilterChange(event.target.value)}
						className="w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					>
						<option value="">Semua kelas</option>
						{classes.map((item) => (
							<option key={item.id} value={item.id}>
								{item.name}
							</option>
						))}
					</select>
				</label>
				<label className="relative">
					<span className="sr-only">Cari murid</span>
					<Search
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#637065]"
						aria-hidden="true"
					/>
					<input
						value={search}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="Cari nama murid"
						className="w-full rounded-xl border border-[#dfe2d6] bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
				</label>
			</div>
		</Card>
	);
}
