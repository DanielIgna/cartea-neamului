-- Acordul pentru beneficiile de la parteneri (acum doar PropManage): un rând pentru fiecare „da” și fiecare „nu”, ca istoricul să rămână.
CREATE TABLE IF NOT EXISTS "partner_consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"partner" text NOT NULL,
	"granted" boolean NOT NULL,
	"granted_at" timestamp,
	"revoked_at" timestamp,
	"text_version" text NOT NULL,
	"locale" text,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_consent_user_idx" ON "partner_consent" USING btree ("user_id","partner","created_at");
--> statement-breakpoint
-- Casa bătrânească a unui om din arbore: unde e, cine a ridicat-o, când, poze și povestea ei. Fiecare autor scrie cel mult una pentru un om.
CREATE TABLE IF NOT EXISTS "old_house" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"person_id" uuid NOT NULL REFERENCES "public"."person"("id") ON DELETE cascade,
	"author_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"place" text,
	"built_by" text,
	"built_year" integer,
	"story" text,
	"photo_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" "memory_visibility" DEFAULT 'tree' NOT NULL,
	"max_degree" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "old_house_person_idx" ON "old_house" USING btree ("person_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "old_house_tree_idx" ON "old_house" USING btree ("tree_id");
