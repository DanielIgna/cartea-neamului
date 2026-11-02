import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";
import { pgUrl, type Db } from "./index";

export async function runMigrations(db: Db) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!process.env.DATABASE_URL) return migratePglite(db, { migrationsFolder });
  // Pe Neon migrațiile rulează pe conexiunea directă (fără pooler), cum recomandă Neon.
  const pool = new Pool({ connectionString: pgUrl(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL), max: 1 });
  try {
    await migratePg(drizzle(pool), { migrationsFolder });
  } finally {
    await pool.end();
  }
}
