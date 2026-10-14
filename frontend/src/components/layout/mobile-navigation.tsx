"use client";

import Link from "next/link";
import { LogOut, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "./active-account-card";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileTopbar } from "./mobile-topbar";
import { academicNavigation, settingsNavigation, type AppRole } from "./navigation";

export function MobileNavigation() {
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
	const session = useQuery(authSessionQueryOptions);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [logoutError, setLogoutError] = useState("");
	const role = session.data?.role as AppRole | undefined;
	const settingsItems = settingsNavigation.filter(
		(item) => item.href !== "/app/settings/profile" && item.roles.includes(role as AppRole),
	);

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
						className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t border-brand-950/10 bg-[#fffdf8] px-4 pb-3 pt-3 shadow-[0_-18px_45px_rgba(23,49,30,0.2)]"
					>
						<div className="mx-auto h-1.5 w-12 rounded-full bg-brand-200" />
						<div className="mt-3 flex items-center justify-between">
							<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
								Menu
							</p>
							<button
								type="button"
								aria-label="Tutup menu"
								onClick={closeMenu}
								className="grid size-8 place-items-center rounded-xl text-[#35443a] transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
							>
								<X size={18} />
							</button>
						</div>

						<MobileProfileSummary email={session.data?.email} role={role} onNavigate={closeMenu} />

						<nav className="space-y-3 py-3" aria-label="Navigasi aplikasi">
							<MobileNavigationSection
								title="Akademik"
								items={academicNavigation.filter((item) => item.roles.includes(role as AppRole))}
								onNavigate={closeMenu}
								pathname={pathname}
							/>
							<MobileNavigationSection
								title="Pengaturan"
								items={settingsItems}
								onNavigate={closeMenu}
								pathname={pathname}
							/>
						</nav>

						<button
							type="button"
							onClick={() => void logout()}
							disabled={isLoggingOut || !role}
							className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 px-3 py-2.5 text-xs font-bold text-brand-800 transition hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
						>
							<LogOut size={15} />
							{isLoggingOut ? "Sedang keluar akun…" : "Keluar akun"}
						</button>
						{logoutError ? (
							<p role="alert" className="mt-2 text-center text-[11px] leading-4 text-red-700">
								{logoutError}
							</p>
						) : null}
					</section>
				</div>
			) : null}
			<MobileBottomNav isMenuOpen={isOpen} onMenuToggle={() => setIsOpen((value) => !value)} />
		</>
	);
}

type MobileNavigationSectionProps = {
	title: string;
	items: {
		href: string;
		label: string;
		icon: (typeof academicNavigation)[number]["icon"];
	}[];
	pathname: string;
	onNavigate: () => void;
};

function MobileProfileSummary({
	email,
	role,
	onNavigate,
}: {
	email?: string;
	role?: AppRole;
	onNavigate: () => void;
}) {
	const initial = email?.trim().charAt(0).toUpperCase() || "R";

	return (
		<Link
			href="/app/settings/profile"
			onClick={onNavigate}
			className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-950/10 bg-[#f4f7f1] px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50"
		>
			<span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#2c704d] text-sm font-bold text-white shadow-sm">
				{initial}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-[11px] font-medium text-[#637065]">Profil akun</span>
				<span className="block truncate text-sm font-bold text-brand-950">
					{getRoleLabel(role)}
				</span>
				{email ? <span className="block truncate text-[11px] text-[#637065]">{email}</span> : null}
			</span>
			<UserRound className="size-4 shrink-0 text-brand-700" />
		</Link>
	);
}

function MobileNavigationSection({
	title,
	items,
	pathname,
	onNavigate,
}: MobileNavigationSectionProps) {
	if (!items.length) return null;

	return (
		<section>
			<p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#718072]">
				{title}
			</p>
			<div className="grid grid-cols-2 gap-2">
				{items.map(({ href, label, icon: Icon }) => {
					const active = pathname === href || pathname.startsWith(`${href}/`);
					const fillsRow = items.length % 2 === 1 && items.at(-1)?.href === href;

					return (
						<Link
							key={href}
							href={href}
							onClick={onNavigate}
							className={cn(
								"flex min-h-11 items-center gap-2 rounded-xl border border-brand-950/10 bg-white px-2.5 py-2 text-xs font-semibold leading-4 transition",
								fillsRow && "col-span-2",
								active
									? "border-brand-200 bg-brand-50 text-brand-800"
									: "text-[#35443a] hover:border-brand-200 hover:bg-[#f4f7f1]",
							)}
						>
							<Icon size={16} className="shrink-0" />
							{label}
						</Link>
					);
				})}
			</div>
		</section>
	);
}
