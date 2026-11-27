import type { Metadata } from "next";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { SHOP_PATH, modelBySlug, modelPath, modelText, shopText } from "./invitatii-nunta";
import { shopOpen } from "./invitatii-nunta-server";
import { publicPageMetadata } from "./page-metadata";

/** Titlul și descrierea listei de modele; cu rubrica oprită din Admin, pagina iese din Google (noindex). */
export async function hubMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = shopText(locale);
  const meta = publicPageMetadata({ path: SHOP_PATH, title: `${t.hubMetaTitle} | Cartea Neamului`, description: t.hubMetaDescription, locale });
  return (await shopOpen(db)) ? meta : { ...meta, robots: { index: false, follow: true } };
}

/** Titlul, descrierea și poza de previzualizare ale unui model. */
export async function modelMetadata(slug: string): Promise<Metadata> {
  const model = modelBySlug(slug);
  if (!model) return {};
  const locale = await getLocale();
  const tm = modelText(model, locale);
  const img = model.images[0];
  const meta = publicPageMetadata({ path: modelPath(model), title: `${tm.metaTitle} | Cartea Neamului`, description: tm.metaDescription, locale, image: { url: img.src, alt: tm.title } });
  return (await shopOpen(db)) ? meta : { ...meta, robots: { index: false, follow: true } };
}
