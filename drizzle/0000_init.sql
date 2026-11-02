CREATE TYPE "public"."document_kind" AS ENUM('act', 'photo', 'audio', 'letter', 'other');--> statement-breakpoint
CREATE TYPE "public"."export_status" AS ENUM('draft', 'paid', 'rendering', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'editor', 'contributor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."privacy_level" AS ENUM('private_tree', 'claimed', 'public_memorial');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('parent_child', 'partnership');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('M', 'F', 'U');--> statement-breakpoint
CREATE TYPE "public"."tree_visibility" AS ENUM('private', 'family');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid,
	"actor_id" text,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"diff" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_export" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"ordered_by" text,
	"center_person_id" uuid,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "export_status" DEFAULT 'draft' NOT NULL,
	"pdf_key" text,
	"payment_id" text,
	"price_bani" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"text_version" text NOT NULL,
	"granted" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"title" text NOT NULL,
	"file_key" text,
	"mime_type" text,
	"transcription" text,
	"date_text" text,
	"place" text,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_link" (
	"document_id" uuid NOT NULL,
	"person_id" uuid,
	"relationship_id" uuid,
	"role" text DEFAULT 'subject' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"role" "member_role" DEFAULT 'contributor' NOT NULL,
	"person_id" uuid,
	"created_by" text,
	"expires_at" timestamp NOT NULL,
	"accepted_by" text,
	"accepted_at" timestamp,
	CONSTRAINT "invitation_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"given_name" text DEFAULT '' NOT NULL,
	"surname" text DEFAULT '' NOT NULL,
	"birth_surname" text,
	"sex" "sex" DEFAULT 'U' NOT NULL,
	"birth_date_text" text,
	"birth_from" date,
	"birth_to" date,
	"birth_place" text,
	"death_date_text" text,
	"death_from" date,
	"death_to" date,
	"death_place" text,
	"living" boolean DEFAULT false NOT NULL,
	"biography" text,
	"occupation" text,
	"claimed_by_user_id" text,
	"privacy" "privacy_level" DEFAULT 'private_tree' NOT NULL,
	"gedcom_xref" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"type" "relationship_type" NOT NULL,
	"person_a" uuid NOT NULL,
	"person_b" uuid NOT NULL,
	"subtype" text,
	"start_text" text,
	"end_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" text,
	"visibility" "tree_visibility" DEFAULT 'private' NOT NULL,
	"region" text,
	"root_person_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_member" (
	"tree_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'contributor' NOT NULL,
	"invited_by" text,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"locale" text DEFAULT 'ro' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_export" ADD CONSTRAINT "book_export_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_export" ADD CONSTRAINT "book_export_ordered_by_user_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_export" ADD CONSTRAINT "book_export_center_person_id_person_id_fk" FOREIGN KEY ("center_person_id") REFERENCES "public"."person"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_link" ADD CONSTRAINT "document_link_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_link" ADD CONSTRAINT "document_link_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_link" ADD CONSTRAINT "document_link_relationship_id_relationship_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationship"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_claimed_by_user_id_user_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_person_a_person_id_fk" FOREIGN KEY ("person_a") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_person_b_person_id_fk" FOREIGN KEY ("person_b") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_member" ADD CONSTRAINT "tree_member_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_member" ADD CONSTRAINT "tree_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_member" ADD CONSTRAINT "tree_member_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_tree_idx" ON "audit_log" USING btree ("tree_id","created_at");--> statement-breakpoint
CREATE INDEX "doclink_person_idx" ON "document_link" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_tree_idx" ON "person" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "person_name_idx" ON "person" USING btree ("surname","given_name");--> statement-breakpoint
CREATE INDEX "rel_child_idx" ON "relationship" USING btree ("type","person_b");--> statement-breakpoint
CREATE INDEX "rel_parent_idx" ON "relationship" USING btree ("type","person_a");--> statement-breakpoint
CREATE UNIQUE INDEX "rel_unique" ON "relationship" USING btree ("type","person_a","person_b");--> statement-breakpoint
CREATE UNIQUE INDEX "tree_member_pk" ON "tree_member" USING btree ("tree_id","user_id");