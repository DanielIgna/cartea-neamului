CREATE TABLE IF NOT EXISTS "account_plan" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"plan" text NOT NULL,
	"note" text,
	"set_by" text REFERENCES "public"."user"("id") ON DELETE set null,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text REFERENCES "public"."user"("id") ON DELETE set null,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
