import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, auditLog, giftCards, user } from "@/db/schema";
import {
  ALPHABET, addMonths, attemptsLastHour, batchCards, cancelCards, checkBatch, checkCode, checkPartner, createBatch, giftCardsEnabled,
  markDelivered, markSold, newCode, normalizeCode, partnerReport, pinMatches, hashPin, portalSession, portalSessionOk, recordAttempt,
  redeemCard, savePartner, setGiftCardsEnabled, testBatchOnce, toCsv,
} from "@/lib/carduri-cadou";

describe("codurile cardurilor cadou", () => {
  it("au forma XXXX-XXXX-XXXX, fără 0/O/1/I, și sunt diferite", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const c = newCode();
      expect(c).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
      expect(c).not.toMatch(/[01OI]/);
      seen.add(c);
    }
    expect(seen.size).toBe(2000);
    expect(ALPHABET).toHaveLength(32);
  });
  it("codul scris de om se aduce la forma lui", () => {
    expect(normalizeCode(" abcd efgh jkmn ")).toBe("ABCD-EFGH-JKMN");
    expect(normalizeCode("abcd-efgh-jkmn")).toBe("ABCD-EFGH-JKMN");
    expect(normalizeCode("ABCD-EFGH-JKM")).toBeNull();
    expect(normalizeCode("ABCD-EFGH-JKM0")).toBeNull();
    expect(normalizeCode(undefined)).toBeNull();
  });
  it("lunile se adună fără să sară peste sfârșitul lunii", () => {
    expect(addMonths(new Date("2027-01-31T10:00:00Z"), 1)).toEqual(new Date("2027-02-28T10:00:00Z"));
    expect(addMonths(new Date("2027-03-15T00:00:00Z"), 12)).toEqual(new Date("2028-03-15T00:00:00Z"));
  });
  it("PIN-ul și sesiunea magazinului", () => {
    const h = hashPin("123456");
    expect(pinMatches("123456", h)).toBe(true);
    expect(pinMatches("123457", h)).toBe(false);
    expect(pinMatches("12", h)).toBe(false);
    const s = portalSession("tok", h, 1000);
    expect(portalSessionOk(s, "tok", h, 2000)).toBe(true);
    expect(portalSessionOk(s, "alt", h, 2000)).toBe(false);
    expect(portalSessionOk(s, "tok", hashPin("123456"), 2000)).toBe(false); // PIN nou: sesiunea veche nu mai merge
    expect(portalSessionOk(s, "tok", h, 1000 + 13 * 3_600_000)).toBe(false);
  });
  it("formularele se verifică", () => {
    expect(checkPartner({ numeMagazin: "" })).toHaveProperty("error");
    expect(checkPartner({ numeMagazin: "Librăria X", comisionProcent: "130" })).toHaveProperty("error");
    expect(checkPartner({ numeMagazin: "Librăria X", activ: "on" })).toMatchObject({ ok: { comisionProcent: 25, activ: true } });
    expect(checkBatch({ partnerId: "x", cantitate: "5" })).toHaveProperty("error");
    const id = "00000000-0000-0000-0000-000000000001";
    expect(checkBatch({ partnerId: id, cantitate: "0" })).toHaveProperty("error");
    expect(checkBatch({ partnerId: id, cantitate: "5" })).toEqual({ ok: { partnerId: id, plan: "basic", durataLuni: 12, pretRaftLei: 49, cantitate: 5 } });
    expect(checkBatch({ partnerId: id, cantitate: "5", plan: "gold" })).toHaveProperty("error");
  });
  it("CSV-ul nu lasă formule", () => {
    expect(toCsv(["a"], [["=1+1"], ["x,y"]])).toBe("﻿a\r\n'=1+1\r\n\"x,y\"\r\n");
  });
});

describe("fluxul de activare, în baza de date", () => {
  let db: Db; let partnerId: string; let batchId: string; let codes: string[];
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([{ id: "a1", name: "Admin", email: "admin@test.ro" }, { id: "u1", name: "Ana", email: "ana@test.ro" },
      { id: "u2", name: "Ion", email: "ion@test.ro" }, { id: "u3", name: "Maria", email: "maria@test.ro" }]);
    partnerId = await savePartner(db, null, { numeMagazin: "Librăria Test", oras: "Cluj", adresa: null, persoanaContact: null, telefon: null, email: null, comisionProcent: 25, activ: true, note: null }, "a1");
    batchId = await createBatch(db, { partnerId, plan: "basic", durataLuni: 12, pretRaftLei: 49, cantitate: 5 }, "a1");
    codes = (await batchCards(db, batchId)).map((c) => c.cod);
  });

  it("lotul are 5 coduri numerotate, toate „generat”, iar funcția pornește oprită", async () => {
    const cards = await batchCards(db, batchId);
    expect(cards.map((c) => c.seq)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(cards.map((c) => c.status))).toEqual(new Set(["generat"]));
    expect(await giftCardsEnabled(db)).toBe(false);
  });

  it("cu funcția oprită, codurile nu merg", async () => {
    expect(await checkCode(db, codes[0])).toBe("inactive");
    expect((await redeemCard(db, codes[0], "u1")).result).toBe("inactive");
    await setGiftCardsEnabled(db, true, "a1");
    expect(await giftCardsEnabled(db)).toBe(true);
  });

  it("un cod nevândut nu se poate activa; unul inexistent e invalid", async () => {
    expect(await checkCode(db, codes[0])).toBe("not_sold");
    expect((await redeemCard(db, codes[0], "u1")).result).toBe("not_sold");
    expect((await redeemCard(db, "ZZZZ-ZZZZ-ZZZZ", "u1")).result).toBe("invalid");
    expect((await redeemCard(db, "nu e cod", "u1")).result).toBe("invalid");
  });

  it("livrat, apoi vândut (interval), apoi activat: un an Basic de azi", async () => {
    expect(await markDelivered(db, { batchId }, "a1")).toBe(5);
    expect(await markSold(db, { batchId, from: 1, to: 2 }, "a1", "admin")).toBe(2);
    expect(await checkCode(db, codes[0].toLowerCase())).toBe("ok");
    const now = new Date("2027-01-10T12:00:00Z");
    const r = await redeemCard(db, codes[0], "u1", now);
    expect(r).toMatchObject({ result: "ok", plan: "basic", until: new Date("2028-01-10T12:00:00Z") });
    const [p] = await db.select().from(accountPlan).where(eq(accountPlan.userId, "u1"));
    expect(p).toMatchObject({ plan: "familie", tier: "basic", paidUntil: new Date("2028-01-10T12:00:00Z") });
    const [c] = await db.select().from(giftCards).where(eq(giftCards.cod, codes[0]));
    expect(c).toMatchObject({ status: "folosit", redeemedByUserId: "u1" });
  });

  it("un cod folosit nu mai merge, nici a doua oară", async () => {
    expect((await redeemCard(db, codes[0], "u2")).result).toBe("used");
    expect((await redeemCard(db, codes[0], "u1")).result).toBe("used_by_you");
    expect(await checkCode(db, codes[0])).toBe("used");
  });

  it("cine are deja anul plătit primește durata cardului în continuare, iar planul mai mare rămâne", async () => {
    await db.insert(accountPlan).values({ userId: "u2", plan: "familie", tier: "premium", paidUntil: new Date("2027-06-01T00:00:00Z") });
    const r = await redeemCard(db, codes[1], "u2", new Date("2027-02-01T00:00:00Z"));
    expect(r).toMatchObject({ result: "ok", plan: "premium", until: new Date("2028-06-01T00:00:00Z") });
  });

  it("magazinul poate marca doar cardurile lui; anularea oprește codul", async () => {
    const other = await savePartner(db, null, { numeMagazin: "Alt magazin", oras: null, adresa: null, persoanaContact: null, telefon: null, email: null, comisionProcent: 10, activ: true, note: null }, "a1");
    expect(await markSold(db, { cod: codes[2] }, null, "magazin", new Date(), other)).toBe(0);
    expect(await markSold(db, { cod: codes[2] }, null, "magazin", new Date(), partnerId)).toBe(1);
    expect(await cancelCards(db, { cod: codes[3] }, "a1")).toBe(1);
    expect((await redeemCard(db, codes[3], "u3")).result).toBe("cancelled");
    expect(await cancelCards(db, { cod: codes[0] }, "a1")).toBe(0); // folosit: nu se mai anulează
  });

  it("raportul: generate, vândute, activate și comisionul", async () => {
    const [r] = (await partnerReport(db)).filter((x) => x.partnerId === partnerId);
    expect(r).toMatchObject({ generate: 5, vandute: 3, activate: 2, anulate: 1, incasariLei: 147, comisionLei: 36.75 });
  });

  it("jurnalul are generarea, vânzarea, activarea și anularea", async () => {
    const acts = (await db.select({ a: auditLog.action }).from(auditLog).where(eq(auditLog.entity, "card_cadou"))).map((x) => x.a);
    for (const a of ["lot_generat", "livrat", "vandut", "activat", "anulat", "pornit"]) expect(acts).toContain(a);
  });

  it("limita de încercări numără pe oră", async () => {
    const now = new Date("2027-03-01T10:00:00Z");
    for (let i = 0; i < 10; i++) await recordAttempt(db, ["ip:x"], false, now);
    expect(await attemptsLastHour(db, ["ip:x", "u:y"], new Date("2027-03-01T10:30:00Z"))).toBe(10);
    expect(await attemptsLastHour(db, ["ip:x"], new Date("2027-03-01T11:01:00Z"))).toBe(0);
  });

  it("lotul de test se face o singură dată", async () => {
    expect(await testBatchOnce(db)).toMatch(/^lot /);
    expect(await testBatchOnce(db)).toBe("deja");
  });
});

describe("pluralul în română", () => {
  it("1 card, 2 carduri, 20 de carduri", async () => {
    const { pl } = await import("@/lib/carduri-cadou");
    expect(pl(1, "card vândut", "carduri vândute")).toBe("1 card vândut");
    expect(pl(0, "card", "carduri")).toBe("0 carduri");
    expect(pl(5, "card", "carduri")).toBe("5 carduri");
    expect(pl(19, "card", "carduri")).toBe("19 carduri");
    expect(pl(20, "card", "carduri")).toBe("20 de carduri");
    expect(pl(101, "card", "carduri")).toBe("101 carduri");
    expect(pl(120, "card", "carduri")).toBe("120 de carduri");
  });
});
