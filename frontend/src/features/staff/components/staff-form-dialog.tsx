import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModalDialog } from "@/components/shared/modal-dialog";
import type { StaffMember } from "../types";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm";
export function StaffFormDialog({
	editing,
	onClose,
	onSubmit,
}: {
	editing?: StaffMember | null;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const [isActive, setIsActive] = useState(editing?.is_active ?? true);
	const creating = !editing;
	return (
		<ModalDialog
			title={creating ? "Tambah akun" : "Edit akun"}
			onClose={onClose}
			labelledBy="staff-form-title"
			contentClassName="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
			bodyClassName="mt-5"
			closeButton={
				<button
					type="button"
					onClick={onClose}
					aria-label="Tutup dialog"
					className="text-xl text-slate-500"
				>
					×
				</button>
			}
		>
			<form autoComplete="off" onSubmit={onSubmit} className="space-y-3">
				<label className="block text-sm font-semibold">
					Nama{creating ? " lengkap" : ""}
					<input
						required
						name="name"
						autoComplete="off"
						defaultValue={editing?.name}
						className={`${inputClass} mt-1`}
					/>
				</label>
				{creating && (
					<label className="block text-sm font-semibold">
						Email
						<input
							required
							name="email"
							type="email"
							autoComplete="off"
							placeholder="email@sekolah.id"
							className={`${inputClass} mt-1`}
						/>
					</label>
				)}
				<label className="block text-sm font-semibold">
					Nomor telepon
					{creating && (
						<span className="mt-1 block text-xs font-normal text-slate-500">
							Dipakai sebagai kontak guru pada rapor.
						</span>
					)}
					<input
						name="phone"
						type="tel"
						autoComplete="off"
						defaultValue={editing?.phone || ""}
						placeholder={creating ? "08xxxxxxxxxx" : undefined}
						className={`${inputClass} mt-1`}
					/>
				</label>
				<label className="block text-sm font-semibold">
					Peran
					<select
						required
						name="role"
						autoComplete="off"
						defaultValue={editing?.role ?? "TEACHER"}
						className={`${inputClass} mt-1`}
					>
						<option value="TEACHER">Guru</option>
						<option value="PRINCIPAL">Kepala sekolah</option>
					</select>
				</label>
				<label className="block text-sm font-semibold">
					{creating ? "Kata sandi awal" : "Kata sandi baru"}
					{!creating && (
						<span className="mt-1 block text-xs font-normal text-slate-500">
							Kosongkan jika tidak ingin mengganti. Admin Sekolah dapat mengatur ulang langsung.
						</span>
					)}
					<input
						required={creating}
						minLength={8}
						name="password"
						type="password"
						autoComplete="new-password"
						className={`${inputClass} mt-1`}
					/>
				</label>
				{!creating && (
					<div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
						<div>
							<p className="text-sm font-semibold text-slate-700">Status akun</p>
							<p className="text-xs text-slate-500">
								{isActive ? "Akun dapat digunakan" : "Akun tidak dapat digunakan"}
							</p>
						</div>
						<Switch
							name="isActive"
							checked={isActive}
							onChange={setIsActive}
							aria-label="Ubah status akun"
						/>
					</div>
				)}
				<div className="flex justify-end gap-2 pt-3">
					<Button type="button" variant="ghost" onClick={onClose}>
						Batal
					</Button>
					<Button type="submit">
						{creating ? (
							<>
								<Plus size={16} />
								Buat akun
							</>
						) : (
							"Simpan perubahan"
						)}
					</Button>
				</div>
			</form>
		</ModalDialog>
	);
}
