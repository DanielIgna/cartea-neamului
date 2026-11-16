-- De unde vine fiecare cont nou (Daniel, 2026-11-16): sursa first-touch și last-touch, referrer-ul, pagina de intrare,
-- dispozitivul și țara (doar cu acordul pentru cookie-urile de analiză), răspunsul la „De unde ai aflat de noi?” și dacă a venit
-- printr-o invitație. Plus linkurile cu sursă făcute în Admin. Conturile de dinainte rămân fără rând („necunoscut”).
-- Vezi src/lib/sursa.ts.
CREATE TABLE IF NOT EXISTS "account_source" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"analytics" boolean DEFAULT false NOT NULL,
	"source" text,
	"first_src" text,
	"first_utm_source" text,
	"first_medium" text,
	"first_campaign" text,
	"first_referrer" text,
	"first_landing" text,
	"first_at" timestamp,
	"last_source" text,
	"last_src" text,
	"last_medium" text,
	"last_campaign" text,
	"last_referrer" text,
	"last_landing" text,
	"last_at" timestamp,
	"device" text,
	"country" text,
	"answer" text,
	"answer_other" text,
	"answer_auto" boolean DEFAULT false NOT NULL,
	"invite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_source_source_idx" ON "account_source" ("source");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source_link" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"page" text DEFAULT '/' NOT NULL,
	"created_by" text REFERENCES "user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL
);
