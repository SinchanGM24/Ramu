import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/shared/modal-dialog";

const inputClass =
	"w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function YearFormModal({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	return (
		<ModalDialog
			title="Tambah tahun ajaran"
			description="Pilih tanggal mulai tahun ajaran. Semester akan dibuat otomatis dengan pola Juli hingga Juni."
			onClose={onClose}
			labelledBy="academic-year-create-title"
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
			<form onSubmit={onSubmit} className="space-y-4">
				<label className="block text-sm font-semibold text-slate-700">
					Tanggal mulai tahun ajaran
					<span className="mt-1.5 block">
						<input
							required
							name="startDate"
							type="date"
							defaultValue={`${new Date().getFullYear()}-07-01`}
							className={inputClass}
							autoFocus
						/>
					</span>
				</label>
				<div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
					<Button type="button" variant="ghost" onClick={onClose}>
						Batal
					</Button>
					<Button type="submit">Simpan tahun ajaran</Button>
				</div>
			</form>
		</ModalDialog>
	);
}
