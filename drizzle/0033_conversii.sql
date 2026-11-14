-- Conversiile, cu sursa lor (Daniel, 2026-11-14, Admin → Analiză → Conversii și Admin → SEO): când cineva își face cont, pornește un
-- arbore, apasă un buton de început sau plătește, notăm de unde venise vizita (sursa, campania, prima pagină a vizitei), găsită după
-- amprenta anonimă a zilei din page_view. Rândul NU are id de cont sau de arbore: nu se poate lega de un om, doar se numără.
CREATE TABLE IF NOT EXISTS "conversion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"day" date NOT NULL,
	"kind" text NOT NULL,
	"label" text,
	"page" text,
	"landing" text,
	"source" text NOT NULL,
	"medium" text,
	"campaign" text,
	"referrer" text,
	"device" text,
	"country" text,
	"amount" integer,
	"currency" text,
	"attributed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversion_day_idx" ON "conversion" ("day","kind");
