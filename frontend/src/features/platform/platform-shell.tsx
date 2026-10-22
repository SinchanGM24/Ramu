"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, School, Users } from "lucide-react";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { PlatformSession } from "./types";
import { PlatformAccountCard } from "./platform-account-card";
import { PlatformMobileNavigation } from "./components/platform-mobile-navigation";

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
			return;
		}
		if (
			pathname !== "/platform/login" &&
			session.data?.mustChangePassword &&
			pathname !== "/platform/profile"
		) {
			router.replace("/platform/profile?gantiSandi=1");
		}
	}, [pathname, router, session.data?.mustChangePassword, session.isError]);

	if (pathname === "/platform/login") return <>{children}</>;
	if (session.isError) return null;

	async function logout() {
		setIsLoggingOut(true);
		setLogoutError("");
		try {
			await api("/platform/auth/logout", { method: "POST" });
			queryClient.clear();
			router.replace("/platform/login");
		} catch (cause) {
			if (cause instanceof ApiError && cause.status === 401) {
				queryClient.clear();
				router.replace("/platform/login");
				return;
			}
			setLogoutError("Tidak dapat keluar akun. Coba lagi.");
		} finally {
			setIsLoggingOut(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#eaf5ed] text-[#1d2921]">
			<PlatformMobileNavigation
				pathname={pathname}
				email={session.data?.email}
				navigation={navigation}
				isLoggingOut={isLoggingOut}
				logoutError={logoutError}
				onLogout={() => void logout()}
			/>
			<div className="flex min-h-screen w-full lg:flex-row">
				<aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-hidden bg-[#765646] px-4 py-4 text-[#fff9f4] shadow-[12px_0_36px_rgba(80,54,39,0.12)] lg:flex">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full border border-white/10"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -bottom-5 -left-8 size-52 rounded-full border border-white/10"
					/>
					<header className="relative flex h-11 items-center px-2">
						<Link
							href="/platform"
							className="flex items-center gap-2.5 font-bold tracking-[-0.025em]"
						>
							<span className="grid size-11 place-items-center rounded-2xl bg-[#fff9f4] text-sm text-[#68483a] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
								R
							</span>
							<span>
								<strong className="block text-lg text-white">RAMU</strong>
								<small className="text-xs text-[#f0dcd0]">Platform</small>
							</span>
						</Link>
					</header>
					<nav className="relative mt-5 flex flex-col gap-1 px-1" aria-label="Navigasi platform">
						{navigation.map((item) => {
							const Icon = item.icon;
							const active = isNavigationActive(pathname, item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`inline-flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${active ? "bg-[#fff9f4] text-[#68483a] shadow-[0_8px_20px_rgba(0,0,0,0.13)]" : "text-[#f7e8de] hover:bg-white/10 hover:text-white"}`}
								>
									<Icon size={17} /> {item.label}
								</Link>
							);
						})}
					</nav>
					<div className="relative mt-auto px-1">
						<PlatformAccountCard
							email={session.data?.email}
							isLoggingOut={isLoggingOut}
							logoutError={logoutError}
							onLogout={() => void logout()}
						/>
					</div>
				</aside>
				<main className="min-w-0 flex-1 bg-[#eff8f1] px-4 py-6 pb-24 sm:px-7 lg:ml-72 lg:px-10 lg:py-10 lg:pb-10">
					{children}
				</main>
			</div>
		</div>
	);
}
