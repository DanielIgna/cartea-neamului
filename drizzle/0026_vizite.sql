-- Vizitele, numărate anonim (Daniel, 2026-11-13, Admin → Analiză): fără cookie-uri și fără firme din afară. Vizitatorul e doar o
-- amprentă scurtă din IP + browser + o sare care se schimbă în fiecare zi și apoi se șterge, deci a doua zi nu mai poate fi legat
-- de nimeni. Adresele paginilor private (arbori, persoane, coduri) se păstrează doar până la primul cuvânt. Se șterg după 13 luni.
CREATE TABLE IF NOT EXISTS "page_view" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"day" date NOT NULL,
	"hour" smallint NOT NULL,
	"visitor" text NOT NULL,
	"path" text NOT NULL,
	"source" text NOT NULL,
	"referrer" text,
	"medium" text,
	"campaign" text,
	"device" text NOT NULL,
	"country" text,
	"lang" text,
	"logged" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_view_day_idx" ON "page_view" ("day");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_view_visitor_idx" ON "page_view" ("visitor","at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visit_salt" (
	"day" date PRIMARY KEY NOT NULL,
	"salt" text NOT NULL
);
