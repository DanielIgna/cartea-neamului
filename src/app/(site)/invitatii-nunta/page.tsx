import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopHub } from "@/components/InvitatiiNunta";
import { shopOpen } from "@/lib/invitatii-nunta-server";
import { hubMetadata } from "@/lib/invitatii-nunta-meta";

export const dynamic = "force-dynamic";
export const generateMetadata = hubMetadata;

/** „Invitații de nuntă”: lista modelelor pe regiuni (Daniel, 27.11.2026). */
export default async function InvitatiiNuntaPage() {
  return <ShopHub locale={await getLocale()} open={await shopOpen(db)} />;
}
