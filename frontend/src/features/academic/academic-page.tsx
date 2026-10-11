"use client";
import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CalendarDays,
	Plus,
	School,
	UsersRound,
	X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

type Year = { id: string; name: string; is_active: boolean };
type ClassPeriod = {
	id: string;
	name: string;
	class_group_id: string;
	is_active: boolean;
	academic_year_name?: string;
	teacher_names?: string | null;
	student_count?: number;
};
type Staff = {
	id: string;
	name: string;
	role: "TEACHER" | "PRINCIPAL" | "SCHOOL_ADMIN";
	is_active: boolean;
};
type Assignment = {
	id: string;
	teacher_name: string;
	ended_at?: string | null;
};
const inputClass =
	"w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
export function AcademicPage() {
	const qc = useQueryClient();
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [yearModal, setYearModal] = useState(false);
	const [classModal, setClassModal] = useState(false);
	const [yearsModal, setYearsModal] = useState(false);
	const [managing, setManaging] = useState<ClassPeriod | null>(null);
	const years = useQuery({
		queryKey: ["academic", "years"],
		queryFn: () => api<Year[]>("/academic/years"),
	});
	const activeYear = years.data?.find((year) => year.is_active);
	const periods = useQuery({
		queryKey: ["academic", "class-periods", activeYear?.id],
		enabled: Boolean(activeYear),
		queryFn: () =>
			api<ClassPeriod[]>(
				`/academic/class-periods?academicYearId=${activeYear?.id}`,
			),
	});
	async function request(
		path: string,
		body: object,
		key: readonly unknown[],
		close: () => void,
	) {
		setError("");
		try {
			await api(path, { method: "POST", body: JSON.stringify(body) });
			close();
			await qc.invalidateQueries({ queryKey: key });
		} catch (reason) {
			setError(
				reason instanceof Error ? reason.message : "Data tidak dapat disimpan.",
			);
		}
	}
	function addYear(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const startDate = String(new FormData(event.currentTarget).get("startDate") || "");
		setError("");
		void api<Year>("/academic/years", { method: "POST", body: JSON.stringify({ name: startDate.slice(0, 4) }) }).then(async (year) => {
			setYearModal(false);
			setNotice(year.is_active ? `Tahun ajaran ${year.name} berhasil dibuat dan menjadi tahun aktif pertama.` : `Tahun ajaran ${year.name} berhasil ditambahkan. Aktifkan saat siap digunakan.`);
			await qc.invalidateQueries({ queryKey: ["academic", "years"] });
		}).catch((reason) => setError(reason instanceof Error ? reason.message : "Tahun ajaran tidak dapat dibuat."));
	}
	function addClass(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (activeYear)
			void request(
				"/academic/class-periods",
				{
					name: new FormData(event.currentTarget).get("name"),
					academicYearId: activeYear.id,
				},
				["academic", "class-periods", activeYear.id],
				() => setClassModal(false),
			);
	}
	async function activate(id: string) {
		await request(
			`/academic/years/${id}/activate`,
			{},
			["academic", "years"],
			() => setYearsModal(false),
		);
	}
	return (
		<>
			<PageHeader
				eyebrow="Akademik"
				title="Kelas dan tahun ajaran"
				description="Tentukan konteks tahun ajaran, lalu siapkan kelas dan penugasan guru."
				action={
					<Button variant="secondary" onClick={() => setYearModal(true)}>
						<CalendarDays size={16} />
						Tambah tahun ajaran
					</Button>
				}
			/>
			{error && (
				<p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</p>
			)}
			{notice && <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
			{activeYear ? (
				<Card className="border-brand-100 bg-brand-50/40">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<span className="grid size-11 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
								<CalendarDays size={20} />
							</span>
							<div>
								<p className="text-sm text-slate-500">Tahun ajaran aktif</p>
								<h2 className="font-bold text-slate-950">{activeYear.name}</h2>
								<p className="text-xs text-slate-500">
									Semester I dan Semester II tersedia
								</p>
							</div>
						</div>
						<Button variant="ghost" onClick={() => setYearsModal(true)}>
							Ganti tahun ajaran
						</Button>
					</div>
				</Card>
			) : (
				<Card className="border-dashed text-center">
					<School className="mx-auto text-brand-600" />
					<h2 className="mt-3 font-bold">Mulai dengan tahun ajaran pertama</h2>
					<p className="mt-1 text-sm text-slate-500">
						Kelas dan penempatan murid dibuat dalam konteks tahun ajaran.
					</p>
					<Button className="mt-4" onClick={() => setYearModal(true)}>
						<Plus size={16} />
						Buat tahun ajaran pertama
					</Button>
				</Card>
			)}
			<Card className="mt-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 className="font-bold text-slate-950">
							Kelas tahun ajaran aktif
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							Kelola kelas, guru yang ditugaskan, dan ringkasan penempatan murid
							untuk {activeYear?.name || "tahun ajaran aktif"}.
						</p>
					</div>
					<Button disabled={!activeYear} onClick={() => setClassModal(true)}>
						<Plus size={16} />
						Tambah kelas
					</Button>
				</div>
				{activeYear ? (
					<div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
						<table className="w-full min-w-[680px] text-left text-sm">
							<thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
								<tr>
									<th className="px-4 py-3">Kelas</th>
									<th className="px-4 py-3">Guru ditugaskan</th>
									<th className="px-4 py-3 text-center">Murid</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{periods.data?.map((period) => (
									<tr key={period.id} className="border-t border-slate-100">
										<td className="px-4 py-4 font-semibold text-slate-900">
											{period.name}
										</td>
										<td className="px-4 py-4 text-slate-600">
											{period.teacher_names || "Belum ada guru ditugaskan"}
										</td>
										<td className="px-4 py-4 text-center text-slate-600">
											{period.student_count || 0}
										</td>
										<td className="px-4 py-4">
											<span className={period.is_active ? "font-semibold text-emerald-700" : "font-semibold text-slate-500"}>
												{period.is_active ? "Aktif" : "Nonaktif"}
											</span>
										</td>
										<td className="px-4 py-4 text-right">
											<Button
												variant="ghost"
												className="min-h-9 px-3"
												onClick={() => setManaging(period)}
											>
												Kelola
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{!periods.data?.length && (
							<Empty text="Belum ada kelas pada tahun ajaran ini." />
						)}
					</div>
				) : null}
			</Card>
			{yearModal && (
				<Modal
					title="Tambah tahun ajaran"
					description="Pilih tanggal mulai tahun ajaran. Semester akan dibuat otomatis dengan pola Juli hingga Juni."
					onClose={() => setYearModal(false)}
				>
					<form onSubmit={addYear} className="space-y-4">
						<Field label="Tanggal mulai tahun ajaran">
							<input
								required
								name="startDate"
								type="date"
								defaultValue={`${new Date().getFullYear()}-07-01`}
								className={inputClass}
								autoFocus
							/>
						</Field>
						<Actions
							onClose={() => setYearModal(false)}
							label="Simpan tahun ajaran"
						/>
					</form>
				</Modal>
			)}
			{classModal && activeYear && (
				<Modal
					title="Tambah kelas"
					description={`Kelas akan tersedia pada tahun ajaran ${activeYear.name}.`}
					onClose={() => setClassModal(false)}
				>
					<form onSubmit={addClass} className="space-y-4">
						<Field label="Nama kelas">
							<input
								required
								name="name"
								placeholder="Kelas Apel"
								className={inputClass}
								autoFocus
							/>
						</Field>
						<Actions
							onClose={() => setClassModal(false)}
							label="Simpan kelas"
						/>
					</form>
				</Modal>
			)}
			{yearsModal && (
				<YearPanel
					years={years.data || []}
					activeId={activeYear?.id}
					onActivate={activate}
					onClose={() => setYearsModal(false)}
				/>
			)}{" "}
			{managing && (
				<ClassPanel period={managing} onClose={() => setManaging(null)} />
			)}
		</>
	);
}
function YearPanel({
	years,
	activeId,
	onActivate,
	onClose,
}: {
	years: Year[];
	activeId?: string;
	onActivate: (id: string) => Promise<void>;
	onClose: () => void;
}) {
	const [selectedId, setSelectedId] = useState(activeId || "");
	const [search, setSearch] = useState("");
	const [saving, setSaving] = useState(false);
	const filteredYears = years.filter((year) =>
		year.name.toLowerCase().includes(search.trim().toLowerCase()),
	);
	async function submit() {
		if (!selectedId || selectedId === activeId) return;
		setSaving(true);
		try { await onActivate(selectedId); } finally { setSaving(false); }
	}
	return (
		<Modal
			title="Ganti tahun ajaran aktif"
			description="Pilih satu konteks kerja. Perpindahan, kenaikan, atau kelulusan murid tidak dilakukan otomatis."
			onClose={onClose}
		>
			<div className="space-y-3">
				<label className="block">
					<span className="mb-1.5 block text-sm font-medium text-slate-700">
						Cari tahun ajaran
					</span>
					<input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Misalnya 2028"
						className={inputClass}
						autoFocus
					/>
				</label>
				<div className="flex items-center justify-between text-xs text-slate-500">
					<span>{filteredYears.length} tahun ajaran ditemukan</span>
					<span>Daftar terbaru di atas</span>
				</div>
				<div className="max-h-72 space-y-2 overflow-y-auto pr-1">
				{filteredYears.map((year) => (
					<button
						type="button"
						key={year.id}
						onClick={() => setSelectedId(year.id)}
						aria-pressed={selectedId === year.id}
						className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${selectedId === year.id ? "border-brand-300 bg-brand-50" : "border-slate-200 hover:border-brand-200 hover:bg-slate-50"}`}
					>
						<span>
							<span className="flex items-center gap-2">
								<span className="font-semibold text-slate-900">{year.name}</span>
								{year.id === activeId ? (
									<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Sedang aktif</span>
								) : null}
							</span>
							<span className="mt-1 block text-xs text-slate-500">Semester I dan Semester II</span>
						</span>
						<span className={selectedId === year.id ? "grid size-5 place-items-center rounded-full border-4 border-brand-600 bg-white" : "size-5 rounded-full border-2 border-slate-300"} />
					</button>
				))}
				{filteredYears.length === 0 ? (
					<p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
						Tidak ada tahun ajaran yang sesuai.
					</p>
				) : null}
				</div>
			</div>
			<p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">Tahun ajaran aktif menentukan kelas dan murid yang tampil di halaman Akademik.</p>
			<div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button disabled={!selectedId || selectedId === activeId || saving} onClick={() => void submit()}>{saving ? "Mengganti…" : "Gunakan tahun ajaran ini"}</Button></div>
		</Modal>
	);
}
function ClassPanel({
	period,
	onClose,
}: {
	period: ClassPeriod;
	onClose: () => void;
}) {
	const qc = useQueryClient();
	const [teacher, setTeacher] = useState("");
	const [error, setError] = useState("");
	const [isActive, setIsActive] = useState(period.is_active);
	const staff = useQuery({
		queryKey: ["staff"],
		queryFn: () => api<Staff[]>("/staff"),
	});
	const assignments = useQuery({
		queryKey: ["assignments", period.id],
		queryFn: () =>
			api<Assignment[]>(`/staff/class-periods/${period.id}/assignments`),
	});
	async function add() {
		if (!teacher) return;
		try {
			await api(`/staff/class-periods/${period.id}/assignments`, {
				method: "POST",
				body: JSON.stringify({ teacherUserId: teacher }),
			});
			setTeacher("");
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["assignments", period.id] }),
				qc.invalidateQueries({ queryKey: ["academic", "class-periods"] }),
			]);
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Guru tidak dapat ditugaskan.",
			);
		}
	}
	async function end(id: string) {
		try {
			await api(`/staff/class-periods/${period.id}/assignments/${id}/end`, {
				method: "POST",
			});
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["assignments", period.id] }),
				qc.invalidateQueries({ queryKey: ["academic", "class-periods"] }),
			]);
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Penugasan tidak dapat diakhiri.",
			);
		}
	}
	async function updateStatus(checked: boolean) {
		setIsActive(checked);
		try {
			await api(`/academic/class-groups/${period.class_group_id}`, {
				method: "POST",
				body: JSON.stringify({ name: period.name, isActive: checked }),
			});
			await qc.invalidateQueries({ queryKey: ["academic", "class-periods"] });
		} catch (reason) {
			setIsActive(!checked);
			setError(
				reason instanceof Error
					? reason.message
					: "Status kelas tidak dapat diperbarui.",
			);
		}
	}
	async function remove() {
		if (!window.confirm(`Hapus kelas "${period.name}"?`)) return;
		try {
			await api(`/academic/class-groups/${period.class_group_id}`, {
				method: "DELETE",
			});
			await qc.invalidateQueries({ queryKey: ["academic", "class-periods"] });
			onClose();
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Kelas tidak dapat dihapus.",
			);
		}
	}
	return (
		<Modal
			title={`Kelola ${period.name}`}
			description="Penugasan guru hanya berlaku untuk kelas pada tahun ajaran ini."
			onClose={onClose}
		>
			<p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
				{period.student_count || 0} murid ditempatkan pada kelas ini.
			</p>
			<div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
				<div>
					<p className="text-sm font-semibold text-slate-700">Status kelas</p>
					<p className="text-xs text-slate-500">
						{isActive ? "Kelas dapat digunakan" : "Kelas tidak dapat digunakan"}
					</p>
				</div>
				<Switch
					checked={isActive}
					onChange={(checked) => void updateStatus(checked)}
					aria-label="Ubah status kelas"
				/>
			</div>
			<h3 className="mt-5 font-semibold">Guru yang ditugaskan</h3>
			<div className="mt-3 flex flex-wrap gap-2">
				{assignments.data
					?.filter((item) => !item.ended_at)
					.map((item) => (
						<span
							key={item.id}
							className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-800"
						>
							{item.teacher_name}
							<button
								onClick={() => void end(item.id)}
								aria-label={`Akhiri penugasan ${item.teacher_name}`}
							>
								×
							</button>
						</span>
					))}
				{!assignments.data?.some((item) => !item.ended_at) && (
					<p className="text-sm text-slate-500">Belum ada guru ditugaskan.</p>
				)}
			</div>
			<div className="mt-4 flex gap-2">
				<select
					value={teacher}
					onChange={(event) => setTeacher(event.target.value)}
					className={`${inputClass} min-w-0 flex-1`}
				>
					<option value="">Pilih guru</option>
					{staff.data
						?.filter(
							(account) => account.role === "TEACHER" && account.is_active,
						)
						.map((account) => (
							<option key={account.id} value={account.id}>
								{account.name}
							</option>
						))}
				</select>
				<Button
					variant="secondary"
					disabled={!teacher}
					onClick={() => void add()}
				>
					Tambah
				</Button>
			</div>
			{error && <p className="mt-3 text-sm text-red-700">{error}</p>}
			<div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
				<Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => void remove()}>
					Hapus kelas
				</Button>
			</div>
		</Modal>
	);
}
function Modal({
	title,
	description,
	children,
	onClose,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
	onClose: () => void;
}) {
	useEffect(() => {
		const close = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", close);
		return () => window.removeEventListener("keydown", close);
	}, [onClose]);
	return (
		<div
			className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4"
			onMouseDown={(event) => event.target === event.currentTarget && onClose()}
		>
			<section
				role="dialog"
				aria-modal="true"
				className="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
			>
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="font-bold">{title}</h2>
						<p className="mt-1 text-sm text-slate-500">{description}</p>
					</div>
					<button
						onClick={onClose}
						aria-label="Tutup dialog"
						className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
					>
						<X size={20} />
					</button>
				</div>
				<div className="mt-5">{children}</div>
			</section>
		</div>
	);
}
function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<label className="block text-sm font-semibold text-slate-700">
			{label}
			<span className="mt-1.5 block">{children}</span>
		</label>
	);
}
function Actions({ onClose, label }: { onClose: () => void; label: string }) {
	return (
		<div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
			<Button type="button" variant="ghost" onClick={onClose}>
				Batal
			</Button>
			<Button type="submit">{label}</Button>
		</div>
	);
}
function Empty({ text }: { text: string }) {
	return <p className="p-6 text-center text-sm text-slate-500">{text}</p>;
}
