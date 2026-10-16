"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
export function RegisterForm() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");
		const data = new FormData(event.currentTarget);
		try {
			await api("/auth/register-school", {
				method: "POST",
				body: JSON.stringify({
					name: data.get("name"),
					schoolName: data.get("schoolName"),
					email: data.get("email"),
					password: data.get("password"),
				}),
			});
			router.push("/app/dashboard");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Pendaftaran gagal");
		} finally {
			setLoading(false);
		}
	}
	return (
		<AuthShell
			title="Daftarkan sekolah"
			description="Buat akun Admin Sekolah dan ruang kerja RAMU untuk sekolah Anda. Akun Guru dan Kepala Sekolah dikelola setelah masuk."
			footer={
				<>
					Sudah memiliki akun?{" "}
					<Link className="font-semibold text-brand-700" href="/login">
						Masuk
					</Link>
				</>
			}
		>
			<form onSubmit={submit} className="space-y-4">
				<label className="block text-sm font-semibold text-[#314137]">
					Nama Admin Sekolah
					<input
						required
						name="name"
						className="mt-1.5 w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
				</label>
				<label className="block text-sm font-semibold text-[#314137]">
					Nama sekolah
					<input
						required
						name="schoolName"
						className="mt-1.5 w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
				</label>
				<label className="block text-sm font-semibold text-[#314137]">
					Email
					<input
						required
						name="email"
						type="email"
						className="mt-1.5 w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
				</label>
				<label className="block text-sm font-semibold text-[#314137]">
					Kata sandi
					<input
						required
						name="password"
						minLength={8}
						type="password"
						className="mt-1.5 w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
					<span className="mt-1 block text-xs font-normal text-slate-500">Minimal 8 karakter.</span>
				</label>
				{error && (
					<p
						role="alert"
						className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
					>
						{error}
					</p>
				)}
				<Button className="w-full" disabled={loading}>
					{loading ? "Membuat ruang kerja…" : "Buat akun Admin Sekolah"}
				</Button>
			</form>
		</AuthShell>
	);
}
