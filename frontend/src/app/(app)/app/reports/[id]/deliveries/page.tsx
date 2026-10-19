import { ReportDeliveriesPage } from "@/features/reports/deliveries/report-deliveries-page";
import { demoParentProfiles } from "@/lib/demo-parent-reports";

export function generateStaticParams() {
	return [
		{ id: "demo-report" },
		...demoParentProfiles.map((profile) => ({ id: profile.reportId })),
	];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <ReportDeliveriesPage reportId={id} />;
}
