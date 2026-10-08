import { Body, Controller, Get, Param, Post, Put, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { DEFAULT_TK_TEMPLATE_NAME } from "../assessment/default-tk-template";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { assertReportAccess } from "./report-authorization";
import { buildNarrativeDraft, SMART_NARRATIVE_ENGINE_VERSION } from "./narrative-generator";

const narrativeSchema = z.object({ content: z.string().max(5000) });

@Controller("reports")
export class ReportWorkspaceController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}

  @Get(":id/workspace")
  async workspace(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      const report = (await client.query(`SELECT r.id,r.status,s.id AS student_id,s.name AS student_name,s.nickname,s.student_number,s.birth_date,s.birth_place,s.gender,s.religion,s.child_order,s.address,grouping.name AS class_name,sem.id AS semester_id,sem.name AS semester_name,ay.name AS academic_year_name
        FROM reports r JOIN students s ON s.id=r.student_id LEFT JOIN student_enrollments enrollment ON enrollment.id=r.student_enrollment_id LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id JOIN semesters sem ON sem.id=r.semester_id JOIN academic_years ay ON ay.id=sem.academic_year_id WHERE r.id=$1`, [id])).rows[0];
      if (!report) return null;
      await assertReportAccess(client, actor, id);
      const scales = (await client.query(`SELECT o.id,o.code,o.label,o.position FROM assessment_scale_options o JOIN assessment_frameworks f ON f.scale_id=o.scale_id WHERE f.name=$1 AND f.is_active ORDER BY o.position`, [DEFAULT_TK_TEMPLATE_NAME])).rows;
      const rows = (await client.query(`SELECT da.id AS area_id,da.name AS area_name,da.position AS area_position,rn.content AS narrative,sa.id AS sub_area_id,sa.name AS sub_area_name,sa.position AS sub_area_position,i.id AS indicator_id,i.description,i.position AS indicator_position,assessment.scale_option_id,assessment.assessed_at,option.code AS scale_code
        FROM development_areas da JOIN assessment_frameworks f ON f.id=da.framework_id JOIN sub_areas sa ON sa.development_area_id=da.id JOIN indicators i ON i.sub_area_id=sa.id
        LEFT JOIN report_narratives rn ON rn.report_id=$1 AND rn.development_area_id=da.id
        LEFT JOIN student_assessments assessment ON assessment.indicator_id=i.id AND assessment.student_id=$2 AND assessment.semester_id=$3
        LEFT JOIN assessment_scale_options option ON option.id=assessment.scale_option_id
        WHERE f.name=$4 AND f.is_active ORDER BY da.position,sa.position,i.position`, [id, report.student_id, report.semester_id, DEFAULT_TK_TEMPLATE_NAME])).rows;
      const latestGenerations = (await client.query<{ development_area_id: string; content: string; created_at: string; engine_version: string }>(`SELECT DISTINCT ON (development_area_id) development_area_id,content,created_at,engine_version
        FROM report_narrative_generations WHERE report_id=$1 ORDER BY development_area_id,created_at DESC`, [id])).rows;
      const generationsByArea = new Map(latestGenerations.map((generation) => [generation.development_area_id, generation]));
      const areas = new Map<string, any>();
      for (const row of rows) {
        if (!areas.has(row.area_id)) areas.set(row.area_id, { id: row.area_id, name: row.area_name, narrative: row.narrative ?? "", latestAssessmentAt: row.assessed_at ?? null, subAreas: new Map<string, any>() });
        const area = areas.get(row.area_id);
        if (row.assessed_at && (!area.latestAssessmentAt || new Date(row.assessed_at) > new Date(area.latestAssessmentAt))) area.latestAssessmentAt = row.assessed_at;
        if (!area.subAreas.has(row.sub_area_id)) area.subAreas.set(row.sub_area_id, { id: row.sub_area_id, name: row.sub_area_name, indicators: [] });
        area.subAreas.get(row.sub_area_id).indicators.push({ id: row.indicator_id, description: row.description, scaleOptionId: row.scale_option_id, scaleCode: row.scale_code });
      }
      const structuredAreas = [...areas.values()].map((area) => {
        const generation = generationsByArea.get(area.id);
        const narrativeIsGenerated = generation?.content === area.narrative;
        const narrativeStale = Boolean(narrativeIsGenerated && generation && (generation.engine_version !== SMART_NARRATIVE_ENGINE_VERSION || (area.latestAssessmentAt && new Date(area.latestAssessmentAt) > new Date(generation.created_at))));
        return { ...area, latestAssessmentAt: undefined, narrativeStale, subAreas: [...area.subAreas.values()] };
      });
      const growth = (await client.query("SELECT weight_kg,height_cm,head_circumference_cm FROM growth_records WHERE student_id=$1 AND semester_id=$2", [report.student_id, report.semester_id])).rows[0] ?? null;
      const attendance = (await client.query("SELECT sick_days,permission_days,unexcused_days FROM attendance_summaries WHERE student_id=$1 AND semester_id=$2", [report.student_id, report.semester_id])).rows[0] ?? null;
      const guardians = (await client.query("SELECT name,relationship,phone,occupation,is_primary FROM guardian_contacts WHERE student_id=$1 ORDER BY is_primary DESC,name", [report.student_id])).rows;
      return { report, scales, areas: structuredAreas, growth, attendance, guardians };
    }, actor.schoolId);
  }

  @Put(":id/workspace/narratives/:areaId")
  async saveNarrative(@Req() request: FastifyRequest, @Param("id") id: string, @Param("areaId") areaId: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = narrativeSchema.parse(body);
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ status: string }>("SELECT status FROM reports WHERE id=$1", [id])).rows[0];
      if (!report) throw new Error("Rapor tidak ditemukan");
      await assertReportAccess(client, actor, id);
      if (!["DRAFT", "REVISION_REQUIRED"].includes(report.status)) throw new Error("Rapor tidak dapat diubah pada status saat ini");
      const validArea = await client.query(`SELECT 1 FROM development_areas da JOIN assessment_frameworks f ON f.id=da.framework_id WHERE da.id=$1 AND f.name=$2 AND f.is_active`, [areaId, DEFAULT_TK_TEMPLATE_NAME]);
      if (!validArea.rowCount) throw new Error("Area perkembangan tidak valid");
      const content = input.content.trim();
      if (!content) {
        await client.query("DELETE FROM report_narratives WHERE report_id=$1 AND development_area_id=$2", [id, areaId]);
        await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report_narrative.cleared", entityType: "report", entityId: id, metadata: { areaId } }, client);
        return { content: "" };
      }
      const saved = (await client.query(`INSERT INTO report_narratives(school_id,report_id,development_area_id,content,updated_by) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(report_id,development_area_id) DO UPDATE SET content=EXCLUDED.content,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`, [actor.schoolId, id, areaId, content, actor.userId])).rows[0];
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report_narrative.saved", entityType: "report_narrative", entityId: saved.id }, client);
      return saved;
    }, actor.schoolId);
  }

  @Post(":id/workspace/narratives/:areaId/generate")
  async generateNarrative(@Req() request: FastifyRequest, @Param("id") id: string, @Param("areaId") areaId: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ student_id: string; semester_id: string; status: string; student_name: string; nickname: string | null }>(`SELECT r.student_id,r.semester_id,r.status,s.name AS student_name,s.nickname FROM reports r JOIN students s ON s.id=r.student_id WHERE r.id=$1`, [id])).rows[0];
      if (!report) throw new Error("Rapor tidak ditemukan");
      await assertReportAccess(client, actor, id);
      if (!["DRAFT", "REVISION_REQUIRED"].includes(report.status)) throw new Error("Rapor tidak dapat diubah pada status saat ini");
      const area = (await client.query<{ name: string }>(`SELECT da.name FROM development_areas da JOIN assessment_frameworks f ON f.id=da.framework_id WHERE da.id=$1 AND f.name=$2 AND f.is_active`, [areaId, DEFAULT_TK_TEMPLATE_NAME])).rows[0];
      if (!area) throw new Error("Area perkembangan tidak valid");
      const rows = (await client.query<{ id: string; description: string; code: string | null; semantic_group: string | null; narrative_label: string | null; observation_type: "SKILL" | "SAFETY" | "MEASUREMENT" | null; recommendation_tags: string[] | null; metadata_version: number | null }>(`SELECT i.id,i.description,option.code,metadata.semantic_group,metadata.narrative_label,metadata.observation_type,metadata.recommendation_tags,metadata.metadata_version
        FROM development_areas da JOIN assessment_frameworks f ON f.id=da.framework_id JOIN sub_areas sa ON sa.development_area_id=da.id JOIN indicators i ON i.sub_area_id=sa.id
        LEFT JOIN student_assessments assessment ON assessment.indicator_id=i.id AND assessment.student_id=$1 AND assessment.semester_id=$2
        LEFT JOIN assessment_scale_options option ON option.id=assessment.scale_option_id
        LEFT JOIN indicator_narrative_metadata metadata ON metadata.indicator_id=i.id
        WHERE da.id=$3 AND f.name=$4 AND f.is_active ORDER BY sa.position,i.position`, [report.student_id, report.semester_id, areaId, DEFAULT_TK_TEMPLATE_NAME])).rows;
      if (!rows.length) throw new Error("Area perkembangan tidak memiliki indikator");
      if (rows.some((row) => !row.code)) throw new Error("Lengkapi semua indikator pada area ini sebelum membuat draf narasi");
      const draft = buildNarrativeDraft({ studentId: report.student_id, semesterId: report.semester_id, areaId, studentName: report.student_name, nickname: report.nickname, areaName: area.name, assessments: rows.map((row) => ({ indicatorId: row.id, description: row.description, rating: row.code! as "BB" | "MB" | "BSH" | "BSB", semanticGroup: row.semantic_group, narrativeLabel: row.narrative_label, observationType: row.observation_type, recommendationTags: row.recommendation_tags, metadataVersion: row.metadata_version })) });
      if (!draft.content) throw new Error("Draf narasi tidak dapat dibuat dari data saat ini");
      const content = draft.content;
      const saved = (await client.query(`INSERT INTO report_narratives(school_id,report_id,development_area_id,content,updated_by) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(report_id,development_area_id) DO UPDATE SET content=EXCLUDED.content,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`, [actor.schoolId, id, areaId, content, actor.userId])).rows[0];
      const generation = (await client.query(`INSERT INTO report_narrative_generations(school_id,report_id,development_area_id,generated_by,engine_version,generation_signature,content,covered_indicator_ids,omitted_indicator_ids,validation_warnings) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [actor.schoolId, id, areaId, actor.userId, SMART_NARRATIVE_ENGINE_VERSION, draft.signature, content, draft.coveredIndicatorIds, draft.omittedIndicatorIds, JSON.stringify(draft.validationWarnings)])).rows[0];
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report_narrative.generated", entityType: "report_narrative", entityId: saved.id, metadata: { areaId, generationId: generation.id, warnings: draft.validationWarnings } }, client);
      return { content, generation: { id: generation.id, signature: draft.signature, warnings: draft.validationWarnings } };
    }, actor.schoolId);
  }

  @Post(":id/workspace/submit")
  async submit(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      const report = (await client.query<{ student_id: string; semester_id: string; status: string }>("SELECT student_id,semester_id,status FROM reports WHERE id=$1", [id])).rows[0];
      if (!report) throw new Error("Rapor tidak ditemukan");
      await assertReportAccess(client, actor, id);
      if (report.status !== "DRAFT") throw new Error("Hanya rapor draf yang dapat dikirim");
      const missing = (await client.query<{ count: number }>(`SELECT
        (SELECT count(*) FROM indicators i JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id LEFT JOIN student_assessments assessment ON assessment.indicator_id=i.id AND assessment.student_id=$1 AND assessment.semester_id=$2 WHERE f.name=$3 AND f.is_active AND assessment.id IS NULL)
        + (SELECT count(*) FROM development_areas da JOIN assessment_frameworks f ON f.id=da.framework_id LEFT JOIN report_narratives narrative ON narrative.report_id=$4 AND narrative.development_area_id=da.id WHERE f.name=$3 AND f.is_active AND (narrative.id IS NULL OR btrim(narrative.content)=''))
        + CASE WHEN EXISTS(SELECT 1 FROM growth_records WHERE student_id=$1 AND semester_id=$2) AND EXISTS(SELECT 1 FROM attendance_summaries WHERE student_id=$1 AND semester_id=$2) THEN 0 ELSE 1 END AS count`, [report.student_id, report.semester_id, DEFAULT_TK_TEMPLATE_NAME, id])).rows[0].count;
      if (Number(missing)) throw new Error("Rapor belum lengkap. Lengkapi penilaian, narasi, pertumbuhan, dan kehadiran.");
      const saved = (await client.query("UPDATE reports SET status='SUBMITTED',submitted_at=now(),updated_at=now() WHERE id=$1 RETURNING *", [id])).rows[0];
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "report.submitted", entityType: "report", entityId: id }, client);
      return saved;
    }, actor.schoolId);
  }
}
