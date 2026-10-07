import { ReportPreviewPage } from "@/features/reports/report-preview-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportPreviewPage id={id} />;
}
