import { Building2, ImageUp } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type SchoolProfileFormProps = {
	address: string;
	editable: boolean;
	hasLogo?: boolean;
	logoUrl: string;
	name: string;
	phone: string;
	saving: boolean;
	uploadingLogo: boolean;
	onAddressChange: (value: string) => void;
	onLogoUpload: (file?: File) => void;
	onNameChange: (value: string) => void;
	onPhoneChange: (value: string) => void;
	onSubmit: () => void;
};

export function SchoolProfileForm({
	address,
	editable,
	hasLogo,
	logoUrl,
	name,
	phone,
	saving,
	uploadingLogo,
	onAddressChange,
	onLogoUpload,
	onNameChange,
	onPhoneChange,
	onSubmit,
}: SchoolProfileFormProps) {
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit();
			}}
			className="mt-6 space-y-6"
		>
			<div className="grid gap-5 md:grid-cols-2">
				<label className="block text-sm font-semibold text-[#35443a]">
					Nama sekolah
					<input
						required
						minLength={2}
						maxLength={160}
						value={name}
						disabled={!editable || saving}
						onChange={(event) => onNameChange(event.target.value)}
						className="mt-1.5 w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] px-3 py-3 font-normal text-[#17251b] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
					/>
				</label>
				<label className="block text-sm font-semibold text-[#35443a]">
					Nomor telepon
					<input
						value={phone}
						disabled={!editable || saving}
						onChange={(event) => onPhoneChange(event.target.value)}
						maxLength={40}
						className="mt-1.5 w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] px-3 py-3 font-normal text-[#17251b] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
						placeholder="Contoh: 021-12345678"
					/>
				</label>
				<label className="block text-sm font-semibold text-[#35443a] md:col-span-2">
					Alamat sekolah
					<textarea
						value={address}
						disabled={!editable || saving}
						onChange={(event) => onAddressChange(event.target.value)}
						maxLength={500}
						rows={2}
						className="mt-1.5 w-full resize-y rounded-xl border border-[#dfe3d9] bg-[#fffefa] px-3 py-3 font-normal text-[#17251b] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
						placeholder="Alamat lengkap sekolah"
					/>
				</label>
			</div>
			<div className="border-t border-[#e7e9df] pt-5">
				<p className="text-sm font-semibold text-[#35443a]">Logo sekolah</p>
				<p className="mt-1 text-sm leading-6 text-[#68746a]">
					Tampil pada kop raport yang diterbitkan setelah pembaruan.
				</p>
				<div className="mt-3 flex flex-wrap items-center gap-4">
					<div className="grid size-20 place-items-center overflow-hidden rounded-2xl border border-[#dfe3d9] bg-[#f5f7f1] shadow-inner">
						{hasLogo ? (
							<Image
								src={logoUrl}
								alt="Logo sekolah"
								width={80}
								height={80}
								unoptimized
								className="size-full object-contain p-1"
							/>
						) : (
							<Building2 size={26} className="text-[#9aa39a]" />
						)}
					</div>
					<label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-100 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50">
						<input
							type="file"
							accept="image/png,image/jpeg"
							className="sr-only"
							disabled={!editable || uploadingLogo}
							onChange={(event) => {
								onLogoUpload(event.target.files?.[0]);
								event.currentTarget.value = "";
							}}
						/>
						<ImageUp size={16} aria-hidden="true" />
						{uploadingLogo ? "Mengunggah…" : "Unggah logo"}
					</label>
					<p className="max-w-sm text-xs leading-5 text-[#6c776e]">
						Gunakan JPG atau PNG dengan ukuran maksimal 2 MB.
					</p>
				</div>
			</div>
			<div className="flex justify-end border-t border-[#e7e9df] pt-5">
				{editable ? (
					<Button disabled={saving || !name.trim()}>
						{saving ? "Menyimpan…" : "Simpan perubahan"}
					</Button>
				) : (
					<p className="text-sm text-[#68746a]">
						Hanya Admin Sekolah yang dapat mengubah profil sekolah.
					</p>
				)}
			</div>
		</form>
	);
}
