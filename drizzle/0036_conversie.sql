-- Conversia din zilele gratuite în plătit (Daniel, 2026-11-16): șirul de emailuri din zilele gratuite (ziua 1, 3, 5, 7, 8, 14),
-- cu deschideri, clicuri și plata care a urmat, și codul unic de reducere (20%, 48 de ore, o singură folosire) din ziua 8.
-- Vezi src/lib/conversie.ts. Nu se șterge nimic la expirarea zilelor gratuite.
CREATE TABLE IF NOT EXISTS "conversion_mail" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"step" text NOT NULL,
	"locale" text DEFAULT 'ro' NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp,
	"opens" integer DEFAULT 0 NOT NULL,
	"clicked_at" timestamp,
	"clicks" integer DEFAULT 0 NOT NULL,
	"paid_at" timestamp,
	"payment_id" text,
	"amount" integer,
	"currency" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "conversion_mail_user_step_idx" ON "conversion_mail" ("user_id","step");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversion_mail_sent_idx" ON "conversion_mail" ("sent_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversion_offer" (
	"code" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"percent" integer NOT NULL,
	"stripe_promo_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"payment_id" text,
	"amount" integer,
	"currency" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "conversion_offer_user_idx" ON "conversion_offer" ("user_id");
