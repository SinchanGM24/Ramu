import { ParentReportViewer } from "@/features/reports/parent-report-viewer";
export function generateStaticParams(){return [{token:"demo-parent"}]}
export default async function Page({params}:{params:Promise<{token:string}>}){const {token}=await params;return <ParentReportViewer token={token}/>}
