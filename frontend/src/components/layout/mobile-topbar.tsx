"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { cn } from "@/lib/utils";
import { academicNavigation, navigation, settingsNavigation, type AppRole } from "./navigation";

export function MobileTopbar() {
	const pathname = usePathname();
	const session = useQuery(authSessionQueryOptions);
	const [open, setOpen] = useState(false);
	const role = session.data?.role as AppRole | undefined;
	const reportHref = role === "PRINCIPAL" ? "/app/reports/review" : "/app/reports/progress";

	useEffect(() => {
		if (!open) return;

		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", closeOnEscape);

		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [open]);

	return (
		<>
			<header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-brand-950/10 bg-[#fffdf8]/95 px-4 backdrop-blur lg:hidden">
				<Link href="/app/dashboard" className="flex items-center gap-2 font-bold text-brand-950">
					<span className="grid size-9 place-items-center rounded-xl bg-brand-800 text-white shadow-[0_5px_14px_rgba(9,43,26,0.18)]">
						<GraduationCap size={19} />
					</span>
					RAMU
				</Link>
				<button
					type="button"
					aria-label="Buka menu"
					aria-expanded={open}
					onClick={() => setOpen(true)}
					className="rounded-xl p-2 text-brand-800 transition hover:bg-brand-50"
				>
					<Menu size={22} />
				</button>
			</header>

			{open ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						type="button"
						aria-label="Tutup menu"
						onClick={() => setOpen(false)}
						className="absolute inset-0 bg-[#17251b]/35"
					/>
					<aside
						role="dialog"
						aria-modal="true"
						aria-label="Menu aplikasi"
						className="relative ml-auto flex h-full w-[min(21rem,88vw)] flex-col bg-[#fffdf8] px-4 py-5 shadow-2xl"
					>
						<div className="flex items-center justify-between border-b border-[#e3e7dc] pb-4">
							<div className="flex items-center gap-2 font-bold text-brand-950">
								<span className="grid size-9 place-items-center rounded-xl bg-brand-800 text-white">
									<GraduationCap size={19} />
								</span>
								Menu RAMU
							</div>
							<button
								type="button"
								aria-label="Tutup menu"
								onClick={() => setOpen(false)}
								className="rounded-xl p-2 text-[#35443a] transition hover:bg-brand-50"
							>
								<X size={21} />
							</button>
						</div>

						<nav
							className="mt-5 min-h-0 flex-1 overflow-y-auto pb-6"
							aria-label="Navigasi aplikasi"
						>
							<MobileNavigationSection
								items={navigation.filter((item) => item.roles.includes(role as AppRole))}
								onNavigate={() => setOpen(false)}
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
													icon: GraduationCap,
												},
											]
										: []
								}
								onNavigate={() => setOpen(false)}
								pathname={pathname}
							/>
							<MobileNavigationSection
								title="Akademik"
								items={academicNavigation.filter((item) => item.roles.includes(role as AppRole))}
								onNavigate={() => setOpen(false)}
								pathname={pathname}
							/>
							<MobileNavigationSection
								title="Pengaturan"
								items={settingsNavigation.filter((item) => item.roles.includes(role as AppRole))}
								onNavigate={() => setOpen(false)}
								pathname={pathname}
							/>
						</nav>
					</aside>
				</div>
			) : null}
		</>
	);
}

type MobileNavigationSectionProps = {
	title?: string;
	items: {
		href: string;
		label: string;
		icon: typeof GraduationCap;
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
		<section className={cn(title && "mt-6")}>
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
