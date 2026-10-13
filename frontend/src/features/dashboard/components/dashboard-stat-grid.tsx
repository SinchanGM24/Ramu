import { BookOpenCheck, ClipboardCheck, UsersRound } from "lucide-react";

const stats = [
	{ label: "Murid aktif", value: "—", icon: UsersRound, tone: "bg-brand-50 text-brand-700" },
	{ label: "Rapor berjalan", value: "—", icon: ClipboardCheck, tone: "bg-amber-50 text-amber-700" },
	{ label: "Kelas aktif", value: "—", icon: BookOpenCheck, tone: "bg-[#eef4ef] text-brand-700" },
];

export function DashboardStatGrid() {
	return (
		<section className="grid gap-4 sm:grid-cols-3" aria-label="Ringkasan sekolah">
			{stats.map(({ label, value, icon: Icon, tone }) => (
				<article
					key={label}
					className="flex items-center gap-4 rounded-2xl border border-[#e7e7dc] bg-[#fffdf8] p-5 shadow-soft"
				>
					<span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
						<Icon size={21} />
					</span>
					<div>
						<p className="text-sm text-[#637065]">{label}</p>
						<p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-brand-950">{value}</p>
					</div>
				</article>
			))}
		</section>
	);
}
