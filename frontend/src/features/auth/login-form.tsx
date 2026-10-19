"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, GraduationCap, HeartHandshake, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { AuthShell } from "./auth-shell";
import { Button } from "@/components/ui/button";
import { authSessionQueryOptions } from "./session";

export function LoginForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

	async function loginAsDemoRole(role: DemoRole) {
		setLoading(true);
		setError("");
		try {
			await api("/auth/login", {
				method: "POST",
				body: JSON.stringify({ role }),
			});
			queryClient.clear();
			await queryClient.fetchQuery(authSessionQueryOptions);
			router.replace("/app/dashboard");
			router.refresh();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Tidak dapat masuk");
		} finally {
			setLoading(false);
		}
	}
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
			await queryClient.fetchQuery(authSessionQueryOptions);
			router.replace("/app/dashboard");
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Tidak dapat masuk");
		} finally {
			setLoading(false);
		}
	}
	if (demo)
		return (
			<AuthShell
				title="Selamat datang di demo RAMU"
				description="Pilih peran untuk mencoba alur kerja tanpa memasukkan email maupun kata sandi."
				footer="Mode demo hanya untuk mencoba alur dan tampilan aplikasi."
			>
				<DemoRoleLogin error={error} loading={loading} onSelect={loginAsDemoRole} />
			</AuthShell>
		);
	return (
		<AuthShell
			title="Selamat datang kembali"
			description="Masuk untuk melanjutkan ke ruang kerja sekolah."
			footer={
				<>
					Belum memiliki akun?{" "}
					<Link className="font-semibold text-brand-700" href="/register">
						Daftarkan sekolah
					</Link>
				</>
			}
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

type DemoRole = "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";

const demoRoles: {
	role: DemoRole;
	label: string;
	description: string;
	icon: typeof Building2;
}[] = [
	{
		role: "SCHOOL_ADMIN",
		label: "Admin Sekolah",
		description: "Kelola seluruh administrasi dan publikasi raport.",
		icon: Building2,
	},
	{
		role: "TEACHER",
		label: "Guru",
		description: "Lihat kelas penugasan dan isi raport murid.",
		icon: GraduationCap,
	},
	{
		role: "PRINCIPAL",
		label: "Kepala Sekolah",
		description: "Tinjau raport serta pengajuan akademik.",
		icon: ShieldCheck,
	},
];

function DemoRoleLogin({
	error,
	loading,
	onSelect,
}: {
	error: string;
	loading: boolean;
	onSelect: (role: DemoRole) => Promise<void>;
}) {
	return (
		<div>
			<div className="rounded-2xl border border-brand-100 bg-brand-50/65 p-4">
				<p className="text-sm font-bold text-brand-900">Pilih peran untuk mencoba demo</p>
				<p className="mt-1 text-sm leading-6 text-[#526156]">
					Tidak perlu memasukkan email maupun kata sandi.
				</p>
			</div>
			<div className="mt-4 space-y-3">
				{demoRoles.map(({ role, label, description, icon: Icon }) => (
					<button
						key={role}
						type="button"
						disabled={loading}
						onClick={() => void onSelect(role)}
						className="group flex w-full items-center gap-3 rounded-2xl border border-[#dfe5da] bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-wait disabled:opacity-60"
					>
						<span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-800 transition group-hover:bg-brand-700 group-hover:text-white">
							<Icon size={20} aria-hidden="true" />
						</span>
						<span>
							<span className="block text-sm font-bold text-[#17251b]">{label}</span>
							<span className="mt-0.5 block text-xs leading-5 text-[#637065]">{description}</span>
						</span>
					</button>
				))}
			</div>
			<div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#778478] before:h-px before:flex-1 before:bg-[#dfe5da] after:h-px after:flex-1 after:bg-[#dfe5da]">
				Akses laporan
			</div>
			<Link
				href="/r/demo-parent"
				className="group flex w-full items-center gap-3 rounded-2xl border border-[#dfe5da] bg-[#fffefa] p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus:ring-4 focus:ring-brand-100"
			>
				<span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f2e8d6] text-[#876231] transition group-hover:bg-brand-700 group-hover:text-white">
					<HeartHandshake size={20} aria-hidden="true" />
				</span>
				<span>
					<span className="block text-sm font-bold text-[#17251b]">Akses wali demo</span>
					<span className="mt-0.5 block text-xs leading-5 text-[#637065]">
						Lihat raport Alya sebagai wali · PIN 123456
					</span>
				</span>
			</Link>
			{error ? (
				<p
					role="alert"
					className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
				>
					{error}
				</p>
			) : null}
		</div>
	);
}
