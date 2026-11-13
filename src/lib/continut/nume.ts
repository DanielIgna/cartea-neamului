import { readFileSync } from "node:fs";
import path from "node:path";
import { REGIONS, REGION_SOURCES, isRegion, type RegionKey } from "./regiuni";

/**
 * Numele de familie pentru paginile /nume/<slug>, din content/nume/nume.json (scris de mână, păstrat în repo).
 * Textul fiecărei pagini se compune din câmpurile numelui (sens, fel, regiuni, variante, notă) și din regulile de mai jos,
 * fără nimic inventat: unde nu se știe sigur, fișierul o spune, iar fără regiuni pagina spune „în toată țara”.
 */
export type NameKind = "functie" | "patronimic" | "prenume" | "loc" | "etnic" | "meserie" | "porecla";
export type Surname = { slug: string; name: string; kind: NameKind; meaning: string; regions: RegionKey[]; variants: string[]; note?: string };

export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

let cache: Surname[] | null = null;
export function loadNames(): Surname[] {
  if (cache) return cache;
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), "content", "nume", "nume.json"), "utf8")) as { nume: Surname[] };
  cache = raw.nume.map((n) => ({ ...n, regions: n.regions.filter(isRegion) })).sort((a, b) => a.name.localeCompare(b.name, "ro"));
  return cache;
}
export const getName = (slug: string) => loadNames().find((n) => n.slug === slug) ?? null;

/** Data ultimei schimbări a fișierului de nume (pentru sitemap); o schimbăm de mână când adăugăm nume. */
export const NAMES_UPDATED = new Date("2026-11-13T00:00:00Z");

export const KIND_LABEL: Record<NameKind, string> = {
  functie: "Nume după o funcție sau o slujbă",
  patronimic: "Nume după tată (patronimic)",
  prenume: "Nume după un prenume",
  loc: "Nume după locul de origine",
  etnic: "Nume după un popor",
  meserie: "Nume după o meserie",
  porecla: "Nume după o poreclă",
};

const KIND_TEXT: Record<NameKind, string> = {
  functie: "Numele de acest fel arată o slujbă sau o funcție a unui strămoș, în sat, în biserică sau la curte. Nu înseamnă că toți purtătorii lui coboară din același om: același nume a apărut independent în multe locuri.",
  patronimic: "Numele de acest fel s-au format din prenumele unui strămoș, adesea al tatălui sau al bunicului. S-au fixat ca nume de familie mai ales în secolul al XIX-lea, când actele au început să ceară un nume statornic.",
  prenume: "Multe nume de familie românești sunt la origine prenume: oamenii erau numiți „Ion al lui Radu”, iar cu timpul prenumele tatălui a rămas nume pentru toată familia. De aceea, același nume apare în multe sate fără ca familiile să fie înrudite.",
  loc: "Numele după locul de origine îl primea de obicei cel venit din altă parte: satul nou îl numea după ținutul de unde venise. De aceea numele arată adesea locul de unde a plecat familia, nu unde trăiește azi.",
  etnic: "Numele de acest fel nu dovedesc singure originea etnică a familiei: puteau fi date ca poreclă, după o călătorie, o slujbă sau o legătură cu acel popor.",
  meserie: "Numele după meserie sunt printre cele mai vechi porecle de familie: satul îl deosebea pe om după ce lucra. Aceeași meserie a dat nume în multe locuri, așa că familiile cu acest nume nu sunt neapărat înrudite.",
  porecla: "Poreclele erau felul satului de a deosebi oameni cu același nume. Multe s-au transmis copiilor și au devenit nume de familie trecute în acte.",
};

const KIND_TIP: Record<NameKind, string> = {
  functie: "Dacă numele vine de la o slujbă bisericească, caută și în listele de preoți și slujitori ale parohiei sau ale protopopiatului: un strămoș cu acest nume poate apărea acolo.",
  patronimic: "În generațiile mai vechi, numele poate lipsi: strămoșii pot apărea cu prenumele tatălui în loc de nume de familie. Urmărește prenumele părinților, nu doar numele.",
  prenume: "Pentru că numele vine dintr-un prenume, în registrele vechi îl poți confunda cu prenumele cuiva. Citește atent rubrica: numele de familie e de obicei scris primul în registrele maghiare și uneori în cele latinești.",
  loc: "Dacă numele arată un loc de origine, s-ar putea ca familia să fi venit de acolo cu câteva generații în urmă. Când registrele satului se opresc, caută în regiunea din nume.",
  etnic: "Caută și forma tradusă a numelui în limba documentului (maghiară, germană, latină): funcționarii o traduceau uneori.",
  meserie: "Meseria din nume poate fi tradusă în actele vechi (în maghiară sau germană), așa că aceeași familie poate apărea cu un nume diferit. Încearcă și traducerea.",
  porecla: "Poreclele se scriau diferit de la un preot la altul. Întreabă bătrânii din sat cum se spunea neamului: porecla vie poate lega familiile din registre.",
};

const listRo = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} și ${xs[xs.length - 1]}`);

/** Textul paginii unui nume, în bucăți (paragrafe și liste). */
export function nameText(n: Surname) {
  const regions = n.regions.map((r) => REGIONS[r]);
  const groups = [...new Set(regions.map((r) => r.group))];
  const where = regions.length
    ? `Numele ${n.name} apare mai des ${listRo(regions.map((r) => r.in.replace(/^în /, "")).map((x, i) => (i === 0 ? `în ${x}` : x)))}, deși se întâlnește și în alte părți ale țării. Familiile cu acest nume nu coboară neapărat din același strămoș.`
    : `Numele ${n.name} se întâlnește în mai multe regiuni ale țării. Familiile cu acest nume nu coboară neapărat din același strămoș.`;
  const sources = (groups.length ? groups : (["vest", "regat"] as const)).map((g) => REGION_SOURCES[g]);
  const tips = [...new Set(sources.flatMap((s) => s.tips))].slice(0, 4);
  const guides = [...new Set(sources.flatMap((s) => s.guides))].slice(0, 4);
  return {
    origin: n.meaning, kindText: KIND_TEXT[n.kind], note: n.note ?? null, where,
    civil: sources.map((s) => s.civil),
    tips: [KIND_TIP[n.kind], ...tips],
    guides,
  };
}

/** Nume înrudite: același fel, o regiune comună, apoi același fel (cel mult 8). */
export function relatedNames(n: Surname, max = 8): Surname[] {
  const all = loadNames().filter((x) => x.slug !== n.slug);
  const variantSet = new Set(n.variants.map(fold));
  // Rădăcina numelui (Pop, Popa, Popescu, Popovici → „pop”), ca să apară întâi numele din aceeași familie de cuvinte.
  const stem = (s: string) => fold(s).replace(/(escu|eanu|ean|ovici|ache|iu|ul|ea|u|a)$/, "");
  const own = stem(n.name);
  const score = (x: Surname) => (variantSet.has(fold(x.name)) || x.variants.some((v) => fold(v) === fold(n.name)) ? 4 : 0)
    + (own.length >= 3 && stem(x.name) === own ? 3 : 0)
    + (x.kind === n.kind ? 2 : 0) + (x.regions.some((r) => n.regions.includes(r)) ? 1 : 0);
  return all.map((x) => [score(x), x] as const).filter(([s]) => s >= 2).sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name, "ro")).slice(0, max).map(([, x]) => x);
}

/** Numele frecvente într-o regiune (pentru paginile de localități). */
export const namesInRegion = (r: RegionKey) => loadNames().filter((n) => n.regions.includes(r));
