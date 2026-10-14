"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, GraduationCap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { cn } from "@/lib/utils";
import { ActiveAccountCard } from "./active-account-card";
import { academicNavigation, navigation, settingsNavigation, type AppRole } from "./navigation";

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
		<aside className="ramu-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-hidden bg-[#2c704d] px-4 py-4 text-brand-50 shadow-[12px_0_36px_rgba(44,112,77,0.12)] lg:flex">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full border border-brand-100/25"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-5 -left-8 size-52 rounded-full border border-brand-100/20"
			/>
			<Link href="/app/dashboard" className="relative mb-5 flex shrink-0 items-center gap-3 px-2">
				<span className="grid size-11 place-items-center rounded-2xl bg-[#fffdf8] text-brand-800 shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
					<GraduationCap size={23} />
				</span>
				<span>
					<strong className="block text-lg tracking-[-0.03em] text-white">RAMU</strong>
					<small className="text-xs text-brand-100/75">Raport Murid</small>
				</span>
			</Link>
			<nav className="relative shrink-0 pr-1" aria-label="Navigasi aplikasi">
				<div className="space-y-0.5">
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
					<NavigationLink
						href={
							session.data?.role === "PRINCIPAL" ? "/app/reports/review" : "/app/reports/progress"
						}
						label="Rapor"
						Icon={ClipboardList}
						active={pathname.startsWith("/app/reports")}
					/>
				</div>
				<NavigationSection label="Akademik">
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
				</NavigationSection>
				<NavigationSection label="Pengaturan">
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
				</NavigationSection>
			</nav>
			<div className="relative mt-4 shrink-0">
				<ActiveAccountCard
					email={session.data?.email}
					role={session.data?.role}
					isLoggingOut={loggingOut}
					logoutError={logoutError}
					onLogout={() => void logout()}
				/>
			</div>
		</aside>
	);
}

function isPrimaryNavigationActive(pathname: string, href: string) {
	return pathname === href;
}

function NavigationSection({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="mt-4">
			<p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
				{label}
			</p>
			<div className="space-y-0.5">{children}</div>
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
				"flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
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
