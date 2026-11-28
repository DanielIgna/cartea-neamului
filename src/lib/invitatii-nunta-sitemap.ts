import type { Db } from "@/db";
import { LOCALES, localizedPath, withRegionalHreflang } from "@/i18n/locales";
import type { SitemapUrl } from "@/lib/continut/sitemap";
import { CATEGORY_KEYS, modelLocales, modelPath, type ShopModel } from "./invitatii-nunta";
import { publishedModels } from "./invitatii-nunta-produse";
import { shopOpen } from "./invitatii-nunta-server";

/**
 * Modelele de invitații publicate, pentru sitemap: câte o adresă pe fiecare limbă în care e scris modelul (cu hreflang și
 * româna ca „x-default”), cu data ultimei schimbări din Admin și pozele lui. Un model retras sau o rubrică oprită nu intră.
 */
export function shopSitemapUrls(models: ShopModel[]): SitemapUrl[] {
  return models.flatMap((m) => {
    const path = modelPath(m);
    const locales = modelLocales(m, LOCALES);
    const alternates = withRegionalHreflang({ ...Object.fromEntries(locales.map((l) => [l, localizedPath(path, l)])), "x-default": path });
    const images = m.images.map((i) => i.src);
    return locales.map((l): SitemapUrl => ({
      path: localizedPath(path, l), lastModified: m.updatedAt, changeFrequency: "monthly", priority: l === "ro" ? 0.6 : 0.5,
      ...(locales.length > 1 ? { alternates } : {}), ...(images.length ? { images } : {}),
    }));
  });
}

/**
 * Pentru rutele sitemap-ului: adresele produselor publicate din toate categoriile (invitații, accesorii nuntă, jurnale), fără
 * categoriile oprite din Admin; nimic dacă baza nu se poate citi.
 */
export async function shopSitemap(db: Db): Promise<SitemapUrl[]> {
  const out: SitemapUrl[] = [];
  for (const c of CATEGORY_KEYS) {
    if (await shopOpen(db, c)) out.push(...shopSitemapUrls(await publishedModels(db, c)));
  }
  return out;
}
