import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { appSetting, payment, shopOrder } from "@/db/schema";
import { LOCALES } from "@/i18n/locales";
import { SHOP_DONE_PATH, SHOP_KIND, SHOP_MODELS, SHOP_PATH, modelBySlug, modelText, shopPrice, shopText } from "@/lib/invitatii-nunta";
import { SHOP_TEXT } from "@/lib/invitatii-nunta-texte";
import {
  MAX_EMAILS, createShopCheckout, downloadToken, fulfilShopOrder, hashToken, orderByToken, resendShopMail, setShopOpen, shopEvent,
  shopOpen, shopPaidFromSession, shopPaymentsReady,
} from "@/lib/invitatii-nunta-server";
import { paidSession } from "@/lib/plati";
import { PRIVATE_PREFIXES, PUBLIC_PAGES, pageLocales } from "@/lib/public-pages";
import { isPublicPath } from "@/lib/public-variant";
import { hasRealTranslation } from "@/lib/traduceri-reale";

const SECRET_ENV = "BETTER_AUTH_SECRET";
let oldSecret: string | undefined;
beforeEach(() => { oldSecret = process.env[SECRET_ENV]; process.env[SECRET_ENV] = "secret-de-test-pentru-invitatii"; });
afterEach(() => { if (oldSecret === undefined) delete process.env[SECRET_ENV]; else process.env[SECRET_ENV] = oldSecret; });

const session = (o: Record<string, unknown> = {}) => ({
  id: "cs_test_a1B2c3D4e5F6g7H8", payment_status: "paid", amount_total: 4500, currency: "ron",
  customer_details: { email: "mire@exemplu.ro" }, metadata: { kind: SHOP_KIND, slug: "maramures", locale: "ro" }, ...o,
});
const event = (type: string, o: Record<string, unknown> = {}) => ({ type, data: { object: session(o) } });

describe("catalogul și textele", () => {
  it("prețul vine din catalog: 45 lei în română, 9 € în celelalte limbi", () => {
    const m = modelBySlug("maramures")!;
    expect(shopPrice(m, "ro")).toMatchObject({ amount: 4500, currency: "ron", label: "45 lei" });
    expect(shopPrice(m, "it")).toMatchObject({ amount: 900, currency: "eur", label: "9 €" });
    expect(shopPrice(m, "en-US")).toMatchObject({ amount: 900, currency: "eur" });
  });
  it("slugurile sunt bune și unice, iar „gata” nu e slug de model", () => {
    const slugs = SHOP_MODELS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain("gata");
    expect(modelBySlug("../maramures")).toBeNull();
    expect(modelBySlug(undefined)).toBeNull();
    for (const m of SHOP_MODELS) expect(m.zipKey.startsWith("magazin/invitatii-nunta/")).toBe(true);
  });
  it("fiecare limbă are toate textele, fără goluri, pentru fiecare model", () => {
    const keys = Object.keys(SHOP_TEXT.ro).sort();
    for (const [l, t] of Object.entries(SHOP_TEXT)) {
      expect(Object.keys(t).sort(), l).toEqual(keys);
      for (const [k, v] of Object.entries(t)) if (typeof v === "string") expect(v.trim(), `${l}.${k}`).not.toBe("");
      for (const m of SHOP_MODELS) expect(t.models[m.slug as keyof typeof t.models]?.title, l).toBeTruthy();
    }
    for (const l of LOCALES) expect(shopText(l).label).toBeTruthy();
  });
  it("româna are diacritice cu virgulă (ș ț), nu cu sedilă", () => {
    expect(JSON.stringify(SHOP_TEXT.ro)).not.toMatch(/[şţŞŢ]/);
    expect(modelText(SHOP_MODELS[0], "ro").name).toBe("Maramureș");
  });
  it("pozele de prezentare sunt în /public, iar ZIP-urile nu", () => {
    for (const m of SHOP_MODELS) for (const i of m.images) expect(readFileSync(`public${i.src}`).length).toBeGreaterThan(1000);
    expect(SHOP_MODELS.every((m) => !m.zipKey.startsWith("/"))).toBe(true);
  });
});

describe("SEO și adresele", () => {
  it("lista și modelele sunt pagini publice în toate limbile; pagina de după plată e privată", () => {
    const paths = [SHOP_PATH, ...SHOP_MODELS.map((m) => `${SHOP_PATH}/${m.slug}`)];
    for (const p of paths) {
      expect(PUBLIC_PAGES.some((x) => x.path === p), p).toBe(true);
      expect(isPublicPath(p)).toBe(true);
      expect(pageLocales(p)).toEqual(LOCALES);
      expect(hasRealTranslation(p, "it")).toBe(true);
    }
    expect(isPublicPath(SHOP_DONE_PATH)).toBe(false);
    expect(PRIVATE_PREFIXES).toContain(SHOP_DONE_PATH);
    expect(PRIVATE_PREFIXES.some((p) => SHOP_PATH.startsWith(p) || `${SHOP_PATH}/maramures`.startsWith(p))).toBe(false);
  });
  it("middleware-ul prinde adresele noi", () => {
    const mw = readFileSync("src/middleware.ts", "utf8");
    expect(mw).toContain('"/invitatii-nunta", "/invitatii-nunta/:slug"');
  });
});

describe("plata și webhook-ul", () => {
  it("plata merge doar cu cheie de test în afara producției", () => {
    expect(shopPaymentsReady({})).toBe(false);
    expect(shopPaymentsReady({ STRIPE_SECRET_KEY: "sk_live_x", VERCEL_ENV: "preview" })).toBe(false);
    expect(shopPaymentsReady({ STRIPE_SECRET_KEY: "sk_live_x" })).toBe(false);
    expect(shopPaymentsReady({ STRIPE_SECRET_KEY: "sk_test_x", VERCEL_ENV: "preview" })).toBe(true);
    expect(shopPaymentsReady({ STRIPE_SECRET_KEY: "rk_test_x" })).toBe(true);
    expect(shopPaymentsReady({ STRIPE_SECRET_KEY: "sk_live_x", VERCEL_ENV: "production" })).toBe(true);
  });
  it("Checkout: mode payment, prețul din catalog, metadata, factura și acordul", async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_u: string, init: { body: URLSearchParams }) => { sent = init.body; return new Response(JSON.stringify({ url: "https://checkout.stripe.com/x" })); }) as unknown as typeof fetch;
    const url = await createShopCheckout({ model: SHOP_MODELS[0], locale: "de", origin: "https://carteaneamului.ro", waiver: "Acord", seller: "PFA" }, fake);
    expect(url).toBe("https://checkout.stripe.com/x");
    const b = sent!;
    expect(b.get("mode")).toBe("payment");
    expect(b.get("line_items[0][price_data][unit_amount]")).toBe("900");
    expect(b.get("line_items[0][price_data][currency]")).toBe("eur");
    expect(b.get("metadata[kind]")).toBe(SHOP_KIND);
    expect(b.get("metadata[slug]")).toBe("maramures");
    expect(b.get("metadata[locale]")).toBe("de");
    expect(b.get("invoice_creation[enabled]")).toBe("true");
    expect(b.get("custom_text[submit][message]")).toBe("Acord");
    expect(b.get("success_url")).toBe(`https://carteaneamului.ro${SHOP_DONE_PATH}?session_id={CHECKOUT_SESSION_ID}`);
    expect(b.has("customer_email")).toBe(false);
    expect(b.has("client_reference_id")).toBe(false);
  });
  it("evenimentele rubricii sunt recunoscute; plățile contului merg mai departe neschimbate", () => {
    expect(shopEvent(event("checkout.session.completed"))?.paid).toMatchObject({ email: "mire@exemplu.ro", slug: "maramures", locale: "ro", amount: 4500 });
    expect(shopEvent(event("checkout.session.completed", { payment_status: "unpaid" }))).toEqual({ paid: null });
    expect(shopEvent(event("checkout.session.expired"))).toEqual({ paid: null });
    expect(shopEvent({ type: "checkout.session.completed", data: { object: { ...session(), metadata: { kind: "an", userId: "u1" } } } })).toBeNull();
    expect(shopEvent({ type: "invoice.paid", data: { object: {} } })).toBeNull();
    // paidSession() nu ia în seamă o comandă de invitație (tip necunoscut).
    expect(paidSession(event("checkout.session.completed"))).toBeNull();
    expect(shopPaidFromSession(session({ metadata: { kind: SHOP_KIND, slug: "nu-exista", locale: "ro" } }))).toBeNull();
    expect(shopPaidFromSession(session({ customer_details: {} }))).toBeNull();
  });
  it("tokenul: lung, același pentru aceeași sesiune, diferit pentru alta; în bază doar hash-ul", () => {
    const a = downloadToken("cs_test_1");
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(downloadToken("cs_test_1")).toBe(a);
    expect(downloadToken("cs_test_2")).not.toBe(a);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("comanda, în baza de date", () => {
  let db: Db;
  const mails: string[] = [];
  const mailer = async (o: { email: string }) => { mails.push(o.email); return { ok: true as const, id: "m" }; };
  beforeAll(async () => { db = createDb(); await runMigrations(db); });

  it("se trece o singură dată pe sesiune și trimite un singur email; nimic în payment", async () => {
    const now = new Date("2027-05-01T10:00:00Z");
    const paid = shopPaidFromSession(session())!;
    const a = await fulfilShopOrder(db, paid, "https://carteaneamului.ro", now, mailer);
    const b = await fulfilShopOrder(db, paid, "https://carteaneamului.ro", now, mailer);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.token).toBe(a.token);
    expect(mails).toEqual(["mire@exemplu.ro"]);
    const rows = await db.select().from(shopOrder);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: "maramures", locale: "ro", amount: 4500, currency: "ron", emailsSent: 1 });
    expect(rows[0].tokenHash).toBe(hashToken(a.token));
    expect(rows[0].tokenHash).not.toContain(a.token);
    expect(rows[0].expiresAt.toISOString()).toBe("2027-05-31T10:00:00.000Z");
    expect(await db.select().from(payment)).toHaveLength(0);
  });
  it("tokenul deschide comanda 30 de zile, apoi expiră; un token greșit nu deschide nimic", async () => {
    const token = downloadToken(session().id);
    expect((await orderByToken(db, token, new Date("2027-05-20T00:00:00Z")))?.expired).toBe(false);
    expect((await orderByToken(db, token, new Date("2027-06-01T00:00:00Z")))?.expired).toBe(true);
    expect(await orderByToken(db, token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"))).toBeNull();
    expect(await orderByToken(db, "scurt")).toBeNull();
  });
  it("retrimiterea: cel mult un email pe minut și cel mult 5 pe comandă", async () => {
    const id = session().id;
    let t = new Date("2027-05-01T10:00:30Z").getTime();
    expect(await resendShopMail(db, id, "https://x", new Date(t), mailer)).toBe("limit");
    let ok = 0;
    for (let i = 0; i < 10; i++) { t += 61_000; if ((await resendShopMail(db, id, "https://x", new Date(t), mailer)) === "ok") ok++; }
    expect(ok).toBe(MAX_EMAILS - 1);
    expect(await resendShopMail(db, "cs_test_nu_exista_deloc", "https://x", new Date(t), mailer)).toBe("missing");
    expect(await resendShopMail(db, id, "https://x", new Date("2027-07-01T00:00:00Z"), mailer)).toBe("expired");
  });
  it("comutatorul din Admin: pornit implicit, se oprește și se pornește", async () => {
    expect(await shopOpen(db)).toBe(true);
    await setShopOpen(db, false, null);
    expect(await shopOpen(db)).toBe(false);
    await setShopOpen(db, true, null);
    expect(await shopOpen(db)).toBe(true);
    expect((await db.select().from(appSetting)).some((r) => r.key === "invitatii_nunta")).toBe(true);
  });
});
