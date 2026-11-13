import { describe, it, expect, beforeAll } from "vitest";
import { sql } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { payment, tree, user } from "@/db/schema";
import { deviceOf, isBot, localDayHour, normalizePath, recordVisit, refHostOf, sourceOf } from "@/lib/vizite";
import {
  accountFunnel, business, groupBy, observations, rangeOf, retention, sessionsOf, summary, topPages, trafficSeries, uniqueVisitors, weekHeat,
} from "@/lib/analiza";

describe("vizitele, numărate anonim", () => {
  it("paginile private rămân doar până la primul cuvânt", () => {
    expect(normalizePath("/arbore/1b2c/persoana/9f?x=1")).toBe("/arbore/…");
    expect(normalizePath("/cadou/ABC123/card")).toBe("/cadou/…");
    expect(normalizePath("/intrare?cont=nou")).toBe("/intrare");
    expect(normalizePath("/Istoria-Umanitatii/")).toBe("/istoria-umanitatii");
    expect(normalizePath("/parteneri")).toBe("/parteneri");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("https://x.ro/")).toBeNull();
  });
  it("sursa: eticheta din link, apoi site-ul de unde a venit", () => {
    expect(sourceOf(null, null)).toBe("direct");
    expect(sourceOf("www.google.ro", null)).toBe("google");
    expect(sourceOf("l.facebook.com", null)).toBe("facebook");
    expect(sourceOf("lm.facebook.com", null)).toBe("facebook");
    expect(sourceOf("t.co", null)).toBe("x");
    expect(sourceOf("google.com", "WhatsApp")).toBe("whatsapp");
    expect(sourceOf("blog.ro", null)).toBe("blog.ro");
    expect(refHostOf("https://www.carteaneamului.ro/contact", "carteaneamului.ro")).toBeNull();
    expect(refHostOf("https://localhost:3100/x", "localhost:3100")).toBeNull();
    expect(refHostOf("https://www.google.com/", "carteaneamului.ro")).toBe("www.google.com");
  });
  it("roboții nu se numără, telefoanele se recunosc", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36")).toBe(false);
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 390)).toBe("telefon");
    expect(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", 1400)).toBe("calculator");
  });
  it("ziua și ora sunt cele din România", () => {
    expect(localDayHour(new Date("2026-11-13T22:30:00Z"))).toEqual({ day: "2026-11-14", hour: 0 });
  });
  it("perioada și cea dinainte au aceeași lungime", () => {
    expect(rangeOf("7z", "2026-11-13")).toEqual({ cur: { from: "2026-11-07", to: "2026-11-13", days: 7 }, prev: { from: "2026-10-31", to: "2026-11-06", days: 7 } });
    expect(rangeOf("an", "2026-01-03").cur).toEqual({ from: "2026-01-01", to: "2026-01-03", days: 3 });
  });
});

describe("Admin → Analiză, pe o bază adevărată", () => {
  let db: Db;
  const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile";
  const ctx = (ip: string) => ({ ip, ua: UA, host: "carteaneamului.ro", country: "RO", logged: false });
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    // Doi vizitatori: unul din Google care ajunge la cont, unul direct, cu o singură pagină (bounce).
    await recordVisit(db, { path: "/", ref: "https://www.google.com/" }, ctx("1.1.1.1"));
    await recordVisit(db, { path: "/intrare" }, ctx("1.1.1.1"));
    await recordVisit(db, { path: "/arbore/abc" }, ctx("1.1.1.1"));
    await recordVisit(db, { path: "/contact", utmSource: "facebook", utmCampaign: "Crăciun 2026" }, ctx("2.2.2.2"));
    expect(await recordVisit(db, { path: "/" }, { ...ctx("3.3.3.3"), ua: "Googlebot" })).toBe(false);
    await db.insert(user).values([{ id: "u1", name: "Ana", email: "ana@x.ro" }, { id: "u2", name: "Ion", email: "ion@x.ro" }, { id: "d", name: "Demo", email: "demo@cartea-neamului.ro" }]);
    await db.insert(tree).values({ name: "Neamul Anei", ownerId: "u1" });
    await db.insert(payment).values({ id: "cs_1", userId: "u1", kind: "an", amount: 4900, currency: "ron" });
  });

  it("sesiuni, bounce, surse și campanii", async () => {
    const { cur } = rangeOf("7z");
    const s = await sessionsOf(db, cur);
    expect(s).toHaveLength(2);
    const sum = summary(s);
    expect(sum).toMatchObject({ sessions: 2, bounces: 1, bounceRate: 50 });
    const google = s.find((x) => x.source === "google")!;
    expect(google).toMatchObject({ views: 3, entry: "/", exit: "/arbore/…", signup: true, tree: true, device: "telefon" });
    expect(s.find((x) => x.source === "facebook")?.campaign).toBe("crăciun 2026");
    expect(await uniqueVisitors(db, cur)).toEqual({ visitors: 2, views: 4 });
    const series = await trafficSeries(db, cur, s);
    expect(series).toHaveLength(7);
    expect(series.at(-1)).toMatchObject({ visitors: 2, sessions: 2 });
    expect((await topPages(db, cur))[0]).toMatchObject({ views: 1 });
    expect(weekHeat(s).flat().reduce((a, b) => a + b, 0)).toBe(2);
    expect(groupBy(s, (x) => x.campaign)).toHaveLength(1);
  });

  it("conturile, arborii și plățile, fără contul de probă", async () => {
    const { cur } = rangeOf("7z");
    expect(await business(db, cur)).toMatchObject({ accounts: 2, trees: 1, payments: 1, lei: 49 });
    expect(await accountFunnel(db, cur)).toEqual({ accounts: 2, trees: 1, grown: 0, paid: 1 });
    const r = await retention(db);
    expect(r[0].size).toBe(2);
  });

  it("observațiile se fac din reguli, fără nimic numit AI", async () => {
    const { cur } = rangeOf("7z");
    const s = await sessionsOf(db, cur);
    const notes = observations({ visitors: 2, prevVisitors: 0, sum: summary(s), prevSum: summary([]), sources: groupBy(s, (x) => x.source), accounts: 2, prevAccounts: 0,
      funnel: { accounts: 2, trees: 1, paid: 1 }, heat: weekHeat(s), days: 7 });
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.map((n) => n.text).join(" ")).not.toMatch(/\bAI\b/);
  });

  it("sarea zilei: rămâne doar cea de azi", async () => {
    const r = await db.execute(sql`select count(*)::int as c from visit_salt`);
    expect((r.rows[0] as { c: number }).c).toBe(1);
  });
});
