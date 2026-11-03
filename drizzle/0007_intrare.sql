CREATE TABLE IF NOT EXISTS "join_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"name_key" text NOT NULL,
	"found" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "join_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"person_id" uuid NOT NULL REFERENCES "public"."person"("id") ON DELETE cascade,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"answered_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "join_attempt_user_idx" ON "join_attempt" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "join_attempt_name_idx" ON "join_attempt" USING btree ("name_key","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "join_request_pair" ON "join_request" USING btree ("user_id","person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "join_request_tree_idx" ON "join_request" USING btree ("tree_id","status");
