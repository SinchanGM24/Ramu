import { Controller, ForbiddenException, Get, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ReportPublicationJobsService } from "../reports/report-publication-jobs.service";
import { DataRetentionService } from "./data-retention.service";

@Controller("internal")
export class InternalMaintenanceController {
  constructor(
    private readonly retention: DataRetentionService,
    private readonly publicationJobs: ReportPublicationJobsService,
  ) {}

  @Get("retention/cleanup")
  async runRetentionFromCron(@Req() request: FastifyRequest) {
    this.assertCronSecret(request);
    await this.retention.runCleanup();
    return { ok: true };
  }

  @Post("retention/cleanup")
  async runRetentionManually(@Req() request: FastifyRequest) {
    this.assertCronSecret(request);
    await this.retention.runCleanup();
    return { ok: true };
  }

  @Post("report-publications/process-next")
  async processNextPublication(@Req() request: FastifyRequest) {
    this.assertCronSecret(request);
    return { processed: await this.publicationJobs.processNext() };
  }

  private assertCronSecret(request: FastifyRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
      throw new ForbiddenException("Akses pekerjaan internal tidak valid.");
    }
  }
}
