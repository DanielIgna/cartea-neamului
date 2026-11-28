import type { Metadata } from "next";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import Produse from "@/components/Produse";
import { publishedModels } from "@/lib/invitatii-nunta-produse";
import { shopOpen } from "@/lib/invitatii-nunta-server";
import { publicPageMetadata } from "@/lib/page-metadata";
import { publicPlanSettings } from "@/lib/plan-cache";
import { PRODUCTS_PATH, shopPageText } from "@/lib/produse-texte";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = shopPageText(locale);
  return publicPageMetadata({ path: PRODUCTS_PATH, title: `${t.metaTitle} | Cartea Neamului`, description: t.metaDescription, locale });
}

/** „Produse și servicii”: magazinul site-ului (linkul „Magazin” din antet). */
export default async function ProdusePage() {
  const [locale, s, open, openAcc, openJur] = await Promise.all([getLocale(), publicPlanSettings(), shopOpen(db), shopOpen(db, "accesorii"), shopOpen(db, "jurnal")]);
  const [models, accesorii, jurnal] = await Promise.all([
    open ? publishedModels(db) : [], openAcc ? publishedModels(db, "accesorii") : [], openJur ? publishedModels(db, "jurnal") : [],
  ]);
  return <Produse locale={locale} models={models} s={s} more={{ accesorii, jurnal }} />;
}
