import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { DashboardRole } from "../types";

export function WorkspaceStatusCard({
	role,
	academicYearName,
}: {
	role?: DashboardRole;
	academicYearName?: string | null;
}) {
	const title =
		role === "TEACHER"
			? "Kelas penugasan aktif"
			: role === "PRINCIPAL"
				? "Tinjauan akademik aktif"
				: "Sekolah aktif";
	const description =
		role === "TEACHER"
			? "Data murid dan rapor yang tampil dibatasi pada kelas penugasan Anda."
			: role === "PRINCIPAL"
				? "Gunakan antrean tinjauan untuk menyetujui rapor dan pengajuan dari guru."
				: "Data dan akses sekolah tetap terisolasi aman untuk setiap sekolah.";
	const href =
		role === "TEACHER"
			? "/app/academic/students"
			: role === "PRINCIPAL"
				? "/app/reports/review"
				: "/app/settings/school";
	const action =
		role === "TEACHER"
			? "Lihat murid saya"
			: role === "PRINCIPAL"
				? "Buka tinjauan rapor"
				: "Lihat profil sekolah";

	return (
		<aside className="relative overflow-hidden rounded-2xl bg-[#2c704d] p-6 text-white shadow-panel">
			<div
				aria-hidden="true"
				className="absolute -right-8 -top-8 size-32 rounded-full border-[12px] border-brand-300/15"
			/>
			<ShieldCheck className="relative size-6 text-brand-200" />
			<p className="relative mt-6 text-sm font-semibold text-brand-100">
				{academicYearName ? "Tahun ajaran " + academicYearName : "Status ruang kerja"}
			</p>
			<h2 className="relative mt-2 text-xl font-bold tracking-[-0.03em]">{title}</h2>
			<p className="relative mt-3 text-sm leading-6 text-brand-100/80">{description}</p>
			<Link
				href={href}
				className="relative mt-6 inline-flex text-sm font-bold text-white underline-offset-4 hover:underline"
			>
				{action} →
			</Link>
		</aside>
	);
}
