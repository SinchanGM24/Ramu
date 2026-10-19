import "dotenv/config";
import { Pool } from "pg";

const runtimeRoleName = "ramu_runtime";
const permissionsRoleName = "ramu_runtime_permissions";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diatur.`);
  return value;
}

function pooledConnectionString(directConnectionString: string, password: string) {
  const connection = new URL(directConnectionString);
  const [endpoint, ...domain] = connection.hostname.split(".");
  if (!endpoint || !domain.length) {
    throw new Error("Host DATABASE_MIGRATION_URL tidak valid.");
  }
  connection.hostname = endpoint.endsWith("-pooler")
    ? connection.hostname
    : `${endpoint}-pooler.${domain.join(".")}`;
  connection.username = runtimeRoleName;
  connection.password = password;
  return connection.toString();
}

async function bootstrap() {
  const connectionString = required("DATABASE_MIGRATION_URL");
  const password = required("RUNTIME_DATABASE_PASSWORD");
  if (password.length < 16) {
    throw new Error("RUNTIME_DATABASE_PASSWORD minimal 16 karakter.");
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const permissionsRole = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [permissionsRoleName],
    );
    if (!permissionsRole.rowCount) {
      throw new Error(
        "Role izin aplikasi belum ada. Jalankan migrasi database terlebih dahulu.",
      );
    }

    const existingRole = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [runtimeRoleName],
    );
    if (existingRole.rowCount) {
      throw new Error(
        "Role runtime sudah ada. Jangan menjalankan bootstrap role lagi.",
      );
    }

    const createStatement = await client.query<{ statement: string }>(
      "SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS INHERIT', $1, $2) AS statement",
      [runtimeRoleName, password],
    );
    await client.query(createStatement.rows[0].statement);
    await client.query(
      `GRANT ${permissionsRoleName} TO ${runtimeRoleName}`,
    );

    const role = await client.query<{
      rolbypassrls: boolean;
      rolsuper: boolean;
    }>(
      "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1",
      [runtimeRoleName],
    );
    if (!role.rows[0] || role.rows[0].rolsuper || role.rows[0].rolbypassrls) {
      throw new Error("Role runtime tidak memenuhi batas keamanan RLS.");
    }
    await client.query("COMMIT");

    console.log("Role database runtime yang aman berhasil dibuat.");
    console.log("Salin nilai berikut ke DATABASE_URL di Vercel, lalu hapus dari riwayat terminal:");
    console.log(pooledConnectionString(connectionString, password));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

bootstrap().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
