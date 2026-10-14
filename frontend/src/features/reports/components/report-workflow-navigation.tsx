"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authSessionQueryOptions } from "@/features/auth/session";
import { cn } from "@/lib/utils";

type WorkflowItem = {
	href: string;
	label: string;
	roles: Array<"SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL">;
};

const items: WorkflowItem[] = [
	{
		href: "/app/reports/progress",
		label: "Pengisian raport",
		roles: ["SCHOOL_ADMIN", "TEACHER"],
	},
	{
		href: "/app/reports/review",
		label: "Tinjauan raport",
		roles: ["SCHOOL_ADMIN", "PRINCIPAL"],
	},
	{
		href: "/app/reports/publication",
		label: "Publikasi & kirim",
		roles: ["SCHOOL_ADMIN", "TEACHER"],
	},
];

function isActive(pathname: string, href: string) {
	if (href === "/app/reports/progress") {
		return (
			pathname === href ||
			(/^\/app\/reports\/[^/]+$/.test(pathname) &&
				!pathname.includes("/publication") &&
				!pathname.includes("/review"))
		);
	}
	if (href === "/app/reports/publication") {
		return pathname.startsWith(href) || pathname.includes("/deliveries");
	}
	return pathname.startsWith(href);
}

export function ReportWorkflowNavigation() {
	const pathname = usePathname();
	const session = useQuery(authSessionQueryOptions);
	const role = session.data?.role;
	const availableItems = items.filter((item) => role && item.roles.includes(role));

	if (!availableItems.length) return null;

	return (
		<nav
			aria-label="Tahapan pengelolaan raport"
			className="mb-7 flex gap-1 overflow-x-auto rounded-2xl border border-[#e5e7dc] bg-[#f3f5ef] p-1.5 shadow-[0_5px_14px_rgba(42,72,48,0.05)]"
		>
			{availableItems.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={cn(
						"whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition sm:px-4",
						isActive(pathname, item.href)
							? "bg-[#fffdf8] text-brand-800 shadow-[0_3px_10px_rgba(27,65,40,0.12)]"
							: "text-[#667168] hover:bg-white/70 hover:text-[#17251b]",
					)}
				>
					{item.label}
				</Link>
			))}
		</nav>
	);
}
