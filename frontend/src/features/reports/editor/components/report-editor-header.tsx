import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { reportPreviewHref } from "@/features/reports/utils/report-navigation";
import type { ReportWorkspace } from "../types";

type ReportEditorHeaderProps = { reportId: string; report: ReportWorkspace["report"] };

export function ReportEditorHeader({ reportId, report }: ReportEditorHeaderProps) {
	return (
		<PageHeader
			eyebrow="Editor raport"
			title={report.student_name}
			description={`${report.class_name || "Kelas belum diatur"} · ${report.semester_name} · ${report.academic_year_name}`}
			action={
				<Link href={reportPreviewHref(reportId, "editor")}>
					<Button variant="secondary">Pratinjau formal</Button>
				</Link>
			}
		/>
	);
}
