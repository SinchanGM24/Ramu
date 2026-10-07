import "dotenv/config";
import * as argon2 from "argon2";
import { Pool } from "pg";

const accounts = [
  { name: "Admin Sekolah", email: "admin@ramu.test", role: "SCHOOL_ADMIN" },
  { name: "Guru Contoh", email: "guru@ramu.test", role: "TEACHER" },
  { name: "Kepala Sekolah", email: "kepsek@ramu.test", role: "PRINCIPAL" },
] as const;

async function seed() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed akun demo tidak boleh dijalankan di production");
  const connectionString = process.env.DATABASE_SEED_URL || process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_SEED_URL, DATABASE_MIGRATION_URL, atau DATABASE_URL harus diatur");
  const pool = new Pool({ connectionString });
  const password = process.env.SEED_DEMO_PASSWORD || "pass1234";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const first = await client.query<{ school_id: string }>(`SELECT membership.school_id FROM school_memberships membership JOIN users user_account ON user_account.id=membership.user_id WHERE user_account.email=lower($1) AND membership.role='SCHOOL_ADMIN' LIMIT 1`, [accounts[0].email]);
    const schoolId = first.rows[0]?.school_id || crypto.randomUUID();
    await client.query("SELECT set_config('app.school_id', $1, true)", [schoolId]);
    if (!first.rowCount) await client.query("INSERT INTO schools(id,name,slug) VALUES ($1,$2,'tk-contoh-ceria')", [schoolId, process.env.SEED_SCHOOL_NAME || "TK Contoh Ceria"]);
    const hash = await argon2.hash(password);
    for (const account of accounts) {
      const user = await client.query<{ id: string }>(`INSERT INTO users(name,email,password_hash) VALUES($1,lower($2),$3) ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash RETURNING id`, [account.name, account.email, hash]);
      await client.query(`INSERT INTO school_memberships(user_id,school_id,role) VALUES($1,$2,$3) ON CONFLICT(user_id,school_id) DO UPDATE SET role=EXCLUDED.role`, [user.rows[0].id, schoolId, account.role]);
    }
    const year = await client.query<{ id: string }>("INSERT INTO academic_years(school_id,name,starts_on,ends_on) VALUES ($1,'2026/2027','2026-07-01','2027-06-30') ON CONFLICT(school_id,name) DO UPDATE SET name=EXCLUDED.name RETURNING id", [schoolId]);
    const classRow = await client.query<{ id: string }>("INSERT INTO classes(school_id,academic_year_id,name) VALUES ($1,$2,'Kelompok A') ON CONFLICT(school_id,academic_year_id,name) DO UPDATE SET name=EXCLUDED.name RETURNING id", [schoolId, year.rows[0].id]);
    await client.query("INSERT INTO students(school_id,class_id,name,student_number,gender) VALUES ($1,$2,'Alya Putri','TK-001','FEMALE') ON CONFLICT(school_id,student_number) DO NOTHING", [schoolId, classRow.rows[0].id]);
    await client.query("COMMIT"); console.log(`Seed akun development selesai: ${accounts.map((account) => account.email).join(", ")}`);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); await pool.end(); }
}
seed().catch((error) => { console.error(error); process.exit(1); });
