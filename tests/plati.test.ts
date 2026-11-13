import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, tree, treeMember, user } from "@/db/schema";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { applyPayment, bookIncluded, bookPaid, claimIncludedBook, createCheckout, includedBooksLeft, paidSession, priceFor, quoteYear, verifyStripeSignature } from "@/lib/plati";
import { DEFAULT_SETTINGS, accessFor, limitsFor, type Access } from "@/lib/plans";
import { document, person } from "@/db/schema";

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
    expect(sent!.get("allow_promotion_codes")).toBe("true");
    const bad = (async () => new Response(JSON.stringify({ error: { message: "nu" } }), { status: 400 })) as unknown as typeof fetch;
    await expect(createCheckout({ kind: "an", userId: "u1", email: "a@b.ro", name: "An", amount: 1, currency: "ron", locale: "ro", successUrl: "x", cancelUrl: "y" }, bad)).rejects.toThrow("Stripe: nu");
  });

  it("din evenimente, doar plățile încheiate cu bani primiți", () => {
    const ev = (o: object, type = "checkout.session.completed") => ({ type, data: { object: { id: "cs_1", payment_status: "paid", amount_total: 5000, currency: "ron", metadata: { kind: "an", userId: "u1" }, ...o } } });
    expect(paidSession(ev({}))).toEqual({ id: "cs_1", kind: "an", userId: "u1", treeId: null, amount: 5000, currency: "ron", tier: "basic", upgradeFrom: null });
    expect(paidSession(ev({ metadata: { kind: "an", userId: "u1", tier: "premium", upgradeFrom: "familie" } }))).toMatchObject({ tier: "premium", upgradeFrom: "familie" });
    expect(paidSession(ev({ payment_status: "unpaid" }))).toBeNull();
    // Cu un cod promoțional: suma e mai mică (sau zero), accesul e același.
    expect(paidSession(ev({ amount_total: 200 }))).toMatchObject({ kind: "an", userId: "u1", amount: 200 });
    expect(paidSession(ev({ amount_total: 0, payment_status: "no_payment_required" }))).toMatchObject({ kind: "an", amount: 0 });
    expect(paidSession(ev({ amount_total: 200 }, "checkout.session.async_payment_succeeded"))).toMatchObject({ amount: 200 });
    expect(paidSession(ev({ metadata: { kind: "altceva", userId: "u1" } }))).toBeNull();
    expect(paidSession(ev({}, "payment_intent.created"))).toBeNull();
  });

  it("prețul anului pe fiecare plan, în lei și în euro", () => {
    const s = DEFAULT_SETTINGS;
    expect(priceFor("an", "ro", true, s, "basic").label).toBe("50 lei");
    expect(priceFor("an", "ro", true, s, "familie")).toEqual({ amount: 14900, currency: "ron", label: "149 lei" });
    expect(priceFor("an", "ro", true, s, "premium")).toEqual({ amount: 24900, currency: "ron", label: "249 lei" });
    expect(priceFor("an", "de", true, s, "familie")).toEqual({ amount: 3000, currency: "eur", label: "30 €" });
    expect(priceFor("an", "fr", true, s, "premium").amount).toBe(5000);
    expect(priceFor("an", "ro", true, { ...s, familieLei: 159 }, "familie").amount).toBe(15900);
  });

  it("trecerea pe un plan mai scump: doar diferența pe zilele rămase, data de sfârșit rămâne", () => {
    const s = DEFAULT_SETTINGS, now = new Date("2027-01-01T00:00:00Z");
    const until = new Date(now.getTime() + 100 * 86_400_000);
    const basic: Access = { kind: "platit", until, tier: "basic" };
    // (149 − 50) × 100 / 365 = 27,1232… → 27,12
    expect(quoteYear("familie", basic, true, "ro", s, now)).toEqual({ ok: true, tier: "familie", value: 27.12, upgradeFrom: "basic", until, daysLeft: 100 });
    // (50 − 30) × 100 / 365 = 5,479… → 5,48 €
    expect(quoteYear("premium", { ...basic, tier: "familie" }, true, "de", s, now)).toMatchObject({ value: 5.48, upgradeFrom: "familie" });
    // Cel puțin 1 leu.
    const soon: Access = { kind: "platit", until: new Date(now.getTime() + 86_400_000), tier: "basic" };
    expect(quoteYear("familie", soon, true, "ro", s, now)).toMatchObject({ value: 1 });
    // Același plan: prețul întreg; un plan mai mic: nu se poate.
    expect(quoteYear("basic", basic, true, "ro", s, now)).toMatchObject({ ok: true, value: 50, upgradeFrom: null });
    expect(quoteYear("basic", { ...basic, tier: "premium" }, true, "ro", s, now)).toEqual({ ok: false, reason: "downgrade" });
    // Fără an plătit sau expirat: prețul întreg.
    expect(quoteYear("premium", { kind: "expirat", since: now }, true, "ro", s, now)).toMatchObject({ ok: true, value: 249, upgradeFrom: null, until: null });
    expect(quoteYear("familie", { kind: "proba", until: now, daysLeft: 3 }, true, "ro", s, now)).toMatchObject({ value: 149 });
    expect(quoteYear("familie", { kind: "mereu" }, true, "ro", s, now)).toEqual({ ok: false, reason: "free" });
    expect(priceFor("an", "ro", true, s).label).toBe("50 lei");
  });

  it("Stripe primește planul și, la o trecere pe un plan mai scump, de unde vine și până când rămâne anul", async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_u: string, init: RequestInit) => { sent = init.body as URLSearchParams; return new Response(JSON.stringify({ url: "https://x" })); }) as typeof fetch;
    await createCheckout({ kind: "an", userId: "u1", email: "a@b.ro", name: "An", amount: 2712, currency: "ron", locale: "ro", successUrl: "s", cancelUrl: "c",
      tier: "familie", upgradeFrom: "basic", paidUntil: new Date("2027-04-11T00:00:00Z") }, fake);
    expect(sent!.get("metadata[tier]")).toBe("familie");
    expect(sent!.get("metadata[upgradeFrom]")).toBe("basic");
    expect(sent!.get("metadata[paidUntil]")).toBe("2027-04-11T00:00:00.000Z");
    expect(sent!.get("allow_promotion_codes")).toBe("true");
  });

  it("cartea PDF: inclusă la toți arborii titularului doar pe Premium plătit", () => {
    const s = DEFAULT_SETTINGS, until = new Date("2030-01-01");
    expect(bookIncluded({ kind: "platit", until, tier: "premium" }, s, true)).toBe(true);
    expect(bookIncluded({ kind: "platit", until, tier: "premium" }, s, false)).toBe(false);
    expect(bookIncluded({ kind: "platit", until, tier: "familie" }, s, true)).toBe(false);
    expect(bookIncluded({ kind: "beta", until }, s, true)).toBe(false);
    expect(bookIncluded({ kind: "expirat", since: until }, s, true)).toBe(false);
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

    it("o plată redusă cu un cod promoțional dă același an", async () => {
      const now = new Date("2027-01-01T00:00:00Z");
      await db.insert(user).values({ id: "u3", name: "Test", email: "test@test.ro" });
      expect(await applyPayment(db, { id: "cs_promo", kind: "an", userId: "u3", treeId: null, amount: 200, currency: "ron" }, now)).toBe(true);
      const r = (await db.select().from(accountPlan)).find((x) => x.userId === "u3");
      expect(r).toMatchObject({ plan: "familie", paidUntil: new Date("2028-01-01T00:00:00Z") });
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

    it("plățile vechi trec pe Basic și își păstrează data", async () => {
      await db.insert(user).values([{ id: "v1", name: "Vechi", email: "v1@test.ro" }, { id: "v2", name: "Mereu", email: "v2@test.ro" }]);
      const until = new Date("2027-08-01T00:00:00Z");
      await db.insert(accountPlan).values([{ userId: "v1", plan: "familie", paidUntil: until }, { userId: "v2", plan: "mereu" }]);
      for (const q of readFileSync("drizzle/0020_planuri.sql", "utf8").split("--> statement-breakpoint")) await db.execute(sql.raw(q));
      const rows = await db.select().from(accountPlan);
      expect(rows.find((r) => r.userId === "v1")).toMatchObject({ tier: "basic", paidUntil: until, plan: "familie" });
      expect(rows.find((r) => r.userId === "v2")).toMatchObject({ tier: null, plan: "mereu" });
    });

    it("anul pe un plan: același plan +365 zile; trecerea mai sus păstrează data; de la zero, un an de azi", async () => {
      await db.insert(user).values({ id: "t1", name: "Plan", email: "t1@test.ro" });
      const now = new Date("2027-01-01T00:00:00Z");
      const pay = (id: string, o: object, at = now) => applyPayment(db, { id, kind: "an", userId: "t1", treeId: null, amount: 1, currency: "ron", ...o }, at);
      const row = async () => (await db.select().from(accountPlan)).find((r) => r.userId === "t1")!;
      await pay("t_a", { tier: "basic" });
      expect(await row()).toMatchObject({ tier: "basic", paidUntil: new Date("2028-01-01T00:00:00Z") });
      await pay("t_b", { tier: "basic" }, new Date("2027-03-01T00:00:00Z"));
      expect(await row()).toMatchObject({ tier: "basic", paidUntil: new Date("2028-12-31T00:00:00Z") });
      await pay("t_c", { tier: "premium", upgradeFrom: "basic" }, new Date("2027-04-01T00:00:00Z"));
      expect(await row()).toMatchObject({ tier: "premium", paidUntil: new Date("2028-12-31T00:00:00Z") });
      // După ce a expirat, o plată (chiar marcată ca trecere) dă un an întreg de azi.
      await pay("t_d", { tier: "familie", upgradeFrom: "basic" }, new Date("2029-02-01T00:00:00Z"));
      expect(await row()).toMatchObject({ tier: "familie", paidUntil: new Date("2030-02-01T00:00:00Z") });
    });

    it("cartea inclusă la Familie: una pe an, aleasă, apoi ca o carte plătită", async () => {
      await db.insert(user).values({ id: "f1", name: "Familie", email: "f1@test.ro" });
      const [{ id: a }] = await db.insert(tree).values({ name: "A", ownerId: "f1" }).returning({ id: tree.id });
      const [{ id: b }] = await db.insert(tree).values({ name: "B", ownerId: "f1" }).returning({ id: tree.id });
      const now = new Date("2027-05-01T00:00:00Z"), s = DEFAULT_SETTINGS;
      const fam: Access = { kind: "platit", until: new Date("2027-12-01T00:00:00Z"), tier: "familie" };
      expect(await includedBooksLeft(db, "f1", { ...fam, tier: "basic" }, s, now)).toBe(0);
      expect(await includedBooksLeft(db, "f1", { ...fam, tier: "premium" }, s, now)).toBeNull();
      expect(await includedBooksLeft(db, "f1", fam, s, now)).toBe(1);
      expect(await claimIncludedBook(db, "f1", a, fam, s, now)).toBe(true);
      expect(await bookPaid(db, "f1", a, now)).toBe(true);
      expect(await includedBooksLeft(db, "f1", fam, s, now)).toBe(0);
      expect(await claimIncludedBook(db, "f1", b, fam, s, now)).toBe(false);
      expect(await bookPaid(db, "f1", b, now)).toBe(false);
      // Anul următor pe Familie: încă una.
      const next: Access = { ...fam, until: new Date("2028-12-01T00:00:00Z") };
      expect(await includedBooksLeft(db, "f1", next, s, new Date("2028-01-01T00:00:00Z"))).toBe(1);
    });

    it("la expirare nu se șterge nimic: persoanele și pozele rămân, doar adăugările noi se opresc", async () => {
      await db.insert(user).values({ id: "x1", name: "Exp", email: "x1@test.ro", createdAt: new Date("2027-01-01T00:00:00Z") });
      const [{ id: t }] = await db.insert(tree).values({ name: "X", ownerId: "x1" }).returning({ id: tree.id });
      await db.insert(person).values(Array.from({ length: 35 }, (_, i) => ({ treeId: t, givenName: `P${i}` })));
      await db.insert(document).values({ treeId: t, kind: "photo", title: "poză", fileKey: "k", mimeType: "image/jpeg" });
      const on = { ...DEFAULT_SETTINGS, on: true, startedAt: "2026-12-01T00:00:00.000Z" };
      const a = accessFor({ createdAt: new Date("2027-01-01T00:00:00Z"), plan: "familie", paidUntil: new Date("2027-02-01T00:00:00Z"), tier: "premium" }, on, new Date("2027-03-01"));
      expect(a.kind).toBe("expirat");
      expect(limitsFor(a, on)?.persons).toBe(30);
      expect((await db.select().from(person).where(sql`${person.treeId} = ${t}`)).length).toBe(35);
      expect((await db.select().from(document).where(sql`${document.treeId} = ${t}`)).length).toBe(1);
    });

  });
});
