import type { Metadata } from "next";
import { db } from "@/db";
import { LOCALES } from "@/i18n/locales";
import { getLocale } from "@/i18n/server";
import { SHOP_CATEGORIES, SHOP_PATH, modelLocales, modelPath, modelText, shopText, type ShopCategory } from "./invitatii-nunta";
import { categoryText } from "./magazin-texte";
import { publishedModel, publishedModels } from "./invitatii-nunta-produse";
import { shopOpen } from "./invitatii-nunta-server";
import { publicPageMetadata } from "./page-metadata";

/** Titlul și descrierea listei de modele; cu rubrica oprită din Admin sau fără niciun model publicat, pagina iese din Google (noindex). */
export async function hubMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = shopText(locale);
  const meta = publicPageMetadata({ path: SHOP_PATH, title: `${t.hubMetaTitle} | Cartea Neamului`, description: t.hubMetaDescription, locale });
  const visible = (await shopOpen(db)) && (await publishedModels(db)).length > 0;
  return visible ? meta : { ...meta, robots: { index: false, follow: true } };
}

/** Titlul, descrierea, poza de previzualizare și hreflang-ul (doar limbile în care e scris) ale unui model publicat. */
export async function modelMetadata(slug: string): Promise<Metadata> {
  const model = await publishedModel(db, slug);
  if (!model) return {};
  const locale = await getLocale();
  const tm = modelText(model, locale) ?? modelText(model, "ro");
  if (!tm) return {};
  const img = model.images[0];
  const meta = publicPageMetadata({
    path: modelPath(model), title: `${tm.metaTitle} | Cartea Neamului`, description: tm.metaDescription, locale,
    locales: modelLocales(model, LOCALES), ...(img ? { image: { url: img.src, alt: tm.title } } : {}),
  });
  return (await shopOpen(db)) ? meta : { ...meta, robots: { index: false, follow: true } };
}

/**
 * Accesorii nuntă și jurnale de familie (28.11.2026): titlul și descrierea listei categoriei; oprită din Admin sau fără niciun
 * produs publicat, pagina iese din Google (noindex).
 */
export async function categoryHubMetadata(category: Exclude<ShopCategory, "invitatie">): Promise<Metadata> {
  const locale = await getLocale();
  const t = categoryText(category, locale);
  const path = SHOP_CATEGORIES[category].path;
  const meta = publicPageMetadata({ path, title: `${t.hubMetaTitle} | Cartea Neamului`, description: t.hubMetaDescription, locale });
  const visible = (await shopOpen(db, category)) && (await publishedModels(db, category)).length > 0;
  return visible ? meta : { ...meta, robots: { index: false, follow: true } };
}

/** Titlul, descrierea, poza și hreflang-ul unui produs publicat din categoriile noi. */
export async function categoryProductMetadata(category: Exclude<ShopCategory, "invitatie">, slug: string): Promise<Metadata> {
  const model = await publishedModel(db, slug, category);
  if (!model) return {};
  const locale = await getLocale();
  const tm = modelText(model, locale) ?? modelText(model, "ro");
  if (!tm) return {};
  const img = model.images[0];
  const meta = publicPageMetadata({
    path: modelPath(model), title: `${tm.metaTitle} | Cartea Neamului`, description: tm.metaDescription, locale,
    locales: modelLocales(model, LOCALES), ...(img ? { image: { url: img.src, alt: tm.title } } : {}),
  });
  return (await shopOpen(db, category)) ? meta : { ...meta, robots: { index: false, follow: true } };
}
