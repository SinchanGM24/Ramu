import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  OnModuleInit,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { createHash, randomBytes, randomInt } from "crypto";
import { z } from "zod";
import { DEFAULT_TK_TEMPLATE_NAME } from "../assessment/default-tk-template";
import { assertTeacherActiveSemester } from "../academic/active-semester";
import { AuthService, type AuthContext } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { ReportPdfService } from "../files/report-pdf.service";
import { ReportPublicationJobsService } from "./report-publication-jobs.service";
import { assertReportAccess } from "./report-authorization";
import {
  completenessError,
  getReportCompleteness,
} from "./report-completeness";

const transition = z
  .object({
    action: z.enum(["submit", "review", "revision", "approve"]),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((input) => input.action !== "submit", {
    message: "Gunakan pemeriksaan kelengkapan raport sebelum mengirim",
  })
  .refine((input) => input.action !== "revision" || Boolean(input.note), {
    message: "Alasan revisi wajib diisi",
  });
const reportAssessment = z.object({ scaleOptionId: z.string().uuid() });
const publicationJobInput = z.object({
  reportIds: z.array(z.string().uuid()).min(1).max(100),
  semesterId: z.string().uuid().optional(),
});
const progressQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).default(""),
  view: z.enum(["ALL", "EDITOR", "PUBLICATION"]).default("ALL"),
  deliveryFilter: z
    .enum(["ALL", "NEEDS_DELIVERY", "OPENED", "FAILED"])
    .default("ALL"),
});

type ProgressRow = {
  id: string;
  name: string;
  report_id?: string | null;
  status?: string | null;
  submitted_at?: string | Date | null;
  report_updated_at?: string | Date | null;
  latest_published_version_number?: number | null;
  delivery_status?: string | null;
  delivery_whatsapp_opened_at?: string | Date | null;
};

type ProgressSummary = {
  total: number;
  notCreated: number;
  draft: number;
  review: number;
  publish: number;
  published: number;
  waitingReview: number;
  approved: number;
  correction: number;
};

@Controller("reports")
export class ReportsController implements OnModuleInit {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly pdf: ReportPdfService,
    private readonly publicationJobs?: ReportPublicationJobsService,
  ) {}

  onModuleInit() {
    this.publicationJobs?.registerPublisher(({ schoolId, actorUserId, reportId }) =>
      this.publishForActor(
        {
          userId: actorUserId,
          schoolId,
          role: "SCHOOL_ADMIN",
          email: "",
          sessionId: "publication-worker",
        },
        reportId,
      ),
    );
  }

  @Get("progress")
  async progress(
    @Req() request: FastifyRequest,
    @Query("semesterId") semesterId: string,
    @Query("page") page = "1",
    @Query("limit") limit = "10",
    @Query("search") search = "",
    @Query("view") view = "ALL",
    @Query("deliveryFilter") deliveryFilter = "ALL",
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = progressQuery.parse({
      page,
      limit,
      search,
      view,
      deliveryFilter,
    });
    return this.db.transaction(async (client) => {
      await assertTeacherActiveSemester(client, actor, semesterId);
      const result = (
        await client.query(
          `WITH framework_totals AS (
              SELECT count(DISTINCT indicator.id)::int AS indicator_count,count(DISTINCT area.id)::int AS narrative_count
              FROM assessment_frameworks framework
              JOIN development_areas area ON area.framework_id=framework.id AND area.school_id=framework.school_id
              JOIN sub_areas sub_area ON sub_area.development_area_id=area.id AND sub_area.school_id=framework.school_id
              JOIN indicators indicator ON indicator.sub_area_id=sub_area.id AND indicator.school_id=framework.school_id
              WHERE framework.school_id=$4 AND framework.name=$3 AND framework.is_active
            ), assessment_progress AS (
              SELECT assessment.student_id,count(*)::int AS assessment_count
              FROM student_assessments assessment
              JOIN indicators indicator ON indicator.id=assessment.indicator_id AND indicator.school_id=assessment.school_id
              JOIN sub_areas sub_area ON sub_area.id=indicator.sub_area_id AND sub_area.school_id=assessment.school_id
              JOIN development_areas area ON area.id=sub_area.development_area_id AND area.school_id=assessment.school_id
              JOIN assessment_frameworks framework ON framework.id=area.framework_id AND framework.school_id=assessment.school_id
              WHERE assessment.school_id=$4 AND assessment.semester_id=$1 AND framework.name=$3 AND framework.is_active
              GROUP BY assessment.student_id
            ), narrative_progress AS (
              SELECT narrative.report_id,count(*)::int AS narrative_count
              FROM report_narratives narrative
              JOIN development_areas area ON area.id=narrative.development_area_id AND area.school_id=narrative.school_id
              JOIN assessment_frameworks framework ON framework.id=area.framework_id AND framework.school_id=narrative.school_id
              WHERE narrative.school_id=$4 AND framework.name=$3 AND framework.is_active AND btrim(narrative.content)<>''
              GROUP BY narrative.report_id
            ), progress_rows AS (
            SELECT student.id,student.name,report.id AS report_id,report.status,
              report.submitted_at,report.updated_at AS report_updated_at,
              (SELECT version.version_number
               FROM report_versions version
               WHERE version.report_id=report.id AND version.school_id=report.school_id
               ORDER BY version.version_number DESC
               LIMIT 1) AS latest_published_version_number,
              (SELECT version.published_at
               FROM report_versions version
               WHERE version.report_id=report.id AND version.school_id=report.school_id
               ORDER BY version.version_number DESC
               LIMIT 1) AS latest_published_at,
              (SELECT delivery.status
               FROM report_deliveries delivery
               JOIN report_versions version ON version.id=delivery.report_version_id AND version.school_id=delivery.school_id
               WHERE version.report_id=report.id AND delivery.school_id=report.school_id
               ORDER BY version.version_number DESC, delivery.updated_at DESC
               LIMIT 1) AS delivery_status,
              (SELECT delivery.whatsapp_opened_at
               FROM report_deliveries delivery
               JOIN report_versions version ON version.id=delivery.report_version_id AND version.school_id=delivery.school_id
               WHERE version.report_id=report.id AND delivery.school_id=report.school_id
               ORDER BY version.version_number DESC, delivery.updated_at DESC
               LIMIT 1) AS delivery_whatsapp_opened_at,
              (SELECT log.metadata->>'note' FROM audit_logs log WHERE log.school_id=report.school_id AND log.entity_type='report' AND log.entity_id=report.id AND log.action='report.revision' ORDER BY log.created_at DESC LIMIT 1) AS revision_note,
              CASE WHEN report.id IS NULL THEN 0 ELSE COALESCE(ROUND(100.0*(COALESCE(assessment_progress.assessment_count,0)+COALESCE(narrative_progress.narrative_count,0)+CASE WHEN attendance.id IS NULL THEN 0 ELSE 1 END)/NULLIF(framework_totals.indicator_count+framework_totals.narrative_count+1,0)),0)::int END AS completion_percent
            FROM student_enrollments enrollment
            JOIN students student ON student.id=enrollment.student_id AND student.school_id=enrollment.school_id
            JOIN semesters semester ON semester.id=$1 AND semester.school_id=enrollment.school_id
            LEFT JOIN reports report ON report.student_id=student.id AND report.semester_id=$1 AND report.school_id=enrollment.school_id
            LEFT JOIN assessment_progress ON assessment_progress.student_id=student.id
            LEFT JOIN narrative_progress ON narrative_progress.report_id=report.id
            LEFT JOIN attendance_summaries attendance ON attendance.student_id=student.id AND attendance.semester_id=$1 AND attendance.school_id=enrollment.school_id
            CROSS JOIN framework_totals
            WHERE enrollment.school_id=$4 AND enrollment.academic_year_id=semester.academic_year_id AND enrollment.effective_start_on<=CURRENT_DATE AND (enrollment.effective_end_on IS NULL OR enrollment.effective_end_on>CURRENT_DATE) AND student.lifecycle_status='ACTIVE'
              AND ($2::uuid IS NULL OR EXISTS (
                SELECT 1
                FROM teacher_class_assignments assignment
                WHERE assignment.school_id=enrollment.school_id
                  AND assignment.class_period_id=enrollment.class_period_id
                  AND assignment.teacher_user_id=$2
                  AND assignment.ended_at IS NULL
              ))
            ), scoped AS (
              SELECT * FROM progress_rows
              WHERE $5::text='ALL'
                OR ($5::text='EDITOR' AND (status IS NULL OR status IN ('DRAFT','REVISION_REQUIRED')))
                OR ($5::text='PUBLICATION' AND report_id IS NOT NULL AND (
                  status IN ('SUBMITTED','IN_REVIEW','APPROVED','PUBLISHED')
                  OR (latest_published_version_number IS NOT NULL AND status IN ('DRAFT','REVISION_REQUIRED'))
                ))
            ), filtered AS (
              SELECT * FROM scoped
              WHERE lower(name) LIKE '%' || lower($6::text) || '%'
                AND (
                  $7::text='ALL'
                  OR ($7::text='FAILED' AND delivery_status='FAILED')
                  OR ($7::text='OPENED' AND (
                    delivery_whatsapp_opened_at IS NOT NULL
                    OR delivery_status IN ('SENT','DELIVERED','READ')
                  ))
                  OR ($7::text='NEEDS_DELIVERY' AND status='PUBLISHED'
                    AND delivery_whatsapp_opened_at IS NULL
                    AND (delivery_status IS NULL OR delivery_status='QUEUED')
                  )
                )
            ), summary AS (
              SELECT jsonb_build_object(
                'total',count(*)::int,
                'notCreated',count(*) FILTER (WHERE status IS NULL)::int,
                'draft',count(*) FILTER (WHERE status IN ('DRAFT','REVISION_REQUIRED'))::int,
                'review',count(*) FILTER (WHERE status IN ('SUBMITTED','IN_REVIEW'))::int,
                'publish',count(*) FILTER (WHERE status='APPROVED')::int,
                'published',count(*) FILTER (WHERE status='PUBLISHED' OR latest_published_version_number IS NOT NULL)::int,
                'waitingReview',count(*) FILTER (WHERE status IN ('SUBMITTED','IN_REVIEW'))::int,
                'approved',count(*) FILTER (WHERE status='APPROVED')::int,
                'correction',count(*) FILTER (
                  WHERE latest_published_version_number IS NOT NULL
                    AND status IN ('DRAFT','REVISION_REQUIRED')
                )::int
              ) AS data
              FROM scoped
            )
            SELECT
              COALESCE((
                SELECT jsonb_agg(to_jsonb(paged))
                FROM (
                  SELECT *
                  FROM filtered
                  ORDER BY
                    CASE
                      WHEN $5::text='PUBLICATION'
                        AND status='PUBLISHED'
                        AND delivery_whatsapp_opened_at IS NULL
                        AND (delivery_status IS NULL OR delivery_status IN ('QUEUED','FAILED'))
                        THEN 0
                      ELSE 1
                    END,
                    CASE WHEN $5::text='PUBLICATION' THEN COALESCE(report_updated_at,submitted_at) END DESC NULLS LAST,
                    name ASC
                  LIMIT $8 OFFSET $9
                ) AS paged
              ),'[]'::jsonb) AS items,
              (SELECT count(*)::int FROM filtered) AS total,
              summary.data AS summary
            FROM summary`,
          [
            semesterId,
            actor.role === "TEACHER" ? actor.userId : null,
            DEFAULT_TK_TEMPLATE_NAME,
            actor.schoolId,
            input.view,
            input.search,
            input.deliveryFilter,
            input.limit,
            (input.page - 1) * input.limit,
          ],
        )
      ).rows[0] as {
        items: ProgressRow[] | null;
        total: number;
        summary: ProgressSummary;
      };
      return {
        items: result.items ?? [],
        total: result.total,
        page: input.page,
        limit: input.limit,
        summary: result.summary,
      };
    }, actor.schoolId);
  }

  @Get("review-queue")
  async reviewQueue(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "PRINCIPAL"]);
    return this.db.transaction(
      async (client) =>
        (
          await client.query(
            "SELECT r.id,r.status,r.submitted_at,s.name AS student_name,sem.name AS semester_name FROM reports r JOIN students s ON s.id=r.student_id AND s.school_id=r.school_id JOIN semesters sem ON sem.id=r.semester_id WHERE r.school_id=$1 AND r.status IN ('SUBMITTED','IN_REVIEW') ORDER BY r.submitted_at NULLS LAST,r.updated_at DESC",
            [actor.schoolId],
          )
        ).rows,
      actor.schoolId,
    );
  }

  @Get("publishable-ids")
  async publishableIds(
    @Req() request: FastifyRequest,
    @Query("semesterId") semesterId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = z.object({ semesterId: z.string().uuid() }).parse({ semesterId });
    return this.db.transaction(async (client) => {
      await assertTeacherActiveSemester(client, actor, input.semesterId);
      return (
        await client.query<{ id: string }>(
          "SELECT id FROM reports WHERE school_id=$1 AND semester_id=$2 AND status='APPROVED' ORDER BY updated_at DESC,id",
          [actor.schoolId, input.semesterId],
        )
      ).rows.map((row) => row.id);
    }, actor.schoolId);
  }

  @Post("students/:studentId/draft")
  async draft(
    @Req() request: FastifyRequest,
    @Param("studentId") studentId: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = z.object({ semesterId: z.string().uuid() }).parse(body);
    return this.db.transaction(async (client) => {
      await assertTeacherActiveSemester(client, actor, input.semesterId);
      const enrollment = (
        await client.query(
          `SELECT enrollment.id FROM student_enrollments enrollment JOIN students student ON student.id=enrollment.student_id JOIN semesters semester ON semester.id=$2 LEFT JOIN teacher_class_assignments assignment ON assignment.class_period_id=enrollment.class_period_id AND assignment.ended_at IS NULL WHERE enrollment.student_id=$1 AND enrollment.academic_year_id=semester.academic_year_id AND enrollment.effective_start_on <= CURRENT_DATE AND (enrollment.effective_end_on IS NULL OR enrollment.effective_end_on > CURRENT_DATE) AND student.lifecycle_status='ACTIVE' AND ($3::uuid IS NULL OR assignment.teacher_user_id=$3)`,
          [
            studentId,
            input.semesterId,
            actor.role === "TEACHER" ? actor.userId : null,
          ],
        )
      ).rows[0];
      if (!enrollment)
        throw new BadRequestException(
          "Murid tidak berada pada kelas yang dapat dikelola.",
        );
      const result = await client.query(
        "INSERT INTO reports(school_id,student_id,semester_id,student_enrollment_id) VALUES($1,$2,$3,$4) ON CONFLICT(student_id,semester_id) DO UPDATE SET student_enrollment_id=CASE WHEN reports.status IN ('DRAFT','REVISION_REQUIRED') THEN EXCLUDED.student_enrollment_id ELSE reports.student_enrollment_id END,updated_at=now() RETURNING *",
        [actor.schoolId, studentId, input.semesterId, enrollment.id],
      );
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report.draft_created",
          entityType: "report",
          entityId: result.rows[0].id,
        },
        client,
      );
      return result.rows[0];
    }, actor.schoolId);
  }

  @Put(":id/assessments/:indicatorId")
  async saveAssessment(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Param("indicatorId") indicatorId: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = reportAssessment.parse(body);
    return this.db.transaction(async (client) => {
      const report = (
        await client.query<{
          student_id: string;
          semester_id: string;
          status: string;
        }>("SELECT student_id,semester_id,status FROM reports WHERE id=$1", [
          id,
        ])
      ).rows[0];
      if (!report) throw new NotFoundException("Raport tidak ditemukan");
      await assertReportAccess(client, actor, id);
      if (!["DRAFT", "REVISION_REQUIRED"].includes(report.status))
        throw new ConflictException(
          "Raport tidak dapat diubah pada status saat ini",
        );
      const valid = await client.query(
        `SELECT 1 FROM indicators i JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id JOIN assessment_scale_options o ON o.scale_id=f.scale_id WHERE i.id=$1 AND o.id=$2 AND f.name=$3 AND f.is_active`,
        [indicatorId, input.scaleOptionId, DEFAULT_TK_TEMPLATE_NAME],
      );
      if (!valid.rowCount)
        throw new BadRequestException("Indikator atau skala tidak valid");
      const saved = (
        await client.query(
          `INSERT INTO student_assessments(school_id,student_id,semester_id,indicator_id,scale_option_id,assessed_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(student_id,semester_id,indicator_id) DO UPDATE SET scale_option_id=EXCLUDED.scale_option_id,assessed_by=EXCLUDED.assessed_by,assessed_at=now() RETURNING *`,
          [
            actor.schoolId,
            report.student_id,
            report.semester_id,
            indicatorId,
            input.scaleOptionId,
            actor.userId,
          ],
        )
      ).rows[0];
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report_assessment.saved",
          entityType: "student_assessment",
          entityId: saved.id,
          metadata: { reportId: id },
        },
        client,
      );
      return saved;
    }, actor.schoolId);
  }

  @Post(":id/transition")
  async move(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request);
    const input = transition.parse(body);
    return this.db.transaction(async (client) => {
      const report = (
        await client.query<{ status: string }>(
          "SELECT status FROM reports WHERE id=$1",
          [id],
        )
      ).rows[0];
      if (!report) throw new NotFoundException("Raport tidak ditemukan");
      await assertReportAccess(client, actor, id);
      const rules: Record<string, [string, string[]]> = {
        submit: ["SUBMITTED", ["DRAFT"]],
        review: ["IN_REVIEW", ["SUBMITTED"]],
        revision: ["REVISION_REQUIRED", ["IN_REVIEW"]],
        approve: ["APPROVED", ["IN_REVIEW"]],
      };
      const [to, from] = rules[input.action];
      if (!from.includes(report.status))
        throw new ConflictException("Perubahan status tidak valid");
      if (
        input.action === "submit" &&
        !(["SCHOOL_ADMIN", "TEACHER"] as string[]).includes(actor.role)
      )
        throw new ForbiddenException("Akses ditolak");
      if (
        ["review", "revision", "approve"].includes(input.action) &&
        !(["SCHOOL_ADMIN", "PRINCIPAL"] as string[]).includes(actor.role)
      )
        throw new ForbiddenException("Akses ditolak");
      const updated = (
        await client.query(
          "UPDATE reports SET status=$1::report_status,submitted_at=CASE WHEN $3 THEN now() ELSE submitted_at END,approved_at=CASE WHEN $4 THEN now() ELSE approved_at END,updated_at=now() WHERE id=$2 RETURNING *",
          [to, id, to === "SUBMITTED", to === "APPROVED"],
        )
      ).rows[0];
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: `report.${input.action}`,
          entityType: "report",
          entityId: id,
          metadata:
            input.action === "revision" ? { note: input.note } : undefined,
        },
        client,
      );
      return updated;
    }, actor.schoolId);
  }

  @Post("publication-jobs")
  async enqueuePublicationJob(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = publicationJobInput.parse(body);
    if (!this.publicationJobs) throw new InternalServerErrorException("Antrean publikasi belum siap");
    return this.publicationJobs.enqueue({
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      reportIds: input.reportIds,
      semesterId: input.semesterId,
    });
  }

  @Get("publication-jobs/:jobId")
  async publicationJob(@Req() request: FastifyRequest, @Param("jobId") jobId: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    if (!this.publicationJobs) throw new InternalServerErrorException("Antrean publikasi belum siap");
    const job = await this.publicationJobs.getJob({
      schoolId: actor.schoolId,
      jobId,
    });
    if (!job) throw new NotFoundException("Proses publikasi tidak ditemukan");
    return job;
  }

  @Post(":id/publish")
  async publish(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    return this.publishForActor(actor, id);
  }

  async publishForActor(actor: AuthContext, id: string) {
    return this.db.transaction(async (client) => {
      const report = (
        await client.query<any>(
          `SELECT r.*,school.name AS school_name,school.address AS school_address,school.logo_storage_key AS school_logo_storage_key,s.name AS student_name,s.nickname,s.student_number,s.birth_date,s.birth_place,s.gender,s.religion,s.child_order,s.address,grouping.name AS class_name,sem.name AS semester_name,ay.name AS academic_year_name FROM reports r JOIN schools school ON school.id=r.school_id JOIN students s ON s.id=r.student_id LEFT JOIN student_enrollments enrollment ON enrollment.id=r.student_enrollment_id LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id JOIN semesters sem ON sem.id=r.semester_id JOIN academic_years ay ON ay.id=sem.academic_year_id WHERE r.id=$1 AND r.school_id=$2 FOR UPDATE OF r`,
          [id, actor.schoolId],
        )
      ).rows[0];
      if (!report) throw new NotFoundException("Raport tidak ditemukan");
      if (report.status !== "APPROVED")
        throw new ConflictException(
          "Hanya raport yang disetujui dapat diterbitkan",
        );
      const completeness = await getReportCompleteness(client, {
        id: report.id,
        studentId: report.student_id,
        semesterId: report.semester_id,
        schoolId: actor.schoolId,
      });
      if (!completeness.complete)
        throw new BadRequestException(completenessError(completeness));
      const assessmentRows = (
        await client.query<any>(
          `SELECT da.name AS area_name,da.position AS area_position,sa.name AS sub_area_name,sa.position AS sub_area_position,i.description,i.position,opt.code FROM student_assessments assessment JOIN indicators i ON i.id=assessment.indicator_id JOIN sub_areas sa ON sa.id=i.sub_area_id JOIN development_areas da ON da.id=sa.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id JOIN assessment_scale_options opt ON opt.id=assessment.scale_option_id WHERE assessment.student_id=$1 AND assessment.semester_id=$2 AND f.name=$3 AND f.is_active ORDER BY da.position,sa.position,i.position`,
          [report.student_id, report.semester_id, DEFAULT_TK_TEMPLATE_NAME],
        )
      ).rows;
      const narratives = (
        await client.query<any>(
          `SELECT da.name,rn.content FROM report_narratives rn JOIN development_areas da ON da.id=rn.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id WHERE rn.report_id=$1 AND f.name=$2 AND f.is_active ORDER BY da.position`,
          [id, DEFAULT_TK_TEMPLATE_NAME],
        )
      ).rows;
      const growth =
        (
          await client.query(
            "SELECT weight_kg,height_cm,head_circumference_cm FROM growth_records WHERE student_id=$1 AND semester_id=$2",
            [report.student_id, report.semester_id],
          )
        ).rows[0] ?? null;
      const attendance =
        (
          await client.query(
            "SELECT sick_days,permission_days,unexcused_days FROM attendance_summaries WHERE student_id=$1 AND semester_id=$2",
            [report.student_id, report.semester_id],
          )
        ).rows[0] ?? null;
      const guardians = (
        await client.query(
          "SELECT name,relationship,phone,occupation,is_primary FROM guardian_contacts WHERE student_id=$1 ORDER BY is_primary DESC,name",
          [report.student_id],
        )
      ).rows;
      const teachers = (
        await client.query(
          "SELECT teacher.id,teacher.name,teacher.phone FROM teacher_class_assignments assignment JOIN users teacher ON teacher.id=assignment.teacher_user_id WHERE assignment.class_period_id=(SELECT class_period_id FROM student_enrollments WHERE id=$1) AND assignment.ended_at IS NULL ORDER BY teacher.name",
          [report.student_enrollment_id],
        )
      ).rows;
      const snapshot = {
        report: { id: report.id, status: report.status },
        school: {
          name: report.school_name,
          address: report.school_address,
          logo_storage_key: report.school_logo_storage_key,
        },
        student: {
          name: report.student_name,
          nickname: report.nickname,
          student_number: report.student_number,
          birth_date: report.birth_date,
          birth_place: report.birth_place,
          gender: report.gender,
          religion: report.religion,
          child_order: report.child_order,
          address: report.address,
          class_name: report.class_name,
        },
        semester: {
          name: report.semester_name,
          academic_year_name: report.academic_year_name,
        },
        teachers,
        assessments: assessmentRows,
        narratives,
        growth,
        attendance,
        guardians,
      };
      const versionNumber = (
        await client.query<{ next: number }>(
          "SELECT COALESCE(max(version_number),0)+1 AS next FROM report_versions WHERE report_id=$1",
          [id],
        )
      ).rows[0].next;
      let pdfStorageKey: string;
      try {
        pdfStorageKey = await this.pdf.storePublishedReport({
          schoolId: actor.schoolId,
          reportId: id,
          versionNumber,
          snapshot,
        });
      } catch (error) {
        this.logger.error(
          `Gagal membuat atau menyimpan PDF untuk raport ${id}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new InternalServerErrorException(
          "PDF raport belum dapat dibuat atau disimpan. Coba terbitkan kembali.",
        );
      }
      const version = (
        await client.query(
          "INSERT INTO report_versions(school_id,report_id,version_number,snapshot,pdf_storage_key,published_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
          [
            actor.schoolId,
            id,
            versionNumber,
            snapshot,
            pdfStorageKey,
            actor.userId,
          ],
        )
      ).rows[0];
      const token = randomBytes(32).toString("base64url"),
        pin = randomInt(0, 1_000_000).toString().padStart(6, "0");
      await client.query(
        "INSERT INTO report_access(school_id,report_version_id,token_hash,pin_hash) VALUES($1,$2,$3,$4)",
        [
          actor.schoolId,
          version.id,
          createHash("sha256").update(token).digest("hex"),
          createHash("sha256").update(pin).digest("hex"),
        ],
      );
      const deliveries = await client.query(
        "INSERT INTO report_deliveries(school_id,report_version_id,guardian_contact_id,recipient_phone) SELECT $1,$2,g.id,g.phone FROM guardian_contacts g WHERE g.school_id=$1 AND g.student_id=$3 AND g.is_active AND g.is_delivery_recipient RETURNING id",
        [actor.schoolId, version.id, report.student_id],
      );
      await client.query(
        "UPDATE reports SET status='PUBLISHED',updated_at=now() WHERE id=$1",
        [id],
      );
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report.published",
          entityType: "report_version",
          entityId: version.id,
          metadata: { pdfStorageKey },
        },
        client,
      );
      return {
        ...version,
        parentAccess: { link: `/r/${token}`, pin },
        deliveryCount: deliveries.rowCount,
      };
    }, actor.schoolId);
  }

  @Get(":id/published-version")
  async publishedVersion(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
  ) {
    const actor = this.auth.require(request, [
      "SCHOOL_ADMIN",
      "PRINCIPAL",
      "TEACHER",
    ]);
    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER") await assertReportAccess(client, actor, id);
      return (
        (
          await client.query(
            `SELECT version.id,version.version_number,version.published_at,version.snapshot,version.pdf_storage_key,report.status AS current_status
        FROM report_versions version JOIN reports report ON report.id=version.report_id
        WHERE report.id=$1 AND report.school_id=$2 AND version.school_id=$2
        ORDER BY version.version_number DESC LIMIT 1`,
            [id, actor.schoolId],
          )
        ).rows[0] ?? null
      );
    }, actor.schoolId);
  }

  @Get(":id/published-logo")
  async publishedLogo(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Res() reply: FastifyReply,
  ) {
    const actor = this.auth.require(request, [
      "SCHOOL_ADMIN",
      "PRINCIPAL",
      "TEACHER",
    ]);
    const version = await this.db.transaction(async (client) => {
      if (actor.role === "TEACHER") await assertReportAccess(client, actor, id);
      return (
        (
          await client.query<any>(
            `SELECT version.snapshot
        FROM report_versions version JOIN reports report ON report.id=version.report_id
        WHERE report.id=$1 AND report.school_id=$2 AND version.school_id=$2
        ORDER BY version.version_number DESC LIMIT 1`,
            [id, actor.schoolId],
          )
        ).rows[0] ?? null
      );
    }, actor.schoolId);
    const storageKey = version?.snapshot?.school?.logo_storage_key;
    if (!storageKey)
      throw new NotFoundException("Logo tidak tersedia pada versi raport ini.");
    const contentType = storageKey.endsWith(".png")
      ? "image/png"
      : "image/jpeg";
    const body = await this.pdf.readStoredImage(storageKey);
    reply
      .header("Content-Type", contentType)
      .header("Cache-Control", "private, max-age=300")
      .send(body);
  }

  @Get(":id/editor")
  async editor(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request, [
      "SCHOOL_ADMIN",
      "PRINCIPAL",
      "TEACHER",
    ]);
    return this.db.transaction(async (client) => {
      const report = (
        await client.query(
          "SELECT r.*,school.name AS school_name,school.address AS school_address,school.logo_storage_key IS NOT NULL AS school_has_logo,s.name AS student_name,s.student_number,grouping.name AS class_name,sem.name AS semester_name,(SELECT log.metadata->>'note' FROM audit_logs log WHERE log.school_id=r.school_id AND log.entity_type='report' AND log.entity_id=r.id AND log.action='report.revision' ORDER BY log.created_at DESC LIMIT 1) AS revision_note FROM reports r JOIN schools school ON school.id=r.school_id JOIN students s ON s.id=r.student_id LEFT JOIN student_enrollments enrollment ON enrollment.id=r.student_enrollment_id LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id JOIN semesters sem ON sem.id=r.semester_id WHERE r.id=$1 AND r.school_id=$2",
          [id, actor.schoolId],
        )
      ).rows[0];
      if (!report) return null;
      await assertReportAccess(client, actor, id);
      const areas = (
        await client.query(
          `SELECT da.id,da.name,count(i.id)::int AS indicator_count,count(assessment.id)::int AS assessed_count,n.content AS narrative FROM development_areas da JOIN assessment_frameworks f ON f.id=da.framework_id JOIN sub_areas sub ON sub.development_area_id=da.id JOIN indicators i ON i.sub_area_id=sub.id LEFT JOIN student_assessments assessment ON assessment.indicator_id=i.id AND assessment.student_id=$1 AND assessment.semester_id=$2 LEFT JOIN report_narratives n ON n.report_id=$3 AND n.development_area_id=da.id WHERE f.name=$4 AND f.is_active GROUP BY da.id,da.name,n.content,da.position ORDER BY da.position`,
          [report.student_id, report.semester_id, id, DEFAULT_TK_TEMPLATE_NAME],
        )
      ).rows;
      const assessments = (
        await client.query(
          `SELECT da.id AS area_id,sub.name AS sub_area_name,i.description,opt.code AS scale_code FROM indicators i JOIN sub_areas sub ON sub.id=i.sub_area_id JOIN development_areas da ON da.id=sub.development_area_id JOIN assessment_frameworks f ON f.id=da.framework_id LEFT JOIN student_assessments sa ON sa.indicator_id=i.id AND sa.student_id=$1 AND sa.semester_id=$2 LEFT JOIN assessment_scale_options opt ON opt.id=sa.scale_option_id WHERE f.name=$3 AND f.is_active ORDER BY da.position,sub.position,i.position`,
          [report.student_id, report.semester_id, DEFAULT_TK_TEMPLATE_NAME],
        )
      ).rows;
      const growth =
        (
          await client.query(
            "SELECT weight_kg,height_cm,head_circumference_cm FROM growth_records WHERE student_id=$1 AND semester_id=$2",
            [report.student_id, report.semester_id],
          )
        ).rows[0] ?? null;
      const attendance =
        (
          await client.query(
            "SELECT sick_days,permission_days,unexcused_days FROM attendance_summaries WHERE student_id=$1 AND semester_id=$2",
            [report.student_id, report.semester_id],
          )
        ).rows[0] ?? null;
      return {
        report,
        school: {
          name: report.school_name,
          address: report.school_address,
          has_logo: report.school_has_logo,
        },
        areas,
        assessments,
        growth,
        attendance,
      };
    }, actor.schoolId);
  }

  @Put(":id/narratives/:areaId")
  async narrative(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Param("areaId") areaId: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]);
    const input = z
      .object({ content: z.string().min(1).max(5000) })
      .parse(body);
    return this.db.transaction(async (client) => {
      const report = await client.query(
        "SELECT id,status FROM reports WHERE id=$1",
        [id],
      );
      if (!report.rowCount)
        throw new NotFoundException("Raport tidak ditemukan");
      await assertReportAccess(client, actor, id);
      if (report.rows[0].status === "PUBLISHED")
        throw new ConflictException("Raport terbit tidak dapat diubah");
      const saved = (
        await client.query(
          "INSERT INTO report_narratives(school_id,report_id,development_area_id,content,updated_by) SELECT $1,$2,$3,$4,$5 WHERE EXISTS(SELECT 1 FROM development_areas WHERE id=$3) ON CONFLICT(report_id,development_area_id) DO UPDATE SET content=EXCLUDED.content,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *",
          [actor.schoolId, id, areaId, input.content, actor.userId],
        )
      ).rows[0];
      if (!saved)
        throw new BadRequestException("Area perkembangan tidak ditemukan");
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "report_narrative.saved",
          entityType: "report_narrative",
          entityId: saved.id,
        },
        client,
      );
      return saved;
    }, actor.schoolId);
  }
}

export function paginateProgressRows(
  rows: ProgressRow[],
  input: z.infer<typeof progressQuery>,
) {
  const scoped = rows.filter((row) => matchesProgressView(row, input.view));
  const summary = createProgressSummary(scoped);
  const term = input.search.toLocaleLowerCase("id-ID");
  const filtered = scoped
    .filter((row) => row.name.toLocaleLowerCase("id-ID").includes(term))
    .filter((row) => matchesDeliveryFilter(row, input.deliveryFilter))
    .sort((left, right) => compareProgressRows(left, right, input.view));

  return {
    items: filtered.slice((input.page - 1) * input.limit, input.page * input.limit),
    total: filtered.length,
    page: input.page,
    limit: input.limit,
    summary,
  };
}

function createProgressSummary(rows: ProgressRow[]): ProgressSummary {
  return {
    total: rows.length,
    notCreated: rows.filter((row) => !row.status).length,
    draft: rows.filter((row) => ["DRAFT", "REVISION_REQUIRED"].includes(row.status ?? ""))
      .length,
    review: rows.filter((row) => ["SUBMITTED", "IN_REVIEW"].includes(row.status ?? ""))
      .length,
    publish: rows.filter((row) => row.status === "APPROVED").length,
    published: rows.filter(
      (row) => row.status === "PUBLISHED" || Boolean(row.latest_published_version_number),
    ).length,
    waitingReview: rows.filter((row) => ["SUBMITTED", "IN_REVIEW"].includes(row.status ?? ""))
      .length,
    approved: rows.filter((row) => row.status === "APPROVED").length,
    correction: rows.filter(
      (row) =>
        Boolean(row.latest_published_version_number) &&
        ["DRAFT", "REVISION_REQUIRED"].includes(row.status ?? ""),
    ).length,
  };
}

function matchesProgressView(
  row: ProgressRow,
  view: z.infer<typeof progressQuery>["view"],
) {
  if (view === "ALL") return true;
  if (view === "EDITOR") {
    return !row.status || ["DRAFT", "REVISION_REQUIRED"].includes(row.status);
  }
  return Boolean(row.report_id) &&
    (["SUBMITTED", "IN_REVIEW", "APPROVED", "PUBLISHED"].includes(row.status ?? "") ||
      (Boolean(row.latest_published_version_number) &&
        ["DRAFT", "REVISION_REQUIRED"].includes(row.status ?? "")));
}

function matchesDeliveryFilter(
  row: ProgressRow,
  filter: z.infer<typeof progressQuery>["deliveryFilter"],
) {
  if (filter === "ALL") return true;
  if (filter === "FAILED") return row.delivery_status === "FAILED";
  if (filter === "OPENED") {
    return (
      Boolean(row.delivery_whatsapp_opened_at) ||
      ["SENT", "DELIVERED", "READ"].includes(row.delivery_status ?? "")
    );
  }
  return (
    row.status === "PUBLISHED" &&
    !row.delivery_whatsapp_opened_at &&
    (!row.delivery_status || row.delivery_status === "QUEUED")
  );
}

function compareProgressRows(left: ProgressRow, right: ProgressRow, view: string) {
  if (view === "PUBLICATION") {
    const deliveryPriority = (row: ProgressRow) =>
      row.status === "PUBLISHED" &&
      !row.delivery_whatsapp_opened_at &&
      (!row.delivery_status || ["QUEUED", "FAILED"].includes(row.delivery_status))
        ? 0
        : 1;
    const priorityDifference = deliveryPriority(left) - deliveryPriority(right);
    if (priorityDifference) return priorityDifference;
    const newest = (row: ProgressRow) => {
      const value = row.report_updated_at ?? row.submitted_at;
      const timestamp = value ? Date.parse(String(value)) : Number.NaN;
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };
    const activityDifference = newest(right) - newest(left);
    if (activityDifference) return activityDifference;
  }
  return left.name.localeCompare(right.name, "id-ID");
}
