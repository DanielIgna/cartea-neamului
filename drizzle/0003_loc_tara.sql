ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "birth_country" text;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "death_country" text;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "residence_place" text;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "residence_country" text;