import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { mkdirSync } from "node:fs";
import * as schema from "./schema";

export type Db = PgliteDatabase<typeof schema>;

/**
 * Fără DATABASE_URL: Postgres local, embedded (PGlite), salvat în ./.data/pg — nu trebuie instalat nimic.
 * Cu DATABASE_URL (Neon, conexiunea „pooled”): node-postgres cu un pool mic, recomandarea Neon pentru Next.js pe Vercel
 * (Fluid compute refolosește instanța, iar attachDatabasePool închide conexiunile inactive înainte de suspendare).
 * Ambele expun același query builder Drizzle, de aceea folosim un singur tip.
 */
/** Neon dă `sslmode=require`; pg vrea explicit `verify-full` (aceleași verificări, fără avertisment). */
export const pgUrl = (url: string) => url.replace("sslmode=require", "sslmode=verify-full");

export function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url) {
    // 10 legături: paginile de admin cer multe lucruri deodată; pooler-ul Neon (PgBouncer) le duce fără grijă.
    const pool = new Pool({ connectionString: pgUrl(url), max: 10 });
    attachDatabasePool(pool);
    return drizzlePg(pool, { schema }) as unknown as Db;
  }
  // În timpul `next build` mai mulți workeri importă modulul; nu deschidem baza locală reală de pe disc.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const dir = building ? "memory" : (process.env.PGLITE_DIR ?? "./.data/pg");
  if (dir !== "memory") mkdirSync(dir, { recursive: true });
  return drizzlePglite(dir === "memory" ? new PGlite() : new PGlite(dir), { schema });
}

const g = globalThis as unknown as { __db?: Db };
export const db: Db = g.__db ?? (g.__db = createDb());
export { schema };
