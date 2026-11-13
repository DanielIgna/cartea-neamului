-- „Vreau un test ADN”: cererile de informații (fără date genetice) și laboratoarele din lista informativă, puse din Admin.
CREATE TABLE IF NOT EXISTS "dna_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text NOT NULL,
	"message" text NOT NULL,
	"locale" text,
	"consent_at" timestamp NOT NULL,
	"consent_version" text NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dna_lab" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"url" text NOT NULL,
	"price_note" text,
	"position" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "dna_lab" ("name", "city", "url", "price_note", "position")
SELECT 'CromoGenetic', NULL, 'https://cromogenetic.ro/product/test-de-origine-ancestrala', '1.320 lei (preț afișat de laborator, se poate schimba)', 1
WHERE NOT EXISTS (SELECT 1 FROM "dna_lab" WHERE "url" = 'https://cromogenetic.ro/product/test-de-origine-ancestrala');
--> statement-breakpoint
INSERT INTO "dna_lab" ("name", "city", "url", "price_note", "position")
SELECT 'International Biosciences România', NULL, 'https://www.ibdna.ro/tests/test-adn-ancestral-origins/', 'de la 1.390 lei (preț afișat de laborator, se poate schimba)', 2
WHERE NOT EXISTS (SELECT 1 FROM "dna_lab" WHERE "url" = 'https://www.ibdna.ro/tests/test-adn-ancestral-origins/');
