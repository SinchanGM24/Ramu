"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
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
					{error ? (
						<p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
							{error}
						</p>
					) : null}
					{notice ? (
						<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
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
				</Card>
			)}
		</>
	);
}
