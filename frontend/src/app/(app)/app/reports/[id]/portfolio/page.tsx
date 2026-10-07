import { ReportPortfolioPage } from "@/features/reports/report-portfolio-page";
export function generateStaticParams(){return [{id:"demo-report"}]}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportPortfolioPage reportId={id} />;
}
