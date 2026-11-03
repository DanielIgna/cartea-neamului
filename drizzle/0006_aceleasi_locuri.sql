ALTER TABLE "tree" ADD COLUMN IF NOT EXISTS "discoverable" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tree_place" (
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"place_id" text NOT NULL,
	"area" text,
	"name" text NOT NULL,
	"detail" text,
	"people" integer NOT NULL,
	"from_year" integer,
	"to_year" integer,
	"surnames" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tree_place_pk" ON "tree_place" USING btree ("tree_id","place_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tree_place_place_idx" ON "tree_place" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tree_place_area_idx" ON "tree_place" USING btree ("area");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "place_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"from_tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"to_tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"to_user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"place" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"answered_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "place_contact_pair" ON "place_contact" USING btree ("from_user_id","to_tree_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "place_contact_to_idx" ON "place_contact" USING btree ("to_user_id","status");
