import type { County } from "@/lib/continut/localitati";
import { KIND_NAME, type Uat } from "@/lib/continut/uat";

/**
 * Ce luăm din Wikipedia în română pentru o comună sau un oraș (Daniel, 14.11.2026: „Wikipedia rescris/rezumat, cu atribuire
 * CC BY-SA”). Nu copiem text: citim din articol doar date (populația la recensămintele trecute, structura etnică și confesională,
 * numele în maghiară și germană) și scriem noi propozițiile, cu trimitere la articol și la licență.
 * Articolele comunelor au aceeași formulare („Majoritatea locuitorilor sunt români (85,5%), cu o minoritate de…”), deci se pot citi
 * sigur; ce nu se potrivește tiparului e lăsat deoparte, nu ghicit.
 */
export type Share = [string, number];
export type WikiFacts = {
  title: string; url: string; revid: number | null;
  census: { year: number; pop: number; prevYear: number | null; prevPop: number | null } | null;
  ethnic: Share[]; confession: Share[];
  hu: string | null; de: string | null;
};

const WIKI = "https://ro.wikipedia.org";

/** Titlurile de încercat, în ordine (Wikipedia scrie „Comuna Sâncraiu, Cluj” când numele e purtat de mai multe comune). */
export function titlesFor(u: Uat, c: County): string[] {
  return u.kind === "c" ? [`Comuna ${u.name}, ${c.name}`, `Comuna ${u.name}`] : [`${u.name}, ${c.name}`, u.name];
}

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
const pct = (s: string) => Number(s.replace(",", "."));

/** Lista „români (85,5%), maghiari (10,1%) și romi (2%)” dintr-o propoziție. */
function shares(sentence: string): Share[] {
  const out: Share[] = [];
  for (const m of sentence.matchAll(/([a-zăâîșşțţ]+(?:-[a-zăâîșşțţ]+)?)\s*\((\d+(?:,\d+)?)\s*%\)/gi)) {
    const name = m[1].trim().toLowerCase();
    const v = pct(m[2]);
    if (name && v > 0 && v <= 100 && !out.some((x) => x[0] === name)) out.push([name, v]);
  }
  return out;
}

/** Citește datele din textul simplu al articolului (fără să ghicească ce nu e scris după tipar). */
export function parseWiki(text: string, title: string, revid: number | null = null): WikiFacts {
  const t = text.replace(/\s+/g, " ");
  const census = (() => {
    const m = t.match(/recensământului efectuat în (\d{4}), populația [^.]*? se ridică la ([\d.]+) (?:de )?locuitori/i);
    if (!m) return null;
    const prev = t.slice(m.index ?? 0, (m.index ?? 0) + 400).match(/recensământul anterior din (\d{4}), când fuseseră înregistrați ([\d.]+) (?:de )?locuitori/i);
    return { year: Number(m[1]), pop: num(m[2]), prevYear: prev ? Number(prev[1]) : null, prevPop: prev ? num(prev[2]) : null };
  })();
  const ethnicSentence = t.match(/Majoritatea locuitorilor sunt (?!ortodocși|romano-catolici|reformați|greco-catolici|baptiști|penticostali|unitarieni|luterani|evanghelici|musulmani)[^.]*?\([\d,]+\s*%\)[^.]*\./i)?.[0] ?? "";
  const confSentence = t.match(/(?:Din punct de vedere confesional|confesional)[^.]*?\([\d,]+\s*%\)[^.]*\./i)?.[0] ?? "";
  const hu = t.match(/\(\s*(?:în )?(?:limba )?maghiară:?\s+([A-ZÁÉÍÓÖŐÚÜŰ][^,;)]{2,40})/)?.[1]?.trim() ?? null;
  const de = t.match(/(?:în )?(?:limba )?germană:?\s+([A-ZÄÖÜ][^,;)]{2,40})/)?.[1]?.trim() ?? null;
  return {
    title, url: `${WIKI}/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`, revid,
    census, ethnic: shares(ethnicSentence), confession: shares(confSentence), hu, de,
  };
}

export const hasFacts = (f: WikiFacts | null | undefined) => !!f && (!!f.census || f.ethnic.length > 0 || f.confession.length > 0 || !!f.hu || !!f.de);

/** Aduce articolul (textul simplu) pentru primul titlu care există și e chiar despre localitatea din județul potrivit. */
export async function fetchWiki(u: Uat, c: County, fetcher: typeof fetch = fetch): Promise<WikiFacts | null> {
  for (const title of titlesFor(u, c)) {
    const url = `${WIKI}/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=extracts|revisions&rvprop=ids&explaintext=1&maxlag=5&titles=${encodeURIComponent(title)}`;
    const res = await fetcher(url, { headers: { "user-agent": "CarteaNeamului/1.0 (https://carteaneamului.ro/contact)" }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Wikipedia a răspuns ${res.status}`);
    const j = (await res.json()) as { query?: { pages?: { title: string; missing?: boolean; extract?: string; revisions?: { revid: number }[] }[] } };
    const p = j.query?.pages?.[0];
    if (!p || p.missing || !p.extract) continue;
    const intro = p.extract.slice(0, 1500);
    if (!intro.includes(c.name) || /poate să se refere la|se poate referi la/.test(intro)) continue; // altă localitate sau pagină de dezambiguizare
    return parseWiki(p.extract, p.title, p.revisions?.[0]?.revid ?? null);
  }
  return null;
}

const fmt = (n: number) => n.toLocaleString("ro-RO");
const p0 = (v: number) => `${v.toLocaleString("ro-RO", { maximumFractionDigits: 1 })}%`;

/** Ce înseamnă fiecare confesiune pentru cine caută acte (ce registre și ce ghid). */
const CONFESSION_TIP: [RegExp, string, string][] = [
  [/ortodocș/, "registrele parohiei ortodoxe", "/ghid/registrele-ortodoxe"],
  [/greco-catolic/, "registrele greco-catolice, de multe ori în latină sau română cu litere latine", "/ghid/registrele-greco-catolice"],
  [/romano-catolic/, "registrele romano-catolice, scrise mult timp în latină", "/ghid/registrele-catolice-si-protestante"],
  [/reformaț/, "registrele reformate (calvine), scrise de obicei în maghiară", "/ghid/registrele-catolice-si-protestante"],
  [/unitarien/, "registrele unitariene, în maghiară", "/ghid/registrele-catolice-si-protestante"],
  [/luteran|evanghelic/, "registrele evanghelice (luterane), de obicei în germană sau maghiară", "/ghid/registrele-catolice-si-protestante"],
  [/mozaic|evrei/, "registrele comunității evreiești", "/ghid/registrele-evreiesti"],
];
const ETHNIC_TIP: [RegExp, string][] = [
  [/maghiar/, "numele pot apărea în forma maghiară (de pildă cu numele de familie înaintea prenumelui)"],
  [/german|sas|șvab/, "numele și locurile pot apărea în forma germană"],
  [/ucrainen|ruteni/, "numele pot apărea în forma ucraineană sau scrise cu litere chirilice"],
  [/lipoven|ruș/, "registrele vechi ale comunității pot fi în rusă, cu litere chirilice"],
  [/turc|tătar/, "familiile musulmane au surse proprii, pe lângă registrele de stare civilă"],
  [/sârb/, "registrele parohiei sârbe pot fi în sârbă, cu litere chirilice"],
  [/slovac|ceh/, "registrele pot fi în slovacă, cehă sau latină"],
];

/** Propozițiile noastre, scrise din date, plus legăturile spre ghiduri. Fiecare apare doar dacă datele există. */
export function wikiLines(u: Uat, f: WikiFacts): { lines: string[]; guides: string[]; facts: string[] } {
  const lines: string[] = [], guides = new Set<string>(), facts: string[] = [];
  const what = u.kind === "c" ? "comuna" : u.kind === "m" ? "municipiul" : "orașul";
  if (f.census?.prevPop && f.census.prevYear) {
    const now = u.pop;
    // Articolele noi au deja recensământul din 2021 (atunci „anterior” e 2011); cele vechi se opresc la 2011.
    const series: [number, number][] = f.census.year >= 2021 ? [[f.census.prevYear, f.census.prevPop], [2021, now]] : [[f.census.prevYear, f.census.prevPop], [f.census.year, f.census.pop], [2021, now]];
    const first = series[0][1];
    const trend = now < first * 0.97 ? "a scăzut" : now > first * 1.03 ? "a crescut" : "a rămas aproape la fel";
    const change = first ? Math.round(((now - first) / first) * 100) : 0;
    lines.push(`Populația ${trend}${Math.abs(change) >= 3 ? ` cu ${Math.abs(change)}%` : ""}: ${series.map(([y, p]) => `${fmt(p)} de oameni în ${y}`).join(", ")}. ${trend === "a scăzut" ? "Mulți dintre cei plecați au rude rămase acolo, care știu încă poveștile familiei." : trend === "a crescut" && change > 30 ? "Mulți locuitori sunt veniți de curând; familiile vechi ale locului se găsesc mai ales în registrele de dinainte de 1990." : ""}`.trim());
    facts.push("populația la recensămintele trecute");
  }
  if (f.ethnic.length) {
    const [first, ...rest] = f.ethnic.filter((x) => !/necunoscut/.test(x[0]));
    if (first) {
      const known = f.ethnic.reduce((n, [, v]) => n + v, 0);
      lines.push(`La recensământul din ${f.census?.year ?? 2011}, ${first[1] >= 50 ? "majoritatea locuitorilor" : "cei mai mulți dintre locuitorii"} din ${what} ${u.name} s-au declarat ${first[0]} (${p0(first[1])})${rest.length ? `; au mai fost ${rest.slice(0, 3).map(([n, v]) => `${n} (${p0(v)})`).join(", ")}` : ""}${known < 95 ? `, iar ceilalți nu și-au declarat etnia` : ""}.`);
      const tips = f.ethnic.filter(([, v]) => v >= 5).flatMap(([n]) => ETHNIC_TIP.filter(([re]) => re.test(n)).map(([, t]) => t));
      if (tips.length) lines.push(`Pentru cine caută acte de aici: ${[...new Set(tips)].join("; ")}.`);
      facts.push("structura etnică");
    }
  }
  if (f.confession.length) {
    const parts = f.confession.filter(([, v]) => v >= 3).map(([n, v]) => {
      const tip = CONFESSION_TIP.find(([re]) => re.test(n));
      if (tip) guides.add(tip[2]);
      return tip ? `${n} (${p0(v)}), cu ${tip[1]}` : `${n} (${p0(v)})`;
    });
    if (parts.length) {
      lines.push(`Confesiunea contează pentru registrele vechi, pentru că fiecare biserică își ținea registrele ei. Aici, după recensământ: ${parts.join("; ")}.`);
      facts.push("structura confesională");
    }
  }
  const names = [f.hu && `în maghiară ${f.hu}`, f.de && `în germană ${f.de}`].filter(Boolean);
  if (names.length) {
    lines.push(`În actele vechi, ${u.name} poate apărea și cu alt nume: ${names.join(", ")}. Caută și sub aceste forme în registre și pe hărțile vechi.`);
    facts.push("numele vechi, în alte limbi");
  }
  return { lines, guides: [...guides], facts };
}

export const wikiAttribution = (f: WikiFacts) => ({ text: `Date din articolul Wikipedia „${f.title}”, rezumate de noi; licență CC BY-SA 4.0.`, url: f.url, license: "https://creativecommons.org/licenses/by-sa/4.0/deed.ro" });
export const kindWord = (u: Uat) => KIND_NAME[u.kind].one;
