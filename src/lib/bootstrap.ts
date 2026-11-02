import { db } from "@/db";
import { runMigrations } from "@/db/migrate";

let done: Promise<void> | null = null;
/** Pe baza locală (PGlite) aplicăm schema automat la prima cerere, ca aplicația să pornească fără pași în plus. */
export function ensureSchema() {
  if (process.env.DATABASE_URL) return Promise.resolve();
  return (done ??= runMigrations(db));
}
