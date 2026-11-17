-- Școlile (Daniel, 2026-11-17), vezi src/lib/scoli.ts: cererile de coduri de pe /scoala, școlile, codurile de reducere Stripe
-- pe școală sau clasă, conturile făcute cu linkul codului și plățile făcute cu el (Admin → Școli).
CREATE TABLE IF NOT EXISTS "school" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"locality" text NOT NULL,
	"county" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"request_id" uuid,
	"class_label" text,
	"code" text NOT NULL,
	"percent" integer NOT NULL,
	"max_uses" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"stripe_promo_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "school_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_payment" (
	"payment_id" text PRIMARY KEY NOT NULL,
	"code_id" uuid NOT NULL,
	"user_id" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school" text NOT NULL,
	"locality" text NOT NULL,
	"county" text,
	"class_label" text NOT NULL,
	"students" integer NOT NULL,
	"teacher" text,
	"email" text NOT NULL,
	"phone" text,
	"message" text,
	"status" text DEFAULT 'nou' NOT NULL,
	"school_id" uuid,
	"decided_by" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_signup" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_code" ADD CONSTRAINT "school_code_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_code" ADD CONSTRAINT "school_code_request_id_school_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."school_request"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_code" ADD CONSTRAINT "school_code_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_payment" ADD CONSTRAINT "school_payment_code_id_school_code_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."school_code"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_payment" ADD CONSTRAINT "school_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_request" ADD CONSTRAINT "school_request_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_signup" ADD CONSTRAINT "school_signup_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_signup" ADD CONSTRAINT "school_signup_code_id_school_code_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."school_code"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "school_name_locality_idx" ON "school" USING btree ("name","locality");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_request_status_idx" ON "school_request" USING btree ("status","created_at");
