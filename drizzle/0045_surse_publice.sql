-- „Surse publice” (Daniel, 18.11.2026): „Sursa informației” la fiecare persoană (text liber + link) și „Nu mai arăta” pentru
-- cardul „Caută în arhive publice”, ținut pentru fiecare om și fiecare persoană (cine l-a închis nu-l mai vede; ceilalți da).
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "info_source" text;
--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "info_source_url" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "archive_hint_dismissal" (
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"person_id" uuid NOT NULL REFERENCES "person"("id") ON DELETE CASCADE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "archive_hint_dismissal_pk" PRIMARY KEY ("user_id", "person_id")
);
