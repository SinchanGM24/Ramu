import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { DEFAULT_TK_TEMPLATE_NAME } from "./default-tk-template";
import { ensureDefaultTkFramework } from "./ensure-default-tk-framework";

const scoreSchema = z.object({
  semesterId: z.string().uuid(),
  indicatorId: z.string().uuid(),
  scaleOptionId: z.string().uuid(),
});

@Controller("assessment")
export class AssessmentController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  @Get("students/:studentId")
  async workspace(
    @Req() request: FastifyRequest,
    @Param("studentId") studentId: string,
    @Query("semesterId") semesterId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    return this.db.transaction(async (client) => {
      await ensureDefaultTkFramework(client, actor.schoolId);
      await this.assertTeacherAssignment(
        client,
        actor.role,
        actor.userId,
        studentId,
        semesterId,
      );
      const student = (
        await client.query<{ id: string; name: string }>(
          "SELECT id,name FROM students WHERE id=$1 AND school_id=$2",
          [studentId, actor.schoolId],
        )
      ).rows[0];
      if (!student) return null;
      const scales = (
        await client.query(
          "SELECT o.id,o.code,o.label,o.position FROM assessment_scale_options o JOIN assessment_frameworks f ON f.scale_id=o.scale_id WHERE f.name=$1 AND f.is_active ORDER BY o.position",
          [DEFAULT_TK_TEMPLATE_NAME],
        )
      ).rows;
      const indicators = (
        await client.query(
          `SELECT da.id AS area_id,da.name AS area_name,sa.id AS sub_area_id,sa.name AS sub_area_name,i.id,i.description,ass.scale_option_id
        FROM indicators i JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id
        LEFT JOIN student_assessments ass ON ass.indicator_id=i.id AND ass.student_id=$1 AND ass.semester_id=$2
        WHERE f.name=$3 AND f.is_active ORDER BY da.position,sa.position,i.position`,
          [studentId, semesterId, DEFAULT_TK_TEMPLATE_NAME],
        )
      ).rows;
      return { student, scales, indicators };
    }, actor.schoolId);
  }

  @Post("students/:studentId")
  async save(
    @Req() request: FastifyRequest,
    @Param("studentId") studentId: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = scoreSchema.parse(body);
    return this.db.transaction(async (client) => {
      await this.assertTeacherAssignment(
        client,
        actor.role,
        actor.userId,
        studentId,
        input.semesterId,
      );
      const valid = await client.query(
        `SELECT 1 FROM students s JOIN semesters sem ON sem.id=$2
        WHERE s.id=$1 AND EXISTS (SELECT 1 FROM indicators i JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id WHERE i.id=$3 AND f.name=$4 AND f.is_active)
        AND EXISTS (SELECT 1 FROM assessment_scale_options o JOIN assessment_frameworks f ON f.scale_id=o.scale_id WHERE o.id=$5 AND f.name=$4 AND f.is_active)`,
        [
          studentId,
          input.semesterId,
          input.indicatorId,
          DEFAULT_TK_TEMPLATE_NAME,
          input.scaleOptionId,
        ],
      );
      if (!valid.rowCount)
        throw new Error(
          "Indikator, skala, murid, atau semester tidak ditemukan",
        );
      const saved = (
        await client.query(
          `INSERT INTO student_assessments(school_id,student_id,semester_id,indicator_id,scale_option_id,assessed_by)
        VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(student_id,semester_id,indicator_id) DO UPDATE SET scale_option_id=EXCLUDED.scale_option_id,assessed_by=EXCLUDED.assessed_by,assessed_at=now() RETURNING *`,
          [
            actor.schoolId,
            studentId,
            input.semesterId,
            input.indicatorId,
            input.scaleOptionId,
            actor.userId,
          ],
        )
      ).rows[0];
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "student_assessment.saved",
          entityType: "student_assessment",
          entityId: saved.id,
        },
        client,
      );
      return saved;
    }, actor.schoolId);
  }

  private async assertTeacherAssignment(
    client: { query: Function },
    role: string,
    userId: string,
    studentId: string,
    semesterId: string,
  ) {
    if (role !== "TEACHER") return;
    const assignment = await client.query(
      `SELECT 1 FROM student_enrollments enrollment
      JOIN semesters semester ON semester.id=$2 AND semester.academic_year_id=enrollment.academic_year_id
      JOIN teacher_class_assignments assignment ON assignment.class_period_id=enrollment.class_period_id AND assignment.ended_at IS NULL
      WHERE enrollment.student_id=$1 AND enrollment.status='ACTIVE' AND assignment.teacher_user_id=$3`,
      [studentId, semesterId, userId],
    );
    if (!assignment.rowCount)
      throw new ForbiddenException(
        "Anda tidak ditugaskan pada kelas murid di semester ini.",
      );
  }
}
