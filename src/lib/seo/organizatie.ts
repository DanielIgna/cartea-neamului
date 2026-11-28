import { SITE_URL } from "@/lib/site-url";
import { versionEntries } from "@/lib/seo/versiuni";

/**
 * Autorul și editorul paginilor publice în datele pentru Google (JSON-LD): organizația „Cartea Neamului”, aceeași entitate ca
 * pe prima pagină (@id …/#organization). Daniel (18.11.2026): autorul e „echipa Cartea Neamului”, fără nume de persoană,
 * telefon sau adresă.
 */
export const ORG = {
  "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Cartea Neamului", url: SITE_URL,
  logo: { "@type": "ImageObject", "@id": `${SITE_URL}/#logo`, url: `${SITE_URL}/sigla/cartea-neamului-logo.png`, contentUrl: `${SITE_URL}/sigla/cartea-neamului-logo.png`, width: 512, height: 512, caption: "Cartea Neamului" },
} as const;

/** Sigla pătrată de 512×512 (aceeași imagine pe care o folosește Daniel ca poză de profil în alte locuri) și varianta vectorială. */
export const LOGO_PNG = "/sigla/cartea-neamului-logo.png";
export const LOGO_SVG = "/icon.svg";

/**
 * Organizația completă de pe prima pagină (Daniel, 28.11.2026): numele „Cartea Neamului”, adresa site-ului, sigla PNG 512×512
 * și sigla SVG, ca Google să lege imaginea siglei de nume și în căutarea de imagini. Aceeași entitate (@id) ca ORG.
 */
export function orgFull(sameAs: string[]) {
  return {
    ...ORG,
    alternateName: "carteaneamului.ro",
    image: [ORG.logo, { "@type": "ImageObject", url: `${SITE_URL}${LOGO_SVG}`, contentUrl: `${SITE_URL}${LOGO_SVG}`, encodingFormat: "image/svg+xml", caption: "Cartea Neamului" }],
    sameAs,
  };
}
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
