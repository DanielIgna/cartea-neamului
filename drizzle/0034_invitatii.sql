-- Programul de invitații (Daniel, 2026-11-14): fiecare om are un cod personal (/i/<cod>). Cine își face cont prin el și își
-- dovedește contul (email confirmat sau Google + măcar o persoană în arbore) îi aduce celui care l-a invitat zile gratuite, și
-- primește și el tot atâtea. Vezi src/lib/invitatii.ts.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "free_until" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invite_code" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"code" text NOT NULL,
	"share_tree_id" uuid REFERENCES "tree"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invite_code_code_idx" ON "invite_code" ("code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invite_referral" (
	"referred_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"referrer_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"via" text NOT NULL,
	"status" text DEFAULT 'asteapta' NOT NULL,
	"reason" text,
	"days_referrer" integer DEFAULT 0 NOT NULL,
	"days_referred" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"rewarded_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invite_referral_referrer_idx" ON "invite_referral" ("referrer_id","status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invite_click" (
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"day" date NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invite_click_pk" ON "invite_click" ("user_id","day");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"kind" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notice_user_idx" ON "user_notice" ("user_id","read_at");
