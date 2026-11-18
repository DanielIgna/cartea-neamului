-- CRM Etapa 7 (Daniel, 2026-11-18): legătura cu banii. Fiecare organizație poate avea un cod NEAM-XXXX (aceeași reducere ca NEAM90,
-- făcut în Stripe) și poate fi legată de o școală din Admin → Școli. Conturile aduse (prin ?src=, cod sau codul școlii) se țin
-- în crm_org_accounts; plățile lor dau venitul organizației, iar prima plată o trece în „client”.
ALTER TABLE "crm_organizations" ADD COLUMN IF NOT EXISTS "cod" text;
--> statement-breakpoint
ALTER TABLE "crm_organizations" ADD COLUMN IF NOT EXISTS "stripe_promo_id" text;
--> statement-breakpoint
ALTER TABLE "crm_organizations" ADD COLUMN IF NOT EXISTS "school_id" uuid REFERENCES "school"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_organizations_cod_idx" ON "crm_organizations" ("cod");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_org_accounts" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"organization_id" uuid NOT NULL REFERENCES "crm_organizations"("id") ON DELETE CASCADE,
	"via" text NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_org_accounts_org_idx" ON "crm_org_accounts" ("organization_id");
