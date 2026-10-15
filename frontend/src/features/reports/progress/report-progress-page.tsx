"use client";

import Link from "next/link";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportProgressList } from "./components/report-progress-list";
import { ReportProgressSummary } from "./components/report-progress-summary";
import { SemesterContextCard } from "./components/semester-context-card";
import { useReportProgress } from "./hooks/use-report-progress";

export function ReportProgressPage() {
	const progress = useReportProgress();

	if (progress.activeSemester.isLoading) {
		return <LoadingState label="Memuat konteks semester..." />;
	}
	if (progress.activeSemester.isError) {
		return <SemesterLoadError onRetry={() => void progress.activeSemester.refetch()} />;
	}
	if (!progress.activeSemester.data) return <EmptyAcademicContext />;

	return (
		<>
			<PageHeader
				eyebrow="Raport"
				title="Pengisian raport"
				description="Buat, lengkapi, dan kirim raport murid untuk ditinjau Kepala Sekolah."
			/>
			{progress.error ? (
				<p
					role="alert"
					className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{progress.error}
				</p>
			) : null}
			<SemesterContextCard semester={progress.activeSemester.data} />
			<ReportProgressSummary counts={progress.counts} />
			<ReportProgressList
				counts={progress.counts}
				items={progress.pagedItems}
				loading={progress.progress.isLoading}
				page={progress.page}
				search={progress.search}
				total={progress.filteredItems.length}
				onCreateDraft={(id) => void progress.createDraft(id)}
				onPageChange={progress.setPage}
				onSearchChange={progress.setSearch}
			/>
		</>
	);
}

function SemesterLoadError({ onRetry }: { onRetry: () => void }) {
	return (
		<Card className="max-w-xl border-red-200 bg-red-50">
			<h2 className="font-bold text-red-900">Konteks semester tidak dapat dimuat</h2>
			<p className="mt-2 text-sm leading-6 text-red-800">
				Coba lagi untuk membuka daftar raport yang perlu diisi.
			</p>
			<Button className="mt-4" variant="secondary" onClick={onRetry}>
				Coba lagi
			</Button>
		</Card>
	);
}

function EmptyAcademicContext() {
	return (
		<Card className="max-w-xl space-y-3 border-dashed">
			<h2 className="font-bold text-[#17251b]">Semester aktif belum dipilih</h2>
			<p className="text-sm leading-6 text-[#637065]">
				Admin Sekolah perlu memilih tahun ajaran dan semester aktif pada Data Akademik.
			</p>
			<Link href="/app/academic">
				<Button>Buka Data Akademik</Button>
			</Link>
		</Card>
	);
}
