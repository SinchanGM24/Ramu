import Link from "next/link";
import { ArrowRight, CheckCircle2, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";

const steps = [
	["01", "Isi secara individual", "Guru mencatat perkembangan setiap murid."],
	["02", "Tinjau dengan tenang", "Kepala Sekolah meninjau sebelum terbit."],
	["03", "Bagikan dengan aman", "Wali membuka rapor melalui tautan dan PIN."],
];

export function LandingPage() {
	return (
		<main className="min-h-screen overflow-hidden bg-[#f8f5ed] text-[#17251b]">
			<header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
				<BrandMark />
				<div className="flex gap-3">
					<Link
						className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-brand-800"
						href="/login"
					>
						Masuk
					</Link>
					<Link href="/register">
						<Button>Daftarkan sekolah</Button>
					</Link>
				</div>
			</header>
			<section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pb-28 lg:pt-20">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -left-12 top-4 size-56 rounded-full border border-brand-300/30"
				/>
				<div className="relative z-10">
					<span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
						<Sparkles size={14} /> Untuk sekolah PAUD yang bertumbuh bersama
					</span>
					<h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.04] tracking-[-0.055em] text-brand-950 sm:text-5xl lg:text-6xl">
						Rapor yang menemani tumbuh kembang.
					</h1>
					<p className="mt-6 max-w-lg text-base leading-8 text-[#566359] sm:text-lg">
						RAMU membantu guru menyusun penilaian tiap murid, sekolah meninjau rapor, dan wali
						menerima hasilnya dengan aman dalam satu alur yang jelas.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Link href="/register">
							<Button className="gap-2">
								Mulai untuk sekolah <ArrowRight size={17} />
							</Button>
						</Link>
						<Link href="#cara-kerja">
							<Button variant="secondary">Pelajari fitur</Button>
						</Link>
					</div>
					<div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#4d5d50]">
						{["Penilaian per murid", "Tinjauan berjenjang", "Akses aman untuk wali"].map((item) => (
							<span key={item} className="flex items-center gap-2">
								<CheckCircle2 className="size-4 text-brand-700" />
								{item}
							</span>
						))}
					</div>
				</div>
				<div className="relative min-h-[21rem] lg:min-h-[31rem]">
					<div
						aria-hidden="true"
						className="absolute inset-x-5 bottom-0 top-5 rounded-[2.5rem] bg-brand-100/80"
					/>
					<div
						aria-hidden="true"
						className="absolute right-0 top-0 size-36 rounded-full border-[14px] border-brand-300/35"
					/>
					<div className="absolute bottom-0 left-0 right-8 rounded-[2.25rem] border border-white/80 bg-[#fffdf8] p-5 shadow-panel sm:p-7">
						<div className="flex items-start justify-between gap-5">
							<div>
								<p className="text-sm font-semibold text-brand-700">Ruang kerja sekolah</p>
								<h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-brand-950">
									Satu alur yang tenang
								</h2>
							</div>
							<span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
								<Leaf size={21} />
							</span>
						</div>
						<div className="mt-7 grid grid-cols-3 gap-3">
							{[
								["Isi", "Penilaian individual"],
								["Tinjau", "Persetujuan sekolah"],
								["Bagikan", "Tautan aman wali"],
							].map(([number, label]) => (
								<div key={number} className="rounded-2xl bg-[#f5f3ea] p-3 sm:p-4">
									<p className="text-sm font-bold text-brand-700">{number}</p>
									<p className="mt-2 text-xs leading-5 text-[#647066]">{label}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
			<section
				id="cara-kerja"
				className="border-y border-brand-950/10 bg-[#fffdf8] px-5 py-16 sm:px-8 lg:py-20"
			>
				<div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
							Alur rapor
						</p>
						<h2 className="mt-3 max-w-md text-3xl font-bold tracking-[-0.045em] text-brand-950">
							Jelas bagi guru, sekolah, dan wali.
						</h2>
					</div>
					<div className="grid gap-5 sm:grid-cols-3">
						{steps.map(([number, title, description]) => (
							<article key={number} className="border-l border-brand-200 pl-4">
								<p className="text-sm font-bold text-brand-600">{number}</p>
								<h3 className="mt-3 font-bold text-brand-950">{title}</h3>
								<p className="mt-2 text-sm leading-6 text-[#637065]">{description}</p>
							</article>
						))}
					</div>
				</div>
			</section>
			<footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-[#637065] sm:flex-row sm:items-center sm:justify-between sm:px-8">
				<p className="flex items-center gap-2">
					<ShieldCheck size={16} className="text-brand-700" /> Data sekolah terlindungi per tenant.
				</p>
				<p>RAMU · Raport Murid</p>
			</footer>
		</main>
	);
}
