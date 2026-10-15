"use client";

import { GraduationDialog } from "./components/graduation-dialog";
import { LifecycleFeedback } from "./components/lifecycle-feedback";
import { LifecycleHeader } from "./components/lifecycle-header";
import { LifecycleTabs } from "./components/lifecycle-tabs";
import { PrincipalProposalQueue } from "./components/principal-proposal-queue";
import { SelectedStudentsActionBar } from "./components/selected-students-action-bar";
import { StudentSelectionFilters } from "./components/student-selection-filters";
import { StudentSelectionTable } from "./components/student-selection-table";
import { TeacherProposalList } from "./components/teacher-proposal-list";
import { TransferDialog } from "./components/transfer-dialog";
import { useLifecyclePage } from "./hooks/use-lifecycle-page";

export function LifecyclePage() {
	const page = useLifecyclePage();
	if (page.isPrincipal)
		return (
			<PrincipalProposalQueue
				proposals={page.proposals.data ?? []}
				loading={page.proposals.isLoading}
				pending={page.decide.isPending}
				onDecide={(id, decision, note) => page.decide.mutate({ id, decision, note })}
			/>
		);

	return (
		<>
			<LifecycleHeader isTeacher={Boolean(page.isTeacher)} />
			<LifecycleFeedback error={page.error} notice={page.notice} />
			{page.isTeacher ? (
				<TeacherProposalList
					proposals={page.proposals.data ?? []}
					loading={page.proposals.isLoading}
					onResubmit={page.startResubmission}
				/>
			) : null}
			<LifecycleTabs mode={page.mode} onChange={page.switchMode} />
			<StudentSelectionFilters
				classes={page.directory.classes}
				classFilter={page.directory.classFilter}
				search={page.directory.search}
				onClassFilterChange={page.directory.setClassFilter}
				onSearchChange={page.directory.setSearch}
			/>
			<StudentSelectionTable
				students={page.directory.active}
				selectedIds={page.directory.chosen}
				allSelected={page.directory.allFiltered}
				mode={page.mode}
				onToggle={page.directory.toggle}
				onToggleAll={page.directory.toggleAll}
			/>
			<SelectedStudentsActionBar
				count={page.directory.selected.length}
				mode={page.mode}
				onClear={() => page.directory.setChosen([])}
				onOpen={() => {
					page.setError("");
					page.setResubmission(null);
					page.setActionOpen(true);
				}}
			/>
			{page.isActionOpen &&
				(page.mode === "transfer" ? (
					<TransferDialog
						key={page.resubmission?.id ?? "new-transfer"}
						students={page.directory.selected}
						initialProposal={page.resubmission}
						onClose={() => {
							page.setActionOpen(false);
							page.setResubmission(null);
						}}
						onSuccess={page.completeAction}
						onError={page.setError}
						isTeacher={Boolean(page.isTeacher)}
					/>
				) : (
					<GraduationDialog
						key={page.resubmission?.id ?? "new-graduation"}
						students={page.directory.selected}
						initialProposal={page.resubmission}
						onClose={() => {
							page.setActionOpen(false);
							page.setResubmission(null);
						}}
						onSuccess={page.completeAction}
						onError={page.setError}
						isTeacher={Boolean(page.isTeacher)}
					/>
				))}
		</>
	);
}
