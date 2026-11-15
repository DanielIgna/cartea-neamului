-- Motorul de publicare SEO (Daniel, 2026-11-14, Admin → SEO → Motor): coada paginilor publice care intră în Google pe rând
-- (50 pe zi la început, până la 200 cât timp Google le indexează bine). Fără date ale oamenilor: doar adrese de pagini publice,
-- datele publice adunate la generare (Wikipedia, cu atribuire) și rezultatul controlului de calitate.
CREATE TABLE IF NOT EXISTS "seo_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"path" text NOT NULL,
	"lang" text DEFAULT 'ro' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'asteptare' NOT NULL,
	"data" jsonb,
	"words" integer,
	"unique_words" integer,
	"facts" integer,
	"similarity" integer,
	"reasons" text,
	"generated_at" timestamp,
	"published_at" timestamp,
	"lastmod" timestamp,
	"indexed" text,
	"inspected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "seo_queue_path_lang" ON "seo_queue" USING btree ("path","lang");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_queue_status_idx" ON "seo_queue" USING btree ("status","priority");
