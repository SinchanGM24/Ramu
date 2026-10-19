import "reflect-metadata";
import * as dotenv from "dotenv";
import { resolve } from "path";
import {
  DataRetentionService,
  getRetentionSettings,
} from "./common/data-retention.service";
import { createHttpApplication } from "./http/app-factory";
import { ReportPublicationJobsService } from "./reports/report-publication-jobs.service";

dotenv.config({ path: resolve(__dirname, "../.env") });

async function bootstrap() {
  const app = await createHttpApplication();
  const retention = app.get(DataRetentionService);
  const publicationJobs = app.get(ReportPublicationJobsService);
  const retentionSettings = getRetentionSettings();
  await retention.runCleanup();
  const retentionTimer = setInterval(
    () => void retention.runCleanup(),
    retentionSettings.cleanupIntervalMinutes * 60_000,
  );
  retentionTimer.unref();
  const publicationTimer = setInterval(
    () => void publicationJobs.processNext(),
    1_000,
  );
  publicationTimer.unref();
  await app.listen(Number(process.env.PORT || 4001), "0.0.0.0");
}

bootstrap();
