-- Anunțurile închise cu „Am înțeles”, ținute pe cont (Daniel, 27.11.2026): banda „Nou: Păstrarea” nu mai apare la fiecare intrare.
-- `at` = ultima închidere; `times` = de câte ori a închis-o. Vezi src/lib/anunt-pastrare.ts.
CREATE TABLE IF NOT EXISTS "notice_dismissal" ("user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "notice" text NOT NULL, "at" timestamp DEFAULT now() NOT NULL, "times" integer DEFAULT 1 NOT NULL, CONSTRAINT "notice_dismissal_pk" PRIMARY KEY("user_id","notice"));
