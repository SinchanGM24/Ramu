import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { cn } from "@/lib/utils";
import { mobileNavigation, type AppRole } from "./navigation";

type MobileBottomNavProps = {
	isMenuOpen: boolean;
	onMenuToggle: () => void;
};

export function MobileBottomNav({ isMenuOpen, onMenuToggle }: MobileBottomNavProps) {
	const pathname = usePathname();
	const session = useQuery(authSessionQueryOptions);
	const items = mobileNavigation.filter((item) =>
		item.roles.includes(session.data?.role as AppRole),
	);

	return (
		<nav
			aria-label="Navigasi utama"
			className={cn(
				"fixed inset-x-0 bottom-0 z-40 grid border-t border-brand-950/10 bg-[#fffdf8]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(23,75,49,0.06)] backdrop-blur lg:hidden",
				items.length === 2 ? "grid-cols-3" : "grid-cols-4",
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
			<button
				type="button"
				aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
				aria-expanded={isMenuOpen}
				onClick={onMenuToggle}
				className={cn(
					"flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
					isMenuOpen ? "text-brand-800" : "text-slate-500",
				)}
			>
				{isMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} />}
				Menu
			</button>
		</nav>
	);
}
