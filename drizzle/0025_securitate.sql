-- Securitate (Daniel, 2026-11-13): verificarea în 2 pași (aplicație de coduri + coduri de rezervă), dispozitivele cunoscute
-- și jurnalul de securitate (încercări greșite, blocări, dispozitive noi, plăți ciudate), păstrat 90 de zile.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "two_factor" (
  "id" text PRIMARY KEY NOT NULL, "secret" text NOT NULL, "backup_codes" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "two_factor_user_idx" ON "two_factor" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "security_event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "kind" text NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE cascade, "email" text, "ip" text, "device" text, "place" text, "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_event_kind_idx" ON "security_event" ("kind","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_event_email_idx" ON "security_event" ("email","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_event_ip_idx" ON "security_event" ("ip","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "known_device" (
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade, "device_hash" text NOT NULL, "label" text,
  "first_seen" timestamp DEFAULT now() NOT NULL, "last_seen" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "known_device_pk" ON "known_device" ("user_id","device_hash");
