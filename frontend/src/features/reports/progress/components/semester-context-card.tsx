import { CalendarCheck2, LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";

type SemesterContextCardProps = {
	semester: {
		name: string;
		academic_year_name: string;
	};
};

export function SemesterContextCard({ semester }: SemesterContextCardProps) {
	return (
		<Card className="mb-6 overflow-hidden border-brand-100 bg-[#fffefa] p-0 shadow-none">
			<div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="flex items-center gap-3">
					<span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
						<CalendarCheck2 size={21} aria-hidden="true" />
					</span>
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
							Konteks pengisian raport
						</p>
						<h2 className="mt-1 text-lg font-bold tracking-tight text-[#17251b]">
							{semester.name}
						</h2>
					</div>
				</div>
				<div className="border-l-0 border-[#e7e9df] pl-0 sm:border-l sm:pl-5">
					<p className="text-xs font-medium text-[#637065]">Tahun ajaran</p>
					<p className="mt-0.5 text-sm font-semibold text-[#17251b]">
						{semester.academic_year_name}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2 border-t border-brand-100 bg-brand-50/55 px-5 py-2.5 text-xs text-[#526156] sm:px-6">
				<LockKeyhole size={14} aria-hidden="true" />
				<span>Ditentukan Admin Sekolah dari Data Akademik.</span>
			</div>
		</Card>
	);
}
