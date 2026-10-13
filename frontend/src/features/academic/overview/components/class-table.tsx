import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ClassPeriod } from "../types";

export function ClassTable({
	periods,
	activeYearName,
	hasActiveYear,
	onAdd,
	onManage,
}: {
	periods?: ClassPeriod[];
	activeYearName?: string;
	hasActiveYear: boolean;
	onAdd: () => void;
	onManage: (period: ClassPeriod) => void;
}) {
	return (
		<Card className="mt-5">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 className="font-bold tracking-[-0.02em] text-brand-950">Kelas tahun ajaran aktif</h2>
					<p className="mt-1 text-sm leading-6 text-[#637065]">
						Kelola kelas, guru yang ditugaskan, dan ringkasan penempatan murid untuk{" "}
						{activeYearName || "tahun ajaran aktif"}.
					</p>
				</div>
				<Button disabled={!hasActiveYear} onClick={onAdd}>
					<Plus size={16} />
					Tambah kelas
				</Button>
			</div>
			{hasActiveYear ? (
				<div className="mt-5 overflow-x-auto rounded-2xl border border-[#e2e4da]">
					<table className="w-full min-w-[680px] text-left text-sm">
						<thead className="bg-[#f4f4ed] text-xs font-bold uppercase tracking-[0.12em] text-[#637065]">
							<tr>
								<th className="px-4 py-3">Kelas</th>
								<th className="px-4 py-3">Guru ditugaskan</th>
								<th className="px-4 py-3 text-center">Murid</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{periods?.map((period) => (
								<tr
									key={period.id}
									className="border-t border-[#e7e7dc] transition-colors hover:bg-brand-50/35"
								>
									<td className="px-4 py-4 font-semibold text-brand-950">{period.name}</td>
									<td className="px-4 py-4 text-[#637065]">
										{period.teacher_names || "Belum ada guru ditugaskan"}
									</td>
									<td className="px-4 py-4 text-center text-[#637065]">
										{period.student_count || 0}
									</td>
									<td className="px-4 py-4">
										<span
											className={
												period.is_active
													? "font-semibold text-emerald-700"
													: "font-semibold text-slate-500"
											}
										>
											{period.is_active ? "Aktif" : "Nonaktif"}
										</span>
									</td>
									<td className="px-4 py-4 text-right">
										<Button
											variant="ghost"
											className="min-h-9 px-3"
											onClick={() => onManage(period)}
										>
											Kelola
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{!periods?.length ? (
						<p className="p-8 text-center text-sm text-[#637065]">
							Belum ada kelas pada tahun ajaran ini.
						</p>
					) : null}
				</div>
			) : null}
		</Card>
	);
}
