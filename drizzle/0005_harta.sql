CREATE TABLE IF NOT EXISTS "place_pin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"key" text NOT NULL,
	"place_id" text,
	"name" text NOT NULL,
	"detail" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"created_by" text REFERENCES "public"."user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "place_pin_key" ON "place_pin" USING btree ("tree_id","key");
