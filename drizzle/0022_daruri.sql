-- Pachetul Basic + carte, aducerea aminte înainte de expirare, anul dăruit și zilele pentru o rudă adusă.
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "extra" text;
--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "reminded_for" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"buyer_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"tier" text NOT NULL,
	"note" text,
	"for_name" text,
	"redeemed_by" text REFERENCES "public"."user"("id") ON DELETE set null,
	"redeemed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_bonus" (
	"referred_id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"days" integer NOT NULL,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
