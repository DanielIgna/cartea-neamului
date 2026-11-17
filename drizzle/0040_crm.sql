-- CRM-ul din Admin (Daniel, 2026-11-17), vezi src/lib/crm.ts și docs/crm-inventar.md.
-- Organizațiile (școli, firme, asociații, presă...) sunt instituții cu adrese oficiale publice; persoanele de contact se țin doar
-- dacă și-au dat singure datele. Lista „nu contacta” (crm_suppression) se verifică înainte de orice trimitere de marketing.
-- Utilizatorii existenți nu se dublează: crm_user_signals ține doar scorul și etapa lor.
CREATE TABLE IF NOT EXISTS "crm_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip" text NOT NULL,
	"nume" text NOT NULL,
	"localitate" text,
	"judet" text,
	"tara" text DEFAULT 'RO' NOT NULL,
	"site" text,
	"email_oficial" text,
	"telefon" text,
	"sursa_datelor" text,
	"status" text DEFAULT 'nou' NOT NULL,
	"owner" text DEFAULT 'Daniel' NOT NULL,
	"note" text,
	"de_sunat" boolean DEFAULT false NOT NULL,
	"slug" text,
	"dedupe_key" text NOT NULL,
	"partner_id" uuid REFERENCES "partners"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_organizations_dedupe_idx" ON "crm_organizations" ("dedupe_key");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_organizations_slug_idx" ON "crm_organizations" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_organizations_status_idx" ON "crm_organizations" ("tip","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_organizations_email_idx" ON "crm_organizations" (lower("email_oficial"));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid REFERENCES "crm_organizations"("id") ON DELETE cascade,
	"nume" text,
	"rol" text,
	"email" text,
	"telefon" text,
	"consimtamant" boolean DEFAULT false NOT NULL,
	"sursa_consimtamant" text,
	"consimtamant_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_contacts_org_idx" ON "crm_contacts" ("organization_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip" text NOT NULL,
	"canal" text,
	"rezumat" text,
	"at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid REFERENCES "crm_organizations"("id") ON DELETE cascade,
	"contact_id" uuid REFERENCES "crm_contacts"("id") ON DELETE set null,
	"user_id" text REFERENCES "user"("id") ON DELETE set null,
	"external_id" text,
	"meta" jsonb,
	"created_by" text REFERENCES "user"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_activities_external_idx" ON "crm_activities" ("external_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_activities_org_idx" ON "crm_activities" ("organization_id","at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_activities_user_idx" ON "crm_activities" ("user_id","at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "crm_organizations"("id") ON DELETE cascade,
	"produs" text NOT NULL,
	"conturi_estimate" integer,
	"valoare_estimata" integer,
	"etapa" text DEFAULT 'nou' NOT NULL,
	"urmatorul_pas" text,
	"data_urmatorului_pas" timestamp,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_deals_etapa_idx" ON "crm_deals" ("etapa","data_urmatorului_pas");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_deals_org_idx" ON "crm_deals" ("organization_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip_actiune" text NOT NULL,
	"payload" jsonb NOT NULL,
	"motiv" text,
	"risc" text DEFAULT 'MEDIUM' NOT NULL,
	"status" text DEFAULT 'in_asteptare' NOT NULL,
	"organization_id" uuid REFERENCES "crm_organizations"("id") ON DELETE cascade,
	"user_id" text REFERENCES "user"("id") ON DELETE cascade,
	"dedupe_key" text,
	"cine_a_aprobat" text REFERENCES "user"("id") ON DELETE set null,
	"cand" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_approvals_dedupe_idx" ON "crm_approvals" ("dedupe_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_approvals_status_idx" ON "crm_approvals" ("status","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_suppression" (
	"valoare" text PRIMARY KEY NOT NULL,
	"tip" text DEFAULT 'email' NOT NULL,
	"motiv" text NOT NULL,
	"sursa" text,
	"created_by" text REFERENCES "user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_user_signals" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"sursa" text,
	"scor" integer DEFAULT 0 NOT NULL,
	"etapa" text DEFAULT 'cont' NOT NULL,
	"ultima_activitate" timestamp,
	"detalii" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_user_signals_etapa_idx" ON "crm_user_signals" ("etapa","scor");
