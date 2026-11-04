ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "audio_document_id" uuid REFERENCES "public"."document"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "audio_seconds" integer;--> statement-breakpoint
ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "helper" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "consent_at" timestamp;--> statement-breakpoint
ALTER TABLE "memory" ADD COLUMN IF NOT EXISTS "consent_document_id" uuid REFERENCES "public"."document"("id") ON DELETE set null;
