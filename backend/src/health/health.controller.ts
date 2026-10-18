import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { ReportPdfService } from "../files/report-pdf.service";
@Controller("health")
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly pdf: ReportPdfService,
  ) {}
  @Get() async health() {
    await this.db.query("SELECT 1");
    return { status: "ok" };
  }

  @Get("ready")
  async readiness() {
    try {
      await Promise.all([this.db.query("SELECT 1"), this.pdf.assertStorageReady()]);
      return { status: "ready" };
    } catch {
      throw new ServiceUnavailableException("Layanan penyimpanan belum siap");
    }
  }
}
