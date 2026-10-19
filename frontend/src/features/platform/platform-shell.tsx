"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, School, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { PlatformSession } from "./types";

const navigation = [
	{ href: "/platform", label: "Ringkasan", icon: LayoutDashboard },
	{ href: "/platform/tenants", label: "Tenant", icon: School },
	{ href: "/platform/accounts", label: "Akun sekolah", icon: Users },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
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
		await api("/platform/auth/logout", { method: "POST" });
		queryClient.clear();
		router.replace("/platform/login");
	}

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<header className="border-b border-white/10 bg-slate-950/95 px-4 py-4 sm:px-8">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
					<Link href="/platform" className="text-lg font-bold tracking-tight text-white">
						RAMU <span className="text-emerald-400">Platform</span>
					</Link>
					<div className="flex items-center gap-3 text-sm text-slate-300">
						<span className="hidden sm:inline">{session.data?.email}</span>
						<Button
							variant="ghost"
							className="text-slate-200 hover:bg-white/10 hover:text-white"
							onClick={logout}
						>
							<LogOut size={16} /> Keluar
						</Button>
					</div>
				</div>
			</header>
			<div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row">
				<nav className="flex gap-1 overflow-x-auto border-b border-white/10 p-3 md:min-h-[calc(100vh-73px)] md:w-56 md:flex-col md:border-b-0 md:border-r">
					{navigation.map((item) => {
						const Icon = item.icon;
						const active = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
							>
								<Icon size={17} /> {item.label}
							</Link>
						);
					})}
				</nav>
				<main className="min-w-0 flex-1 bg-[#f8f5ed] px-4 py-7 text-slate-900 sm:px-8 sm:py-10">
					{children}
				</main>
			</div>
		</div>
	);
}
