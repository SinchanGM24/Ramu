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
		<div className="min-h-screen bg-[#eaf5ed] text-[#1d2921]">
			<div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col md:flex-row">
				<aside className="flex shrink-0 flex-col bg-[#765646] text-[#fff9f4] md:w-[228px]">
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
						<Button
							variant="ghost"
							className="px-2 text-[#f8e9df] hover:bg-white/10 hover:text-white md:hidden"
							onClick={logout}
							aria-label="Keluar dari platform"
						>
							<LogOut size={17} />
						</Button>
					</header>
					<nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4 md:pt-5">
						{navigation.map((item) => {
							const Icon = item.icon;
							const active = pathname === item.href;
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
						<p className="truncate text-xs text-[#f0dcd0]">{session.data?.email}</p>
						<Button
							variant="ghost"
							className="mt-2 px-0 text-[#f7e8de] hover:bg-transparent hover:text-white"
							onClick={logout}
						>
							<LogOut size={16} /> Keluar
						</Button>
					</div>
				</aside>
				<main className="m-2 min-w-0 flex-1 rounded-2xl border border-[#d7e7da] bg-[#f5fbf6]/90 px-4 py-7 sm:px-8 sm:py-9 md:ml-0">
					{children}
				</main>
			</div>
		</div>
	);
}
