import { Card } from "@/components/ui/card";
import type { LifecycleMode, LifecycleStudent } from "../types";

export function StudentSelectionTable({
	students,
	selectedIds,
	allSelected,
	mode,
	onToggle,
	onToggleAll,
}: {
	students: LifecycleStudent[];
	selectedIds: string[];
	allSelected: boolean;
	mode: LifecycleMode;
	onToggle: (id: string) => void;
	onToggleAll: () => void;
}) {
	const action = mode === "transfer" ? "dipindahkan kelas" : "dinyatakan lulus";
	return (
		<Card className="mt-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="font-bold tracking-[-0.02em] text-brand-950">Murid aktif</h2>
					<p className="mt-1 text-sm text-[#637065]">Pilih murid yang akan {action}.</p>
				</div>
				<span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
					{students.length} murid
				</span>
			</div>
			{students.length ? (
				<>
					<div className="mt-5 hidden overflow-hidden rounded-2xl border border-[#e2e4da] md:block">
						<table className="w-full table-fixed text-left text-sm">
							<colgroup>
								<col className="w-14" />
								<col className="w-[44%]" />
								<col className="w-[32%]" />
								<col className="w-[9rem]" />
							</colgroup>
							<thead className="bg-[#f4f4ed] text-xs font-semibold uppercase tracking-[0.12em] text-[#637065]">
								<tr>
									<th className="w-14 px-4 py-3">
										<input
											type="checkbox"
											checked={allSelected}
											onChange={onToggleAll}
											aria-label="Pilih semua hasil filter"
										/>
									</th>
									<th className="px-4 py-3">Murid</th>
									<th className="px-4 py-3">Kelas saat ini</th>
									<th className="px-4 py-3 text-right">Pilihan</th>
								</tr>
							</thead>
							<tbody>
								{students.map((student) => {
									const selected = selectedIds.includes(student.id);
									return (
										<tr
											key={student.id}
											role="checkbox"
											aria-checked={selected}
											tabIndex={0}
											onClick={() => onToggle(student.id)}
											onKeyDown={(event) => {
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													onToggle(student.id);
												}
											}}
											className={`cursor-pointer border-t border-[#e7e7dc] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600 ${selected ? "bg-brand-50/70" : "hover:bg-brand-50/30"}`}
										>
											<td className="px-4 py-4">
												<input
													type="checkbox"
													checked={selected}
													onClick={(event) => event.stopPropagation()}
													onChange={() => onToggle(student.id)}
													aria-label={`Pilih ${student.name}`}
												/>
											</td>
											<td className="px-4 py-4">
												<p className="truncate font-semibold text-brand-950" title={student.name}>
													{student.name}
												</p>
												<p className="mt-1 text-xs text-[#637065]">
													{student.student_number
														? `Nomor induk: ${student.student_number}`
														: "Nomor induk belum diisi"}
												</p>
											</td>
											<td className="px-4 py-4">
												<span className="inline-flex rounded-full bg-[#f1f3ec] px-2.5 py-1 text-xs font-medium text-[#4e5c50]">
													{student.class_name || "Belum ditempatkan"}
												</span>
											</td>
											<td className="px-4 py-4 text-right text-xs font-medium">
												<span className={selected ? "text-brand-700" : "text-slate-400"}>
													{selected ? "Dipilih" : "Belum dipilih"}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<div className="mt-4 space-y-2 md:hidden">
						{students.map((student) => {
							const selected = selectedIds.includes(student.id);
							return (
								<label
									key={student.id}
									className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${selected ? "border-brand-200 bg-brand-50/70" : "border-slate-200 bg-white"}`}
								>
									<input
										type="checkbox"
										checked={selected}
										onChange={() => onToggle(student.id)}
										className="mt-1"
										aria-label={`Pilih ${student.name}`}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-semibold text-slate-900">
											{student.name}
										</span>
										<span className="mt-1 block text-xs text-slate-500">
											{student.student_number
												? `Nomor induk: ${student.student_number}`
												: "Nomor induk belum diisi"}
										</span>
										<span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
											{student.class_name || "Belum ditempatkan"}
										</span>
									</span>
									<span
										className={`pt-1 text-xs font-medium ${selected ? "text-brand-700" : "text-slate-400"}`}
									>
										{selected ? "Dipilih" : ""}
									</span>
								</label>
							);
						})}
					</div>
				</>
			) : (
				<p className="py-10 text-center text-sm text-slate-500">Tidak ada murid sesuai filter.</p>
			)}
		</Card>
	);
}
