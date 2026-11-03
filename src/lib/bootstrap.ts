import { sql } from "drizzle-orm";
import { db, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";

/**
 * Coloane adăugate după prima versiune, scrise idempotent. Pe Neon le aplicăm și la pornire,
 * ca aplicația să nu cadă dacă o publicare a sărit peste migrare.
 */
const ADDITIVE = [
  sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "notes" text`,
  sql`CREATE TABLE IF NOT EXISTS "message" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade,
    "from_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "to_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "body" text NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, "read_at" timestamp)`,
  sql`ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "description" text`,
  sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "photo_document_id" uuid`,
  sql`ALTER TABLE "tree" ADD COLUMN IF NOT EXISTS "chat_max_degree" integer DEFAULT 4 NOT NULL`,
  sql`CREATE INDEX IF NOT EXISTS "message_pair_idx" ON "message" ("tree_id","from_user_id","to_user_id")`,
  sql`CREATE INDEX IF NOT EXISTS "message_to_idx" ON "message" ("to_user_id","read_at")`,
  sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "birth_country" text`,
  sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "death_country" text`,
  sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "residence_place" text`,
  sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "residence_country" text`,
  sql`ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "discreet" boolean DEFAULT false NOT NULL`,
  sql`CREATE TABLE IF NOT EXISTS "place_pin" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade,
    "key" text NOT NULL, "place_id" text, "name" text NOT NULL, "detail" text,
    "lat" double precision NOT NULL, "lng" double precision NOT NULL,
    "created_by" text REFERENCES "user"("id") ON DELETE set null, "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "place_pin_key" ON "place_pin" ("tree_id","key")`,
  sql`ALTER TABLE "tree" ADD COLUMN IF NOT EXISTS "discoverable" boolean DEFAULT false NOT NULL`,
  sql`CREATE TABLE IF NOT EXISTS "tree_place" (
    "tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade, "place_id" text NOT NULL, "area" text,
    "name" text NOT NULL, "detail" text, "people" integer NOT NULL, "from_year" integer, "to_year" integer,
    "surnames" text DEFAULT '' NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "tree_place_pk" ON "tree_place" ("tree_id","place_id")`,
  sql`CREATE INDEX IF NOT EXISTS "tree_place_place_idx" ON "tree_place" ("place_id")`,
  sql`CREATE INDEX IF NOT EXISTS "tree_place_area_idx" ON "tree_place" ("area")`,
  sql`CREATE TABLE IF NOT EXISTS "place_contact" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "from_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "from_tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade,
    "to_tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade,
    "to_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "place" text NOT NULL, "note" text, "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL, "answered_at" timestamp)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "place_contact_pair" ON "place_contact" ("from_user_id","to_tree_id")`,
  sql`CREATE INDEX IF NOT EXISTS "place_contact_to_idx" ON "place_contact" ("to_user_id","status")`,
];

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
