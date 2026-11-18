import type { Metadata } from "next";
import { db } from "@/db";
import DnaForm from "@/components/DnaForm";
import PageIntl from "@/i18n/PageIntl";
import { getAppName, getLocale, getT } from "@/i18n/server";
import { SOURCES, SOURCE_GROUPS, publicDnaLabs } from "@/lib/resurse";
import { SITE_URL } from "@/lib/site-url";
import { languageAlternates, webPageJsonLd } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";
const PATH = "/resurse-genealogie";
const OG = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Cartea Neamului: arborele familiei, construit împreună" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("Resources");
  const title = `${t("metaTitle")} | ${await getAppName()}`;
  const description = t("metaDescription");
  // Adresa canonică și hreflang pe limba paginii (/it/resurse-genealogie are textul în italiană), ca la celelalte pagini traduse.
  const { url, ...lang } = languageAlternates(PATH, await getLocale());
  return {
    title: { absolute: title }, description, ...lang,
    // Poza pentru linkuri pusă de mână: o pagină cu openGraph propriu nu o moștenește singură (auditul din 14.11.2026).
    openGraph: { title, description, url, type: "website", images: [OG] },
    twitter: { card: "summary_large_image", title, description, images: [OG] },
  };
}

/**
 * „Resurse gratuite pentru genealogie”, deschisă tuturor: legături ieșite spre arhive, biblioteci și baze publice (nu se urcă,
 * nu se preia și nu se salvează nimic de acolo), apoi cererea „Vreau un test ADN” și lista informativă de laboratoare (din Admin).
 * Nu se vinde nimic, nu există afiliere și nu se păstrează date genetice.
 */
export default async function ResursePage() {
  const [t, labs, ta] = await Promise.all([getT("Resources"), publicDnaLabs(db).catch(() => []), getT("Archives")]);
  const out = (href: string, label: string) => <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
  const jsonLd = webPageJsonLd({ path: PATH, title: t("title"), description: t("metaDescription"), locale: await getLocale() });
  return (
    <section className="stack resurse" style={{ maxWidth: 860, margin: "0 auto" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
        {/* Ghidul complet al arhivelor publice e /surse-publice (aceeași listă ca în arbore); aici rămân lista scurtă și testul ADN. */}
        <p><a className="btn" href="/surse-publice">{ta("allSources")} →</a></p>
      </div>
      {SOURCE_GROUPS.map((g) => (
        <div className="card" key={g}>
          <h2 style={{ marginTop: 0 }}>{t(`groups.${g}`)}</h2>
          <ul className="source-list">
            {(SOURCES as readonly (typeof SOURCES)[number][]).filter((s) => s.group === g).map((s) => (
              <li key={s.id}>
                {out(s.url, t(`src.${s.id}.name`))} <span className="muted source-ext">({t("external")})</span>
                <p className="muted">{t(`src.${s.id}.text`)}</p>
              </li>
            ))}
          </ul>
          {g === "dna" && <p><b>{t("dnaNote")}</b></p>}
        </div>
      ))}
      <div className="card" id="test-adn">
        <h2 style={{ marginTop: 0 }}>{t("dnaTitle")}</h2>
        <p className="dna-note">{t("dnaText")}</p>
        <h3>{t("labsTitle")}</h3>
        {labs.length ? (
          <ul className="source-list">
            {labs.map((l) => (
              <li key={l.id}>
                {out(l.url, l.name)}{l.city ? ` · ${l.city}` : ""} <span className="muted source-ext">({t("external")})</span>
                {l.priceNote && <p className="muted">{l.priceNote}</p>}
              </li>
            ))}
          </ul>
        ) : <p className="muted">{t("labsEmpty")}</p>}
        <h3>{t("formTitle")}</h3>
        <PageIntl ns={["Resources"]}><DnaForm /></PageIntl>
      </div>
    </section>
  );
}
