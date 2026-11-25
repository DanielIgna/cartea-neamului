-- Abonamentele cu reînnoire automată (Daniel, 25.11.2026): planul se reînnoiește singur (lunar, trimestrial sau anual) până
-- omul oprește reînnoirea din cont. Doar coloane noi, goale: anii deja plătiți (paid_until) rămân neatinși.
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "stripe_customer" text;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "stripe_sub" text;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "sub_period" text;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "sub_renews" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "sub_amount" integer;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "sub_currency" text;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "sub_reminded_for" timestamp;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "sub_cancel_pending" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "sub_fixed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_plan_sub_idx" ON "account_plan" ("stripe_sub");
