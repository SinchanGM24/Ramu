import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow } from "pg";

export type DatabaseRoleSecurity = {
  roleName: string;
  isSuperuser: boolean;
  bypassesRls: boolean;
};

export function assertSafeRuntimeDatabaseRole(role: DatabaseRoleSecurity) {
  if (role.isSuperuser || role.bypassesRls) {
    throw new Error(
      `DATABASE_URL menggunakan role PostgreSQL tidak aman (${role.roleName}). Role API tidak boleh memiliki SUPERUSER atau BYPASSRLS.`,
    );
  }
}

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnModuleInit {
  readonly pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ) {
    return this.pool.query<T>(text, values);
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    schoolId?: string,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
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
    }
  }
}
