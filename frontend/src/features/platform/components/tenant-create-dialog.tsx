import { FormEvent } from "react";
import { Plus } from "lucide-react";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";

const inputClass =
	"w-full rounded-xl border border-[#dcc5b5] bg-[#fffdf9] px-3 py-2.5 text-sm text-[#3c2a20] outline-none transition placeholder:text-[#9d8679] focus:border-[#765646] focus:ring-2 focus:ring-[#f2daca]";

export function TenantCreateDialog({
	pending,
	error,
	onClose,
	onSubmit,
}: {
	pending: boolean;
	error: string;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	return (
		<ModalDialog
			title="Tambah tenant"
			eyebrow="Operasional platform"
			description="Buat sekolah dan akun Admin Sekolah. Sandi sementara hanya ditampilkan sekali setelah tenant berhasil dibuat."
			onClose={onClose}
			labelledBy="tenant-create-title"
			closeOnEscape={!pending}
			closeOnBackdrop={!pending}
			contentClassName="mx-auto my-8 w-full max-w-2xl rounded-2xl border border-[#dfcdbf] bg-[#fffaf6] p-5 shadow-[0_24px_64px_rgba(80,54,39,0.22)] sm:p-6"
			headerClassName="flex items-start justify-between gap-4"
			bodyClassName="mt-5"
			closeButton={
				<button
					type="button"
					onClick={onClose}
					disabled={pending}
					aria-label="Tutup dialog"
					className="rounded-lg p-1 text-xl text-[#8b7061] transition hover:bg-[#f5e9df] hover:text-[#4e3428] disabled:cursor-wait disabled:opacity-50"
				>
					×
				</button>
			}
		>
			<form autoComplete="off" className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
				<label className="text-sm font-semibold text-[#543b2e]">
					Nama sekolah
					<input
						required
						name="schoolName"
						autoComplete="organization"
						className={`${inputClass} mt-1.5`}
					/>
				</label>
				<label className="text-sm font-semibold text-[#543b2e]">
					Nama Admin Sekolah
					<input required name="adminName" autoComplete="name" className={`${inputClass} mt-1.5`} />
				</label>
				<label className="text-sm font-semibold text-[#543b2e]">
					Email Admin Sekolah
					<input
						required
						name="adminEmail"
						type="email"
						autoComplete="email"
						placeholder="admin@sekolah.id"
						className={`${inputClass} mt-1.5`}
					/>
				</label>
				<label className="text-sm font-semibold text-[#543b2e]">
					Telepon <span className="font-normal text-[#8b7061]">(opsional)</span>
					<input
						name="phone"
						inputMode="tel"
						placeholder="08xxxxxxxxxx"
						className={`${inputClass} mt-1.5`}
					/>
				</label>
				<label className="text-sm font-semibold text-[#543b2e] md:col-span-2">
					Alamat <span className="font-normal text-[#8b7061]">(opsional)</span>
					<input name="address" autoComplete="street-address" className={`${inputClass} mt-1.5`} />
				</label>
				{error ? (
					<p
						role="alert"
						className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700 md:col-span-2"
					>
						{error}
					</p>
				) : null}
				<div className="flex flex-col-reverse gap-2 border-t border-[#ead9cc] pt-4 sm:flex-row sm:justify-end md:col-span-2">
					<Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
						Batal
					</Button>
					<Button type="submit" className="bg-[#765646] hover:bg-[#68483a]" disabled={pending}>
						{pending ? (
							"Membuat tenant…"
						) : (
							<>
								<Plus size={16} /> Buat tenant
							</>
						)}
					</Button>
				</div>
			</form>
		</ModalDialog>
	);
}
