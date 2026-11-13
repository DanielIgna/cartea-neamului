-- „Raportează o problemă” (Daniel, 2026-11-13): omul din cont spune ce nu merge (o eroare, o legătură greșită în arbore), cu
-- până la 3 poze ale ecranului. Pagina și arborele în care era se țin minte singure. Pozele stau în bucket (probleme/<id>/),
-- le vede doar el și adminul. Adminul răspunde și o marchează rezolvată din Admin → Probleme.
CREATE TABLE IF NOT EXISTS "problem_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"tree_id" uuid REFERENCES "public"."tree"("id") ON DELETE set null,
	"person_id" uuid,
	"kind" text DEFAULT 'eroare' NOT NULL,
	"message" text NOT NULL,
	"page" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"browser" text,
	"screen" text,
	"locale" text,
	"status" text DEFAULT 'nou' NOT NULL,
	"reply" text,
	"replied_at" timestamp,
	"reply_seen_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problem_report_user_idx" ON "problem_report" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problem_report_status_idx" ON "problem_report" USING btree ("status","created_at");
