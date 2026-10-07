import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

const yearSchema = z.object({ name: z.string().regex(/^\d{4}\/\d{4}$/), startsOn: z.string().date(), endsOn: z.string().date() }).refine((x) => x.startsOn < x.endsOn, { message: "Rentang tanggal tidak valid" });
const semesterSchema = z.object({ academicYearId: z.string().uuid(), name: z.string().min(2).max(50), startsOn: z.string().date(), endsOn: z.string().date() });
const classSchema = z.object({ name: z.string().min(2).max(100), academicYearId: z.string().uuid() });

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

@Controller("academic")
export class AcademicController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}
  @Get("years") listYears(@Req() request: FastifyRequest) { const a = this.auth.require(request); return this.db.transaction(async c => (await c.query("SELECT * FROM academic_years ORDER BY starts_on DESC", [])).rows, a.schoolId); }
  @Post("years") async createYear(@Req() request: FastifyRequest, @Body() body: unknown) {
    const a = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = yearSchema.parse(body);
    try {
      return await this.db.transaction(async c => { const r = await c.query("INSERT INTO academic_years (school_id,name,starts_on,ends_on) VALUES ($1,$2,$3,$4) RETURNING *", [a.schoolId,input.name,input.startsOn,input.endsOn]); await this.audit.record({schoolId:a.schoolId,actorUserId:a.userId,action:"academic_year.created",entityType:"academic_year",entityId:r.rows[0].id},c); return r.rows[0]; }, a.schoolId);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException("Tahun ajaran tersebut sudah ada.");
      throw error;
    }
  }
  @Get("semesters") listSemesters(@Req() request: FastifyRequest) { const a = this.auth.require(request); return this.db.transaction(async c => (await c.query("SELECT sem.*,year.name AS academic_year_name FROM semesters sem JOIN academic_years year ON year.id=sem.academic_year_id ORDER BY sem.starts_on DESC", [])).rows, a.schoolId); }
  @Post("semesters") async createSemester(@Req() request: FastifyRequest, @Body() body: unknown) {
    const a = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = semesterSchema.parse(body);
    try {
      return await this.db.transaction(async c => {
        const academicYear = (await c.query<{ starts_on: string; ends_on: string }>("SELECT starts_on,ends_on FROM academic_years WHERE id=$1", [input.academicYearId])).rows[0];
        if (!academicYear) throw new NotFoundException("Tahun ajaran tidak ditemukan.");
        if (input.startsOn < academicYear.starts_on || input.endsOn > academicYear.ends_on) {
          throw new BadRequestException("Rentang semester harus berada di dalam rentang tahun ajaran.");
        }
        const result = await c.query(
          "INSERT INTO semesters (school_id,academic_year_id,name,starts_on,ends_on) VALUES ($1,$2,$3,$4,$5) RETURNING *",
          [a.schoolId, input.academicYearId, input.name, input.startsOn, input.endsOn],
        );
        await this.audit.record({ schoolId: a.schoolId, actorUserId: a.userId, action: "semester.created", entityType: "semester", entityId: result.rows[0].id }, c);
        return result.rows[0];
      }, a.schoolId);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException("Semester dengan nama tersebut sudah ada pada tahun ajaran ini.");
      throw error;
    }
  }
  @Get("classes") listClasses(@Req() request: FastifyRequest) { const a=this.auth.require(request); return this.db.transaction(async c => (await c.query("SELECT c.*, ay.name AS academic_year_name FROM classes c JOIN academic_years ay ON ay.id=c.academic_year_id ORDER BY c.name",[])).rows,a.schoolId); }
  @Post("classes") async createClass(@Req() request: FastifyRequest, @Body() body: unknown) {
    const a = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = classSchema.parse(body);
    try {
      return await this.db.transaction(async c => {
        const result = await c.query(
          "INSERT INTO classes (school_id,academic_year_id,name) SELECT $1,$2,$3 WHERE EXISTS (SELECT 1 FROM academic_years WHERE id=$2) RETURNING *",
          [a.schoolId, input.academicYearId, input.name],
        );
        if (!result.rowCount) throw new NotFoundException("Tahun ajaran tidak ditemukan.");
        await this.audit.record({ schoolId: a.schoolId, actorUserId: a.userId, action: "class.created", entityType: "class", entityId: result.rows[0].id }, c);
        return result.rows[0];
      }, a.schoolId);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException("Kelas dengan nama tersebut sudah ada pada tahun ajaran ini.");
      throw error;
    }
  }
}
