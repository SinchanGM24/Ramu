"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Profile = { id: string; name: string; email: string; phone: string | null };
const inputClass =
	"w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] px-3 py-2.5 text-sm text-[#17251b] outline-none transition placeholder:text-[#8b948b] focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function ProfilePage() {
	const profile = useQuery({ queryKey: ["profile"], queryFn: () => api<Profile>("/auth/profile") });
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const password = String(data.get("password") || "");
		const passwordConfirmation = String(data.get("passwordConfirmation") || "");
		const currentPassword = String(data.get("currentPassword") || "");
		setMessage("");
		setError("");
		if (password && !currentPassword) {
			setError("Masukkan kata sandi saat ini untuk mengubah kata sandi.");
			return;
		}
		if (password && password !== passwordConfirmation) {
			setError("Konfirmasi kata sandi baru tidak sama.");
			return;
		}
		try {
			await api("/auth/profile", {
				method: "PATCH",
				body: JSON.stringify({
					name: data.get("name"),
					phone: data.get("phone") || undefined,
					currentPassword: currentPassword || undefined,
					password: password || undefined,
					passwordConfirmation: passwordConfirmation || undefined,
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
			<Card className="max-w-2xl overflow-hidden p-0">
				<div className="flex items-start gap-3 border-b border-[#e7e7dc] bg-[linear-gradient(112deg,#f4f7ed_0%,#fffdf8_62%,#edf5ec_100%)] px-5 py-5 sm:px-6">
					<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
						<UserRound size={19} />
					</span>
					<div>
						<h2 className="font-bold text-[#17251b]">Informasi akun</h2>
						<p className="mt-1 text-sm leading-6 text-[#637065]">
							Perbarui informasi yang digunakan untuk mengenali akun Anda.
						</p>
					</div>
				</div>
				<div className="px-5 py-6 sm:px-6">
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
						className="space-y-5"
					>
						<label className="block text-sm font-semibold text-[#35443a]">
							Nama
							<input
								required
								name="name"
								autoComplete="off"
								defaultValue={profile.data?.name || ""}
								className={`${inputClass} mt-1`}
							/>
						</label>
						<label className="block text-sm font-semibold text-[#35443a]">
							Email
							<span className="mt-1 block rounded-xl border border-[#e4e7de] bg-[#f5f7f1] px-3 py-2.5 text-sm font-normal text-[#68746a]">
								{profile.data?.email || "Memuat..."}
							</span>
						</label>
						<label className="block text-sm font-semibold text-[#35443a]">
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
						<div className="border-t border-[#e7e9df] pt-5">
							<div className="flex items-start gap-3">
								<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0f4ed] text-brand-700">
									<KeyRound size={17} />
								</span>
								<div>
									<h3 className="font-semibold text-[#17251b]">Keamanan akun</h3>
									<p className="mt-1 text-sm leading-6 text-[#68746a]">
										Kosongkan seluruh kolom kata sandi jika tidak ingin mengubahnya.
									</p>
								</div>
							</div>
							<label className="mt-4 block text-sm font-semibold text-[#35443a]">
								Kata sandi saat ini
								<input
									name="currentPassword"
									type="password"
									autoComplete="current-password"
									className={`${inputClass} mt-1`}
								/>
							</label>
							<label className="mt-4 block text-sm font-semibold text-[#35443a]">
								Kata sandi baru
								<input
									name="password"
									minLength={8}
									type="password"
									autoComplete="new-password"
									className={`${inputClass} mt-1`}
								/>
							</label>
							<label className="mt-4 block text-sm font-semibold text-[#35443a]">
								Ulangi kata sandi baru
								<input
									name="passwordConfirmation"
									minLength={8}
									type="password"
									autoComplete="new-password"
									className={`${inputClass} mt-1`}
								/>
							</label>
						</div>
						<div className="flex justify-end border-t border-[#e7e9df] pt-5">
							<Button type="submit">Simpan profil</Button>
						</div>
					</form>
				</div>
			</Card>
		</>
	);
}
