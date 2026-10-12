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
			<Card className="border-dashed text-center">
				<School className="mx-auto text-brand-600" />
				<h2 className="mt-3 font-bold">Mulai dengan tahun ajaran pertama</h2>
				<p className="mt-1 text-sm text-slate-500">
					Kelas dan penempatan murid dibuat dalam konteks tahun ajaran.
				</p>
				<Button className="mt-4" onClick={onCreate}>
					<Plus size={16} />
					Buat tahun ajaran pertama
				</Button>
			</Card>
		);
	return (
		<Card className="border-brand-100 bg-brand-50/40">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<span className="grid size-11 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
						<CalendarDays size={20} />
					</span>
					<div>
						<p className="text-sm text-slate-500">Tahun ajaran aktif</p>
						<h2 className="font-bold text-slate-950">{activeYear.name}</h2>
						<p className="text-xs text-slate-500">Semester I dan Semester II tersedia</p>
					</div>
				</div>
				<Button variant="ghost" onClick={onChange}>
					Ganti tahun ajaran
				</Button>
			</div>
		</Card>
	);
}
