import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { Pool } from "pg";

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const directory = join(__dirname, "migrations");
    for (const name of (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort()) {
      if ((await pool.query("SELECT 1 FROM schema_migrations WHERE name=$1", [name])).rowCount) continue;
      const sql = await readFile(join(directory, name), "utf8");
      await pool.query("BEGIN");
      try { await pool.query(sql); await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]); await pool.query("COMMIT"); }
      catch (error) { await pool.query("ROLLBACK"); throw error; }
      console.log(`Applied ${name}`);
    }
  } finally { await pool.end(); }
}
migrate().catch((error) => { console.error(error); process.exit(1); });
