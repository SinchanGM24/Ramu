import { DEFAULT_TK_TEMPLATE_NAME } from "../assessment/default-tk-template";

type QueryClient = { query: <T = any>(text: string, values?: unknown[]) => Promise<{ rows: T[] }> };

export type ReportCompleteness = {
  complete: boolean;
  missingAssessments: string[];
  missingNarratives: string[];
  missingSemesterData: boolean;
};

export async function getReportCompleteness(
  client: QueryClient,
  report: { id: string; studentId: string; semesterId: string; schoolId: string },
): Promise<ReportCompleteness> {
  const missingAssessments = (await client.query<{ description: string }>(`SELECT i.description
    FROM indicators i
    JOIN sub_areas sa ON sa.id=i.sub_area_id AND sa.school_id=$4
    JOIN development_areas da ON da.id=sa.development_area_id AND da.school_id=$4
    JOIN assessment_frameworks f ON f.id=da.framework_id AND f.school_id=$4
    LEFT JOIN student_assessments assessment ON assessment.indicator_id=i.id AND assessment.student_id=$1 AND assessment.semester_id=$2 AND assessment.school_id=$4
    WHERE i.school_id=$4 AND f.name=$3 AND f.is_active AND assessment.id IS NULL
    ORDER BY da.position,sa.position,i.position`, [report.studentId, report.semesterId, DEFAULT_TK_TEMPLATE_NAME, report.schoolId])).rows.map((row) => row.description);
  const missingNarratives = (await client.query<{ name: string }>(`SELECT da.name
    FROM development_areas da
    JOIN assessment_frameworks f ON f.id=da.framework_id AND f.school_id=$3
    LEFT JOIN report_narratives narrative ON narrative.development_area_id=da.id AND narrative.report_id=$1 AND narrative.school_id=$3
    WHERE da.school_id=$3 AND f.name=$2 AND f.is_active AND (narrative.id IS NULL OR btrim(narrative.content)='')
    ORDER BY da.position`, [report.id, DEFAULT_TK_TEMPLATE_NAME, report.schoolId])).rows.map((row) => row.name);
  const semesterData = (await client.query<{ ready: boolean }>(`SELECT
    EXISTS(SELECT 1 FROM growth_records WHERE student_id=$1 AND semester_id=$2 AND school_id=$3)
    AND EXISTS(SELECT 1 FROM attendance_summaries WHERE student_id=$1 AND semester_id=$2 AND school_id=$3) AS ready`, [report.studentId, report.semesterId, report.schoolId])).rows[0].ready;
  return { complete: missingAssessments.length === 0 && missingNarratives.length === 0 && semesterData, missingAssessments, missingNarratives, missingSemesterData: !semesterData };
}

export function completenessError(completeness: ReportCompleteness) {
  const missing: string[] = [];
  if (completeness.missingAssessments.length) missing.push("penilaian indikator");
  if (completeness.missingNarratives.length) missing.push("narasi perkembangan");
  if (completeness.missingSemesterData) missing.push("data pertumbuhan dan kehadiran");
  return `Rapor belum lengkap. Lengkapi ${missing.join(", ")} sebelum melanjutkan.`;
}
