import "dotenv/config";
import * as argon2 from "argon2";
import { Pool } from "pg";
import { defaultTkTemplate, DEFAULT_TK_TEMPLATE_NAME } from "../assessment/default-tk-template";

const accounts = [
  { name: "Admin Sekolah", email: "admin@ramu.test", role: "SCHOOL_ADMIN" },
  { name: "Guru Aisyah", email: "guru.aisyah@ramu.test", role: "TEACHER" },
  { name: "Guru Budi", email: "guru.budi@ramu.test", role: "TEACHER" },
  { name: "Guru Citra", email: "guru.citra@ramu.test", role: "TEACHER" },
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
    const existingTemplate = await client.query<{ id: string }>("SELECT id FROM assessment_frameworks WHERE school_id=$1 AND name=$2 AND is_active LIMIT 1", [schoolId, DEFAULT_TK_TEMPLATE_NAME]);
    if (!existingTemplate.rowCount) {
      await client.query("UPDATE assessment_frameworks SET is_active=false WHERE school_id=$1 AND name=$2", [schoolId, DEFAULT_TK_TEMPLATE_NAME]);
      const scale = (await client.query<{ id: string }>("INSERT INTO assessment_scales(school_id,name) VALUES($1,$2) RETURNING id", [schoolId, "Skala Perkembangan TK"])).rows[0];
      for (const [position, code] of ["BB", "MB", "BSH", "BSB"].entries()) await client.query("INSERT INTO assessment_scale_options(school_id,scale_id,code,label,position) VALUES($1,$2,$3,$4,$5)", [schoolId, scale.id, code, code, position + 1]);
      const framework = (await client.query<{ id: string }>("INSERT INTO assessment_frameworks(school_id,scale_id,name) VALUES($1,$2,$3) RETURNING id", [schoolId, scale.id, DEFAULT_TK_TEMPLATE_NAME])).rows[0];
      for (const [areaPosition, area] of defaultTkTemplate.entries()) { const savedArea = (await client.query<{ id: string }>("INSERT INTO development_areas(school_id,framework_id,name,position) VALUES($1,$2,$3,$4) RETURNING id", [schoolId, framework.id, area.name, areaPosition + 1])).rows[0]; for (const [subPosition, subArea] of area.subAreas.entries()) { const savedSubArea = (await client.query<{ id: string }>("INSERT INTO sub_areas(school_id,development_area_id,name,position) VALUES($1,$2,$3,$4) RETURNING id", [schoolId, savedArea.id, subArea.name, subPosition + 1])).rows[0]; for (const [indicatorPosition, description] of subArea.indicators.entries()) await client.query("INSERT INTO indicators(school_id,sub_area_id,description,position) VALUES($1,$2,$3,$4)", [schoolId, savedSubArea.id, description, indicatorPosition + 1]); } }
    }
    await client.query("UPDATE academic_years SET is_active=false WHERE school_id=$1", [schoolId]);
    const previous = await client.query<{ id: string }>("INSERT INTO academic_years(school_id,name,starts_on,ends_on,is_active) VALUES ($1,'2025/2026','2025-07-01','2026-06-30',false) ON CONFLICT(school_id,name) DO UPDATE SET is_active=false RETURNING id", [schoolId]);
    const year = await client.query<{ id: string }>("INSERT INTO academic_years(school_id,name,starts_on,ends_on,is_active) VALUES ($1,'2026/2027','2026-07-01','2027-06-30',true) ON CONFLICT(school_id,name) DO UPDATE SET is_active=true RETURNING id", [schoolId]);
    for (const [yearId, firstStart, firstEnd, secondStart, secondEnd] of [[previous.rows[0].id,'2025-07-01','2025-12-31','2026-01-01','2026-06-30'],[year.rows[0].id,'2026-07-01','2026-12-31','2027-01-01','2027-06-30']] as const) await client.query("INSERT INTO semesters(school_id,academic_year_id,name,starts_on,ends_on) VALUES ($1,$2,'Semester I',$3,$4),($1,$2,'Semester II',$5,$6) ON CONFLICT(school_id,academic_year_id,name) DO UPDATE SET starts_on=EXCLUDED.starts_on,ends_on=EXCLUDED.ends_on", [schoolId,yearId,firstStart,firstEnd,secondStart,secondEnd]);
    const levelA = await client.query<{ id: string }>("INSERT INTO education_levels(school_id,name,code,position) VALUES($1,'Kelompok A','A',1) ON CONFLICT(school_id,code) DO UPDATE SET name=EXCLUDED.name RETURNING id", [schoolId]);
    const levelB = await client.query<{ id: string }>("INSERT INTO education_levels(school_id,name,code,position) VALUES($1,'Kelompok B','B',2) ON CONFLICT(school_id,code) DO UPDATE SET name=EXCLUDED.name RETURNING id", [schoolId]);
    await client.query("UPDATE education_levels SET next_level_id=$2 WHERE id=$1", [levelA.rows[0].id,levelB.rows[0].id]);
    const groups: Record<string,string> = {}; for (const name of ['Kelas Apel','Kelas Melati','Kelas Merpati']) groups[name]=(await client.query<{id:string}>("INSERT INTO class_groups(school_id,name) VALUES($1,$2) ON CONFLICT(school_id,name) DO UPDATE SET name=EXCLUDED.name RETURNING id",[schoolId,name])).rows[0].id;
    const period = async (groupName:string,yearId:string,levelId:string) => (await client.query<{id:string}>("INSERT INTO class_periods(school_id,class_group_id,academic_year_id,education_level_id) VALUES($1,$2,$3,$4) ON CONFLICT(class_group_id,academic_year_id) DO UPDATE SET education_level_id=EXCLUDED.education_level_id RETURNING id",[schoolId,groups[groupName],yearId,levelId])).rows[0].id;
    const priorApel=await period('Kelas Apel',previous.rows[0].id,levelA.rows[0].id), apel=await period('Kelas Apel',year.rows[0].id,levelB.rows[0].id), melati=await period('Kelas Melati',year.rows[0].id,levelA.rows[0].id), merpati=await period('Kelas Merpati',year.rows[0].id,levelA.rows[0].id);
    const student = async (name:string,number:string,gender:string) => (await client.query<{id:string}>("INSERT INTO students(school_id,name,student_number,gender) VALUES($1,$2,$3,$4::student_gender) ON CONFLICT(school_id,student_number) DO UPDATE SET name=EXCLUDED.name RETURNING id",[schoolId,name,number,gender])).rows[0].id;
    const alya=await student('Alya Putri','TK-001','FEMALE'), bima=await student('Bima Saputra','TK-002','MALE'), citra=await student('Citra Lestari','TK-003','FEMALE'), dimas=await student('Dimas Pratama','TK-004','MALE');
    await client.query("INSERT INTO student_enrollments(school_id,student_id,academic_year_id,class_period_id,status,ended_at) VALUES($1,$2,$3,$4,'PROMOTED',now()) ON CONFLICT(student_id,academic_year_id) DO UPDATE SET status='PROMOTED'",[schoolId,alya,previous.rows[0].id,priorApel]);
    for (const [studentId,classPeriodId] of [[alya,apel],[bima,apel],[citra,melati],[dimas,merpati]]) await client.query("INSERT INTO student_enrollments(school_id,student_id,academic_year_id,class_period_id,status) VALUES($1,$2,$3,$4,'ACTIVE') ON CONFLICT(student_id,academic_year_id) DO UPDATE SET class_period_id=EXCLUDED.class_period_id,status='ACTIVE',ended_at=NULL",[schoolId,studentId,year.rows[0].id,classPeriodId]);
    const teachers = await client.query<{id:string,email:string}>("SELECT id,email FROM users WHERE email IN ('guru.aisyah@ramu.test','guru.budi@ramu.test','guru.citra@ramu.test')"); for (const [classPeriodId,email] of [[apel,'guru.aisyah@ramu.test'],[melati,'guru.budi@ramu.test'],[merpati,'guru.citra@ramu.test']]) { const teacher=teachers.rows.find(item=>item.email===email)!; await client.query("INSERT INTO teacher_class_assignments(school_id,class_period_id,teacher_user_id) VALUES($1,$2,$3) ON CONFLICT(class_period_id) DO UPDATE SET teacher_user_id=EXCLUDED.teacher_user_id,ended_at=NULL",[schoolId,classPeriodId,teacher.id]); }
    await client.query("COMMIT"); console.log(`Seed akun development selesai: ${accounts.map((account) => account.email).join(", ")}`);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); await pool.end(); }
}
seed().catch((error) => { console.error(error); process.exit(1); });
