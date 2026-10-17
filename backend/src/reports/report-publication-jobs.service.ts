import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

type PublicationJob = {
  id: string;
  school_id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  total_count: number;
  completed_count: number;
  failed_count: number;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

type Publisher = (input: {
  schoolId: string;
  actorUserId: string;
  reportId: string;
}) => Promise<{ id: string }>;

const maxAttemptsPerItem = 3;
const workerConcurrency = Math.min(
  Math.max(Number(process.env.REPORT_PUBLICATION_WORKER_CONCURRENCY) || 2, 1),
  4,
);

@Injectable()
export class ReportPublicationJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportPublicationJobsService.name);
  private publisher: Publisher | undefined;
  private timer: NodeJS.Timeout | undefined;
  private running = 0;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.drain(), 1_000);
    this.timer.unref();
    void this.drain();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  registerPublisher(publisher: Publisher) {
    this.publisher = publisher;
    void this.drain();
  }

  async enqueue(input: {
    schoolId: string;
    actorUserId: string;
    reportIds: string[];
    semesterId?: string;
  }) {
    const reportIds = [...new Set(input.reportIds)];
    if (!reportIds.length) {
      throw new Error("Tidak ada raport yang dapat diterbitkan.");
    }

    return this.db.transaction(async (client) => {
      const reports = await client.query<{ id: string }>(
        `SELECT id
         FROM reports
         WHERE school_id=$1 AND id=ANY($2::uuid[]) AND status='APPROVED'
         FOR UPDATE`,
        [input.schoolId, reportIds],
      );
      if (reports.rowCount !== reportIds.length) {
        throw new Error("Sebagian raport tidak tersedia atau belum disetujui.");
      }

      const job = (
        await client.query<PublicationJob>(
          `INSERT INTO report_publication_jobs(school_id,created_by,semester_id,total_count)
           VALUES($1,$2,$3,$4)
           RETURNING *`,
          [input.schoolId, input.actorUserId, input.semesterId ?? null, reportIds.length],
        )
      ).rows[0];
      await client.query(
        `INSERT INTO report_publication_job_items(school_id,job_id,report_id)
         SELECT $1,$2,unnest($3::uuid[])`,
        [input.schoolId, job.id, reportIds],
      );
      return job;
    }, input.schoolId);
  }

  async getJob(input: { schoolId: string; jobId: string }) {
    return this.db.transaction(async (client) => {
      const job = (
        await client.query<PublicationJob>(
          `SELECT * FROM report_publication_jobs WHERE id=$1 AND school_id=$2`,
          [input.jobId, input.schoolId],
        )
      ).rows[0];
      if (!job) return null;
      const items = (
        await client.query<{
          status: string;
          count: number;
        }>(
          `SELECT status,count(*)::int AS count
           FROM report_publication_job_items
           WHERE job_id=$1 AND school_id=$2
           GROUP BY status`,
          [input.jobId, input.schoolId],
        )
      ).rows;
      return { ...job, items };
    }, input.schoolId);
  }

  private async drain() {
    if (!this.publisher) return;
    while (this.running < workerConcurrency) {
      const claimed = await this.claimNext();
      if (!claimed) return;
      this.running += 1;
      void this.process(claimed).finally(() => {
        this.running -= 1;
        void this.drain();
      });
    }
  }

  private async claimNext() {
    const result = await this.db.query<{ job_id: string; school_id: string }>(
      "SELECT * FROM claim_next_report_publication_job()",
    );
    return result.rows[0] ?? null;
  }

  private async process(job: { job_id: string; school_id: string }) {
    const claimedItem = await this.db.transaction(async (client) => {
      const item = (
        await client.query<{
          id: string;
          report_id: string;
          attempts: number;
          created_by: string;
        }>(
          `SELECT item.id,item.report_id,item.attempts,job.created_by
           FROM report_publication_job_items item
           JOIN report_publication_jobs job ON job.id=item.job_id AND job.school_id=item.school_id
           WHERE item.job_id=$1 AND item.school_id=$2
             AND (
               (item.status='QUEUED' AND item.next_attempt_at<=now())
               OR (item.status='PROCESSING' AND item.locked_until<now())
             )
           ORDER BY item.created_at
           FOR UPDATE SKIP LOCKED
           LIMIT 1`,
          [job.job_id, job.school_id],
        )
      ).rows[0];
      if (!item) return null;
      await client.query(
        `UPDATE report_publication_job_items
         SET status='PROCESSING',locked_until=now()+interval '10 minutes',updated_at=now()
         WHERE id=$1 AND school_id=$2`,
        [item.id, job.school_id],
      );
      return item;
    }, job.school_id);

    if (!claimedItem) {
      await this.finishIfSettled(job);
      return;
    }

    try {
      const published = await this.publisher!({
        schoolId: job.school_id,
        actorUserId: claimedItem.created_by,
        reportId: claimedItem.report_id,
      });
      await this.db.transaction(async (client) => {
        await client.query(
          `UPDATE report_publication_job_items
           SET status='PUBLISHED',published_version_id=$1,locked_until=NULL,last_error=NULL,updated_at=now()
           WHERE id=$2 AND school_id=$3`,
          [published.id, claimedItem.id, job.school_id],
        );
      }, job.school_id);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Publikasi gagal";
      const attempts = claimedItem.attempts + 1;
      await this.db.transaction(async (client) => {
        await client.query(
          `UPDATE report_publication_job_items
           SET status=$1,attempts=$2,next_attempt_at=now()+make_interval(secs => $3),locked_until=NULL,last_error=$4,updated_at=now()
           WHERE id=$5 AND school_id=$6`,
          [
            attempts >= maxAttemptsPerItem ? "FAILED" : "QUEUED",
            attempts,
            Math.min(2 ** attempts * 10, 300),
            message,
            claimedItem.id,
            job.school_id,
          ],
        );
        await client.query(
          `UPDATE report_publication_jobs
           SET status='QUEUED',locked_until=NULL,last_error=$1,updated_at=now()
           WHERE id=$2 AND school_id=$3`,
          [message, job.job_id, job.school_id],
        );
      }, job.school_id);
      this.logger.error({ event: "report_publication.failed", jobId: job.job_id });
    }
    await this.finishIfSettled(job);
  }

  private async finishIfSettled(job: { job_id: string; school_id: string }) {
    await this.db.transaction(async (client) => {
      const totals = (
        await client.query<{ completed: number; failed: number; pending: number }>(
          `SELECT
             count(*) FILTER (WHERE status='PUBLISHED')::int AS completed,
             count(*) FILTER (WHERE status='FAILED')::int AS failed,
             count(*) FILTER (WHERE status IN ('QUEUED','PROCESSING'))::int AS pending
           FROM report_publication_job_items
           WHERE job_id=$1 AND school_id=$2`,
          [job.job_id, job.school_id],
        )
      ).rows[0];
      await client.query(
        `UPDATE report_publication_jobs
         SET completed_count=$1,failed_count=$2,
             status=CASE WHEN $3=0 THEN CASE WHEN $2>0 THEN 'FAILED' ELSE 'COMPLETED' END ELSE 'QUEUED' END,
             locked_until=NULL,
             finished_at=CASE WHEN $3=0 THEN now() ELSE NULL END,
             updated_at=now()
         WHERE id=$4 AND school_id=$5`,
        [totals.completed, totals.failed, totals.pending, job.job_id, job.school_id],
      );
    }, job.school_id);
  }
}
