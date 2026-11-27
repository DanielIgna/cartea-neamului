-- Invitații de nuntă (Daniel, 27.11.2026): emailul scris de cumpărător pe pagină și invitația dăruită. `email` rămâne adresa unde
-- pleacă linkul (destinatarul, la un cadou); `buyer_email` e cel care a plătit; numele și mesajul cadoului intră în email.
ALTER TABLE "shop_order" ADD COLUMN IF NOT EXISTS "buyer_email" text;--> statement-breakpoint
ALTER TABLE "shop_order" ADD COLUMN IF NOT EXISTS "gift_to_name" text;--> statement-breakpoint
ALTER TABLE "shop_order" ADD COLUMN IF NOT EXISTS "gift_from" text;--> statement-breakpoint
ALTER TABLE "shop_order" ADD COLUMN IF NOT EXISTS "gift_note" text;
