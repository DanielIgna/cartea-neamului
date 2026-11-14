/**
 * Test de încărcare simplu, fără nimic de instalat: N „oameni” deodată cer pagini timp de T secunde.
 * Arată timpii (mediana, p95, p99), erorile, regiunea Vercel și dacă pagina a venit din cache.
 *   npx tsx scripts/test-incarcare.ts [site] [oameni deodată] [secunde]
 *   npx tsx scripts/test-incarcare.ts https://www.carteaneamului.ro 10 60
 * Cu DEMO=1 intră și cu contul de probă și cere și paginile din cont.
 *
 * Socoteala pentru „1000 de oameni pe zi”: ~8 pagini de om = 8000 de pagini pe zi; dacă jumătate vin în 3 ore de seară,
 * vârful e ~0,4 pagini pe secundă, iar un vârf de 10× (o postare care se distribuie) ~4 pe secundă. 10 oameni deodată
 * care cer pagină după pagină fără pauză fac mult mai mult de atât, deci e un test cu rezervă.
 */
const site = (process.argv[2] ?? "https://www.carteaneamului.ro").replace(/\/$/, "");
const users = Number(process.argv[3] ?? 10);
const seconds = Number(process.argv[4] ?? 60);

const PUBLIC = ["/", "/istoria-umanitatii", "/genealogii-vechi", "/contact", "/intrare", "/nume", "/localitati", "/ghid", "/cadou-de-sarbatori", "/plata"];
const PRIVATE = ["/arbore", "/mesaje", "/datele-mele"];

async function demoCookie(): Promise<string | null> {
  const r = await fetch(`${site}/api/auth/sign-in/email`, {
    method: "POST", headers: { "content-type": "application/json", origin: site },
    body: JSON.stringify({ email: "demo@cartea-neamului.ro", password: "demo-parola-123" }), redirect: "manual",
  });
  const set = r.headers.getSetCookie?.() ?? [];
  if (!set.length) { console.log("Intrarea cu contul de probă n-a mers:", r.status); return null; }
  return set.map((c) => c.split(";")[0]).join("; ");
}

type Hit = { path: string; ms: number; status: number; region: string; cache: string };
const hits: Hit[] = [];

async function one(path: string, cookie: string | null) {
  const t0 = performance.now();
  try {
    const r = await fetch(site + path, { headers: { ...(cookie ? { cookie } : {}), "user-agent": "cartea-neamului-test-incarcare" }, redirect: "manual" });
    await r.arrayBuffer();
    hits.push({ path, ms: performance.now() - t0, status: r.status, region: r.headers.get("x-vercel-id") ?? "", cache: r.headers.get("x-vercel-cache") ?? "" });
  } catch {
    hits.push({ path, ms: performance.now() - t0, status: 0, region: "", cache: "" });
  }
}

const pct = (a: number[], p: number) => (a.length ? Math.round(a.sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((a.length * p) / 100))]) : 0);

const cookie = process.env.DEMO === "1" ? await demoCookie() : null;
const paths = cookie ? [...PUBLIC, ...PRIVATE] : PUBLIC;
console.log(`Site: ${site} · ${users} oameni deodată · ${seconds} s · ${paths.length} pagini${cookie ? " (cu cont de probă)" : ""}`);

const end = Date.now() + seconds * 1000;
let i = 0;
await Promise.all(Array.from({ length: users }, async () => {
  while (Date.now() < end) await one(paths[i++ % paths.length], cookie);
}));

const all = hits.map((h) => h.ms);
const bad = hits.filter((h) => h.status === 0 || h.status >= 500);
console.log(`\nCereri: ${hits.length} (${(hits.length / seconds).toFixed(1)} pe secundă) · erori: ${bad.length}`);
console.log(`Toate: mediana ${pct(all, 50)} ms · p95 ${pct(all, 95)} ms · p99 ${pct(all, 99)} ms · cea mai lentă ${pct(all, 100)} ms`);
console.log(`\n${"pagina".padEnd(24)} ${"cereri".padStart(6)} ${"mediana".padStart(8)} ${"p95".padStart(7)}  stări  cache  regiune`);
for (const p of paths) {
  const h = hits.filter((x) => x.path === p);
  const st = [...new Set(h.map((x) => x.status))].join(",");
  const cache = [...new Set(h.map((x) => x.cache))].join(",");
  const reg = [...new Set(h.map((x) => x.region.split("::").slice(0, -1).join("::")))].join(",");
  console.log(`${p.padEnd(24)} ${String(h.length).padStart(6)} ${String(pct(h.map((x) => x.ms), 50)).padStart(6)}ms ${String(pct(h.map((x) => x.ms), 95)).padStart(5)}ms  ${st.padEnd(6)} ${cache.padEnd(6)} ${reg}`);
}
