"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { PublicationReportList } from "./components/publication-report-list";
import { useReportPublication } from "./hooks/use-report-publication";

export function ReportPublicationPage() {
	const publication = useReportPublication();

	if (!publication.semesters.data?.length) {
		return (
			<Card className="max-w-xl border-dashed text-sm leading-6 text-[#637065]">
				Belum ada semester untuk menampilkan publikasi raport.
			</Card>
		);
	}

	return (
		<>
			<PageHeader
				eyebrow="Raport"
				title="Publikasi & kirim raport"
				description="Terbitkan raport yang sudah disetujui sebagai versi final, lalu kirimkan tautannya kepada wali."
			/>
			{publication.notice ? (
				<p
					role="status"
					className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
				>
					{publication.notice}
				</p>
			) : null}
			{publication.error ? (
				<p
					role="alert"
					className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
				>
					{publication.error}
				</p>
			) : null}
			<div className="mb-6 max-w-3xl rounded-2xl border border-[#e7e7dc] bg-[linear-gradient(112deg,#f4f7ed_0%,#fffdf8_60%,#eef5ec_100%)] p-5 shadow-soft">
				<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
					Konteks publikasi
				</p>
				<p className="mt-1 text-sm leading-6 text-[#637065]">
					Pilih semester sebelum menerbitkan versi raport final atau meninjau riwayat pengiriman.
				</p>
				<label className="mt-4 block max-w-sm text-sm font-semibold text-[#35443a]">
					Semester
					<select
						value={publication.semesterId}
						onChange={(event) => publication.setSemesterId(event.target.value)}
						className="mt-2 block w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] px-3 py-2.5 text-sm text-[#17251b] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
					>
						{publication.semesters.data.map((semester) => (
							<option key={semester.id} value={semester.id}>
								{semester.name} · {semester.academic_year_name}
							</option>
						))}
					</select>
				</label>
			</div>
			<PublicationReportList
				canPublish={publication.canPublish}
				batchPending={publication.publish.isPending || publication.publishBatch.isPending}
				batchProgress={publication.batchProgress}
				counts={publication.counts}
				loading={publication.progress.isLoading}
				page={publication.page}
				pending={publication.publish.isPending || publication.publishBatch.isPending}
				reports={publication.pagedReports}
				search={publication.search}
				total={publication.filteredReports.length}
				onPageChange={publication.setPage}
				onPublish={(reportId) => publication.publish.mutate(reportId)}
				onPublishBatch={() =>
					publication.publishBatch.mutate(
						publication.reports
							.filter((report) => report.status === "APPROVED")
							.map((report) => report.report_id),
					)
				}
				onSearchChange={publication.setSearch}
			/>
		</>
	);
}
