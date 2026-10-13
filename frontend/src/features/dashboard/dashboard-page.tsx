import { DashboardHero } from "./components/dashboard-hero";
import { DashboardStatGrid } from "./components/dashboard-stat-grid";
import { SemesterPreparationCard } from "./components/semester-preparation-card";
import { WorkspaceStatusCard } from "./components/workspace-status-card";

export function DashboardPage() {
	return (
		<>
			<DashboardHero />
			<DashboardStatGrid />
			<div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
				<SemesterPreparationCard />
				<WorkspaceStatusCard />
			</div>
		</>
	);
}
