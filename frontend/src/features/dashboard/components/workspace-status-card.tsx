import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function WorkspaceStatusCard() {
	return (
		<aside className="relative overflow-hidden rounded-2xl bg-brand-900 p-6 text-white shadow-panel">
			<div
				aria-hidden="true"
				className="absolute -right-8 -top-8 size-32 rounded-full border-[12px] border-brand-300/15"
			/>
			<ShieldCheck className="relative size-6 text-brand-200" />
			<p className="relative mt-6 text-sm font-semibold text-brand-100">Status ruang kerja</p>
			<h2 className="relative mt-2 text-xl font-bold tracking-[-0.03em]">Sekolah aktif</h2>
			<p className="relative mt-3 text-sm leading-6 text-brand-100/80">
				Data dan akses sekolah tetap terisolasi aman untuk setiap sekolah.
			</p>
			<Link
				href="/app/settings/school"
				className="relative mt-6 inline-flex text-sm font-bold text-white underline-offset-4 hover:underline"
			>
				Lihat profil sekolah →
			</Link>
		</aside>
	);
}
