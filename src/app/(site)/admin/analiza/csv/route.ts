import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { countryName, geography, judetName, groupBy, isPeriod, rangeOf, sessionsOf, sourceLabel, summary, topPages, trafficSeries, uniqueVisitors, business, accountFunnel } from "@/lib/analiza";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const line = (...v: unknown[]) => v.map(cell).join(",");

/** Admin → Analiză → CSV: cifrele perioadei alese (zile, surse, campanii, pagini, pâlnie), de deschis în Excel sau Google Sheets. */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!(await adminReady(me))) return new Response("Nu există.", { status: 404 });
  const p = new URL(req.url).searchParams.get("p");
  const period = isPeriod(p) ? p : "30z";
  const { cur } = rangeOf(period);
  const [sessions, uv, biz, funnel, pages, geo] = await Promise.all([sessionsOf(db, cur), uniqueVisitors(db, cur), business(db, cur), accountFunnel(db, cur), topPages(db, cur), geography(db, cur)]);
  const series = await trafficSeries(db, cur, sessions);
  const sum = summary(sessions);
  const out: string[] = [];
  out.push(line("Cartea Neamului · Analiză", `${cur.from} – ${cur.to}`), "");
  out.push(line("Rezumat"), line("Vizitatori unici", uv.visitors), line("Sesiuni", sum.sessions), line("Pagini văzute", uv.views), line("Bounce %", sum.bounceRate),
    line("Conturi create", biz.accounts), line("Arbori porniți", biz.trees), line("Plăți", biz.payments), line("Încasat lei", biz.lei), line("Încasat EUR", biz.eur), "");
  out.push(line("Pâlnie"), line("Vizitatori unici", uv.visitors), line("Au deschis pagina de cont", sessions.filter((s) => s.signup).length),
    line("Conturi create", funnel.accounts), line("Au pornit un arbore", funnel.trees), line("Arbore cu 5+ persoane", funnel.grown), line("Au plătit", funnel.paid), "");
  out.push(line(cur.days === 1 ? "Ora" : cur.days > 92 ? "Săptămâna din" : "Ziua", "Vizitatori unici", "Sesiuni"));
  for (const d of series) out.push(line(d.key, d.visitors, d.sessions));
  out.push("", line("Sursa", "Sesiuni", "Bounce %", "Pagini/sesiune", "Pagina de cont", "Arbori", "Plata"));
  for (const r of groupBy(sessions, (s) => s.source)) out.push(line(sourceLabel(r.key), r.count, r.bounceRate, r.pagesPerSession, r.signup, r.tree, r.pay));
  out.push("", line("Campania", "Sesiuni", "Bounce %", "Pagini/sesiune", "Pagina de cont", "Arbori", "Plata"));
  for (const r of groupBy(sessions, (s) => s.campaign)) out.push(line(r.key, r.count, r.bounceRate, r.pagesPerSession, r.signup, r.tree, r.pay));
  out.push("", line("Pagina", "Vizualizări", "Vizitatori"));
  for (const r of pages) out.push(line(r.path, r.views, r.visitors));
  out.push("", line("Țara", "Cod", "Vizitatori", "Pagini văzute"));
  for (const r of geo.countries) out.push(line(countryName(r.country), r.country, r.visitors, r.views));
  out.push("", line("Județul", "Vizitatori", "Pagini văzute"));
  for (const r of geo.regions.filter((x) => x.country === "RO" && x.region)) out.push(line(judetName(r.region), r.visitors, r.views));
  out.push("", line("Orașul", "Țara", "Vizitatori", "Pagini văzute"));
  for (const r of geo.cities.filter((x) => x.city).slice(0, 100)) out.push(line(r.city, countryName(r.country), r.visitors, r.views));
  return new Response(`﻿${out.join("\n")}\n`, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="analiza-${cur.from}-${cur.to}.csv"`, "cache-control": "no-store" },
  });
}
