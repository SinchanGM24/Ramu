import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
	className,
	compact = false,
}: {
	className?: string;
	compact?: boolean;
}) {
	return (
		<div className={cn("flex items-center gap-3", className)}>
			<span className="grid size-10 place-items-center rounded-2xl bg-brand-800 text-white shadow-[0_8px_20px_rgba(44,112,77,0.16)]">
				<GraduationCap size={21} strokeWidth={2.2} />
			</span>
			{compact ? null : (
				<span>
					<strong className="block text-lg tracking-[-0.04em]">RAMU</strong>
					<span className="block text-[11px] font-medium tracking-wide opacity-70">
						Raport Murid
					</span>
				</span>
			)}
		</div>
	);
}
