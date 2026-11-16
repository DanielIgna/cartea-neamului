import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountSource, pageView, payment, tree, treeMember, user } from "@/db/schema";
import {
  answersReport, createLink, linkList, linkUrl, personSource, recordAccountSource, sourceKeyOf, sourceKeys, sourceRowOf, sourcesReport,
} from "@/lib/sursa";
import { decodeAnswer, decodeTouch, encodeAnswer, encodeTouch, externalHost, hasSignal, slugOf, touchFromUrl } from "@/lib/sursa-shared";

const touch = (t: object) => encodeTouch({ t: 1_794_800_000, ...t });
const headers = (cookie: string, ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile") =>
  new Headers({ cookie, "user-agent": ua, "x-vercel-ip-country": "US" });

describe("de unde vine contul: piesele mici", () => {
  it("eticheta linkului: litere mici, fără diacritice, cu liniuțe", () => {
    expect(slugOf("FB Români New York")).toBe("fb-romani-new-york");
    expect(slugOf("  ")).toBeNull();
    expect(slugOf("a".repeat(60))?.length).toBe(40);
  });
  it("adresa: ?src, utm și site-ul din care a venit (nu și site-ul nostru)", () => {
    const t = touchFromUrl("?src=fb-arbore-genealogic&utm_campaign=x", "/", "https://m.facebook.com/groups/1", "carteaneamului.ro");
    expect(t).toMatchObject({ s: "fb-arbore-genealogic", uc: "x", r: "m.facebook.com", p: "/" });
    expect(externalHost("https://www.carteaneamului.ro/ghid", "carteaneamului.ro")).toBeNull();
    expect(hasSignal(touchFromUrl("", "/ghid", null, "carteaneamului.ro"))).toBe(false);
  });
  it("cookie-ul se citește înapoi la fel; unul stricat nu strică nimic", () => {
    expect(decodeTouch(touch({ s: "fb-x", r: "facebook.com", p: "/" }))).toMatchObject({ s: "fb-x", r: "facebook.com", p: "/" });
    expect(decodeTouch("%7Bstricat")).toBeNull();
    expect(decodeAnswer(encodeAnswer({ a: "altceva", o: "  un afiș la biserică " }))).toEqual({ a: "altceva", o: "un afiș la biserică" });
    expect(decodeAnswer(encodeAnswer({ a: "google", o: "ignorat" }))).toEqual({ a: "google", o: null });
    expect(decodeAnswer("%7B%22a%22%3A%22hack%22%7D")).toBeNull();
  });
  it("cheia sursei: ?src întâi, apoi utm_source, apoi site-ul; nimic = direct", () => {
    expect(sourceKeyOf({ s: "fb-romani-new-york", r: "facebook.com" })).toBe("fb-romani-new-york");
    expect(sourceKeyOf({ us: "Facebook" })).toBe("facebook");
    expect(sourceKeyOf({ r: "www.google.ro" })).toBe("google");
    expect(sourceKeyOf({})).toBe("direct");
  });
  it("fără acord pentru cookie-urile de analiză se păstrează doar răspunsul", () => {
    const cookie = `cn-cookie-uri=necesare; cn-sursa=${touch({ s: "fb-x" })}; cn-de-unde=${encodeAnswer({ a: "facebook-grup" })}`;
    const row = sourceRowOf(cookie, headers(cookie), false);
    expect(row).toEqual({ analytics: false, invite: false, answer: "facebook-grup", answerOther: null, answerAuto: false });
  });
  it("cu acord: prima și ultima sursă, dispozitivul și țara", () => {
    const cookie = `cn-cookie-uri=analiza; cn-sursa=${touch({ s: "fb-x", r: "facebook.com", p: "/" })}; cn-sursa-ultima=${touch({ r: "google.com", p: "/ghid" })}`;
    const row = sourceRowOf(cookie, headers(cookie), false);
    expect(row).toMatchObject({ analytics: true, source: "fb-x", firstSrc: "fb-x", firstReferrer: "facebook.com", firstLanding: "/",
      lastSource: "google", lastReferrer: "google.com", lastLanding: "/ghid", device: "telefon", country: "US", answer: null });
  });
  it("venit prin invitație: „recomandare” pus singur, dacă n-a răspuns altceva", () => {
    expect(sourceRowOf("", null, true)).toMatchObject({ invite: true, answer: "recomandare", answerAuto: true });
    const c = `cn-de-unde=${encodeAnswer({ a: "google" })}`;
    expect(sourceRowOf(c, null, true)).toMatchObject({ invite: true, answer: "google", answerAuto: false });
  });
  it("linkul întreg, și pe pagini cu parametri", () => {
    expect(linkUrl("https://carteaneamului.ro", "/", "fb-x")).toBe("https://carteaneamului.ro/?src=fb-x");
    expect(linkUrl("https://carteaneamului.ro", "/intrare?mod=cont-nou", "fb-x")).toBe("https://carteaneamului.ro/intrare?mod=cont-nou&src=fb-x");
  });
});

describe("de unde vine contul: în baza de date", () => {
  let db: Db;
  const R = { from: "2027-03-01", to: "2027-03-31", days: 31 };
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    const at = new Date("2027-03-10T10:00:00Z");
    await db.insert(user).values([
      { id: "vechi", name: "Cont Vechi", email: "vechi@x.ro", createdAt: at },
      { id: "ana", name: "Ana", email: "ana@x.ro", createdAt: at },
      { id: "ion", name: "Ion", email: "ion@x.ro", createdAt: at },
      { id: "maria", name: "Maria", email: "maria@x.ro", createdAt: at },
    ]);
    const ok = `cn-cookie-uri=analiza; cn-sursa=${touch({ s: "fb-romani-new-york", p: "/" })}`;
    await recordAccountSource(db, "ana", headers(ok), false);
    await recordAccountSource(db, "ion", headers(`cn-cookie-uri=analiza; cn-sursa=${touch({ r: "google.com" })}`), false);
    await recordAccountSource(db, "maria", headers(`cn-de-unde=${encodeAnswer({ a: "altceva", o: "radio" })}`), false);
    // A doua oară nu se schimbă nimic.
    await recordAccountSource(db, "ana", headers("cn-cookie-uri=necesare"), false);
    const [t] = await db.insert(tree).values({ name: "Pop", ownerId: "ana" }).returning();
    await db.insert(treeMember).values({ treeId: t.id, userId: "ana", role: "owner" });
    await db.insert(payment).values({ id: "p1", userId: "ana", kind: "an", amount: 5000, currency: "ron" });
    await db.insert(pageView).values([
      { day: "2027-03-10", hour: 9, visitor: "v1", path: "/", source: "fb-romani-new-york", device: "telefon", at: new Date("2027-03-10T09:00:00Z") },
      { day: "2027-03-10", hour: 9, visitor: "v1", path: "/ghid", source: "direct", device: "telefon", at: new Date("2027-03-10T09:05:00Z") },
      { day: "2027-03-10", hour: 9, visitor: "v2", path: "/", source: "fb-romani-new-york", device: "telefon", at: new Date("2027-03-10T09:01:00Z") },
      { day: "2027-03-10", hour: 9, visitor: "v3", path: "/", source: "google", device: "calculator", at: new Date("2027-03-10T09:02:00Z") },
    ]);
  });

  it("fiecare cont își are sursa; cele de dinainte sunt „necunoscut”", async () => {
    const keys = await sourceKeys(db);
    expect(keys.get("vechi")).toBe("necunoscut");
    expect(keys.get("ana")).toBe("fb-romani-new-york");
    expect(keys.get("ion")).toBe("google");
    expect(keys.get("maria")).toBe("fara-acord");
    const m = await personSource(db, "maria");
    expect(m.row).toMatchObject({ analytics: false, answer: "altceva", answerOther: "radio", source: null, device: null });
  });

  it("Analiză → Surse: vizitatori, conturi, arbori, plăți, venituri și rata", async () => {
    const rows = await sourcesReport(db, R);
    const fb = rows.find((r) => r.key === "fb-romani-new-york")!;
    expect(fb).toMatchObject({ visitors: 2, accounts: 1, trees: 1, paid: 1, lei: 50, rate: 50 });
    expect(rows.find((r) => r.key === "google")).toMatchObject({ visitors: 1, accounts: 1, paid: 0 });
    expect(rows.find((r) => r.key === "necunoscut")?.accounts).toBe(1);
    expect(rows[0].accounts).toBeGreaterThanOrEqual(rows.at(-1)!.accounts);
    const a = await answersReport(db, R);
    expect(a.others).toEqual(["radio"]);
  });

  it("linkurile: eticheta unică, click-uri și conturi", async () => {
    expect(await createLink(db, "FB Români New York", "/", null)).toBe("fb-romani-new-york");
    expect(await createLink(db, "FB Români New York", "/nicaieri", null)).toBe("fb-romani-new-york-2");
    const list = await linkList(db);
    const fb = list.find((l) => l.slug === "fb-romani-new-york")!;
    expect(fb).toMatchObject({ clicks: 2, accounts: 1 });
    expect(list.find((l) => l.slug === "fb-romani-new-york-2")).toMatchObject({ page: "/", clicks: 0, accounts: 0 });
  });
});
