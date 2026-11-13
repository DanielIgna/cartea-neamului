-- Autonomia (Daniel, 2026-11-13, Admin → Autonomie): automatizările care merg singure, fiecare cu comutatorul ei.
-- „automation_run” e jurnalul fiecărei rulări (ce a văzut, ce a făcut, ce așteaptă aprobare); „automation_mark” ține minte
-- ce s-a făcut deja o dată (de ex. emailul de sfârșit al zilelor gratuite), ca să nu se repete; „autonomy_snapshot” e scorul
-- zilei, pentru graficul din pagină. Se curăță singure: rulările după 180 de zile, scorurile după 400.
CREATE TABLE IF NOT EXISTS "automation_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation" text NOT NULL,
	"trigger" text NOT NULL,
	"status" text NOT NULL,
	"observed" integer DEFAULT 0 NOT NULL,
	"acted" integer DEFAULT 0 NOT NULL,
	"pending" integer DEFAULT 0 NOT NULL,
	"note" text,
	"details" jsonb,
	"actor_id" text REFERENCES "user"("id") ON DELETE set null,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automation_run_idx" ON "automation_run" ("automation","started_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automation_run_at_idx" ON "automation_run" ("started_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automation_mark" (
	"automation" text NOT NULL,
	"ref" text NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "automation_mark_pk" PRIMARY KEY("automation","ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "autonomy_snapshot" (
	"day" date PRIMARY KEY NOT NULL,
	"score" integer NOT NULL,
	"parts" jsonb NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
