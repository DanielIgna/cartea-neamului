-- Arhiva sigilată (Daniel, 2026-11-14, varianta B): după anul plătit, originalele pozelor și actelor scanate mai stau întregi un
-- an (Admin → Arhivă). Cu cartea PDF a arborelui, ele trec comprimate în arhivă pentru 5 ani; fără nicio plată, după acel an
-- rămân doar pozele în mic. Glasurile, actele PDF și textele nu se ating. Conturile făcute înainte de pornirea regulilor păstrează
-- promisiunea de atunci („nu se șterge nimic”). Vezi src/lib/arhivare.ts.
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "preview_key" text;
--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "archived_at" timestamp;
--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "reduced_at" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "archive_plan" (
	"tree_id" uuid NOT NULL REFERENCES "tree"("id") ON DELETE cascade,
	"event" text NOT NULL,
	"due_at" timestamp NOT NULL,
	"notices" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"done_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "archive_plan_pk" PRIMARY KEY("tree_id","event")
);
