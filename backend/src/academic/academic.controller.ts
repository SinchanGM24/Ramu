import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

const yearSchema = z.object({ name: z.string().regex(/^\d{4}$/) });
const activeAcademicContextSchema = z.object({ semesterId: z.string().uuid() });
const classPeriodSchema = z.object({
  name: z.string().trim().min(2).max(100),
  academicYearId: z.string().uuid(),
});
const classGroupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  isActive: z.boolean().optional(),
});
const enrollmentSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classPeriodId: z.string().uuid().nullable(),
});

function unique(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
function dates(name: string) {
  const start = Number(name);
  if (!Number.isInteger(start))
    throw new BadRequestException(
      "Format tahun ajaran harus berupa tahun awal, misalnya 2026.",
    );
  const end = start + 1;
  return {
    startsOn: `${start}-07-01`,
    endsOn: `${end}-06-30`,
    semesterOneEnd: `${start}-12-31`,
    semesterTwoStart: `${end}-01-01`,
  };
}

@Controller("academic")
export class AcademicController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  @Get("years") listYears(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request);
    return this.db.transaction(
      async (c) =>
        (
          await c.query(
            "SELECT id,name,starts_on,ends_on,is_active FROM academic_years ORDER BY starts_on DESC",
          )
        ).rows,
      actor.schoolId,
    );
  }
  @Post("years") async createYear(
    @Req() request: FastifyRequest,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = yearSchema.parse(body);
    const period = dates(input.name);
    try {
      return await this.db.transaction(async (c) => {
        const hasActiveYear =
          ((
            await c.query(
              "SELECT 1 FROM academic_years WHERE school_id=$1 AND is_active LIMIT 1",
              [actor.schoolId],
            )
          ).rowCount ?? 0) > 0;
        const year = (
          await c.query(
            "INSERT INTO academic_years(school_id,name,display_year,starts_on,ends_on,is_active) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
            [
              actor.schoolId,
              input.name,
              Number(input.name),
              period.startsOn,
              period.endsOn,
              !hasActiveYear,
            ],
          )
        ).rows[0];
        await c.query(
          "INSERT INTO semesters(school_id,academic_year_id,name,starts_on,ends_on,is_active) VALUES($1,$2,'Semester I',$3,$4,$7),($1,$2,'Semester II',$5,$6,false)",
          [
            actor.schoolId,
            year.id,
            period.startsOn,
            period.semesterOneEnd,
            period.semesterTwoStart,
            period.endsOn,
            !hasActiveYear,
          ],
        );
        await this.audit.record(
          {
            schoolId: actor.schoolId,
            actorUserId: actor.userId,
            action: "academic_year.created",
            entityType: "academic_year",
            entityId: year.id,
          },
          c,
        );
        return year;
      }, actor.schoolId);
    } catch (error) {
      if (unique(error))
        throw new ConflictException("Tahun ajaran tersebut sudah ada.");
      throw error;
    }
  }
  @Post("years/:id/activate") async activateYear(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = activeAcademicContextSchema.parse(body);
    return this.db.transaction(async (c) => {
      const semester = (
        await c.query(
          "SELECT id,name FROM semesters WHERE id=$1 AND academic_year_id=$2 AND school_id=$3",
          [input.semesterId, id, actor.schoolId],
        )
      ).rows[0];
      if (!semester)
        throw new NotFoundException(
          "Semester tidak ditemukan pada tahun ajaran yang dipilih.",
        );
      await c.query(
        "UPDATE academic_years SET is_active=false WHERE school_id=$1",
        [actor.schoolId],
      );
      await c.query(
        "UPDATE semesters SET is_active=false WHERE school_id=$1",
        [actor.schoolId],
      );
      const year = (
        await c.query(
          "UPDATE academic_years SET is_active=true WHERE id=$1 AND school_id=$2 RETURNING *",
          [id, actor.schoolId],
        )
      ).rows[0];
      if (!year) throw new NotFoundException("Tahun ajaran tidak ditemukan.");
      await c.query(
        "UPDATE semesters SET is_active=true WHERE id=$1 AND school_id=$2",
        [input.semesterId, actor.schoolId],
      );
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "academic_year.activated",
          entityType: "academic_year",
          entityId: id,
          metadata: { semesterId: input.semesterId },
        },
        c,
      );
      return year;
    }, actor.schoolId);
  }
  @Get("semesters") listSemesters(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request);
    return this.db.transaction(
      async (c) =>
        (
          await c.query(
            `SELECT sem.id,sem.name,sem.academic_year_id,sem.is_active,year.name AS academic_year_name
             FROM semesters sem
             JOIN academic_years year ON year.id=sem.academic_year_id AND year.school_id=sem.school_id
             WHERE sem.school_id=$1
               AND ($2::boolean=false OR (sem.is_active AND year.is_active))
             ORDER BY year.starts_on DESC,sem.starts_on`,
            [actor.schoolId, actor.role === "TEACHER"],
          )
        ).rows,
      actor.schoolId,
    );
  }

  @Get("active-semester") activeSemester(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request, [
      "SCHOOL_ADMIN",
      "TEACHER",
      "PRINCIPAL",
    ]);
    return this.db.transaction(async (c) => {
      return (
        (
          await c.query(
            `SELECT sem.id,sem.name,sem.academic_year_id,sem.is_active,year.name AS academic_year_name
             FROM semesters sem
             JOIN academic_years year ON year.id=sem.academic_year_id AND year.school_id=sem.school_id
             WHERE sem.school_id=$1 AND sem.is_active AND year.is_active
             LIMIT 1`,
            [actor.schoolId],
          )
        ).rows[0] ?? null
      );
    }, actor.schoolId);
  }

  @Get("class-groups") listClassGroups(
    @Req() request: FastifyRequest,
    @Query("activeOnly") activeOnly?: string,
  ) {
    const actor = this.auth.require(request);
    return this.db.transaction(async (c) => {
      const result =
        actor.role === "TEACHER"
          ? await c.query(
              `SELECT DISTINCT grouping.id,grouping.name,grouping.is_active,grouping.created_at
            FROM class_groups grouping
            JOIN class_periods period ON period.class_group_id=grouping.id AND period.school_id=grouping.school_id
            JOIN academic_years year ON year.id=period.academic_year_id AND year.school_id=grouping.school_id AND year.is_active
            JOIN teacher_class_assignments assignment ON assignment.class_period_id=period.id AND assignment.school_id=grouping.school_id AND assignment.ended_at IS NULL
            WHERE grouping.school_id=$1 AND grouping.is_active AND assignment.teacher_user_id=$2
            ORDER BY grouping.name`,
              [actor.schoolId, actor.userId],
            )
          : await c.query(
              `SELECT id,name,is_active,created_at FROM class_groups WHERE school_id=$1 ${activeOnly === "true" ? "AND is_active" : ""} ORDER BY name`,
              [actor.schoolId],
            );
      return result.rows;
    }, actor.schoolId);
  }
  @Post("class-groups") async createClassGroup(
    @Req() request: FastifyRequest,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = classGroupSchema.parse(body);
    return this.db.transaction(async (c) => {
      const group = (
        await c.query(
          "INSERT INTO class_groups(school_id,name,is_active) VALUES($1,$2,$3) RETURNING *",
          [actor.schoolId, input.name, input.isActive ?? true],
        )
      ).rows[0];
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "class_group.created",
          entityType: "class_group",
          entityId: group.id,
        },
        c,
      );
      return group;
    }, actor.schoolId);
  }
  @Post("class-groups/:id") async updateClassGroup(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = classGroupSchema.parse(body);
    return this.db.transaction(async (c) => {
      const group = (
        await c.query(
          "UPDATE class_groups SET name=$3,is_active=COALESCE($4,is_active) WHERE id=$1 AND school_id=$2 RETURNING *",
          [id, actor.schoolId, input.name, input.isActive ?? null],
        )
      ).rows[0];
      if (!group) throw new NotFoundException("Kelas tidak ditemukan.");
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "class_group.updated",
          entityType: "class_group",
          entityId: id,
          metadata: { isActive: group.is_active },
        },
        c,
      );
      return group;
    }, actor.schoolId);
  }
  @Delete("class-groups/:id") async deleteClassGroup(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    return this.db.transaction(async (c) => {
      const usage = await c.query(
        "SELECT COUNT(*)::int AS count FROM class_periods WHERE class_group_id=$1 AND school_id=$2",
        [id, actor.schoolId],
      );
      if (Number(usage.rows[0]?.count) > 0)
        throw new ConflictException(
          "Kelas yang sudah dipakai pada tahun ajaran tidak dapat dihapus. Nonaktifkan kelas tersebut.",
        );
      const group = (
        await c.query(
          "DELETE FROM class_groups WHERE id=$1 AND school_id=$2 RETURNING id",
          [id, actor.schoolId],
        )
      ).rows[0];
      if (!group) throw new NotFoundException("Kelas tidak ditemukan.");
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "class_group.deleted",
          entityType: "class_group",
          entityId: id,
        },
        c,
      );
      return { deleted: true };
    }, actor.schoolId);
  }
  @Get("class-periods") listClassPeriods(
    @Req() request: FastifyRequest,
    @Query("academicYearId") academicYearId?: string,
  ) {
    const actor = this.auth.require(request);
    return this.db.transaction(
      async (c) =>
        (
          await c.query(
            `SELECT period.id,grouping.id AS class_group_id,grouping.name,grouping.is_active,period.academic_year_id,year.name AS academic_year_name,string_agg(DISTINCT teacher.name, ', ' ORDER BY teacher.name) FILTER (WHERE assignment.ended_at IS NULL) AS teacher_names,COUNT(DISTINCT enrollment.student_id) FILTER (WHERE enrollment.status='ACTIVE')::int AS student_count FROM class_periods period JOIN class_groups grouping ON grouping.id=period.class_group_id JOIN academic_years year ON year.id=period.academic_year_id LEFT JOIN teacher_class_assignments assignment ON assignment.class_period_id=period.id AND assignment.ended_at IS NULL LEFT JOIN users teacher ON teacher.id=assignment.teacher_user_id LEFT JOIN student_enrollments enrollment ON enrollment.class_period_id=period.id WHERE ($1::uuid IS NULL OR period.academic_year_id=$1) GROUP BY period.id,grouping.id,year.id ORDER BY grouping.name`,
            [academicYearId ?? null],
          )
        ).rows,
      actor.schoolId,
    );
  }
  @Delete("class-periods/:id") async deleteClassPeriod(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    return this.db.transaction(async (c) => {
      const usage = await c.query(
        "SELECT COUNT(*)::int AS count FROM student_enrollments WHERE class_period_id=$1 AND school_id=$2 AND status='ACTIVE'",
        [id, actor.schoolId],
      );
      if (Number(usage.rows[0]?.count) > 0)
        throw new ConflictException(
          "Kelas yang masih memiliki murid aktif tidak dapat dihapus.",
        );
      const period = (
        await c.query(
          "DELETE FROM class_periods WHERE id=$1 AND school_id=$2 RETURNING id",
          [id, actor.schoolId],
        )
      ).rows[0];
      if (!period) throw new NotFoundException("Kelas tidak ditemukan.");
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "class_period.deleted",
          entityType: "class_period",
          entityId: id,
        },
        c,
      );
      return { deleted: true };
    }, actor.schoolId);
  }
  @Post("class-periods") async createClassPeriod(
    @Req() request: FastifyRequest,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = classPeriodSchema.parse(body);
    try {
      return await this.db.transaction(async (c) => {
        const year = await c.query("SELECT 1 FROM academic_years WHERE id=$1", [
          input.academicYearId,
        ]);
        if (!year.rowCount)
          throw new NotFoundException("Tahun ajaran tidak ditemukan.");
        const group = (
          await c.query(
            "INSERT INTO class_groups(school_id,name) VALUES($1,$2) ON CONFLICT(school_id,name) DO UPDATE SET name=EXCLUDED.name RETURNING id",
            [actor.schoolId, input.name],
          )
        ).rows[0];
        const period = (
          await c.query(
            "INSERT INTO class_periods(school_id,class_group_id,academic_year_id) VALUES($1,$2,$3) RETURNING *",
            [actor.schoolId, group.id, input.academicYearId],
          )
        ).rows[0];
        await this.audit.record(
          {
            schoolId: actor.schoolId,
            actorUserId: actor.userId,
            action: "class_period.created",
            entityType: "class_period",
            entityId: period.id,
          },
          c,
        );
        return period;
      }, actor.schoolId);
    } catch (error) {
      if (unique(error))
        throw new ConflictException(
          "Kelas tersebut sudah ada pada tahun ajaran ini.",
        );
      throw error;
    }
  }

  @Get("enrollments") listEnrollments(
    @Req() request: FastifyRequest,
    @Query("academicYearId") yearId: string,
  ) {
    const actor = this.auth.require(request);
    return this.db.transaction(
      async (c) =>
        (
          await c.query(
            "SELECT enrollment.*,student.name AS student_name,grouping.name AS class_name FROM student_enrollments enrollment JOIN students student ON student.id=enrollment.student_id LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id WHERE enrollment.academic_year_id=$1 ORDER BY student.name",
            [yearId],
          )
        ).rows,
      actor.schoolId,
    );
  }
  @Post("years/:sourceYearId/clone-class-structure/:targetYearId")
  async cloneClassStructure(
    @Req() request: FastifyRequest,
    @Param("sourceYearId") sourceYearId: string,
    @Param("targetYearId") targetYearId: string,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    if (sourceYearId === targetYearId)
      throw new BadRequestException(
        "Tahun asal dan tahun tujuan harus berbeda.",
      );
    return this.db.transaction(async (c) => {
      const years = await c.query(
        "SELECT id FROM academic_years WHERE id=ANY($1::uuid[])",
        [[sourceYearId, targetYearId]],
      );
      if (years.rowCount !== 2)
        throw new NotFoundException(
          "Tahun ajaran asal atau tujuan tidak ditemukan.",
        );
      const copied = await c.query(
        "INSERT INTO class_periods(school_id,class_group_id,academic_year_id) SELECT $1,period.class_group_id,$3 FROM class_periods period WHERE period.academic_year_id=$2 ON CONFLICT(class_group_id,academic_year_id) DO NOTHING RETURNING id",
        [actor.schoolId, sourceYearId, targetYearId],
      );
      await this.audit.record(
        {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "class_period.structure_cloned",
          entityType: "academic_year",
          entityId: targetYearId,
          metadata: { sourceYearId, copiedCount: copied.rowCount },
        },
        c,
      );
      return { copiedCount: copied.rowCount };
    }, actor.schoolId);
  }
  @Post("enrollments") async createEnrollment(
    @Req() request: FastifyRequest,
    @Body() body: unknown,
  ) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = enrollmentSchema.parse(body);
    try {
      return await this.db.transaction(async (c) => {
        const saved = (
          await c.query(
            "INSERT INTO student_enrollments(school_id,student_id,academic_year_id,class_period_id) SELECT $1,$2,$3,$4 WHERE EXISTS(SELECT 1 FROM students WHERE id=$2) AND EXISTS(SELECT 1 FROM academic_years WHERE id=$3) AND ($4::uuid IS NULL OR EXISTS(SELECT 1 FROM class_periods WHERE id=$4 AND academic_year_id=$3)) RETURNING *",
            [
              actor.schoolId,
              input.studentId,
              input.academicYearId,
              input.classPeriodId,
            ],
          )
        ).rows[0];
        if (!saved)
          throw new NotFoundException(
            "Murid, tahun ajaran, atau kelas tidak ditemukan.",
          );
        await this.audit.record(
          {
            schoolId: actor.schoolId,
            actorUserId: actor.userId,
            action: "student_enrollment.created",
            entityType: "student_enrollment",
            entityId: saved.id,
          },
          c,
        );
        return saved;
      }, actor.schoolId);
    } catch (error) {
      if (unique(error))
        throw new ConflictException(
          "Murid sudah memiliki penempatan pada tahun ajaran ini.",
        );
      throw error;
    }
  }
}
