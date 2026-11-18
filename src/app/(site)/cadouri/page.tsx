import type { Metadata } from "next";
import { GiftHub } from "@/components/cadouri/GiftPages";
import { GIFTS_DESCRIPTION, GIFTS_HUB, GIFTS_TITLE } from "@/lib/cadouri";
import { publicPageMetadata } from "@/lib/page-metadata";

// Prețurile vin din Admin; pagina se reface din 10 în 10 minute, iar ordinea pe sezoane se schimbă singură.
export const revalidate = 600;
export const metadata: Metadata = publicPageMetadata({ path: GIFTS_HUB, title: GIFTS_TITLE, description: GIFTS_DESCRIPTION });

/** /cadouri: hubul darurilor, cu ocaziile din sezon primele (acum, Crăciunul). */
export default function GiftsHub() {
  return <GiftHub />;
}
