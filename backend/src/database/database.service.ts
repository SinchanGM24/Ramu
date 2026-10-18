import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow } from "pg";

export type DatabaseRoleSecurity = {
  roleName: string;
  isSuperuser: boolean;
  bypassesRls: boolean;
};

export type DatabaseRuntimeConfig = {
  connectionTimeoutMs: number;
  idleTimeoutMs: number;
  lockTimeoutMs: number;
  maxConnections: number;
  slowTransactionMs: number;
  statementTimeoutMs: number;
};

function boundedEnvironmentNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), minimum), maximum);
}

export function getDatabaseRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseRuntimeConfig {
  return {
    maxConnections: boundedEnvironmentNumber(
      environment.DATABASE_POOL_MAX,
      12,
      1,
      100,
    ),
    idleTimeoutMs: boundedEnvironmentNumber(
      environment.DATABASE_IDLE_TIMEOUT_MS,
      30_000,
      1_000,
      300_000,
    ),
    connectionTimeoutMs: boundedEnvironmentNumber(
      environment.DATABASE_CONNECTION_TIMEOUT_MS,
      5_000,
      1_000,
      60_000,
    ),
    statementTimeoutMs: boundedEnvironmentNumber(
      environment.DATABASE_STATEMENT_TIMEOUT_MS,
      15_000,
      1_000,
      120_000,
    ),
    lockTimeoutMs: boundedEnvironmentNumber(
      environment.DATABASE_LOCK_TIMEOUT_MS,
      3_000,
      250,
      60_000,
    ),
    slowTransactionMs: boundedEnvironmentNumber(
      environment.DATABASE_SLOW_TRANSACTION_MS,
      1_000,
      100,
      120_000,
    ),
  };
}

export function assertSafeRuntimeDatabaseRole(role: DatabaseRoleSecurity) {
  if (role.isSuperuser || role.bypassesRls) {
    throw new Error(
      `DATABASE_URL menggunakan role PostgreSQL tidak aman (${role.roleName}). Role API tidak boleh memiliki SUPERUSER atau BYPASSRLS.`,
    );
  }
}

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly runtimeConfig = getDatabaseRuntimeConfig();
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: this.runtimeConfig.maxConnections,
    idleTimeoutMillis: this.runtimeConfig.idleTimeoutMs,
    connectionTimeoutMillis: this.runtimeConfig.connectionTimeoutMs,
  });

  async onModuleInit() {
    if (process.env.NODE_ENV !== "production") return;

    const result = await this.pool.query<{
      role_name: string;
      is_superuser: boolean;
      bypasses_rls: boolean;
    }>(
      `SELECT current_user AS role_name, rolsuper AS is_superuser, rolbypassrls AS bypasses_rls
       FROM pg_roles
       WHERE rolname = current_user`,
    );
    const role = result.rows[0];
    if (!role)
      throw new Error(
        "Role DATABASE_URL tidak dapat diverifikasi di katalog PostgreSQL.",
      );

    assertSafeRuntimeDatabaseRole({
      roleName: role.role_name,
      isSuperuser: role.is_superuser,
      bypassesRls: role.bypasses_rls,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ) {
    const startedAt = performance.now();
    try {
      return await this.pool.query<T>(text, values);
    } finally {
      this.logSlowOperation("query", startedAt);
    }
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    schoolId?: string,
  ): Promise<T> {
    const client = await this.pool.connect();
    const startedAt = performance.now();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('statement_timeout', $1, true)", [
        `${this.runtimeConfig.statementTimeoutMs}ms`,
      ]);
      await client.query("SELECT set_config('lock_timeout', $1, true)", [
        `${this.runtimeConfig.lockTimeoutMs}ms`,
      ]);
      if (schoolId)
        await client.query("SELECT set_config('app.school_id', $1, true)", [
          schoolId,
        ]);
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      this.logSlowOperation("transaction", startedAt, Boolean(schoolId));
    }
  }

  private logSlowOperation(
    operation: "query" | "transaction",
    startedAt: number,
    tenantScoped = false,
  ) {
    const durationMs = Math.round(performance.now() - startedAt);
    if (durationMs < this.runtimeConfig.slowTransactionMs) return;
    this.logger.warn({
      event: "database.slow_operation",
      operation,
      durationMs,
      tenantScoped,
    });
  }
}
