import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type RetentionSettings = {
  sessionRetentionDays: number;
  auditRetentionDays: number | null;
  cleanupIntervalMinutes: number;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number | null,
  variableName: string,
) => {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error(`${variableName} harus berupa bilangan bulat positif.`);
  return parsed;
};

export function getRetentionSettings(
  environment: NodeJS.ProcessEnv = process.env,
): RetentionSettings {
  const sessionRetentionDays = parsePositiveInteger(
    environment.SESSION_RETENTION_DAYS,
    30,
    "SESSION_RETENTION_DAYS",
  );
  const auditRetentionDays = parsePositiveInteger(
    environment.AUDIT_RETENTION_DAYS,
    null,
    "AUDIT_RETENTION_DAYS",
  );
  const cleanupIntervalMinutes = parsePositiveInteger(
    environment.RETENTION_CLEANUP_INTERVAL_MINUTES,
    60,
    "RETENTION_CLEANUP_INTERVAL_MINUTES",
  );
  if (sessionRetentionDays === null || cleanupIntervalMinutes === null)
    throw new Error("Konfigurasi retensi sesi tidak valid.");
  if (cleanupIntervalMinutes < 15)
    throw new Error("RETENTION_CLEANUP_INTERVAL_MINUTES minimal 15 menit.");
  if (auditRetentionDays !== null && auditRetentionDays < 30)
    throw new Error("AUDIT_RETENTION_DAYS minimal 30 hari.");

  return {
    sessionRetentionDays,
    auditRetentionDays,
    cleanupIntervalMinutes,
  };
}

@Injectable()
export class DataRetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DataRetentionService.name);
  private readonly settings = getRetentionSettings();
  private timer?: NodeJS.Timeout;

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.runCleanup();
    this.timer = setInterval(
      () => void this.runCleanup(),
      this.settings.cleanupIntervalMinutes * 60_000,
    );
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async runCleanup() {
    try {
      const expiredStaffSessions = await this.db.query(
        "DELETE FROM sessions WHERE expires_at <= now() OR (revoked_at IS NOT NULL AND revoked_at <= now() - make_interval(days => $1::int))",
        [this.settings.sessionRetentionDays],
      );
      const expiredParentSessions = await this.db.query(
        "DELETE FROM parent_report_sessions WHERE expires_at <= now()",
      );
      const expiredAuditLogs = this.settings.auditRetentionDays
        ? await this.db.query<{ prune_expired_audit_logs: number }>(
            "SELECT public.prune_expired_audit_logs($1) AS prune_expired_audit_logs",
            [this.settings.auditRetentionDays],
          )
        : null;
      const tableSizes = await this.db.query<{
        sessions_bytes: string;
        parent_sessions_bytes: string;
        audit_logs_bytes: string;
      }>(
        "SELECT pg_total_relation_size('public.sessions')::text AS sessions_bytes, pg_total_relation_size('public.parent_report_sessions')::text AS parent_sessions_bytes, pg_total_relation_size('public.audit_logs')::text AS audit_logs_bytes",
      );
      const sizes = tableSizes.rows[0];
      this.logger.log(
        JSON.stringify({
          event: "data_retention.cleanup_completed",
          expiredStaffSessions: expiredStaffSessions.rowCount ?? 0,
          expiredParentSessions: expiredParentSessions.rowCount ?? 0,
          expiredAuditLogs: expiredAuditLogs?.rows[0]?.prune_expired_audit_logs ?? 0,
          auditRetentionEnabled: this.settings.auditRetentionDays !== null,
          tableBytes: sizes,
        }),
      );
    } catch (error) {
      this.logger.error(
        "Pembersihan data kedaluwarsa gagal; akan dicoba kembali pada jadwal berikutnya.",
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
