import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, payment, tree, treeMember, user } from "@/db/schema";
import { applyPayment, bookPaid, paidSession, priceFor } from "@/lib/plati";
import { DEFAULT_SETTINGS, accessFor, fullMedia, isKept, keepEnd, mayKeep, type Access } from "@/lib/plans";

const s = { ...DEFAULT_SETTINGS, on: true, startedAt: "2026-01-01T00:00:00.000Z", betaDays: 0 };
const now = new Date("2027-06-01T00:00:00Z");
const created = new Date("2026-02-01T00:00:00Z");

describe("Păstrarea", () => {
  it("o poate lua doar cine a avut un an, după ce s-a terminat", () => {
    const paid = accessFor({ createdAt: created, plan: "familie", paidUntil: new Date("2027-02-01"), tier: "basic" }, s, now);
    expect(paid.kind).toBe("expirat");
    expect(mayKeep(paid)).toBe(true);
    expect(isKept(paid)).toBe(false);
    const trialOnly = accessFor({ createdAt: created, plan: null, paidUntil: null }, s, now);
    expect(mayKeep(trialOnly)).toBe(false);
    const running = accessFor({ createdAt: created, plan: "familie", paidUntil: new Date("2028-01-01"), tier: "basic" }, s, now);
    expect(mayKeep(running)).toBe(false);
    const beta = accessFor({ createdAt: new Date("2025-06-01"), plan: null, paidUntil: null }, { ...s, betaDays: 365 }, now);
    expect(beta.kind).toBe("expirat");
    expect(mayKeep(beta)).toBe(true);
  });

  it("cât o are, arborele rămâne doar de citit, dar pozele se deschid întregi", () => {
    const kept = accessFor({ createdAt: created, plan: "familie", paidUntil: new Date("2027-02-01"), tier: "basic", keepUntil: new Date("2028-02-01") }, s, now);
    expect(kept.kind).toBe("expirat");
    expect(isKept(kept)).toBe(true);
    const visitor: Access = { kind: "expirat", since: now };
    expect(fullMedia(kept, visitor)).toBe(true);
    const ended = accessFor({ createdAt: created, plan: "familie", paidUntil: new Date("2027-02-01"), tier: "basic", keepUntil: new Date("2027-05-01") }, s, now);
    expect(isKept(ended)).toBe(false);
    expect(mayKeep(ended)).toBe(true);
    expect(fullMedia(ended, visitor)).toBe(false);
    // Cine își are el însuși anul vede tot; la fel cât titularul ține arborele.
    expect(fullMedia(ended, { kind: "platit", until: new Date("2030-01-01"), tier: "basic" })).toBe(true);
    expect(fullMedia({ kind: "platit", until: new Date("2030-01-01"), tier: "basic" }, visitor)).toBe(true);
    expect(fullMedia({ kind: "proba", until: now, daysLeft: 3 }, visitor)).toBe(true);
    expect(fullMedia(null, visitor)).toBe(false);
  });

  it("un an de azi sau după cea în curs; prețul din Admin", () => {
    expect(keepEnd({ kind: "expirat", since: now }, now).toISOString()).toBe("2028-05-31T00:00:00.000Z");
    expect(keepEnd({ kind: "expirat", since: now, keptUntil: new Date("2027-12-01T00:00:00Z") }, now).toISOString()).toBe("2028-11-30T00:00:00.000Z");
    expect(priceFor("pastrare", "ro", true, DEFAULT_SETTINGS)).toEqual({ amount: 2500, currency: "ron", label: "25 lei" });
    expect(priceFor("pastrare", "de", true, DEFAULT_SETTINGS)).toMatchObject({ amount: 500, currency: "eur" });
  });

  it("confirmarea Stripe: Păstrarea, cu sau fără carte", () => {
    const ev = (md: Record<string, string>) => ({ type: "checkout.session.completed", data: { object: { id: "cs_k", payment_status: "paid", amount_total: 2500, currency: "ron", metadata: md } } });
    expect(paidSession(ev({ kind: "pastrare", userId: "u1" }))).toMatchObject({ kind: "pastrare", userId: "u1" });
    expect(paidSession(ev({ kind: "pastrare", userId: "u1", treeId: "t", extra: "carte" }))).toMatchObject({ kind: "pastrare", treeId: "t", extra: "carte" });
  });

  describe("în baza de date", () => {
    let db: Db; let treeId: string;
    beforeAll(async () => {
      db = createDb();
      await runMigrations(db);
      await db.insert(user).values({ id: "k1", name: "Ana", email: "ana@test.ro" });
      [{ id: treeId }] = await db.insert(tree).values({ name: "Neamul", ownerId: "k1" }).returning({ id: tree.id });
      await db.insert(treeMember).values({ treeId, userId: "k1", role: "owner" });
      await db.insert(accountPlan).values({ userId: "k1", plan: "familie", paidUntil: new Date("2027-02-01"), tier: "basic" });
    });

    it("se adaugă un an, se prelungește, iar pachetul trece și cartea", async () => {
      const p = { id: "cs_k1", kind: "pastrare" as const, userId: "k1", treeId: null, amount: 2500, currency: "ron" };
      expect(await applyPayment(db, p, now)).toBe(true);
      expect(await applyPayment(db, p, now)).toBe(false);
      let [r] = await db.select().from(accountPlan).where(eq(accountPlan.userId, "k1"));
      expect(r.keepUntil?.toISOString()).toBe("2028-05-31T00:00:00.000Z");
      expect(r.paidUntil?.toISOString()).toBe("2027-02-01T00:00:00.000Z");
      expect(await applyPayment(db, { ...p, id: "cs_k2", treeId, extra: "carte" }, now)).toBe(true);
      [r] = await db.select().from(accountPlan).where(eq(accountPlan.userId, "k1"));
      expect(r.keepUntil?.toISOString()).toBe("2029-05-31T00:00:00.000Z");
      expect(await bookPaid(db, "k1", treeId, now)).toBe(true);
      const rows = await db.select().from(payment).where(eq(payment.userId, "k1"));
      expect(rows.map((x) => x.kind).sort()).toEqual(["carte", "pastrare", "pastrare"]);
    });
  });
});
