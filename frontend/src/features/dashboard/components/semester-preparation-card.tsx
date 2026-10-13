import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

const actions = [
	["1", "Buat tahun ajaran dan semester", "/app/academic"],
	["2", "Tambahkan kelas dan murid", "/app/academic/students"],
];

export function SemesterPreparationCard() {
	return (
		<section className="rounded-2xl border border-[#e7e7dc] bg-[#fffdf8] p-5 shadow-soft sm:p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="font-bold tracking-[-0.02em] text-brand-950">Mulai persiapan semester</h2>
					<p className="mt-1 text-sm leading-6 text-[#637065]">
						Lengkapi data dasar sebelum mengisi penilaian.
					</p>
				</div>
				<StatusBadge tone="amber">Perlu dilengkapi</StatusBadge>
			</div>
			<div className="mt-5 divide-y divide-[#e7e7dc]">
				{actions.map(([number, label, href]) => (
					<Link
						href={href}
						key={number}
						className="flex items-center gap-3 py-4 text-sm font-semibold text-[#314137] transition hover:text-brand-700"
					>
						<span className="grid size-7 place-items-center rounded-full bg-brand-50 text-xs text-brand-700">
							{number}
						</span>
						{label}
						<ArrowRight size={16} className="ml-auto" />
					</Link>
				))}
			</div>
		</section>
	);
}
