import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SchoolProfileFormProps = {
	address: string;
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
			className="mt-5 space-y-4"
		>
			<label className="block text-sm font-semibold text-slate-700">
				Nama sekolah
				<input
					required
					minLength={2}
					maxLength={160}
					value={name}
					onChange={(event) => onNameChange(event.target.value)}
					className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-brand-500"
				/>
			</label>
			<label className="block text-sm font-semibold text-slate-700">
				Alamat sekolah
				<textarea
					value={address}
					onChange={(event) => onAddressChange(event.target.value)}
					maxLength={500}
					rows={3}
					className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-brand-500"
					placeholder="Alamat lengkap sekolah"
				/>
			</label>
			<label className="block text-sm font-semibold text-slate-700">
				Nomor telepon
				<input
					value={phone}
					onChange={(event) => onPhoneChange(event.target.value)}
					maxLength={40}
					className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-brand-500"
					placeholder="Contoh: 021-12345678"
				/>
			</label>
			<div className="border-t border-slate-100 pt-5">
				<p className="text-sm font-semibold text-slate-700">Logo sekolah</p>
				<div className="mt-2 flex flex-wrap items-center gap-4">
					<div className="grid size-20 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
						{hasLogo ? (
							<img src={logoUrl} alt="Logo sekolah" className="size-full object-contain p-1" />
						) : (
							<Building2 size={26} className="text-slate-300" />
						)}
					</div>
					<label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
						<input
							type="file"
							accept="image/png,image/jpeg"
							className="sr-only"
							disabled={uploadingLogo}
							onChange={(event) => {
								onLogoUpload(event.target.files?.[0]);
								event.currentTarget.value = "";
							}}
						/>
						{uploadingLogo ? "Mengunggah…" : "Unggah logo"}
					</label>
					<p className="text-xs leading-5 text-slate-500">
						JPG atau PNG, maksimal 2 MB. Logo akan digunakan pada kop rapor yang diterbitkan setelah
						perubahan ini.
					</p>
				</div>
			</div>
			<div className="flex justify-end border-t border-slate-100 pt-5">
				<Button disabled={saving || !name.trim()}>
					{saving ? "Menyimpan…" : "Simpan perubahan"}
				</Button>
			</div>
		</form>
	);
}
