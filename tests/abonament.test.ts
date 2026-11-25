import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, payment, user } from "@/db/schema";
import { applyPayment, createCheckout, paidSession } from "@/lib/plati";
import { DEFAULT_SETTINGS, periodEnd, periodPrice, periodsFor, yearSaving, RENEW_GRACE_MS } from "@/lib/plans";
import {
  amountIn, dueRenewalReminders, fixSubscription, isLoyal, linkSubscription, nextCharge, renewalPaid, stopRenewal, subscriptionChanged, subscriptionOf,
} from "@/lib/abonament";
import { loadMessages } from "@/i18n/messages";
import { LOCALES } from "@/i18n/locales";

const src = (p: string) => readFileSync(p, "utf8");
const s = DEFAULT_SETTINGS;

describe("abonamentele: prețurile (25.11.2026)", () => {
  it("anual e cu 26–32% sub lunar; Basic doar anual; din al doilea an, prețul de reînnoire", () => {
    expect(periodPrice("familie", "luna", true, s)).toEqual({ lei: 16.99, eur: 3.49 });
    expect(periodPrice("premium", "trimestru", true, s)).toEqual({ lei: 75.99, eur: 15.99 });
    expect(periodPrice("basic", "luna", true, s)).toBeNull();
    expect(periodsFor("basic", s)).toEqual(["an"]);
    expect(periodsFor("familie", s)).toEqual(["luna", "trimestru", "an"]);
    expect(periodsFor("familie", { ...s, subs: false })).toEqual(["an"]);
    expect(periodPrice("familie", "an", true, s)).toEqual({ lei: 149, eur: 30 });
    expect(periodPrice("familie", "an", true, s, true)).toEqual({ lei: 119, eur: 24 });
    expect(periodPrice("basic", "an", true, s, true)).toEqual({ lei: 39, eur: 8 });
    // Prețul de reînnoire nu poate fi mai mare decât cel întreg; 0 = prețul întreg.
    expect(periodPrice("premium", "an", true, { ...s, premiumRenewLei: 0, premiumRenewEur: 0 }, true)).toEqual({ lei: 249, eur: 50 });
    for (const t of ["familie", "premium"] as const) {
      const save = yearSaving(t, s, true);
      expect(save).toBeGreaterThanOrEqual(25);
      expect(save).toBeLessThanOrEqual(32);
    }
    expect(yearSaving("basic", s, true)).toBe(0);
  });

  it("perioada se socotește în luni din calendar; data plății e înainte de rezerva de o zi și jumătate", () => {
    const from = new Date("2026-11-25T10:00:00Z");
    expect(periodEnd(from, "luna").toISOString()).toBe("2026-12-25T10:00:00.000Z");
    expect(periodEnd(from, "trimestru").toISOString()).toBe("2027-02-25T10:00:00.000Z");
    expect(periodEnd(from, "an").toISOString()).toBe("2027-11-25T10:00:00.000Z");
    expect(nextCharge(new Date(from.getTime() + RENEW_GRACE_MS)).toISOString()).toBe(from.toISOString());
    expect(amountIn("ron", { lei: 16.99, eur: 3.49 }, s)).toBe(1699);
    expect(amountIn("eur", { lei: 16.99, eur: 3.49 }, s)).toBe(349);
  });
});

describe("abonamentele: Stripe", () => {
  let key: string | undefined;
  beforeEach(() => { key = process.env.STRIPE_SECRET_KEY; process.env.STRIPE_SECRET_KEY = "sk_test_x"; });
  afterEach(() => { if (key === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = key; });

  it("pagina de plată pentru abonament: recurent, metadate, fără factură separată; „de la sfârșitul anului” cu perioadă de probă Stripe", async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_u: string, init: RequestInit) => { sent = init.body as URLSearchParams; return new Response(JSON.stringify({ url: "https://x" })); }) as typeof fetch;
    const base = { kind: "an" as const, userId: "u", email: "a@b.ro", name: "Familie", amount: 14900, currency: "ron", locale: "ro", successUrl: "s", cancelUrl: "c", tier: "familie" as const, waiver: "Confirmare", seller: "PFA" };
    await createCheckout({ ...base, sub: { period: "an", renewAmount: 11900, start: "now" } }, fake);
    expect(sent!.get("mode")).toBe("subscription");
    expect(sent!.get("line_items[0][price_data][unit_amount]")).toBe("14900");
    expect(sent!.get("line_items[0][price_data][recurring][interval]")).toBe("year");
    expect(sent!.get("subscription_data[metadata][renewAmount]")).toBe("11900");
    expect(sent!.get("metadata[period]")).toBe("an");
    expect(sent!.get("invoice_creation[enabled]")).toBeNull();
    expect(sent!.get("invoice_creation[invoice_data][footer]")).toBeNull();
    expect(sent!.get("custom_text[submit][message]")).toBe("Confirmare");
    expect(sent!.get("subscription_data[trial_end]")).toBeNull();
    const end = new Date(Date.now() + 30 * 86_400_000);
    await createCheckout({ ...base, sub: { period: "trimestru", renewAmount: 4599, start: "later", trialEnd: end, customer: "cus_1" }, once: null }, fake);
    expect(sent!.get("line_items[0][price_data][recurring][interval_count]")).toBe("3");
    expect(sent!.get("line_items[0][price_data][unit_amount]")).toBe("4599");
    expect(sent!.get("subscription_data[trial_end]")).toBe(String(Math.floor(end.getTime() / 1000)));
    expect(sent!.get("customer")).toBe("cus_1");
    expect(sent!.get("customer_email")).toBeNull();
    // Pachetul Basic + cartea: cartea e o linie plătită o singură dată.
    await createCheckout({ ...base, sub: { period: "an", renewAmount: 3900, start: "now" }, once: { name: "Carte", amount: 3000 } }, fake);
    expect(sent!.get("line_items[1][price_data][unit_amount]")).toBe("3000");
    expect(sent!.get("line_items[1][price_data][recurring][interval]")).toBeNull();
    // Plata o dată rămâne ca înainte.
    await createCheckout(base, fake);
    expect(sent!.get("mode")).toBe("payment");
    expect(sent!.get("invoice_creation[enabled]")).toBe("true");
  });

  it("din eveniment, abonamentul pornit (acum sau de la sfârșitul anului)", () => {
    const ev = (md: object, o: object = {}) => ({ type: "checkout.session.completed", data: { object: { id: "cs_1", mode: "subscription", subscription: "sub_1", customer: "cus_1", payment_status: "paid", amount_total: 14900, currency: "ron", metadata: { kind: "an", userId: "u1", tier: "familie", ...md }, ...o } } });
    expect(paidSession(ev({ period: "an", start: "now", renewAmount: "11900" }))?.sub).toEqual({ id: "sub_1", customer: "cus_1", period: "an", renewAmount: 11900, start: "now" });
    expect(paidSession(ev({ period: "luna", start: "later", renewAmount: "1699" }, { payment_status: "no_payment_required", amount_total: 0 }))?.sub?.start).toBe("later");
    expect(paidSession(ev({}, { mode: "payment" }))?.sub).toBeUndefined();
  });
});

describe("abonamentele: în baza de date", () => {
  let db: Db;
  const now = new Date("2026-11-25T10:00:00Z");
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    for (const id of ["a1", "a2", "a3"]) {
      await db.insert(user).values({ id, name: id, email: `${id}@x.ro`, emailVerified: true, createdAt: now, updatedAt: now });
    }
  });

  it("prima plată: anul se adaugă, abonamentul se leagă, apoi trece pe prețul de reînnoire și fără cod", async () => {
    const paid = paidSession({ type: "checkout.session.completed", data: { object: { id: "cs_a1", mode: "subscription", subscription: "sub_a1", customer: "cus_a1", payment_status: "paid", amount_total: 1490, currency: "ron", discounts: [{ promotion_code: "promo_9" }], metadata: { kind: "an", userId: "a1", tier: "basic", period: "an", start: "now", renewAmount: "3900" } } } })!;
    expect(await isLoyal(db, "a1", { ...s, startedAt: "2026-11-01T00:00:00Z" })).toBe(false);
    await linkSubscription(db, paid, now);
    expect(await applyPayment(db, paid, now)).toBe(true);
    const sub = await subscriptionOf(db, "a1");
    expect(sub).toMatchObject({ stripeSub: "sub_a1", period: "an", renews: true, amount: 3900, tier: "basic" });
    expect(sub!.paidUntil!.toISOString()).toBe(new Date(new Date("2027-11-25T10:00:00Z").getTime() + RENEW_GRACE_MS).toISOString());
    // A plătit un an: de acum e „fidel”.
    expect(await isLoyal(db, "a1", s)).toBe(true);
    const calls: string[] = [];
    const stripe = (async (u: string, init: RequestInit) => {
      calls.push(`${init.method} ${u.replace("https://api.stripe.com/v1/", "")} ${init.body ? String(init.body) : ""}`);
      if (init.method === "GET") return new Response(JSON.stringify({ status: "active", discount: { id: "di_1" }, items: { data: [{ id: "si_1", price: { unit_amount: 4900, currency: "ron", product: "prod_1", recurring: { interval: "year", interval_count: 1 } } }] } }));
      return new Response(JSON.stringify({ id: "sub_a1" }));
    }) as typeof fetch;
    expect(await fixSubscription(db, "a1", stripe)).toBe(true);
    expect(calls[1]).toContain("items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=3900");
    expect(calls[1]).toContain("proration_behavior=none");
    expect(calls[2]).toMatch(/^DELETE subscriptions\/sub_a1\/discount/);
    // A doua oară nu mai face nimic.
    expect(await fixSubscription(db, "a1", stripe)).toBe(true);
    expect(calls.length).toBe(3);
  });

  it("reînnoirea plătită adaugă perioada o singură dată și trimite plata spre email", async () => {
    const end = Math.floor(new Date("2028-11-25T10:00:00Z").getTime() / 1000);
    const ev = { type: "invoice.paid", data: { object: { id: "in_1", billing_reason: "subscription_cycle", amount_paid: 3900, currency: "ron", parent: { subscription_details: { subscription: "sub_a1", metadata: { userId: "a1" } } }, lines: { data: [{ period: { end } }] } } } };
    const later = new Date("2027-11-26T12:00:00Z");
    const r = await renewalPaid(db, ev, later);
    expect(r).toMatchObject({ id: "in_1", kind: "an", userId: "a1", amount: 3900, tier: "basic" });
    expect(await renewalPaid(db, ev, later)).toBeNull();
    const [p] = await db.select().from(accountPlan).where(eq(accountPlan.userId, "a1"));
    expect(p.paidUntil!.getTime()).toBe(end * 1000 + RENEW_GRACE_MS);
    expect((await db.select().from(payment).where(eq(payment.id, "in_1"))).length).toBe(1);
    // Prima factură a abonamentului nu e o reînnoire (se trece din pagina de plată).
    expect(await renewalPaid(db, { type: "invoice.paid", data: { object: { id: "in_0", billing_reason: "subscription_create", subscription: "sub_a1" } } }, later)).toBeNull();
  });

  it("emailul cu 7 zile înainte: doar anual și trimestrial, doar cu reînnoirea pornită", async () => {
    await db.insert(accountPlan).values({ userId: "a2", plan: "familie", tier: "familie", paidUntil: new Date(now.getTime() + 6 * 86_400_000), stripeSub: "sub_a2", subPeriod: "luna", subRenews: true, updatedAt: now });
    await db.update(accountPlan).set({ paidUntil: new Date(now.getTime() + 6 * 86_400_000) }).where(eq(accountPlan.userId, "a1"));
    const due = await dueRenewalReminders(db, now);
    expect(due.map((d) => d.userId)).toEqual(["a1"]);
  });

  it("oprirea dintr-un clic: se ține minte la noi și când Stripe nu răspunde; evenimentele Stripe țin pasul", async () => {
    const down = (async () => new Response("{}", { status: 500 })) as unknown as typeof fetch;
    expect(await stopRenewal(db, "a1", down)).toBe("amanat");
    let sub = await subscriptionOf(db, "a1");
    expect(sub).toMatchObject({ renews: false, cancelPending: true });
    expect(await dueRenewalReminders(db, now)).toEqual([]);
    // O schimbare venită între timp de la Stripe nu repornește reînnoirea cerută oprită.
    await subscriptionChanged(db, { type: "customer.subscription.updated", data: { object: { id: "sub_a1", status: "active", cancel_at_period_end: false } } });
    expect((await subscriptionOf(db, "a1"))!.renews).toBe(false);
    const ok = (async () => new Response(JSON.stringify({ id: "sub_a1" }))) as unknown as typeof fetch;
    expect(await stopRenewal(db, "a1", ok)).toBe("oprit");
    sub = await subscriptionOf(db, "a1");
    expect(sub).toMatchObject({ renews: false, cancelPending: false });
    await subscriptionChanged(db, { type: "customer.subscription.deleted", data: { object: { id: "sub_a1", status: "canceled" } } });
    sub = await subscriptionOf(db, "a1");
    expect(sub!.stripeSub).toBeNull();
    // Accesul plătit rămâne până la capătul perioadei.
    expect(sub!.paidUntil!.getTime()).toBeGreaterThan(now.getTime());
    expect(await stopRenewal(db, "a3", ok)).toBe("nimic");
  });

  it("pornirea „de la sfârșitul anului” nu e o plată și nu adaugă timp", async () => {
    const paid = paidSession({ type: "checkout.session.completed", data: { object: { id: "cs_a3", mode: "subscription", subscription: "sub_a3", customer: "cus_a3", payment_status: "no_payment_required", amount_total: 0, currency: "ron", metadata: { kind: "an", userId: "a3", tier: "familie", period: "an", start: "later", renewAmount: "11900" } } } })!;
    await linkSubscription(db, paid, now);
    expect(await applyPayment(db, paid, now)).toBe(false);
    expect((await db.select().from(payment).where(eq(payment.id, "cs_a3"))).length).toBe(0);
    expect(await subscriptionOf(db, "a3")).toMatchObject({ stripeSub: "sub_a3", renews: true, amount: 11900, paidUntil: null });
  });
});

describe("abonamentele: texte și pagini", () => {
  it("în toate limbile: abonamentul, prețul de reînnoire și oprirea dintr-un clic în Termeni; fără „nu se reînnoiește singur” la plan", async () => {
    for (const l of LOCALES) {
      const m = (await loadMessages(l)) as unknown as { Sub: Record<string, unknown>; Legal: { Terms: { sections: { price: Record<string, string> } }; Privacy: { sections: { data: Record<string, string> } } } };
      expect(m.Sub.stopBtn, l).toBeTruthy();
      const price = m.Legal.Terms.sections.price;
      expect(price.lsub, l).toContain("{familieMonthLei}");
      expect(price.lrenew, l).toContain("{familieRenewLei}");
      expect(m.Legal.Privacy.sections.data.l15b, l).toBeTruthy();
      expect(price.l7, l).not.toMatch(/^(Anul nu se|The year does not|L’année ne se)/);
    }
    const ro = src("src/i18n/messages/legal/ro.ts");
    expect(ro).not.toContain("Anul nu se reînnoiește singur");
    expect(ro).toContain("NEAM90");
  });

  it("codurile (NEAM90) doar la Basic, la prima plată anuală", () => {
    const route = src("src/app/api/plata/start/route.ts");
    expect(route).toContain('const yearly = !sub || (sub.period === "an" && sub.start === "now");');
    expect(route).toContain('const basicYear = kind === "an" && year?.tier === "basic" && yearly;');
    const page = src("src/app/(site)/plata/page.tsx");
    expect(page).toContain('x === "basic" && !quote.upgradeFrom && pp === "an" && codeBox');
    // Oprirea dintr-un clic, fără întrebări în plus.
    expect(page).toContain('name="action" value="opreste"');
    expect(src("vercel.json")).toContain("/api/cron/abonamente");
  });
});
