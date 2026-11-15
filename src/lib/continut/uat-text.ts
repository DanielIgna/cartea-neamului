import { getCounty, type County } from "./localitati";
import { REGIONS, REGION_SOURCES } from "./regiuni";
import { KIND_NAME, countySeatUat, direction, distanceKm, loadUats, nearestTown, neighbours, rankInCounty, type Uat } from "./uat";
import { plainPlace } from "@/lib/place-key";

/** Bucățile de text ale paginilor de localități, fără server (le folosesc și Centrul SEO și testele). */
/** „1 locuitor”, „19 locuitori”, „20 de locuitori”, „1.234 de locuitori”. */
export function countOf(n: number, one: string, many: string) {
  const r = n % 100;
  return n === 1 ? `1 ${one}` : `${n.toLocaleString("ro-RO")} ${n >= 20 && (r === 0 || r >= 20) ? "de " : ""}${many}`;
}
export const km = (x: number) => (x < 10 ? x.toFixed(1).replace(".", ",") : String(Math.round(x)));
export const listRo = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} și ${xs[xs.length - 1]}`);

export const uatTitle = (u: Uat, c: County) => `${KIND_NAME[u.kind].title} ${u.name} (${c.name}): acte vechi, arhive, sate | Cartea Neamului`;
export function uatDescription(u: Uat, c: County) {
  const others = u.villages.filter((v) => !v.seat).map((v) => v.name);
  const what = u.kind === "c"
    ? (others.length ? `satele ${listRo(u.villages.slice(0, 4).map((v) => v.name))}${u.villages.length > 4 ? " și altele" : ""}` : `satul ${u.villages[0].name}`)
    : `${countOf(u.pop, "locuitor", "locuitori")}`;
  const d = `Unde cauți actele strămoșilor din ${u.name}, județul ${c.name}: ${what}, arhiva județului, registrele vechi și localitățile vecine.`;
  return d.length <= 165 ? d : `Unde cauți actele strămoșilor din ${u.name}, județul ${c.name}: satele, arhiva județului, registrele vechi și localitățile vecine.`;
}


/** Ce spun datele despre loc: mărime, sate, poziție. Propozițiile se aleg după date, nu sunt aceleași pe toate paginile. */
export function uatIntro(u: Uat, c: County): string[] {
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
let nameIndex: { uats: Map<string, Uat[]>; villages: Map<string, number> } | null = null;
function names() {
  if (nameIndex) return nameIndex;
  const uats = new Map<string, Uat[]>(), villages = new Map<string, number>();
  for (const x of loadUats()) {
    const k = plainPlace(x.name);
    uats.set(k, [...(uats.get(k) ?? []), x]);
    for (const v of x.villages) { const vk = plainPlace(v.name); villages.set(vk, (villages.get(vk) ?? 0) + 1); }
  }
  return (nameIndex = { uats, villages });
}
export function uatSameName(u: Uat) {
  const key = plainPlace(u.name);
  const idx = names();
  const own = u.villages.filter((v) => plainPlace(v.name) === key).length;
  return { uats: (idx.uats.get(key) ?? []).filter((x) => x !== u), villages: (idx.villages.get(key) ?? 0) - own };
}


/**
 * Textul paginii unei localități, ca rânduri simple, pentru controlul de calitate al motorului de publicare (src/lib/motor-seo):
 * aceleași propoziții ca pe pagină, fără meniuri. „facts” sunt datele proprii paginii, numărate de control.
 */
export function uatPageText(u: Uat, c: County, stat?: { trees: number; surnames: { name: string }[] } | null) {
  const k = KIND_NAME[u.kind];
  const seat = u.villages.find((v) => v.seat) ?? u.villages[0];
  const groups = [...new Set(c.regions.map((r) => REGIONS[r].group))].map((g) => REGION_SOURCES[g]);
  const near = neighbours(u, 8);
  const same = uatSameName(u);
  const lines: string[] = [
    `Acte vechi și arhive pentru ${u.name}, județul ${c.name}`,
    ...uatIntro(u, c),
    `Acte din ultimii aproximativ 100 de ani (naștere, căsătorie, deces): serviciul de stare civilă de la primăria ${u.kind === "c" ? "comunei" : u.kind === "m" ? "municipiului" : "orașului"} ${u.name}.`,
    `Acte mai vechi: ${c.archive}, unde ajung registrele după aproximativ un secol; caută după ${u.kind === "c" && u.villages.length > 1 ? `numele satului (${seat.name} sau celelalte)` : `numele ${u.name}`}.`,
    u.villages.length > 2 ? "Registrele bisericești: satele mai mari aveau de obicei parohia lor, iar cele mici erau trecute la parohia unui sat vecin; află mai întâi de ce parohie ținea satul familiei."
      : "Registrele bisericești: află de ce parohie ținea familia și ce confesiune avea; fiecare confesiune își ținea registrele separat.",
    ...groups.map((g) => g.civil),
    ...u.villages.map((v) => `${v.name}${v.seat ? " (reședința)" : ""}`),
    ...(same.uats.length || same.villages ? [`Mai există ${same.uats.length} unități și ${same.villages} sate cu numele ${u.name}: ${same.uats.slice(0, 8).map((x) => `${x.name} (${getCounty(x.countySlug)?.name})`).join(", ")}. Când un act scrie doar „${u.name}”, verifică județul.`] : []),
    ...(stat ? [`${stat.trees} arbori de familie din Cartea Neamului au strămoși de aici.`, ...stat.surnames.map((s) => s.name)] : []),
    ...near.map((x) => `${x.u.name}, ${km(x.km)} km spre ${direction(x.u, u)}`),
  ];
  const facts = [
    { label: "populația din 2021", ok: u.pop > 0 },
    { label: "satele", ok: u.villages.length > 0 },
    { label: "locul în județ", ok: rankInCounty(u).of >= 3 },
    { label: "distanța față de reședință", ok: !!countySeatUat(c) && countySeatUat(c) !== u },
    { label: "cel mai apropiat oraș", ok: u.kind === "c" && !!nearestTown(u) },
    { label: "localitățile vecine", ok: near.length > 0 },
    { label: "localitățile cu același nume", ok: same.uats.length + same.villages > 0 },
    { label: "familii cu rădăcini aici", ok: !!stat },
  ].filter((f) => f.ok).map((f) => f.label);
  return { title: `${k.title} ${u.name}`, lines, facts };
}
