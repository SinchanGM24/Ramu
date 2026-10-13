"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { useState } from "react";
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
		<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-100 bg-white px-4 py-5 lg:block">
			<Link href="/app/dashboard" className="mb-9 flex items-center gap-3 px-2">
				<span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
					<GraduationCap size={22} />
				</span>
				<span>
					<strong className="block text-lg tracking-tight text-slate-900">RAMU</strong>
					<small className="text-xs text-slate-500">Raport Murid</small>
				</span>
			</Link>
			<nav className="flex h-[calc(100%-4.5rem)] flex-col space-y-1" aria-label="Navigasi aplikasi">
				{navigation
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
				<NavigationGroup label="Akademik">
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
				<NavigationGroup label="Rapor">
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
				<NavigationGroup label="Pengaturan">
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
			<div className="absolute inset-x-4 bottom-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
				<p>TK Contoh Ceria</p>
				<strong className="block text-slate-700">
					{session.data?.role === "SCHOOL_ADMIN" ? "Admin Sekolah" : "Akun staf"}
				</strong>
				<button
					type="button"
					onClick={() => void logout()}
					disabled={loggingOut}
					className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-white hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
				>
					<LogOut size={15} />
					{loggingOut ? "Mengeluarkan akun…" : "Keluar akun"}
				</button>
				{logoutError && (
					<p role="alert" className="mt-2 leading-4 text-red-700">
						{logoutError}
					</p>
				)}
			</div>
		</aside>
	);
}

function NavigationGroup({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="mt-5">
			<p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
				{label}
			</p>
			<div className="space-y-1">{children}</div>
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
				"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
				active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
			)}
		>
			<Icon size={18} />
			{label}
		</Link>
	);
}
