import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { usageDay, user } from "@/db/schema";
import { exportMyData } from "@/lib/account";
import { recordConsent } from "@/lib/consent";
import { inZile, oameni, zile } from "@/lib/ro-words";
import { MAX_BEAT, cleanupUsage, deleteUsage, duration, recordUsage, sectionOf, usageOf, usageOverview } from "@/lib/usage";

describe("partea din site a unei adrese", () => {
  it("numește partea, fără arborele sau persoana din adresă", () => {
    expect(sectionOf("/")).toBe("acasa");
    expect(sectionOf("/arbore/abc")).toBe("arbore");
    expect(sectionOf("/arbore/abc?p=1&g=4")).toBe("arbore");
    expect(sectionOf("/arbore/abc", "arbore-360")).toBe("arbore-360");
    expect(sectionOf("/arbore/abc/harta", "arbore-360")).toBe("harta");
    expect(sectionOf("/arbore/abc/calatorie")).toBe("calatorie");
    expect(sectionOf("/arbore/abc/bun-venit")).toBe("pornire");
    expect(sectionOf("/arbore/abc/persoana/p1")).toBe("persoana");
    expect(sectionOf("/arbore/abc/persoana/p1/autobiografie/carte")).toBe("autobiografie");
    expect(sectionOf("/arbore/abc/persoana/p1/la-bunici")).toBe("la-bunici");
    expect(sectionOf("/arbore/abc/persoana/p1/poveste")).toBe("poveste");
    expect(sectionOf("/mesaje/t/u")).toBe("mesaje");
    expect(sectionOf("/a/XYZ")).toBe("amintire");
    expect(sectionOf("/istoria-bisericii")).toBe("istoria-bisericii");
    expect(sectionOf("/de-la-adam-la-hristos")).toBe("adam-hristos");
    expect(sectionOf("/firul-vremii")).toBe("firul-vremii");
    expect(sectionOf("/libertatea-de-a-crede")).toBe("istoria-bisericii");
    expect(sectionOf("/genealogii-vechi")).toBe("adam-hristos");
    expect(sectionOf("/istoria-umanitatii")).toBe("firul-vremii");
    expect(sectionOf("/termeni")).toBe("altele");
  });
  it("panoul de admin nu se numără, iar un indiciu necunoscut nu schimbă nimic", () => {
    expect(sectionOf("/admin/oameni")).toBeNull();
    expect(sectionOf("/arbore/abc", "toString")).toBe("arbore");
    expect(sectionOf("/arbore/abc", "harta")).toBe("arbore");
  });
  it("durata pe înțeles", () => {
    expect(duration(40)).toBe("40 sec");
    expect(duration(12 * 60)).toBe("12 min");
    expect(duration(3 * 3600 + 20 * 60)).toBe("3 h 20 min");
    expect(duration(7200)).toBe("2 h");
    expect([oameni(1), oameni(3), oameni(20), zile(1), zile(19), zile(21)]).toEqual(["un om", "3 oameni", "20 de oameni", "o zi", "19 zile", "21 de zile"]);
    expect([inZile(1), inZile(4), inZile(30)]).toEqual(["într-o zi", "în 4 zile", "în 30 de zile"]);
  });
});

describe("timpul petrecut în site", () => {
  let db: Db;
  const now = new Date("2026-11-06T12:00:00Z");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([
      { id: "ana", name: "Ana", email: "ana@test.ro" }, { id: "ion", name: "Ion", email: "ion@test.ro" },
      { id: "gol", name: "Gol", email: "gol@test.ro" }, { id: "demo", name: "Demo", email: "demo@cartea-neamului.ro" },
    ]);
    await recordConsent(db, "ana", "usage", true, daysAgo(10));
    await recordConsent(db, "ion", "usage", true, daysAgo(10));
    await recordConsent(db, "ion", "usage", false, daysAgo(1));
    await recordConsent(db, "demo", "usage", true, daysAgo(10));
  });

  it("adună bătăile pe zi și pe parte, cu cel mult un minut și jumătate pe bătaie", async () => {
    await recordUsage(db, "ana", "arbore-360", { seconds: 60, view: true, phone: true, app: false }, now);
    await recordUsage(db, "ana", "arbore-360", { seconds: 5000, view: false, phone: true, app: true }, now);
    await recordUsage(db, "ana", "harta", { seconds: 30, view: true, phone: false, app: false }, daysAgo(2));
    await recordUsage(db, "ana", "harta", { seconds: 0, view: false, phone: false, app: false }, daysAgo(2));
    const rows = await db.select().from(usageDay).where(eq(usageDay.userId, "ana"));
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.section === "arbore-360")).toMatchObject({ day: "2026-11-06", seconds: 60 + MAX_BEAT, views: 1, phoneSeconds: 60 + MAX_BEAT, appSeconds: MAX_BEAT });
  });

  it("aceeași bătaie venită de două ori (trimisă la plecare și din nou la intrare) se numără o singură dată", async () => {
    const beat = { seconds: 40, view: true, phone: false, app: false };
    await recordUsage(db, "gol", "cronologie", { ...beat, id: "b1" }, now);
    await recordUsage(db, "gol", "cronologie", { ...beat, id: "b1" }, now);
    await recordUsage(db, "gol", "cronologie", { ...beat, id: "b2" }, now);
    await recordUsage(db, "gol", "cronologie", { ...beat, id: "b2" }, now);
    await recordUsage(db, "gol", "cronologie", beat, now);
    const row = (await db.select().from(usageDay).where(eq(usageDay.userId, "gol"))).find((r) => r.section === "cronologie");
    expect(row).toMatchObject({ seconds: 120, views: 3 });
    // Doar deschisă, fără secunde: se numără ca deschidere, dar nu apare în liste.
    await recordUsage(db, "gol", "harta", { ...beat, seconds: 0, id: "b3" }, now);
    const u = await usageOf(db, "gol", 30, now);
    expect(u.views).toBe(4);
    expect(u.sections.map((x) => x.section)).toEqual(["cronologie"]);
    await deleteUsage(db, "gol");
  });

  it("omul își vede timpul pe părți și pe zile", async () => {
    const u = await usageOf(db, "ana", 30, now);
    expect(u.total).toBe(60 + MAX_BEAT + 30);
    expect(u.activeDays).toBe(2);
    expect(u.days).toHaveLength(30);
    expect(u.days.at(-1)).toEqual({ day: "2026-11-06", seconds: 60 + MAX_BEAT });
    expect(u.sections.map((x) => x.label)).toEqual(["Arborele · Copac 360°", "Harta neamului"]);
  });

  it("panoul: cine a spus „Bine” sau „Nu vreau” (fără contul de probă) și timpul fiecăruia", async () => {
    await recordUsage(db, "demo", "acasa", { seconds: 60, view: true, phone: false, app: false }, now);
    const o = await usageOverview(db, 30, now);
    expect(o.answers).toEqual({ yes: 1, no: 1 });
    expect(o.perUser.get("ana")?.seconds).toBe(60 + MAX_BEAT + 30);
    expect(o.sections[0]).toMatchObject({ section: "arbore-360", people: 1 });
  });

  it("„Datele mele” le cuprinde; „Nu mai vreau” le șterge; după 13 luni pleacă singure", async () => {
    const data = (await exportMyData(db, "ana", "https://exemplu.ro"))!;
    expect(data.folosire.map((x) => x.parte)).toEqual(["Harta neamului", "Arborele · Copac 360°"]);
    expect(data.acorduri.at(-1)?.pentru).toBe("Cât timp folosesc site-ul și ce părți din el");

    await recordUsage(db, "gol", "acasa", { seconds: 30, view: true, phone: false, app: false }, new Date("2025-09-01T10:00:00Z"));
    await recordUsage(db, "gol", "acasa", { seconds: 30, view: true, phone: false, app: false }, now);
    await cleanupUsage(db, now);
    expect((await db.select().from(usageDay).where(eq(usageDay.userId, "gol"))).map((r) => r.day)).toEqual(["2026-11-06"]);

    await deleteUsage(db, "ana");
    expect(await db.select().from(usageDay).where(eq(usageDay.userId, "ana"))).toEqual([]);
  });
});
