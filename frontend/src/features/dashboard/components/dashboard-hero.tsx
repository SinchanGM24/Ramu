import { Leaf } from "lucide-react";

export function DashboardHero() {
	return (
		<section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdf8] px-6 py-8 shadow-soft sm:px-8 lg:px-10">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full border-[18px] border-brand-100/80"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute bottom-0 right-16 h-32 w-52 rounded-t-[6rem] bg-brand-100/60"
			/>
			<div className="relative max-w-2xl">
				<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
					<Leaf size={14} /> Semester aktif
				</p>
				<h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-brand-950 sm:text-4xl">
					Selamat datang di RAMU
				</h1>
				<p className="mt-3 max-w-xl text-sm leading-6 text-[#637065] sm:text-base">
					Kelola data akademik dan pantau kesiapan rapor murid dari satu tempat yang rapi.
				</p>
			</div>
		</section>
	);
}
