"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, School, UserRound, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { PlatformSession } from "./types";
import { PlatformAccountCard } from "./platform-account-card";

const navigation = [
	{ href: "/platform", label: "Ringkasan", icon: LayoutDashboard },
	{ href: "/platform/tenants", label: "Tenant", icon: School },
	{ href: "/platform/accounts", label: "Akun sekolah", icon: Users },
];

function isNavigationActive(pathname: string, href: string) {
	return href === "/platform"
		? pathname === href
		: pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [logoutError, setLogoutError] = useState("");
	const session = useQuery({
		queryKey: ["platform-session"],
		queryFn: () => api<PlatformSession>("/platform/auth/session"),
		enabled: pathname !== "/platform/login",
		retry: false,
	});
	useEffect(() => {
		if (pathname !== "/platform/login" && session.isError) {
			router.replace("/platform/login");
		}
	}, [pathname, router, session.isError]);

	if (pathname === "/platform/login") return <>{children}</>;
	if (session.isError) return null;

	async function logout() {
		setIsLoggingOut(true);
		setLogoutError("");
		try {
			await api("/platform/auth/logout", { method: "POST" });
			queryClient.clear();
			router.replace("/platform/login");
		} catch {
			setLogoutError("Tidak dapat keluar akun. Coba lagi.");
		} finally {
			setIsLoggingOut(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#eaf5ed] text-[#1d2921]">
			<header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#68483a]/15 bg-[#765646] px-4 text-[#fff9f4] md:hidden">
				<Link href="/platform" className="flex items-center gap-2 font-bold tracking-[-0.025em]">
					<span className="grid size-9 place-items-center rounded-xl bg-[#f2daca] text-sm text-[#68483a]">
						R
					</span>
					RAMU Platform
				</Link>
				<Link
					href="/platform/profile"
					aria-label="Buka profil akun"
					className="flex max-w-40 items-center gap-1.5 truncate text-xs text-[#f0dcd0]"
				>
					<UserRound size={15} className="shrink-0" />
					<span className="truncate">{session.data?.email}</span>
				</Link>
			</header>
			<div className="mx-auto flex min-h-screen w-full max-w-[1440px] md:flex-row">
				<aside className="hidden shrink-0 flex-col bg-[#765646] text-[#fff9f4] md:flex md:w-[228px]">
					<header className="flex h-14 items-center justify-between px-4 md:px-5">
						<Link
							href="/platform"
							className="flex items-center gap-2.5 font-bold tracking-[-0.025em]"
						>
							<span className="grid size-7 place-items-center rounded-full bg-[#f2daca] text-xs text-[#68483a]">
								R
							</span>
							<span>RAMU Platform</span>
						</Link>
					</header>
					<nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4 md:pt-5">
						{navigation.map((item) => {
							const Icon = item.icon;
							const active = isNavigationActive(pathname, item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-[#fff8f1] text-[#68483a]" : "text-[#f7e8de] hover:bg-white/10 hover:text-white"}`}
								>
									<Icon size={17} /> {item.label}
								</Link>
							);
						})}
					</nav>
					<div className="mt-auto hidden px-5 pb-5 md:block">
						<PlatformAccountCard
							email={session.data?.email}
							isLoggingOut={isLoggingOut}
							logoutError={logoutError}
							onLogout={() => void logout()}
						/>
					</div>
				</aside>
				<main className="min-w-0 flex-1 bg-[#eff8f1]/80 px-4 py-6 pb-24 sm:px-7 md:m-2 md:ml-0 md:rounded-2xl md:border md:border-[#d7e7da] md:px-8 md:py-9 md:pb-9">
					{children}
				</main>
			</div>
			<nav
				aria-label="Navigasi platform"
				className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#68483a]/15 bg-[#fff9f4]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(104,72,58,0.08)] backdrop-blur md:hidden"
			>
				{navigation.map((item) => {
					const Icon = item.icon;
					const active = isNavigationActive(pathname, item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-[#765646]" : "text-[#88756b]"}`}
						>
							<Icon size={20} strokeWidth={active ? 2.5 : 2} />
							{item.label}
						</Link>
					);
				})}
				<button
					type="button"
					onClick={() => void logout()}
					disabled={isLoggingOut}
					className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#88756b]"
				>
					<LogOut size={20} />
					Keluar
				</button>
			</nav>
		</div>
	);
}
