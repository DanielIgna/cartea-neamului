-- Parteneri ca CRM (Daniel, 2026-11-14, inspirat din „Strategic City Partnership” de pe PropManage): etapa în drumul de la
-- prospect la partener activ, categoria magazinului, județul, următorul pas cu dată (aducere aminte) și istoricul de contact.
-- Carduri digitale: un lot poate fi „digital” (fără tipar); fiecare card primește o legătură secretă /card/<token> pe care
-- magazinul o trimite clientului (WhatsApp, SMS, email) în clipa vânzării.
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "etapa" text DEFAULT 'prospect' NOT NULL;
--> statement-breakpoint
UPDATE "partners" SET "etapa" = CASE WHEN "activ" THEN 'activ' ELSE 'pauzat' END WHERE "etapa" = 'prospect';
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "categorie" text;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "judet" text;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "website" text;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "functie" text;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "sursa" text;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "urmatorul_pas" text;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "urmatorul_pas_la" timestamp;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "tip" text DEFAULT 'magazin' NOT NULL;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "ref_code" text;
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "plafon_zi" integer DEFAULT 20 NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "partners_ref_code_idx" ON "partners" ("ref_code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_referral" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE cascade,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_referral_partner_idx" ON "partner_referral" ("partner_id","at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_contact_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE cascade,
	"canal" text NOT NULL,
	"nota" text NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"created_by" text REFERENCES "user"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_contact_log_idx" ON "partner_contact_log" ("partner_id","at");
--> statement-breakpoint
ALTER TABLE "gift_card_batches" ADD COLUMN IF NOT EXISTS "digital" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN IF NOT EXISTS "share_token" text;
--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN IF NOT EXISTS "pentru" text;
--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN IF NOT EXISTS "mesaj" text;
--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN IF NOT EXISTS "sent_via" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_share_token_idx" ON "gift_cards" ("share_token");
