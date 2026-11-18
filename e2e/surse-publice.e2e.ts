/**
 * Verificare cap-coadă pentru „Surse publice”, în browser (Playwright), pe aplicația pornită local cu baza de probă.
 *
 *   PGLITE_DIR=.data/pg-e2e npm run db:seed
 *   PGLITE_DIR=.data/pg-e2e npx tsx e2e/surse-publice.e2e.ts --prep      (alege persoanele de probă; serverul încă oprit)
 *   npm run build && PGLITE_DIR=.data/pg-e2e npx next start -p 3100
 *   npx tsx e2e/surse-publice.e2e.ts [http://localhost:3100]
 *
 * Verifică: cardul apare la un strămoș de dinainte de 1930 cu date lipsă și nu apare la cineva născut după 1930; linkurile se
 * deschid în filă nouă, fără date din arbore în adresă; „Copiază datele”; „Am găsit ceva” → „Sursa informației” salvată;
 * „Nu mai arăta” ținut și după reîncărcare; pagina /surse-publice (titlu, Article) și sitemap.xml. Nu trimite niciun email.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const PREP = ".data/e2e-surse.json";
type Prep = { treeId: string; old: { id: string; name: string; given: string; place: string | null; year: number | null }; young: { id: string; name: string } };

if (process.argv.includes("--prep")) {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { tree, person, relationship } = await import("../src/db/schema");
  const { aratamSugestia } = await import("../src/lib/surse-publice");
  const { parseFuzzyDate } = await import("../src/lib/dates");
  const [t] = await db.select().from(tree).where(eq(tree.name, "Neamul Pop din Ieud"));
  const people = await db.select().from(person).where(eq(person.treeId, t.id));
  const rels = await db.select().from(relationship).where(eq(relationship.treeId, t.id));
  const year = (p: (typeof people)[number]) => parseFuzzyDate(p.birthDateText).year;
  const parents = (id: string) => rels.filter((r) => r.type === "parent_child" && r.personB === id).length;
  const partners = (id: string) => rels.filter((r) => r.type === "partnership" && (r.personA === id || r.personB === id)).length;
  const old = people.find((p) => p.birthPlace && /ieud/i.test(p.birthPlace) && aratamSugestia({ givenName: p.givenName, surname: p.surname, birthYear: year(p), birthPlace: p.birthPlace,
    living: p.living, deathText: p.deathDateText, parents: parents(p.id), partners: partners(p.id) }));
  const young = people.find((p) => (year(p) ?? 0) >= 1930);
  if (!old || !young) throw new Error("n-am găsit persoanele de probă");
  const prep: Prep = { treeId: t.id, old: { id: old.id, name: `${old.givenName} ${old.surname}`, given: old.givenName, place: old.birthPlace, year: year(old) }, young: { id: young.id, name: `${young.givenName} ${young.surname}` } };
  writeFileSync(PREP, JSON.stringify(prep, null, 2));
  console.log("prep:", prep);
  process.exit(0);
}

// Playwright nu e în dependențele proiectului: se ia cel instalat pe mașină (require, ca să-l găsească și global).
const { chromium } = createRequire(import.meta.url)("playwright") as typeof import("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const prep = JSON.parse(readFileSync(PREP, "utf8")) as Prep;
const results: [string, boolean, string][] = [];
const ok = (name: string, pass: boolean, detail = "") => { results.push([name, pass, detail]); console.log(`${pass ? "✔" : "✘"} ${name}${detail ? `: ${detail}` : ""}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE, locale: "ro-RO", viewport: { width: 1280, height: 900 } });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
await ctx.addCookies([{ name: "limba", value: "ro", url: BASE }]);
const page = await ctx.newPage();

// Intrarea în contul demo (prin API, ca la e2e-neon.ts), apoi cookie-urile în browser.
const login = await page.request.post("/api/auth/sign-in/email", { data: { email: "demo@cartea-neamului.ro", password: "demo-parola-123" }, headers: { origin: BASE } });
ok("Intrare în contul demo", login.ok(), `HTTP ${login.status()}`);

// 1. Cardul apare la strămoșul de dinainte de 1930 cu date lipsă
await page.goto(`/arbore/${prep.treeId}?p=${prep.old.id}`);
const card = page.getByTestId("archive-hint");
await card.waitFor({ timeout: 20000 }).catch(() => undefined);
ok("Cardul apare la strămoș", await card.isVisible(), prep.old.name);
const links = card.locator("a[target=_blank]").filter({ hasNotText: "Toate" });
const first = links.first();
ok("Ieud (Maramureș) → HPDT primul", (await first.getAttribute("href")) === "https://hpdt.ro/", String(await first.getAttribute("href")));
let clean = true;
for (const a of await links.all()) {
  const href = (await a.getAttribute("href")) ?? "", rel = (await a.getAttribute("rel")) ?? "";
  if (!rel.includes("noopener") || !rel.includes("noreferrer")) clean = false;
  if (href.includes(encodeURIComponent(prep.old.given)) || href.includes(prep.old.given) || (prep.old.place && href.includes(prep.old.place))) clean = false;
}
ok("Linkuri în filă nouă, rel=noopener noreferrer, fără date din arbore", clean, `${await links.count()} linkuri`);
ok("Mențiunea HPDT e afișată", (await card.textContent())?.includes("Historical Population Database of Transylvania") ?? false);

// 2. Copiază datele
await card.getByRole("button", { name: "Copiază datele" }).click();
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
ok("„Copiază datele” pune numele, prenumele, locul și anul", clip.includes(`Prenume: ${prep.old.given}`) && (!prep.old.place || clip.includes(prep.old.place)) && (prep.old.year === null || clip.includes(String(prep.old.year))), JSON.stringify(clip));
ok("Mesajul de confirmare", await page.getByText("Am copiat datele").isVisible());

// 3. Am găsit ceva → Sursa informației
await card.getByRole("button", { name: "Am găsit ceva" }).click();
const src = page.locator("input[name=infoSource]");
await src.waitFor({ timeout: 10000 });
ok("„Am găsit ceva” deschide editarea, cu cursorul la „Sursa informației”", await src.evaluate((el) => el === document.activeElement));
await src.fill("Registrul de botezuri Ieud, 1885 (HPDT)");
await page.locator("input[name=infoSourceUrl]").fill("https://hpdt.ro/");
await page.getByRole("button", { name: "Salvează" }).click();
const shown = page.getByTestId("info-source");
await shown.first().waitFor({ timeout: 15000 }).catch(() => undefined);
ok("„Sursa informației” se salvează și se vede în fișă", (await shown.first().textContent())?.includes("Registrul de botezuri Ieud") ?? false, (await shown.first().textContent()) ?? "");

// 4. Nu mai arăta, ținut după reîncărcare
await page.goto(`/arbore/${prep.treeId}?p=${prep.old.id}`);
await card.waitFor({ timeout: 20000 });
await card.getByRole("button", { name: "Nu mai arăta" }).click();
await page.getByText("nu mai arătăm sugestia").waitFor({ timeout: 10000 }).catch(() => undefined);
ok("„Nu mai arăta” ascunde cardul", !(await card.isVisible()));
await page.reload();
await page.waitForLoadState("networkidle").catch(() => undefined);
ok("…și rămâne ascuns după reîncărcare", (await card.count()) === 0);

// 5. Nu apare la cineva născut după 1930
await page.goto(`/arbore/${prep.treeId}?p=${prep.young.id}`);
await page.waitForLoadState("networkidle").catch(() => undefined);
ok("Cardul nu apare la cineva născut după 1930", (await card.count()) === 0, prep.young.name);
await page.screenshot({ path: ".data/e2e-surse-arbore.png" });

// 6. Pagina publică și sitemap (fără cont)
const anon = await browser.newContext({ baseURL: BASE, locale: "ro-RO" });
const pub = await anon.newPage();
const res = await pub.goto("/surse-publice");
ok("/surse-publice se deschide", res?.status() === 200, `HTTP ${res?.status()}`);
ok("Titlul paginii", (await pub.locator("h1").textContent())?.includes("Unde îți cauți strămoșii gratuit") ?? false);
ok("Titlul și descrierea pentru Google", /strămoșii/.test(await pub.title()) && !!(await pub.locator("meta[name=description]").getAttribute("content")));
const ld = (await pub.locator("script[type='application/ld+json']").allTextContents()).join(" ");
ok("Schema Article", ld.includes("\"Article\""));
ok("Grupa „Opțional, cu plată” separată", await pub.getByRole("heading", { name: "Opțional, cu plată" }).isVisible());
await pub.screenshot({ path: ".data/e2e-surse-pagina.png", fullPage: true });
const sm = await pub.request.get("/sitemap.xml");
const xml = await sm.text();
let inMap = xml.includes("/surse-publice");
if (!inMap) for (const loc of xml.match(/<loc>[^<]+<\/loc>/g) ?? []) {
  const u = loc.replace(/<\/?loc>/g, "").replace(/^https?:\/\/[^/]+/, "");
  if ((await (await pub.request.get(u)).text()).includes("/surse-publice")) { inMap = true; break; }
}
ok("/surse-publice e în sitemap", inMap);

await browser.close();
const failed = results.filter(([, p]) => !p);
console.log(`\n${results.length - failed.length} din ${results.length} verificări au trecut.`);
process.exit(failed.length ? 1 : 0);
