-- Plățile primite prin Stripe: anul în Cartea Neamului sau cartea PDF a unui arbore. Rândul e scris de confirmarea
-- trimisă de Stripe (webhook); id-ul sesiunii de plată e cheia, ca aceeași confirmare primită de două ori să nu prelungească anul de două ori.
CREATE TABLE IF NOT EXISTS "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"kind" text NOT NULL,
	"tree_id" uuid REFERENCES "public"."tree"("id") ON DELETE set null,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_user_idx" ON "payment" USING btree ("user_id","kind");
