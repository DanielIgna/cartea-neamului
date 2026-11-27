import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { appSetting, payment, shopOrder, shopProduct } from "@/db/schema";
import { LOCALES } from "@/i18n/locales";
import {
  SHOP_DONE_PATH, SHOP_KIND, SHOP_PATH, isModelPath, isModelSlug, modelLocales, modelText, publishProblems, shopPrice, shopText, slugify, zipKeyFor,
  type ShopModel,
} from "@/lib/invitatii-nunta";
import { SHOP_TEXT } from "@/lib/invitatii-nunta-texte";
import {
  MAX_EMAILS, createShopCheckout, downloadToken, fulfilShopOrder, hashToken, orderByToken, parseShopBuyer, resendShopMail, setShopOpen, shopEvent,
  shopOpen, shopPaidFromSession, shopPaymentsReady,
} from "@/lib/invitatii-nunta-server";
import {
  adminProducts, arrangeImages, createProduct, deleteProduct, modelBySlug, parseMoney, parseProductForm, productById, publishedModel,
  publishedModels, salesOf, setProductStatus, updateProduct, type ProductInput,
} from "@/lib/invitatii-nunta-produse";
import { CHUNK_BYTES, addProductPhoto, chunkKey, finishZipUpload, inspectZip, photoType, putZipChunk, type Store } from "@/lib/invitatii-nunta-incarcare";
import { shopSitemapUrls } from "@/lib/invitatii-nunta-sitemap";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { paidSession } from "@/lib/plati";
import { PRIVATE_PREFIXES, PUBLIC_PAGES, pageLocales } from "@/lib/public-pages";
import { isPublicPath } from "@/lib/public-variant";
import { hasRealTranslation } from "@/lib/traduceri-reale";

/** Un ZIP mic, făcut de mână (fișiere „stored”, fără compresie), ca în teste să nu trebuiască o bibliotecă. */
function makeZip(files: { name: string; data: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const local: number[] = [], central: number[] = [];
  const le = (n: number, bytes: number) => Array.from({ length: bytes }, (_, i) => (n >>> (8 * i)) & 0xff);
  for (const f of files) {
    const name = enc.encode(f.name), data = enc.encode(f.data);
    const offset = local.length;
    local.push(...le(0x04034b50, 4), ...le(20, 2), 0, 0, 0, 0, 0, 0, 0, 0, ...le(0, 4), ...le(data.length, 4), ...le(data.length, 4), ...le(name.length, 2), 0, 0, ...name, ...data);
    central.push(...le(0x02014b50, 4), ...le(20, 2), ...le(20, 2), 0, 0, 0, 0, 0, 0, 0, 0, ...le(0, 4), ...le(data.length, 4), ...le(data.length, 4),
      ...le(name.length, 2), 0, 0, 0, 0, 0, 0, 0, 0, ...le(0, 4), ...le(offset, 4), ...name);
  }
  const eocd = [...le(0x06054b50, 4), 0, 0, 0, 0, ...le(files.length, 2), ...le(files.length, 2), ...le(central.length, 4), ...le(local.length, 4), 0, 0];
  return new Uint8Array([...local, ...central, ...eocd]);
}

/** Storage-ul, în memorie. */
function memStore() {
  const files = new Map<string, Uint8Array>();
  const store: Store = {
    put: async (k, b) => { files.set(k, b); },
    get: async (k) => { const b = files.get(k); if (!b) throw new Error("NoSuchKey"); return b; },
    del: async (keys) => { for (const k of keys) files.delete(k); },
  };
  return { files, store };
}

const form = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
  return f;
};
const input = (o: Partial<ProductInput> = {}): ProductInput => ({
  slug: "bucovina", region: "Bucovina", sort: 0, languages: ["ro", "en"], formats: ["5x7"], priceRon: 4900, priceEur: 1000,
  texts: { ro: { name: "Bucovina", tagline: "Ouă încondeiate și ii cu altiță.", description: "Motive din Bucovina." } }, ...o,
});

const SECRET_ENV = "BETTER_AUTH_SECRET";
let oldSecret: string | undefined;
beforeEach(() => { oldSecret = process.env[SECRET_ENV]; process.env[SECRET_ENV] = "secret-de-test-pentru-invitatii"; });
afterEach(() => { if (oldSecret === undefined) delete process.env[SECRET_ENV]; else process.env[SECRET_ENV] = oldSecret; });

const session = (o: Record<string, unknown> = {}) => ({
  id: "cs_test_a1B2c3D4e5F6g7H8", payment_status: "paid", amount_total: 4500, currency: "ron",
  customer_details: { email: "mire@exemplu.ro" }, metadata: { kind: SHOP_KIND, slug: "maramures", locale: "ro" }, ...o,
});
const event = (type: string, o: Record<string, unknown> = {}) => ({ type, data: { object: session(o) } });

const MODEL: ShopModel = {
  id: "maramures", slug: "maramures", region: "Maramureș", status: "published", languages: ["ro"], formats: ["5x7"], priceLei: 45, priceEur: 9,
  texts: { ro: { name: "Maramureș", tagline: "Poarta", description: "Motive" }, "en-GB": { name: "Maramureș", tagline: "Gate", description: "Motifs" } },
  images: [{ src: "/invitatii-nunta/maramures-mockup.webp", width: 1400, height: 1120 }], zipKey: zipKeyFor("maramures"), zipName: "x.zip", updatedAt: new Date("2026-11-27T00:00:00Z"),
};

describe("modelul și textele", () => {
  it("prețul se socotește din model: lei în română, euro în celelalte limbi", () => {
    expect(shopPrice(MODEL, "ro")).toMatchObject({ amount: 4500, currency: "ron", label: "45 lei" });
    expect(shopPrice(MODEL, "it")).toMatchObject({ amount: 900, currency: "eur", label: "9 €" });
    expect(shopPrice({ priceLei: 49.5, priceEur: 9.5 }, "ro")).toMatchObject({ amount: 4950, label: "49,50 lei" });
  });
  it("slugurile: doar litere mici, cifre și cratime; „gata”, „nou”, „poze” sunt rezervate; slugul se face din nume", () => {
    expect(isModelSlug("tara-hategului")).toBe(true);
    for (const bad of ["gata", "nou", "poze", "../x", "Ab", "a--b", "", undefined]) expect(isModelSlug(bad), String(bad)).toBe(false);
    expect(slugify("Țara Hațegului")).toBe("tara-hategului");
    expect(slugify("  Mărginimea Sibiului! ")).toBe("marginimea-sibiului");
  });
  it("textele rubricii sunt în toate limbile, fără goluri", () => {
    const keys = Object.keys(SHOP_TEXT.ro).sort();
    for (const [l, t] of Object.entries(SHOP_TEXT)) {
      expect(Object.keys(t).sort(), l).toEqual(keys);
      for (const [k, v] of Object.entries(t)) expect(String(v).trim(), `${l}.${k}`).not.toBe("");
    }
    for (const l of LOCALES) expect(shopText(l).label).toBeTruthy();
    expect(JSON.stringify(SHOP_TEXT.ro)).not.toMatch(/[şţŞŢ]/);
  });
  it("limbile unui model: cele cu text (engleza britanică aduce și pe cea americană); fără text, textul românesc", () => {
    expect(modelLocales(MODEL, LOCALES)).toEqual(["ro", "en-GB", "en-US"]);
    expect(modelText(MODEL, "it")).toBeNull();
    expect(modelText(MODEL, "en-US")?.name).toBe("Maramureș");
    expect(modelText(MODEL, "ro")).toMatchObject({ title: "Maramureș", metaTitle: "Maramureș", metaDescription: "Poarta" });
  });
});

describe("SEO și adresele", () => {
  it("lista e pagină publică în toate limbile; modelele sunt publice prin ruta lor; pagina de după plată e privată", () => {
    expect(PUBLIC_PAGES.some((x) => x.path === SHOP_PATH)).toBe(true);
    expect(pageLocales(SHOP_PATH)).toEqual(LOCALES);
    expect(PUBLIC_PAGES.some((x) => x.path.startsWith(`${SHOP_PATH}/`))).toBe(false);
    for (const p of [SHOP_PATH, `${SHOP_PATH}/maramures`, `${SHOP_PATH}/tara-hategului`]) {
      expect(isPublicPath(p), p).toBe(true);
      expect(hasRealTranslation(p, "it")).toBe(true);
    }
    expect(isModelPath(SHOP_DONE_PATH)).toBe(false);
    expect(isPublicPath(SHOP_DONE_PATH)).toBe(false);
    expect(isPublicPath(`${SHOP_PATH}/a/b`)).toBe(false);
    expect(PRIVATE_PREFIXES).toContain(SHOP_DONE_PATH);
    expect(PRIVATE_PREFIXES.some((p) => `${SHOP_PATH}/maramures`.startsWith(p))).toBe(false);
  });
  it("middleware-ul prinde adresele", () => {
    expect(readFileSync("src/middleware.ts", "utf8")).toContain('"/invitatii-nunta", "/invitatii-nunta/:slug"');
  });
  it("sitemap: câte o adresă pe limba scrisă, cu hreflang, data din Admin și pozele; în „pagini”", () => {
    const urls = shopSitemapUrls([MODEL]);
    expect(urls.map((u) => u.path)).toEqual(["/invitatii-nunta/maramures", "/en/invitatii-nunta/maramures", "/en-us/invitatii-nunta/maramures"]);
    expect(urls[0].alternates).toMatchObject({ ro: "/invitatii-nunta/maramures", "x-default": "/invitatii-nunta/maramures" });
    expect(urls[0].lastModified).toEqual(MODEL.updatedAt);
    expect(urls[0].images).toEqual([MODEL.images[0].src]);
    const pagini = sitemapGroups(new Map(), urls).find((g) => g.name === "pagini")!;
    expect(pagini.urls.find((u) => u.path === "/invitatii-nunta/maramures")?.lastModified).toEqual(MODEL.updatedAt);
    expect(sitemapGroups().flatMap((g) => g.urls).some((u) => u.path.includes("/invitatii-nunta/"))).toBe(false);
  });
  it("migrația nu pune Bucovina (nu exista în cod); Maramureș intră ca ciornă, fără ZIP", () => {
    const sql = readFileSync("drizzle/0050_invitatii_nunta_produse.sql", "utf8");
    expect(sql).toContain("'maramures', 'maramures', 'Maramureș', 'draft'");
    expect(sql).not.toMatch(/'bucovina'/);
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
    const url = await createShopCheckout({ model: MODEL, locale: "de", origin: "https://carteaneamului.ro", waiver: "Acord", seller: "PFA" }, fake);
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
  it("coduri de reducere doar la invitații: produsul fix din Stripe (STRIPE_INVITATII_PRODUCT), prețul din bază, modelul în metadata", async () => {
    const sent: URLSearchParams[] = [];
    const fake = (async (_u: string, init: { body: URLSearchParams }) => { sent.push(init.body); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/x" })); }) as unknown as typeof fetch;
    const o = { model: MODEL, locale: "ro" as const, origin: "https://carteaneamului.ro", waiver: "Acord", seller: "PFA" };
    await createShopCheckout(o, fake, { STRIPE_INVITATII_PRODUCT: "prod_TestInvitatie123" });
    const b = sent[0];
    expect(b.get("allow_promotion_codes")).toBe("true");
    expect(b.get("line_items[0][price_data][product]")).toBe("prod_TestInvitatie123");
    expect(b.has("line_items[0][price_data][product_data][name]")).toBe(false);
    expect(b.get("line_items[0][price_data][unit_amount]")).toBe("4500");
    expect(b.get("line_items[0][price_data][currency]")).toBe("ron");
    expect(b.get("metadata[model]")).toBe("Maramureș");
    expect(b.get("payment_intent_data[description]")).toBe("Maramureș");
    expect(b.get("metadata[kind]")).toBe(SHOP_KIND);
    // Fără variabilă (sau cu o valoare greșită): numele pe linie, ca înainte; codurile tot merg.
    await createShopCheckout(o, fake, { STRIPE_INVITATII_PRODUCT: "nu-e-produs" });
    expect(sent[1].has("line_items[0][price_data][product]")).toBe(false);
    expect(sent[1].get("line_items[0][price_data][product_data][name]")).toBe("Maramureș");
  });
  it("plățile contului (/plata) rămân neschimbate: nu folosesc produsul invitațiilor", () => {
    expect(readFileSync("src/lib/plati.ts", "utf8")).not.toContain("STRIPE_INVITATII_PRODUCT");
  });
  it("evenimentele rubricii sunt recunoscute; plățile contului merg mai departe neschimbate", () => {
    expect(shopEvent(event("checkout.session.completed"))?.paid).toMatchObject({ email: "mire@exemplu.ro", slug: "maramures", locale: "ro", amount: 4500 });
    expect(shopEvent(event("checkout.session.completed", { payment_status: "unpaid" }))).toEqual({ paid: null });
    expect(shopEvent(event("checkout.session.expired"))).toEqual({ paid: null });
    expect(shopEvent({ type: "checkout.session.completed", data: { object: { ...session(), metadata: { kind: "an", userId: "u1" } } } })).toBeNull();
    expect(shopEvent({ type: "invoice.paid", data: { object: {} } })).toBeNull();
    // paidSession() nu ia în seamă o comandă de invitație (tip necunoscut).
    expect(paidSession(event("checkout.session.completed"))).toBeNull();
    expect(shopPaidFromSession(session({ metadata: { kind: SHOP_KIND, slug: "../x", locale: "ro" } }))).toBeNull();
    // Un model retras între timp: comanda se trece oricum (omul a plătit).
    expect(shopPaidFromSession(session({ metadata: { kind: SHOP_KIND, slug: "model-retras", locale: "ro" } }))?.slug).toBe("model-retras");
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

describe("modelele din Admin (shop_product)", () => {
  let db: Db;
  const { files, store } = memStore();
  const remove = async (keys: string[]) => store.del(keys);
  const noMail = async () => ({ ok: true as const, id: "m" });
  let id = "";
  beforeAll(async () => { db = createDb(); await runMigrations(db); });

  it("migrația aduce modelul Maramureș, ca ciornă, cu textele în toate limbile și pozele din /public", async () => {
    const m = await modelBySlug(db, "maramures");
    expect(m).toMatchObject({ status: "draft", zipKey: null, priceLei: 45, priceEur: 9, languages: ["ro", "en", "it", "es", "de", "fr", "hu"], formats: ["5x7", "A5"] });
    expect(modelLocales(m!, LOCALES)).toEqual(LOCALES);
    expect(modelText(m!, "ro")?.title).toBe("Invitație de nuntă Maramureș, cu motive populare");
    for (const i of m!.images) expect(readFileSync(`public${i.src}`).length).toBeGreaterThan(1000);
    expect(await publishedModels(db)).toEqual([]);
    expect(publishProblems(m!)).toEqual(["Lipsește fișierul ZIP."]);
  });

  it("formularul: prețuri cu virgulă, limbile goale nu se salvează, una începută cere tot", () => {
    expect(parseMoney("45", 10_000)).toBe(4500);
    expect(parseMoney("45,50", 10_000)).toBe(4550);
    expect(parseMoney("0", 10_000)).toBeNull();
    expect(parseMoney("-3", 10_000)).toBeNull();
    const base = { slug: "bucovina", region: "Bucovina", priceRon: "49", priceEur: "10", languages: ["ro", "en", "xx"], formats: ["A5", "Z9"],
      "t.ro.name": "Bucovina", "t.ro.tagline": "Scurt", "t.ro.description": "Lung" };
    const ok = parseProductForm(form(base));
    expect(ok).toMatchObject({ ok: true, value: { slug: "bucovina", priceRon: 4900, priceEur: 1000, languages: ["ro", "en"], formats: ["A5"] } });
    expect(ok.ok && Object.keys(ok.value.texts)).toEqual(["ro"]);
    expect(parseProductForm(form({ ...base, "t.it.name": "Bucovina" })).ok).toBe(false);
    expect(parseProductForm(form({ ...base, "t.ro.description": "" })).ok).toBe(false);
    expect(parseProductForm(form({ ...base, slug: "gata" })).ok).toBe(false);
    expect(parseProductForm(form({ ...base, priceRon: "abc" })).ok).toBe(false);
  });

  it("adăugare: ciornă nouă; slugul trebuie să fie unic", async () => {
    const r = await createProduct(db, input());
    expect(r.ok).toBe(true);
    id = r.ok ? r.id : "";
    expect((await productById(db, id))?.status).toBe("draft");
    expect(await createProduct(db, input())).toMatchObject({ ok: false });
    expect(await updateProduct(db, id, input({ slug: "maramures" }))).toMatchObject({ ok: false });
  });

  it("publicare: refuzată fără ZIP și fără poză", async () => {
    const r = await setProductStatus(db, id, "publish");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("ZIP");
    expect(!r.ok && r.error).toContain("poză");
    expect(await publishedModel(db, "bucovina")).toBeNull();
  });

  it("upload ZIP: bucățile se lipesc, ZIP-ul se verifică și ajunge la magazin/invitatii-nunta/<slug>.zip, bucățile se șterg", async () => {
    const zip = makeZip([{ name: "Bucovina/print.pdf", data: "%PDF-1.7 print" }, { name: "Bucovina/editabil.pdf", data: "%PDF-1.7 form" }, { name: "Bucovina/", data: "" }, { name: "citeste.txt", data: "Doamne ajută" }]);
    expect(inspectZip(zip)).toEqual({ ok: true, files: 3, pdfs: 2 });
    const upload = "11111111-2222-4333-8444-555555555555";
    const cut = 40;
    const parts = Math.ceil(zip.length / cut);
    for (let n = 0; n < parts; n++) expect((await putZipChunk(store, id, upload, n, zip.subarray(n * cut, (n + 1) * cut))).ok).toBe(true);
    expect([...files.keys()].filter((k) => k.includes("_incarcari"))).toHaveLength(parts);
    const r = await finishZipUpload(db, store, { productId: id, uploadId: upload, parts, size: zip.length });
    expect(r).toMatchObject({ ok: true, files: 3, pdfs: 2 });
    expect(files.get("magazin/invitatii-nunta/bucovina.zip")).toEqual(zip);
    expect([...files.keys()].some((k) => k.includes("_incarcari"))).toBe(false);
    const p = await productById(db, id);
    expect(p).toMatchObject({ zipKey: "magazin/invitatii-nunta/bucovina.zip", zipName: "invitatie-nunta-bucovina.zip" });
    expect(p!.row).toMatchObject({ zipVersion: 1, zipFiles: 3, zipSize: zip.length });
  });

  it("upload ZIP: un fișier care nu e ZIP sau e tăiat nu-l înlocuiește pe cel bun; bucăți greșite sunt refuzate", async () => {
    const good = files.get("magazin/invitatii-nunta/bucovina.zip");
    const upload = "aaaaaaaa-2222-4333-8444-555555555555";
    const notZip = new TextEncoder().encode("%PDF-1.7 nu e zip");
    await putZipChunk(store, id, upload, 0, notZip);
    expect(await finishZipUpload(db, store, { productId: id, uploadId: upload, parts: 1, size: notZip.length })).toMatchObject({ ok: false });
    const cutZip = makeZip([{ name: "a.pdf", data: "x".repeat(50) }]).subarray(0, 60);
    await putZipChunk(store, id, upload, 0, cutZip);
    expect(await finishZipUpload(db, store, { productId: id, uploadId: upload, parts: 1, size: cutZip.length })).toMatchObject({ ok: false });
    // O bucată lipsă.
    expect(await finishZipUpload(db, store, { productId: id, uploadId: upload, parts: 2, size: 100 })).toMatchObject({ ok: false });
    expect(files.get("magazin/invitatii-nunta/bucovina.zip")).toBe(good);
    expect((await putZipChunk(store, id, "nu-e-uuid", 0, notZip)).ok).toBe(false);
    expect((await putZipChunk(store, id, upload, -1, notZip)).ok).toBe(false);
    expect((await putZipChunk(store, id, upload, 0, new Uint8Array(CHUNK_BYTES + 1))).ok).toBe(false);
    expect(chunkKey(id, upload, 3)).toBe(`magazin/invitatii-nunta/_incarcari/${id}/${upload}/0003`);
  });

  it("pozele: doar JPG/PNG/WebP adevărate; se adaugă la sfârșit, se reordonează, prima e cea principală", async () => {
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1, 2, 3]);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    expect(photoType(webp)).toBe("webp");
    expect(photoType(new TextEncoder().encode("<svg>"))).toBeNull();
    expect(await addProductPhoto(db, store, { productId: id, body: new TextEncoder().encode("<svg onload=x>"), width: 800, height: 600 })).toMatchObject({ ok: false });
    const a = await addProductPhoto(db, store, { productId: id, body: webp, width: 1200, height: 900 });
    const b = await addProductPhoto(db, store, { productId: id, body: png, width: 800, height: 1100 });
    expect(a.ok && b.ok).toBe(true);
    let p = (await productById(db, id))!;
    expect(p.images.map((i) => i.src)).toEqual([a.ok && a.src, b.ok && b.src]);
    expect(p.images[0].src).toMatch(/^\/poze-invitatii\/bucovina-[0-9a-f]{8}\.webp$/);
    expect(files.has(p.images[0].key!)).toBe(true);
    expect((await arrangeImages(db, id, [p.images[1].src, p.images[0].src], remove)).ok).toBe(true);
    p = (await productById(db, id))!;
    expect(p.images[0].src).toBe(b.ok && b.src);
  });

  it("publicare: cu ZIP, poză și texte, modelul apare pe site și în sitemap; slugul nu se mai schimbă", async () => {
    expect(await setProductStatus(db, id, "publish")).toMatchObject({ ok: true });
    expect((await publishedModels(db)).map((m) => m.slug)).toEqual(["bucovina"]);
    expect(shopSitemapUrls(await publishedModels(db)).map((u) => u.path)).toEqual(["/invitatii-nunta/bucovina"]);
    expect(await updateProduct(db, id, input({ slug: "bucovina-2" }))).toMatchObject({ ok: false });
    // Un model publicat nu poate rămâne fără textele în română.
    expect(await updateProduct(db, id, input({ texts: {} }))).toMatchObject({ ok: false });
  });

  it("checkout: prețul se ia din baza de date (schimbat din Admin), nu din formular", async () => {
    expect((await updateProduct(db, id, input({ priceRon: 5500, priceEur: 1150 }))).ok).toBe(true);
    const model = (await publishedModel(db, "bucovina"))!;
    const sent: URLSearchParams[] = [];
    const fake = (async (_u: string, init: { body: URLSearchParams }) => { sent.push(init.body); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/x" })); }) as unknown as typeof fetch;
    await createShopCheckout({ model, locale: "ro", origin: "https://carteaneamului.ro", waiver: "Acord", seller: "PFA" }, fake);
    await createShopCheckout({ model, locale: "it", origin: "https://carteaneamului.ro", waiver: "Acord", seller: "PFA" }, fake);
    expect(sent[0].get("line_items[0][price_data][unit_amount]")).toBe("5500");
    expect(sent[0].get("line_items[0][price_data][currency]")).toBe("ron");
    expect(sent[0].get("line_items[0][price_data][product_data][name]")).toBe("Bucovina");
    expect(sent[1].get("line_items[0][price_data][unit_amount]")).toBe("1150");
    expect(sent[1].get("metadata[slug]")).toBe("bucovina");
    expect(sent[1].get("cancel_url")).toBe("https://carteaneamului.ro/invitatii-nunta/bucovina");
  });

  it("descărcarea după plată: tokenul deschide comanda, iar modelul dă ZIP-ul privat din storage", async () => {
    const paid = shopPaidFromSession(session({ id: "cs_test_bucovina_000001", amount_total: 5500, metadata: { kind: SHOP_KIND, slug: "bucovina", locale: "ro" } }))!;
    const { token } = await fulfilShopOrder(db, paid, "https://carteaneamului.ro", new Date(), noMail);
    const found = await orderByToken(db, token);
    expect(found?.expired).toBe(false);
    const m = await modelBySlug(db, found!.order.slug);
    expect(await store.get(m!.zipKey!)).toEqual(files.get("magazin/invitatii-nunta/bucovina.zip"));
    expect(await salesOf(db, "bucovina")).toBe(1);
    expect((await adminProducts(db)).find((p) => p.slug === "bucovina")?.sales).toBe(1);
  });

  it("model retras: dispare de pe site și din sitemap și nu se mai poate cumpăra, dar linkurile plătite merg", async () => {
    expect(await setProductStatus(db, id, "retract")).toMatchObject({ ok: true });
    expect(await publishedModel(db, "bucovina")).toBeNull();
    expect(await publishedModels(db)).toEqual([]);
    expect(shopSitemapUrls(await publishedModels(db))).toEqual([]);
    const found = await orderByToken(db, downloadToken("cs_test_bucovina_000001"));
    expect(found?.expired).toBe(false);
    expect((await modelBySlug(db, found!.order.slug))?.zipKey).toBe("magazin/invitatii-nunta/bucovina.zip");
    // O plată venită după retragere (sesiune deschisă înainte) se trece și ea.
    const late = shopPaidFromSession(session({ id: "cs_test_bucovina_000002", metadata: { kind: SHOP_KIND, slug: "bucovina", locale: "ro" } }))!;
    expect((await fulfilShopOrder(db, late, "https://x", new Date(), noMail)).created).toBe(true);
  });

  it("ștergerea: cu vânzări doar arhivare; fără vânzări, cu slugul scris, se șterg și fișierele", async () => {
    expect(await deleteProduct(db, id, "bucovina", remove)).toMatchObject({ ok: false });
    expect(await setProductStatus(db, id, "archive")).toMatchObject({ ok: true });
    expect((await productById(db, id))?.status).toBe("archived");
    const r = await createProduct(db, input({ slug: "oltenia", texts: { ro: { name: "Oltenia", tagline: "a", description: "b" } } }));
    const oid = r.ok ? r.id : "";
    await addProductPhoto(db, store, { productId: oid, body: new Uint8Array([0xff, 0xd8, 0xff, 1]), width: 500, height: 500 });
    const key = (await productById(db, oid))!.images[0].key!;
    expect(files.has(key)).toBe(true);
    expect(await deleteProduct(db, oid, "olten", remove)).toMatchObject({ ok: false });
    expect(await deleteProduct(db, oid, "oltenia", remove)).toMatchObject({ ok: true });
    expect(await productById(db, oid)).toBeNull();
    expect(files.has(key)).toBe(false);
    expect((await db.select().from(shopProduct).where(eq(shopProduct.slug, "maramures"))).length).toBe(1);
  });
});

describe("emailul de pe pagină și invitația cumpărată pentru altcineva", () => {
  const form = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
  it("emailul e obligatoriu și valid; darul cere emailul destinatarului", () => {
    expect(parseShopBuyer(form({}))).toEqual({ ok: false, error: "email" });
    expect(parseShopBuyer(form({ email: "nu-e-email" }))).toEqual({ ok: false, error: "email" });
    expect(parseShopBuyer(form({ email: " Mire@Exemplu.ro " }))).toEqual({ ok: true, buyer: { email: "mire@exemplu.ro", gift: null } });
    expect(parseShopBuyer(form({ email: "a@b.ro", cadou: "on" }))).toEqual({ ok: false, error: "cadou" });
    // fără bifă, câmpurile darului nu contează
    expect(parseShopBuyer(form({ email: "a@b.ro", cadou_email: "x@y.ro" }))).toEqual({ ok: true, buyer: { email: "a@b.ro", gift: null } });
    const r = parseShopBuyer(form({ email: "nas@b.ro", cadou: "on", cadou_email: "Mireasa@Y.ro", cadou_nume: "Ana\nși Ion", cadou_de_la: "Nașii", cadou_mesaj: "Casă de piatră!" }));
    expect(r).toEqual({ ok: true, buyer: { email: "nas@b.ro", gift: { to: "mireasa@y.ro", toName: "Ana și Ion", from: "Nașii", note: "Casă de piatră!" } } });
  });
  it("Checkout: customer_email precompletat și darul în metadata", async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_u: string, init: { body: URLSearchParams }) => { sent = init.body; return new Response(JSON.stringify({ url: "https://checkout.stripe.com/x" })); }) as unknown as typeof fetch;
    await createShopCheckout({ model: MODEL, locale: "ro", origin: "https://carteaneamului.ro", waiver: "Acord", seller: "PFA",
      buyer: { email: "nas@b.ro", gift: { to: "mireasa@y.ro", toName: "Ana", from: "Nașii", note: "Casă de piatră" } } }, fake);
    expect(sent!.get("customer_email")).toBe("nas@b.ro");
    expect(sent!.get("metadata[email]")).toBe("nas@b.ro");
    expect(sent!.get("metadata[gift_to]")).toBe("mireasa@y.ro");
    expect(sent!.get("metadata[gift_note]")).toBe("Casă de piatră");
  });
  it("sesiunea: emailul de pe pagină are întâietate; la dar, linkul pleacă la destinatar", () => {
    const p = shopPaidFromSession(session({ customer_details: { email: "link@stripe.com" }, metadata: { kind: SHOP_KIND, slug: "maramures", locale: "ro", email: "mire@exemplu.ro" } }))!;
    expect(p.email).toBe("mire@exemplu.ro");
    expect(p.buyerEmail).toBeUndefined();
    const g = shopPaidFromSession(session({ metadata: { kind: SHOP_KIND, slug: "maramures", locale: "ro", email: "nas@b.ro", gift_to: "mireasa@y.ro", gift_name: "Ana", gift_from: "Nașii", gift_note: "Casă de piatră" } }))!;
    expect(g).toMatchObject({ email: "mireasa@y.ro", buyerEmail: "nas@b.ro", giftToName: "Ana", giftFrom: "Nașii", giftNote: "Casă de piatră" });
  });
  it("la dar: emailul cu linkul la destinatar și confirmarea la cumpărător, o singură dată", async () => {
    const db = createDb(); await runMigrations(db);
    const to: string[] = [], buyers: string[] = [];
    const mailer = async (o: { email: string }) => { to.push(o.email); return { ok: true as const, id: "m" }; };
    const buyerMailer = async (o: { buyerEmail: string | null }) => { buyers.push(o.buyerEmail!); return { ok: true as const, id: "b" }; };
    const paid = shopPaidFromSession(session({ id: "cs_test_cadou_a1B2c3D4e5", metadata: { kind: SHOP_KIND, slug: "maramures", locale: "ro", email: "nas@b.ro", gift_to: "mireasa@y.ro", gift_note: "Casă de piatră" } }))!;
    await fulfilShopOrder(db, paid, "https://carteaneamului.ro", new Date(), mailer, buyerMailer);
    await fulfilShopOrder(db, paid, "https://carteaneamului.ro", new Date(), mailer, buyerMailer);
    expect(to).toEqual(["mireasa@y.ro"]);
    expect(buyers).toEqual(["nas@b.ro"]);
    const [row] = await db.select().from(shopOrder);
    expect(row).toMatchObject({ email: "mireasa@y.ro", buyerEmail: "nas@b.ro", giftNote: "Casă de piatră", giftFrom: null });
  });
  it("textele noi există în toate limbile", () => {
    for (const l of LOCALES) {
      const t = shopText(l);
      for (const k of ["emailLabel", "errEmail", "giftToggle", "giftToLabel", "mailGiftSubject", "mailGiftBody", "mailBuyerBody", "doneGift"] as const) expect(t[k], `${l}.${k}`).toBeTruthy();
      expect(t.mailGiftBody).toContain("{from}");
      expect(t.doneGift).toContain("{buyer}");
    }
describe("pozele mari: textele se pot citi pe server", () => {
  it("zoomText are text în toate limbile, iar paginile de pe server nu iau valori din componenta „use client”", async () => {
    const { zoomText } = await import("@/lib/poze-mari-texte");
    for (const l of LOCALES) expect(zoomText(l).open, l).toBeTruthy();
    // Un export obișnuit dintr-un fișier „use client” e undefined pe server (pagina modelului dădea 500): doar componenta implicită.
    const src = readFileSync("src/components/InvitatiiNunta.tsx", "utf8");
    expect(src).not.toMatch(/import\s+PozeMari\s*,\s*\{/);
    expect(readFileSync("src/lib/poze-mari-texte.ts", "utf8")).not.toContain("use client");
  });
});
