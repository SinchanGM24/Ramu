"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function PlatformLoginForm() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");
		const form = new FormData(event.currentTarget);
		try {
			await api("/platform/auth/login", {
				method: "POST",
				body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
			});
			router.replace("/platform");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Tidak dapat masuk ke platform.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
			<form
				onSubmit={submit}
				className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl"
			>
				<p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-400">
					RAMU Platform
				</p>
				<h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
					Masuk sebagai Super Admin
				</h1>
				<p className="mt-2 text-sm leading-6 text-slate-400">
					Ruang operasional tenant dan akun sekolah. Bukan ruang akses data sekolah.
				</p>
				<div className="mt-7 space-y-4">
					<label className="block text-sm font-semibold text-slate-200">
						Email
						<input
							required
							name="email"
							type="email"
							className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-3 text-white outline-none focus:border-emerald-400"
						/>
					</label>
					<label className="block text-sm font-semibold text-slate-200">
						Kata sandi
						<input
							required
							name="password"
							type="password"
							className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-3 text-white outline-none focus:border-emerald-400"
						/>
					</label>
					{error ? (
						<p role="alert" className="rounded-xl bg-red-950/60 p-3 text-sm text-red-200">
							{error}
						</p>
					) : null}
					<Button
						className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
						disabled={loading}
					>
						{loading ? "Memproses…" : "Masuk ke platform"}
					</Button>
				</div>
			</form>
		</main>
	);
}
