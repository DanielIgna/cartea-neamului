import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { person, tree, user } from "@/db/schema";
import { DEMO_EMAIL } from "@/lib/demo";
import { fold, loadNames, nameText, relatedNames } from "@/lib/continut/nume";
import { MIN_PERSONS, MIN_TREES, publicStat, surnameTotals } from "@/lib/continut/nume-statistici";
import { nameMetadata, namesHubMetadata } from "@/components/continut/NamePages";
import { REGIONS } from "@/lib/continut/regiuni";
import { sitemapGroups, mainSitemapXml } from "@/lib/continut/sitemap";

const names = loadNames();

describe("numele de familie (content/nume/nume.json)", () => {
  it("sunt câteva sute, cu adrese unice și date complete", () => {
    expect(names.length).toBeGreaterThanOrEqual(200);
    expect(new Set(names.map((n) => n.slug)).size).toBe(names.length);
    expect(new Set(names.map((n) => fold(n.name))).size).toBe(names.length);
    for (const n of names) {
      expect(n.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(n.meaning.length, n.name).toBeGreaterThan(20);
      for (const r of n.regions) expect(REGIONS[r], `${n.name}: ${r}`).toBeTruthy();
    }
    for (const must of ["Popa", "Pop", "Popescu", "Radu", "Ionescu", "Todea"]) expect(names.some((n) => n.name === must), must).toBe(true);
  });

  it("titlul, descrierea și adresa canonică sunt unice pe fiecare pagină", () => {
    const metas = [namesHubMetadata(1), namesHubMetadata(2), ...names.map((n) => nameMetadata(n.slug))];
    const titles = metas.map((m) => String(m.title));
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(metas.map((m) => String(m.description))).size).toBe(metas.length);
    expect(new Set(metas.map((m) => String(m.alternates?.canonical))).size).toBe(metas.length);
    for (const t of titles) expect(t.length, t).toBeLessThanOrEqual(80);
  });

  it("textul are originea, regiunile și sfaturi de căutare; numele înrudite există", () => {
    const pop = names.find((n) => n.slug === "pop")!;
    const t = nameText(pop);
    expect(t.where).toContain("Transilvania");
    expect(t.tips.length).toBeGreaterThanOrEqual(3);
    expect(relatedNames(pop).map((r) => r.name)).toContain("Popa");
    const general = names.find((n) => n.regions.length === 0)!;
    expect(nameText(general).where).toContain("mai multe regiuni");
  });

  it("sunt în sitemap, care devine index de sitemap-uri", () => {
    const urls = sitemapGroups().flatMap((g) => g.urls.map((u) => u.path));
    for (const n of names) expect(urls).toContain(`/nume/${n.slug}`);
    expect(urls.length).toBeGreaterThan(300);
    expect(mainSitemapXml()).toContain("<sitemapindex");
    expect(mainSitemapXml()).toContain("/sitemaps/nume.xml");
  });
});

describe("pragul de confidențialitate pentru cifrele din platformă", () => {
  it("sub prag nu se arată nimic, iar persoanele se rotunjesc în jos la 5", () => {
    expect(MIN_PERSONS).toBeGreaterThanOrEqual(5);
    expect(MIN_TREES).toBeGreaterThanOrEqual(5);
    expect(publicStat(null)).toBeNull();
    expect(publicStat({ persons: 4, trees: 9 })).toBeNull();
    expect(publicStat({ persons: 40, trees: 4 })).toBeNull();
    expect(publicStat({ persons: 23, trees: 6 })).toEqual({ personsAtLeast: 20, trees: 6 });
    expect(publicStat({ persons: 5, trees: 5 })).toEqual({ personsAtLeast: 5, trees: 5 });
  });

  describe("în baza de date", () => {
    let db: Db;
    beforeAll(async () => {
      db = createDb();
      await runMigrations(db);
      await db.insert(user).values([{ id: "u1", name: "U", email: "u@test.ro" }, { id: "demo", name: "Demo", email: DEMO_EMAIL }]);
      const mk = async (owner: string) => (await db.insert(tree).values({ name: "Neam", ownerId: owner }).returning({ id: tree.id }))[0].id;
      // 5 arbori cu Mureșan (scris cu ș și cu ş), unul cu nume de fată; 3 arbori cu Todea; arborele de probă nu se numără.
      for (let i = 0; i < 5; i++) {
        const t = await mk("u1");
        await db.insert(person).values([
          { treeId: t, givenName: "Ana", surname: i % 2 ? "Mureşan" : "Mureșan", living: true },
          { treeId: t, givenName: "Ion", surname: "Pop", birthSurname: i === 0 ? "Muresan" : null },
        ]);
      }
      for (let i = 0; i < 3; i++) await db.insert(person).values({ treeId: await mk("u1"), givenName: "Iosif", surname: "Todea" });
      const demo = await mk("demo");
      for (let i = 0; i < 20; i++) await db.insert(person).values({ treeId: demo, givenName: "X", surname: "Todea" });
    });

    it("adună doar totaluri pe nume, fără diacritice, fără arborele de probă", async () => {
      const m = await surnameTotals(db);
      expect(m.get("todea")).toEqual({ persons: 3, trees: 3 });
      expect(publicStat(m.get("todea"))).toBeNull();
      const mur = m.get("muresan")!;
      expect(mur.trees).toBeGreaterThanOrEqual(3);
      expect(mur.persons).toBeLessThanOrEqual(6);
      // Ce iese e doar nume → două cifre: nicio persoană, dată sau loc.
      for (const v of m.values()) expect(Object.keys(v).sort()).toEqual(["persons", "trees"]);
    });
  });
});
