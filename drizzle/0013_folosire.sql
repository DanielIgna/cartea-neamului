CREATE TABLE IF NOT EXISTS "usage_day" (
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"day" date NOT NULL,
	"section" text NOT NULL,
	"seconds" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"phone_seconds" integer DEFAULT 0 NOT NULL,
	"app_seconds" integer DEFAULT 0 NOT NULL,
	"last_beat" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "usage_day_pk" ON "usage_day" USING btree ("user_id","day","section");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_day_day_idx" ON "usage_day" USING btree ("day");
