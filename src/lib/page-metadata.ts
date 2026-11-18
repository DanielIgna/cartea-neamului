import type { Metadata } from "next";
import { LOCALES, localizedPath, type Locale } from "@/i18n/locales";
import { staticLocaleNow } from "@/i18n/static-locale";
import { TRANSLATED_PAGES } from "@/lib/public-pages";
import { SITE_URL } from "@/lib/site-url";
import { pageCardUrl } from "@/lib/seo/organizatie";

/** Adresa canonică a unei pagini publice, cu domeniul principal (fără www): `/` → https://carteaneamului.ro/. */
export const canonicalUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

/**
 * Titlul, descrierea, adresa canonică și previzualizarea linkului (Open Graph și Twitter) pentru o pagină publică, toate
 * la fel: ce trimite cineva pe WhatsApp sau Facebook arată exact pagina trimisă, nu prima pagină. Poza: cardul paginii
 * (/api/card, din 18.11.2026) pentru paginile din sitemap, altfel cea comună (app/opengraph-image.png), pusă aici de mână:
 * o pagină cu openGraph propriu n-o mai moștenește singură.
 */
const OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Cartea Neamului: arborele familiei, construit împreună" };

/**
 * Titlul pentru Google: cele peste ~60 de semne sunt tăiate în rezultate (auditul din 14.11.2026 a găsit 405 așa). Dacă titlul
 * cu „| Cartea Neamului” trece de 60, numele site-ului se lasă deoparte (Google îl arată oricum lângă adresă), la fel și în
 * previzualizarea linkurilor, unde apare deja „siteName”.
 */
export const TITLE_SUFFIX = " | Cartea Neamului";
export const fitTitle = (title: string) => (title.length > 60 && title.endsWith(TITLE_SUFFIX) ? title.slice(0, -TITLE_SUFFIX.length) : title);

/** Limba din Open Graph („it_IT”) a fiecărei limbi a site-ului. */
export const OG_LOCALE: Record<Locale, string> = {
  ro: "ro_RO", "en-GB": "en_GB", "en-US": "en_US", fr: "fr_FR", es: "es_ES", nl: "nl_NL", de: "de_DE", it: "it_IT", hu: "hu_HU", he: "he_IL",
};

/** Paginile traduse în toate limbile (au adresă pe fiecare limbă); ghidurile, glosarul, numele și localitățile sunt încă doar în română. */
const TRANSLATED = new Set(TRANSLATED_PAGES.map((p) => p.path));
export const isTranslatedPath = (path: string) => TRANSLATED.has(path);

/**
 * Adresa canonică și legăturile hreflang ale unei pagini în limba dată (Daniel, 2026-11-14): fiecare limbă are adresa ei
 * (/it/contact), româna e fără prefix și e și „x-default”. O pagină netradusă, deschisă în altă limbă, trimite la adresa
 * românească și nu intră în Google (`noindex`), ca să nu fie aceeași pagină de două ori.
 */
export function languageAlternates(path: string, locale: Locale): Pick<Metadata, "alternates" | "robots"> & { url: string } {
  if (!isTranslatedPath(path)) {
    const url = canonicalUrl(path);
    return locale === "ro" ? { url, alternates: { canonical: url } } : { url, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }
  const url = canonicalUrl(localizedPath(path, locale));
  const languages: Record<string, string> = Object.fromEntries(LOCALES.map((l) => [l, canonicalUrl(localizedPath(path, l))]));
  languages["x-default"] = canonicalUrl(path);
  return { url, alternates: { canonical: url, languages } };
}

/**
 * `locale`: limba paginii când nu e o pagină pregătită dinainte (de pildă /it/contact?src=fb, randată pe loc); fără ea,
 * pagina randată pe loc ar primi adresa canonică românească, deși textul e în italiană.
 */
export function publicPageMetadata({ path, title: full, description, image, locale: asked }: { path: string; title: string; description: string; image?: { url: string; alt: string }; locale?: Locale }): Metadata {
  const locale = staticLocaleNow() ?? asked ?? "ro";
  const { url, ...lang } = languageAlternates(path, locale);
  const title = fitTitle(full);
  // O pagină cu cardul ei (nume, localitate) îl arată în previzualizarea linkului, în locul pozei comune.
  // Celelalte pagini din sitemap au cardul lor, desenat din titlu și descriere (/api/card?pagina=…); restul, poza comună.
  const card = image ? null : pageCardUrl(new URL(url).pathname.replace(/(.)\/$/, "$1"));
  const img = image ? { ...image, width: 1200, height: 630 } : card ? { url: card, width: 1200, height: 630, alt: title } : OG_IMAGE;
  return {
    title, description,
    ...lang,
    openGraph: { title, description, url, siteName: "Cartea Neamului", locale: OG_LOCALE[locale], type: "website", images: [img] },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  };
}

/** Paginile private (cont, mesaje, admin): nici în Google, nici legăturile din ele urmărite. Pe lângă robots.txt. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };

/** „Acasă” în fiecare limbă, pentru firul de navigare (BreadcrumbList) al paginilor simple. */
const HOME_LABEL: Record<Locale, string> = {
  ro: "Acasă", "en-GB": "Home", "en-US": "Home", fr: "Accueil", es: "Inicio", nl: "Home", de: "Startseite", it: "Home", hu: "Kezdőlap", he: "דף הבית",
};

/**
 * Datele pentru motoarele de căutare (JSON-LD) ale unei pagini simple: WebPage, cu aceeași adresă canonică, același nume și
 * aceeași descriere, plus firul de navigare Acasă → pagina (BreadcrumbList). Limba e cea a paginii (/it/contact → it).
 */
export function webPageJsonLd({ path, title, description, crumb, locale }: { path: string; title: string; description: string; crumb?: string; locale?: Locale }) {
  const loc = locale ?? staticLocaleNow() ?? "ro";
  const own = isTranslatedPath(path) ? localizedPath(path, loc) : path;
  const url = canonicalUrl(own);
  const home = canonicalUrl(isTranslatedPath("/") ? localizedPath("/", loc) : "/");
  const name = crumb ?? fitTitle(title).replace(/ \| .*$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#page`, url, name: title, description, inLanguage: isTranslatedPath(path) ? loc : "ro",
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL }, breadcrumb: { "@id": `${url}#crumbs` },
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#crumbs`, itemListElement: [
          { "@type": "ListItem", position: 1, name: HOME_LABEL[loc], item: home },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };
}
