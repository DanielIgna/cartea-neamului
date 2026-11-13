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
  sql`CREATE TABLE IF NOT EXISTS "join_attempt" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "name_key" text NOT NULL, "found" boolean DEFAULT false NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS "join_request" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade, "person_id" uuid NOT NULL REFERENCES "person"("id") ON DELETE cascade,
    "note" text, "status" text DEFAULT 'pending' NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, "answered_at" timestamp)`,
  sql`CREATE INDEX IF NOT EXISTS "join_attempt_user_idx" ON "join_attempt" ("user_id","created_at")`,
  sql`CREATE INDEX IF NOT EXISTS "join_attempt_name_idx" ON "join_attempt" ("name_key","created_at")`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "join_request_pair" ON "join_request" ("user_id","person_id")`,
  sql`CREATE INDEX IF NOT EXISTS "join_request_tree_idx" ON "join_request" ("tree_id","status")`,
  sql`CREATE TABLE IF NOT EXISTS "raised_by" (
    "tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade,
    "child_id" uuid NOT NULL REFERENCES "person"("id") ON DELETE cascade,
    "carer_id" uuid NOT NULL REFERENCES "person"("id") ON DELETE cascade,
    "created_by" text REFERENCES "user"("id") ON DELETE set null, "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "raised_by_pair" ON "raised_by" ("child_id","carer_id")`,
  sql`CREATE INDEX IF NOT EXISTS "raised_by_tree_idx" ON "raised_by" ("tree_id")`,
  sql`DO $$ BEGIN CREATE TYPE "memory_visibility" AS ENUM('private', 'asker', 'close', 'tree'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  sql`CREATE TABLE IF NOT EXISTS "memory" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade, "person_id" uuid NOT NULL REFERENCES "person"("id") ON DELETE cascade,
    "author_id" text REFERENCES "user"("id") ON DELETE set null, "chapter" text DEFAULT 'altele' NOT NULL,
    "question" text, "question_key" text, "asked_id" uuid, "title" text, "body" text NOT NULL,
    "when_text" text, "when_year" integer, "place" text, "photo_document_id" uuid REFERENCES "document"("id") ON DELETE set null,
    "visibility" "memory_visibility" DEFAULT 'tree' NOT NULL, "max_degree" integer, "in_book" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS "memory_mention" (
    "memory_id" uuid NOT NULL REFERENCES "memory"("id") ON DELETE cascade, "person_id" uuid NOT NULL REFERENCES "person"("id") ON DELETE cascade,
    "hidden" boolean DEFAULT false NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS "memory_question" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade, "person_id" uuid NOT NULL REFERENCES "person"("id") ON DELETE cascade,
    "asked_by" text REFERENCES "user"("id") ON DELETE set null, "text" text NOT NULL,
    "memory_id" uuid REFERENCES "memory"("id") ON DELETE set null, "dismissed" boolean DEFAULT false NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS "memory_reply" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "memory_id" uuid NOT NULL REFERENCES "memory"("id") ON DELETE cascade,
    "author_id" text REFERENCES "user"("id") ON DELETE set null, "body" text NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE INDEX IF NOT EXISTS "memory_person_idx" ON "memory" ("person_id")`,
  sql`CREATE INDEX IF NOT EXISTS "memory_tree_idx" ON "memory" ("tree_id")`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "memory_mention_pk" ON "memory_mention" ("memory_id","person_id")`,
  sql`CREATE INDEX IF NOT EXISTS "memory_mention_person_idx" ON "memory_mention" ("person_id")`,
  sql`CREATE INDEX IF NOT EXISTS "memory_question_person_idx" ON "memory_question" ("person_id")`,
  sql`CREATE INDEX IF NOT EXISTS "memory_reply_memory_idx" ON "memory_reply" ("memory_id")`,
  // Pasul 2 al lăzii: glasul și modul „la bunici”.
  sql`ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "audio_document_id" uuid REFERENCES "document"("id") ON DELETE set null`,
  sql`ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "audio_seconds" integer`,
  sql`ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "helper" boolean DEFAULT false NOT NULL`,
  sql`ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "consent_at" timestamp`,
  sql`ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "consent_document_id" uuid REFERENCES "document"("id") ON DELETE set null`,
  sql`ALTER TABLE "tree" ADD COLUMN IF NOT EXISTS "journey_word" text`,
  // Panoul de admin, „Manager control”: planul fiecărui cont și setările planurilor.
  sql`CREATE TABLE IF NOT EXISTS "account_plan" (
    "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE cascade, "plan" text NOT NULL, "note" text,
    "set_by" text REFERENCES "user"("id") ON DELETE set null, "updated_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS "app_setting" (
    "key" text PRIMARY KEY NOT NULL, "value" jsonb NOT NULL,
    "updated_by" text REFERENCES "user"("id") ON DELETE set null, "updated_at" timestamp DEFAULT now() NOT NULL)`,
  sql`ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "paid_until" timestamp`,
  sql`ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "tier" text`,
  sql`UPDATE "account_plan" SET "tier" = 'basic' WHERE "tier" IS NULL AND ("plan" = 'familie' OR "paid_until" > now())`,
  sql`CREATE TABLE IF NOT EXISTS "payment" (
    "id" text PRIMARY KEY NOT NULL, "user_id" text REFERENCES "user"("id") ON DELETE set null, "kind" text NOT NULL,
    "tree_id" uuid REFERENCES "tree"("id") ON DELETE set null, "amount" integer NOT NULL, "currency" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE INDEX IF NOT EXISTS "payment_user_idx" ON "payment" USING btree ("user_id","kind")`,
  // Cât folosesc oamenii site-ul, doar cu acordul lor.
  sql`CREATE TABLE IF NOT EXISTS "usage_day" (
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade, "day" date NOT NULL, "section" text NOT NULL,
    "seconds" integer DEFAULT 0 NOT NULL, "views" integer DEFAULT 0 NOT NULL, "phone_seconds" integer DEFAULT 0 NOT NULL,
    "app_seconds" integer DEFAULT 0 NOT NULL, "last_beat" text, "updated_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "usage_day_pk" ON "usage_day" USING btree ("user_id","day","section")`,
  sql`CREATE INDEX IF NOT EXISTS "usage_day_day_idx" ON "usage_day" USING btree ("day")`,
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
/**
 * Local (PGlite), schema se aplică automat la prima cerere, ca aplicația să pornească fără pași în plus.
 * Pe Neon migrațiile rulează deja la fiecare publicare (scripts/deploy-db.ts), așa că nu le mai verificăm la fiecare pornire
 * a serverului: verificarea deschidea o conexiune nouă, directă, la bază și întârzia prima pagină după o pauză.
 */
export function ensureSchema() {
  if (process.env.DATABASE_URL && process.env.VERCEL) return Promise.resolve();
  return (done ??= applySchema(db).catch((e) => {
    done = null;
    console.error("Nu am putut aplica schema bazei de date.", e);
  }));
}
