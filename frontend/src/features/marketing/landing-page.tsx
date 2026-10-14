import Image from "next/image";
import Link from "next/link";
import {
	ArrowRight,
	BookOpenCheck,
	CheckCircle2,
	ClipboardCheck,
	Leaf,
	Send,
	ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";

const assurances = [
	"Penilaian individual untuk setiap murid",
	"Tinjauan rapor yang terarah",
	"Akses aman untuk setiap wali",
];

const steps = [
	{
		number: "01",
		title: "Catat perkembangan",
		description: "Guru mengisi indikator dan narasi satu murid pada satu waktu.",
		icon: BookOpenCheck,
	},
	{
		number: "02",
		title: "Tinjau bersama",
		description: "Sekolah memastikan setiap rapor siap sebelum diterbitkan.",
		icon: ClipboardCheck,
	},
	{
		number: "03",
		title: "Bagikan dengan tenang",
		description: "Wali menerima tautan privat untuk melihat rapor anaknya.",
		icon: Send,
	},
];

export function LandingPage() {
	return (
		<main className="min-h-screen overflow-hidden bg-[#f8f5ed] text-[#17251b]">
			<header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:py-7">
				<BrandMark />
				<nav aria-label="Navigasi utama" className="flex items-center gap-1 sm:gap-3">
					<Link
						className="rounded-xl px-3 py-2 text-sm font-semibold text-[#4d5d50] transition hover:bg-white/70 hover:text-brand-800 sm:px-4"
						href="/login"
					>
						Masuk
					</Link>
					<Link href="/register">
						<Button className="hidden sm:inline-flex">Daftarkan sekolah</Button>
						<Button className="sm:hidden">Daftar</Button>
					</Link>
				</nav>
			</header>

			<section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-3 lg:pb-28 lg:pt-14">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -left-44 top-0 size-[32rem] rounded-full border border-brand-300/30"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute left-16 top-6 text-brand-400/60"
				>
					<Leaf className="size-10 -rotate-45" strokeWidth={1.2} />
				</div>
				<div className="relative z-10 pt-4 lg:pt-0">
					<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
						<span className="h-px w-8 bg-brand-500" />
						Untuk sekolah PAUD
					</p>
					<h1 className="mt-5 max-w-2xl font-serif text-5xl font-bold leading-[0.94] tracking-[-0.065em] text-brand-950 sm:text-6xl lg:text-7xl">
						Rapor yang tumbuh bersama anak.
					</h1>
					<p className="mt-7 max-w-lg text-base leading-8 text-[#566359] sm:text-lg">
						RAMU membantu guru mencatat perkembangan setiap murid, sekolah meninjau dengan tenang,
						dan wali menerima hasilnya melalui satu alur yang jelas.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Link href="/register">
							<Button className="gap-2 px-5">
								Mulai untuk sekolah
								<ArrowRight size={17} />
							</Button>
						</Link>
						<Link href="#cara-kerja">
							<Button variant="secondary" className="bg-[#fffdf8]/80">
								Lihat cara kerja RAMU
							</Button>
						</Link>
					</div>
					<ul className="mt-10 grid gap-3 text-sm text-[#4d5d50] sm:grid-cols-3 sm:gap-4">
						{assurances.map((assurance) => (
							<li key={assurance} className="flex items-start gap-2 leading-5">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-700" />
								{assurance}
							</li>
						))}
					</ul>
				</div>

				<div className="relative min-h-[25rem] sm:min-h-[32rem] lg:min-h-[39rem]">
					<div
						aria-hidden="true"
						className="absolute inset-x-2 bottom-2 top-3 rounded-[48%] bg-[radial-gradient(circle_at_50%_45%,#edf2df_0%,#dfe9d4_42%,transparent_70%)]"
					/>
					<div
						aria-hidden="true"
						className="absolute -right-2 top-[8%] size-36 rounded-full border-[15px] border-[#d2dfc7]/80 sm:size-48"
					/>
					<div
						aria-hidden="true"
						className="absolute bottom-[11%] left-[8%] size-20 rounded-full bg-[#d8a44a]/20 blur-md"
					/>
					<div aria-hidden="true" className="absolute bottom-[9%] right-[10%] text-[#70956e]/45">
						<Leaf className="size-20 rotate-[26deg]" strokeWidth={1} />
					</div>
					<Image
						src="/brand/ramu-landing-campus.png"
						alt="Ilustrasi sekolah PAUD, buku, dan lembar perkembangan murid"
						width={1536}
						height={1024}
						priority
						className="absolute -right-[10%] top-1/2 z-10 h-auto w-[124%] max-w-none -translate-y-1/2 object-contain sm:-right-[6%] sm:w-[116%] lg:-right-[12%] lg:w-[126%]"
					/>
					<p className="absolute bottom-[7%] left-[5%] z-20 max-w-[12rem] border-l-2 border-[#d49b42] pl-3 text-xs font-semibold leading-5 text-brand-950 sm:max-w-[14rem] sm:text-sm">
						Setiap cerita tumbuh kembang tersimpan dengan rapi.
					</p>
				</div>
			</section>

			<section
				id="cara-kerja"
				className="border-y border-brand-950/10 bg-[#fffdf8] px-5 py-6 sm:px-8 lg:py-10"
			>
				<div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#3f7955] lg:grid-cols-[0.82fr_1.18fr]">
					<div className="relative overflow-hidden px-7 py-11 text-[#fffdf8] sm:px-10 sm:py-14">
						<div
							aria-hidden="true"
							className="absolute -bottom-16 -left-12 size-52 rounded-full border-[24px] border-white/10"
						/>
						<div
							aria-hidden="true"
							className="absolute right-5 top-7 rotate-[28deg] text-[#d7e5cd]/50"
						>
							<Leaf className="size-16" strokeWidth={1.15} />
						</div>
						<p className="relative text-xs font-bold uppercase tracking-[0.16em] text-[#d7e5cd]">
							Alur rapor RAMU
						</p>
						<h2 className="relative mt-5 max-w-md font-serif text-4xl font-bold leading-[1] tracking-[-0.055em] sm:text-5xl">
							Dari catatan kelas menjadi rapor yang bermakna.
						</h2>
						<p className="relative mt-6 max-w-sm text-sm leading-7 text-[#e4ecdd] sm:text-base">
							Setiap langkah memiliki pemilik yang jelas, agar guru dapat fokus pada anak dan
							sekolah tetap memegang kendali.
						</p>
						<Image
							src="/brand/ramu-report-journey.png"
							alt="Ilustrasi catatan guru, rapor yang ditinjau, dan rapor dibuka melalui telepon"
							width={2048}
							height={768}
							className="relative mt-8 h-auto w-full max-w-md"
						/>
					</div>
					<div className="bg-[#f6f3e9] px-7 py-4 sm:px-10 sm:py-7">
						<div className="relative">
							<div
								aria-hidden="true"
								className="absolute bottom-11 left-5 top-11 w-px bg-brand-200 sm:left-6"
							/>
							{steps.map(({ number, title, description, icon: Icon }) => (
								<article
									key={number}
									className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 border-b border-brand-950/10 py-6 last:border-b-0 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5"
								>
									<span className="relative z-10 grid size-10 place-items-center rounded-full border border-brand-200 bg-[#fffdf8] text-brand-700 shadow-sm sm:size-12">
										<Icon size={19} strokeWidth={1.8} />
									</span>
									<div className="grid gap-1.5 sm:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] sm:items-baseline sm:gap-6">
										<div>
											<p className="text-xs font-bold tracking-[0.13em] text-brand-600">{number}</p>
											<h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-brand-950">
												{title}
											</h3>
										</div>
										<p className="text-sm leading-6 text-[#637065]">{description}</p>
									</div>
								</article>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="relative px-5 py-16 sm:px-8 lg:py-20">
				<div
					aria-hidden="true"
					className="absolute bottom-12 left-0 size-48 rounded-full border border-brand-200/60"
				/>
				<div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 border-y border-brand-950/10 py-10 sm:py-12 lg:flex-row lg:items-end">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
							Mulai dengan rapi
						</p>
						<h2 className="mt-3 max-w-2xl font-serif text-4xl font-bold leading-[1] tracking-[-0.055em] text-brand-950 sm:text-5xl">
							Satu rapor yang disusun dengan baik dapat menjaga cerita tumbuh kembang anak.
						</h2>
					</div>
					<Link href="/register">
						<Button className="gap-2 px-5">
							Daftarkan sekolah
							<ArrowRight size={17} />
						</Button>
					</Link>
				</div>
			</section>

			<footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-8 text-sm text-[#637065] sm:flex-row sm:items-center sm:justify-between sm:px-8">
				<p className="flex items-center gap-2">
					<ShieldCheck size={16} className="text-brand-700" />
					Data sekolah terlindungi per tenant.
				</p>
				<p>RAMU · Raport Murid</p>
			</footer>
		</main>
	);
}
