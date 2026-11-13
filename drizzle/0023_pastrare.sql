-- „Păstrarea” (Daniel, 2026-11-13): după anul plătit, cu 25 lei pe an familia vede și ascultă tot online, fără adăugări noi.
ALTER TABLE "account_plan" ADD COLUMN IF NOT EXISTS "keep_until" timestamp;
