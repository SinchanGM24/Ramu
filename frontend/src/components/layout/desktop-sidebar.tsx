"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, GraduationCap, LogOut, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { cn } from "@/lib/utils";
import {
	academicNavigation,
	navigation,
	reportNavigation,
	settingsNavigation,
	type AppRole,
} from "./navigation";

export function DesktopSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [loggingOut, setLoggingOut] = useState(false);
	const [logoutError, setLogoutError] = useState("");
	const session = useQuery(authSessionQueryOptions);

	async function logout() {
		setLoggingOut(true);
		setLogoutError("");
		try {
			await api("/auth/logout", { method: "POST" });
			queryClient.clear();
			router.replace("/login");
			router.refresh();
		} catch {
			setLogoutError("Tidak dapat keluar akun. Coba lagi.");
		} finally {
			setLoggingOut(false);
		}
	}

	return (
		<aside className="ramu-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-hidden bg-[#2c704d] px-4 py-5 text-brand-50 shadow-[12px_0_36px_rgba(44,112,77,0.12)] lg:flex">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full border border-brand-100/25"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-5 -left-8 size-52 rounded-full border border-brand-100/20"
			/>
			<Link href="/app/dashboard" className="relative mb-8 flex shrink-0 items-center gap-3 px-2">
				<span className="grid size-11 place-items-center rounded-2xl bg-[#fffdf8] text-brand-800 shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
					<GraduationCap size={23} />
				</span>
				<span>
					<strong className="block text-lg tracking-[-0.03em] text-white">RAMU</strong>
					<small className="text-xs text-brand-100/75">Raport Murid</small>
				</span>
			</Link>
			<div className="relative mb-5 rounded-2xl border border-white/20 bg-white/[0.10] px-3 py-3">
				<div className="flex items-center gap-2 text-xs font-semibold text-white/80">
					<Sparkles size={14} />
					Ruang kerja sekolah
				</div>
				<p className="mt-1 truncate text-sm font-semibold text-white">TK Contoh Ceria</p>
			</div>
			<nav
				className="relative min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
				aria-label="Navigasi aplikasi"
			>
				{navigation
					.filter((item) => item.roles.includes(session.data?.role as AppRole))
					.map(({ href, label, icon: Icon }) => (
						<NavigationLink
							key={href}
							href={href}
							label={label}
							Icon={Icon}
							active={isPrimaryNavigationActive(pathname, href)}
						/>
					))}
				<NavigationGroup
					label="Akademik"
					active={academicNavigation.some((item) => pathname.startsWith(item.href))}
				>
					{academicNavigation
						.filter((item) => item.roles.includes(session.data?.role as AppRole))
						.map(({ href, label, icon: Icon }) => (
							<NavigationLink
								key={href}
								href={href}
								label={label}
								Icon={Icon}
								active={pathname.startsWith(href)}
							/>
						))}
				</NavigationGroup>
				<NavigationGroup
					label="Rapor"
					active={reportNavigation.some((item) => pathname.startsWith(item.href))}
				>
					{reportNavigation
						.filter((item) => item.roles.includes(session.data?.role as AppRole))
						.map(({ href, label, icon: Icon }) => (
							<NavigationLink
								key={href}
								href={href}
								label={label}
								Icon={Icon}
								active={pathname.startsWith(href)}
							/>
						))}
				</NavigationGroup>
				<NavigationGroup
					label="Pengaturan"
					active={settingsNavigation.some((item) => pathname.startsWith(item.href))}
				>
					{settingsNavigation
						.filter((item) => item.roles.includes(session.data?.role as AppRole))
						.map(({ href, label, icon: Icon }) => (
							<NavigationLink
								key={href}
								href={href}
								label={label}
								Icon={Icon}
								active={pathname.startsWith(href)}
							/>
						))}
				</NavigationGroup>
			</nav>
			<div className="relative mt-4 shrink-0 rounded-2xl border border-white/20 bg-white/[0.08] p-3 text-xs leading-5 text-white/85">
				<p className="text-white/70">Akun aktif</p>
				<strong className="block text-white">
					{session.data?.role === "SCHOOL_ADMIN" ? "Admin Sekolah" : "Akun staf"}
				</strong>
				<button
					type="button"
					onClick={() => void logout()}
					disabled={loggingOut}
					className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-semibold text-white/85 transition hover:bg-white/15 hover:text-white disabled:cursor-wait disabled:opacity-60"
				>
					<LogOut size={15} />
					{loggingOut ? "Mengeluarkan akun…" : "Keluar akun"}
				</button>
				{logoutError && (
					<p role="alert" className="mt-2 leading-4 text-red-200">
						{logoutError}
					</p>
				)}
			</div>
		</aside>
	);
}

function isPrimaryNavigationActive(pathname: string, href: string) {
	return pathname === href;
}

function NavigationGroup({
	label,
	active,
	children,
}: {
	label: string;
	active: boolean;
	children: ReactNode;
}) {
	const [isOpen, setIsOpen] = useState(active);

	useEffect(() => {
		if (active) setIsOpen(true);
	}, [active]);

	return (
		<div className="mt-5">
			<button
				type="button"
				onClick={() => setIsOpen((value) => !value)}
				aria-expanded={isOpen}
				className={cn(
					"flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.14em] transition",
					active
						? "text-white hover:bg-white/15"
						: "text-white/70 hover:bg-white/10 hover:text-white",
				)}
			>
				{label}
				<ChevronDown
					aria-hidden="true"
					className={cn("size-4 transition-transform", isOpen && "rotate-180")}
				/>
			</button>
			{isOpen ? <div className="mt-1 space-y-1">{children}</div> : null}
		</div>
	);
}
function NavigationLink({
	href,
	label,
	Icon,
	active,
}: {
	href: string;
	label: string;
	Icon: typeof GraduationCap;
	active: boolean;
}) {
	return (
		<Link
			href={href}
			className={cn(
				"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
				active
					? "bg-[#fffdf8] text-brand-900 shadow-[0_8px_20px_rgba(0,0,0,0.13)]"
					: "text-white/85 hover:bg-white/10 hover:text-white",
			)}
		>
			<Icon size={18} />
			{label}
		</Link>
	);
}
