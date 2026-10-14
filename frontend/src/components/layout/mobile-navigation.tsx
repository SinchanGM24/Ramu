"use client";

import Link from "next/link";
import { ClipboardList, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ActiveAccountCard } from "./active-account-card";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileTopbar } from "./mobile-topbar";
import { academicNavigation, navigation, settingsNavigation, type AppRole } from "./navigation";

export function MobileNavigation() {
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
	const session = useQuery(authSessionQueryOptions);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [logoutError, setLogoutError] = useState("");
	const role = session.data?.role as AppRole | undefined;
	const reportHref = role === "PRINCIPAL" ? "/app/reports/review" : "/app/reports/progress";

	useEffect(() => {
		if (!isOpen) return;

		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", closeOnEscape);

		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [isOpen]);

	async function logout() {
		setIsLoggingOut(true);
		setLogoutError("");
		try {
			await api("/auth/logout", { method: "POST" });
			queryClient.clear();
			setIsOpen(false);
			router.replace("/login");
			router.refresh();
		} catch {
			setLogoutError("Tidak dapat keluar akun. Coba lagi.");
		} finally {
			setIsLoggingOut(false);
		}
	}

	function closeMenu() {
		setIsOpen(false);
	}

	return (
		<>
			<MobileTopbar />
			{isOpen ? (
				<div className="fixed inset-x-0 bottom-16 top-0 z-30 lg:hidden">
					<button
						type="button"
						aria-label="Tutup menu"
						onClick={closeMenu}
						className="absolute inset-0 bg-[#17251b]/30 backdrop-blur-[1px]"
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-label="Menu aplikasi"
						className="absolute inset-x-0 bottom-0 flex max-h-[min(42rem,calc(100dvh-5rem))] flex-col rounded-t-[2rem] border-t border-brand-950/10 bg-[#fffdf8] px-4 pb-4 pt-3 shadow-[0_-18px_45px_rgba(23,49,30,0.2)]"
					>
						<div className="mx-auto h-1.5 w-12 rounded-full bg-brand-200" />
						<div className="mt-4 flex items-center justify-between border-b border-brand-950/10 pb-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
									Navigasi
								</p>
								<p className="mt-0.5 text-lg font-bold tracking-[-0.03em] text-brand-950">
									Menu RAMU
								</p>
							</div>
							<button
								type="button"
								aria-label="Tutup menu"
								onClick={closeMenu}
								className="grid size-9 place-items-center rounded-xl text-[#35443a] transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
							>
								<X size={20} />
							</button>
						</div>

						<nav className="min-h-0 flex-1 overflow-y-auto py-4" aria-label="Navigasi aplikasi">
							<MobileNavigationSection
								items={navigation.filter((item) => item.roles.includes(role as AppRole))}
								onNavigate={closeMenu}
								pathname={pathname}
							/>
							<MobileNavigationSection
								title="Rapor"
								items={
									role
										? [
												{
													href: reportHref,
													label: "Rapor",
													icon: ClipboardList,
												},
											]
										: []
								}
								onNavigate={closeMenu}
								pathname={pathname}
							/>
							<MobileNavigationSection
								title="Akademik"
								items={academicNavigation.filter((item) => item.roles.includes(role as AppRole))}
								onNavigate={closeMenu}
								pathname={pathname}
							/>
							<MobileNavigationSection
								title="Pengaturan"
								items={settingsNavigation.filter((item) => item.roles.includes(role as AppRole))}
								onNavigate={closeMenu}
								pathname={pathname}
							/>
						</nav>

						<div className="rounded-[1.55rem] bg-[#2c704d] p-2">
							<ActiveAccountCard
								email={session.data?.email}
								role={role}
								isLoggingOut={isLoggingOut}
								logoutError={logoutError}
								onLogout={() => void logout()}
							/>
						</div>
					</section>
				</div>
			) : null}
			<MobileBottomNav isMenuOpen={isOpen} onMenuToggle={() => setIsOpen((value) => !value)} />
		</>
	);
}

type MobileNavigationSectionProps = {
	title?: string;
	items: {
		href: string;
		label: string;
		icon: (typeof navigation)[number]["icon"];
	}[];
	pathname: string;
	onNavigate: () => void;
};

function MobileNavigationSection({
	title,
	items,
	pathname,
	onNavigate,
}: MobileNavigationSectionProps) {
	if (!items.length) return null;

	return (
		<section className={cn(title && "mt-5")}>
			{title ? (
				<p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#718072]">
					{title}
				</p>
			) : null}
			<div className="space-y-1">
				{items.map(({ href, label, icon: Icon }) => {
					const active = pathname === href || pathname.startsWith(`${href}/`);

					return (
						<Link
							key={href}
							href={href}
							onClick={onNavigate}
							className={cn(
								"flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
								active ? "bg-brand-50 text-brand-800" : "text-[#35443a] hover:bg-[#f4f7f1]",
							)}
						>
							<Icon size={18} />
							{label}
						</Link>
					);
				})}
			</div>
		</section>
	);
}
