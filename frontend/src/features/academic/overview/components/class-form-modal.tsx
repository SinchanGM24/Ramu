import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/shared/modal-dialog";

const inputClass =
	"w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function ClassFormModal({
	yearName,
	onClose,
	onSubmit,
}: {
	yearName: string;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	return (
		<ModalDialog
			title="Tambah kelas"
			description={`Kelas akan tersedia pada tahun ajaran ${yearName}.`}
			onClose={onClose}
			labelledBy="class-create-title"
			contentClassName="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
			bodyClassName="mt-5"
			closeOnEscape
			closeOnBackdrop
		>
			<form onSubmit={onSubmit} className="space-y-4">
				<label className="block text-sm font-semibold text-slate-700">
					Nama kelas
					<span className="mt-1.5 block">
						<input required name="name" placeholder="Kelas Apel" className={inputClass} autoFocus />
					</span>
				</label>
				<div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
					<Button type="button" variant="ghost" onClick={onClose}>
						Batal
					</Button>
					<Button type="submit">Simpan kelas</Button>
				</div>
			</form>
		</ModalDialog>
	);
}
