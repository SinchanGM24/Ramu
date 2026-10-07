import { Injectable } from "@nestjs/common";
import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import PDFDocument from "pdfkit";
import { DatabaseService } from "../database/database.service";

type Snapshot = { school?: { name?: string; address?: string | null }; report?: { id?: string }; student?: { name?: string; student_number?: string | null; class_name?: string | null; nickname?: string | null; birth_date?: string | null; birth_place?: string | null; gender?: string | null; religion?: string | null; child_order?: number | null; address?: string | null }; semester?: { name?: string; academic_year_name?: string | null }; assessments?: { area_name?: string; area_position?: number; sub_area_name?: string; sub_area_position?: number; description?: string; code?: string }[]; narratives?: { name?: string; content?: string }[]; guardians?: { name?: string; relationship?: string; phone?: string; occupation?: string | null }[]; extracurricular?: { activity_name?: string; grade?: string }[]; portfolio?: { original_filename?: string; caption?: string | null }[]; growth?: { weight_kg?: number | string; height_cm?: number | string } | null; attendance?: { sick_days?: number; permission_days?: number; unexcused_days?: number } | null };

@Injectable()
export class ReportPdfService {
  constructor(private readonly db: DatabaseService) {}
  private readonly bucket = process.env.OBJECT_STORAGE_BUCKET || "ramu-private";
  private readonly client = new S3Client({ region: process.env.OBJECT_STORAGE_REGION || "us-east-1", endpoint: process.env.OBJECT_STORAGE_ENDPOINT, forcePathStyle: true, credentials: { accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "ramu_minio", secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY || "ramu_minio_password" } });

  async storePublishedReport(input: { schoolId: string; reportId: string; versionNumber: number; snapshot: Snapshot }) {
    const key = `schools/${input.schoolId}/reports/${input.reportId}/versions/${input.versionNumber}.pdf`;
    const extracurricular = await this.db.transaction(async (client) => (await client.query<{ activity_name: string; grade: string }>("SELECT e.activity_name,e.grade FROM extracurricular_records e JOIN reports r ON r.student_id=e.student_id AND r.semester_id=e.semester_id WHERE r.id=$1 ORDER BY e.activity_name", [input.reportId])).rows, input.schoolId);
    const portfolio = await this.db.transaction(async (client) => (await client.query<{ original_filename: string; caption: string | null }>("SELECT original_filename,caption FROM portfolio_items WHERE report_id=$1 AND included_in_report=true ORDER BY created_at", [input.reportId])).rows, input.schoolId);
    await this.ensureBucket();
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: await this.render({ ...input.snapshot, extracurricular, portfolio }), ContentType: "application/pdf", ContentDisposition: `attachment; filename="rapor-v${input.versionNumber}.pdf"` }));
    return key;
  }

  async readPublishedReport(storageKey: string) { const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey })); if (!object.Body) throw new Error("File PDF rapor tidak tersedia"); return Buffer.from(await object.Body.transformToByteArray()); }
  async storePortfolioImage(input: { schoolId: string; reportId: string; filename: string; contentType: string; body: Buffer }) { const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg"; const key = `schools/${input.schoolId}/reports/${input.reportId}/portfolio/${crypto.randomUUID()}.${extension}`; await this.ensureBucket(); await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: input.body, ContentType: input.contentType })); return key; }
  private async ensureBucket() { try { await this.client.send(new HeadBucketCommand({ Bucket: this.bucket })); } catch { await this.client.send(new CreateBucketCommand({ Bucket: this.bucket })); } }

  private render(snapshot: Snapshot): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ margin: 48, size: "A4" }); const chunks: Buffer[] = [];
      document.on("data", (chunk: Buffer) => chunks.push(chunk)); document.on("error", reject); document.on("end", () => resolve(Buffer.concat(chunks)));
      const ensureSpace = (height = 56) => { if (document.y + height > document.page.height - 54) document.addPage(); };
      const text = (value: string) => { ensureSpace(26); document.font("Helvetica").fontSize(10).text(value); };
      const heading = (value: string) => { ensureSpace(52); document.moveDown(0.7).font("Helvetica-Bold").fontSize(12).text(value).font("Helvetica").fontSize(10); };
      const label = (name: string, value: unknown) => text(`${name}: ${value === null || value === undefined || value === "" ? "-" : value}`);
      const student = snapshot.student || {}; const guardians = snapshot.guardians || [];
      const birthDate = student.birth_date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(student.birth_date)) : "-";

      document.font("Helvetica-Bold").fontSize(10).text(snapshot.school?.name || "", { align: "center" });
      if (snapshot.school?.address) document.font("Helvetica").fontSize(9).text(snapshot.school.address, { align: "center" });
      document.moveDown(0.8).font("Helvetica-Bold").fontSize(16).text("LAPORAN PERKEMBANGAN ANAK DIDIK", { align: "center" });
      document.moveDown(0.6).font("Helvetica").fontSize(10).text(`Kelompok: ${student.class_name || "-"}`, { align: "center" });
      document.text(`Semester: ${snapshot.semester?.name || "-"} | Tahun Pelajaran: ${snapshot.semester?.academic_year_name || "-"}`, { align: "center" });

      heading("Keterangan Anak Didik");
      label("Nama anak didik", student.name); label("Nama panggilan", student.nickname); label("Nomor induk", student.student_number); label("Jenis kelamin", student.gender === "MALE" ? "Laki-laki" : student.gender === "FEMALE" ? "Perempuan" : "-"); label("Tempat, tanggal lahir", student.birth_place ? `${student.birth_place}, ${birthDate}` : birthDate); label("Agama", student.religion); label("Anak ke", student.child_order); label("Alamat", student.address);
      for (const guardian of guardians) label(`Orang tua/wali (${guardian.relationship || "-"})`, `${guardian.name || "-"}${guardian.occupation ? `, ${guardian.occupation}` : ""}${guardian.phone ? `, ${guardian.phone}` : ""}`);

      const narratives = new Map((snapshot.narratives || []).map((narrative) => [narrative.name, narrative.content])); const assessmentRows = snapshot.assessments || []; const areas = new Map<string, Map<string, typeof assessmentRows>>();
      for (const assessment of assessmentRows) { const area = assessment.area_name || "Perkembangan Anak Didik"; const subArea = assessment.sub_area_name || "Indikator"; if (!areas.has(area)) areas.set(area, new Map()); const subAreas = areas.get(area)!; if (!subAreas.has(subArea)) subAreas.set(subArea, []); subAreas.get(subArea)!.push(assessment); }
      let areaNumber = 1;
      for (const [area, subAreas] of areas) {
        heading(`${areaNumber}. ${area}`); areaNumber += 1;
        for (const [subArea, assessments] of subAreas) { ensureSpace(52); document.font("Helvetica-Bold").fontSize(10).text(subArea); document.font("Helvetica").fontSize(9); for (const assessment of assessments) { ensureSpace(30); document.text(assessment.description || "Indikator", { width: 405, continued: true }); document.font("Helvetica-Bold").text(`  ${assessment.code || "-"}`, { align: "right" }).font("Helvetica"); } }
        ensureSpace(64); document.moveDown(0.4).font("Helvetica-Bold").fontSize(10).text("Narasi Perkembangan").font("Helvetica").fontSize(10); document.text(narratives.get(area) || "-");
      }

      heading("Data Akhir Semester"); label("Berat badan", snapshot.growth?.weight_kg === undefined ? "-" : `${snapshot.growth.weight_kg} kg`); label("Tinggi badan", snapshot.growth?.height_cm === undefined ? "-" : `${snapshot.growth.height_cm} cm`); label("Kehadiran", `Sakit ${snapshot.attendance?.sick_days ?? "-"} hari, Izin ${snapshot.attendance?.permission_days ?? "-"} hari, Tanpa keterangan ${snapshot.attendance?.unexcused_days ?? "-"} hari`);
      document.moveDown(0.5).font("Helvetica-Bold").text("Ekstrakurikuler").font("Helvetica"); if (snapshot.extracurricular?.length) for (const activity of snapshot.extracurricular) text(`${activity.activity_name || "Kegiatan"}: ${activity.grade || "-"}`); else text("Tidak ada data ekstrakurikuler.");
      document.moveDown(0.5).font("Helvetica-Bold").text("Portofolio Perkembangan").font("Helvetica"); if (snapshot.portfolio?.length) for (const item of snapshot.portfolio) text(`${item.original_filename || "Foto kegiatan"}${item.caption ? `: ${item.caption}` : ""}`); else text("Tidak ada portofolio yang disertakan.");
      ensureSpace(140); document.moveDown(3).font("Helvetica").fontSize(10).text("Guru kelas", 48, document.y, { width: 180, align: "center" }); document.text("Kepala PAUD", 360, document.y - 12, { width: 180, align: "center" }); document.moveDown(4).text("(________________________)", 48, document.y, { width: 180, align: "center" }); document.text("(________________________)", 360, document.y - 12, { width: 180, align: "center" });
      document.end();
    });
  }
}
