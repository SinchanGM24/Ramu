import { ReportDeliveriesPage } from "@/features/reports/report-deliveries-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportDeliveriesPage reportId={id} />;
}
