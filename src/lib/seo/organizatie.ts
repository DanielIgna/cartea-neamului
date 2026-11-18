import { SITE_URL } from "@/lib/site-url";
import { versionEntries } from "@/lib/seo/versiuni";

/**
 * Autorul și editorul paginilor publice în datele pentru Google (JSON-LD): organizația „Cartea Neamului”, aceeași entitate ca
 * pe prima pagină (@id …/#organization). Daniel (18.11.2026): autorul e „echipa Cartea Neamului”, fără nume de persoană,
 * telefon sau adresă.
 */
export const ORG = {
  "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Cartea Neamului", url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512 },
} as const;
/** Semnătura vizibilă a ghidurilor. */
export const BYLINE = "echipa Cartea Neamului";

/**
 * Poza de previzualizare a unei pagini publice (Open Graph): /api/card?pagina=<adresa>&v=<amprentă>, desenată din titlul și
 * descrierea paginii. `v` se schimbă doar când se schimbă pagina, deci poza poate sta mult în cache. Doar paginile din sitemap
 * (și nu cele în ebraică, pe care fontul cardului nu le are); restul păstrează poza comună.
 */
export function pageCardUrl(path: string): string | null {
  const v = versionEntries()[path];
  if (!v || path === "/" || /^\/he(\/|$)/.test(path)) return null;
  // Paginile principale traduse (/en/contact) au titlul din meniu, nu un titlu de pagină: rămân cu poza comună.
  if (/^\/(en|en-us|fr|es|nl|de|it|hu)(\/|$)/.test(path) && !/^\/[a-z-]+\/diaspora(\/|$)/.test(path)) return null;
  return `/api/card?pagina=${encodeURIComponent(path)}&v=${v.split(" ")[0]}`;
}
