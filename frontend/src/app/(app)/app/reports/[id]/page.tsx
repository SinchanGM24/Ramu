import { ReportCompletenessPanel } from "@/features/reports/report-completeness-panel";
import { ReportEditorPage } from "@/features/reports/report-editor-page";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <><ReportCompletenessPanel reportId={id}/><ReportEditorPage id={id}/></>}
