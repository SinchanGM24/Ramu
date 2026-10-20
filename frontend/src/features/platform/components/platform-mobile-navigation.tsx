"use client";

import Link from "next/link";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NavigationItem = {
	href: string;
	label: string;
	icon: typeof Menu;
};

export function PlatformMobileNavigation({
	pathname,
	email,
	navigation,
	isLoggingOut,
	logoutError,
	onLogout,
}: {
	pathname: string;
	email?: string;
	navigation: NavigationItem[];
	isLoggingOut: boolean;
	logoutError: string;
	onLogout: () => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen]);

	return (
		<>
			<header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#68483a]/15 bg-[#765646] px-4 text-[#fff9f4] lg:hidden">
				<Link href="/platform" className="flex items-center gap-2 font-bold tracking-[-0.025em]">
					<span className="grid size-9 place-items-center rounded-xl bg-[#f2daca] text-sm text-[#68483a]">
						R
					</span>
					RAMU Platform
				</Link>
				<Link
					href="/platform/profile"
					aria-label="Buka profil akun"
					className="grid size-10 place-items-center rounded-xl text-[#f0dcd0] transition hover:bg-white/10 hover:text-white"
				>
					<UserRound size={19} />
				</Link>
			</header>
			{isOpen ? (
				<div className="fixed inset-x-0 bottom-16 top-0 z-30 lg:hidden">
					<button
						type="button"
						aria-label="Tutup menu"
						onClick={() => setIsOpen(false)}
						className="absolute inset-0 bg-[#26382b]/30"
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-label="Menu platform"
						className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t border-[#68483a]/15 bg-[#fffaf6] px-4 pb-3 pt-3 shadow-[0_-18px_45px_rgba(80,54,39,0.2)]"
					>
						<div className="mx-auto h-1.5 w-12 rounded-full bg-[#dfcdbf]" />
						<div className="mt-3 flex items-center justify-between">
							<p className="text-xs font-semibold text-[#765646]">Akun platform</p>
							<button
								type="button"
								aria-label="Tutup menu"
								onClick={() => setIsOpen(false)}
								className="grid size-10 place-items-center rounded-xl text-[#765646] hover:bg-[#f5e9df]"
							>
								<X size={18} />
							</button>
						</div>
						<Link
							href="/platform/profile"
							onClick={() => setIsOpen(false)}
							className="mt-3 flex items-center gap-3 rounded-2xl border border-[#dfcdbf] bg-[#f8ece3] px-3 py-3"
						>
							<span className="grid size-10 place-items-center rounded-xl bg-[#765646] text-sm font-bold text-white">
								{email?.trim().charAt(0).toUpperCase() || "R"}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block text-xs text-[#765f52]">Super Admin</span>
								<span className="block truncate text-sm font-semibold text-[#4e3428]">{email}</span>
							</span>
							<UserRound size={16} className="text-[#765646]" />
						</Link>
						<button
							type="button"
							onClick={onLogout}
							disabled={isLoggingOut}
							className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#dfcdbf] text-sm font-semibold text-[#68483a] hover:bg-[#f5e9df] disabled:cursor-wait disabled:opacity-60"
						>
							<LogOut size={16} />
							{isLoggingOut ? "Sedang keluar akun…" : "Keluar akun"}
						</button>
						{logoutError ? (
							<p role="alert" className="mt-2 text-center text-xs text-red-700">
								{logoutError}
							</p>
						) : null}
					</section>
				</div>
			) : null}
			<nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#68483a]/15 bg-[#fffaf6] pb-[env(safe-area-inset-bottom)] lg:hidden">
				{navigation.map((item) => {
					const Icon = item.icon;
					const active =
						item.href === "/platform" ? pathname === item.href : pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
								active ? "text-[#765646]" : "text-[#88756b]",
							)}
						>
							<Icon size={20} strokeWidth={active ? 2.5 : 2} />
							{item.label}
						</Link>
					);
				})}
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#88756b]"
				>
					<Menu size={20} />
					Menu
				</button>
			</nav>
		</>
	);
}
