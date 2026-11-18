-- CRM Etapa 5 (Daniel, 2026-11-18): campanii către organizații trimise din CRM, cu șablon, limită pe zi, doar luni–vineri,
-- în fereastra orară aleasă, o singură trimitere pe organizație. Fiecare trimitere are urmărire (livrat, deschis, click,
-- nelivrat, dezabonat) și se trece ca activitate pe organizație. Lista „nu contacta” se verifică la fiecare trimitere.
CREATE TABLE IF NOT EXISTS "crm_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nume" text NOT NULL,
	"tip_org" text,
	"subiect" text NOT NULL,
	"corp" text NOT NULL,
	"buton_text" text,
	"buton_cale" text,
	"activ" boolean DEFAULT true NOT NULL,
	"created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nume" text NOT NULL,
	"template_id" uuid NOT NULL REFERENCES "crm_templates"("id") ON DELETE RESTRICT,
	"filtru" jsonb,
	"status" text DEFAULT 'ciorna' NOT NULL,
	"limita_zi" integer DEFAULT 20 NOT NULL,
	"ora_start" integer DEFAULT 9 NOT NULL,
	"ora_sfarsit" integer DEFAULT 16 NOT NULL,
	"follow_up_zile" integer,
	"follow_up_template_id" uuid REFERENCES "crm_templates"("id") ON DELETE SET NULL,
	"created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL REFERENCES "crm_campaigns"("id") ON DELETE CASCADE,
	"organization_id" uuid NOT NULL REFERENCES "crm_organizations"("id") ON DELETE CASCADE,
	"template_id" uuid REFERENCES "crm_templates"("id") ON DELETE SET NULL,
	"pas" integer DEFAULT 1 NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'trimis' NOT NULL,
	"motiv" text,
	"resend_id" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"clicks" integer DEFAULT 0 NOT NULL,
	"bounced_at" timestamp,
	"unsubscribed_at" timestamp,
	"replied_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "crm_sends_once_idx" ON "crm_sends" ("campaign_id","organization_id","pas");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_sends_org_idx" ON "crm_sends" ("organization_id","sent_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_sends_resend_idx" ON "crm_sends" ("resend_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_sends_day_idx" ON "crm_sends" ("sent_at");
