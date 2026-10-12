import type { FormEvent } from "react";
import { X } from "lucide-react";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import type { ClassGroup } from "../types";

const inputClass =
	"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

type StudentCreateDialogProps = {
	classes: ClassGroup[];
	error: string;
	isTeacher: boolean;
	onClose: () => void;
	onSubmit: (body: {
		classGroupId: string;
		gender?: string;
		name: string;
		studentNumber?: string;
	}) => void;
};

export function StudentCreateDialog({
	classes,
	error,
	isTeacher,
	onClose,
	onSubmit,
}: StudentCreateDialogProps) {
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		onSubmit({
			name: String(form.get("name") || ""),
			studentNumber: String(form.get("studentNumber") || "") || undefined,
			classGroupId: String(form.get("classGroupId") || ""),
			gender: String(form.get("gender") || "") || undefined,
		});
	}

	return (
		<ModalDialog
			eyebrow="Data murid"
			title="Tambah murid"
			onClose={onClose}
			labelledBy="student-modal-title"
			contentClassName="mx-auto my-10 w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
			closeOnEscape
			closeOnBackdrop
			closeLabel="Tutup"
			closeButton={
				<button
					type="button"
					onClick={onClose}
					aria-label="Tutup"
					className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
				>
					<X className="size-5" />
				</button>
			}
		>
			<p className="mt-4 text-sm leading-6 text-slate-500">
				{isTeacher
					? "Pengajuan akan ditinjau Admin Sekolah sebelum murid ditempatkan pada kelas."
					: "Murid akan langsung disimpan dan ditempatkan pada kelas pilihan."}
			</p>
			{error ? (
				<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
					{error}
				</p>
			) : null}
			<form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
				<input required name="name" placeholder="Nama lengkap murid" className={inputClass} />
				<input name="studentNumber" placeholder="Nomor induk (opsional)" className={inputClass} />
				<select required name="classGroupId" className={inputClass}>
					<option value="">Pilih kelas</option>
					{classes.map((item) => (
						<option key={item.id} value={item.id}>
							{item.name}
						</option>
					))}
				</select>
				<select name="gender" className={inputClass}>
					<option value="">Jenis kelamin (opsional)</option>
					<option value="MALE">Laki-laki</option>
					<option value="FEMALE">Perempuan</option>
				</select>
				<div className="flex justify-end gap-2 sm:col-span-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Batal
					</Button>
					<Button>Simpan murid</Button>
				</div>
			</form>
		</ModalDialog>
	);
}
