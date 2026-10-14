"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Landmark } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { SchoolProfileForm } from "./components/school-profile-form";

type School = {
	id: string;
	name: string;
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
	useEffect(() => {
		if (school.data) {
			setName(school.data.name);
			setAddress(school.data.address || "");
			setPhone(school.data.phone || "");
		}
	}, [school.data]);
	async function save() {
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
	const logoUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/api/schools/current/logo?v=${school.data?.updated_at || ""}`;
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
				<Card className="max-w-3xl overflow-hidden p-0">
					<div className="flex flex-col gap-5 border-b border-[#e7e7dc] bg-[linear-gradient(112deg,#f4f7ed_0%,#fffdf8_58%,#edf5ec_100%)] px-5 py-6 sm:flex-row sm:items-start sm:px-6">
						<span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 shadow-[0_8px_18px_rgba(23,75,49,0.1)]">
							<Building2 size={21} />
						</span>
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
								Identitas sekolah
							</p>
							<h2 className="mt-1 font-bold text-[#17251b]">Informasi yang tampil pada rapor</h2>
							<p className="mt-1 max-w-xl text-sm leading-6 text-[#637065]">
								Nama, alamat, nomor telepon, dan logo akan digunakan saat rapor diterbitkan.
							</p>
						</div>
						<Landmark
							className="hidden size-12 text-brand-100 sm:ml-auto sm:block"
							aria-hidden="true"
						/>
					</div>
					<div className="px-5 pb-6 sm:px-6">
						{error ? (
							<p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
								{error}
							</p>
						) : null}
						{notice ? (
							<p
								role="status"
								className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
							>
								{notice}
							</p>
						) : null}
						<SchoolProfileForm
							address={address}
							hasLogo={school.data?.has_logo}
							logoUrl={logoUrl}
							name={name}
							phone={phone}
							saving={saving}
							uploadingLogo={uploadingLogo}
							onAddressChange={setAddress}
							onLogoUpload={(file) => void uploadLogo(file)}
							onNameChange={setName}
							onPhoneChange={setPhone}
							onSubmit={() => void save()}
						/>
					</div>
				</Card>
			)}
		</>
	);
}
