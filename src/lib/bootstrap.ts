import { sql } from "drizzle-orm";
import { db, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";

/**
 * Coloane adăugate după prima versiune, scrise idempotent. Pe Neon le aplicăm și la pornire,
 * ca aplicația să nu cadă dacă o publicare a sărit peste migrare.
 */
const ADDITIVE = [sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "notes" text`];

export async function applySchema(target: Db) {
  try {
    await runMigrations(target);
  } catch (e) {
    if (!process.env.DATABASE_URL) throw e;
    console.warn("Migrările drizzle nu au rulat; aplic doar coloanele noi, idempotent.", e);
    for (const q of ADDITIVE) await target.execute(q);
  }
}

let done: Promise<void> | null = null;
/** Schema se aplică automat la prima cerere (PGlite local și Neon), ca aplicația să pornească fără pași în plus. */
export function ensureSchema() {
  return (done ??= applySchema(db).catch((e) => {
    done = null;
    console.error("Nu am putut aplica schema bazei de date.", e);
  }));
}
