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
		label: "Pengisian rapor",
		roles: ["SCHOOL_ADMIN", "TEACHER"],
	},
	{
		href: "/app/reports/review",
		label: "Tinjauan rapor",
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
			aria-label="Tahapan pengelolaan rapor"
			className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3"
		>
			{availableItems.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={cn(
						"whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition",
						isActive(pathname, item.href)
							? "bg-brand-600 text-white"
							: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
					)}
				>
					{item.label}
				</Link>
			))}
		</nav>
	);
}
