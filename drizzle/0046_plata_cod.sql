-- Codul de reducere al fiecărei plăți (Daniel, 24.11.2026): raportul de luni deosebește plățile de test (TEST90, modul de test
-- Stripe) de cele reale (NEAM90 e o plată reală) după cod, nu după dată. Plățile vechi rămân cu NULL și se completează din Stripe.
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "promo" text;
