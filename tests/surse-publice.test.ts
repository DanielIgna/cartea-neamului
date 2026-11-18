import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { appSetting, automationMark, consent, person, relationship, tree, user } from "@/db/schema";
import {
  AN_LIMITA, GRUPURI, SURSE, adresaBuna, aplica, aratamSugestia, dateDeCautare, lipsuri, recomanda, sursaInformatiei, zonaPentru, type OmPentruSugestie,
} from "@/lib/surse-publice";
import { candidatiEmail, inchide, inchise, marcheazaEmail, salveazaSchimbare, surse, verificaSchimbare } from "@/lib/surse-publice-db";
import { PUBLIC_PAGES, PRIVATE_PREFIXES } from "@/lib/public-pages";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { ALL_ADMIN_ITEMS } from "@/lib/admin-menu";
import { AUTOMATIONS } from "@/lib/autonomie";
import { config } from "@/middleware";

const ids = (l: { id: string }[]) => l.map((s) => s.id);

describe("lista de surse", () => {
  it("fiecare sursă are id unic, nume, descriere, perioadă și o adresă https bună", () => {
    expect(new Set(ids([...SURSE])).size).toBe(SURSE.length);
    for (const s of SURSE) {
      expect(s.nume.trim()).toBeTruthy();
      expect(s.descriere.trim()).toBeTruthy();
      expect(s.perioada.trim()).toBeTruthy();
      expect(s.url.startsWith("https://")).toBe(true);
      expect(adresaBuna(s.url)).toBe(true);
      expect(s.regiuni.length).toBeGreaterThan(0);
      expect(GRUPURI).toContain(s.grup);
    }
  });

  it("linkurile cerute de Daniel sunt exact cum le-a dat, iar cele interzise lipsesc", () => {
    const url = (id: string) => SURSE.find((s) => s.id === id)?.url;
    expect(url("hpdt")).toBe("https://hpdt.ro/");
    expect(url("descopera")).toBe("https://descopera.arhivelenationale.ro/");
    expect(url("familysearch")).toBe("https://www.familysearch.org/");
    expect(url("verlustlisten")).toBe("https://des.genealogy.net/ou1wk/search");
    expect(url("findagrave")).toBe("https://www.findagrave.com/cemetery/search?locationId=country_191");
    expect(url("dvhh")).toBe("https://banat.dvhh.org/");
    expect(url("adatbazisok")).toBe("https://adatbazisokonline.mnl.gov.hu/");
    expect(url("billiongraves")).toBe("https://billiongraves.com/");
    const all = SURSE.map((s) => s.url).join(" ");
    for (const bad of ["www.hpdt.ro", "hpdt.ro:4080", "www.dvhh.org", "digibuc", "matricula-online.eu"]) expect(all).not.toContain(bad);
  });

  it("HPDT are mențiunea obligatorie, citată ca sursă (nu ca partener)", () => {
    const h = SURSE.find((s) => s.id === "hpdt")!;
    expect(h.citare).toBe("Sursă: Baza de date a populației Transilvaniei / Historical Population Database of Transylvania, Centrul de Studiere a Populației, Universitatea Babeș-Bolyai Cluj-Napoca, https://hpdt.ro/");
    expect(h.sfat).toMatch(/„Io” sau „Iu”/);
    expect(h.perioada).toBe("1850–1914");
    expect(JSON.stringify(SURSE)).not.toMatch(/partener/i);
  });

  it("sursele plătite stau separat, în „Opțional, cu plată”, și doar ele", () => {
    const paid = SURSE.filter((s) => !s.gratuit);
    expect(ids(paid).sort()).toEqual(["arcanum", "myheritage"]);
    for (const s of SURSE) expect(s.grup === "platit").toBe(!s.gratuit);
  });

  it("ghidurile la care trimitem există", () => {
    for (const s of SURSE) if (s.ghid) expect(existsSync(`content/ghid/${s.ghid}.md`), s.ghid).toBe(true);
  });
});

describe("alegerea surselor după județ", () => {
  it("Transilvania, Banat și Bucovina: HPDT întâi, apoi Hungaricana și Verlustlisten, apoi cele pentru toți", () => {
    for (const county of ["CJ", "AB", "TM", "CS", "BH", "SM", "MM", "SV"]) {
      expect(zonaPentru({ county })).toBe("transilvania");
      expect(ids(recomanda(SURSE, { county }, 6))).toEqual(["hpdt", "hungaricana", "verlustlisten", "descopera", "genealogica", "familysearch"]);
    }
  });

  it("Basarabia (Republica Moldova): Arhiva Națională a Moldovei și FamilySearch", () => {
    const r = ids(recomanda(SURSE, { area: "basarabia", cc: "MD" }));
    expect(r.slice(0, 3)).toEqual(["ana-md", "ana-md-doc", "familysearch"]);
    expect(r).not.toContain("hpdt");
  });

  it("restul țării și locul necunoscut: FamilySearch și Arhivele Naționale, fără HPDT", () => {
    for (const loc of [{ county: "B" }, { county: "IS" }, { county: "DJ" }, null, {}]) {
      const r = ids(recomanda(SURSE, loc));
      expect(r.slice(0, 3)).toEqual(["familysearch", "descopera", "anr"]);
      expect(r).not.toContain("hpdt");
    }
  });

  it("ținutul fără județ (Ardeal ghicit) tot la HPDT duce", () => {
    expect(zonaPentru({ area: "ardeal" })).toBe("transilvania");
    expect(zonaPentru({ area: "regat" })).toBe("rest");
  });

  it("sursele oprite din Admin și cele plătite nu se recomandă niciodată", () => {
    const off = aplica(SURSE, { hpdt: { activ: false } });
    expect(ids(recomanda(off, { county: "CJ" }))[0]).toBe("hungaricana");
    for (const loc of [{ county: "CJ" }, { cc: "MD", area: "basarabia" }, null]) {
      for (const s of recomanda(SURSE, loc, 99)) expect(s.gratuit).toBe(true);
    }
  });

  it("adresele recomandate nu poartă nimic din arbore", () => {
    for (const s of recomanda(SURSE, { county: "CJ" }, 99)) {
      expect(s.url).not.toMatch(/Igna|Avram|Huedin|1890/i);
      expect(SURSE.find((x) => x.id === s.id)!.url).toBe(s.url);
    }
  });
});

const om = (x: Partial<OmPentruSugestie> = {}): OmPentruSugestie => ({
  givenName: "Avram", surname: "Igna", birthYear: 1890, birthPlace: "Huedin", living: false, deathText: "1960", parents: 2, partners: 1, ...x,
});

describe("când apare cardul „Caută în arhive publice”", () => {
  it("născut înainte de 1930 și cu date lipsă: da", () => {
    expect(aratamSugestia(om({ parents: 0 }))).toBe(true);
    expect(lipsuri(om({ parents: 1 }))).toEqual(["parinti"]);
    expect(aratamSugestia(om({ birthPlace: null }))).toBe(true);
    expect(aratamSugestia(om({ partners: 0 }))).toBe(true);
    expect(aratamSugestia(om({ deathText: null }))).toBe(true);
  });
  it("fără anul nașterii: da (anul e chiar ce lipsește)", () => {
    expect(aratamSugestia(om({ birthYear: null }))).toBe(true);
    expect(lipsuri(om({ birthYear: null }))).toContain("an");
  });
  it("născut în 1930 sau după: nu", () => {
    expect(aratamSugestia(om({ birthYear: AN_LIMITA, parents: 0 }))).toBe(false);
    expect(aratamSugestia(om({ birthYear: 1975, parents: 0 }))).toBe(false);
  });
  it("cu toate datele: nu", () => {
    expect(aratamSugestia(om())).toBe(false);
  });
  it("cei în viață și fișele fără nume („Tată necunoscut”): nu", () => {
    expect(aratamSugestia(om({ living: true, parents: 0 }))).toBe(false);
    expect(aratamSugestia(om({ placeholder: true, parents: 0 }))).toBe(false);
  });
});

describe("„Copiază datele” și „Sursa informației”", () => {
  const w = { surname: "Nume", given: "Prenume", place: "Localitatea", year: "Anul" };
  it("numele, prenumele, localitatea și anul, cât se știu", () => {
    expect(dateDeCautare({ givenName: "Ioan", surname: "Igna", birthSurname: null, birthPlace: "Huedin", birthYear: 1885 }, w))
      .toBe("Nume: Igna\nPrenume: Ioan\nLocalitatea: Huedin\nAnul: 1885");
    expect(dateDeCautare({ givenName: "Floarea", surname: "Curtuli", birthSurname: "Igna", birthPlace: null, birthYear: null }, w))
      .toBe("Nume: Curtuli / Igna\nPrenume: Floarea");
  });
  it("sursa: text de cel mult 500 de caractere și un link http(s), altfel nimic", () => {
    expect(sursaInformatiei("  Registrul de botezuri, Huedin 1885 ", "familysearch.org/ark:/1")).toEqual({ infoSource: "Registrul de botezuri, Huedin 1885", infoSourceUrl: "https://familysearch.org/ark:/1" });
    expect(sursaInformatiei("", "")).toEqual({ infoSource: null, infoSourceUrl: null });
    expect(sursaInformatiei("x".repeat(900), "javascript:alert(1)").infoSource).toHaveLength(500);
    expect(sursaInformatiei("a", "javascript:alert(1)").infoSourceUrl).toBe(null);
  });
});

describe("Admin: schimbările puse peste lista din cod", () => {
  it("adresa stricată sau cu urmărire e ignorată, ordinea și pornit/oprit se aplică", () => {
    const l = aplica(SURSE, { hpdt: { url: "http://rau.ro", ordine: 0, activ: false }, genealogica: { url: "https://genealogica.ro/?utm_source=x" } });
    expect(l[0].id).toBe("hpdt");
    expect(l[0].url).toBe("https://hpdt.ro/");
    expect(l[0].activ).toBe(false);
    expect(l.find((s) => s.id === "genealogica")!.url).toBe("https://genealogica.ro/");
  });
  it("formularul cere nume, descriere și adresă https", () => {
    expect(verificaSchimbare({ nume: "X", descriere: "Y", url: "https://x.ro/", activ: "on", ordine: "3" })).toEqual({ ok: expect.objectContaining({ activ: true, ordine: 3 }) });
    expect(verificaSchimbare({ nume: "X", descriere: "Y", url: "http://x.ro/" })).toHaveProperty("error");
    expect(verificaSchimbare({ nume: "", descriere: "Y" })).toHaveProperty("error");
  });
});

describe("pagina /surse-publice", () => {
  it("e publică, doar în română, în sitemap și în middleware", () => {
    const page = PUBLIC_PAGES.find((p) => p.path === "/surse-publice");
    expect(page?.roOnly).toBe(true);
    expect(PRIVATE_PREFIXES.some((p) => "/surse-publice".startsWith(p))).toBe(false);
    expect(sitemapGroups().flatMap((g) => g.urls).some((u) => u.path === "/surse-publice")).toBe(true);
    expect(config.matcher).toContain("/surse-publice");
  });
  it("are titlu, descriere și schema Article; nu pomenește unelte de construcție", () => {
    const src = readFileSync("src/app/(site)/surse-publice/page.tsx", "utf8");
    expect(src).toMatch(/"@type": "Article"/);
    expect(src).toMatch(/"@type": "ItemList"/);
    expect(src).toMatch(/Unde îți cauți strămoșii gratuit/);
    expect(src).not.toMatch(/iframe/i);
    expect(src).not.toMatch(/\b(Claude|Anthropic|ChatGPT|Next\.js|Vercel|AI)\b/);
  });
  it("e în meniul din Admin, iar emailul pornește oprit", () => {
    expect(ALL_ADMIN_ITEMS.some((i) => i.href === "/admin/surse-publice")).toBe(true);
    const a = AUTOMATIONS.find((x) => x.key === "surse-publice")!;
    expect(a.defaultOn).toBe(false);
    expect(a.risk).toBe("acord");
  });
});

describe("în baza de date", () => {
  let db: Db;
  const now = new Date("2026-12-01T10:00:00Z");
  beforeAll(async () => { db = createDb(); await runMigrations(db); });

  async function cont(id: string, nPersoane: number, stramos: { birth: string | null; place: string | null } | null, o: { verified?: boolean } = {}) {
    await db.insert(user).values({ id, name: `Om ${id}`, email: `${id}@exemplu.ro`, emailVerified: o.verified ?? true });
    const [t] = await db.insert(tree).values({ name: `Arbore ${id}`, ownerId: id }).returning();
    const people = [];
    for (let i = 0; i < nPersoane; i++) {
      const [p] = await db.insert(person).values({ treeId: t.id, givenName: `P${i}`, surname: "Pop", living: true, birthDateText: "1980", birthFrom: "1980-01-01", birthTo: "1980-12-31", birthPlace: "Cluj" }).returning();
      people.push(p);
    }
    if (stramos) {
      const [s] = await db.insert(person).values({ treeId: t.id, givenName: "Ioan", surname: "Pop", living: false, birthDateText: stramos.birth,
        birthFrom: stramos.birth ? `${stramos.birth}-01-01` : null, birthTo: stramos.birth ? `${stramos.birth}-12-31` : null, birthPlace: stramos.place, deathDateText: "1950" }).returning();
      await db.insert(relationship).values({ treeId: t.id, type: "parent_child", personA: s.id, personB: people[0].id });
      people.push(s);
    }
    return { tree: t, people };
  }

  it("emailul: doar arbori de cel puțin 5 persoane cu un strămoș înainte de 1930 cu date lipsă, o singură dată, cu dezabonarea respectată", async () => {
    await cont("da", 5, { birth: "1890", place: "Huedin" });
    await cont("mic", 3, { birth: "1890", place: "Huedin" });
    await cont("tanar", 6, null);
    await cont("dupa1930", 6, { birth: "1935", place: null });
    await cont("faraan", 5, { birth: null, place: "Huedin" });
    await cont("dezabonat", 6, { birth: "1880", place: null });
    await db.insert(consent).values({ userId: "dezabonat", purpose: "conversie", textVersion: "v", granted: false });
    await cont("faravesti", 6, { birth: "1880", place: null });
    await db.insert(consent).values({ userId: "faravesti", purpose: "news", textVersion: "v", granted: false });
    await cont("neverificat", 6, { birth: "1880", place: null }, { verified: false });
    expect((await candidatiEmail(db)).map((c) => c.id).sort()).toEqual(["da", "faraan"]);
    await marcheazaEmail(db, "da", now);
    expect((await candidatiEmail(db)).map((c) => c.id)).toEqual(["faraan"]);
    const marks = await db.select().from(automationMark);
    expect(marks.filter((m) => m.automation === "surse-publice")).toHaveLength(1);
  });

  it("„Nu mai arăta” e ținut pentru fiecare om și persoană", async () => {
    const { tree: t, people } = await cont("inchide", 1, { birth: "1890", place: null });
    await db.insert(user).values({ id: "altul", name: "Altul", email: "altul@exemplu.ro" });
    const s = people[people.length - 1];
    expect(await inchise(db, "inchide", t.id)).toEqual([]);
    await inchide(db, "inchide", s.id);
    await inchide(db, "inchide", s.id); // a doua oară nu strică nimic
    expect(await inchise(db, "inchide", t.id)).toEqual([s.id]);
    expect(await inchise(db, "altul", t.id)).toEqual([]);
  });

  it("schimbările din Admin se salvează în setări și se văd în listă", async () => {
    await salveazaSchimbare(db, "hpdt", { activ: false, ordine: 99 }, null);
    let l = await surse(db);
    expect(l.find((s) => s.id === "hpdt")!.activ).toBe(false);
    expect(l[l.length - 1].id).toBe("hpdt");
    expect(await salveazaSchimbare(db, "nu-exista", { activ: false }, null)).toBe(false);
    await salveazaSchimbare(db, "hpdt", null, null);
    l = await surse(db);
    expect(l.find((s) => s.id === "hpdt")!.activ).toBe(true);
    const rows = await db.select().from(appSetting);
    expect(rows.find((r) => r.key === "surse_publice")!.value).toEqual({});
  });

  it("„Sursa informației” se păstrează la persoană", async () => {
    const { people } = await cont("sursa", 1, null);
    const { eq } = await import("drizzle-orm");
    await db.update(person).set(sursaInformatiei("Registrul de botezuri Huedin, 1885", "https://www.familysearch.org/ark:/61903/x")).where(eq(person.id, people[0].id));
    const [p] = await db.select().from(person).where(eq(person.id, people[0].id));
    expect(p.infoSource).toBe("Registrul de botezuri Huedin, 1885");
    expect(p.infoSourceUrl).toBe("https://www.familysearch.org/ark:/61903/x");
  });
});
