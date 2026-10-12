"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type School = {
	id: string;
	name: string;
	slug?: string;
	address?: string | null;
	phone?: string | null;
	has_logo?: boolean;
	updated_at?: string;
};

export function SchoolProfilePage() {
	const queryClient = useQueryClient();
	const school = useQuery({
		queryKey: ["school", "current"],
		queryFn: () => api<School>("/schools/current"),
	});
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const logoUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/api/schools/current/logo`;

	useEffect(() => {
		if (!school.data) return;
		setName(school.data.name);
		setAddress(school.data.address || "");
		setPhone(school.data.phone || "");
	}, [school.data]);

	async function save(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setNotice("");
		setSaving(true);
		try {
			const updated = await api<School>("/schools/current", {
				method: "PATCH",
				body: JSON.stringify({
					name: name.trim(),
					address: address.trim() || undefined,
					phone: phone.trim() || undefined,
				}),
			});
			queryClient.setQueryData(["school", "current"], updated);
			setNotice("Profil sekolah berhasil disimpan.");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Profil sekolah tidak dapat disimpan.");
		} finally {
			setSaving(false);
		}
	}

	async function uploadLogo(file?: File) {
		if (!file) return;
		if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
			setError("Pilih logo JPG atau PNG dengan ukuran maksimal 2 MB.");
			return;
		}
		setError("");
		setNotice("");
		setUploadingLogo(true);
		try {
			const form = new FormData();
			form.append("file", file);
			const updated = await api<School>("/schools/current/logo", { method: "POST", body: form });
			queryClient.setQueryData(["school", "current"], updated);
			setNotice("Logo sekolah berhasil diperbarui.");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Logo sekolah tidak dapat diunggah.");
		} finally {
			setUploadingLogo(false);
		}
	}

	return (
		<>
			<PageHeader
				eyebrow="Pengaturan"
				title="Profil sekolah"
				description="Kelola identitas dasar sekolah."
			/>
			{school.isLoading ? (
				<Card>Memuat profil sekolah…</Card>
			) : (
				<Card className="max-w-2xl">
					<div className="flex items-start gap-3 border-b border-slate-100 pb-5">
						<span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
							<Building2 size={21} />
						</span>
						<div>
							<h2 className="font-bold text-slate-900">Identitas sekolah</h2>
							<p className="mt-1 text-sm text-slate-500">
								Informasi ini dikelola oleh admin sekolah.
							</p>
						</div>
					</div>
					{error && (
						<p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
							{error}
						</p>
					)}
					{notice && (
						<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
							{notice}
						</p>
					)}
					<form onSubmit={save} className="mt-5 space-y-4">
						<label className="block text-sm font-semibold text-slate-700">
							Nama sekolah
							<input
								required
								minLength={2}
								maxLength={160}
								value={name}
								onChange={(event) => setName(event.target.value)}
								className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-brand-500"
							/>
						</label>
						<label className="block text-sm font-semibold text-slate-700">
							Alamat sekolah
							<textarea
								value={address}
								onChange={(event) => setAddress(event.target.value)}
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
								onChange={(event) => setPhone(event.target.value)}
								maxLength={40}
								className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-brand-500"
								placeholder="Contoh: 021-12345678"
							/>
						</label>
						<div className="border-t border-slate-100 pt-5">
							<p className="text-sm font-semibold text-slate-700">Logo sekolah</p>
							<div className="mt-2 flex flex-wrap items-center gap-4">
								<div className="grid size-20 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
									{school.data?.has_logo ? (
										<img
											src={`${logoUrl}?v=${school.data.updated_at || ""}`}
											alt="Logo sekolah"
											className="size-full object-contain p-1"
										/>
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
											void uploadLogo(event.target.files?.[0]);
											event.currentTarget.value = "";
										}}
									/>
									{uploadingLogo ? "Mengunggah…" : "Unggah logo"}
								</label>
								<p className="text-xs leading-5 text-slate-500">
									JPG atau PNG, maksimal 2 MB. Logo akan digunakan pada kop rapor yang diterbitkan
									setelah perubahan ini.
								</p>
							</div>
						</div>
						<div className="flex justify-end border-t border-slate-100 pt-5">
							<Button disabled={saving || !name.trim()}>
								{saving ? "Menyimpan…" : "Simpan perubahan"}
							</Button>
						</div>
					</form>
				</Card>
			)}
		</>
	);
}
