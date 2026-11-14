-- Contul gratuit PropManage oferit după activarea cardului cadou (Daniel, 2026-11-14). Numele și emailul pleacă la PropManage
-- doar după bifa de acord (nebifată implicit) și butonul „Vreau contul gratuit”; fiecare cerere e un rând, cu textul exact al bifei.
-- Oferta are comutatorul ei în Admin → Carduri cadou (app_setting „propmanage_offer_enabled”), oprit până îl pornește Daniel.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "propmanage_invited_at" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "propmanage_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text REFERENCES "user"("id") ON DELETE set null,
	"consent_text" text NOT NULL,
	"consent_at" timestamp NOT NULL,
	"locale" text,
	"place" text NOT NULL,
	"sursa" text DEFAULT 'cartea-neamului' NOT NULL,
	"partner_id" uuid REFERENCES "partners"("id") ON DELETE set null,
	"card_id" uuid REFERENCES "gift_cards"("id") ON DELETE set null,
	"batch_id" uuid REFERENCES "gift_card_batches"("id") ON DELETE set null,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "propmanage_invite_user_idx" ON "propmanage_invite" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "propmanage_invite_partner_idx" ON "propmanage_invite" ("partner_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "propmanage_invite_batch_idx" ON "propmanage_invite" ("batch_id","status");
