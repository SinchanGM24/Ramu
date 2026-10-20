"use client";

import { FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";

const inputClass =
	"mt-1.5 w-full rounded-xl border border-[#dcc5b5] bg-[#fffdf9] px-3 py-2.5 text-sm text-[#3c2a20] outline-none transition placeholder:text-[#9d8679] focus:border-[#765646] focus:ring-2 focus:ring-[#f2daca]";

export function TenantAdminPasswordDialog({
	adminName,
	pending,
	error,
	onClose,
	onSubmit,
}: {
	adminName: string;
	pending: boolean;
	error: string;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	return (
		<ModalDialog
			title="Atur ulang sandi Admin Sekolah"
			eyebrow="Akses tenant"
			description={`Sandi baru hanya berlaku untuk ${adminName}. Seluruh sesi aktifnya akan dicabut dan ia wajib mengganti sandi saat masuk kembali.`}
			onClose={onClose}
			labelledBy="tenant-admin-password-title"
			closeOnEscape={!pending}
			closeOnBackdrop={!pending}
			contentClassName="mx-auto my-8 w-full max-w-lg rounded-2xl border border-[#dfcdbf] bg-[#fffaf6] p-5 shadow-[0_24px_64px_rgba(80,54,39,0.22)] sm:p-6"
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
			<form className="space-y-4" onSubmit={onSubmit}>
				<label className="block text-sm font-semibold text-[#543b2e]">
					Sandi baru
					<input
						required
						name="password"
						type="password"
						autoComplete="new-password"
						minLength={12}
						className={inputClass}
					/>
				</label>
				<label className="block text-sm font-semibold text-[#543b2e]">
					Konfirmasi sandi baru
					<input
						required
						name="passwordConfirmation"
						type="password"
						autoComplete="new-password"
						minLength={12}
						className={inputClass}
					/>
				</label>
				{error ? (
					<p
						role="alert"
						className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700"
					>
						{error}
					</p>
				) : null}
				<div className="flex flex-col-reverse gap-2 border-t border-[#ead9cc] pt-4 sm:flex-row sm:justify-end">
					<Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
						Batal
					</Button>
					<Button type="submit" className="bg-[#765646] hover:bg-[#68483a]" disabled={pending}>
						{pending ? (
							"Menyimpan sandi…"
						) : (
							<>
								<KeyRound size={16} /> Simpan sandi baru
							</>
						)}
					</Button>
				</div>
			</form>
		</ModalDialog>
	);
}
