import { ReportEditorPage } from "@/features/reports/report-editor-page";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ReportEditorPage id={id}/>}
