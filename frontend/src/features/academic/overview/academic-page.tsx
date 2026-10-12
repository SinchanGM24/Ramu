"use client";

import { AcademicFeedback } from "./components/academic-feedback";
import { AcademicHeader } from "./components/academic-header";
import { ActiveYearCard } from "./components/active-year-card";
import { ClassFormModal } from "./components/class-form-modal";
import { ClassManagementDialog } from "./components/class-management-dialog";
import { ClassTable } from "./components/class-table";
import { YearFormModal } from "./components/year-form-modal";
import { YearSwitchModal } from "./components/year-switch-modal";
import { useAcademicPage } from "./hooks/use-academic-page";

export function AcademicPage() {
	const page = useAcademicPage();
	const activeYear = page.years.activeYear;

	return (
		<>
			<AcademicHeader onAddYear={() => page.setYearFormOpen(true)} />
			<AcademicFeedback error={page.error} notice={page.notice} />
			<ActiveYearCard
				activeYear={activeYear}
				onCreate={() => page.setYearFormOpen(true)}
				onChange={() => page.setYearSwitchOpen(true)}
			/>
			<ClassTable
				periods={page.periods.data}
				activeYearName={activeYear?.name}
				hasActiveYear={Boolean(activeYear)}
				onAdd={() => page.setClassFormOpen(true)}
				onManage={page.setManagedPeriod}
			/>
			{page.isYearFormOpen && (
				<YearFormModal onClose={() => page.setYearFormOpen(false)} onSubmit={page.submitYear} />
			)}
			{page.isClassFormOpen && activeYear && (
				<ClassFormModal
					yearName={activeYear.name}
					onClose={() => page.setClassFormOpen(false)}
					onSubmit={page.submitClass}
				/>
			)}
			{page.isYearSwitchOpen && (
				<YearSwitchModal
					years={page.years.data || []}
					activeId={activeYear?.id}
					onActivate={page.activateYear}
					onClose={() => page.setYearSwitchOpen(false)}
				/>
			)}
			{page.managedPeriod && (
				<ClassManagementDialog
					period={page.managedPeriod}
					onClose={() => page.setManagedPeriod(null)}
				/>
			)}
		</>
	);
}
