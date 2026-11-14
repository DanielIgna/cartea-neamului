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
  sql`ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "extra" text`,
  sql`ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "reminded_for" timestamp`,
  sql`CREATE TABLE IF NOT EXISTS "gift" (
    "id" text PRIMARY KEY NOT NULL, "payment_id" text NOT NULL, "buyer_id" text REFERENCES "user"("id") ON DELETE set null, "tier" text NOT NULL,
    "note" text, "for_name" text, "redeemed_by" text REFERENCES "user"("id") ON DELETE set null, "redeemed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS "referral_bonus" (
    "referred_id" text PRIMARY KEY NOT NULL, "referrer_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade, "days" integer NOT NULL,
    "applied_at" timestamp, "created_at" timestamp DEFAULT now() NOT NULL)`,
  // „Vreau un test ADN” (fără date genetice) și laboratoarele din lista informativă.
  sql`CREATE TABLE IF NOT EXISTS "dna_request" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "phone" text, "city" text NOT NULL,
    "message" text NOT NULL, "locale" text, "consent_at" timestamp NOT NULL, "consent_version" text NOT NULL, "resolved_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS "dna_lab" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "city" text, "url" text NOT NULL, "price_note" text,
    "position" integer DEFAULT 0 NOT NULL, "visible" boolean DEFAULT true NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL)`,
  sql`ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "keep_until" timestamp`,
  // Securitate: verificarea în 2 pași, dispozitivele cunoscute și jurnalul de securitate.
  sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false`,
  sql`CREATE TABLE IF NOT EXISTS "two_factor" ("id" text PRIMARY KEY NOT NULL, "secret" text NOT NULL, "backup_codes" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade)`,
  sql`CREATE INDEX IF NOT EXISTS "two_factor_user_idx" ON "two_factor" ("user_id")`,
  sql`CREATE TABLE IF NOT EXISTS "security_event" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "kind" text NOT NULL,
    "user_id" text REFERENCES "user"("id") ON DELETE cascade, "email" text, "ip" text, "device" text, "place" text, "detail" text,
    "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE INDEX IF NOT EXISTS "security_event_kind_idx" ON "security_event" ("kind","created_at")`,
  sql`CREATE INDEX IF NOT EXISTS "security_event_email_idx" ON "security_event" ("email","created_at")`,
  sql`CREATE INDEX IF NOT EXISTS "security_event_ip_idx" ON "security_event" ("ip","created_at")`,
  sql`CREATE TABLE IF NOT EXISTS "known_device" ("user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade, "device_hash" text NOT NULL,
    "label" text, "first_seen" timestamp DEFAULT now() NOT NULL, "last_seen" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "known_device_pk" ON "known_device" ("user_id","device_hash")`,
  // Carduri cadou prin magazine (migrația 0028), dacă migrarea drizzle n-a rulat.
  sql`CREATE TABLE IF NOT EXISTS "partners" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "nume_magazin" text NOT NULL,
    "oras" text, "adresa" text, "persoana_contact" text, "telefon" text, "email" text, "comision_procent" numeric(5,2) DEFAULT 25 NOT NULL,
    "activ" boolean DEFAULT true NOT NULL, "note" text, "portal_token" text, "pin_hash" text, "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "partners_portal_token_idx" ON "partners" ("portal_token")`,
  sql`CREATE TABLE IF NOT EXISTS "gift_card_batches" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE restrict, "plan" text DEFAULT 'basic' NOT NULL,
    "durata_luni" integer DEFAULT 12 NOT NULL, "pret_raft_lei" numeric(10,2) DEFAULT 49 NOT NULL, "cantitate" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL, "created_by" text REFERENCES "user"("id") ON DELETE set null)`,
  sql`CREATE TABLE IF NOT EXISTS "gift_cards" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "batch_id" uuid NOT NULL REFERENCES "gift_card_batches"("id") ON DELETE restrict, "seq" integer NOT NULL, "cod" text NOT NULL,
    "status" text DEFAULT 'generat' NOT NULL, "partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE restrict,
    "sold_at" timestamp, "redeemed_at" timestamp, "redeemed_by_user_id" text REFERENCES "user"("id") ON DELETE set null,
    "created_at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_cod_idx" ON "gift_cards" ("cod")`,
  sql`CREATE TABLE IF NOT EXISTS "gift_card_attempt" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "who" text NOT NULL,
    "ok" boolean DEFAULT false NOT NULL, "at" timestamp DEFAULT now() NOT NULL)`,
  sql`CREATE INDEX IF NOT EXISTS "gift_card_attempt_idx" ON "gift_card_attempt" ("who","at")`,
  // Parteneri ca CRM și carduri digitale (migrația 0029).
  ...["etapa text DEFAULT 'prospect' NOT NULL", "categorie text", "judet text", "website text", "functie text", "sursa text", "urmatorul_pas text",
    "urmatorul_pas_la timestamp", "updated_at timestamp DEFAULT now() NOT NULL",
    "tip text DEFAULT 'magazin' NOT NULL", "ref_code text", "plafon_zi integer DEFAULT 20 NOT NULL"].map((c) => sql.raw(`ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS ${c.replace(/^(\w+)/, '"$1"')}`)),
  sql`CREATE TABLE IF NOT EXISTS "partner_contact_log" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE cascade, "canal" text NOT NULL, "nota" text NOT NULL,
    "at" timestamp DEFAULT now() NOT NULL, "created_by" text REFERENCES "user"("id") ON DELETE set null)`,
  sql`ALTER TABLE "gift_card_batches" ADD COLUMN IF NOT EXISTS "digital" boolean DEFAULT false NOT NULL`,
  sql`CREATE TABLE IF NOT EXISTS "partner_referral" ("user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE cascade, "at" timestamp DEFAULT now() NOT NULL)`,
  ...["share_token", "pentru", "mesaj", "sent_via"].map((c) => sql.raw(`ALTER TABLE "gift_cards" ADD COLUMN IF NOT EXISTS "${c}" text`)),
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_share_token_idx" ON "gift_cards" ("share_token")`,
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
