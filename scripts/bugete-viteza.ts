/**
 * Proba de viteză (src/lib/seo/bugete.ts): deschide paginile tipice ca pe un telefon (ecran mic, procesor încetinit de 4 ori,
 * rețea 4G lentă), măsoară LCP, CLS, TBT și mărimea HTML-ului, scrie un tabel și iese cu eroare dacă ceva e peste buget.
 *   npx tsx scripts/bugete-viteza.ts                         (site-ul live)
 *   BASE=http://localhost:3200 npx tsx scripts/bugete-viteza.ts
 * Rezultatul (Markdown) merge și în fișierul dat ca argument, pentru sumarul din GitHub Actions.
 */
import { appendFileSync } from "node:fs";
import { createRequire } from "node:module";
import { BUDGET_PAGES, overBudget, type Measure } from "../src/lib/seo/bugete";

// Playwright nu e în dependențele site-ului: în GitHub Actions îl instalează workflow-ul, local e cel instalat global (NODE_PATH).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { chromium } = createRequire(import.meta.url)("playwright") as { chromium: any };
const BASE = (process.env.BASE ?? "https://carteaneamului.ro").replace(/\/$/, "");
const out = process.argv[2];

async function measure(path: string): Promise<Measure> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 CarteaNeamuluiProba" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: number | null; __cls: number; __tbt: number };
    w.__lcp = null; w.__cls = 0; w.__tbt = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) w.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__tbt += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
  });
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 60000 });
  const html = (await res?.body())?.length ?? 0;
  await page.waitForTimeout(3000);
  const m = await page.evaluate(() => { const w = window as unknown as { __lcp: number | null; __cls: number; __tbt: number }; return { lcp: w.__lcp, cls: w.__cls, tbt: w.__tbt }; });
  await browser.close();
  return { path, lcpMs: m.lcp, cls: m.cls, tbtMs: m.tbt, htmlKb: html / 1024 };
}

const lines = [`Proba de viteză pe ${BASE} (telefon simulat, procesor ×4, 4G lent)`, "", "| Pagina | LCP | CLS | TBT | HTML | Buget |", "|---|---|---|---|---|---|"];
let bad = 0;
for (const p of BUDGET_PAGES) {
  const m = await measure(p.path);
  const over = overBudget(m, p.budget);
  if (over.length) bad++;
  lines.push(`| ${p.label} (${p.path}) | ${m.lcpMs == null ? "—" : `${(m.lcpMs / 1000).toFixed(2)} s`} | ${m.cls.toFixed(3)} | ${Math.round(m.tbtMs)} ms | ${Math.round(m.htmlKb)} KB | ${over.length ? `❌ ${over.join("; ")}` : "✅"} |`);
}
lines.push("", bad ? `${bad} pagini peste buget.` : "Toate paginile sunt în buget.");
console.log(lines.join("\n"));
if (out) appendFileSync(out, `${lines.join("\n")}\n`);
process.exit(bad ? 1 : 0);
