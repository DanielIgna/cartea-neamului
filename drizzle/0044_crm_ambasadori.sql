-- CRM Etapa 10 (Daniel, 2026-11-18): profesorii ambasadori. Fiecare are linkul lui (?src=prof-<slug>), codul lui NEAM-XXXX (aceeași
-- reducere ca NEAM90) și/sau codul clasei lui din Admin → Școli. Elevii aduși și plățile lor dau recompensa, după regulile din
-- Admin (app_setting `crm_recompense`); recompensele date se trec în crm_ambassador_payouts. Datele profesorului doar cu acordul lui.
CREATE TABLE IF NOT EXISTS "crm_ambassadors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nume" text NOT NULL,
	"email" text,
	"telefon" text,
	"acord_la" timestamp,
	"organization_id" uuid REFERENCES "crm_organizations"("id") ON DELETE SET NULL,
	"user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
	"slug" text NOT NULL,
	"cod" text,
	"stripe_promo_id" text,
	"school_code_id" uuid REFERENCES "school_code"("id") ON DELETE SET NULL,
	"activ" boolean DEFAULT true NOT NULL,
	"nota" text,
	"created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_ambassadors_slug_idx" ON "crm_ambassadors" ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_ambassadors_cod_idx" ON "crm_ambassadors" ("cod");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_ambassador_accounts" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"ambassador_id" uuid NOT NULL REFERENCES "crm_ambassadors"("id") ON DELETE CASCADE,
	"via" text NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_ambassador_accounts_idx" ON "crm_ambassador_accounts" ("ambassador_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_ambassador_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL REFERENCES "crm_ambassadors"("id") ON DELETE CASCADE,
	"suma" integer NOT NULL,
	"nota" text,
	"at" timestamp DEFAULT now() NOT NULL,
	"created_by" text REFERENCES "user"("id") ON DELETE SET NULL
);
