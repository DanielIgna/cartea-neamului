import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, tree, treeMember, user } from "@/db/schema";
import { applyPayment, bookPaid, createCheckout, paidSession, priceFor, verifyStripeSignature } from "@/lib/plati";
import { DEFAULT_SETTINGS } from "@/lib/plans";

const sign = (payload: string, secret: string, t: number) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;

describe("plata cu cardul", () => {
  it("semnătura confirmării Stripe: bună, greșită, prea veche", () => {
    const now = 1_800_000_000_000, t = now / 1000;
    expect(verifyStripeSignature("{}", sign("{}", "whsec_x", t), "whsec_x", now)).toBe(true);
    expect(verifyStripeSignature("{}", sign("{}", "alt", t), "whsec_x", now)).toBe(false);
    expect(verifyStripeSignature("{ }", sign("{}", "whsec_x", t), "whsec_x", now)).toBe(false);
    expect(verifyStripeSignature("{}", sign("{}", "whsec_x", t - 600), "whsec_x", now)).toBe(false);
    expect(verifyStripeSignature("{}", null, "whsec_x", now)).toBe(false);
    expect(verifyStripeSignature("{}", sign("{}", "", t), "", now)).toBe(false);
  });

  it("prețurile: lei în română, euro în rest; ruda invitată plătește prețul ei", () => {
    const s = { ...DEFAULT_SETTINGS, invitePriceLei: 30 };
    expect(priceFor("an", "ro", true, s)).toEqual({ amount: 5000, currency: "ron", label: "50 lei" });
    expect(priceFor("an", "ro", false, s)).toMatchObject({ amount: 3000 });
    expect(priceFor("an", "de", true, s)).toEqual({ amount: 1000, currency: "eur", label: "10 €" });
    expect(priceFor("carte", "ro", false, s)).toEqual({ amount: 9900, currency: "ron", label: "99 lei" });
  });

  it("pagina de plată din Stripe se cere cu suma, limba și cine plătește", async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_u: string, init: RequestInit) => { sent = init.body as URLSearchParams; return new Response(JSON.stringify({ url: "https://checkout.stripe.com/x" })); }) as typeof fetch;
    const url = await createCheckout({ kind: "carte", userId: "u1", email: "a@b.ro", treeId: "t1", name: "Carte", amount: 9900, currency: "ron", locale: "en-GB", successUrl: "https://s/ok", cancelUrl: "https://s/no" }, fake);
    expect(url).toBe("https://checkout.stripe.com/x");
    expect(sent!.get("line_items[0][price_data][unit_amount]")).toBe("9900");
    expect(sent!.get("locale")).toBe("en");
    expect(sent!.get("metadata[treeId]")).toBe("t1");
    const bad = (async () => new Response(JSON.stringify({ error: { message: "nu" } }), { status: 400 })) as unknown as typeof fetch;
    await expect(createCheckout({ kind: "an", userId: "u1", email: "a@b.ro", name: "An", amount: 1, currency: "ron", locale: "ro", successUrl: "x", cancelUrl: "y" }, bad)).rejects.toThrow("Stripe: nu");
  });

  it("din evenimente, doar plățile încheiate cu bani primiți", () => {
    const ev = (o: object, type = "checkout.session.completed") => ({ type, data: { object: { id: "cs_1", payment_status: "paid", amount_total: 5000, currency: "ron", metadata: { kind: "an", userId: "u1" }, ...o } } });
    expect(paidSession(ev({}))).toEqual({ id: "cs_1", kind: "an", userId: "u1", treeId: null, amount: 5000, currency: "ron" });
    expect(paidSession(ev({ payment_status: "unpaid" }))).toBeNull();
    expect(paidSession(ev({ metadata: { kind: "altceva", userId: "u1" } }))).toBeNull();
    expect(paidSession(ev({}, "payment_intent.created"))).toBeNull();
  });

  describe("în baza de date", () => {
    let db: Db; let treeId: string;
    beforeAll(async () => {
      db = createDb();
      await runMigrations(db);
      await db.insert(user).values([{ id: "u1", name: "Ana", email: "ana@test.ro" }, { id: "u2", name: "Ion", email: "ion@test.ro" }]);
      [{ id: treeId }] = await db.insert(tree).values({ name: "Neamul", ownerId: "u1" }).returning({ id: tree.id });
      await db.insert(treeMember).values({ treeId, userId: "u1", role: "owner" });
    });

    it("anul se trece o singură dată și se adaugă după anul deja plătit", async () => {
      const now = new Date("2027-01-01T00:00:00Z");
      const p = { id: "cs_a", kind: "an" as const, userId: "u1", treeId: null, amount: 5000, currency: "ron" };
      expect(await applyPayment(db, p, now)).toBe(true);
      expect(await applyPayment(db, p, now)).toBe(false);
      let [r] = await db.select().from(accountPlan);
      expect(r).toMatchObject({ plan: "familie", paidUntil: new Date("2028-01-01T00:00:00Z") });
      await applyPayment(db, { ...p, id: "cs_b" }, new Date("2027-06-01T00:00:00Z"));
      [r] = await db.select().from(accountPlan);
      expect(r.paidUntil).toEqual(new Date("2028-12-31T00:00:00Z"));
    });

    it("„gratuit mereu” rămâne așa și după o plată", async () => {
      await db.insert(accountPlan).values({ userId: "u2", plan: "mereu" });
      await applyPayment(db, { id: "cs_c", kind: "an", userId: "u2", treeId: null, amount: 5000, currency: "ron" }, new Date("2027-01-01"));
      const rows = await db.select().from(accountPlan);
      expect(rows.find((x) => x.userId === "u2")?.plan).toBe("mereu");
    });

    it("o plată pentru un cont sau un arbore șters se păstrează, fără să cadă confirmarea", async () => {
      expect(await applyPayment(db, { id: "cs_x", kind: "carte", userId: "nimeni", treeId: "00000000-0000-0000-0000-000000000000", amount: 9900, currency: "ron" })).toBe(true);
      expect(await applyPayment(db, { id: "cs_y", kind: "an", userId: "nimeni", treeId: null, amount: 5000, currency: "ron" })).toBe(true);
    });

    it("cartea PDF e plătită 12 luni, doar pentru cel care a plătit-o", async () => {
      const now = new Date("2027-02-01T00:00:00Z");
      expect(await bookPaid(db, "u1", treeId, now)).toBe(false);
      await applyPayment(db, { id: "cs_d", kind: "carte", userId: "u1", treeId, amount: 9900, currency: "ron" }, now);
      expect(await bookPaid(db, "u1", treeId, now)).toBe(true);
      expect(await bookPaid(db, "u2", treeId, now)).toBe(false);
      expect(await bookPaid(db, "u1", treeId, new Date("2028-02-02T00:00:00Z"))).toBe(false);
    });
  });
});
