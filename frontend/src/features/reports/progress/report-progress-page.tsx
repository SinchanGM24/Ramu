"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportProgressList } from "./components/report-progress-list";
import { ReportProgressSummary } from "./components/report-progress-summary";
import { useReportProgress } from "./hooks/use-report-progress";

export function ReportProgressPage() {
	const progress = useReportProgress();
	if (!progress.semesters.data?.length) return <EmptyAcademicYear />;
	return (
		<>
			<PageHeader
				eyebrow="Rapor"
				title="Pengisian rapor"
				description="Buat, lengkapi, dan kirim rapor murid untuk ditinjau Kepala Sekolah."
			/>
			{progress.error ? (
				<p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
					{progress.error}
				</p>
			) : null}
			<SemesterContext
				semesterId={progress.semesterId}
				semesters={progress.semesters.data}
				onChange={progress.setSemesterId}
			/>
			<ReportProgressSummary counts={progress.counts} />
			<ReportProgressList
				counts={progress.counts}
				filter={progress.filter}
				items={progress.pagedItems}
				loading={progress.progress.isLoading}
				page={progress.page}
				search={progress.search}
				total={progress.filteredItems.length}
				onCreateDraft={(id) => void progress.createDraft(id)}
				onFilterChange={progress.setFilter}
				onPageChange={progress.setPage}
				onSearchChange={progress.setSearch}
			/>
		</>
	);
}

function EmptyAcademicYear() {
	return (
		<Card className="space-y-3">
			<h2 className="font-bold">Tahun ajaran belum tersedia</h2>
			<p className="text-sm text-slate-600">
				Buat tahun ajaran pada Data Akademik. Sistem akan menambahkan Semester I dan Semester II
				secara otomatis.
			</p>
			<Link href="/app/academic">
				<Button>Buat tahun ajaran</Button>
			</Link>
		</Card>
	);
}
function SemesterContext({
	semesterId,
	semesters,
	onChange,
}: {
	semesterId: string;
	semesters: { id: string; name: string; academic_year_name: string }[];
	onChange: (id: string) => void;
}) {
	return (
		<Card className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<label className="block text-sm font-semibold text-slate-700">
				Semester
				<select
					value={semesterId}
					onChange={(event) => onChange(event.target.value)}
					className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:w-80"
				>
					{semesters.map((semester) => (
						<option key={semester.id} value={semester.id}>
							{semester.name} · {semester.academic_year_name}
						</option>
					))}
				</select>
			</label>
			<p className="text-sm text-slate-500">Pilih semester untuk melihat status rapor murid.</p>
		</Card>
	);
}
