import { useState } from "react";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import type { AcademicSemester, AcademicYear } from "../types";

const inputClass =
	"w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function YearSwitchModal({
	years,
	semesters,
	activeId,
	activeSemesterId,
	onActivate,
	onClose,
}: {
	years: AcademicYear[];
	semesters: AcademicSemester[];
	activeId?: string;
	activeSemesterId?: string;
	onActivate: (yearId: string, semesterId: string) => Promise<void>;
	onClose: () => void;
}) {
	const [selectedId, setSelectedId] = useState(activeId || "");
	const [selectedSemesterId, setSelectedSemesterId] = useState(activeSemesterId || "");
	const [search, setSearch] = useState("");
	const [saving, setSaving] = useState(false);
	const filteredYears = years.filter((year) =>
		year.name.toLowerCase().includes(search.trim().toLowerCase()),
	);
	const selectedSemesters = semesters.filter(
		(semester) => semester.academic_year_id === selectedId,
	);

	function selectYear(yearId: string) {
		setSelectedId(yearId);
		setSelectedSemesterId(
			semesters.find((semester) => semester.academic_year_id === yearId && semester.is_active)
				?.id ||
				semesters.find((semester) => semester.academic_year_id === yearId)?.id ||
				"",
		);
	}

	async function submit() {
		if (!selectedId || !selectedSemesterId) return;
		setSaving(true);
		try {
			await onActivate(selectedId, selectedSemesterId);
		} finally {
			setSaving(false);
		}
	}

	return (
		<ModalDialog
			title="Ganti konteks akademik"
			description="Pilih tahun ajaran dan semester kerja. Perpindahan atau kelulusan murid tidak dilakukan otomatis."
			onClose={onClose}
			labelledBy="academic-year-switch-title"
			contentClassName="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
			bodyClassName="mt-5"
			closeOnEscape
			closeOnBackdrop
			closeButton={
				<button
					type="button"
					onClick={onClose}
					aria-label="Tutup dialog"
					className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
				>
					×
				</button>
			}
		>
			<div className="space-y-3">
				<label className="block">
					<span className="mb-1.5 block text-sm font-medium text-slate-700">Cari tahun ajaran</span>
					<input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Misalnya 2028"
						className={inputClass}
						autoFocus
					/>
				</label>
				<div className="max-h-52 space-y-2 overflow-y-auto pr-1">
					{filteredYears.map((year) => (
						<button
							type="button"
							key={year.id}
							onClick={() => selectYear(year.id)}
							aria-pressed={selectedId === year.id}
							className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${selectedId === year.id ? "border-brand-300 bg-brand-50" : "border-slate-200 hover:border-brand-200 hover:bg-slate-50"}`}
						>
							<span>
								<span className="flex items-center gap-2">
									<span className="font-semibold text-slate-900">{year.name}</span>
									{year.id === activeId ? (
										<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
											Sedang aktif
										</span>
									) : null}
								</span>
								<span className="mt-1 block text-xs text-slate-500">Pilih semester di bawah</span>
							</span>
							<span
								className={
									selectedId === year.id
										? "grid size-5 place-items-center rounded-full border-4 border-brand-600 bg-white"
										: "size-5 rounded-full border-2 border-slate-300"
								}
							/>
						</button>
					))}
				</div>
				{selectedId ? (
					<fieldset className="rounded-xl border border-slate-200 p-3">
						<legend className="px-1 text-sm font-semibold text-slate-700">Semester aktif</legend>
						<div className="mt-2 grid gap-2 sm:grid-cols-2">
							{selectedSemesters.map((semester) => (
								<button
									type="button"
									key={semester.id}
									onClick={() => setSelectedSemesterId(semester.id)}
									aria-pressed={selectedSemesterId === semester.id}
									className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${selectedSemesterId === semester.id ? "border-brand-300 bg-brand-50 text-brand-900" : "border-slate-200 text-slate-700 hover:border-brand-200"}`}
								>
									{semester.name}
								</button>
							))}
						</div>
					</fieldset>
				) : null}
			</div>
			<p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
				Konteks aktif menentukan kelas, murid, dan raport yang dapat dikerjakan guru.
			</p>
			<div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
				<Button type="button" variant="ghost" onClick={onClose}>
					Batal
				</Button>
				<Button
					disabled={!selectedId || !selectedSemesterId || saving}
					onClick={() => void submit()}
				>
					{saving ? "Mengganti…" : "Gunakan konteks ini"}
				</Button>
			</div>
		</ModalDialog>
	);
}
