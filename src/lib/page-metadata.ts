import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

/** Adresa canonică a unei pagini publice, cu domeniul principal (fără www): `/` → https://carteaneamului.ro/. */
export const canonicalUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

/**
 * Titlul, descrierea, adresa canonică și previzualizarea linkului (Open Graph și Twitter) pentru o pagină publică, toate
 * la fel: ce trimite cineva pe WhatsApp sau Facebook arată exact pagina trimisă, nu prima pagină. Poza e aceeași peste tot
 * (app/opengraph-image.png), pusă aici de mână: o pagină cu openGraph propriu n-o mai moștenește singură.
 */
const OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Cartea Neamului: arborele familiei, construit împreună" };

/**
 * Titlul pentru Google: cele peste ~60 de semne sunt tăiate în rezultate (auditul din 14.11.2026 a găsit 405 așa). Dacă titlul
 * cu „| Cartea Neamului” trece de 60, numele site-ului se lasă deoparte (Google îl arată oricum lângă adresă), la fel și în
 * previzualizarea linkurilor, unde apare deja „siteName”.
 */
export const TITLE_SUFFIX = " | Cartea Neamului";
export const fitTitle = (title: string) => (title.length > 60 && title.endsWith(TITLE_SUFFIX) ? title.slice(0, -TITLE_SUFFIX.length) : title);

export function publicPageMetadata({ path, title: full, description, image }: { path: string; title: string; description: string; image?: { url: string; alt: string } }): Metadata {
  const url = canonicalUrl(path);
  const title = fitTitle(full);
  // O pagină cu cardul ei (nume, localitate) îl arată în previzualizarea linkului, în locul pozei comune.
  const img = image ? { ...image, width: 1200, height: 630 } : OG_IMAGE;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Cartea Neamului", locale: "ro_RO", type: "website", images: [img] },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  };
}

/** Paginile private (cont, mesaje, admin): nici în Google, nici legăturile din ele urmărite. Pe lângă robots.txt. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };

/** Datele WebPage pentru motoarele de căutare (JSON-LD), cu aceeași adresă canonică, același nume și aceeași descriere. */
export function webPageJsonLd({ path, title, description }: { path: string; title: string; description: string }) {
  return {
    "@context": "https://schema.org", "@type": "WebPage", url: canonicalUrl(path), name: title, description, inLanguage: "ro",
    isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
  };
}
