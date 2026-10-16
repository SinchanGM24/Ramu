"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicationReportList } from "./components/publication-report-list";
import { useReportPublication } from "./hooks/use-report-publication";

export function ReportPublicationPage() {
	const publication = useReportPublication();

	if (publication.activeSemester.isLoading) {
		return <LoadingState label="Memuat konteks semester..." />;
	}
	if (publication.activeSemester.isError) {
		return <SemesterLoadError onRetry={() => void publication.activeSemester.refetch()} />;
	}
	if (!publication.activeSemester.data) {
		return (
			<Card className="max-w-xl border-dashed text-sm leading-6 text-[#637065]">
				Admin Sekolah perlu memilih tahun ajaran dan semester aktif pada Data Akademik.
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
			<div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#e7e7dc] bg-[linear-gradient(112deg,#f4f7ed_0%,#fffdf8_60%,#eef5ec_100%)] p-5 shadow-soft sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
						Konteks publikasi
					</p>
					<p className="mt-1 text-sm leading-6 text-[#637065]">
						Semester aktif ditentukan Admin Sekolah pada Data Akademik.
					</p>
				</div>
				<div className="rounded-xl border border-brand-100 bg-[#fffefa] px-4 py-3 text-sm font-semibold text-[#17251b] sm:min-w-56">
					{publication.activeSemester.data.name} ·{" "}
					{publication.activeSemester.data.academic_year_name}
				</div>
			</div>
			<PublicationReportList
				canPublish={publication.canPublish}
				batchPending={publication.publish.isPending || publication.publishBatch.isPending}
				batchProgress={publication.batchProgress}
				counts={publication.counts}
				deliveryFilter={publication.deliveryFilter}
				loading={publication.progress.isLoading}
				page={publication.page}
				pending={publication.publish.isPending || publication.publishBatch.isPending}
				reports={publication.pagedReports}
				search={publication.search}
				total={publication.filteredReports.length}
				onPageChange={publication.setPage}
				onDeliveryFilterChange={publication.setDeliveryFilter}
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

function SemesterLoadError({ onRetry }: { onRetry: () => void }) {
	return (
		<Card className="max-w-xl border-red-200 bg-red-50">
			<h2 className="font-bold text-red-900">Konteks semester tidak dapat dimuat</h2>
			<p className="mt-2 text-sm leading-6 text-red-800">
				Coba lagi untuk membuka daftar publikasi raport.
			</p>
			<Button className="mt-4" variant="secondary" onClick={onRetry}>
				Coba lagi
			</Button>
		</Card>
	);
}
