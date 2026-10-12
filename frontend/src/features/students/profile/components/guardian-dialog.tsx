import type { FormEvent, ReactNode } from "react";
import { X } from "lucide-react";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import type { Guardian } from "../types";

const inputClass =
	"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500";

type GuardianDialogProps = {
	guardian: Guardian | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (body: unknown) => void;
};

export function GuardianDialog({ guardian, pending, onClose, onSubmit }: GuardianDialogProps) {
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		onSubmit({
			name: form.get("name"),
			relationship: form.get("relationship"),
			phone: form.get("phone"),
			occupation: form.get("occupation") || null,
			isPrimary: form.get("isPrimary") === "on",
			isDeliveryRecipient: form.get("isDeliveryRecipient") === "on",
		});
	}

	return (
		<ModalDialog
			title={guardian ? "Ubah kontak wali" : "Tambah kontak wali"}
			description="Simpan data kontak yang dapat dihubungi sekolah."
			onClose={onClose}
			labelledBy="guardian-modal-title"
			titleClassName="text-xl font-bold"
			contentClassName="mx-auto my-8 w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
			closeOnEscape
			closeOnBackdrop
			closeLabel="Tutup panel"
			closeButton={
				<button
					type="button"
					onClick={onClose}
					aria-label="Tutup panel"
					className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
				>
					<X size={20} />
				</button>
			}
		>
			<form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
				<Field label="Nama orang tua/wali">
					<input required name="name" defaultValue={guardian?.name ?? ""} className={inputClass} />
				</Field>
				<Field label="Hubungan">
					<input
						required
						name="relationship"
						defaultValue={guardian?.relationship ?? ""}
						placeholder="Contoh: Ibu"
						className={inputClass}
					/>
				</Field>
				<Field label="Nomor telepon">
					<input
						required
						name="phone"
						defaultValue={guardian?.phone ?? ""}
						className={inputClass}
					/>
				</Field>
				<Field label="Pekerjaan" optional>
					<input
						name="occupation"
						defaultValue={guardian?.occupation ?? ""}
						className={inputClass}
					/>
				</Field>
				<SwitchField name="isPrimary" checked={guardian?.is_primary ?? guardian === null}>
					Jadikan kontak utama
				</SwitchField>
				<SwitchField name="isDeliveryRecipient" checked={guardian?.is_delivery_recipient ?? true}>
					<span className="block">Kirim rapor ke kontak ini</span>
					<span className="mt-1 block text-xs font-normal text-slate-500">
						Kontak ini akan menerima tautan rapor setelah rapor diterbitkan.
					</span>
				</SwitchField>
				<div className="flex gap-2 md:col-span-2">
					<Button disabled={pending}>{pending ? "Menyimpan…" : "Simpan kontak"}</Button>
					<Button type="button" variant="ghost" onClick={onClose}>
						Batal
					</Button>
				</div>
			</form>
		</ModalDialog>
	);
}

function Field({
	children,
	label,
	optional = false,
}: {
	children: ReactNode;
	label: string;
	optional?: boolean;
}) {
	return (
		<label className="block text-sm font-medium text-slate-700">
			<span>
				{label}
				{optional ? <span className="ml-1 font-normal text-slate-500">(opsional)</span> : null}
			</span>
			{children}
		</label>
	);
}

function SwitchField({
	children,
	checked,
	name,
}: {
	children: ReactNode;
	checked: boolean;
	name: string;
}) {
	return (
		<label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 md:col-span-2">
			<span>{children}</span>
			<span className="relative inline-flex shrink-0">
				<input name={name} type="checkbox" defaultChecked={checked} className="peer sr-only" />
				<span
					aria-hidden="true"
					className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2"
				/>
				<span
					aria-hidden="true"
					className="pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5"
				/>
			</span>
		</label>
	);
}
