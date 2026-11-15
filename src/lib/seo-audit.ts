import { PRIVATE_PREFIXES, PUBLIC_PAGES } from "./public-pages";
import { loadCollection } from "./continut/colectii";
import { loadNames } from "./continut/nume";
import { countyPath, isCapital, loadCounties, seatPath } from "./continut/localitati";
import { NAME_MIN_WORDS, nameGate, nameOwnWords, uatGate } from "./continut/prag";
import { loadUats, uatPath } from "./continut/uat";
import { uatDescription, uatTitle } from "./continut/uat-text";
import { INDEX_LIMIT, sitemapGroups } from "./continut/sitemap";
import { clusterOf, type Cluster } from "./seo-clustere";
import { fitTitle } from "./page-metadata";

/**
 * Admin → SEO (Daniel, 14.11.2026, după modelul din PropManage): inventarul tuturor paginilor publice cunoscute, cu titlul,
 * descrierea, cuvintele și dacă intră sau nu în Google (pragul din src/lib/continut/prag.ts), plus verificările sitemap-ului și
 * alertele calculate din ele. Doar citiri din fișierele din repo, fără bază de date și fără Google.
 */

export type AuditPage = {
  path: string; cluster: Cluster; title: string; description: string | null;
  /** Cuvintele paginii (la ghiduri și glosar) sau cuvintele proprii (la nume), null unde nu le știm fără să deschidem pagina. */
  words: number | null;
  indexable: boolean; gate: string | null; inSitemap: boolean; category: string | null;
};

const SUFFIX = " | Cartea Neamului";

export function auditPages(): AuditPage[] {
  const inSitemap = new Set(sitemapGroups().flatMap((g) => g.urls.map((u) => u.path)));
  const out: AuditPage[] = [];
  const push = (p: Omit<AuditPage, "cluster" | "inSitemap">) => out.push({ ...p, title: fitTitle(p.title), cluster: clusterOf(p.path), inSitemap: inSitemap.has(p.path) });

  for (const p of PUBLIC_PAGES) push({ path: p.path, title: p.label, description: null, words: null, indexable: true, gate: null, category: null });
  for (const c of ["ghid", "glosar"] as const) {
    push({ path: `/${c}`, title: c === "ghid" ? "Ghiduri de genealogie" : "Glosar de genealogie", description: null, words: null, indexable: true, gate: null, category: "hub" });
    for (const e of loadCollection(c)) push({ path: e.path, title: e.seoTitle, description: e.description, words: e.words, indexable: true, gate: null, category: e.category });
  }
  push({ path: "/nume", title: "Nume de familie", description: null, words: null, indexable: true, gate: null, category: "hub" });
  for (const n of loadNames()) {
    const gate = nameGate(n);
    push({ path: `/nume/${n.slug}`, title: `Numele ${n.name}: origine, semnificație și arhive${SUFFIX}`, description: `Ce înseamnă numele de familie ${n.name}, de unde vine, unde e mai des întâlnit, cum se mai scrie și cum cauți familia ${n.name} în arhive.`, words: nameOwnWords(n), indexable: !gate, gate, category: null });
  }
  push({ path: "/localitati", title: "Localități", description: null, words: null, indexable: true, gate: null, category: "hub" });
  for (const c of loadCounties()) {
    push({ path: countyPath(c), title: isCapital(c) ? `București: arhive, registre și nume de familie${SUFFIX}` : `Județul ${c.name}: arhive, registre și nume de familie${SUFFIX}`, description: null, words: null, indexable: true, gate: null, category: "județ" });
    const sp = seatPath(c);
    if (sp) push({ path: sp, title: `${c.seat}: unde cauți actele strămoșilor${SUFFIX}`, description: null, words: null, indexable: true, gate: null, category: "oraș" });
    for (const u of loadUats().filter((x) => x.countySlug === c.slug && uatPath(x) !== sp)) {
      const gate = uatGate(u);
      push({ path: uatPath(u), title: uatTitle(u, c), description: uatDescription(u, c), words: null, indexable: !gate, gate, category: u.kind === "c" ? "comună" : "oraș" });
    }
  }
  return out;
}

/* ------------------------------ Sitemap-ul ------------------------------ */

export function sitemapCheck() {
  const groups = sitemapGroups();
  const all = groups.flatMap((g) => g.urls.map((u) => u.path));
  const seen = new Set<string>(), duplicates: string[] = [];
  for (const p of all) { if (seen.has(p)) duplicates.push(p); seen.add(p); }
  const privateIn = all.filter((p) => PRIVATE_PREFIXES.some((x) => p === x.replace(/\/$/, "") || p.startsWith(x.endsWith("/") ? x : `${x}/`)));
  const badSlugs = all.filter((p) => !/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/.test(p));
  return {
    total: all.length, isIndex: all.length > INDEX_LIMIT,
    groups: groups.map((g) => ({ name: g.name, label: g.label, count: g.urls.length, file: all.length > INDEX_LIMIT ? `/sitemaps/${g.name}.xml` : "/sitemap.xml" })),
    duplicates, privateIn, badSlugs, overLimit: groups.filter((g) => g.urls.length > 50_000).map((g) => g.name),
  };
}

/* ------------------------------ Alertele ------------------------------ */

export type Alert = { level: "critic" | "avertisment" | "info"; code: string; title: string; text: string; paths?: string[]; fix?: string };

export function auditAlerts(pages: AuditPage[], o: { gscState?: string; gscError?: { title: string; fix: string } | null; gscPages?: Map<string, { impressions: number; clicks: number; position: number }> } = {}): Alert[] {
  const out: Alert[] = [];
  const sm = sitemapCheck();
  if (sm.duplicates.length) out.push({ level: "critic", code: "SITEMAP_DUPLICAT", title: "Adrese de două ori în sitemap", text: `${sm.duplicates.length} adrese apar de mai multe ori.`, paths: sm.duplicates });
  if (sm.privateIn.length) out.push({ level: "critic", code: "SITEMAP_PRIVAT", title: "Pagini private în sitemap", text: "Sitemap-ul trimite Google spre pagini oprite în robots.txt.", paths: sm.privateIn });
  if (sm.badSlugs.length) out.push({ level: "avertisment", code: "ADRESA_CIUDATA", title: "Adrese cu litere mari, diacritice sau semne", text: "Adresele bune au doar litere mici fără diacritice, cifre și liniuțe.", paths: sm.badSlugs });

  if (o.gscState === "eroare" && o.gscError) out.push({ level: "critic", code: "GSC_EROARE", title: o.gscError.title, text: "Ultima întrebare la Search Console n-a mers, deci cuvintele cheie și indexarea nu se văd.", fix: o.gscError.fix });
  else if (o.gscState === "fara-cheie") out.push({ level: "avertisment", code: "GSC_NELEGAT", title: "Search Console nu e legat la panou", text: "Sitemap-ul e deja în Google, dar cuvintele căutate, afișările și starea indexării apar aici doar după legare.", fix: "Urmează pașii din fila Setări (o singură dată, cam 15 minute)." });
  else if (o.gscState === "fara-acces") out.push({ level: "critic", code: "GSC_FARA_ACCES", title: "Cheia nu are acces la carteaneamului.ro", text: "Contul de serviciu nu e adăugat ca utilizator la proprietate.", fix: "Search Console → Setări → Utilizatori și permisiuni → adaugă adresa contului de serviciu cu permisiunea Complet." });

  const queued = pages.filter((p) => p.gate?.startsWith("în coada"));
  if (queued.length) out.push({ level: "info", code: "IN_COADA", title: "Pagini care așteaptă să intre în Google", text: `${queued.length} pagini de comune sunt deja în site, dar intră în Google pe rând, prin motorul de publicare, ca să nu apară dintr-odată mii de pagini noi.`, paths: queued.map((p) => p.path) });
  const gated = pages.filter((p) => p.gate && !p.gate.startsWith("în coada"));
  if (gated.length) out.push({ level: "info", code: "SUBTIRE_EXCLUS", title: "Pagini subțiri ținute în afara Google (corect)", text: `${gated.length} pagini au prea puțin conținut propriu (nume cu sub ${NAME_MIN_WORDS} cuvinte proprii, comune mici cu un singur sat): rămân în site, dar cu „noindex” și fără sitemap. Când primesc text propriu, intră singure.`, paths: gated.map((p) => p.path) });

  const titles = new Map<string, string[]>();
  for (const p of pages.filter((x) => x.indexable)) titles.set(p.title, [...(titles.get(p.title) ?? []), p.path]);
  const dupTitles = [...titles.values()].filter((v) => v.length > 1);
  if (dupTitles.length) out.push({ level: "avertisment", code: "TITLU_DUPLICAT", title: "Titluri la fel pe pagini diferite", text: `${dupTitles.length} titluri sunt folosite de mai multe pagini.`, paths: dupTitles.flat() });

  const longTitle = pages.filter((p) => p.indexable && p.title.length > 60 && p.category !== "hub");
  if (longTitle.length) out.push({ level: "info", code: "TITLU_LUNG", title: "Titluri lungi (peste 60 de semne)", text: "Google le taie în rezultate. Nu e o greșeală, dar cuvântul important trebuie să fie la început.", paths: longTitle.map((p) => p.path) });

  const badDesc = pages.filter((p) => p.indexable && p.description != null && (p.description.length < 70 || p.description.length > 165));
  if (badDesc.length) out.push({ level: "avertisment", code: "DESCRIERE", title: "Descrieri prea scurte sau prea lungi", text: "Descrierea bună are 70–160 de semne.", paths: badDesc.map((p) => p.path) });

  const thinGuides = pages.filter((p) => p.cluster.key === "ghid" && p.words != null && p.words < 300);
  if (thinGuides.length) out.push({ level: "avertisment", code: "GHID_SCURT", title: "Ghiduri scurte (sub 300 de cuvinte)", text: "Un ghid scurt se clasează greu. Merită completat.", paths: thinGuides.map((p) => p.path) });

  if (o.gscPages) {
    const near = pages.filter((p) => { const g = o.gscPages!.get(p.path); return g && g.position > 8 && g.position <= 20 && g.impressions >= 20; });
    if (near.length) out.push({ level: "info", code: "APROAPE_PAGINA_1", title: "Pagini aproape de prima pagină Google (locul 8–20)", text: "Cu puțin text în plus și câteva legături din alte pagini, pot urca pe prima pagină.", paths: near.map((p) => p.path) });
    const lowCtr = pages.filter((p) => { const g = o.gscPages!.get(p.path); return g && g.impressions >= 100 && g.clicks / g.impressions < 0.01; });
    if (lowCtr.length) out.push({ level: "avertisment", code: "CTR_MIC", title: "Văzute des în Google, dar apăsate rar", text: "Sub 1% din afișări devin clicuri: titlul și descrierea pot fi mai clare.", paths: lowCtr.map((p) => p.path) });
  }
  const order = { critic: 0, avertisment: 1, info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
