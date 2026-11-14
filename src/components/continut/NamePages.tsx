import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import HubSearch from "@/components/continut/HubSearch";
import Pager from "@/components/continut/Pager";
import { getEntry } from "@/lib/continut/colectii";
import { KIND_LABEL, getName, loadNames, nameText, relatedNames } from "@/lib/continut/nume";
import { MIN_TREES, surnamePublicStat } from "@/lib/continut/nume-statistici";
import { paginate, pageHref } from "@/lib/continut/paginare";
import { REGIONS } from "@/lib/continut/regiuni";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";
import ShareCard from "@/components/continut/ShareCard";
import { growthSettings } from "@/lib/crestere";

/** Paginile /nume (hubul) și /nume/<slug>; le folosesc și variantele gata făcute din app/(public)/pub/[v]/nume. */
const HUB = {
  path: "/nume",
  title: "Nume de familie românești: originea și semnificația | Cartea Neamului",
  description: "Originea, semnificația și răspândirea numelor de familie românești, de la Pop și Popescu la Todea, cu sfaturi de căutare în arhive.",
};

export function namesHubMetadata(page: number): Metadata {
  const pages = paginate(loadNames(), page).pages;
  if (page > pages) notFound();
  if (page <= 1) return publicPageMetadata(HUB);
  return publicPageMetadata({ path: pageHref(HUB.path, page), title: HUB.title.replace(" | ", ` – pagina ${page} | `), description: `${HUB.description} Pagina ${page} din ${pages}.` });
}

export function NamesHub({ page }: { page: number }) {
  const all = loadNames();
  const p = paginate(all, page);
  if (p.outOfRange) notFound();
  const letters = [...new Set(p.items.map((n) => n.name[0].toUpperCase()))];
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: "Nume de familie românești", description: HUB.description,
        url: canonicalUrl(pageHref(HUB.path, p.page)), inLanguage: "ro", isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
        mainEntity: { "@type": "ItemList", numberOfItems: all.length, itemListElement: p.items.map((n, i) => ({ "@type": "ListItem", position: (p.page - 1) * 60 + i + 1, url: canonicalUrl(`/nume/${n.slug}`), name: n.name })) },
      }} />
      <Breadcrumbs items={[{ name: "Nume de familie", path: HUB.path }]} />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Nume de familie românești</h1>
        <p>De unde vin numele noastre de familie, ce înseamnă, unde sunt mai des întâlnite și cum le cauți în arhive. Multe s-au născut din prenumele unui strămoș, dintr-o meserie, dintr-o poreclă sau din locul de unde a venit familia.</p>
        <p className="muted" style={{ marginBottom: 0 }}>{all.length} de nume · vezi și <Link href="/ghid/nume-schimbate-si-variante">variantele de scriere în acte</Link>, <Link href="/glosar/patronimic">patronimicul</Link>, <Link href="/localitati">arhivele pe județe</Link></p>
      </div>
      <HubSearch items={all.map((n) => ({ href: `/nume/${n.slug}`, title: n.name, text: n.variants.join(", ") }))} label="Caută un nume" placeholder="Caută un nume de familie…">
        <div className="card">
          {letters.map((l) => (
            <div key={l}>
              <h2 style={{ margin: "14px 0 6px" }}>{l}</h2>
              <ul className="hub-list hub-cols">
                {p.items.filter((n) => n.name[0].toUpperCase() === l).map((n) => <li key={n.slug}><Link href={`/nume/${n.slug}`}>{n.name}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <Pager base={HUB.path} page={p.page} pages={p.pages} />
      </HubSearch>
      <CtaArbore />
    </section>
  );
}

const titleOf = (name: string) => `Numele ${name}: origine, semnificație și arhive | Cartea Neamului`;
const descOf = (name: string) => `Ce înseamnă numele de familie ${name}, de unde vine, unde e mai des întâlnit, cum se mai scrie și cum cauți familia ${name} în arhive.`;

export function nameMetadata(slug: string): Metadata {
  const n = getName(slug);
  if (!n) notFound();
  return publicPageMetadata({ path: `/nume/${n.slug}`, title: titleOf(n.name), description: descOf(n.name), image: { url: `/api/card?nume=${n.slug}`, alt: `Numele de familie ${n.name}` } });
}

export async function NamePage({ slug }: { slug: string }) {
  const n = getName(slug);
  if (!n) notFound();
  const t = nameText(n);
  const [stat, growth] = await Promise.all([surnamePublicStat(db, n.name), growthSettings(db)]);
  const related = relatedNames(n);
  const guides = t.guides.map((g) => getEntry("ghid", g)).filter((g) => !!g);
  const path = `/nume/${n.slug}`;
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: `Numele de familie ${n.name}`, description: descOf(n.name),
        url: canonicalUrl(path), mainEntityOfPage: canonicalUrl(path), inLanguage: "ro", about: { "@type": "Thing", name: `${n.name} (nume de familie)` },
        author: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL }, publisher: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL },
        image: `${SITE_URL}/api/card?nume=${n.slug}`,
      }} />
      <Breadcrumbs items={[{ name: "Nume de familie", path: "/nume" }, { name: n.name, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>{KIND_LABEL[n.kind]}</div>
        <h1>Numele de familie {n.name}</h1>
        <div className="facts">
          <div><b>Regiuni</b>{n.regions.length ? n.regions.map((r) => REGIONS[r].name).join(", ") : "toată țara"}</div>
          <div><b>Se mai scrie</b>{n.variants.length ? n.variants.join(", ") : "—"}</div>
          {stat && <div><b>În Cartea Neamului</b>peste {stat.personsAtLeast} de persoane, în {stat.trees} arbori</div>}
        </div>
        <h2>Originea și semnificația</h2>
        <p>{renderEm(t.origin)}</p>
        <p>{t.kindText}</p>
        {t.note && <p className="prose-note">{renderEm(t.note)}</p>}
        <h2>Unde e mai des întâlnit</h2>
        <p>{t.where}</p>
        {n.variants.length > 0 && (
          <>
            <h2>Variante de scriere</h2>
            <p>În acte și în bazele de date, numele {n.name} poate apărea și ca: {n.variants.map((v, i) => <span key={v}>{i ? ", " : ""}<b>{v}</b></span>)}. Caută și forma fără diacritice; vezi <Link href="/ghid/nume-schimbate-si-variante">de ce se scriu numele diferit</Link>.</p>
          </>
        )}
        <h2>Cum cauți familia {n.name} în arhive</h2>
        {t.civil.map((c) => <p key={c}>{c}</p>)}
        <ul>{t.tips.map((x) => <li key={x}>{renderEm(x)}</li>)}</ul>
        {stat && <p className="muted small">Cifra din Cartea Neamului e un total anonim al arborilor de pe platformă, arătat doar de la {MIN_TREES} arbori în sus, fără nicio dată despre o persoană anume.</p>}
      </article>
      {guides.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Ghiduri utile</h2>
          <ul className="hub-list">{guides.map((g) => <li key={g!.path}><Link href={g!.path}>{g!.title}</Link> <span className="muted">{g!.description}</span></li>)}</ul>
        </div>
      )}
      {related.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Nume înrudite</h2>
          <div className="chips">{related.map((r) => <Link key={r.slug} className="chip" href={`/nume/${r.slug}`}>{r.name}</Link>)}</div>
        </div>
      )}
      {growth.shareCards && <ShareCard url={canonicalUrl(path)} image={`/api/card?nume=${n.slug}`} campaign="card-nume"
        text={`Știai de unde vine numele ${n.name}? Uite ce înseamnă și unde găsești actele familiei:`} />}
      <CtaArbore title={`Începe arborele familiei ${n.name}`} text="Primele 7 zile sunt gratuite, fără card. Adaugi părinții și bunicii, iar rudele pot completa ce știu ele." />
      <p className="muted small" style={{ textAlign: "center" }}><Link href="/nume">← Toate numele de familie</Link></p>
    </section>
  );
}

/** *cuvânt* → cursiv, ca în fișierul de date. */
function renderEm(s: string) {
  return s.split(/(\*[^*]+\*)/g).map((part, i) => (part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <i key={i}>{part.slice(1, -1)}</i> : part));
}
