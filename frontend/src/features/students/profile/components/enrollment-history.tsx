import Link from "next/link";
import { Card } from "@/components/ui/card";
import { reportPreviewHref } from "@/features/reports/utils/report-navigation";
import type { Enrollment, PublishedReport } from "../types";

type EnrollmentHistoryProps = {
	enrollments: Enrollment[];
	publishedReports: PublishedReport[];
	studentId: string;
};

export function EnrollmentHistory({
	enrollments,
	publishedReports,
	studentId,
}: EnrollmentHistoryProps) {
	return (
		<Card>
			<h2 className="text-lg font-bold tracking-[-0.02em] text-brand-950">Riwayat kelas</h2>
			<div className="mt-4 space-y-2">
				{enrollments.length ? (
					enrollments.map((enrollment) => (
						<div
							key={enrollment.id}
							className="rounded-xl border border-[#e7e7dc] bg-[#f7f7f1] p-3 text-sm"
						>
							<b className="text-brand-950">{enrollment.academic_year_name}</b>
							<p className="text-[#637065]">
								{enrollment.class_name ?? "Belum ditempatkan"} ·{" "}
								{enrollmentStatusLabel(enrollment.status)}
							</p>
						</div>
					))
				) : (
					<p className="text-sm text-[#637065]">Belum ada riwayat penempatan kelas.</p>
				)}
			</div>
			<div className="mt-6 border-t border-[#e7e7dc] pt-5">
				<h3 className="font-semibold text-brand-950">Raport terbit</h3>
				<p className="mt-1 text-sm text-[#637065]">
					Hanya raport yang sudah diterbitkan ditampilkan sebagai riwayat.
				</p>
				<div className="mt-3 space-y-2">
					{publishedReports.length ? (
						publishedReports.map((report) => (
							<Link
								key={report.id}
								href={reportPreviewHref(report.id, "student", { studentId })}
								className="flex items-center justify-between rounded-xl border border-[#e7e7dc] p-3 text-sm transition hover:border-brand-300 hover:bg-brand-50/40"
							>
								<span>
									<span className="block font-semibold text-brand-950">
										{report.academic_year_name} · {report.semester_name}
									</span>
									<span className="mt-1 block text-xs text-[#637065]">
										Diterbitkan{" "}
										{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
											new Date(report.published_at),
										)}{" "}
										· Versi {report.version_number}
									</span>
								</span>
								<span className="font-semibold text-brand-700">Lihat raport</span>
							</Link>
						))
					) : (
						<p className="rounded-xl bg-[#f7f7f1] p-3 text-sm text-[#637065]">
							Belum ada raport yang diterbitkan.
						</p>
					)}
				</div>
			</div>
		</Card>
	);
}

function enrollmentStatusLabel(status: string) {
	return (
		({ SCHEDULED: "Terjadwal", ACTIVE: "Aktif", COMPLETED: "Selesai" } as Record<string, string>)[
			status
		] ?? "Selesai"
	);
}
