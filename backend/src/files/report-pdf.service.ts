import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, Logger } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { DatabaseService } from "../database/database.service";

type SnapshotAssessment = {
  area_name?: string;
  area_position?: number;
  sub_area_name?: string;
  sub_area_position?: number;
  description?: string;
  code?: string;
};

type Snapshot = {
  school?: {
    name?: string;
    address?: string | null;
    logo_storage_key?: string | null;
  };
  report?: { id?: string };
  student?: {
    name?: string;
    student_number?: string | null;
    class_name?: string | null;
    nickname?: string | null;
    birth_date?: string | null;
    birth_place?: string | null;
    gender?: string | null;
    religion?: string | null;
    child_order?: number | null;
    address?: string | null;
  };
  semester?: { name?: string; academic_year_name?: string | null };
  teachers?: { name?: string; phone?: string | null }[];
  assessments?: SnapshotAssessment[];
  narratives?: { name?: string; content?: string }[];
  guardians?: {
    name?: string;
    relationship?: string;
    phone?: string;
    occupation?: string | null;
  }[];
  extracurricular?: { activity_name?: string; grade?: string }[];
  portfolio?: { original_filename?: string; caption?: string | null }[];
  growth?: {
    weight_kg?: number | string | null;
    height_cm?: number | string | null;
  } | null;
  attendance?: {
    sick_days?: number;
    permission_days?: number;
    unexcused_days?: number;
  } | null;
};

const scaleDescriptions: Record<string, string> = {
  BB: "Belum Berkembang",
  MB: "Mulai Berkembang",
  BSH: "Berkembang Sesuai Harapan",
  BSB: "Berkembang Sangat Baik",
};

@Injectable()
export class ReportPdfService {
  private readonly logger = new Logger(ReportPdfService.name);
  private readonly bucket = process.env.OBJECT_STORAGE_BUCKET || "ramu-private";
  private readonly client = new S3Client({
    region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "ramu_minio",
      secretAccessKey:
        process.env.OBJECT_STORAGE_SECRET_KEY || "ramu_minio_password",
    },
  });
  private bucketReady: Promise<void> | undefined;

  constructor(private readonly db: DatabaseService) {}

  async storePublishedReport(input: {
    schoolId: string;
    reportId: string;
    versionNumber: number;
    storageSuffix?: string;
    snapshot: Snapshot;
  }) {
    const suffix = input.storageSuffix ? `-${input.storageSuffix}` : "";
    const key = `schools/${input.schoolId}/reports/${input.reportId}/versions/${input.versionNumber}${suffix}.pdf`;
    const extracurricular = await this.db.transaction(
      async (client) =>
        (
          await client.query<{ activity_name: string; grade: string }>(
            "SELECT e.activity_name,e.grade FROM extracurricular_records e JOIN reports r ON r.student_id=e.student_id AND r.semester_id=e.semester_id WHERE r.id=$1 ORDER BY e.activity_name",
            [input.reportId],
          )
        ).rows,
      input.schoolId,
    );
    const portfolio = await this.db.transaction(
      async (client) =>
        (
          await client.query<{
            original_filename: string;
            caption: string | null;
          }>(
            "SELECT original_filename,caption FROM portfolio_items WHERE report_id=$1 AND included_in_report=true ORDER BY created_at",
            [input.reportId],
          )
        ).rows,
      input.schoolId,
    );

    await this.ensureBucket();
    const schoolLogo = input.snapshot.school?.logo_storage_key
      ? await this.readStoredImage(input.snapshot.school.logo_storage_key)
      : undefined;
    const body = await this.measure(
      "report_pdf.rendered",
      () =>
        this.render(
          { ...input.snapshot, extracurricular, portfolio },
          schoolLogo,
        ),
      { report: true },
    );

    await this.measure(
      "object_storage.report_uploaded",
      () =>
        this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: "application/pdf",
            ContentDisposition: `attachment; filename="raport-v${input.versionNumber}.pdf"`,
          }),
        ),
      { bytes: body.length },
    );

    return key;
  }

  async assertStorageReady() {
    await this.ensureBucket();
  }

  async readPublishedReport(storageKey: string) {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    if (!object.Body) throw new Error("File PDF raport tidak tersedia");
    return Buffer.from(await object.Body.transformToByteArray());
  }

  async deleteStoredObject(storageKey: string) {
    await this.measure(
      "object_storage.object_deleted",
      () =>
        this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
        ),
      {},
    );
  }

  async readStoredImage(storageKey: string) {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    if (!object.Body) throw new Error("Logo sekolah tidak tersedia");
    return Buffer.from(await object.Body.transformToByteArray());
  }

  async storeSchoolLogo(input: {
    schoolId: string;
    contentType: string;
    extension?: string;
    body: Buffer;
  }) {
    const extension = input.extension || "jpg";
    const key = `schools/${input.schoolId}/profile/logo-${crypto.randomUUID()}.${extension}`;
    await this.ensureBucket();
    await this.measure(
      "object_storage.logo_uploaded",
      () =>
        this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: input.body,
            ContentType: input.contentType,
          }),
        ),
      { bytes: input.body.length },
    );
    return key;
  }

  async storePortfolioImage(input: {
    schoolId: string;
    reportId: string;
    filename: string;
    contentType: string;
    extension?: string;
    body: Buffer;
  }) {
    const extension = input.extension || "jpg";
    const key = `schools/${input.schoolId}/reports/${input.reportId}/portfolio/${crypto.randomUUID()}.${extension}`;
    await this.ensureBucket();
    await this.measure(
      "object_storage.portfolio_uploaded",
      () =>
        this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: input.body,
            ContentType: input.contentType,
          }),
        ),
      { bytes: input.body.length },
    );
    return key;
  }

  private async ensureBucket() {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        try {
          await this.client.send(
            new HeadBucketCommand({ Bucket: this.bucket }),
          );
        } catch {
          await this.client.send(
            new CreateBucketCommand({ Bucket: this.bucket }),
          );
        }
      })().catch((error) => {
        this.bucketReady = undefined;
        throw error;
      });
    }
    await this.bucketReady;
  }

  private async measure<T>(
    event: string,
    operation: () => Promise<T>,
    metadata: Record<string, unknown>,
  ) {
    const startedAt = performance.now();
    try {
      return await operation();
    } finally {
      this.logger.log({
        event,
        durationMs: Math.round(performance.now() - startedAt),
        ...metadata,
      });
    }
  }

  private render(snapshot: Snapshot, schoolLogo?: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ margin: 48, size: "A4" });
      const chunks: Buffer[] = [];
      const left = 48;
      const contentWidth = document.page.width - left * 2;
      const pageBottom = () => document.page.height - 54;

      document.on("data", (chunk: Buffer) => chunks.push(chunk));
      document.on("error", reject);
      document.on("end", () => resolve(Buffer.concat(chunks)));

      const ensureSpace = (height = 56) => {
        if (document.y + height > pageBottom()) document.addPage();
      };
      const emptyValue = (value: unknown) =>
        value === null || value === undefined || value === ""
          ? "-"
          : String(value);
      const heading = (value: string) => {
        ensureSpace(40);
        document.moveDown(0.7);
        const y = document.y;
        document.fillColor("#e7f0eb").rect(left, y, contentWidth, 25).fill();
        document
          .fillColor("#173f35")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(value, left + 8, y + 8, { width: contentWidth - 16 });
        document.y = y + 25;
      };
      const drawInfoGrid = (
        items: Array<{ label: string; value: unknown; fullWidth?: boolean }>,
      ) => {
        const gap = 8;
        const columnWidth = (contentWidth - gap) / 2;
        const cellHeight = (
          item: { label: string; value: unknown },
          width: number,
        ) => {
          document.font("Helvetica").fontSize(9);
          const valueHeight = document.heightOfString(emptyValue(item.value), {
            width: width - 16,
          });
          return Math.max(42, valueHeight + 25);
        };
        const drawCell = (
          x: number,
          y: number,
          width: number,
          height: number,
          item: { label: string; value: unknown },
        ) => {
          document.save();
          document.fillColor("#fbfcf9").rect(x, y, width, height).fill();
          document
            .strokeColor("#cbd5d1")
            .lineWidth(0.45)
            .rect(x, y, width, height)
            .stroke();
          document
            .fillColor("#637065")
            .font("Helvetica-Bold")
            .fontSize(7)
            .text(item.label.toUpperCase(), x + 8, y + 7, {
              width: width - 16,
            });
          document
            .fillColor("#1f2937")
            .font("Helvetica")
            .fontSize(9)
            .text(emptyValue(item.value), x + 8, y + 18, { width: width - 16 });
          document.restore();
        };

        let index = 0;
        while (index < items.length) {
          const first = items[index];
          const second = first.fullWidth ? undefined : items[index + 1];
          const firstWidth = second ? columnWidth : contentWidth;
          const rowHeight = Math.max(
            cellHeight(first, firstWidth),
            second ? cellHeight(second, columnWidth) : 0,
          );
          ensureSpace(rowHeight + 2);
          const y = document.y;
          drawCell(left, y, firstWidth, rowHeight, first);
          if (second)
            drawCell(
              left + columnWidth + gap,
              y,
              columnWidth,
              rowHeight,
              second,
            );
          document.y = y + rowHeight;
          index += second ? 2 : 1;
        }
      };
      const drawListBlock = (title: string, values: string[]) => {
        const content = values.length ? values.join("\n") : "-";
        document.font("Helvetica").fontSize(9);
        const height = Math.max(
          48,
          document.heightOfString(content, { width: contentWidth - 16 }) + 31,
        );
        ensureSpace(height + 6);
        document.moveDown(0.45);
        const y = document.y;
        document
          .fillColor("#fbfcf9")
          .rect(left, y, contentWidth, height)
          .fill();
        document
          .strokeColor("#cbd5d1")
          .lineWidth(0.45)
          .rect(left, y, contentWidth, height)
          .stroke();
        document
          .fillColor("#173f35")
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(title, left + 8, y + 8, { width: contentWidth - 16 });
        document
          .fillColor("#1f2937")
          .font("Helvetica")
          .fontSize(9)
          .text(content, left + 8, y + 21, { width: contentWidth - 16 });
        document.y = y + height;
      };
      const drawAssessmentTable = (
        title: string,
        number: number,
        items: SnapshotAssessment[],
      ) => {
        const columnWidths = [28, 323, 37, 37, 37, 37];
        const tableHeaderHeight = 26;
        const drawCell = (
          x: number,
          y: number,
          width: number,
          height: number,
          value: string,
          options?: {
            bold?: boolean;
            center?: boolean;
            fill?: string;
            mark?: boolean;
            size?: number;
          },
        ) => {
          document.save();
          document
            .fillColor(options?.fill || "#ffffff")
            .rect(x, y, width, height)
            .fill();
          document
            .strokeColor("#94a3b8")
            .lineWidth(0.45)
            .rect(x, y, width, height)
            .stroke();
          document
            .fillColor("#1f2937")
            .font(
              options?.mark
                ? "ZapfDingbats"
                : options?.bold
                  ? "Helvetica-Bold"
                  : "Helvetica",
            )
            .fontSize(options?.size || 8);
          const textWidth = width - 10;
          const textHeight = document.heightOfString(value, {
            width: textWidth,
            align: options?.center ? "center" : "left",
          });
          document.text(
            value,
            x + 5,
            y + Math.max(4, (height - textHeight) / 2),
            {
              width: textWidth,
              align: options?.center ? "center" : "left",
            },
          );
          document.restore();
        };
        const drawHeader = () => {
          const y = document.y;
          let x = left;
          ["No", "Aspek perkembangan", "BB", "MB", "BSH", "BSB"].forEach(
            (value, index) => {
              drawCell(x, y, columnWidths[index], tableHeaderHeight, value, {
                bold: true,
                center: index !== 1,
                fill: "#dce8e2",
                size: 8,
              });
              x += columnWidths[index];
            },
          );
          document.y = y + tableHeaderHeight;
        };

        ensureSpace(72);
        document.moveDown(0.7);
        const titleY = document.y;
        document
          .fillColor("#e7f0eb")
          .rect(left, titleY, contentWidth, 24)
          .fill();
        document
          .fillColor("#173f35")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`${number}. ${title}`, left + 8, titleY + 7, {
            width: contentWidth - 16,
          });
        document.y = titleY + 24;
        drawHeader();

        items.forEach((item, index) => {
          const detail = `${item.sub_area_name || "Indikator"}\n${item.description || "-"}`;
          document.font("Helvetica").fontSize(8);
          const detailHeight = document.heightOfString(detail, {
            width: columnWidths[1] - 10,
          });
          const rowHeight = Math.max(38, detailHeight + 12);
          if (document.y + rowHeight > pageBottom()) {
            document.addPage();
            drawHeader();
          }

          const y = document.y;
          const selectedScale = item.code || "";
          let x = left;
          drawCell(x, y, columnWidths[0], rowHeight, String(index + 1), {
            center: true,
          });
          x += columnWidths[0];
          drawCell(x, y, columnWidths[1], rowHeight, detail);
          x += columnWidths[1];
          ["BB", "MB", "BSH", "BSB"].forEach((scale, scaleIndex) => {
            drawCell(
              x,
              y,
              columnWidths[scaleIndex + 2],
              rowHeight,
              selectedScale === scale ? "3" : "",
              {
                bold: true,
                center: true,
                mark: selectedScale === scale,
                size: 12,
              },
            );
            x += columnWidths[scaleIndex + 2];
          });
          document.y = y + rowHeight;
        });
      };

      const student = snapshot.student || {};
      const guardians = snapshot.guardians || [];
      const birthDate = student.birth_date
        ? new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(student.birth_date))
        : "-";

      const headerX = schoolLogo ? 124 : left;
      const headerWidth = schoolLogo ? contentWidth - 76 : contentWidth;
      if (schoolLogo) document.image(schoolLogo, left, 48, { fit: [60, 60] });
      document
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#173f35")
        .text(snapshot.school?.name || "", headerX, 48, {
          width: headerWidth,
          align: "center",
        });
      if (snapshot.school?.address) {
        document
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#334155")
          .text(snapshot.school.address, headerX, undefined, {
            width: headerWidth,
            align: "center",
          });
      }
      document
        .moveDown(0.8)
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#173f35")
        .text("LAPORAN PERKEMBANGAN ANAK DIDIK", {
          align: "center",
        });
      document.text(
        `Kelas: ${student.class_name || "-"}  |  Semester: ${snapshot.semester?.name || "-"}  |  Tahun Pelajaran: ${snapshot.semester?.academic_year_name || "-"}`,
        { align: "center" },
      );

      heading("Keterangan Anak Didik");
      drawInfoGrid([
        { label: "Nama anak didik", value: student.name },
        { label: "Nama panggilan", value: student.nickname },
        { label: "Nomor induk", value: student.student_number },
        {
          label: "Jenis kelamin",
          value:
            student.gender === "MALE"
              ? "Laki-laki"
              : student.gender === "FEMALE"
                ? "Perempuan"
                : "-",
        },
        {
          label: "Tempat, tanggal lahir",
          value: student.birth_place
            ? `${student.birth_place}, ${birthDate}`
            : birthDate,
        },
        { label: "Agama", value: student.religion },
        { label: "Anak ke", value: student.child_order },
        { label: "Alamat", value: student.address, fullWidth: true },
        ...guardians.map((guardian) => ({
          label: `Orang tua/wali (${guardian.relationship || "-"})`,
          value: `${guardian.name || "-"}${guardian.occupation ? `, ${guardian.occupation}` : ""}${guardian.phone ? `, ${guardian.phone}` : ""}`,
          fullWidth: true,
        })),
      ]);

      ensureSpace(80);
      document.moveDown(0.7);
      const legendY = document.y;
      const legendWidth = contentWidth / 4;
      Object.entries(scaleDescriptions).forEach(
        ([scale, description], index) => {
          document.save();
          document
            .fillColor("#f6faf7")
            .rect(left + index * legendWidth, legendY, legendWidth, 30)
            .fill();
          document
            .strokeColor("#94a3b8")
            .lineWidth(0.45)
            .rect(left + index * legendWidth, legendY, legendWidth, 30)
            .stroke();
          document
            .fillColor("#173f35")
            .font("Helvetica-Bold")
            .fontSize(8)
            .text(scale, left + index * legendWidth + 6, legendY + 6);
          document
            .fillColor("#334155")
            .font("Helvetica")
            .fontSize(6.5)
            .text(description, left + index * legendWidth + 6, legendY + 16, {
              width: legendWidth - 12,
            });
          document.restore();
        },
      );
      document.y = legendY + 30;

      const narratives = new Map(
        (snapshot.narratives || []).map((narrative) => [
          narrative.name,
          narrative.content,
        ]),
      );
      const areas = new Map<string, SnapshotAssessment[]>();
      (snapshot.assessments || []).forEach((assessment) => {
        const area = assessment.area_name || "Perkembangan Anak Didik";
        areas.set(area, [...(areas.get(area) || []), assessment]);
      });

      let areaNumber = 1;
      areas.forEach((items, area) => {
        drawAssessmentTable(area, areaNumber, items);
        areaNumber += 1;
        const narrative = narratives.get(area) || "-";
        const narrativeHeight = Math.max(
          50,
          document.heightOfString(narrative, { width: contentWidth - 16 }) + 30,
        );
        ensureSpace(narrativeHeight + 30);
        document.moveDown(0.4);
        const narrativeY = document.y;
        document
          .fillColor("#f6faf7")
          .rect(left, narrativeY, contentWidth, narrativeHeight)
          .fill();
        document
          .strokeColor("#b8c9bf")
          .lineWidth(0.45)
          .rect(left, narrativeY, contentWidth, narrativeHeight)
          .stroke();
        document
          .fillColor("#1f2937")
          .font("Helvetica")
          .fontSize(9)
          .text(narrative, left + 8, narrativeY + 25, {
            width: contentWidth - 16,
          });
        document
          .fillColor("#173f35")
          .font("Helvetica-Bold")
          .fontSize(9)
          .text("Narasi Perkembangan", left + 8, narrativeY + 8, {
            width: contentWidth - 16,
          });
        document.y = narrativeY + narrativeHeight;
      });

      heading("Data Akhir Semester");
      drawInfoGrid([
        {
          label: "Berat badan",
          value:
            snapshot.growth?.weight_kg == null
              ? "-"
              : `${snapshot.growth.weight_kg} kg`,
        },
        {
          label: "Tinggi badan",
          value:
            snapshot.growth?.height_cm == null
              ? "-"
              : `${snapshot.growth.height_cm} cm`,
        },
        {
          label: "Kehadiran",
          value: `Sakit ${snapshot.attendance?.sick_days ?? "-"} hari, Izin ${snapshot.attendance?.permission_days ?? "-"} hari, Tanpa keterangan ${snapshot.attendance?.unexcused_days ?? "-"} hari`,
          fullWidth: true,
        },
      ]);
      drawListBlock(
        "Ekstrakurikuler",
        snapshot.extracurricular?.length
          ? snapshot.extracurricular.map(
              (activity) =>
                `${activity.activity_name || "Kegiatan"}: ${activity.grade || "-"}`,
            )
          : ["Tidak ada data ekstrakurikuler."],
      );
      drawListBlock(
        "Portofolio Perkembangan",
        snapshot.portfolio?.length
          ? snapshot.portfolio.map(
              (item) =>
                `${item.original_filename || "Foto kegiatan"}${item.caption ? `: ${item.caption}` : ""}`,
            )
          : ["Tidak ada portofolio yang disertakan."],
      );

      const teachers = snapshot.teachers || [];
      heading("Guru yang Bertanggung Jawab");
      drawInfoGrid(
        teachers.length
          ? teachers.map((teacher) => ({
              label: "Guru",
              value: `${teacher.name || "-"}${teacher.phone ? `, ${teacher.phone}` : ""}`,
            }))
          : [{ label: "Guru", value: "-" }],
      );
      ensureSpace(140);
      document
        .moveDown(3)
        .font("Helvetica")
        .fontSize(10)
        .text("Guru kelas", left, document.y, { width: 180, align: "center" });
      document.text("Kepala PAUD", 360, document.y - 12, {
        width: 180,
        align: "center",
      });
      document
        .moveDown(4)
        .text("(________________________)", left, document.y, {
          width: 180,
          align: "center",
        });
      document.text("(________________________)", 360, document.y - 12, {
        width: 180,
        align: "center",
      });
      document.end();
    });
  }
}
