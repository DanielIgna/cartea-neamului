import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import HubSearch from "@/components/continut/HubSearch";
import { getEntry } from "@/lib/continut/colectii";
import { countyLabel, countyPath, getCounty, isCapital, loadCounties, seatPath, type County } from "@/lib/continut/localitati";
import { namesInRegion, type Surname } from "@/lib/continut/nume";
import { REGIONS, REGION_SOURCES, type RegionKey } from "@/lib/continut/regiuni";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";
import { db } from "@/db";
import ShareCard from "@/components/continut/ShareCard";
import { growthSettings } from "@/lib/crestere";

/** Paginile /localitati (hub), /localitati/<județ> și /localitati/<județ>/<reședință>. */
const HUB = {
  path: "/localitati",
  title: "Arhive și registre pe județe: unde îți cauți strămoșii | Cartea Neamului",
  description: "Pentru fiecare județ și reședință: unde sunt arhivele, ce registre de stare civilă și parohiale există și ce nume de familie sunt frecvente.",
};
const ARHIVE_URL = "https://arhivelenationale.ro";

export const localitiesHubMetadata = (): Metadata => publicPageMetadata(HUB);

export function LocalitiesHub() {
  const all = loadCounties();
  const order: RegionKey[] = ["transilvania", "banat", "crisana", "maramures", "bucovina", "moldova", "muntenia", "oltenia", "dobrogea"];
  const groups = order.map((r) => ({ r, items: all.filter((c) => c.regions[0] === r) })).filter((g) => g.items.length);
  const items = all.flatMap((c) => [
    { href: countyPath(c), title: isCapital(c) ? "București" : `Județul ${c.name}`, text: c.seat ?? undefined },
    ...(c.seat && seatPath(c) ? [{ href: seatPath(c)!, title: c.seat, text: `județul ${c.name}` }] : []),
  ]);
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: "Arhive și registre pe județe", description: HUB.description, url: canonicalUrl(HUB.path), inLanguage: "ro",
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
        mainEntity: { "@type": "ItemList", numberOfItems: all.length, itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: canonicalUrl(countyPath(c)), name: c.name })) },
      }} />
      <Breadcrumbs items={[{ name: "Localități", path: HUB.path }]} />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Arhive și registre pe județe</h1>
        <p>Unde îți cauți strămoșii, județ cu județ: ce serviciu al Arhivelor Naționale păstrează registrele vechi, de când există registre de stare civilă în regiune, ce alte surse merită căutate și ce nume de familie sunt des întâlnite.</p>
        <p className="muted" style={{ marginBottom: 0 }}>41 de județe și Bucureștiul, cu reședințele lor · vezi și <Link href="/ghid/registrele-de-stare-civila">registrele de stare civilă</Link>, <Link href="/nume">numele de familie</Link></p>
      </div>
      <HubSearch items={items} label="Caută un județ sau un oraș" placeholder="Caută un județ sau un oraș…">
        {groups.map((g) => (
          <div className="card" key={g.r}>
            <h2 style={{ marginTop: 0 }}>{REGIONS[g.r].name}</h2>
            <ul className="hub-list hub-cols">
              {g.items.map((c) => (
                <li key={c.slug}><Link href={countyPath(c)}>{isCapital(c) ? "București" : c.name}</Link>{c.seat && seatPath(c) && <span className="muted"> · <Link href={seatPath(c)!}>{c.seat}</Link></span>}</li>
              ))}
            </ul>
          </div>
        ))}
      </HubSearch>
      <CtaArbore />
    </section>
  );
}

const countyTitle = (c: County) => isCapital(c) ? "București: arhive, registre și nume de familie | Cartea Neamului" : `Județul ${c.name}: arhive, registre și nume de familie | Cartea Neamului`;
const countyDesc = (c: County) => `Unde sunt arhivele pentru ${countyLabel(c)}, ce registre de stare civilă și parohiale există, istoric pe scurt și nume de familie frecvente în zonă.`;
const seatTitle = (c: County) => `${c.seat}: unde cauți actele strămoșilor | Cartea Neamului`;
const seatDesc = (c: County) => `Acte de stare civilă, registre parohiale și arhive pentru ${c.seat}, reședința județului ${c.name}: unde le ceri și ce găsești în ele.`;

export function countyMetadata(slug: string): Metadata {
  const c = getCounty(slug);
  if (!c) notFound();
  return publicPageMetadata({ path: countyPath(c), title: countyTitle(c), description: countyDesc(c), image: { url: `/api/card?judet=${c.slug}`, alt: countyLabel(c) } });
}
export function seatMetadata(slug: string, seat: string): Metadata {
  const c = getCounty(slug);
  if (!c || !c.seatSlug || c.seatSlug !== seat) notFound();
  return publicPageMetadata({ path: seatPath(c)!, title: seatTitle(c), description: seatDesc(c), image: { url: `/api/card?judet=${c.slug}&oras=${c.seatSlug}`, alt: c.seat ?? c.name } });
}

function sourcesFor(c: County) {
  const groups = [...new Set(c.regions.map((r) => REGIONS[r].group))];
  const s = groups.map((g) => REGION_SOURCES[g]);
  return { civil: s.map((x) => x.civil), tips: [...new Set(s.flatMap((x) => x.tips))].slice(0, 5), guides: [...new Set(s.flatMap((x) => x.guides))].slice(0, 4) };
}

function namesFor(c: County, max = 24): Surname[] {
  return [...new Map(c.regions.flatMap((r) => namesInRegion(r)).map((n) => [n.slug, n])).values()].slice(0, max);
}

function Common({ c, place }: { c: County; place: string }) {
  const src = sourcesFor(c);
  const names = namesFor(c);
  const guides = src.guides.map((g) => getEntry("ghid", g)).filter((g) => !!g);
  const regionNames = c.regions.map((r) => REGIONS[r].name);
  return (
    <>
      <h2>Ce registre există</h2>
      {src.civil.map((x) => <p key={x}>{x}</p>)}
      <ul>{src.tips.map((x) => <li key={x}>{x.split(/(\*[^*]+\*)/g).map((p, i) => (p.startsWith("*") && p.endsWith("*") ? <i key={i}>{p.slice(1, -1)}</i> : p))}</li>)}</ul>
      {names.length > 0 && (
        <>
          <h2>Nume de familie des întâlnite în zonă</h2>
          <p>Nume care apar mai des în {regionNames.join(" și ")}, regiunea istorică din care face parte {place}. Lista e făcută după regiune, nu după o numărătoare pe județ.</p>
          <div className="chips">{names.map((n) => <Link key={n.slug} className="chip" href={`/nume/${n.slug}`}>{n.name}</Link>)}</div>
        </>
      )}
      {guides.length > 0 && (
        <>
          <h2>Ghiduri utile</h2>
          <ul>{guides.map((g) => <li key={g!.path}><Link href={g!.path}>{g!.title}</Link></li>)}</ul>
        </>
      )}
    </>
  );
}

export async function CountyPage({ slug }: { slug: string }) {
  const c = getCounty(slug);
  if (!c) notFound();
  const path = countyPath(c);
  const label = isCapital(c) ? "București" : `Județul ${c.name}`;
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebPage", name: countyTitle(c).replace(" | Cartea Neamului", ""), description: countyDesc(c), url: canonicalUrl(path), inLanguage: "ro",
        about: { "@type": "AdministrativeArea", name: label, containedInPlace: { "@type": "Country", name: "România" } },
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
      }} />
      <Breadcrumbs items={[{ name: "Localități", path: "/localitati" }, { name: label, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>{c.regions.map((r) => REGIONS[r].name).join(" · ")}</div>
        <h1>{isCapital(c) ? "Arhive și registre în București" : `Arhive și registre în județul ${c.name}`}</h1>
        <div className="facts">
          <div><b>Regiunea istorică</b>{c.regions.map((r) => REGIONS[r].name).join(", ")}</div>
          {c.seat && <div><b>Reședința</b>{seatPath(c) ? <Link href={seatPath(c)!}>{c.seat}</Link> : c.seat}</div>}
          <div><b>Arhiva</b>{c.archive}</div>
        </div>
        <h2>Pe scurt</h2>
        <p>{c.history}</p>
        <h2>Unde sunt arhivele</h2>
        <ul>
          <li><b>{c.archive}</b> păstrează registrele de stare civilă mai vechi de aproximativ 100 de ani, multe registre parohiale vechi și fondurile fostelor primării, preturi, prefecturi, școli și tribunale. Programul, adresa și formularele sunt pe <a href={ARHIVE_URL} target="_blank" rel="noopener noreferrer">site-ul Arhivelor Naționale</a>.</li>
          <li><b>Primăriile</b> (serviciile de stare civilă) păstrează actele de naștere, căsătorie și deces din ultimii aproximativ 100 de ani; vezi <Link href="/ghid/cum-ceri-un-act-de-stare-civila">cum ceri un act</Link>.</li>
          <li><b>Parohiile și arhivele eparhiilor</b> pot avea registre care n-au ajuns la Arhive, mai ales pentru anii mai noi.</li>
          <li>Pentru proprietăți, oficiul de cadastru (OCPI) al județului; vezi <Link href="/ghid/cartea-funciara-si-cadastrul-vechi">cartea funciară</Link>.</li>
        </ul>
        <Common c={c} place={isCapital(c) ? "Bucureștiul" : `județul ${c.name}`} />
      </article>
      {c.seat && seatPath(c) && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Reședința județului</h2>
          <p style={{ marginBottom: 0 }}><Link href={seatPath(c)!}>{c.seat}: unde cauți actele strămoșilor</Link></p>
        </div>
      )}
      {(await growthSettings(db)).shareCards && <ShareCard url={canonicalUrl(path)} image={`/api/card?judet=${c.slug}`} campaign="card-localitate"
        text={`Familia ta are rădăcini în ${isCapital(c) ? "București" : `județul ${c.name}`}? Aici scrie unde găsești actele vechi:`} />}
      <CtaArbore />
      <p className="muted small" style={{ textAlign: "center" }}><Link href="/localitati">← Toate județele</Link></p>
    </section>
  );
}

export async function SeatPage({ slug, seat }: { slug: string; seat: string }) {
  const c = getCounty(slug);
  if (!c || !c.seat || c.seatSlug !== seat) notFound();
  const path = seatPath(c)!;
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebPage", name: seatTitle(c).replace(" | Cartea Neamului", ""), description: seatDesc(c), url: canonicalUrl(path), inLanguage: "ro",
        about: { "@type": "City", name: c.seat, containedInPlace: { "@type": "AdministrativeArea", name: `Județul ${c.name}` } },
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
      }} />
      <Breadcrumbs items={[{ name: "Localități", path: "/localitati" }, { name: `Județul ${c.name}`, path: countyPath(c) }, { name: c.seat, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>Reședința județului {c.name}</div>
        <h1>Acte și registre vechi în {c.seat}</h1>
        <div className="facts">
          <div><b>Județul</b><Link href={countyPath(c)}>{c.name}</Link></div>
          <div><b>Regiunea istorică</b>{c.regions.map((r) => REGIONS[r].name).join(", ")}</div>
          <div><b>Arhiva</b>{c.archive}</div>
        </div>
        <h2>Pe scurt</h2>
        <p>{c.seatHistory}</p>
        <h2>Unde ceri actele</h2>
        <ul>
          <li><b>Pentru acte din ultimii aproximativ 100 de ani</b>: serviciul de stare civilă al Primăriei {c.seat}. Ia cu tine actul de identitate și actele care arată legătura de rudenie; vezi <Link href="/ghid/cum-ceri-un-act-de-stare-civila">cum ceri un act</Link>.</li>
          <li><b>Pentru acte mai vechi</b>: {c.archive}, unde ajung registrele după aproximativ un secol; vezi <Link href="/ghid/cum-ceri-copii-de-la-arhive">cum ceri copii de la Arhive</Link>.</li>
          <li><b>Pentru registrele bisericești</b>: într-un oraș mare au existat de obicei mai multe parohii și mai multe confesiuni, fiecare cu registrele ei. Află mai întâi în ce parohie locuia familia (după stradă sau cartier).</li>
          <li><b>Pentru casă și teren</b>: oficiul de cadastru al județului, pentru cartea funciară și planurile vechi.</li>
        </ul>
        <p>Pentru imaginea întregului județ, cu sursele lui, vezi pagina <Link href={countyPath(c)}>județului {c.name}</Link>.</p>
        <Common c={c} place={c.seat} />
      </article>
      {(await growthSettings(db)).shareCards && <ShareCard url={canonicalUrl(path)} image={`/api/card?judet=${c.slug}&oras=${c.seatSlug}`} campaign="card-localitate"
        text={`Familia ta are rădăcini în ${c.seat}? Aici scrie unde găsești actele vechi:`} />}
      <CtaArbore />
      <p className="muted small" style={{ textAlign: "center" }}><Link href={countyPath(c)}>← Județul {c.name}</Link></p>
    </section>
  );
}
