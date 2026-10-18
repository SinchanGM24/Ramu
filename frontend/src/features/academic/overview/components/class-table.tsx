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
				<>
					<div className="mt-5 hidden overflow-hidden rounded-2xl border border-[#e2e4da] md:block">
						<table className="w-full table-fixed text-left text-sm">
							<colgroup>
								<col className="w-[24%]" />
								<col className="w-[34%]" />
								<col className="w-[12%]" />
								<col className="w-[15%]" />
								<col className="w-[8rem]" />
							</colgroup>
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
										<td className="px-4 py-4 font-semibold text-brand-950">
											<p className="truncate" title={period.name}>
												{period.name}
											</p>
										</td>
										<td className="px-4 py-4 text-[#637065]">
											<p className="truncate" title={period.teacher_names || undefined}>
												{period.teacher_names || "Belum ada guru ditugaskan"}
											</p>
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
					</div>
					{periods?.length ? (
						<div className="mt-5 space-y-3 md:hidden">
							{periods.map((period) => (
								<article
									key={period.id}
									className="rounded-2xl border border-[#e2e4da] bg-white p-4"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<h3 className="font-semibold text-brand-950">{period.name}</h3>
											<p className="mt-1 text-xs leading-5 text-[#637065]">
												{period.teacher_names || "Belum ada guru ditugaskan"}
											</p>
										</div>
										<span
											className={
												period.is_active
													? "text-xs font-semibold text-emerald-700"
													: "text-xs font-semibold text-slate-500"
											}
										>
											{period.is_active ? "Aktif" : "Nonaktif"}
										</span>
									</div>
									<div className="mt-3 flex items-center justify-between border-t border-[#edf0e8] pt-3">
										<p className="text-xs text-[#637065]">{period.student_count || 0} murid</p>
										<Button
											variant="ghost"
											className="min-h-9 px-3"
											onClick={() => onManage(period)}
										>
											Kelola
										</Button>
									</div>
								</article>
							))}
						</div>
					) : null}
					{!periods?.length ? (
						<p className="mt-5 rounded-2xl border border-dashed border-[#dfe3d8] p-8 text-center text-sm text-[#637065]">
							Belum ada kelas pada tahun ajaran ini.
						</p>
					) : null}
				</>
			) : null}
		</Card>
	);
}
