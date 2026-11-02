import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { mkdirSync } from "node:fs";
import * as schema from "./schema";

export type Db = PgliteDatabase<typeof schema>;

/**
 * Fără DATABASE_URL: Postgres local, embedded (PGlite), salvat în ./.data/pg — nu trebuie instalat nimic.
 * Cu DATABASE_URL (Neon): Postgres în cloud, plan gratuit.
 * Ambele expun același query builder Drizzle, de aceea folosim un singur tip.
 */
export function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url) return drizzleNeon(neon(url), { schema }) as unknown as Db;
  // În timpul `next build` mai mulți workeri importă modulul; nu deschidem baza locală reală de pe disc.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const dir = building ? "memory" : (process.env.PGLITE_DIR ?? "./.data/pg");
  if (dir !== "memory") mkdirSync(dir, { recursive: true });
  return drizzlePglite(dir === "memory" ? new PGlite() : new PGlite(dir), { schema });
}

const g = globalThis as unknown as { __db?: Db };
export const db: Db = g.__db ?? (g.__db = createDb());
export { schema };
