import { PublishedReportPage } from "@/features/reports/published-report-page";

export function generateStaticParams() {
	return [{ id: "demo-report" }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <PublishedReportPage id={id} />;
}
