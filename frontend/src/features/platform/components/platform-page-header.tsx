import { ReactNode } from "react";

export function PlatformPageHeader({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-6 flex max-w-7xl flex-col gap-4 border-b border-[#d9e8dc] pb-5 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p className="text-sm font-semibold text-[#765646]">Platform RAMU</p>
				<h1 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-[#26382b] sm:text-3xl">
					{title}
				</h1>
				{description ? (
					<p className="mt-2 max-w-2xl text-sm leading-6 text-[#637065]">{description}</p>
				) : null}
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
