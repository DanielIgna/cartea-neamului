CREATE TABLE IF NOT EXISTS "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL REFERENCES "public"."tree"("id") ON DELETE cascade,
	"from_user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"to_user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "photo_document_id" uuid;--> statement-breakpoint
ALTER TABLE "tree" ADD COLUMN IF NOT EXISTS "chat_max_degree" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_pair_idx" ON "message" USING btree ("tree_id","from_user_id","to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_to_idx" ON "message" USING btree ("to_user_id","read_at");
