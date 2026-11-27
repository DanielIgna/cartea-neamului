import type { Metadata } from "next";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopHub } from "@/components/InvitatiiNunta";
import { SHOP_PATH, shopText } from "@/lib/invitatii-nunta";
import { shopOpen } from "@/lib/invitatii-nunta-server";
import { publicPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

/** Titlul și descrierea listei de modele; cu rubrica oprită din Admin, pagina iese din Google (noindex). */
export async function hubMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = shopText(locale);
  const meta = publicPageMetadata({ path: SHOP_PATH, title: `${t.hubMetaTitle} | Cartea Neamului`, description: t.hubMetaDescription, locale });
  return (await shopOpen(db)) ? meta : { ...meta, robots: { index: false, follow: true } };
}
export const generateMetadata = hubMetadata;

/** „Invitații de nuntă”: lista modelelor pe regiuni (Daniel, 27.11.2026). */
export default async function InvitatiiNuntaPage() {
  return <ShopHub locale={await getLocale()} open={await shopOpen(db)} />;
}
