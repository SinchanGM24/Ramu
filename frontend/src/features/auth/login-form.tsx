"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
import { authSessionQueryOptions } from "./session";

export function LoginForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");
		const data = new FormData(event.currentTarget);
		try {
			await api("/auth/login", {
				method: "POST",
				body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
			});
			queryClient.clear();
			const session = await queryClient.fetchQuery(authSessionQueryOptions);
			router.replace(
				session.mustChangePassword ? "/app/settings/profile?gantiSandi=1" : "/app/dashboard",
			);
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Tidak dapat masuk");
		} finally {
			setLoading(false);
		}
	}
	return (
		<AuthShell
			title="Selamat datang kembali"
			description="Masuk untuk melanjutkan ke ruang kerja sekolah."
			footer="Akun sekolah dibuat oleh pengelola RAMU."
		>
			<form onSubmit={submit} className="space-y-5">
				<label className="block text-sm font-semibold text-[#314137]">
					Email
					<input
						required
						name="email"
						type="email"
						placeholder="nama@sekolah.id"
						className="mt-2 w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
				</label>
				<label className="block text-sm font-semibold text-[#314137]">
					Kata sandi
					<input
						required
						name="password"
						type="password"
						className="mt-2 w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
					/>
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
					{loading ? "Memproses…" : "Masuk"}
				</Button>
			</form>
		</AuthShell>
	);
}
