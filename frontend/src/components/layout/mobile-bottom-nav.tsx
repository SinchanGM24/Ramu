"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { mobileNavigation, type AppRole } from "./navigation";
export function MobileBottomNav() {
	const pathname = usePathname();
	const session = useQuery(authSessionQueryOptions);
	const items = mobileNavigation.filter((item) =>
		item.roles.includes(session.data?.role as AppRole),
	);
	return (
		<nav
			aria-label="Navigasi utama"
			className={cn(
				"fixed inset-x-0 bottom-0 z-30 grid border-t border-brand-950/10 bg-[#fffdf8]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(23,75,49,0.06)] backdrop-blur lg:hidden",
				items.length === 2 ? "grid-cols-2" : "grid-cols-3",
			)}
		>
			{items.map(({ href, label, icon: Icon }) => {
				const active = pathname.startsWith(href);
				return (
					<Link
						key={href}
						href={href}
						className={cn(
							"flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
							active ? "text-brand-800" : "text-slate-500",
						)}
					>
						<Icon size={20} strokeWidth={active ? 2.5 : 2} />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
