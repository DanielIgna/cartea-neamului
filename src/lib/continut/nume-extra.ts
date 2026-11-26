import { loadCounties } from "./localitati";
import { KIND_LABEL, loadNames, nameText, type NameKind, type Surname } from "./nume";
import { nameProfile } from "./nume-profil";
import { REGIONS, type RegionKey } from "./regiuni";
import { GEN_REGIONS } from "@/lib/genealogie-regiuni";
import { scorePages, type PageText, type QualityScore } from "@/lib/seo/quality";

/**
 * Îmbogățirea paginilor de nume (planul SEO, etapa 4, 18.11.2026), doar din datele sigure ale fiecărui nume:
 * titlul și descrierea după felul numelui, întrebările frecvente, actele în care apare de obicei (după regiune),
 * 2 ghiduri ale regiunii și scorul de calitate (src/lib/seo/quality.ts). Nu inventăm purtători, date sau cifre.
 */

const listRo = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} și ${xs[xs.length - 1]}`);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const plainMeaning = (n: Surname) => n.meaning.replace(/[*_]/g, "");

/**
 * Titlul, ales după felul numelui (fără același tipar pe toate paginile); „| Cartea Neamului” se adaugă după.
 * Numele stă primul, ca în căutare („Covaci ce înseamnă”), urmat de „numele de familie” (26.11.2026: pagini la locul 5–9 fără
 * clicuri). Dacă iese peste 60 de caractere, rămâne forma scurtă.
 */
const TITLE: Record<NameKind, string> = {
  prenume: "din ce prenume vine", patronimic: "al cui fiu arată", loc: "ce loc de origine arată", meserie: "ce meserie arată",
  functie: "ce slujbă arată", porecla: "de unde vine porecla", etnic: "de unde vine",
};
const titleOf = (n: Surname) => [
  `${n.name}: ce înseamnă numele de familie și ${TITLE[n.kind]}`,
  `${n.name}: ce înseamnă numele și ${TITLE[n.kind]}`,
  `Numele ${n.name}: ce înseamnă și de unde vine`,
].find((t) => t.length <= 60) ?? `Numele ${n.name}: ce înseamnă`;
export const nameTitle = (n: Surname) => `${titleOf(n)} | Cartea Neamului`;

/** Descrierea, cu o variantă și regiunea, între 120 și 155 de caractere (prima formă care încape). */
export function nameDescription(n: Surname): string {
  const vs = [n.variants[0] ? ` (scris și ${n.variants[0]})` : "", ""];
  const regs = [n.regions.length ? `, de ce e frecvent în ${listRo(n.regions.slice(0, 2).map((r) => REGIONS[r].name))}` : "", ""];
  const tails = ["", " Cu întrebări frecvente și ghiduri.", " Cu variante, întrebări frecvente și ghiduri pe regiuni."];
  const all: string[] = [];
  for (const v of vs) for (const reg of regs) for (const tail of tails) all.push(`Ce înseamnă numele ${n.name}${v}, de unde vine${reg} și cum cauți familia ${n.name} în arhive.${tail}`);
  return all.find((d) => d.length >= 120 && d.length <= 155) ?? all.find((d) => d.length <= 155) ?? all[all.length - 1];
}

/** Județele regiunilor în care numele e mai frecvent. */
export const nameCounties = (n: Surname) => loadCounties().filter((c) => c.regions.some((r) => n.regions.includes(r)));

/** Actele în care apare de obicei o familie, după regiunea istorică (aceleași fapte ca în paginile regionale). */
const RECORDS: Record<RegionKey, string> = {
  transilvania: "în Transilvania: registrele parohiale ale fiecărei confesiuni, starea civilă în maghiară dintre 1895 și 1918, conscripțiile și urbariile din secolele XVIII–XIX și cartea funciară",
  banat: "în Banat: registrele parohiale în română, sârbă, germană sau latină, starea civilă în maghiară dintre 1895 și 1918 și, în satele grănicerești, actele regimentului de graniță",
  crisana: "în Crișana: registrele ortodoxe, greco-catolice și reformate, starea civilă în maghiară dintre 1895 și 1918, conscripția din 1828 și urbariile",
  maramures: "în Maramureș: registrele greco-catolice și ortodoxe, starea civilă în maghiară dintre 1895 și 1918 și conscripțiile comitatului",
  moldova: "în Moldova: registrele de stare civilă ținute de preoți din anii 1830, catagrafiile (recensămintele fiscale pe sate) și listele de împroprietărire din 1864",
  bucovina: "în Bucovina: registrele bisericești din vremea austriacă (1775–1918), în română, germană, latină sau ucraineană, și conscripțiile austriece",
  muntenia: "în Muntenia: registrele din anii 1830 ținute de preoți, catagrafiile din 1831 și 1838, actele moșnenilor și listele de împroprietărire",
  oltenia: "în Oltenia: registrele din anii 1830, catagrafiile din 1831 și 1838 și actele moșiilor de moșneni, împărțite pe „bătrâni”",
  dobrogea: "în Dobrogea: registrele de stare civilă românești de după 1878 și registrele comunităților, multe aduse din satele de origine ale coloniștilor",
};

export function nameRecords(n: Surname): string[] {
  if (!n.regions.length) return [`Pentru că ${n.name} se întâlnește în toată țara, actele familiei depind de locul de unde vine ea. Pornește de la satul trecut în cel mai vechi act pe care îl ai și află din ce regiune istorică ține: fiecare regiune are alte registre, păstrate în alte limbi.`];
  return n.regions.map((r) => `O familie ${n.name} din ${REGIONS[r].name} apare de obicei ${RECORDS[r].replace(/^în [^:]+: /, "în ")}.`);
}

/** Două ghiduri ale regiunii (din paginile regionale), pentru „Ghiduri utile”. */
export function nameRegionGuides(n: Surname): string[] {
  const out: string[] = [];
  for (const r of n.regions) for (const g of GEN_REGIONS.find((x) => x.slug === r)?.guides ?? []) if (!out.includes(g)) { out.push(g); break; }
  for (const r of n.regions) for (const g of GEN_REGIONS.find((x) => x.slug === r)?.guides ?? []) if (out.length < 2 && !out.includes(g)) out.push(g);
  return out.slice(0, 2);
}

/** Întrebările frecvente ale paginii, cu răspunsuri din datele numelui. */
export function nameFaq(n: Surname): { q: string; a: string }[] {
  const counties = nameCounties(n).map((c) => c.name);
  const out = [
    { q: `Ce înseamnă numele ${n.name}?`, a: plainMeaning(n) },
    { q: `De unde vine numele ${n.name}?`, a: `${n.name} e un ${lower(KIND_LABEL[n.kind])}. ${n.regions.length ? `În lista noastră apare mai des în ${listRo(n.regions.map((r) => REGIONS[r].name))}.` : "Se întâlnește în toată țara, fără o regiune anume."} Familia ta poate avea însă o istorie proprie: doar actele arată de unde a venit.` },
  ];
  if (n.variants.length) out.push({ q: `Cum se mai scrie ${n.name} în actele vechi?`, a: `Și ca ${listRo(n.variants)}. În registre, numele se scria după cum îl auzea preotul sau funcționarul și în limba actului, așa că merită căutate toate formele.` });
  if (counties.length) out.push({ q: `În ce județe e frecvent numele ${n.name}?`, a: `În județele regiunilor unde numele e mai des întâlnit: ${listRo(counties)}. Lista e făcută după regiune, nu după o numărătoare a purtătorilor.` });
  return out;
}

/** Tot textul vizibil al paginii de nume, pentru scorul de calitate. */
export function namePageText(n: Surname): PageText {
  const t = nameText(n);
  const faq = nameFaq(n);
  const paragraphs = [
    t.origin, t.kindText, t.note ?? "", ...(n.story ?? []), ...nameProfile(n), t.where, ...nameRecords(n),
    ...(n.variants.length ? [`În acte și în bazele de date, numele ${n.name} poate apărea și ca: ${n.variants.join(", ")}. Caută și forma fără diacritice.`] : []),
    ...t.civil, ...t.tips, ...faq.flatMap((f) => [f.q, f.a]),
  ].filter(Boolean);
  const facts = 1 + n.variants.length + n.regions.length + nameCounties(n).length + (n.note ? 1 : 0);
  return { path: `/nume/${n.slug}`, names: [n.name, ...n.variants], paragraphs, facts, links: n.regions.length + nameCounties(n).length + 4, faq: faq.length };
}

let cache: Map<string, QualityScore> | null = null;
/** Scorul fiecărei pagini de nume (calculat o dată, din toate paginile, ca să știm ce fraze se repetă). */
export function nameQuality(n: Surname): QualityScore {
  cache ??= scorePages(loadNames().map(namePageText));
  return cache.get(`/nume/${n.slug}`)!;
}
