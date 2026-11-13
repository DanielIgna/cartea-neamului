import { SITE_URL } from "@/lib/site-url";
import { canonicalUrl } from "@/lib/page-metadata";

/** Pagina „Cadou de sărbători” (Daniel, 2026-11-13): anul Basic dăruit, cu banda de pe prima pagină până la Bobotează. */
export const GIFT_PATH = "/cadou-de-sarbatori";

/**
 * Sezonul darurilor, după ora României: din 1 noiembrie până pe 6 ianuarie inclusiv. Atunci se vede banda de pe prima pagină
 * și legătura din subsol; pagina rămâne deschisă tot anul (Google o găsește din timp pentru sărbătorile următoare).
 */
export function giftSeason(now = new Date()): boolean {
  const [m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", month: "numeric", day: "numeric" })
    .formatToParts(now).filter((p) => p.type === "month" || p.type === "day").map((p) => Number(p.value));
  return m === 11 || m === 12 || (m === 1 && d <= 6);
}

export const FAQ_KEYS = [1, 2, 3, 4] as const;

/** Datele structurate ale paginii: WebPage, firul de navigare (Prima pagină › Cadou) și întrebările frecvente (FAQPage). */
export function giftJsonLd(o: { title: string; description: string; home: string; crumb: string; faq: { q: string; a: string }[]; lang: string }) {
  const url = canonicalUrl(GIFT_PATH);
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${url}#page`, url, name: o.title, description: o.description, inLanguage: o.lang,
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL }, breadcrumb: { "@id": `${url}#crumbs` } },
      { "@type": "BreadcrumbList", "@id": `${url}#crumbs`, itemListElement: [
        { "@type": "ListItem", position: 1, name: o.home, item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: o.crumb, item: url },
      ] },
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: o.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
}
