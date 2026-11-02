import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import type { Db } from "./index";

export async function runMigrations(db: Db) {
  const migrationsFolder = new URL("../../drizzle", import.meta.url).pathname;
  if (process.env.DATABASE_URL) await migrateNeon(db as never, { migrationsFolder });
  else await migratePglite(db, { migrationsFolder });
}
