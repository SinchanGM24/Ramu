import { Bell, GraduationCap } from "lucide-react";
export function MobileTopbar() {
	return (
		<header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-brand-950/10 bg-[#fffdf8]/95 px-4 backdrop-blur lg:hidden">
			<div className="flex items-center gap-2 font-bold text-brand-950">
				<span className="grid size-9 place-items-center rounded-xl bg-brand-800 text-white shadow-[0_5px_14px_rgba(9,43,26,0.18)]">
					<GraduationCap size={19} />
				</span>
				RAMU
			</div>
			<button aria-label="Notifikasi" className="rounded-xl p-2 text-brand-800 hover:bg-brand-50">
				<Bell size={20} />
			</button>
		</header>
	);
}
