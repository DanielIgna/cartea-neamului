-- Repară o singură dată diacriticele din rândurile scrise înainte de 0015 (aceeași regulă: cn_fix_ro).
-- Schimbă doar câmpurile care diferă; rulată din nou nu mai găsește nimic. Verificare: npm run db:diacritice (dry-run) arată 0.
UPDATE "person" SET "given_name" = cn_fix_ro("given_name"), "surname" = cn_fix_ro("surname"), "birth_surname" = cn_fix_ro("birth_surname"), "birth_date_text" = cn_fix_ro("birth_date_text"), "birth_place" = cn_fix_ro("birth_place"), "death_date_text" = cn_fix_ro("death_date_text"), "death_place" = cn_fix_ro("death_place"), "residence_place" = cn_fix_ro("residence_place"), "biography" = cn_fix_ro("biography"), "notes" = cn_fix_ro("notes"), "occupation" = cn_fix_ro("occupation") WHERE "given_name" IS DISTINCT FROM cn_fix_ro("given_name") OR "surname" IS DISTINCT FROM cn_fix_ro("surname") OR "birth_surname" IS DISTINCT FROM cn_fix_ro("birth_surname") OR "birth_date_text" IS DISTINCT FROM cn_fix_ro("birth_date_text") OR "birth_place" IS DISTINCT FROM cn_fix_ro("birth_place") OR "death_date_text" IS DISTINCT FROM cn_fix_ro("death_date_text") OR "death_place" IS DISTINCT FROM cn_fix_ro("death_place") OR "residence_place" IS DISTINCT FROM cn_fix_ro("residence_place") OR "biography" IS DISTINCT FROM cn_fix_ro("biography") OR "notes" IS DISTINCT FROM cn_fix_ro("notes") OR "occupation" IS DISTINCT FROM cn_fix_ro("occupation");
--> statement-breakpoint
UPDATE "memory" SET "question" = cn_fix_ro("question"), "title" = cn_fix_ro("title"), "body" = cn_fix_ro("body"), "when_text" = cn_fix_ro("when_text"), "place" = cn_fix_ro("place") WHERE "question" IS DISTINCT FROM cn_fix_ro("question") OR "title" IS DISTINCT FROM cn_fix_ro("title") OR "body" IS DISTINCT FROM cn_fix_ro("body") OR "when_text" IS DISTINCT FROM cn_fix_ro("when_text") OR "place" IS DISTINCT FROM cn_fix_ro("place");
--> statement-breakpoint
UPDATE "memory_reply" SET "body" = cn_fix_ro("body") WHERE "body" IS DISTINCT FROM cn_fix_ro("body");
--> statement-breakpoint
UPDATE "memory_question" SET "text" = cn_fix_ro("text") WHERE "text" IS DISTINCT FROM cn_fix_ro("text");
--> statement-breakpoint
UPDATE "tree" SET "name" = cn_fix_ro("name"), "region" = cn_fix_ro("region") WHERE "name" IS DISTINCT FROM cn_fix_ro("name") OR "region" IS DISTINCT FROM cn_fix_ro("region");
--> statement-breakpoint
UPDATE "document" SET "title" = cn_fix_ro("title"), "transcription" = cn_fix_ro("transcription"), "description" = cn_fix_ro("description"), "date_text" = cn_fix_ro("date_text"), "place" = cn_fix_ro("place") WHERE "title" IS DISTINCT FROM cn_fix_ro("title") OR "transcription" IS DISTINCT FROM cn_fix_ro("transcription") OR "description" IS DISTINCT FROM cn_fix_ro("description") OR "date_text" IS DISTINCT FROM cn_fix_ro("date_text") OR "place" IS DISTINCT FROM cn_fix_ro("place");
--> statement-breakpoint
UPDATE "place_pin" SET "name" = cn_fix_ro("name"), "detail" = cn_fix_ro("detail") WHERE "name" IS DISTINCT FROM cn_fix_ro("name") OR "detail" IS DISTINCT FROM cn_fix_ro("detail");
--> statement-breakpoint
UPDATE "message" SET "body" = cn_fix_ro("body") WHERE "body" IS DISTINCT FROM cn_fix_ro("body");
--> statement-breakpoint
UPDATE "old_house" SET "place" = cn_fix_ro("place"), "built_by" = cn_fix_ro("built_by"), "story" = cn_fix_ro("story") WHERE "place" IS DISTINCT FROM cn_fix_ro("place") OR "built_by" IS DISTINCT FROM cn_fix_ro("built_by") OR "story" IS DISTINCT FROM cn_fix_ro("story");
--> statement-breakpoint
UPDATE "user" SET "name" = cn_fix_ro("name") WHERE "name" IS DISTINCT FROM cn_fix_ro("name");
