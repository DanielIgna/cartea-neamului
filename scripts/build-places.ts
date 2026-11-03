/**
 * Generează gazetarul folosit de harta neamului (src/data/places). Se rulează rar, de mână, nu la publicare:
 *
 *   npx tsx scripts/build-places.ts <dosar cu pachetele despachetate>
 *
 * Dosarul trebuie să conțină, despachetate din npm (fiecare în <nume>/package/):
 *   - @nspot/geo-pack-romania-localities  → satele și localitățile componente (SIRUTA + punctul din OpenStreetMap)
 *   - @nspot/geo-pack-romania-uat         → comunele, orașele și municipiile (nume, județ, populație)
 *   - @nspot/geo-pack-romania             → contururile județelor (ANCPI), simplificate pentru hartă
 *   - cities.json                         → orașele din străinătate (GeoNames, peste 1000 de locuitori)
 * Licențele datelor sunt în src/data/places/README.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("Dă-mi dosarul cu pachetele despachetate.");
const out = join(process.cwd(), "src/data/places");
mkdirSync(join(out, "world"), { recursive: true });
const read = (p: string) => JSON.parse(readFileSync(join(dir, p), "utf8"));
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const r3 = (x: number) => Math.round(x * 1e3) / 1e3;

/* ---------- Comunele, orașele, municipiile ---------- */
type Feat = { geometry: { type: string; coordinates: any } | null; properties: any };
const uats: Feat[] = read("uat/package/pack.json").regions.features;
const KIND: Record<string, string> = { municipiu: "m", oras: "o", comuna: "c", sector: "s" };
const communes: [string, string, string, number][] = [];
const communeIdx = new Map<string, number>();
for (const f of uats) {
  const p = f.properties;
  if (p.level !== 2) continue;
  const county = String(p.slug).split("-").pop()!.toUpperCase();
  const kind = (p.tags as string[]).map((t) => KIND[t]).find(Boolean) ?? "c";
  communeIdx.set(p.slug, communes.length);
  communes.push([p.name, county, kind, Number(p.properties?.population_2021 ?? 0)]);
}

/* ---------- Satele și localitățile ---------- */
const locs: Feat[] = read("_nspot_geo-pack-romania-localities/package/pack.json").localities.features;
const places: [string, number, number, number, number, number][] = [];
let noPoint = 0;
for (const f of locs) {
  const p = f.properties;
  if (!f.geometry) { noPoint++; continue; }
  const [lng, lat] = f.geometry.coordinates as [number, number];
  const c = communeIdx.get(p.parent);
  if (c === undefined) throw new Error(`Comună necunoscută: ${p.parent}`);
  const seat = (p.tags as string[]).includes("resedinta") ? 1 : 0;
  places.push([p.name, r4(lng), r4(lat), c, seat, Number(p.code)]);
}
// Comunele al căror nume nu e și numele unui sat (rar) primesc punctul satului de reședință, ca să fie găsite după numele comunei.
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const named = new Set(places.map((p) => `${plain(p[0])}|${p[3]}`));
let aliases = 0;
communes.forEach(([name], ci) => {
  if (named.has(`${plain(name.replace(/^Municipiul /, ""))}|${ci}`)) return;
  const seat = places.find((p) => p[3] === ci && p[4] === 1) ?? places.find((p) => p[3] === ci);
  if (!seat) return;
  places.push([name.replace(/^Municipiul /, ""), seat[1], seat[2], ci, 2, seat[5]]);
  aliases++;
});
// Bucureștiul nu are localități proprii în SIRUTA (doar sectoare): îi punem punctul din centru, de la Universitate.
const buc = communes.findIndex((c) => c[1] === "B");
if (buc >= 0 && !places.some((p) => p[3] === buc)) places.push(["București", 26.1025, 44.4355, buc, 1, 179132]);
// Datele merg în module TypeScript cu câte un șir de text (o linie pe loc, câmpuri despărțite de tab): se încarcă repede
// și nu-l pun pe TypeScript să ghicească tipul unui JSON uriaș.
const HEAD = "// Generat de scripts/build-places.ts. Nu edita de mână. Licența datelor: src/data/places/README.md.\n";
const tsv = (rows: (string | number)[][]) => JSON.stringify(rows.map((r) => r.join("\t")).join("\n"));
writeFileSync(join(out, "ro.ts"), `${HEAD}// comuna: nume, județ, fel (m municipiu, o oraș, c comună), locuitori 2021\nexport const COMMUNES = ${tsv(communes)};\n` +
  `// localitate: nume, longitudine, latitudine, comuna (indice), 1 reședință / 2 numele comunei, cod SIRUTA\nexport const PLACES = ${tsv(places)};\n`);
console.log(`ro.ts: ${communes.length} comune/orașe, ${places.length} localități (${aliases} după numele comunei, ${noPoint} fără punct sărite)`);

/* ---------- Județele, simplificate (Douglas–Peucker, ~1 km) ---------- */
type Pt = [number, number];
function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-12;
    let worst = -1, at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > worst) { worst = d; at = i; }
    }
    if (worst > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const regions: Feat[] = read("_nspot_geo-pack-romania/package/pack.json").regions.features;
const judete = regions.filter((f) => (f.properties.tags as string[]).includes("judet") || f.properties.code === "RO-B").map((f) => {
  const polys: Pt[][][] = f.geometry!.type === "Polygon" ? [f.geometry!.coordinates] : f.geometry!.coordinates;
  // Un inel e închis (primul punct = ultimul), așa că îl tăiem în două la punctul cel mai depărtat și simplificăm fiecare jumătate.
  const ring = (pts: Pt[]) => {
    let m = 0, far = -1;
    pts.forEach(([x, y], i) => { const d = Math.hypot(x - pts[0][0], y - pts[0][1]); if (d > far) { far = d; m = i; } });
    return [...simplify(pts.slice(0, m + 1), 0.01).slice(0, -1), ...simplify(pts.slice(m), 0.01)];
  };
  const rings = polys.map((poly) => ring(poly[0]).map(([x, y]) => [r3(x), r3(y)] as Pt)).filter((r) => r.length >= 4);
  return { c: String(f.properties.code).replace("RO-", ""), n: f.properties.name, g: rings };
});
writeFileSync(join(out, "judete.json"), JSON.stringify(judete));
console.log(`judete.json: ${judete.length} județe, ${judete.reduce((s, j) => s + j.g.reduce((t, r) => t + r.length, 0), 0)} puncte`);

/* ---------- Orașele din străinătate (GeoNames) ---------- */
const WORLD = ["MD", "IT", "ES", "DE", "FR", "AT", "HU", "GB", "IE", "BE", "NL", "CH", "SE", "DK", "NO", "FI", "PT", "GR", "CY", "RS", "BG", "UA", "CZ", "PL",
  "IL", "US", "CA", "AU", "NZ", "AE", "SK", "HR", "SI", "LU", "MT"];
const cities: { name: string; lat: string; lng: string; country: string; admin1: string }[] = read("cities.json/package/cities.json");
const admin1 = new Map<string, string>((read("cities.json/package/admin1.json") as { code: string; name: string }[]).map((a) => [a.code, a.name]));
for (const cc of WORLD) {
  const regs: string[] = [], regIdx = new Map<string, number>();
  const rows = cities.filter((c) => c.country === cc).map((c) => {
    const reg = admin1.get(`${cc}.${c.admin1}`) ?? "";
    if (!regIdx.has(reg)) { regIdx.set(reg, regs.length); regs.push(reg); }
    return [c.name, r4(Number(c.lng)), r4(Number(c.lat)), regIdx.get(reg)!] as const;
  });
  writeFileSync(join(out, "world", `${cc}.ts`), `${HEAD}export const REGIONS = ${JSON.stringify(regs.join("\n"))};\n` +
    `// oraș: nume, longitudine, latitudine, regiunea (indice)\nexport const PLACES = ${tsv(rows as unknown as (string | number)[][])};\n`);
}
console.log(`world/: ${WORLD.length} țări`);
