import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DashboardRole } from "../types";

const adminActions = [
	["1", "Buat tahun ajaran dan semester", "/app/academic"],
	["2", "Tambahkan kelas dan murid", "/app/academic/students"],
] as const;

const roleActions: Record<DashboardRole, readonly (readonly [string, string, string])[]> = {
	SCHOOL_ADMIN: adminActions,
	TEACHER: [
		["1", "Lanjutkan pengisian raport", "/app/reports/progress"],
		["2", "Lihat murid kelas Anda", "/app/academic/students"],
	],
	PRINCIPAL: [
		["1", "Tinjau raport yang masuk", "/app/reports/review"],
		["2", "Tinjau pengajuan perpindahan", "/app/academic/lifecycle"],
	],
};

export function SemesterPreparationCard({ role }: { role?: DashboardRole }) {
	const currentRole = role ?? "SCHOOL_ADMIN";
	const actions = roleActions[currentRole];
	const title =
		currentRole === "TEACHER"
			? "Pekerjaan Anda"
			: currentRole === "PRINCIPAL"
				? "Tindakan prioritas"
				: "Mulai persiapan semester";
	const description =
		currentRole === "TEACHER"
			? "Selesaikan raport dan data murid pada kelas penugasan Anda."
			: currentRole === "PRINCIPAL"
				? "Selesaikan antrean tinjauan agar proses akademik tetap berjalan."
				: "Lengkapi data dasar sebelum mengisi penilaian.";
	const badge =
		currentRole === "TEACHER"
			? "Perlu ditindaklanjuti"
			: currentRole === "PRINCIPAL"
				? "Menunggu tinjauan"
				: "Perlu dilengkapi";

	return (
		<section className="rounded-2xl border border-[#e7e7dc] bg-[#fffdf8] p-5 shadow-soft sm:p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="font-bold tracking-[-0.02em] text-brand-950">{title}</h2>
					<p className="mt-1 text-sm leading-6 text-[#637065]">{description}</p>
				</div>
				<StatusBadge tone="amber">{badge}</StatusBadge>
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
