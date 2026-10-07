import "dotenv/config";
import * as argon2 from "argon2";
import { Pool } from "pg";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const email = process.env.SEED_ADMIN_EMAIL || "admin@contoh.sch.id";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error("SEED_ADMIN_PASSWORD wajib disetel");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT id FROM users WHERE email=lower($1)", [email]);
    if (existing.rowCount) { console.log("Seed sudah ada"); await client.query("COMMIT"); return; }
    const schoolId = crypto.randomUUID();
    await client.query("SELECT set_config('app.school_id', $1, true)", [schoolId]);
    const user = await client.query<{ id: string }>("INSERT INTO users (name,email,password_hash) VALUES ('Admin Contoh',lower($1),$2) RETURNING id", [email, await argon2.hash(password)]);
    await client.query("INSERT INTO schools(id,name,slug) VALUES ($1,$2,'tk-contoh-ceria')", [schoolId, process.env.SEED_SCHOOL_NAME || "TK Contoh Ceria"]);
    await client.query("INSERT INTO school_memberships(user_id,school_id,role) VALUES ($1,$2,'SCHOOL_ADMIN')", [user.rows[0].id,schoolId]);
    const year = await client.query<{ id: string }>("INSERT INTO academic_years(school_id,name,starts_on,ends_on) VALUES ($1,'2026/2027','2026-07-01','2027-06-30') RETURNING id", [schoolId]);
    const classRow = await client.query<{ id: string }>("INSERT INTO classes(school_id,academic_year_id,name) VALUES ($1,$2,'Kelompok A') RETURNING id", [schoolId, year.rows[0].id]);
    await client.query("INSERT INTO students(school_id,class_id,name,student_number,gender) VALUES ($1,$2,'Alya Putri','TK-001','FEMALE')", [schoolId,classRow.rows[0].id]);
    await client.query("COMMIT"); console.log(`Seeded ${email}`);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); await pool.end(); }
}
seed().catch((error) => { console.error(error); process.exit(1); });
