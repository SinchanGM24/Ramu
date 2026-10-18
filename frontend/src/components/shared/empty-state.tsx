import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
	title: string;
	description: string;
	icon?: LucideIcon;
	action?: ReactNode;
	className?: string;
};

export function EmptyState({
	title,
	description,
	icon: Icon = Inbox,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9dfd4] bg-[#f8faf6] px-5 py-10 text-center",
				className,
			)}
		>
			<span className="grid size-11 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
				<Icon className="size-5" />
			</span>
			<h2 className="mt-4 font-display text-lg font-bold text-[#17251b]">{title}</h2>
			<p className="mt-1 max-w-md text-sm leading-6 text-[#637065]">{description}</p>
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}
