import { ReactNode } from "react";
export function PageHeader({
	eyebrow,
	title,
	description,
	action,
}: {
	eyebrow?: string;
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-8 flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</p>
				<h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
					{title}
				</h1>
				{description && (
					<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
				)}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
