-- Carduri cadou vândute prin magazine (Daniel, 2026-11-14, Admin → Carduri cadou): magazinele partenere, loturile de coduri și
-- fiecare card. Un cod se poate folosi doar după ce e marcat „vândut” (de admin sau de magazin, cu PIN), ca un card furat de
-- pe raft să nu meargă. „gift_card_attempt” ține încercările de pe /activeaza (amprenta IP-ului, nu IP-ul), pentru limita pe oră.
CREATE TABLE IF NOT EXISTS "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nume_magazin" text NOT NULL,
	"oras" text,
	"adresa" text,
	"persoana_contact" text,
	"telefon" text,
	"email" text,
	"comision_procent" numeric(5,2) DEFAULT 25 NOT NULL,
	"activ" boolean DEFAULT true NOT NULL,
	"note" text,
	"portal_token" text,
	"pin_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "partners_portal_token_idx" ON "partners" ("portal_token");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift_card_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE restrict,
	"plan" text DEFAULT 'basic' NOT NULL,
	"durata_luni" integer DEFAULT 12 NOT NULL,
	"pret_raft_lei" numeric(10,2) DEFAULT 49 NOT NULL,
	"cantitate" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text REFERENCES "user"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_card_batches_partner_idx" ON "gift_card_batches" ("partner_id","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL REFERENCES "gift_card_batches"("id") ON DELETE restrict,
	"seq" integer NOT NULL,
	"cod" text NOT NULL,
	"status" text DEFAULT 'generat' NOT NULL,
	"partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE restrict,
	"sold_at" timestamp,
	"redeemed_at" timestamp,
	"redeemed_by_user_id" text REFERENCES "user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_cod_idx" ON "gift_cards" ("cod");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_cards_batch_idx" ON "gift_cards" ("batch_id","seq");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_cards_partner_idx" ON "gift_cards" ("partner_id","status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift_card_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"who" text NOT NULL,
	"ok" boolean DEFAULT false NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_card_attempt_idx" ON "gift_card_attempt" ("who","at");
--> statement-breakpoint
INSERT INTO "app_setting" ("key","value") VALUES ('gift_cards_enabled', 'false'::jsonb) ON CONFLICT ("key") DO NOTHING;
