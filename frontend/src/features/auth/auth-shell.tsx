import Link from "next/link";
import { CheckCircle2, Leaf, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";

export function AuthShell({
	title,
	description,
	children,
	footer,
}: {
	title: string;
	description: string;
	children: ReactNode;
	footer: ReactNode;
}) {
	return (
		<main className="grid min-h-screen bg-[#f8f5ed] lg:grid-cols-[0.9fr_1.1fr]">
			<section className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col">
				<div
					aria-hidden="true"
					className="absolute -right-32 top-16 size-80 rounded-full border border-brand-200/15"
				/>
				<div
					aria-hidden="true"
					className="absolute -bottom-24 -left-20 size-96 rounded-full border-[18px] border-brand-300/10"
				/>
				<Link href="/" className="relative w-fit text-white">
					<BrandMark className="text-white" />
				</Link>
				<div className="relative my-auto max-w-md">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-brand-100">
						<Leaf size={14} /> Ruang kerja sekolah
					</span>
					<h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.045em]">
						Mendampingi tumbuh kembang murid, lebih tenang.
					</h2>
					<p className="mt-5 max-w-sm leading-7 text-brand-100/85">
						Satu ruang kerja aman untuk guru, sekolah, dan wali murid.
					</p>
					<ul className="mt-10 space-y-3 text-sm text-brand-100/85">
						{["Penilaian per murid", "Tinjauan sekolah", "Akses rapor aman"].map((item) => (
							<li key={item} className="flex items-center gap-3">
								<CheckCircle2 size={17} className="text-brand-200" />
								{item}
							</li>
						))}
					</ul>
				</div>
				<p className="relative flex items-center gap-2 text-xs text-brand-100/65">
					<ShieldCheck size={15} /> Data sekolah terisolasi dengan aman.
				</p>
			</section>
			<section className="ramu-surface-pattern flex items-center justify-center p-5 sm:p-10">
				<div className="w-full max-w-md rounded-[1.75rem] border border-white/90 bg-[#fffdf8]/95 p-6 shadow-panel sm:p-9">
					<Link href="/" className="mb-9 flex w-fit text-brand-800 lg:hidden">
						<BrandMark />
					</Link>
					<h1 className="text-3xl font-bold tracking-[-0.045em] text-brand-950">{title}</h1>
					<p className="mt-2 text-sm leading-6 text-[#637065]">{description}</p>
					<div className="mt-8">{children}</div>
					<p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
				</div>
			</section>
		</main>
	);
}
