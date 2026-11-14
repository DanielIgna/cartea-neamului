import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import ShareCard from "@/components/continut/ShareCard";
import { getEntry } from "@/lib/continut/colectii";
import { countyPath, getCounty, type County } from "@/lib/continut/localitati";
import { namesInRegion } from "@/lib/continut/nume";
import { REGIONS, REGION_SOURCES } from "@/lib/continut/regiuni";
import { uatGate } from "@/lib/continut/prag";
import {
  KIND_NAME, countySeatUat, direction, distanceKm, getUat, loadUats, nearestTown, neighbours, rankInCounty, uatPath, uatsOf, type Uat,
} from "@/lib/continut/uat";
import { areaPublicStat } from "@/lib/continut/localitati-statistici";
import { plainPlace } from "@/lib/place-key";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { countOf, km, listRo, uatDescription, uatTitle } from "@/lib/continut/uat-text";
export { countOf };
import { SITE_URL } from "@/lib/site-url";
import { db } from "@/db";
import { growthSettings } from "@/lib/crestere";

/**
 * Paginile comunelor, orașelor și municipiilor (/localitati/<județ>/<localitate>), cu datele fiecăreia: satele, populația din
 * 2021, unde e față de reședința județului și de cel mai apropiat oraș, vecinii, localitățile cu același nume și, de la un prag,
 * câte familii din Cartea Neamului au rădăcini acolo. Textul se compune din aceste date, deci diferă de la o pagină la alta.
 * Reședințele de județ își păstrează pagina lor (LocalityPages.tsx), cu blocul de aici adăugat.
 */

export function uatMetadata(countySlug: string, slug: string): Metadata {
  const c = getCounty(countySlug);
  const u = c ? getUat(c.slug, slug) : null;
  if (!c || !u) notFound();
  const meta = publicPageMetadata({ path: uatPath(u), title: uatTitle(u, c), description: uatDescription(u, c), image: { url: `/api/card?judet=${c.slug}`, alt: `${u.name}, județul ${c.name}` } });
  return uatGate(u) ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/** Ce spun datele despre loc: mărime, sate, poziție. Propozițiile se aleg după date, nu sunt aceleași pe toate paginile. */
function intro(u: Uat, c: County): string[] {
  const k = KIND_NAME[u.kind];
  const regions = c.regions.map((r) => REGIONS[r]);
  const { rank, of } = rankInCounty(u);
  const fem = u.kind === "c";
  const big = fem ? `cea mai mare comună a județului` : `cel mai mare ${k.one} al județului`;
  const nth = rank === 1 ? "" : fem ? `a ${rank}-a` : `al ${rank}-lea`;
  const size = of < 3 ? "" : rank === 1 ? `, ${big}`
    : rank <= Math.ceil(of / 5) ? `, ${nth} ca mărime dintre cele ${countOf(of, k.one, k.many)} ale județului`
    : rank > of - Math.ceil(of / 5) ? `, printre cele mai mici ${k.many} ale județului (locul ${rank} din ${of})`
    : `, pe locul ${rank} din ${countOf(of, k.one, k.many)} ale județului după numărul de locuitori`;
  const out = [`${k.title} ${u.name} se află în județul ${c.name}, ${regions.map((r) => r.in).join(" și ")}. La recensământul din 2021 avea ${countOf(u.pop, "locuitor", "locuitori")}${size}.`];

  const seat = u.villages.find((v) => v.seat) ?? u.villages[0];
  const others = u.villages.filter((v) => v !== seat).map((v) => v.name);
  if (u.kind === "c") {
    if (!others.length) out.push(`Comuna are un singur sat, ${seat.name}, deci toate actele de aici poartă același nume de loc.`);
    else {
      const diff = plainPlace(seat.name) !== plainPlace(u.name);
      out.push(`Comuna e formată din ${countOf(u.villages.length, "sat", "sate")}: ${seat.name}, unde e primăria, și ${listRo(others)}.`
        + (diff ? ` Nu există un sat numit ${u.name}: în actele vechi oamenii apar cu numele satului lor (${seat.name}, ${others[0]} și celelalte), nu cu numele comunei.` : " În actele vechi oamenii apar de obicei cu numele satului, nu al comunei."));
    }
  } else if (others.length) {
    out.push(`Pe lângă ${u.kind === "m" ? "municipiul" : "orașul"} propriu-zis, de ${u.name} țin ${countOf(others.length, "localitate", "localități")}: ${listRo(others)}. Unele au fost sate separate, cu parohia și registrele lor.`);
  }

  const cs = countySeatUat(c);
  if (cs && cs !== u) {
    const d = distanceKm(u, cs);
    out.push(`${seat.name} e la aproximativ ${km(d)} km spre ${direction(u, cs)} de ${cs.name}, reședința județului${d > 60 ? ", destul de departe încât familiile să fi avut legături și cu orașele din județele vecine" : ""}.`);
  }
  if (u.kind === "c") {
    const t = nearestTown(u);
    if (t && t.u !== cs) out.push(`Cel mai apropiat oraș e ${t.u.name} (${km(t.km)} km, județul ${getCounty(t.u.countySlug)?.name ?? ""}): după 1950, mulți copii din comună s-au născut la spitalul de acolo, așa că actul de naștere poate fi la primăria orașului, nu a comunei.`);
  }
  return out;
}

/** Alte localități cu același nume (comune sau sate), ca să nu fie încurcate în acte. */
function sameName(u: Uat) {
  const key = plainPlace(u.name);
  const uats = loadUats().filter((x) => x !== u && plainPlace(x.name) === key);
  const villages = loadUats().reduce((n, x) => n + (x === u ? 0 : x.villages.filter((v) => plainPlace(v.name) === key).length), 0);
  return { uats, villages };
}

/** Blocul cu datele localității, folosit și pe pagina reședinței de județ. */
export async function UatDetails({ u, c }: { u: Uat; c: County }) {
  const near = neighbours(u, 8);
  const same = sameName(u);
  const stat = await areaPublicStat(db, u.area);
  const k = KIND_NAME[u.kind];
  return (
    <>
      <h2>{u.kind === "c" ? "Satele comunei" : `Localitățile ${u.kind === "m" ? "municipiului" : "orașului"}`}</h2>
      <ul className="hub-list hub-cols">
        {u.villages.map((v) => <li key={v.siruta}>{v.name}{v.seat && <span className="muted"> · {u.kind === "c" ? "reședința comunei" : "centrul"}</span>}</li>)}
      </ul>
      {(same.uats.length > 0 || same.villages > 0) && (
        <>
          <h2>Atenție la localitățile cu același nume</h2>
          <p>
            {same.uats.length > 0 && <>Mai există {same.uats.length === 1 ? "o unitate" : `${same.uats.length} unități`} cu numele {u.name}: {same.uats.slice(0, 8).map((x, i) => (
              <span key={uatPath(x)}>{i > 0 && ", "}<Link href={uatPath(x)}>{x.name} ({getCounty(x.countySlug)?.name})</Link></span>
            ))}{same.uats.length > 8 && " și altele"}. </>}
            {same.villages > 0 && <>{same.villages === 1 ? "Un sat din altă comună se numește" : `${same.villages} sate din alte comune se numesc`} tot {u.name}. </>}
            Când un act scrie doar „{u.name}”, verifică județul (sau comitatul, înainte de 1920) și numele preotului sau al satelor vecine.
          </p>
        </>
      )}
      {stat && (
        <>
          <h2>Familii cu rădăcini aici, în Cartea Neamului</h2>
          <p>{countOf(stat.trees, "arbore", "arbori")} de familie din Cartea Neamului au strămoși din {k.one === "comună" ? "comuna" : k.one === "oraș" ? "orașul" : "municipiul"} {u.name}, iar proprietarii lor au ales să poată fi găsiți de neamuri.
            {stat.surnames.length > 0 ? " Numele de familie care apar în cel puțin cinci dintre ei:" : ""}</p>
          {stat.surnames.length > 0 && <div className="chips">{stat.surnames.map((s) => <span key={s.name} className="chip">{s.name}</span>)}</div>}
          <p className="muted small">Doar totaluri, fără persoane sau arbori anume; un nume apare doar de la cinci arbori în sus.</p>
        </>
      )}
      <h2>Localități vecine</h2>
      <ul className="hub-list hub-cols">
        {near.map((x) => (
          <li key={uatPath(x.u)}><Link href={uatPath(x.u)}>{x.u.name}</Link> <span className="muted">· {km(x.km)} km spre {direction(x.u, u)}{x.u.countySlug !== u.countySlug ? `, jud. ${getCounty(x.u.countySlug)?.name}` : ""}</span></li>
        ))}
      </ul>
      <p className="muted small">Locuitori: recensământul din 2021 (INS). Satele și codurile: nomenclatorul SIRUTA (INS, CC BY 4.0). Punctele și distanțele, în linie dreaptă: © OpenStreetMap contributors (ODbL). <a href={`https://www.openstreetmap.org/?mlat=${u.lat}&mlon=${u.lng}#map=12/${u.lat}/${u.lng}`} target="_blank" rel="noopener noreferrer">Vezi pe hartă</a>.</p>
    </>
  );
}

export async function UatPage({ countySlug, slug }: { countySlug: string; slug: string }) {
  const c = getCounty(countySlug);
  const u = c ? getUat(c.slug, slug) : null;
  if (!c || !u) notFound();
  const path = uatPath(u);
  const k = KIND_NAME[u.kind];
  const groups = [...new Set(c.regions.map((r) => REGIONS[r].group))].map((g) => REGION_SOURCES[g]);
  const guides = [...new Set(groups.flatMap((g) => g.guides))].slice(0, 4).map((g) => getEntry("ghid", g)).filter((g) => !!g);
  const names = [...new Map(c.regions.flatMap((r) => namesInRegion(r)).map((n) => [n.slug, n])).values()].slice(0, 12);
  const hall = u.kind === "c" ? `Primăria comunei ${u.name}` : `Primăria ${u.kind === "m" ? "municipiului" : "orașului"} ${u.name}`;
  const seatVillage = u.villages.find((v) => v.seat) ?? u.villages[0];
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebPage", name: uatTitle(u, c).replace(" | Cartea Neamului", ""), description: uatDescription(u, c), url: canonicalUrl(path), inLanguage: "ro",
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
        about: {
          "@type": u.kind === "c" ? "AdministrativeArea" : "City", name: u.name,
          geo: { "@type": "GeoCoordinates", latitude: u.lat, longitude: u.lng },
          containedInPlace: { "@type": "AdministrativeArea", name: `Județul ${c.name}`, url: canonicalUrl(countyPath(c)), containedInPlace: { "@type": "Country", name: "România" } },
          ...(u.villages.length > 1 ? { containsPlace: u.villages.map((v) => ({ "@type": "Place", name: v.name })) } : {}),
        },
      }} />
      <Breadcrumbs items={[{ name: "Localități", path: "/localitati" }, { name: `Județul ${c.name}`, path: countyPath(c) }, { name: u.name, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>{k.title} {u.name} · județul {c.name}</div>
        <h1>Acte vechi și arhive pentru {u.name}, județul {c.name}</h1>
        <div className="facts">
          <div><b>Ce este</b>{k.one}{u.kind === "c" ? ` cu ${countOf(u.villages.length, "sat", "sate")}` : ""}</div>
          <div><b>Județul</b><Link href={countyPath(c)}>{c.name}</Link></div>
          <div><b>Locuitori (2021)</b>{u.pop.toLocaleString("ro-RO")}</div>
          <div><b>Arhiva</b>{c.archive}</div>
        </div>
        <h2>Pe scurt</h2>
        {intro(u, c).map((p) => <p key={p}>{p}</p>)}
        <h2>Unde ceri actele</h2>
        <ul>
          <li><b>Acte din ultimii aproximativ 100 de ani</b> (naștere, căsătorie, deces): serviciul de stare civilă de la {hall}{u.kind === "c" && u.villages.length > 1 ? `, pentru toate satele comunei` : ""}. Vezi <Link href="/ghid/cum-ceri-un-act-de-stare-civila">cum ceri un act</Link>.</li>
          <li><b>Acte mai vechi</b>: {c.archive}, unde ajung registrele după aproximativ un secol; caută după {u.kind === "c" && u.villages.length > 1 ? `numele satului (${seatVillage.name} sau celelalte)` : `numele ${u.name}`}. Vezi <Link href="/ghid/cum-ceri-copii-de-la-arhive">cum ceri copii de la Arhive</Link>.</li>
          <li><b>Registrele bisericești</b>: {u.villages.length > 2 ? "satele mai mari aveau de obicei parohia lor, iar cele mici erau trecute la parohia unui sat vecin; află mai întâi de ce parohie ținea satul familiei." : "află de ce parohie ținea familia și ce confesiune avea; fiecare confesiune își ținea registrele separat."}</li>
        </ul>
        {groups.map((g) => <p key={g.civil}>{g.civil}</p>)}
        <UatDetails u={u} c={c} />
        {names.length > 0 && (
          <>
            <h2>Nume de familie frecvente în regiune</h2>
            <p>Nume des întâlnite {c.regions.map((r) => REGIONS[r].in).join(" și ")}; lista e făcută pe regiune, nu numărată în {u.name}.</p>
            <div className="chips">{names.map((n) => <Link key={n.slug} className="chip" href={`/nume/${n.slug}`}>{n.name}</Link>)}</div>
          </>
        )}
        {guides.length > 0 && (
          <>
            <h2>Ghiduri utile</h2>
            <ul>{guides.map((g) => <li key={g!.path}><Link href={g!.path}>{g!.title}</Link></li>)}</ul>
          </>
        )}
      </article>
      {(await growthSettings(db)).shareCards && <ShareCard url={canonicalUrl(path)} image={`/api/card?judet=${c.slug}`} campaign="card-localitate"
        text={`Familia ta are rădăcini în ${u.name}, județul ${c.name}? Aici scrie unde găsești actele vechi:`} />}
      <CtaArbore title={`Începe arborele familiei tale din ${u.name}`} />
      <p className="muted small" style={{ textAlign: "center" }}><Link href={countyPath(c)}>← Toate localitățile din județul {c.name}</Link></p>
    </section>
  );
}

/** Lista localităților unui județ, pentru pagina județului. */
export function CountyUatList({ c }: { c: County }) {
  const all = uatsOf(c.slug);
  if (!all.length) return null;
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Localitățile județului {c.name}</h2>
      <p className="muted">{(["m", "o", "c"] as const).map((k) => { const n = all.filter((u) => u.kind === k).length; return n ? countOf(n, KIND_NAME[k].one, KIND_NAME[k].many) : null; }).filter(Boolean).join(", ")}, cu {countOf(all.reduce((s, u) => s + u.villages.length, 0), "sat sau localitate", "sate și localități")} în total. Alege una ca să vezi satele ei, vecinii și unde îi ceri actele.</p>
      {(["m", "o", "c"] as const).map((k) => {
        const list = all.filter((u) => u.kind === k);
        if (!list.length) return null;
        return (
          <div key={k}>
            <h3>{KIND_NAME[k].many[0].toUpperCase() + KIND_NAME[k].many.slice(1)}</h3>
            <ul className="hub-list hub-cols">
              {list.map((u) => <li key={u.slug}><Link href={uatPath(u)}>{u.name}</Link> <span className="muted">· {u.pop.toLocaleString("ro-RO")} loc.</span></li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
