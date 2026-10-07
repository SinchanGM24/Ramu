import { Injectable } from "@nestjs/common";
import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import PDFDocument from "pdfkit";
import { DatabaseService } from "../database/database.service";

type Snapshot = { report?: { id?: string }; student?: { name?: string; student_number?: string | null; class_name?: string | null; nickname?: string | null }; semester?: { name?: string; academic_year_name?: string | null }; assessments?: { area_name?: string; sub_area_name?: string; description?: string; code?: string }[]; narratives?: { name?: string; content?: string }[]; extracurricular?: { activity_name?: string; grade?: string }[]; portfolio?: { original_filename?: string; caption?: string | null }[]; growth?: { weight_kg?: number | string; height_cm?: number | string } | null; attendance?: { sick_days?: number; permission_days?: number; unexcused_days?: number } | null };

@Injectable()
export class ReportPdfService {
  constructor(private readonly db: DatabaseService) {}
  private readonly bucket = process.env.OBJECT_STORAGE_BUCKET || "ramu-private";
  private readonly client = new S3Client({
    region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "ramu_minio", secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY || "ramu_minio_password" },
  });

  async storePublishedReport(input: { schoolId: string; reportId: string; versionNumber: number; snapshot: Snapshot }) {
    const key = `schools/${input.schoolId}/reports/${input.reportId}/versions/${input.versionNumber}.pdf`;
    const extracurricular = await this.db.transaction(async (client) => (await client.query<{ activity_name: string; grade: string }>(`SELECT e.activity_name,e.grade FROM extracurricular_records e JOIN reports r ON r.student_id=e.student_id AND r.semester_id=e.semester_id WHERE r.id=$1 ORDER BY e.activity_name`, [input.reportId])).rows, input.schoolId);
    const portfolio = await this.db.transaction(async (client) => (await client.query<{ original_filename: string; caption: string | null }>("SELECT original_filename,caption FROM portfolio_items WHERE report_id=$1 AND included_in_report=true ORDER BY created_at", [input.reportId])).rows, input.schoolId);
    await this.ensureBucket();
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: await this.render({ ...input.snapshot, extracurricular, portfolio }), ContentType: "application/pdf", ContentDisposition: `attachment; filename="rapor-v${input.versionNumber}.pdf"` }));
    return key;
  }

  async readPublishedReport(storageKey: string) {
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    if (!object.Body) throw new Error("File PDF rapor tidak tersedia");
    return Buffer.from(await object.Body.transformToByteArray());
  }

  async storePortfolioImage(input: { schoolId: string; reportId: string; filename: string; contentType: string; body: Buffer }) {
    const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
    const key = `schools/${input.schoolId}/reports/${input.reportId}/portfolio/${crypto.randomUUID()}.${extension}`;
    await this.ensureBucket();
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: input.body, ContentType: input.contentType }));
    return key;
  }

  private async ensureBucket() {
    try { await this.client.send(new HeadBucketCommand({ Bucket: this.bucket })); }
    catch { await this.client.send(new CreateBucketCommand({ Bucket: this.bucket })); }
  }

  private render(snapshot: Snapshot): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ margin: 48, size: "A4" });
      const chunks: Buffer[] = [];
      document.on("data", (chunk: Buffer) => chunks.push(chunk));
      document.on("error", reject);
      document.on("end", () => resolve(Buffer.concat(chunks)));
      document.fontSize(18).font("Helvetica-Bold").text("Laporan Perkembangan Anak Didik", { align: "center" });
      document.moveDown().fontSize(11).font("Helvetica").text(`Nama anak didik: ${snapshot.student?.name || "-"}`);
      document.text(`Nomor induk: ${snapshot.student?.student_number || "-"}`);
      document.text(`Semester: ${snapshot.semester?.name || "-"}`);
      document.moveDown().font("Helvetica-Bold").text("Perkembangan Anak Didik").font("Helvetica");
      for (const assessment of snapshot.assessments || []) document.text(`• ${assessment.description || "Indikator"}: ${assessment.code || "-"}`);
      document.moveDown().font("Helvetica-Bold").text("Narasi Perkembangan").font("Helvetica");
      for (const narrative of snapshot.narratives || []) { document.text(narrative.name || "Area perkembangan", { underline: true }); document.text(narrative.content || "-"); document.moveDown(0.5); }
      document.moveDown().font("Helvetica-Bold").text("Data Akhir Semester").font("Helvetica");
      document.text(`Pertumbuhan: ${snapshot.growth?.weight_kg ?? "-"} kg, ${snapshot.growth?.height_cm ?? "-"} cm`);
      document.text(`Kehadiran: sakit ${snapshot.attendance?.sick_days ?? "-"} hari, izin ${snapshot.attendance?.permission_days ?? "-"} hari, tanpa keterangan ${snapshot.attendance?.unexcused_days ?? "-"} hari`);
      document.moveDown().font("Helvetica-Bold").text("Ekstrakurikuler").font("Helvetica");
      if (snapshot.extracurricular?.length) for (const activity of snapshot.extracurricular) document.text(`${activity.activity_name || "Kegiatan"}: ${activity.grade || "-"}`);
      else document.text("Belum ada kegiatan ekstrakurikuler.");
      document.moveDown().font("Helvetica-Bold").text("Portfolio Perkembangan").font("Helvetica");
      if (snapshot.portfolio?.length) for (const item of snapshot.portfolio) document.text(`${item.original_filename || "Foto kegiatan"}${item.caption ? `: ${item.caption}` : ""}`);
      else document.text("Belum ada portfolio yang disertakan.");
      document.moveDown(3).text("Guru kelas", { align: "left" });
      document.end();
    });
  }
}
