import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import type { AppRole } from "./navigation";

const roleLabels: Record<AppRole, string> = {
	SCHOOL_ADMIN: "Admin Sekolah",
	TEACHER: "Guru",
	PRINCIPAL: "Kepala Sekolah",
};

type ActiveAccountCardProps = {
	email?: string;
	role?: AppRole;
	isLoggingOut: boolean;
	logoutError: string;
	onLogout: () => void;
};

export function ActiveAccountCard({
	email,
	role,
	isLoggingOut,
	logoutError,
	onLogout,
}: ActiveAccountCardProps) {
	const label = role ? roleLabels[role] : "Memuat akun";
	const initial = email?.trim().charAt(0).toUpperCase() || "R";

	return (
		<section className="relative overflow-hidden rounded-[1.35rem] border border-white/20 bg-white/[0.1] p-3.5 text-white shadow-[0_12px_28px_rgba(15,61,37,0.16)]">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-5 -top-6 size-20 rounded-full border-[10px] border-white/10"
			/>
			<div className="relative flex items-center gap-3">
				<span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/25 bg-[#fffdf8] text-sm font-bold text-brand-800 shadow-sm">
					{initial}
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-[11px] font-medium text-white/65">Akun aktif</p>
					<p className="truncate text-sm font-bold tracking-[-0.015em] text-white">{label}</p>
					{email ? <p className="truncate text-[11px] text-white/70">{email}</p> : null}
				</div>
				<Link
					href="/app/settings/profile"
					aria-label="Buka profil akun"
					className="grid size-8 shrink-0 place-items-center rounded-xl text-white/75 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
				>
					<UserRound size={16} />
				</Link>
			</div>
			<div className="relative my-3 h-px bg-white/15" />
			<button
				type="button"
				onClick={onLogout}
				disabled={isLoggingOut || !role}
				className="relative flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-bold text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-wait disabled:opacity-60"
			>
				<span>{isLoggingOut ? "Sedang keluar akun…" : "Keluar akun"}</span>
				<LogOut size={15} aria-hidden="true" />
			</button>
			{logoutError ? (
				<p
					role="alert"
					className="relative mt-2 rounded-lg bg-red-500/15 px-2.5 py-2 text-[11px] leading-4 text-red-100"
				>
					{logoutError}
				</p>
			) : null}
		</section>
	);
}
