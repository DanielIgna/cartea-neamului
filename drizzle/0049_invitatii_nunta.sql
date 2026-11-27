-- Invitații de nuntă (Daniel, 27.11.2026): comenzile plătite fără cont, separat de „payment”. Tabel nou; nimic din ce există
-- (plăți, abonamente, cartea PDF, cadouri) nu se schimbă.
CREATE TABLE IF NOT EXISTS "shop_order" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "slug" text NOT NULL,
  "locale" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "emails_sent" integer DEFAULT 0 NOT NULL,
  "last_email_at" timestamp,
  "downloads" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shop_order_token_idx" ON "shop_order" ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shop_order_created_idx" ON "shop_order" ("created_at");
