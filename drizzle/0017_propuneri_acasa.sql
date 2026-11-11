-- Poze de familie propuse de oameni pentru bannerul de pe prima pagină. Nimic nu apare singur: omul bifează acordul,
-- adminul aprobă. Poza e copiată în bucket (site/propuneri/), ca să nu depindă de albumul din arbore. Omul o poate retrage oricând.
CREATE TABLE IF NOT EXISTS "home_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"tree_id" uuid REFERENCES "public"."tree"("id") ON DELETE set null,
	"document_id" uuid REFERENCES "public"."document"("id") ON DELETE set null,
	"file_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"caption" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"consent_text_version" text NOT NULL,
	"consent_at" timestamp NOT NULL,
	"locale" text,
	"decided_by" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "home_submission_user_idx" ON "home_submission" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "home_submission_status_idx" ON "home_submission" USING btree ("status","created_at");
