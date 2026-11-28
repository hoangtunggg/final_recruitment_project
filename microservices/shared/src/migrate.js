const fs = require("node:fs/promises");
const path = require("node:path");
const { createPool } = require("./index");

async function main() {
  const service = process.env.SERVICE_NAME || "migration";
  const pool = createPool(`${service}-migration`);
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const directory = process.env.MIGRATIONS_DIR || path.join(process.cwd(), "migrations");
  const files = (await fs.readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const exists = await pool.query("SELECT 1 FROM schema_migrations WHERE version=$1", [file]);
    if (exists.rowCount) continue;
    const sql = await fs.readFile(path.join(directory, file), "utf8");
    const client = await pool.connect();
    try { await client.query("BEGIN"); await client.query(sql); await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [file]); await client.query("COMMIT"); console.log(`${service}: applied ${file}`); }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  await pool.end();
}
main().catch((error) => { console.error(error); process.exit(1); });
