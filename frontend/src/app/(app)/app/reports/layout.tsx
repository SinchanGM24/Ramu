import type { ReactNode } from "react";
import { ReportWorkflowNavigation } from "@/features/reports/components/report-workflow-navigation";

export default function ReportsLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<ReportWorkflowNavigation />
			{children}
		</>
	);
}
