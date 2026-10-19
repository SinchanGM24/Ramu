import { PublishedReportPage } from "@/features/reports/published-report-page";
import { demoParentProfiles } from "@/lib/demo-parent-reports";

export function generateStaticParams() {
	return [
		{ id: "demo-report" },
		...demoParentProfiles.map((profile) => ({ id: profile.reportId })),
	];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <PublishedReportPage id={id} />;
}
