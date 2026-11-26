import { db } from "@/db";
import { reportAuthorized } from "@/lib/raport-saptamanal";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { activeServiceAccount, inspectUrl, listSitemaps, listSites, pickSite, seoSettings, type Inspection } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Starea în Google a paginilor din sitemap (Daniel, 26.11.2026: „Accesată cu crawlere – nu este indexată”). Search Console nu dă lista
 * raportului prin API, așa că întrebăm pagină cu pagină (URL Inspection, limita e 2.000 pe zi). Cu aceeași cheie ca raportul săptămânal.
 * `?sitemaps=1` = ce sitemap-uri a citit Google și când (cu fișierele din index).
 * `?grup=ghid|glosar|pagini|…` (implicit toate), `n` (cel mult 80), `de_la` (pentru pagina următoare). Răspunsurile stau 12 ore în memorie.
 */
const cache = new Map<string, { at: number; r: Inspection }>();
const TTL = 12 * 3600_000;

export async function GET(req: Request) {
  if (!reportAuthorized(req.headers.get("authorization"))) return Response.json({ ok: false, error: "neautorizat" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const grup = q.get("grup");
  const n = Math.min(80, Math.max(1, Number(q.get("n") ?? 40) || 40));
  const from = Math.max(0, Number(q.get("de_la") ?? 0) || 0);
  const groups = sitemapGroups().filter((g) => !grup || g.name === grup);
  const paths = groups.flatMap((g) => g.urls.map((u) => ({ path: u.path, grup: g.name })));
  const slice = paths.slice(from, from + n);
  const s = await seoSettings(db);
  const sa = activeServiceAccount(s);
  if (!sa) return Response.json({ ok: false, error: "Search Console nu e legat" });
  const site = pickSite(await listSites(sa.account), s.siteUrl ?? null, SITE_URL);
  if (!site) return Response.json({ ok: false, error: "fără acces la proprietate" });
  if (q.get("sitemaps")) {
    const top = await listSitemaps(sa.account, site);
    const children = await Promise.all(top.map((m) => listSitemaps(sa.account, site, m.path).catch(() => [])));
    return Response.json({ ok: true, sitemaps: top, children: children.flat() }, { headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
  }
  const out: (Inspection & { path: string; grup: string })[] = [];
  for (let i = 0; i < slice.length; i += 5) {
    const batch = slice.slice(i, i + 5);
    const res = await Promise.all(batch.map(async (p) => {
      const hit = cache.get(p.path);
      if (hit && Date.now() - hit.at < TTL) return hit.r;
      const r = await inspectUrl(sa.account, site, `${SITE_URL}${p.path === "/" ? "/" : p.path}`);
      if (r.verdict !== "EROARE") cache.set(p.path, { at: Date.now(), r });
      return r;
    }));
    res.forEach((r, j) => out.push({ ...r, path: batch[j].path, grup: batch[j].grup }));
  }
  const byCoverage: Record<string, number> = {};
  for (const r of out) byCoverage[r.coverage || r.verdict] = (byCoverage[r.coverage || r.verdict] ?? 0) + 1;
  return Response.json({ ok: true, total: paths.length, from, n: slice.length, next: from + n < paths.length ? from + n : null, groups: groups.map((g) => ({ name: g.name, urls: g.urls.length })), byCoverage, pages: out },
    { headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
