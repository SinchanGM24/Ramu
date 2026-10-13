import { CalendarDays, Plus, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AcademicYear } from "../types";

export function ActiveYearCard({
	activeYear,
	onCreate,
	onChange,
}: {
	activeYear?: AcademicYear;
	onCreate: () => void;
	onChange: () => void;
}) {
	if (!activeYear)
		return (
			<Card className="border-dashed border-brand-200 bg-brand-50/40 text-center">
				<School className="mx-auto text-brand-600" />
				<h2 className="mt-3 font-bold text-brand-950">Mulai dengan tahun ajaran pertama</h2>
				<p className="mt-1 text-sm text-[#637065]">
					Kelas dan penempatan murid dibuat dalam konteks tahun ajaran.
				</p>
				<Button className="mt-4" onClick={onCreate}>
					<Plus size={16} />
					Buat tahun ajaran pertama
				</Button>
			</Card>
		);
	return (
		<Card className="relative overflow-hidden border-brand-100 bg-brand-50/50">
			<div
				aria-hidden="true"
				className="absolute -right-10 -top-12 size-36 rounded-full border-[12px] border-brand-200/45"
			/>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<span className="relative grid size-11 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
						<CalendarDays size={20} />
					</span>
					<div>
						<p className="text-sm text-[#637065]">Tahun ajaran aktif</p>
						<h2 className="font-bold text-brand-950">{activeYear.name}</h2>
						<p className="text-xs text-[#637065]">Semester I dan Semester II tersedia</p>
					</div>
				</div>
				<Button variant="secondary" onClick={onChange}>
					Ganti tahun ajaran
				</Button>
			</div>
		</Card>
	);
}
