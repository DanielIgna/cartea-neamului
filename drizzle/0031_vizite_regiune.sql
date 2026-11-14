-- Țările și zonele vizitatorilor (Daniel, 2026-11-14, Admin → Analiză → Țări și zone). Vercel spune, pentru fiecare cerere, țara,
-- regiunea (la noi, județul: „CJ”, „B”) și orașul aproximativ, după IP. Păstrăm doar aceste nume, IP-ul nu se păstrează niciodată.
ALTER TABLE "page_view" ADD COLUMN IF NOT EXISTS "region" text;
--> statement-breakpoint
ALTER TABLE "page_view" ADD COLUMN IF NOT EXISTS "city" text;
