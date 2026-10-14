import Image from "next/image";
import { Leaf } from "lucide-react";

export function DashboardHero({
	schoolName,
	semesterName,
}: {
	schoolName?: string;
	semesterName?: string | null;
}) {
	return (
		<section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdf8] px-6 py-8 shadow-soft sm:px-8 lg:px-10">
			<Image
				src="/images/dashboard-school-hero.png"
				alt="Ilustrasi bangunan sekolah"
				width={1536}
				height={1024}
				priority
				className="pointer-events-none absolute bottom-[-17%] right-[-8%] hidden h-auto w-[48%] max-w-[520px] object-contain lg:block"
			/>
			<div className="relative max-w-2xl lg:max-w-[58%]">
				<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
					<Leaf size={14} /> {semesterName || "Ruang kerja sekolah"}
				</p>
				<h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-brand-950 sm:text-4xl">
					Selamat datang{schoolName ? `, ${schoolName}` : " di RAMU"}
				</h1>
				<p className="mt-3 max-w-xl text-sm leading-6 text-[#637065] sm:text-base">
					Kelola data akademik dan pantau kesiapan rapor murid dari satu tempat yang rapi.
				</p>
			</div>
		</section>
	);
}
