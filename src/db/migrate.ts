import path from "node:path";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import type { Db } from "./index";

export async function runMigrations(db: Db) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (process.env.DATABASE_URL) await migrateNeon(db as never, { migrationsFolder });
  else await migratePglite(db, { migrationsFolder });
}
