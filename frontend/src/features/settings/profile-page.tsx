"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Profile = { id: string; name: string; email: string; phone: string | null };
const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm";

export function ProfilePage() {
	const profile = useQuery({ queryKey: ["profile"], queryFn: () => api<Profile>("/auth/profile") });
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		setMessage("");
		setError("");
		try {
			await api("/auth/profile", {
				method: "PATCH",
				body: JSON.stringify({
					name: data.get("name"),
					phone: data.get("phone") || undefined,
					password: data.get("password") || undefined,
				}),
			});
			setMessage("Profil berhasil diperbarui.");
			event.currentTarget.reset();
			await profile.refetch();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Profil tidak dapat diperbarui.");
		}
	}

	return (
		<>
			<PageHeader
				eyebrow="Akun saya"
				title="Profil akun"
				description="Perbarui nama, nomor telepon, atau kata sandi akun yang sedang digunakan."
			/>
			<Card className="max-w-xl">
				{error && (
					<p
						role="alert"
						className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
					>
						{error}
					</p>
				)}
				{message && (
					<p
						role="status"
						className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700"
					>
						{message}
					</p>
				)}
				<form
					key={profile.data?.id || "profile"}
					autoComplete="off"
					onSubmit={save}
					className="space-y-4"
				>
					<label className="block text-sm font-semibold">
						Nama
						<input
							required
							name="name"
							autoComplete="off"
							defaultValue={profile.data?.name || ""}
							className={`${inputClass} mt-1`}
						/>
					</label>
					<label className="block text-sm font-semibold">
						Email
						<span className="mt-1 block rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-500">
							{profile.data?.email || "Memuat..."}
						</span>
					</label>
					<label className="block text-sm font-semibold">
						Nomor telepon
						<input
							name="phone"
							type="tel"
							autoComplete="off"
							defaultValue={profile.data?.phone || ""}
							placeholder="08xxxxxxxxxx"
							className={`${inputClass} mt-1`}
						/>
					</label>
					<label className="block text-sm font-semibold">
						Kata sandi baru
						<span className="mt-1 block text-xs font-normal text-slate-500">
							Kosongkan jika tidak ingin mengganti.
						</span>
						<input
							name="password"
							minLength={8}
							type="password"
							autoComplete="new-password"
							className={`${inputClass} mt-1`}
						/>
					</label>
					<div className="flex justify-end">
						<Button type="submit">Simpan profil</Button>
					</div>
				</form>
			</Card>
		</>
	);
}
