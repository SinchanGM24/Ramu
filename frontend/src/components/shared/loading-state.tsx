import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
	label?: string;
	className?: string;
};

export function LoadingState({ label = "Memuat data...", className }: LoadingStateProps) {
	return (
		<div
			role="status"
			aria-live="polite"
			className={cn(
				"flex min-h-40 flex-col items-center justify-center rounded-2xl border border-[#e3e7dc] bg-[#f8faf6] px-5 py-8 text-center",
				className,
			)}
		>
			<span className="grid size-10 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
				<LoaderCircle className="size-5 animate-spin" />
			</span>
			<p className="mt-3 text-sm font-semibold text-[#35443a]">{label}</p>
			<span className="sr-only">Mohon tunggu.</span>
		</div>
	);
}
