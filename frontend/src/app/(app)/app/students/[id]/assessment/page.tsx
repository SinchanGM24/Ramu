import { AssessmentWorkspace } from "@/features/assessment/assessment-workspace";
export function generateStaticParams(){return [{id:"demo-student"}]}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AssessmentWorkspace studentId={id}/>}
