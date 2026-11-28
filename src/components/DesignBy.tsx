import Link from "next/link";
import { localizedPath, type Locale } from "@/i18n/locales";
import { canonicalUrl, webPageJsonLd } from "@/lib/page-metadata";
import { ORG } from "@/lib/seo/organizatie";
import { SITE_URL } from "@/lib/site-url";
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from "@/lib/contact";
import { SHOP_PATH } from "@/lib/invitatii-nunta";

/**
 * „Design by Cartea Neamului” (Daniel, 28.11.2026): pagina pe care o găsește cine vede pe alte platforme un produs
 * „designed by Cartea Neamului” și caută numele pe Google. În română și engleză (în engleză numele rămâne netradus, cu
 * subtitlul „The Book of Your Family”); celelalte limbi nu au adresă proprie (NOT_YET_TRANSLATED din public-pages.ts).
 * Fără prețuri și fără coduri de reducere aici: prețurile sunt pe paginile lor.
 */
export const DESIGN_PATH = "/design-by-cartea-neamului";

type Img = { src: string; width: number; height: number; alt: string; caption: string };
type Texts = {
  metaTitle: string; metaDescription: string; crumb: string; label: string; h1: string; subtitle?: string; intro: string[];
  treeTitle: string; treeIntro: string; treeList: string[]; treeTrial: string; treeCta: string; plansCta: string;
  invTitle: string; invText: string; invCta: string; galleryTitle: string; images: Img[];
};

const IMG = {
  arbore: { src: "/produse/arbore.webp", width: 1600, height: 800 },
  carte: { src: "/produse/carte.webp", width: 1280, height: 640 },
  mockup: { src: "/invitatii-nunta/maramures-mockup.webp", width: 1400, height: 1120 },
  crem: { src: "/invitatii-nunta/maramures-crem.webp", width: 600, height: 840 },
  negru: { src: "/invitatii-nunta/maramures-intunecat.webp", width: 600, height: 840 },
};

const RO: Texts = {
  metaTitle: "Design by Cartea Neamului: arbori genealogici și invitații",
  metaDescription: "Design by Cartea Neamului: arbori genealogici online și invitații de nuntă cu motive din ie și cusături populare, pentru familiile românești.",
  crumb: "Design by Cartea Neamului",
  label: "Design by Cartea Neamului",
  h1: "Design by Cartea Neamului – arbori genealogici și invitații cu motive tradiționale românești",
  intro: [
    "Cartea Neamului face designuri inspirate din ie, din cusăturile în cruciuliță și din motivele populare românești: romburi, stele, chenare roșii și negre, porți maramureșene. Le facem pentru familiile românești, din țară și din diaspora, ca ce ține de neamul tău să arate a acasă.",
    "Dacă ai văzut un produs „designed by Cartea Neamului” și ai căutat numele, aici ești la noi: mai jos găsești arborele familiei online și invitațiile de nuntă.",
  ],
  treeTitle: "Arborele familiei online",
  treeIntro: "Un șablon de arbore printabil are loc pentru câteva generații și rămâne pe o foaie. Pe Cartea Neamului, arborele crește odată cu familia:",
  treeList: [
    "arbore complex, cu oricâte ramuri: frați, veri, căsătorii și ambele linii, a tatălui și a mamei;",
    "mai multe generații, de la copii până la străbunici și mai departe, cât știți;",
    "poze și povești la fiecare persoană, păstrate în lada cu amintiri;",
    "rudele îl completează împreună, fiecare de pe telefonul sau calculatorul lui;",
    "Cartea familiei în PDF, cu copertă și arborele desenat, pe care o poți și tipări acasă.",
  ],
  treeTrial: "Poți începe gratuit 7 zile, fără card.",
  treeCta: "Creează arborele familiei",
  plansCta: "Vezi planurile",
  invTitle: "Invitații de nuntă",
  invText: "Invitații cu motive tradiționale din regiunile României, primul model fiind cel din Maramureș: chenare cusute, poarta maramureșeană și două variante de culoare. Pe pagina invitațiilor vezi fiecare model, ce primești și cum îl completezi.",
  invCta: "Vezi invitațiile de nuntă",
  galleryTitle: "Din designurile noastre",
  images: [
    { ...IMG.arbore, alt: "Arbore genealogic online pe Cartea Neamului: copac cu mai multe generații, cu inițialele fiecărei rude, și fișa unei persoane cu povestea și vremurile în care a trăit", caption: "Arborele familiei online, cu mai multe generații" },
    { ...IMG.carte, alt: "Cartea familiei în PDF: copertă maro cu litere aurii „Neamul Pop din Ieud” și pagina cu strămoșii lui Andrei într-un arbore evantai pe cinci generații", caption: "Cartea familiei în PDF" },
    { ...IMG.mockup, alt: "Invitație de nuntă cu motive maramureșene în două variante de culoare, crem și negru, așezate pe un ștergar cusut cu romburi roșii", caption: "Invitație de nuntă cu motive maramureșene" },
    { ...IMG.crem, alt: "Invitație de nuntă crem cu poartă maramureșeană desenată sus și chenare cusute în cruciuliță, roșu, negru și verde", caption: "Varianta crem, cu poarta maramureșeană" },
    { ...IMG.negru, alt: "Invitație de nuntă pe fond negru, cu chenare cusute pe margini și litere aurii, text în română și engleză", caption: "Varianta pe negru, în română și engleză" },
  ],
};

const EN: Texts = {
  metaTitle: "Design by Cartea Neamului – The Book of Your Family",
  metaDescription: "Design by Cartea Neamului – The Book of Your Family: Romanian family trees online and wedding invitations inspired by the ie blouse and folk embroidery.",
  crumb: "Design by Cartea Neamului",
  label: "Design by Cartea Neamului",
  h1: "Design by Cartea Neamului – The Book of Your Family: Romanian family trees and folk wedding invitations",
  subtitle: "Cartea Neamului – The Book of Your Family",
  intro: [
    "Cartea Neamului creates designs inspired by the Romanian ie blouse, cross-stitch embroidery and folk motifs: diamonds, stars, red and black borders, carved Maramureș gates. We make them for Romanian families, in Romania and abroad, so that what belongs to your family feels like home.",
    "If you saw a product “designed by Cartea Neamului” and searched for the name, you have found us: below are the online family tree and the wedding invitations.",
  ],
  treeTitle: "Your family tree online",
  treeIntro: "A printable tree template has room for a few generations and stays on one sheet of paper. On Cartea Neamului, the tree grows with your family:",
  treeList: [
    "a complex tree with as many branches as you need: siblings, cousins, marriages, and both your father's and your mother's lines;",
    "many generations, from children to great-grandparents and beyond, as far back as you know;",
    "photos and stories on every person, kept in the memory chest;",
    "relatives fill it in together, each from their own phone or computer;",
    "the family book as a PDF, with a cover and the tree drawn in, which you can also print at home.",
  ],
  treeTrial: "You can start free for 7 days, no card needed.",
  treeCta: "Create your family tree",
  plansCta: "See the plans",
  invTitle: "Wedding invitations",
  invText: "Invitations with traditional motifs from the regions of Romania, starting with Maramureș: embroidered borders, the carved Maramureș gate and two colour versions. On the invitations page you can see each design, what you receive and how to fill it in.",
  invCta: "See the wedding invitations",
  galleryTitle: "From our designs",
  images: [
    { ...IMG.arbore, alt: "Online family tree on Cartea Neamului: a tree with several generations showing each relative's initials, next to one person's card with their story and the times they lived in", caption: "The online family tree, across several generations" },
    { ...IMG.carte, alt: "The family book as a PDF: a brown cover with gold lettering „Neamul Pop din Ieud” and a page with Andrei's ancestors in a five-generation fan chart", caption: "The family book as a PDF" },
    { ...IMG.mockup, alt: "Wedding invitation with Maramureș folk motifs in two colour versions, cream and black, laid on an embroidered towel with red diamond patterns", caption: "Wedding invitation with Maramureș motifs" },
    { ...IMG.crem, alt: "Cream wedding invitation with a carved Maramureș gate drawn at the top and cross-stitch borders in red, black and green", caption: "The cream version, with the Maramureș gate" },
    { ...IMG.negru, alt: "Wedding invitation on a black background with embroidered side borders and gold lettering, in Romanian and English", caption: "The black version, in Romanian and English" },
  ],
};

/** Textele paginii: româna pentru ro, engleza pentru restul (doar en și en-us au adresă proprie). */
export const designText = (locale: Locale): Texts => (locale === "ro" ? RO : EN);

/** Datele pentru Google: pagina și firul de navigare, organizația Cartea Neamului și marca ei (Brand). */
export function designJsonLd(locale: Locale) {
  const t = designText(locale);
  const page = webPageJsonLd({ path: DESIGN_PATH, title: t.h1, description: t.metaDescription, crumb: t.crumb, locale });
  const brand = {
    "@type": "Brand", "@id": `${SITE_URL}/#brand`, name: "Cartea Neamului", alternateName: "The Book of Your Family",
    url: SITE_URL, logo: ORG.logo.url, description: t.metaDescription,
  };
  const org = { ...ORG, sameAs: [FACEBOOK_URL, TIKTOK_URL, INSTAGRAM_URL], brand: { "@id": brand["@id"] } };
  const graph = page["@graph"] as Record<string, unknown>[];
  const webPage = { ...graph[0], about: { "@id": brand["@id"] }, publisher: { "@id": ORG["@id"] }, image: t.images.map((i) => canonicalUrl(i.src)) };
  return { "@context": "https://schema.org", "@graph": [webPage, ...graph.slice(1), org, brand] };
}

export default function DesignBy({ locale }: { locale: Locale }) {
  const t = designText(locale);
  const own = (p: string) => (locale === "ro" ? p : localizedPath(p, locale));
  return (
    <section className="stack" style={{ maxWidth: 900, margin: "0 auto" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(designJsonLd(locale)) }} />
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t.label}</div>
        <h1>{t.h1}</h1>
        {t.subtitle && <p className="muted" style={{ fontSize: 18, marginTop: 0 }}><i>{t.subtitle}</i></p>}
        {t.intro.map((p) => <p key={p}>{p}</p>)}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t.treeTitle}</h2>
        <p>{t.treeIntro}</p>
        <ul>{t.treeList.map((li) => <li key={li}>{li}</li>)}</ul>
        <p className="muted">{t.treeTrial}</p>
        <p style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link className="btn primary" href="/intrare?mod=cont-nou">{t.treeCta} →</Link>
          <Link className="btn" href={`${own("/produse")}#planuri`}>{t.plansCta}</Link>
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t.invTitle}</h2>
        <p>{t.invText}</p>
        <p><Link className="btn primary" href={own(SHOP_PATH)}>{t.invCta} →</Link></p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t.galleryTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {t.images.map((img) => (
            <figure key={img.src} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} width={img.width} height={img.height} alt={img.alt} loading="lazy" decoding="async"
                style={{ width: "100%", height: 220, objectFit: "cover", objectPosition: "top center", borderRadius: 8, display: "block" }} />
              <figcaption className="muted" style={{ fontSize: 14, marginTop: 6 }}>{img.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
