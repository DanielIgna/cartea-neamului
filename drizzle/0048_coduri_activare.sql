-- Coduri de activare pentru cardurile cadou vândute pe alte platforme, de pildă Trendyol (Daniel, 25.11.2026). Tabel nou;
-- nimic din ce există (plăți, abonamente, carduri din magazine) nu se schimbă.
CREATE TABLE IF NOT EXISTS "activation_code" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cod" text NOT NULL,
  "plan" text NOT NULL,
  "durata_luni" integer DEFAULT 12 NOT NULL,
  "sursa" text NOT NULL,
  "status" text DEFAULT 'nefolosit' NOT NULL,
  "lot" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE set null,
  "used_at" timestamp,
  "used_by_user_id" text REFERENCES "user"("id") ON DELETE set null,
  "cancelled_at" timestamp
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "activation_code_cod_idx" ON "activation_code" ("cod");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activation_code_status_idx" ON "activation_code" ("status","sursa","created_at");
