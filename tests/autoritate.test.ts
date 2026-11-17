import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", async (importOriginal) => {
  const m = await importOriginal<typeof import("@/db")>();
  const { runMigrations } = await import("@/db/migrate");
  const db = m.createDb();
  await runMigrations(db);
  return { ...m, db };
});

import { db } from "@/db";
import { person, relationship, tree, user } from "@/db/schema";
import { countGenerations, DEMO_TOKEN, disableWidget, embedCode, enableWidget, renderWidget, widgetData, widgetForTree } from "@/lib/widget-arbore";
import { buildWeeklyReport, reportHistory, saveWeek, weekKey } from "@/lib/seo-raport";
import { AUTHORITY_PAGES } from "@/lib/autoritate";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { auditPages } from "@/lib/seo-audit";
import { PRIVATE_PREFIXES } from "@/lib/public-pages";
import { TARGET_KEYWORDS } from "@/lib/seo-cuvinte";
import type { GscSnapshot } from "@/lib/seo";

describe("widgetul „Arborele meu”", () => {
  it("numără generațiile pe cel mai lung șir și nu se blochează la o legătură în cerc", () => {
    expect(countGenerations([], [])).toBe(0);
    expect(countGenerations(["a"], [])).toBe(1);
    expect(countGenerations(["a", "b", "c", "d"], [{ parent: "a", child: "b" }, { parent: "b", child: "c" }, { parent: "a", child: "d" }])).toBe(3);
    expect(countGenerations(["a", "b"], [{ parent: "a", child: "b" }, { parent: "b", child: "a" }])).toBeLessThanOrEqual(2);
  });

  it("arată doar cifre, fără cei în viață și fără persoanele discrete", async () => {
    await db.insert(user).values({ id: "w-owner", name: "Proprietar", email: "w-owner@example.test", emailVerified: true });
    const [t] = await db.insert(tree).values({ name: "Pop", ownerId: "w-owner" }).returning();
    const [a, b, c, d] = await db.insert(person).values([
      { treeId: t.id, givenName: "Ion", surname: "Pop", birthFrom: "1850-01-01", birthPlace: "Bogdand, Satu Mare" },
      { treeId: t.id, givenName: "Gheorghe", surname: "Pop", birthFrom: "1880-01-01", birthPlace: "bogdand" },
      { treeId: t.id, givenName: "Maria", surname: "Pop", birthFrom: "1820-01-01", living: true, birthPlace: "Cluj" },
      { treeId: t.id, givenName: "Ana", surname: "Fostă", discreet: true, birthFrom: "1700-01-01", birthPlace: "Arad" },
    ]).returning();
    await db.insert(relationship).values([
      { treeId: t.id, type: "parent_child", personA: a.id, personB: b.id },
      { treeId: t.id, type: "parent_child", personA: b.id, personB: c.id },
      { treeId: t.id, type: "parent_child", personA: d.id, personB: a.id },
    ]);
    expect(await widgetForTree(db, t.id)).toBeNull();
    const token = await enableWidget(db, t.id, "Neamul <Pop>", "w-owner");
    expect(await enableWidget(db, t.id, "Neamul Pop din Bogdand", "w-owner")).toBe(token); // același cod la schimbarea titlului
    const data = await widgetData(db, token);
    expect(data).toEqual({ title: "Neamul Pop din Bogdand", persons: 3, generations: 3, oldestYear: 1850, places: 1 });
    const html = renderWidget(data, "https://carteaneamului.ro");
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toContain("Ion");
    expect(html).toContain("?src=widget");
    await disableWidget(db, t.id);
    expect(await widgetData(db, token)).toBeNull();
    expect(renderWidget(null, "https://carteaneamului.ro")).toContain("nu mai e pornit");
  });

  it("are o fișă de probă, codul de pus pe blog are un link obișnuit, iar adresa fișei nu intră în Google", async () => {
    expect(await widgetData(db, DEMO_TOKEN)).not.toBeNull();
    expect(await widgetData(db, "../x")).toBeNull();
    const code = embedCode("abcDEF123", "Neamul \"Pop\"", "https://carteaneamului.ro");
    expect(code).toContain('src="https://carteaneamului.ro/widget/arbore/abcDEF123"');
    expect(code).toContain('href="https://carteaneamului.ro/arborele-meu"');
    expect(code).toContain("&quot;Pop&quot;");
    expect(PRIVATE_PREFIXES).toContain("/widget/");
  });
});

describe("paginile de autoritate și cuvintele țintă", () => {
  it("/presa și /arborele-meu sunt în sitemap, cu titluri și descrieri în regulă", () => {
    const urls = new Set(sitemapGroups().flatMap((g) => g.urls.map((u) => u.path)));
    for (const p of AUTHORITY_PAGES) {
      expect(urls.has(p.path)).toBe(true);
      expect(p.title.length).toBeLessThanOrEqual(60);
      expect(p.description.length).toBeGreaterThanOrEqual(120);
      expect(p.description.length).toBeLessThanOrEqual(155);
    }
  });
  it("cuvintele țintă au pagini, în afară de golurile știute din diaspora", () => {
    const known = new Set(auditPages().map((p) => p.path));
    const missing = TARGET_KEYWORDS.filter((k) => !known.has(k.path)).map((k) => k.path);
    expect(missing.every((p) => p.startsWith("/ghid/romanii-din-") || p === "/ghid/transcrierea-actelor-din-strainatate")).toBe(true);
    expect(TARGET_KEYWORDS.some((k) => k.path === "/genealogie/regiune/banat")).toBe(true);
    expect(new Set(TARGET_KEYWORDS.map((k) => k.keyword)).size).toBe(TARGET_KEYWORDS.length);
  });
});

describe("raportul SEO săptămânal", () => {
  const row = (keys: string[], clicks: number, impressions: number, position: number) => ({ keys, clicks, impressions, ctr: impressions ? clicks / impressions : 0, position });
  const snap: GscSnapshot = {
    state: "legat", error: null, site: "sc-domain:carteaneamului.ro", email: null, source: null, sites: [], days: 7, at: 0,
    totals: { cur: row([], 40, 2000, 14.2), prev: row([], 30, 1500, 16) },
    queries: [
      { query: "arbore genealogic online", clicks: 20, impressions: 400, ctr: 0.05, position: 6, prevPosition: 9, prevImpressions: 300, isNew: false },
      { query: "registre parohiale", clicks: 5, impressions: 60, ctr: 0.08, position: 12, prevPosition: 8, prevImpressions: 50, isNew: false },
      { query: "catagrafii", clicks: 2, impressions: 30, ctr: 0.07, position: 2.5, prevPosition: null, prevImpressions: 0, isNew: true },
    ],
    pages: [row(["https://carteaneamului.ro/ghid/catagrafiile-din-moldova-si-tara-romaneasca"], 2, 300, 4), row(["https://carteaneamului.ro/nume/pop"], 5, 50, 8)],
    queryPages: [],
  };
  it("compară săptămânile, găsește mișcările, secțiunile și ce e de făcut", () => {
    const r = buildWeeklyReport(snap, new Set(["/", "/ghid/cum-citesti-un-registru-parohial"]));
    expect(r.cur.clicks).toBe(40);
    expect(r.prev.clicks).toBe(30);
    expect(r.up.map((m) => m.query)).toEqual(["arbore genealogic online"]);
    expect(r.down.map((m) => m.query)).toEqual(["registre parohiale"]);
    expect(r.fresh.map((k) => k.query)).toEqual(["catagrafii"]);
    expect(r.sections[0].key).toBe("ghid");
    expect(r.targets.top10).toBeGreaterThanOrEqual(2);
    expect(r.targets.top3).toBeGreaterThanOrEqual(1);
    expect(r.todo.some((t) => t.includes("arbore genealogic online"))).toBe(true);
    expect(r.todo.some((t) => t.includes("/ghid/catagrafiile-din-moldova-si-tara-romaneasca"))).toBe(true); // 300 afișări, CTR sub 1%
  });
  it("păstrează câte un rând pe săptămână", async () => {
    expect(weekKey(new Date("2026-11-19T10:00:00Z"))).toBe("2026-11-16");
    expect(weekKey(new Date("2026-11-16T00:00:00Z"))).toBe("2026-11-16");
    expect(weekKey(new Date("2026-11-22T23:00:00Z"))).toBe("2026-11-16");
    const r = buildWeeklyReport(snap, new Set());
    await saveWeek(db, r, 10, new Date("2026-11-16T05:00:00Z"));
    await saveWeek(db, r, 12, new Date("2026-11-18T05:00:00Z"));
    await saveWeek(db, r, 7, new Date("2026-11-23T05:00:00Z"));
    const h = await reportHistory(db);
    expect(h.map((x) => [x.week, x.published])).toEqual([["2026-11-16", 12], ["2026-11-23", 7]]);
  });
});
