CREATE TABLE IF NOT EXISTS "raised_by" (
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"child_id" uuid NOT NULL REFERENCES "public"."person"("id") ON DELETE cascade,
	"carer_id" uuid NOT NULL REFERENCES "public"."person"("id") ON DELETE cascade,
	"created_by" text REFERENCES "public"."user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "raised_by_pair" ON "raised_by" USING btree ("child_id","carer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "raised_by_tree_idx" ON "raised_by" USING btree ("tree_id");
