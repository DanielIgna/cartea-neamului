import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { PUBLIC_PAGES, PRIVATE_PREFIXES } from "@/lib/public-pages";
import { SOURCES, checkDnaRequest, checkLab, dnaLabs, dnaRequests, deleteDnaRequest, publicDnaLabs, resolveDnaRequest, saveDnaRequest, saveLab } from "@/lib/resurse";
import { ro } from "@/i18n/messages/ro";

const good = { name: "Ana Pop", email: "ana@exemplu.ro", phone: "", city: "Cluj-Napoca", message: "Ce test mi-ați recomanda?", consent: "on" };

describe("resurse gratuite pentru genealogie", () => {
  it("pagina e publică și în sitemap, cu adresa ei", () => {
    expect(PUBLIC_PAGES.some((p) => p.path === "/resurse-genealogie")).toBe(true);
    expect(PRIVATE_PREFIXES.some((p) => "/resurse-genealogie".startsWith(p))).toBe(false);
    expect(sitemapGroups().flatMap((g) => g.urls).some((u) => u.path === "/resurse-genealogie")).toBe(true);
  });

  it("cele 15 surse au text și duc doar spre site-uri https, fără afiliere", () => {
    expect(SOURCES).toHaveLength(15);
    for (const s of SOURCES) {
      expect(s.url.startsWith("https://")).toBe(true);
      expect(s.url).not.toMatch(/utm_|aff|ref=/i);
      expect(ro.Resources.src[s.id].name).toBeTruthy();
    }
  });

  it("formularul cere acordul, un email bun, oraș și un mesaj de cel mult 1000 de caractere", () => {
    expect(checkDnaRequest(good)).toEqual({ ok: { name: "Ana Pop", email: "ana@exemplu.ro", phone: null, city: "Cluj-Napoca", message: "Ce test mi-ați recomanda?" } });
    expect(checkDnaRequest({ ...good, consent: undefined })).toEqual({ problem: "consent" });
    expect(checkDnaRequest({ ...good, email: "nu-e-email" })).toEqual({ problem: "email" });
    expect(checkDnaRequest({ ...good, email: "" })).toEqual({ problem: "email" });
    expect(checkDnaRequest({ ...good, name: " " })).toEqual({ problem: "name" });
    expect(checkDnaRequest({ ...good, city: "" })).toEqual({ problem: "city" });
    expect(checkDnaRequest({ ...good, message: "x".repeat(1001) })).toEqual({ problem: "message" });
  });

  it("laboratoarele: adresa https, fără coduri de urmărire", () => {
    const r = checkLab({ name: "Lab", url: "https://lab.ro/test?utm_source=x&aff=7&id=3", visible: "on", position: "2" });
    expect(r).toMatchObject({ ok: { name: "Lab", url: "https://lab.ro/test?id=3", visible: true, position: 2 } });
    expect(checkLab({ name: "Lab", url: "http://lab.ro" })).toHaveProperty("error");
    expect(checkLab({ name: "", url: "https://lab.ro" })).toHaveProperty("error");
  });

  describe("în baza de date", () => {
    let db: Db;
    beforeAll(async () => { db = createDb(); await runMigrations(db); });

    it("cererea se păstrează cu acordul și data lui, apare în admin, se rezolvă și se șterge", async () => {
      const now = new Date("2027-01-02T10:00:00Z");
      const v = checkDnaRequest(good);
      if (!("ok" in v)) throw new Error("cerere respinsă");
      const id = await saveDnaRequest(db, v.ok, "ro", now);
      let [r] = await dnaRequests(db);
      expect(r).toMatchObject({ id, email: "ana@exemplu.ro", city: "Cluj-Napoca", consentAt: now, resolvedAt: null });
      await resolveDnaRequest(db, id, true, now);
      [r] = await dnaRequests(db);
      expect(r.resolvedAt).toEqual(now);
      await deleteDnaRequest(db, id);
      expect(await dnaRequests(db)).toHaveLength(0);
    });

    it("laboratoarele vizibile apar pe pagină, cele ascunse nu", async () => {
      const seeded = await dnaLabs(db);
      expect(seeded.map((l) => l.name)).toEqual(["CromoGenetic", "International Biosciences România"]);
      await saveLab(db, null, { name: "Ascuns", city: null, url: "https://ascuns.ro", priceNote: null, position: 3, visible: false });
      expect((await dnaLabs(db)).map((l) => l.name)).toContain("Ascuns");
      expect((await publicDnaLabs(db)).map((l) => l.name)).toEqual(["CromoGenetic", "International Biosciences România"]);
      await saveLab(db, seeded[0].id, { ...seeded[0], visible: false });
      expect((await publicDnaLabs(db)).map((l) => l.name)).toEqual(["International Biosciences România"]);
    });
  });
});
