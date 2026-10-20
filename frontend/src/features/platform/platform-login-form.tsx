"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { PlatformSession } from "./types";

export function PlatformLoginForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
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
			await queryClient.fetchQuery({
				queryKey: ["platform-session"],
				queryFn: () => api<PlatformSession>("/platform/auth/session"),
				retry: false,
			});
			router.replace("/platform");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Tidak dapat masuk ke platform.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#eaf5ed] p-5">
			<form
				onSubmit={submit}
				className="w-full max-w-md rounded-3xl border border-[#6b4b3b] bg-[#765646] p-7 shadow-[0_20px_45px_rgba(80,54,39,0.18)]"
			>
				<p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f2daca]">
					RAMU Platform
				</p>
				<h1 className="mt-3 text-3xl font-bold tracking-tight text-[#fff9f4]">
					Masuk sebagai Super Admin
				</h1>
				<p className="mt-2 text-sm leading-6 text-[#f0dcd0]">
					Ruang operasional tenant dan akun sekolah. Bukan ruang akses data sekolah.
				</p>
				<div className="mt-7 space-y-4">
					<label className="block text-sm font-semibold text-[#fff4ec]">
						Email
						<input
							required
							name="email"
							type="email"
							className="mt-1.5 w-full rounded-xl border border-[#a98978] bg-[#fff9f4] px-3 py-3 text-[#3c2a20] outline-none focus:border-[#d9bda9] focus:ring-2 focus:ring-[#f2daca]"
						/>
					</label>
					<label className="block text-sm font-semibold text-[#fff4ec]">
						Kata sandi
						<input
							required
							name="password"
							type="password"
							className="mt-1.5 w-full rounded-xl border border-[#a98978] bg-[#fff9f4] px-3 py-3 text-[#3c2a20] outline-none focus:border-[#d9bda9] focus:ring-2 focus:ring-[#f2daca]"
						/>
					</label>
					{error ? (
						<p role="alert" className="rounded-xl bg-red-950/60 p-3 text-sm text-red-200">
							{error}
						</p>
					) : null}
					<Button
						className="w-full bg-[#f2daca] text-[#5f4032] hover:bg-[#fff2e7]"
						disabled={loading}
					>
						{loading ? "Memproses…" : "Masuk ke platform"}
					</Button>
				</div>
			</form>
		</main>
	);
}
