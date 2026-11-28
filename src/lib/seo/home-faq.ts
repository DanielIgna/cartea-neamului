import { orgFull } from "@/lib/seo/organizatie";
import type { Locale } from "@/i18n/locales";
import type { PlanSettings } from "@/lib/plans";
import { tierPrice } from "@/lib/plans";
import { money } from "@/lib/plati";
import { SITE_URL } from "@/lib/site-url";
import { LANGUAGE_COUNT, limbiRo, localizedPath } from "@/i18n/locales";
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from "@/lib/contact";

/**
 * Întrebările frecvente de pe prima pagină (Daniel, 18.11.2026, SEO pentru SUA și Canada), în română și engleză: aceleași
 * întrebări se văd pe pagină și intră în datele pentru Google (FAQPage), cum cere Google. Prețurile vin din Admin → Planuri,
 * nu sunt scrise de mână; cât vânzarea e oprită, întrebarea despre preț nu apare. Celelalte limbi nu au încă textul și nu
 * arată secțiunea.
 */
export type Faq = { q: string; a: string };
export type FaqLang = "ro" | "en";
export const faqLang = (l: Locale): FaqLang | null => (l === "ro" ? "ro" : l === "en-GB" || l === "en-US" ? "en" : null);

export const FAQ_TITLE: Record<FaqLang, string> = { ro: "Întrebări frecvente", en: "Frequently asked questions" };

export function homeFaq(locale: Locale, s: PlanSettings): Faq[] {
  const lang = faqLang(locale);
  if (!lang) return [];
  const lei = locale === "ro";
  const price = (t: "basic" | "familie" | "premium") => { const p = tierPrice(t, true, s); return money(lei ? p.lei : p.eur, locale).label; };
  const book = money(lei ? s.bookLei : s.bookEur, locale).label;
  const days = String(s.trialDays);
  if (lang === "ro") {
    return [
      { q: "Ce este Cartea Neamului?", a: "Un loc privat în care îți faci online arborele genealogic împreună cu rudele: nume, date, locuri, poze vechi, povești și glasul bunicilor, înregistrat cu telefonul." },
      { q: "Pot lucra la arbore cu rudele din SUA, Canada sau din altă țară?", a: `Da. Le trimiți un link, de pildă pe WhatsApp, și fiecare folosește site-ul în limba lui: română, engleză și încă ${limbiRo(LANGUAGE_COUNT - 2)}. Toți văd același arbore, iar ce scrie fiecare rămâne în limba în care a scris.` },
      ...(s.on ? [{ q: "Cât costă?", a: `Primele ${days} zile sunt gratuite, fără card. Apoi un an costă ${price("basic")} (Basic), ${price("familie")} (Familie) sau ${price("premium")} (Premium).${s.subs ? ` Familie și Premium se pot plăti și lunar sau la 3 luni. Planul se reînnoiește singur și oprești reînnoirea dintr-un clic, din pagina Plată.` : " Plata nu se reînnoiește singură."}` }] : []),
      { q: "Ce este cartea neamului în PDF?", a: `Din arbore se face o carte în PDF, cu oamenii, pozele și poveștile familiei, pe care o trimiți tuturor rudelor. Lângă povești are coduri QR: scanezi pagina cu telefonul și auzi vocea celui care povestește.${s.on ? ` Se cumpără separat, ${book}.` : ""}` },
      { q: "Cine vede arborele meu?", a: "Doar rudele pe care le inviți. Arborele nu e public și nu apare în Google, iar tu hotărăști cine poate adăuga sau schimba oameni." },
      { q: "Cum păstrez glasul bunicilor?", a: "În Lada cu amintiri înregistrezi cu telefonul povești scurte și le pui la profilul omului. În fiecare duminică apare o întrebare nouă de la care poți porni." },
    ];
  }
  return [
    { q: "What is The Family Book?", a: "A private place where you build your family tree online together with your relatives: names, dates, places, old photos, stories and your grandparents’ voices, recorded on your phone." },
    { q: "Can relatives in Romania and in the US or Canada work on the same tree?", a: `Yes. You send them a link, for example on WhatsApp, and each person uses the site in their own language: English, Romanian and ${LANGUAGE_COUNT - 2} more. Everyone sees the same tree, and what each person writes stays in the language they wrote it in.` },
    ...(s.on ? [{ q: "How much does it cost?", a: `The first ${days} days are free, no credit card required. After that, a year costs ${price("basic")} (Basic), ${price("familie")} (Family) or ${price("premium")} (Premium).${s.subs ? " Family and Premium can also be paid monthly or every 3 months. The plan renews automatically and you can stop the renewal with one click on the Payment page." : " It does not renew automatically."}` }] : []),
    { q: "What is the PDF family book?", a: `Your tree becomes a PDF book with the people, photos and stories of your family, ready to send to every relative. Next to the stories there are QR codes: scan the page with a phone and hear the voice of the person telling the story.${s.on ? ` It is sold separately, for ${book}.` : ""}` },
    { q: "Who can see my family tree?", a: "Only the relatives you invite. Your tree is not public and does not appear in Google, and you decide who can add or change people." },
    { q: "How do I preserve my grandparents’ voices?", a: "In the Memory Chest you record short stories on your phone and keep them on the person’s profile. Every Sunday a new question gives you a place to start." },
  ];
}

/** Codul monedei pentru Google (Offer.priceCurrency): lei pe română, euro în rest (ca pe pagină). */
const currencyOf = (locale: Locale) => (locale === "ro" ? "RON" : "EUR");

/**
 * Datele pentru Google ale primei pagini, în limba paginii (înainte erau doar în română, și pe /en-us): site-ul, organizația,
 * aplicația cu ofertele ei (planurile pe un an și cartea în PDF, din Admin, doar cât vânzarea e pornită) și întrebările
 * frecvente care se văd pe pagină.
 */
export function homeJsonLd(locale: Locale, s: PlanSettings, description: string, faq: Faq[], names: { app: string; tiers: Record<"basic" | "familie" | "premium", string>; book: string }) {
  const home = `${SITE_URL}${localizedPath("/", locale) === "/" ? "/" : localizedPath("/", locale)}`;
  const lei = locale === "ro";
  const cur = currencyOf(locale);
  const offers = s.on ? [
    ...(["basic", "familie", "premium"] as const).map((t) => {
      const p = tierPrice(t, true, s);
      return { "@type": "Offer", name: names.tiers[t], price: String(lei ? p.lei : p.eur), priceCurrency: cur, url: `${home}#preturi`, availability: "https://schema.org/InStock" };
    }),
    { "@type": "Offer", name: names.book, price: String(lei ? s.bookLei : s.bookEur), priceCurrency: cur, url: `${home}#preturi`, availability: "https://schema.org/InStock" },
  ] : undefined;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Cartea Neamului", alternateName: names.app === "Cartea Neamului" ? undefined : names.app, url: SITE_URL, inLanguage: locale, description, publisher: { "@id": `${SITE_URL}/#organization` },
        // Caseta de căutare din rezultatele Google trimite la /cauta (src/lib/continut/cautare.ts).
        potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/cauta?q={search_term_string}` }, "query-input": "required name=search_term_string" } },
      orgFull([FACEBOOK_URL, TIKTOK_URL, INSTAGRAM_URL]),
      {
        "@type": "WebApplication", "@id": `${SITE_URL}/#app`, name: names.app, url: home, description,
        applicationCategory: "LifestyleApplication", operatingSystem: "Web, Android, iOS", browserRequirements: "Requires a modern web browser",
        inLanguage: ["ro", "en-GB", "en-US", "fr", "es", "nl", "de", "it", "hu", "he"], publisher: { "@id": `${SITE_URL}/#organization` },
        ...(offers ? { offers } : {}),
      },
      ...(faq.length ? [{
        "@type": "FAQPage", "@id": `${home}#intrebari`, inLanguage: locale,
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }] : []),
    ],
  };
}
