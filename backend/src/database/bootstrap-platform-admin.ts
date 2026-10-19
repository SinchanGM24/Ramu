import "dotenv/config";
import * as argon2 from "argon2";
import { Pool } from "pg";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diatur.`);
  return value;
}

async function bootstrap() {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.DATABASE_MIGRATION_URL
  ) {
    throw new Error(
      "DATABASE_MIGRATION_URL wajib diatur saat bootstrap Super Admin di production.",
    );
  }

  const bootstrapSecret = required("PLATFORM_BOOTSTRAP_SECRET");
  if (bootstrapSecret !== required("PLATFORM_BOOTSTRAP_CONFIRM")) {
    throw new Error("PLATFORM_BOOTSTRAP_CONFIRM tidak cocok.");
  }

  const name = required("PLATFORM_SUPER_ADMIN_NAME");
  const email = required("PLATFORM_SUPER_ADMIN_EMAIL").toLowerCase();
  const password = required("PLATFORM_SUPER_ADMIN_PASSWORD");
  if (password.length < 12) {
    throw new Error("PLATFORM_SUPER_ADMIN_PASSWORD minimal 12 karakter.");
  }

  const connectionString =
    process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_MIGRATION_URL atau DATABASE_URL wajib diatur.");
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT 1 FROM platform_administrators LIMIT 1",
    );
    if (existing.rowCount) {
      throw new Error(
        "Super Admin platform sudah ada; bootstrap hanya boleh sekali.",
      );
    }
    const duplicate = await client.query(
      "SELECT 1 FROM users WHERE lower(email) = lower($1)",
      [email],
    );
    if (duplicate.rowCount) {
      throw new Error("Email tersebut sudah dipakai oleh akun yang ada.");
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const account = await client.query<{ id: string }>(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [name, email, passwordHash],
    );
    const userId = account.rows[0].id;
    await client.query(
      "INSERT INTO platform_administrators (user_id) VALUES ($1)",
      [userId],
    );
    await client.query(
      "INSERT INTO platform_audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, 'platform.bootstrap', 'user', $1)",
      [userId],
    );
    await client.query("COMMIT");
    console.log(
      "Super Admin platform berhasil dibuat. Jangan tampilkan atau simpan kata sandi di log.",
    );
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
