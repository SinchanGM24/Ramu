import { Injectable } from "@nestjs/common";
import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import PDFDocument from "pdfkit";

type Snapshot = { report?: { id?: string }; student?: { name?: string; student_number?: string | null }; semester?: { name?: string }; assessments?: { description?: string; code?: string }[]; narratives?: { name?: string; content?: string }[]; growth?: { weight_kg?: number | string; height_cm?: number | string } | null; attendance?: { sick_days?: number; permission_days?: number; unexcused_days?: number } | null };

@Injectable()
export class ReportPdfService {
  private readonly bucket = process.env.OBJECT_STORAGE_BUCKET || "ramu-private";
  private readonly client = new S3Client({
    region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "ramu_minio", secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY || "ramu_minio_password" },
  });

  async storePublishedReport(input: { schoolId: string; reportId: string; versionNumber: number; snapshot: Snapshot }) {
    const key = `schools/${input.schoolId}/reports/${input.reportId}/versions/${input.versionNumber}.pdf`;
    await this.ensureBucket();
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: await this.render(input.snapshot), ContentType: "application/pdf", ContentDisposition: `attachment; filename="rapor-v${input.versionNumber}.pdf"` }));
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
      document.moveDown(3).text("Guru kelas", { align: "left" });
      document.end();
    });
  }
}
