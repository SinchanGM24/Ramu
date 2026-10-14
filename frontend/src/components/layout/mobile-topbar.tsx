import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function MobileTopbar() {
	return (
		<header className="sticky top-0 z-20 flex h-16 items-center border-b border-brand-950/10 bg-[#fffdf8]/95 px-4 backdrop-blur lg:hidden">
			<Link href="/app/dashboard" className="flex items-center gap-2 font-bold text-brand-950">
				<span className="grid size-9 place-items-center rounded-xl bg-brand-800 text-white shadow-[0_5px_14px_rgba(9,43,26,0.18)]">
					<GraduationCap size={19} />
				</span>
				RAMU
			</Link>
		</header>
	);
}
