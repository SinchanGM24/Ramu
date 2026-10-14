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
				<p
					role="alert"
					className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
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
		<Card className="max-w-xl space-y-3 border-dashed">
			<h2 className="font-bold text-[#17251b]">Tahun ajaran belum tersedia</h2>
			<p className="text-sm leading-6 text-[#637065]">
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
		<Card className="mb-6 flex flex-col gap-4 bg-[linear-gradient(112deg,#f4f7ed_0%,#fffdf8_60%,#eef5ec_100%)] sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
					Konteks pengisian
				</p>
				<p className="mt-1 text-sm leading-6 text-[#637065]">
					Pilih semester untuk melihat status rapor murid.
				</p>
			</div>
			<label className="block text-sm font-semibold text-[#35443a]">
				Semester
				<select
					value={semesterId}
					onChange={(event) => onChange(event.target.value)}
					className="mt-2 block w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] px-3 py-2.5 text-sm text-[#17251b] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-80"
				>
					{semesters.map((semester) => (
						<option key={semester.id} value={semester.id}>
							{semester.name} · {semester.academic_year_name}
						</option>
					))}
				</select>
			</label>
		</Card>
	);
}
