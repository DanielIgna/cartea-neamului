-- Diacriticele românești scrise într-un singur fel: „ǎ/Ǎ” (U+01CE/U+01CD) devin „ă/Ă”, „ş/Ş/ţ/Ţ” cu sedilă devin „ș/Ș/ț/Ț” cu virgulă,
-- iar textul e adus la forma NFC. La fiecare salvare, pe server (declanșatoare), pentru nume, locuri și texte.
-- Rândurile deja scrise NU se schimbă aici: pentru ele e scripts/diacritice.ts (întâi --dry-run, apoi --apply).
CREATE OR REPLACE FUNCTION cn_fix_ro(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL THEN NULL ELSE translate(normalize(t, NFC), 'ǎǍşŞţŢ', 'ăĂșȘțȚ') END
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_person() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."given_name" := cn_fix_ro(NEW."given_name");
  NEW."surname" := cn_fix_ro(NEW."surname");
  NEW."birth_surname" := cn_fix_ro(NEW."birth_surname");
  NEW."birth_date_text" := cn_fix_ro(NEW."birth_date_text");
  NEW."birth_place" := cn_fix_ro(NEW."birth_place");
  NEW."death_date_text" := cn_fix_ro(NEW."death_date_text");
  NEW."death_place" := cn_fix_ro(NEW."death_place");
  NEW."residence_place" := cn_fix_ro(NEW."residence_place");
  NEW."biography" := cn_fix_ro(NEW."biography");
  NEW."notes" := cn_fix_ro(NEW."notes");
  NEW."occupation" := cn_fix_ro(NEW."occupation");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_person ON "person";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_person BEFORE INSERT OR UPDATE ON "person" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_person();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_memory() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."question" := cn_fix_ro(NEW."question");
  NEW."title" := cn_fix_ro(NEW."title");
  NEW."body" := cn_fix_ro(NEW."body");
  NEW."when_text" := cn_fix_ro(NEW."when_text");
  NEW."place" := cn_fix_ro(NEW."place");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_memory ON "memory";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_memory BEFORE INSERT OR UPDATE ON "memory" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_memory();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_memory_reply() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."body" := cn_fix_ro(NEW."body");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_memory_reply ON "memory_reply";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_memory_reply BEFORE INSERT OR UPDATE ON "memory_reply" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_memory_reply();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_memory_question() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."text" := cn_fix_ro(NEW."text");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_memory_question ON "memory_question";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_memory_question BEFORE INSERT OR UPDATE ON "memory_question" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_memory_question();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_tree() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."name" := cn_fix_ro(NEW."name");
  NEW."region" := cn_fix_ro(NEW."region");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_tree ON "tree";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_tree BEFORE INSERT OR UPDATE ON "tree" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_tree();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_document() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."title" := cn_fix_ro(NEW."title");
  NEW."transcription" := cn_fix_ro(NEW."transcription");
  NEW."description" := cn_fix_ro(NEW."description");
  NEW."date_text" := cn_fix_ro(NEW."date_text");
  NEW."place" := cn_fix_ro(NEW."place");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_document ON "document";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_document BEFORE INSERT OR UPDATE ON "document" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_document();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_place_pin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."name" := cn_fix_ro(NEW."name");
  NEW."detail" := cn_fix_ro(NEW."detail");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_place_pin ON "place_pin";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_place_pin BEFORE INSERT OR UPDATE ON "place_pin" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_place_pin();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_message() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."body" := cn_fix_ro(NEW."body");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_message ON "message";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_message BEFORE INSERT OR UPDATE ON "message" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_message();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_old_house() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."place" := cn_fix_ro(NEW."place");
  NEW."built_by" := cn_fix_ro(NEW."built_by");
  NEW."story" := cn_fix_ro(NEW."story");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_old_house ON "old_house";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_old_house BEFORE INSERT OR UPDATE ON "old_house" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_old_house();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cn_fix_ro_user() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."name" := cn_fix_ro(NEW."name");
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS cn_fix_ro_user ON "user";
--> statement-breakpoint
CREATE TRIGGER cn_fix_ro_user BEFORE INSERT OR UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION cn_fix_ro_user();
