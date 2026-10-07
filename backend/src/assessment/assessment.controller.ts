import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { defaultTkIndicatorCount, defaultTkTemplate, DEFAULT_TK_TEMPLATE_NAME } from "./default-tk-template";

const scoreSchema = z.object({ semesterId: z.string().uuid(), indicatorId: z.string().uuid(), scaleOptionId: z.string().uuid() });

@Controller("assessment")
export class AssessmentController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}

  @Post("frameworks/default")
  async bootstrap(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    return this.db.transaction(async (client) => {
      const existing = await client.query<{ id: string }>("SELECT id FROM assessment_frameworks WHERE name=$1 AND is_active=true LIMIT 1", [DEFAULT_TK_TEMPLATE_NAME]);
      if (existing.rowCount) return { id: existing.rows[0].id, created: false, indicatorCount: defaultTkIndicatorCount };

      await client.query("UPDATE assessment_frameworks SET is_active=false WHERE name=$1", [DEFAULT_TK_TEMPLATE_NAME]);
      const scale = (await client.query<{ id: string }>("INSERT INTO assessment_scales(school_id,name) VALUES($1,$2) RETURNING id", [actor.schoolId, "Skala Perkembangan TK"])).rows[0];
      for (const [position, code] of ["BB", "MB", "BSH", "BSB"].entries()) {
        await client.query("INSERT INTO assessment_scale_options(school_id,scale_id,code,label,position) VALUES($1,$2,$3,$4,$5)", [actor.schoolId, scale.id, code, code, position + 1]);
      }
      const framework = (await client.query<{ id: string }>("INSERT INTO assessment_frameworks(school_id,scale_id,name) VALUES($1,$2,$3) RETURNING id", [actor.schoolId, scale.id, DEFAULT_TK_TEMPLATE_NAME])).rows[0];

      for (const [areaPosition, area] of defaultTkTemplate.entries()) {
        const savedArea = (await client.query<{ id: string }>("INSERT INTO development_areas(school_id,framework_id,name,position) VALUES($1,$2,$3,$4) RETURNING id", [actor.schoolId, framework.id, area.name, areaPosition + 1])).rows[0];
        for (const [subAreaPosition, subArea] of area.subAreas.entries()) {
          const savedSubArea = (await client.query<{ id: string }>("INSERT INTO sub_areas(school_id,development_area_id,name,position) VALUES($1,$2,$3,$4) RETURNING id", [actor.schoolId, savedArea.id, subArea.name, subAreaPosition + 1])).rows[0];
          for (const [indicatorPosition, description] of subArea.indicators.entries()) {
            await client.query("INSERT INTO indicators(school_id,sub_area_id,description,position) VALUES($1,$2,$3,$4)", [actor.schoolId, savedSubArea.id, description, indicatorPosition + 1]);
          }
        }
      }

      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "assessment_framework.default_created", entityType: "assessment_framework", entityId: framework.id, metadata: { indicatorCount: defaultTkIndicatorCount } }, client);
      return { id: framework.id, created: true, indicatorCount: defaultTkIndicatorCount };
    }, actor.schoolId);
  }

  @Get("students/:studentId")
  async workspace(@Req() request: FastifyRequest, @Param("studentId") studentId: string, @Query("semesterId") semesterId: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      await this.assertTeacherAssignment(client, actor.role, actor.userId, studentId, semesterId);
      const student = (await client.query<{ id: string; name: string }>("SELECT id,name FROM students WHERE id=$1 AND school_id=$2", [studentId, actor.schoolId])).rows[0];
      if (!student) return null;
      const scales = (await client.query("SELECT o.id,o.code,o.label,o.position FROM assessment_scale_options o JOIN assessment_frameworks f ON f.scale_id=o.scale_id WHERE f.name=$1 AND f.is_active ORDER BY o.position", [DEFAULT_TK_TEMPLATE_NAME])).rows;
      const indicators = (await client.query(`SELECT da.id AS area_id,da.name AS area_name,sa.id AS sub_area_id,sa.name AS sub_area_name,i.id,i.description,ass.scale_option_id
        FROM indicators i JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id
        LEFT JOIN student_assessments ass ON ass.indicator_id=i.id AND ass.student_id=$1 AND ass.semester_id=$2
        WHERE f.name=$3 AND f.is_active ORDER BY da.position,sa.position,i.position`, [studentId, semesterId, DEFAULT_TK_TEMPLATE_NAME])).rows;
      return { student, scales, indicators };
    }, actor.schoolId);
  }

  @Post("students/:studentId")
  async save(@Req() request: FastifyRequest, @Param("studentId") studentId: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = scoreSchema.parse(body);
    return this.db.transaction(async (client) => {
      await this.assertTeacherAssignment(client, actor.role, actor.userId, studentId, input.semesterId);
      const valid = await client.query(`SELECT 1 FROM students s JOIN semesters sem ON sem.id=$2
        WHERE s.id=$1 AND EXISTS (SELECT 1 FROM indicators i JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id WHERE i.id=$3 AND f.name=$4 AND f.is_active)
        AND EXISTS (SELECT 1 FROM assessment_scale_options o JOIN assessment_frameworks f ON f.scale_id=o.scale_id WHERE o.id=$5 AND f.name=$4 AND f.is_active)`, [studentId, input.semesterId, input.indicatorId, DEFAULT_TK_TEMPLATE_NAME, input.scaleOptionId]);
      if (!valid.rowCount) throw new Error("Indikator, skala, murid, atau semester tidak ditemukan");
      const saved = (await client.query(`INSERT INTO student_assessments(school_id,student_id,semester_id,indicator_id,scale_option_id,assessed_by)
        VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(student_id,semester_id,indicator_id) DO UPDATE SET scale_option_id=EXCLUDED.scale_option_id,assessed_by=EXCLUDED.assessed_by,assessed_at=now() RETURNING *`, [actor.schoolId, studentId, input.semesterId, input.indicatorId, input.scaleOptionId, actor.userId])).rows[0];
      await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student_assessment.saved", entityType: "student_assessment", entityId: saved.id }, client);
      return saved;
    }, actor.schoolId);
  }

  private async assertTeacherAssignment(client: { query: Function }, role: string, userId: string, studentId: string, semesterId: string) {
    if (role !== "TEACHER") return;
    const assignment = await client.query(`SELECT 1 FROM student_enrollments enrollment
      JOIN semesters semester ON semester.id=$2 AND semester.academic_year_id=enrollment.academic_year_id
      JOIN teacher_class_assignments homeroom ON homeroom.class_period_id=enrollment.class_period_id AND homeroom.ended_at IS NULL
      WHERE enrollment.student_id=$1 AND enrollment.status='ACTIVE' AND homeroom.teacher_user_id=$3`, [studentId, semesterId, userId]);
    if (!assignment.rowCount) throw new ForbiddenException("Anda bukan wali kelas untuk murid pada semester ini.");
  }
}
