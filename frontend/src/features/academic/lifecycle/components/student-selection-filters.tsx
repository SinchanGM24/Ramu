import { Card } from "@/components/ui/card";
export function StudentSelectionFilters({
	classes,
	classFilter,
	search,
	onClassFilterChange,
	onSearchChange,
}: {
	classes: string[];
	classFilter: string;
	search: string;
	onClassFilterChange: (value: string) => void;
	onSearchChange: (value: string) => void;
}) {
	return (
		<Card>
			<div className="grid gap-3 md:grid-cols-2">
				<select
					value={classFilter}
					onChange={(event) => onClassFilterChange(event.target.value)}
					className="rounded-xl border p-3 text-sm"
					aria-label="Filter kelas"
				>
					<option value="">Semua kelas</option>
					{classes.map((item) => (
						<option key={item}>{item}</option>
					))}
				</select>
				<input
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Cari nama murid"
					className="rounded-xl border p-3 text-sm"
				/>
			</div>
		</Card>
	);
}
