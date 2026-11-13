-- Planurile anuale (Basic, Familie, Premium). În `plan`, „familie” înseamnă în continuare „a plătit anul”; planul ales e în `tier`.
-- Cine avea deja anul plătit (sau „Plătit” pus de mână) trece pe Basic și își păstrează data până la care a plătit.
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "tier" text;
--> statement-breakpoint
UPDATE "account_plan" SET "tier" = 'basic' WHERE "tier" IS NULL AND ("plan" = 'familie' OR "paid_until" > now());
