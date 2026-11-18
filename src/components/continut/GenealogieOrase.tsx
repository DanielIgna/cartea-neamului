import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore, { CtaSus } from "@/components/continut/CtaArbore";
import { countyPath, getCounty, isCapital, loadCounties, seatPath, type County } from "@/lib/continut/localitati";
import { GEN_REGIONS, genRegionPath, getGenRegion } from "@/lib/genealogie-regiuni";
import { namesInRegion } from "@/lib/continut/nume";
import { REGIONS } from "@/lib/continut/regiuni";
import { distanceKm, getUat, loadUats, neighbours, uatPath, type Uat } from "@/lib/continut/uat";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";
import {
  GEN_CITIES, GEN_HUB, GEN_MIN_WORDS, cityDesc, cityTitle, REGION_PAGES_LIVE, genCityPath, genWords, getGenCity, type GenCity,
} from "@/lib/genealogie-orase";

/** Paginile /genealogie (hub) și /genealogie/<oraș>: cum îți cauți strămoșii dintr-un oraș mare din România. */
const HUB = {
  path: GEN_HUB,
  title: "Genealogie pe regiuni, județe și orașe | Cartea Neamului",
  description: "Cum îți cauți strămoșii în fiecare regiune istorică a României, în fiecare județ și în orașele mari: registrele, confesiunile, numele vechi și arhivele lor.",
};
export const HUB_H1 = "Genealogie pe regiuni, județe și orașe";
const BUCHAREST = { lat: 44.4268, lng: 26.1025 };

export const genSrc = (c: GenCity) => `genealogie-${c.slug}`;

export const genealogieHubMetadata = (): Metadata => publicPageMetadata(HUB);

export function genealogieCityMetadata(slug: string): Metadata {
  const c = getGenCity(slug);
  if (!c) notFound();
  const meta = publicPageMetadata({ path: genCityPath(c), title: cityTitle(c), description: cityDesc(c) });
  return genWords(c) >= GEN_MIN_WORDS ? meta : { ...meta, robots: { index: false, follow: true } };
}

/** Comunele cele mai apropiate de oraș (fără orașul însuși); Bucureștiul nu e în lista de localități, deci după coordonate. */
function nearby(c: GenCity, county: County, n = 8): { u: Uat; km: number }[] {
  const self = county.seatSlug ? getUat(county.slug, county.seatSlug) : null;
  if (self) return neighbours(self, n + 4).filter((x) => x.u.kind === "c").slice(0, n);
  return loadUats().filter((u) => u.kind === "c").map((u) => ({ u, km: distanceKm(BUCHAREST, u) })).sort((a, b) => a.km - b.km).slice(0, n);
}

function faqOf(c: GenCity, county: County) {
  return [
    { q: `Unde găsesc actele vechi ale strămoșilor din ${c.name}?`, a: `Registrele de stare civilă mai vechi de aproximativ 100 de ani sunt la ${county.archive}. Actele mai noi se cer de la serviciul de stare civilă al primăriei, cu actele care arată legătura de rudenie.` },
    ...(c.oldNames.length ? [{ q: `Sub ce nume apare ${c.name} în actele vechi?`, a: `În documentele vechi orașul poate apărea ca ${c.oldNames.join(", ")}. Caută toate formele numelui, și pentru oraș, și pentru oameni.` }] : []),
    { q: "Bunicii mei s-au mutat în oraș din alt sat. Unde le caut actele?", a: "Registrele de botez, cununie și naștere sunt la parohia și la primăria locului unde s-a petrecut evenimentul. Pentru cei născuți la sat, caută în satul de origine și la arhiva județului de care ținea satul." },
  ];
}

export function GenealogieHub() {
  const counties = loadCounties();
  const name = (c: County) => (isCapital(c) ? "București" : c.name);
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: HUB_H1, description: HUB.description, url: canonicalUrl(HUB.path), inLanguage: "ro",
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
        mainEntity: { "@type": "ItemList", numberOfItems: GEN_REGIONS.length + GEN_CITIES.length, itemListElement: [
          ...GEN_REGIONS.map((r) => ({ url: canonicalUrl(genRegionPath(r)), name: r.name })),
          ...GEN_CITIES.map((c) => ({ url: canonicalUrl(genCityPath(c)), name: c.name })),
        ].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })) },
      }} />
      <Breadcrumbs items={[{ name: "Genealogie", path: HUB.path }]} />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{HUB_H1}</h1>
        <p>Unde sunt actele strămoșilor depinde de locul în care au trăit: fiecare regiune istorică a avut alte stăpâniri, alte confesiuni și alte registre, iar fiecare județ își are arhiva lui. Alege regiunea, județul sau orașul familiei și afli de unde începi căutarea.</p>
        <p className="muted" style={{ marginBottom: 0 }}>Vezi și <Link href="/nume">numele de familie</Link>, <Link href="/ghid">ghidurile de genealogie</Link>, <Link href="/surse-publice">sursele publice</Link> și <Link href="/diaspora">românii din străinătate</Link>.</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pe regiuni istorice</h2>
        <ul className="hub-list">
          {GEN_REGIONS.map((r) => {
            const cs = r.counties.map((x) => getCounty(x)).filter((x) => !!x);
            return (
              <li key={r.slug}>
                <Link href={genRegionPath(r)}><b>{r.name}</b></Link>
                {cs.length > 0 && <span className="muted small"> · {cs.map((c, i) => <span key={c.slug}>{i ? ", " : ""}<Link href={countyPath(c)}>{name(c)}</Link></span>)}</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>În orașele mari</h2>
        <ul className="hub-list hub-cols">
          {GEN_CITIES.map((c) => <li key={c.slug}><Link href={genCityPath(c)}>{c.name}</Link></li>)}
        </ul>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pe județe</h2>
        <p>Fiecare județ are pagina lui, cu arhiva, registrele și toate comunele și orașele.</p>
        <ul className="hub-list hub-cols">
          {counties.map((c) => <li key={c.slug}><Link href={countyPath(c)}>{name(c)}</Link></li>)}
        </ul>
      </div>
      <CtaArbore src="genealogie" />
    </section>
  );
}

export function GenealogieCity({ slug }: { slug: string }) {
  const c = getGenCity(slug);
  if (!c) notFound();
  const county = getCounty(c.county);
  if (!county) notFound();
  const path = genCityPath(c);
  const regions = county.regions.map((r) => REGIONS[r].name);
  const mainRegion = getGenRegion(c.region ?? county.regions[0] ?? "");
  const names = [...new Map(county.regions.flatMap((r) => namesInRegion(r)).map((n) => [n.slug, n])).values()].slice(0, 18);
  const near = nearby(c, county);
  const faq = faqOf(c, county);
  const src = genSrc(c);
  const share = `https://wa.me/?text=${encodeURIComponent(`Am găsit unde sunt actele vechi din ${c.name}. Hai să facem împreună arborele familiei: ${SITE_URL}${path}?src=${src}-wa`)}`;
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: cityTitle(c).replace(" | Cartea Neamului", ""), description: cityDesc(c),
        url: canonicalUrl(path), inLanguage: "ro", dateModified: "2026-11-17",
        author: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL }, publisher: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL },
        about: { "@type": "Place", name: c.name, ...(c.oldNames.length ? { alternateName: c.oldNames.map((n) => n.replace(/\s*\(.*\)$/, "")) } : {}),
          containedInPlace: { "@type": "AdministrativeArea", name: isCapital(county) ? "București" : `Județul ${county.name}`, containedInPlace: { "@type": "Country", name: "România" } } },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <Breadcrumbs items={[{ name: "Genealogie", path: GEN_HUB }, ...(mainRegion ? [{ name: mainRegion.name, path: genRegionPath(mainRegion) }] : []), { name: c.name, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>{regions.join(" · ")}</div>
        <h1>Genealogie în {c.name}: cum îți cauți strămoșii</h1>
        <div className="facts">
          <div><b>{isCapital(county) ? "Municipiul" : "Județul"}</b><Link href={countyPath(county)}>{isCapital(county) ? "București" : county.name}</Link></div>
          <div><b>Regiunea istorică</b>{county.regions.map((r, i) => { const g = REGION_PAGES_LIVE ? getGenRegion(r) : null; return <span key={r}>{i ? ", " : ""}{g ? <Link href={genRegionPath(g)}>{REGIONS[r].name}</Link> : REGIONS[r].name}</span>; })}</div>
          <div><b>Arhiva</b>{county.archive}</div>
          {c.oldNames.length > 0 && <div><b>În actele vechi</b>{c.oldNames.join(" · ")}</div>}
        </div>
        <CtaSus src={src} />
        {c.body.map((s) => (
          <div key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
          </div>
        ))}
        <h2>Unde ceri actele</h2>
        <ul>
          <li><b>Acte din ultimii aproximativ 100 de ani</b>: serviciul de stare civilă al primăriei; vezi <Link href="/ghid/cum-ceri-un-act-de-stare-civila">cum ceri un act</Link>.</li>
          <li><b>Acte mai vechi</b>: {county.archive}; vezi <Link href="/ghid/cum-ceri-copii-de-la-arhive">cum ceri copii de la Arhive</Link>.</li>
          <li>Mai multe despre județ și registrele lui: <Link href={countyPath(county)}>{isCapital(county) ? "arhive și registre în București" : `județul ${county.name}`}</Link>{seatPath(county) && <>, <Link href={seatPath(county)!}>actele din {county.seat}</Link></>}.</li>
        </ul>
        {names.length > 0 && (
          <>
            <h2>Nume de familie des întâlnite în zonă</h2>
            <p>Nume care apar mai des în {regions.join(" și ")}. Lista e făcută după regiune, nu după o numărătoare în oraș.</p>
            <div className="chips">{names.map((n) => <Link key={n.slug} className="chip" href={`/nume/${n.slug}`}>{n.name}</Link>)}</div>
          </>
        )}
        {near.length > 0 && (
          <>
            <h2>Comune din jurul orașului</h2>
            <p>Mulți dintre cei care trăiesc azi în {c.name} au bunici în satele din jur. Fiecare comună are pagina ei, cu satele și registrele ei.</p>
            <ul className="hub-list hub-cols">{near.map(({ u, km }) => <li key={uatPath(u)}><Link href={uatPath(u)}>{u.name}</Link> <span className="muted small">· {Math.round(km)} km</span></li>)}</ul>
          </>
        )}
        <h2>Întrebări frecvente</h2>
        {faq.map((f) => (
          <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </article>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Întreabă-i pe bunici</h2>
        <p>Cele mai bune indicii sunt la cei mai bătrâni din familie: numele satelor, ale nașilor, ale bisericilor. Trimite-le pagina și scrieți arborele împreună.</p>
        <a className="btn" href={share} target="_blank" rel="noopener noreferrer">Trimite pe WhatsApp</a>
      </div>
      <CtaArbore title="Fă-ți arborele familiei gratuit 7 zile, fără card" text="Adaugi părinții și bunicii, iar rudele pot completa ce știu ele." src={src} />
      <p className="muted small" style={{ textAlign: "center" }}><Link href={GEN_HUB}>← Toate regiunile, județele și orașele</Link></p>
    </section>
  );
}
