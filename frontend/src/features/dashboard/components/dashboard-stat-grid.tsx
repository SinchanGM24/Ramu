import Link from "next/link";
import {
	BookOpenCheck,
	ClipboardCheck,
	FilePenLine,
	GitPullRequest,
	GraduationCap,
	UsersRound,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStat } from "../types";

const statVisuals: Record<string, { icon: LucideIcon; tone: string }> = {
	students: { icon: UsersRound, tone: "bg-brand-50 text-brand-700" },
	"missing-reports": { icon: FilePenLine, tone: "bg-amber-50 text-amber-700" },
	reports: { icon: ClipboardCheck, tone: "bg-[#eef4ef] text-brand-700" },
	revisions: { icon: GitPullRequest, tone: "bg-red-50 text-red-700" },
	"reports-to-review": { icon: ClipboardCheck, tone: "bg-amber-50 text-amber-700" },
	"transfer-requests": { icon: GitPullRequest, tone: "bg-brand-50 text-brand-700" },
	"graduation-requests": { icon: GraduationCap, tone: "bg-[#eef4ef] text-brand-700" },
	"active-reports": { icon: ClipboardCheck, tone: "bg-amber-50 text-amber-700" },
	"active-classes": { icon: BookOpenCheck, tone: "bg-[#eef4ef] text-brand-700" },
};

export function DashboardStatGrid({
	stats,
	loading,
}: {
	stats?: DashboardStat[];
	loading: boolean;
}) {
	const items = stats ?? [];
	const columns = items.length === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3";

	return (
		<section className={cn("grid gap-4", columns)} aria-label="Ringkasan ruang kerja">
			{loading
				? Array.from({ length: 3 }, (_, index) => (
						<div key={index} className="h-28 animate-pulse rounded-2xl bg-[#edf1ea]" />
					))
				: items.map((stat) => {
						const visual = statVisuals[stat.id] ?? statVisuals.reports;
						const Icon = visual.icon;

						return (
							<Link
								key={stat.id}
								href={stat.href}
								className="group flex min-h-28 items-center gap-4 rounded-2xl border border-[#e7e7dc] bg-[#fffdf8] p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-panel"
							>
								<span
									className={`grid size-11 shrink-0 place-items-center rounded-2xl ${visual.tone}`}
								>
									<Icon size={21} />
								</span>
								<div className="min-w-0">
									<p className="text-sm text-[#637065]">{stat.label}</p>
									<p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-brand-950">
										{stat.value}
									</p>
									<p className="mt-1 truncate text-xs text-[#718072]">{stat.description}</p>
								</div>
							</Link>
						);
					})}
		</section>
	);
}
