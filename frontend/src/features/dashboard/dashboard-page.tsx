"use client";

import { DashboardHero } from "./components/dashboard-hero";
import { DashboardStatGrid } from "./components/dashboard-stat-grid";
import { SemesterPreparationCard } from "./components/semester-preparation-card";
import { WorkspaceStatusCard } from "./components/workspace-status-card";
import { useDashboardSummary } from "./hooks/use-dashboard-summary";

export function DashboardPage() {
	const summary = useDashboardSummary();
	const data = summary.data;

	return (
		<>
			<DashboardHero schoolName={data?.schoolName} semesterName={data?.semesterName} />
			{summary.isError ? (
				<p
					role="alert"
					className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					Ringkasan dashboard belum dapat dimuat. Coba muat ulang halaman.
				</p>
			) : null}
			<DashboardStatGrid stats={data?.stats} loading={summary.isLoading} />
			<div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
				<SemesterPreparationCard role={data?.role} />
				<WorkspaceStatusCard role={data?.role} academicYearName={data?.academicYearName} />
			</div>
		</>
	);
}
