import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
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

  constructor(private readonly db: DatabaseService) {}

  async storePublishedReport(input: {
    schoolId: string;
    reportId: string;
    versionNumber: number;
    snapshot: Snapshot;
  }) {
    const key = `schools/${input.schoolId}/reports/${input.reportId}/versions/${input.versionNumber}.pdf`;
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
    const body = await this.render(
      { ...input.snapshot, extracurricular, portfolio },
      schoolLogo,
    );

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="rapor-v${input.versionNumber}.pdf"`,
      }),
    );

    return key;
  }

  async readPublishedReport(storageKey: string) {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    if (!object.Body) throw new Error("File PDF rapor tidak tersedia");
    return Buffer.from(await object.Body.transformToByteArray());
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
    body: Buffer;
  }) {
    const extension = input.contentType === "image/png" ? "png" : "jpg";
    const key = `schools/${input.schoolId}/profile/logo-${crypto.randomUUID()}.${extension}`;
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return key;
  }

  async storePortfolioImage(input: {
    schoolId: string;
    reportId: string;
    filename: string;
    contentType: string;
    body: Buffer;
  }) {
    const extension =
      input.contentType === "image/png"
        ? "png"
        : input.contentType === "image/webp"
          ? "webp"
          : "jpg";
    const key = `schools/${input.schoolId}/reports/${input.reportId}/portfolio/${crypto.randomUUID()}.${extension}`;
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return key;
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
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
      const text = (value: string) => {
        ensureSpace(26);
        document
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#1f2937")
          .text(value);
      };
      const heading = (value: string) => {
        ensureSpace(52);
        document
          .moveDown(0.7)
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor("#173f35")
          .text(value);
        document.font("Helvetica").fontSize(10).fillColor("#1f2937");
      };
      const label = (name: string, value: unknown) =>
        text(`${name}: ${emptyValue(value)}`);
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
            .font(options?.bold ? "Helvetica-Bold" : "Helvetica")
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
              selectedScale === scale ? "X" : "",
              {
                bold: true,
                center: true,
                size: 10,
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
      document
        .moveDown(0.6)
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#1f2937")
        .text(
          `Nama: ${student.name || "-"} | Nomor induk: ${student.student_number || "-"}`,
          { align: "center" },
        );
      document.text(
        `Kelas: ${student.class_name || "-"} | Semester: ${snapshot.semester?.name || "-"}`,
        { align: "center" },
      );
      document.text(
        `Tahun Pelajaran: ${snapshot.semester?.academic_year_name || "-"}`,
        { align: "center" },
      );

      heading("Keterangan Anak Didik");
      label("Nama anak didik", student.name);
      label("Nama panggilan", student.nickname);
      label("Nomor induk", student.student_number);
      label(
        "Jenis kelamin",
        student.gender === "MALE"
          ? "Laki-laki"
          : student.gender === "FEMALE"
            ? "Perempuan"
            : "-",
      );
      label(
        "Tempat, tanggal lahir",
        student.birth_place
          ? `${student.birth_place}, ${birthDate}`
          : birthDate,
      );
      label("Agama", student.religion);
      label("Anak ke", student.child_order);
      label("Alamat", student.address);
      guardians.forEach((guardian) => {
        label(
          `Orang tua/wali (${guardian.relationship || "-"})`,
          `${guardian.name || "-"}${guardian.occupation ? `, ${guardian.occupation}` : ""}${guardian.phone ? `, ${guardian.phone}` : ""}`,
        );
      });

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
        ensureSpace(72);
        document
          .moveDown(0.35)
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("#173f35")
          .text("Narasi Perkembangan");
        const narrative = narratives.get(area) || "-";
        const narrativeHeight = Math.max(
          42,
          document.heightOfString(narrative, { width: contentWidth - 16 }) + 16,
        );
        if (document.y + narrativeHeight > pageBottom()) document.addPage();
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
          .text(narrative, left + 8, narrativeY + 8, {
            width: contentWidth - 16,
          });
        document.y = narrativeY + narrativeHeight;
      });

      heading("Data Akhir Semester");
      label(
        "Berat badan",
        snapshot.growth?.weight_kg == null
          ? "-"
          : `${snapshot.growth.weight_kg} kg`,
      );
      label(
        "Tinggi badan",
        snapshot.growth?.height_cm == null
          ? "-"
          : `${snapshot.growth.height_cm} cm`,
      );
      label(
        "Kehadiran",
        `Sakit ${snapshot.attendance?.sick_days ?? "-"} hari, Izin ${snapshot.attendance?.permission_days ?? "-"} hari, Tanpa keterangan ${snapshot.attendance?.unexcused_days ?? "-"} hari`,
      );
      document
        .moveDown(0.5)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Ekstrakurikuler")
        .font("Helvetica");
      if (snapshot.extracurricular?.length) {
        snapshot.extracurricular.forEach((activity) =>
          text(
            `${activity.activity_name || "Kegiatan"}: ${activity.grade || "-"}`,
          ),
        );
      } else {
        text("Tidak ada data ekstrakurikuler.");
      }
      document
        .moveDown(0.5)
        .font("Helvetica-Bold")
        .text("Portofolio Perkembangan")
        .font("Helvetica");
      if (snapshot.portfolio?.length) {
        snapshot.portfolio.forEach((item) =>
          text(
            `${item.original_filename || "Foto kegiatan"}${item.caption ? `: ${item.caption}` : ""}`,
          ),
        );
      } else {
        text("Tidak ada portofolio yang disertakan.");
      }

      const teachers = snapshot.teachers || [];
      heading("Guru yang Bertanggung Jawab");
      teachers.forEach((teacher) =>
        label(
          "Guru",
          `${teacher.name || "-"}${teacher.phone ? `, ${teacher.phone}` : ""}`,
        ),
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
