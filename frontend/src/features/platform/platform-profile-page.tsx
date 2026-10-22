"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { PlatformPageHeader } from "./components/platform-page-header";
import type { PlatformSession } from "./types";

type PlatformProfile = { id: string; name: string; email: string; phone: string | null };

const inputClass =
	"w-full rounded-xl border border-[#dcc5b5] bg-[#fffdf9] px-3 py-2.5 text-sm text-[#3c2a20] outline-none transition placeholder:text-[#9d8679] focus:border-[#765646] focus:ring-2 focus:ring-[#f2daca]";

export function PlatformProfilePage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const profile = useQuery({
		queryKey: ["platform-profile"],
		queryFn: () => api<PlatformProfile>("/platform/profile"),
	});
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [mustChangePassword, setMustChangePassword] = useState(false);
	const [sensitiveFieldsUnlocked, setSensitiveFieldsUnlocked] = useState(false);

	useEffect(() => {
		const forcedPasswordChange =
			new URLSearchParams(window.location.search).get("gantiSandi") === "1";
		setMustChangePassword(forcedPasswordChange);
		setSensitiveFieldsUnlocked(forcedPasswordChange);
	}, []);

	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (saving) return;
		const form = event.currentTarget;
		const data = new FormData(form);
		const password = String(data.get("newPassword") || "");
		const confirmation = String(data.get("passwordConfirmation") || "");
		const currentPassword = String(data.get("currentPassword") || "");
		setMessage("");
		setError("");
		if (password && !currentPassword) {
			setError("Masukkan kata sandi saat ini untuk mengubah kata sandi.");
			return;
		}
		if (password && password !== confirmation) {
			setError("Konfirmasi kata sandi baru tidak sama.");
			return;
		}
		setSaving(true);
		try {
			await api("/platform/profile", {
				method: "PATCH",
				body: JSON.stringify({
					name: data.get("name"),
					phone: data.get("phone") || undefined,
					currentPassword: currentPassword || undefined,
					password: password || undefined,
					passwordConfirmation: confirmation || undefined,
				}),
			});
			await queryClient.fetchQuery({
				queryKey: ["platform-session"],
				queryFn: () => api<PlatformSession>("/platform/auth/session"),
				retry: false,
			});
			setMessage(
				password
					? "Kata sandi berhasil diganti. Anda dapat melanjutkan menggunakan RAMU."
					: "Profil Super Admin berhasil diperbarui.",
			);
			form.reset();
			await profile.refetch();
			if (mustChangePassword && password) router.replace("/platform");
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Profil tidak dapat diperbarui.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
			<PlatformPageHeader
				title="Profil Super Admin"
				description="Perbarui identitas dan kata sandi akun platform Anda. Perubahan ini tidak memberi akses ke data tenant."
			/>
			{mustChangePassword ? (
				<div
					role="alert"
					className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
				>
					<p className="font-semibold">Kata sandi sementara harus diganti</p>
					<p className="mt-1 leading-6">
						Anda sudah berhasil masuk. Gunakan kata sandi sementara saat ini pada kolom “Kata sandi
						saat ini”, lalu buat kata sandi baru untuk melanjutkan.
					</p>
				</div>
			) : null}
			<Card className="overflow-hidden border-[#dfcdbf] bg-[#fffaf6] p-0 shadow-none">
				<div className="flex items-start gap-3 border-b border-[#ead9cc] bg-[#f5e9df] px-5 py-5 sm:px-6">
					<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#765646] text-[#fff9f4]">
						<UserRound size={19} />
					</span>
					<div>
						<h2 className="font-bold text-[#4e3428]">Informasi akun</h2>
						<p className="mt-1 text-sm leading-6 text-[#745d51]">
							Kelola informasi yang digunakan untuk mengenali akun Super Admin.
						</p>
					</div>
				</div>
				<div className="px-5 py-6 sm:px-6">
					{error ? (
						<p
							role="alert"
							className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
						>
							{error}
						</p>
					) : null}
					{message ? (
						<p
							role="status"
							className="mb-4 rounded-xl border border-[#ddc5b4] bg-[#f8ece3] p-3 text-sm text-[#6b4534]"
						>
							{message}
						</p>
					) : null}
					<form
						key={profile.data?.id || "platform-profile"}
						autoComplete="off"
						onSubmit={save}
						className="space-y-5"
					>
						<section className="rounded-2xl border border-[#ead9cc] bg-[#fffdf9] p-5">
							<h3 className="text-sm font-semibold text-[#4e3428]">Identitas akun</h3>
							<p className="mt-1 text-sm text-[#745d51]">
								Informasi ini membantu mengenali pemilik akun platform.
							</p>
							<div className="mt-5 grid gap-5 md:grid-cols-2">
								<label className="block text-sm font-semibold text-[#543b2e]">
									Nama
									<input
										required
										name="name"
										defaultValue={profile.data?.name || ""}
										className={`${inputClass} mt-1`}
									/>
								</label>
								<label className="block text-sm font-semibold text-[#543b2e]">
									Nomor telepon
									<input
										name="phone"
										inputMode="tel"
										defaultValue={profile.data?.phone || ""}
										placeholder="08xxxxxxxxxx"
										className={`${inputClass} mt-1`}
									/>
								</label>
								<label className="block text-sm font-semibold text-[#543b2e] md:col-span-2">
									Email
									<span className="mt-1 block rounded-xl border border-[#ead9cc] bg-[#f8efe8] px-3 py-2.5 text-sm font-normal text-[#765f52]">
										{profile.data?.email || "Memuat..."}
									</span>
								</label>
							</div>
						</section>
						<section className="rounded-2xl border border-[#ead9cc] bg-[#fffdf9] p-5">
							<div className="flex items-start gap-3">
								<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f5e9df] text-[#765646]">
									<KeyRound size={17} />
								</span>
								<div>
									<h3 className="font-semibold text-[#4e3428]">Keamanan akun</h3>
									<p className="mt-1 text-sm leading-6 text-[#745d51]">
										Kosongkan kolom kata sandi jika tidak ingin mengubahnya.
									</p>
								</div>
							</div>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<label className="block text-sm font-semibold text-[#543b2e]">
									Kata sandi saat ini
									<input
										name="currentPassword"
										type="password"
										autoComplete="current-password"
										readOnly={!sensitiveFieldsUnlocked}
										onFocus={() => setSensitiveFieldsUnlocked(true)}
										className={`${inputClass} mt-1`}
									/>
								</label>
								<label className="block text-sm font-semibold text-[#543b2e]">
									Kata sandi baru
									<input
										name="newPassword"
										minLength={8}
										type="password"
										autoComplete="new-password"
										readOnly={!sensitiveFieldsUnlocked}
										onFocus={() => setSensitiveFieldsUnlocked(true)}
										className={`${inputClass} mt-1`}
									/>
								</label>
								<label className="block text-sm font-semibold text-[#543b2e] md:col-span-2">
									Ulangi kata sandi baru
									<input
										name="passwordConfirmation"
										minLength={8}
										type="password"
										autoComplete="new-password"
										readOnly={!sensitiveFieldsUnlocked}
										onFocus={() => setSensitiveFieldsUnlocked(true)}
										className={`${inputClass} mt-1`}
									/>
								</label>
							</div>
						</section>
						<div className="flex justify-end pt-1">
							<Button type="submit" className="bg-[#765646] hover:bg-[#68483a]" disabled={saving}>
								{saving ? "Menyimpan…" : "Simpan profil"}
							</Button>
						</div>
					</form>
				</div>
			</Card>
		</>
	);
}
