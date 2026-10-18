import { ParentReportViewer } from "@/features/reports/parent/parent-report-viewer";
export function generateStaticParams() {
	return [{ token: "demo-parent" }, { token: "demo-parent-bima" }, { token: "demo-parent-citra" }];
}
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	return <ParentReportViewer token={token} />;
}
