"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { PublicationReportList } from "./components/publication-report-list";
import { useReportPublication } from "./hooks/use-report-publication";

export function ReportPublicationPage() {
	const publication = useReportPublication();

	if (!publication.semesters.data?.length) {
		return <Card>Belum ada semester untuk menampilkan publikasi rapor.</Card>;
	}

	return (
		<>
			<PageHeader
				eyebrow="Rapor"
				title="Publikasi & kirim rapor"
				description="Terbitkan rapor yang sudah disetujui sebagai versi final, lalu kirimkan tautannya kepada wali."
			/>
			{publication.notice ? (
				<p
					role="status"
					className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
				>
					{publication.notice}
				</p>
			) : null}
			{publication.error ? (
				<p
					role="alert"
					className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
				>
					{publication.error}
				</p>
			) : null}
			<label className="mb-5 block max-w-sm text-sm font-semibold text-slate-700">
				Semester
				<select
					value={publication.semesterId}
					onChange={(event) => publication.setSemesterId(event.target.value)}
					className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
				>
					{publication.semesters.data.map((semester) => (
						<option key={semester.id} value={semester.id}>
							{semester.name} · {semester.academic_year_name}
						</option>
					))}
				</select>
			</label>
			<PublicationReportList
				canPublish={publication.canPublish}
				counts={publication.counts}
				loading={publication.progress.isLoading}
				page={publication.page}
				pending={publication.publish.isPending}
				reports={publication.pagedReports}
				search={publication.search}
				status={publication.status}
				total={publication.filteredReports.length}
				onPageChange={publication.setPage}
				onPublish={(reportId) => publication.publish.mutate(reportId)}
				onSearchChange={publication.setSearch}
				onStatusChange={publication.setStatus}
			/>
		</>
	);
}
