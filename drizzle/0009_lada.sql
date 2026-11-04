DO $$ BEGIN CREATE TYPE "public"."memory_visibility" AS ENUM('private', 'asker', 'close', 'tree'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"person_id" uuid NOT NULL REFERENCES "public"."person"("id") ON DELETE cascade,
	"author_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"chapter" text DEFAULT 'altele' NOT NULL,
	"question" text,
	"question_key" text,
	"asked_id" uuid,
	"title" text,
	"body" text NOT NULL,
	"when_text" text,
	"when_year" integer,
	"place" text,
	"photo_document_id" uuid REFERENCES "public"."document"("id") ON DELETE set null,
	"visibility" "memory_visibility" DEFAULT 'tree' NOT NULL,
	"max_degree" integer,
	"in_book" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_mention" (
	"memory_id" uuid NOT NULL REFERENCES "public"."memory"("id") ON DELETE cascade,
	"person_id" uuid NOT NULL REFERENCES "public"."person"("id") ON DELETE cascade,
	"hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"person_id" uuid NOT NULL REFERENCES "public"."person"("id") ON DELETE cascade,
	"asked_by" text REFERENCES "public"."user"("id") ON DELETE set null,
	"text" text NOT NULL,
	"memory_id" uuid REFERENCES "public"."memory"("id") ON DELETE set null,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_reply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL REFERENCES "public"."memory"("id") ON DELETE cascade,
	"author_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_person_idx" ON "memory" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_tree_idx" ON "memory" USING btree ("tree_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "memory_mention_pk" ON "memory_mention" USING btree ("memory_id","person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_mention_person_idx" ON "memory_mention" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_question_person_idx" ON "memory_question" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_reply_memory_idx" ON "memory_reply" USING btree ("memory_id");
