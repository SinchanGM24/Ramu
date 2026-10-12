import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

const studentSchema = z.object({
  name: z.string().trim().min(2).max(120), studentNumber: z.string().trim().max(50).nullable().optional(), classPeriodId: z.string().uuid().nullable().optional(), birthDate: z.string().date().nullable().optional(), birthPlace: z.string().trim().max(120).nullable().optional(), nickname: z.string().trim().max(120).nullable().optional(), gender: z.enum(["MALE", "FEMALE"]).nullable().optional(), religion: z.string().trim().max(80).nullable().optional(), childOrder: z.number().int().positive().nullable().optional(), address: z.string().trim().max(2000).nullable().optional(),
});
const guardianSchema = z.object({ name: z.string().trim().min(2).max(120), relationship: z.string().trim().min(2).max(50), phone: z.string().trim().min(8).max(30), occupation: z.string().trim().max(120).nullable().optional(), isPrimary: z.boolean().default(false), isDeliveryRecipient: z.boolean().default(true) });
const admissionDecisionSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), note: z.string().trim().max(1000).optional() }).refine(value => value.decision === "APPROVED" || Boolean(value.note), { message: "Alasan penolakan wajib diisi." });

@Controller("students")
export class StudentsController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}

  @Get()
  list(@Req() request: FastifyRequest, @Query("page") page = "1", @Query("limit") limit = "10", @Query("search") search = "", @Query("classPeriodId") classPeriodId?: string) {
    const actor = this.auth.require(request); const safePage = Math.max(Number(page), 1); const safeLimit = Math.min(Math.max(Number(limit), 1), 100); const term = `%${search.trim()}%`;
    return this.db.transaction(async (client) => {
      const items = await client.query("SELECT s.*,grouping.name AS class_name,enrollment.class_period_id FROM students s LEFT JOIN student_enrollments enrollment ON enrollment.student_id=s.id AND enrollment.effective_start_on<=CURRENT_DATE AND (enrollment.effective_end_on IS NULL OR enrollment.effective_end_on>CURRENT_DATE) LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id WHERE s.school_id=$1 AND ($2='' OR s.name ILIKE $3 OR COALESCE(s.student_number,'') ILIKE $3) AND ($4::uuid IS NULL OR enrollment.class_period_id=$4) ORDER BY s.created_at DESC LIMIT $5 OFFSET $6", [actor.schoolId, search.trim(), term, classPeriodId ?? null, safeLimit, (safePage - 1) * safeLimit]);
      const total = await client.query<{ total: number }>("SELECT count(*)::int AS total FROM students s LEFT JOIN student_enrollments enrollment ON enrollment.student_id=s.id AND enrollment.effective_start_on<=CURRENT_DATE AND (enrollment.effective_end_on IS NULL OR enrollment.effective_end_on>CURRENT_DATE) WHERE s.school_id=$1 AND ($2='' OR s.name ILIKE $3 OR COALESCE(s.student_number,'') ILIKE $3) AND ($4::uuid IS NULL OR enrollment.class_period_id=$4)", [actor.schoolId, search.trim(), term, classPeriodId ?? null]);
      return { items: items.rows, total: total.rows[0].total, page: safePage };
    }, actor.schoolId);
  }

  @Post()
  async create(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]); const input = studentSchema.parse(body);
    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER" && !input.classPeriodId) throw new Error("Pilih kelas penugasan Anda untuk murid baru.");
      if (actor.role === "TEACHER") { await this.assertTeacherClass(client, actor.userId, actor.schoolId, input.classPeriodId!); const request = (await client.query("INSERT INTO student_admission_requests(school_id,requested_by,target_class_period_id,payload) VALUES($1,$2,$3,$4) RETURNING id,status", [actor.schoolId, actor.userId, input.classPeriodId, JSON.stringify(input)])).rows[0]; await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student_admission.requested", entityType: "student_admission_request", entityId: request.id, metadata: { classPeriodId: input.classPeriodId } }, client); return { ...request, requestPending: true }; }
      const result = await client.query("INSERT INTO students(school_id,name,student_number,birth_date,birth_place,nickname,gender,religion,child_order,address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [actor.schoolId, input.name, input.studentNumber ?? null, input.birthDate ?? null, input.birthPlace ?? null, input.nickname ?? null, input.gender ?? null, input.religion ?? null, input.childOrder ?? null, input.address ?? null]);
      if (input.classPeriodId) { const period=(await client.query("SELECT academic_year_id FROM class_periods WHERE id=$1",[input.classPeriodId])).rows[0]; if(!period) throw new Error("Kelas tidak ditemukan"); await client.query("INSERT INTO student_enrollments(school_id,student_id,academic_year_id,class_period_id) VALUES($1,$2,$3,$4)",[actor.schoolId,result.rows[0].id,period.academic_year_id,input.classPeriodId]); } await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.created", entityType: "student", entityId: result.rows[0].id }, client); return result.rows[0];
    }, actor.schoolId);
  }

  @Get("requests")
  requests(@Req() request: FastifyRequest) { const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]); return this.db.transaction(async client => (await client.query(`SELECT request.id,request.status,request.payload,request.review_note,request.created_at,request.target_class_period_id,grouping.name AS class_name,requester.name AS requester_name FROM student_admission_requests request JOIN class_periods period ON period.id=request.target_class_period_id JOIN class_groups grouping ON grouping.id=period.class_group_id JOIN users requester ON requester.id=request.requested_by WHERE request.school_id=$1 AND ($2::uuid IS NULL OR request.requested_by=$2) ORDER BY request.created_at DESC`, [actor.schoolId, actor.role === "TEACHER" ? actor.userId : null])).rows, actor.schoolId); }

  @Post("requests/:id/decision")
  async decideRequest(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) { const actor = this.auth.require(request, ["SCHOOL_ADMIN"]); const input = admissionDecisionSchema.parse(body); return this.db.transaction(async client => { const requestRow = (await client.query<any>("SELECT * FROM student_admission_requests WHERE id=$1 AND school_id=$2 AND status='PENDING' FOR UPDATE", [id, actor.schoolId])).rows[0]; if (!requestRow) throw new Error("Pengajuan murid menunggu persetujuan tidak ditemukan."); if (input.decision === "REJECTED") { await client.query("UPDATE student_admission_requests SET status='REJECTED',reviewed_by=$2,reviewed_at=now(),review_note=$3,updated_at=now() WHERE id=$1", [id, actor.userId, input.note]); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student_admission.rejected", entityType: "student_admission_request", entityId: id, metadata: { note: input.note } }, client); return { id, status: "REJECTED" }; } const payload = studentSchema.parse(requestRow.payload); const period = (await client.query("SELECT academic_year_id FROM class_periods WHERE id=$1 AND school_id=$2", [requestRow.target_class_period_id, actor.schoolId])).rows[0]; if (!period) throw new Error("Kelas tujuan tidak ditemukan."); const student = (await client.query("INSERT INTO students(school_id,name,student_number,birth_date,birth_place,nickname,gender,religion,child_order,address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id", [actor.schoolId, payload.name, payload.studentNumber ?? null, payload.birthDate ?? null, payload.birthPlace ?? null, payload.nickname ?? null, payload.gender ?? null, payload.religion ?? null, payload.childOrder ?? null, payload.address ?? null])).rows[0]; await client.query("INSERT INTO student_enrollments(school_id,student_id,academic_year_id,class_period_id) VALUES($1,$2,$3,$4)", [actor.schoolId, student.id, period.academic_year_id, requestRow.target_class_period_id]); await client.query("UPDATE student_admission_requests SET status='APPROVED',reviewed_by=$2,reviewed_at=now(),review_note=$3,created_student_id=$4,updated_at=now() WHERE id=$1", [id, actor.userId, input.note ?? null, student.id]); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student_admission.approved", entityType: "student_admission_request", entityId: id, metadata: { studentId: student.id } }, client); return { id, status: "APPROVED", studentId: student.id }; }, actor.schoolId); }

  @Get(":id")
  detail(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.require(request);
    return this.db.transaction(async (client) => { const student = (await client.query("SELECT s.*,grouping.name AS class_name,enrollment.class_period_id FROM students s LEFT JOIN student_enrollments enrollment ON enrollment.student_id=s.id AND enrollment.effective_start_on<=CURRENT_DATE AND (enrollment.effective_end_on IS NULL OR enrollment.effective_end_on>CURRENT_DATE) LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id WHERE s.id=$1 AND s.school_id=$2", [id, actor.schoolId])).rows[0]; if (!student) return null; const guardians = (await client.query("SELECT * FROM guardian_contacts WHERE student_id=$1 AND school_id=$2 ORDER BY is_primary DESC,name", [id, actor.schoolId])).rows; const enrollments=(await client.query("SELECT enrollment.*,year.name AS academic_year_name,grouping.name AS class_name FROM student_enrollments enrollment JOIN academic_years year ON year.id=enrollment.academic_year_id LEFT JOIN class_periods period ON period.id=enrollment.class_period_id LEFT JOIN class_groups grouping ON grouping.id=period.class_group_id WHERE enrollment.student_id=$1 AND enrollment.school_id=$2 ORDER BY year.starts_on DESC,enrollment.effective_start_on DESC",[id,actor.schoolId])).rows; const publishedReports=(await client.query(`SELECT report.id,year.name AS academic_year_name,semester.name AS semester_name,version.version_number,version.published_at FROM reports report JOIN semesters semester ON semester.id=report.semester_id JOIN academic_years year ON year.id=semester.academic_year_id JOIN LATERAL (SELECT version_number,published_at FROM report_versions WHERE report_id=report.id AND report_versions.school_id=$2 ORDER BY version_number DESC LIMIT 1) version ON true WHERE report.student_id=$1 AND report.school_id=$2 ORDER BY year.starts_on DESC,semester.starts_on DESC`,[id,actor.schoolId])).rows; return { ...student, guardians,enrollments,publishedReports }; }, actor.schoolId);
  }

  @Patch(":id")
  async update(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]); const input = studentSchema.parse(body);
    return this.db.transaction(async (client) => {
      if (actor.role === "TEACHER") await this.assertTeacherStudent(client, actor.userId, actor.schoolId, id);
      const result = await client.query("UPDATE students SET name=$3,student_number=$4,birth_date=$5,birth_place=$6,nickname=$7,gender=$8,religion=$9,child_order=$10,address=$11,updated_at=now() WHERE id=$1 AND school_id=$2 RETURNING *", [id, actor.schoolId, input.name, input.studentNumber ?? null, input.birthDate ?? null, input.birthPlace ?? null, input.nickname ?? null, input.gender ?? null, input.religion ?? null, input.childOrder ?? null, input.address ?? null]);
      if (!result.rowCount) throw new Error("Murid tidak ditemukan"); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "student.updated", entityType: "student", entityId: id }, client); return result.rows[0];
    }, actor.schoolId);
  }

  @Post(":id/guardians")
  async createGuardian(@Req() request: FastifyRequest, @Param("id") id: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]); return this.saveGuardian(actor, id, guardianSchema.parse(body));
  }

  @Patch(":id/guardians/:guardianId")
  async updateGuardian(@Req() request: FastifyRequest, @Param("id") id: string, @Param("guardianId") guardianId: string, @Body() body: unknown) {
    const actor = this.auth.require(request, ["SCHOOL_ADMIN", "TEACHER"]); const input = guardianSchema.parse(body);
    return this.db.transaction(async (client) => {
      await this.assertStudent(client, id, actor.schoolId); if (actor.role === "TEACHER") await this.assertTeacherStudent(client, actor.userId, actor.schoolId, id); if (input.isPrimary) await client.query("UPDATE guardian_contacts SET is_primary=false WHERE student_id=$1 AND school_id=$2", [id, actor.schoolId]);
      const result = await client.query("UPDATE guardian_contacts SET name=$4,relationship=$5,phone=$6,occupation=$7,is_primary=$8,is_delivery_recipient=$9 WHERE id=$1 AND student_id=$2 AND school_id=$3 RETURNING *", [guardianId, id, actor.schoolId, input.name, input.relationship, input.phone, input.occupation ?? null, input.isPrimary, input.isDeliveryRecipient]);
      if (!result.rowCount) throw new Error("Data wali tidak ditemukan"); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "guardian.updated", entityType: "guardian_contact", entityId: guardianId }, client); return result.rows[0];
    }, actor.schoolId);
  }

  private async saveGuardian(actor: { schoolId: string; userId: string; role?: string }, studentId: string, input: z.infer<typeof guardianSchema>) {
    return this.db.transaction(async (client) => { await this.assertStudent(client, studentId, actor.schoolId); if (actor.role === "TEACHER") await this.assertTeacherStudent(client, actor.userId, actor.schoolId, studentId); if (input.isPrimary) await client.query("UPDATE guardian_contacts SET is_primary=false WHERE student_id=$1 AND school_id=$2", [studentId, actor.schoolId]); const result = await client.query("INSERT INTO guardian_contacts (school_id,student_id,name,relationship,phone,occupation,is_primary,is_delivery_recipient) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [actor.schoolId, studentId, input.name, input.relationship, input.phone, input.occupation ?? null, input.isPrimary, input.isDeliveryRecipient]); await this.audit.record({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "guardian.created", entityType: "guardian_contact", entityId: result.rows[0].id }, client); return result.rows[0]; }, actor.schoolId);
  }

  private async assertStudent(client: { query: Function }, studentId: string, schoolId: string) { const student = (await client.query("SELECT id FROM students WHERE id=$1 AND school_id=$2", [studentId, schoolId])).rows[0]; if (!student) throw new Error("Siswa tidak ditemukan"); return student; }
  private async assertTeacherClass(client: { query: Function }, userId: string, schoolId: string, classPeriodId: string) { const row = (await client.query("SELECT 1 FROM teacher_class_assignments WHERE school_id=$1 AND teacher_user_id=$2 AND class_period_id=$3 AND ended_at IS NULL", [schoolId, userId, classPeriodId])).rows[0]; if (!row) throw new Error("Kelas tersebut bukan penugasan Anda."); }
  private async assertTeacherStudent(client: { query: Function }, userId: string, schoolId: string, studentId: string) { const row = (await client.query("SELECT 1 FROM student_enrollments enrollment JOIN teacher_class_assignments assignment ON assignment.class_period_id=enrollment.class_period_id AND assignment.ended_at IS NULL WHERE enrollment.school_id=$1 AND enrollment.student_id=$2 AND enrollment.effective_start_on<=CURRENT_DATE AND (enrollment.effective_end_on IS NULL OR enrollment.effective_end_on>CURRENT_DATE) AND assignment.teacher_user_id=$3 AND assignment.school_id=$1", [schoolId, studentId, userId])).rows[0]; if (!row) throw new Error("Murid ini bukan bagian dari kelas penugasan Anda."); }
}
