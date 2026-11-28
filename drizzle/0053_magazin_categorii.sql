-- Magazinul digital, categorii noi (Daniel, 28.11.2026): „Accesorii nuntă” (/accesorii-nunta/<regiune>) și „Jurnale de familie”
-- (/jurnale/<slug>), în același tabel cu invitațiile. Tot ce există primește categoria „invitatie”, deci invitațiile nu se schimbă.
-- Slugul e unic pe categorie (Maramureș poate fi și invitație, și set de accesorii). `parts`: ce conține produsul (meniu, carduri
-- de loc… / varianta pentru bunica, pentru bunic). Comenzile țin minte categoria, ca descărcarea să dea fișierul potrivit.
ALTER TABLE "shop_product" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'invitatie' NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_product" ADD COLUMN IF NOT EXISTS "parts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "shop_product_slug_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shop_product_cat_slug_idx" ON "shop_product" ("category","slug");--> statement-breakpoint
ALTER TABLE "shop_order" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'invitatie' NOT NULL;
