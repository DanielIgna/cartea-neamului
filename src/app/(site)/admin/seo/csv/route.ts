import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { SITE_URL } from "@/lib/site-url";
import { explainGscError, gscByPath, gscSnapshot, seoSettings } from "@/lib/seo";
import { auditAlerts, auditPages } from "@/lib/seo-audit";
import { publishedMap } from "@/lib/motor-seo/motor";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => { const s = String(v ?? ""); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const line = (...v: unknown[]) => v.map(cell).join(",");

/** Admin → SEO → CSV: matricea de indexare (fiecare pagină, grupa, starea, motivul, datele din Google) sau alertele. */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!(await adminReady(me))) return new Response("Nu există.", { status: 404 });
  const what = new URL(req.url).searchParams.get("ce");
  const s = await seoSettings(db);
  const gsc = await gscSnapshot(s, SITE_URL, 28);
  const g = gsc.state === "legat" ? gscByPath(gsc) : undefined;
  const pages = auditPages(await publishedMap(db));
  const out: string[] = [];
  if (what === "alerte") {
    out.push(line("nivel", "cod", "titlu", "text", "ce faci", "pagini"));
    for (const a of auditAlerts(pages, { gscState: gsc.state, gscError: gsc.error ? explainGscError(gsc.error) : null, gscPages: g })) out.push(line(a.level, a.code, a.title, a.text, a.fix ?? "", (a.paths ?? []).join(" ")));
  } else {
    out.push(line("adresa", "grupa", "categoria", "titlu", "descriere", "cuvinte", "indexabila", "in sitemap", "motiv", "afisari 28z", "clicuri 28z", "loc mediu", "cuvant principal"));
    for (const p of pages) {
      const x = g?.get(p.path);
      out.push(line(`${SITE_URL}${p.path === "/" ? "/" : p.path}`, p.cluster.label, p.category ?? "", p.title, p.description ?? "", p.words ?? "", p.indexable ? "da" : "nu", p.inSitemap ? "da" : "nu", p.gate ?? "",
        x?.impressions ?? "", x?.clicks ?? "", x ? x.position.toFixed(1) : "", x?.topQuery ?? ""));
    }
  }
  const name = what === "alerte" ? "seo-alerte" : "seo-matrice-indexare";
  return new Response(`﻿${out.join("\n")}\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
