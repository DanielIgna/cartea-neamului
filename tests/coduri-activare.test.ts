import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, activationCode, auditLog, user } from "@/db/schema";
import {
  CODE_ALPHABET, activareUrl, activateCode, activationWhos, cancelCodes, checkActivationCode, checkLot, codesCsv, generateLot, listCodes,
  newActivationCode, normalizeActivationCode, normalizeSource, recordAttempt, sourceSummary, tooManyAttempts,
} from "@/lib/coduri-activare";

describe("codurile de activare", () => {
  it("au forma CN-PLAN-XXXX-XXXX, fără 0/O, 1/I/L, și sunt diferite", () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    expect(CODE_ALPHABET).not.toMatch(/[01OIL]/);
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const c = newActivationCode(i % 3 === 0 ? "basic" : i % 3 === 1 ? "familie" : "premium");
      expect(c).toMatch(/^CN-(BAS|FAM|PRE)-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
      seen.add(c);
    }
    expect(seen.size).toBe(3000);
    expect(newActivationCode("familie").startsWith("CN-FAM-")).toBe(true);
  });
  it("codul tastat se aduce la forma lui", () => {
    expect(normalizeActivationCode(" cn fam 7k4m q9xt ")).toBe("CN-FAM-7K4M-Q9XT");
    expect(normalizeActivationCode("cn-fam-7k4m-q9xt")).toBe("CN-FAM-7K4M-Q9XT");
    expect(normalizeActivationCode("FAM-7K4M-Q9XT")).toBe("CN-FAM-7K4M-Q9XT");
    expect(normalizeActivationCode("CN-FAM-7K4M-Q9X0")).toBeNull(); // 0 nu există
    expect(normalizeActivationCode("CN-FAM-7K4M-Q9XL")).toBeNull(); // L nu există
    expect(normalizeActivationCode("CN-GLD-7K4M-Q9XT")).toBeNull(); // plan necunoscut
    expect(normalizeActivationCode("CN-FAM-7K4M")).toBeNull();
    expect(normalizeActivationCode(undefined)).toBeNull();
  });
  it("sursa și formularul lotului", () => {
    expect(normalizeSource(" Trendyol RO ")).toBe("trendyol-ro");
    expect(normalizeSource("  ")).toBeNull();
    expect(checkLot({ plan: "gold", cantitate: "5", sursa: "trendyol" })).toHaveProperty("error");
    expect(checkLot({ plan: "basic", cantitate: "0", sursa: "trendyol" })).toHaveProperty("error");
    expect(checkLot({ plan: "basic", cantitate: "5", sursa: "" })).toHaveProperty("error");
    expect(checkLot({ plan: "premium", cantitate: "5", sursa: "Trendyol" })).toEqual({ ok: { plan: "premium", cantitate: 5, sursa: "trendyol" } });
    expect(activareUrl("CN-FAM-7K4M-Q9XT")).toBe("https://carteaneamului.ro/activare?cod=CN-FAM-7K4M-Q9XT");
  });
});

describe("activarea, în baza de date", () => {
  let db: Db; let lot: string; let codes: string[];
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([{ id: "a1", name: "Admin", email: "admin@test.ro" }, { id: "u1", name: "Ana", email: "ana@test.ro" },
      { id: "u2", name: "Ion", email: "ion@test.ro" }, { id: "u3", name: "Maria", email: "maria@test.ro" }, { id: "u4", name: "Vlad", email: "vlad@test.ro" }]);
    ({ lot, coduri: codes } = await generateLot(db, { plan: "familie", cantitate: 5, sursa: "trendyol" }, "a1", new Date("2027-01-01T00:00:00Z")));
  });

  it("lotul: 5 coduri Familie, nefolosite, cu sursa și lotul lor", async () => {
    expect(codes).toHaveLength(5);
    expect(lot).toMatch(/^trendyol-20270101-[2-9A-Z]{4}$/);
    const rows = await listCodes(db, { lot });
    expect(rows).toHaveLength(5);
    expect(new Set(rows.map((r) => r.status))).toEqual(new Set(["nefolosit"]));
    expect(rows.every((r) => r.plan === "familie" && r.durataLuni === 12 && r.sursa === "trendyol")).toBe(true);
  });

  it("un cont nou primește planul pe 12 luni, fără plată", async () => {
    expect(await checkActivationCode(db, codes[0].toLowerCase())).toBe("ok");
    const now = new Date("2027-01-10T12:00:00Z");
    const r = await activateCode(db, codes[0], "u1", now);
    expect(r).toMatchObject({ result: "ok", plan: "familie", until: new Date("2028-01-10T12:00:00Z"), extended: false });
    const [p] = await db.select().from(accountPlan).where(eq(accountPlan.userId, "u1"));
    expect(p).toMatchObject({ tier: "familie", paidUntil: new Date("2028-01-10T12:00:00Z") });
    const [c] = await db.select().from(activationCode).where(eq(activationCode.cod, codes[0]));
    expect(c).toMatchObject({ status: "folosit", usedByUserId: "u1", usedAt: now });
    const log = await db.select().from(auditLog).where(eq(auditLog.entityId, codes[0]));
    expect(log.map((l) => [l.entity, l.action])).toEqual([["cod_activare", "activat"]]);
  });

  it("același cod a doua oară: „deja folosit” (și pentru cel care l-a folosit, fără încă un an)", async () => {
    expect((await activateCode(db, codes[0], "u2")).result).toBe("used");
    expect(await activateCode(db, codes[0], "u1")).toMatchObject({ result: "used_by_you", plan: "familie", until: new Date("2028-01-10T12:00:00Z") });
    expect(await checkActivationCode(db, codes[0])).toBe("used");
  });

  it("cine are un an plătit (fără reînnoire automată) primește cele 12 luni în continuare; planul mai mare rămâne", async () => {
    await db.insert(accountPlan).values({ userId: "u2", plan: "familie", tier: "premium", paidUntil: new Date("2027-06-01T00:00:00Z") });
    const r = await activateCode(db, codes[1], "u2", new Date("2027-02-01T00:00:00Z"));
    expect(r).toMatchObject({ result: "ok", plan: "premium", until: new Date("2028-06-01T00:00:00Z"), extended: true });
  });

  it("un abonament care se reînnoiește singur nu e atins: codul rămâne nefolosit", async () => {
    await db.insert(accountPlan).values({ userId: "u3", plan: "familie", tier: "basic", paidUntil: new Date("2027-03-01T00:00:00Z"), stripeSub: "sub_1", subRenews: true });
    expect((await activateCode(db, codes[2], "u3", new Date("2027-02-01T00:00:00Z"))).result).toBe("has_subscription");
    const [c] = await db.select().from(activationCode).where(eq(activationCode.cod, codes[2]));
    expect(c.status).toBe("nefolosit");
    const [p] = await db.select().from(accountPlan).where(eq(accountPlan.userId, "u3"));
    expect(p.paidUntil).toEqual(new Date("2027-03-01T00:00:00Z"));
    // După ce oprește reînnoirea, lunile se adaugă la capătul perioadei plătite.
    await db.update(accountPlan).set({ subRenews: false }).where(eq(accountPlan.userId, "u3"));
    const r = await activateCode(db, codes[2], "u3", new Date("2027-02-01T00:00:00Z"));
    expect(r).toMatchObject({ result: "ok", plan: "familie", until: new Date("2028-03-01T00:00:00Z") });
  });

  it("anularea: doar codurile nefolosite; un cod anulat nu mai merge", async () => {
    const rows = await listCodes(db, { lot });
    const byCod = new Map(rows.map((r) => [r.cod, r.id]));
    expect(await cancelCodes(db, [byCod.get(codes[3])!, byCod.get(codes[0])!], "a1")).toBe(1); // codes[0] e folosit
    expect((await activateCode(db, codes[3], "u4")).result).toBe("cancelled");
    expect(await checkActivationCode(db, codes[3])).toBe("cancelled");
    expect((await activateCode(db, "CN-FAM-ZZZZ-ZZZZ", "u4")).result).toBe("invalid");
    expect((await activateCode(db, "nu e cod", "u4")).result).toBe("invalid");
  });

  it("două activări deodată nu pot folosi același cod", async () => {
    const res = await Promise.all([activateCode(db, codes[4], "u4"), activateCode(db, codes[4], "a1")]);
    expect(res.filter((r) => r.result === "ok")).toHaveLength(1);
  });

  it("rezumatul pe surse, filtrele și CSV-ul cu linkul de activare", async () => {
    expect(await sourceSummary(db)).toEqual([{ sursa: "trendyol", nefolosit: 0, folosit: 4, anulat: 1 }]);
    expect(await listCodes(db, { status: "anulat" })).toHaveLength(1);
    expect(await listCodes(db, { sursa: "emag" })).toHaveLength(0);
    const csv = await codesCsv(db, { lot });
    expect(csv.split("\r\n")[0]).toBe("﻿cod,link_activare,plan,durata_luni,sursa,lot,status,creat,folosit_la");
    expect(csv).toContain(`${codes[0]},https://carteaneamului.ro/activare?cod=${codes[0]},familie,12,trendyol`);
  });

  it("limita: 10 încercări pe oră de pe un IP", async () => {
    const who = activationWhos("10.0.0.1");
    const now = new Date();
    for (let i = 0; i < 9; i++) await recordAttempt(db, who, false, now);
    expect(await tooManyAttempts(db, who, now)).toBe(false);
    await recordAttempt(db, who, false, now);
    expect(await tooManyAttempts(db, who, now)).toBe(true);
    expect(await tooManyAttempts(db, activationWhos("10.0.0.2"), now)).toBe(false);
    expect(await tooManyAttempts(db, who, new Date(now.getTime() + 61 * 60_000))).toBe(false);
  });
});
