-- CRM Etapa 8 (Daniel, 2026-11-18): sarcini cu termen pe organizație („sună joi”, „revino peste 30 de zile”), care apar în „Azi”.
-- Unele se fac singure: „de sunat” la școlile cu email nelivrat și „răspunde” la un răspuns pozitiv (cheia `dedupe_key` le ține unice).
CREATE TABLE IF NOT EXISTS "crm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid REFERENCES "crm_organizations"("id") ON DELETE CASCADE,
	"titlu" text NOT NULL,
	"scadenta" timestamp NOT NULL,
	"status" text DEFAULT 'deschisa' NOT NULL,
	"sursa" text DEFAULT 'manual' NOT NULL,
	"dedupe_key" text,
	"created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"done_at" timestamp,
	"done_by" text REFERENCES "user"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_tasks_dedupe_idx" ON "crm_tasks" ("dedupe_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_tasks_due_idx" ON "crm_tasks" ("status","scadenta");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_tasks_org_idx" ON "crm_tasks" ("organization_id");
