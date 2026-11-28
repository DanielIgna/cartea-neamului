import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { shopOrder, shopProduct } from "@/db/schema";
import { LOCALES } from "@/i18n/locales";
import {
  CATEGORY_KEYS, SHOP_CATEGORIES, SHOP_KIND, categoryByKind, isCategoryProductPath, isModelPath, modelPath, regionKey, type ShopModel,
} from "@/lib/invitatii-nunta";
import { SHOP_TEXT } from "@/lib/invitatii-nunta-texte";
import { CATEGORY_TEXT, categoryText } from "@/lib/magazin-texte";
import {
  createShopCheckout, downloadToken, downloadUrl, fulfilShopOrder, orderByToken, resendShopMail, setShopOpen, shopEvent, shopOpen, shopPaidFromSession,
} from "@/lib/invitatii-nunta-server";
import {
  adminProducts, createProduct, modelBySlug, parseProductForm, publishedModel, publishedModels, salesOf, sameRegion, updateProduct, type ProductInput,
} from "@/lib/invitatii-nunta-produse";
import { finishZipUpload, inspectPdf, putZipChunk, type Store } from "@/lib/invitatii-nunta-incarcare";
import { shopSitemap, shopSitemapUrls } from "@/lib/invitatii-nunta-sitemap";
import { PRIVATE_PREFIXES, PUBLIC_PAGES, pageLocales } from "@/lib/public-pages";
import { isPublicPath } from "@/lib/public-variant";
import { hasRealTranslation } from "@/lib/traduceri-reale";
import { SALE_KIND } from "@/lib/plati-test";

/**
 * Categoriile noi ale magazinului (Daniel, 28.11.2026): „Accesorii nuntă” (/accesorii-nunta/<regiune>) și „Jurnale de familie”
 * (/jurnale/<slug>), în același tabel cu invitațiile. Invitațiile rămân neschimbate (tests/invitatii-nunta.test.ts).
 */

const TEXT_LOCALES = LOCALES.filter((l) => l !== "en-US");

const memStore = () => {
  const files = new Map<string, Uint8Array>();
  const store: Store = {
    put: async (k, b) => { files.set(k, b); },
    get: async (k) => { const b = files.get(k); if (!b) throw new Error("NoSuchKey"); return b; },
    del: async (keys) => { for (const k of keys) files.delete(k); },
  };
  return { files, store };
};

const form = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
  return f;
};

const input = (o: Partial<ProductInput> = {}): ProductInput => ({
  category: "accesorii", parts: ["meniu", "carduri-loc"], slug: "maramures", region: "Maramureș", sort: 0, languages: ["ro", "en"], formats: ["A5"],
  priceRon: 5900, priceEur: 1200, texts: { ro: { name: "Maramureș", tagline: "Setul complet.", description: "Meniu și carduri." } }, ...o,
});

const ACC: ShopModel = {
  id: "acc", category: "accesorii", parts: ["meniu", "numere-masa"], slug: "maramures", region: "Maramureș", status: "published", languages: ["ro"], formats: ["A5"],
  priceLei: 59, priceEur: 12, texts: { ro: { name: "Maramureș", tagline: "Setul", description: "Meniu" } },
  images: [{ src: "/poze-invitatii/maramures-abcd1234.webp", width: 1400, height: 1000 }], zipKey: "magazin/accesorii-nunta/maramures.zip", zipName: "x.zip", updatedAt: new Date("2026-11-28T00:00:00Z"),
};

const SECRET_ENV = "BETTER_AUTH_SECRET";
let oldSecret: string | undefined;
beforeEach(() => { oldSecret = process.env[SECRET_ENV]; process.env[SECRET_ENV] = "secret-de-test-pentru-magazin"; });
afterEach(() => { if (oldSecret === undefined) delete process.env[SECRET_ENV]; else process.env[SECRET_ENV] = oldSecret; });

describe("categoriile și textele", () => {
  it("fiecare categorie are adresa, felul plății, locul în storage și comutatorul ei", () => {
    const vals = Object.values(SHOP_CATEGORIES);
    for (const k of ["path", "kind", "storage", "admin", "switchKey"] as const) expect(new Set(vals.map((c) => c[k])).size).toBe(vals.length);
    expect(SHOP_CATEGORIES.invitatie).toMatchObject({ path: "/invitatii-nunta", kind: SHOP_KIND, storage: "magazin/invitatii-nunta", switchKey: "invitatii_nunta", promoCodes: true });
    expect(SHOP_CATEGORIES.accesorii).toMatchObject({ path: "/accesorii-nunta", promoCodes: false });
    expect(SHOP_CATEGORIES.jurnal).toMatchObject({ path: "/jurnale", promoCodes: false, file: "zip-pdf" });
    expect(categoryByKind("accesorii-nunta")).toBe("accesorii");
    expect(categoryByKind("jurnal-familie")).toBe("jurnal");
    expect(categoryByKind("an")).toBeNull();
  });
  it("adresele: produsele au slug curat, „gata” e rezervat; invitațiile rămân la /invitatii-nunta", () => {
    expect(modelPath(ACC)).toBe("/accesorii-nunta/maramures");
    expect(modelPath({ slug: "bunico-povesteste-mi", category: "jurnal" })).toBe("/jurnale/bunico-povesteste-mi");
    expect(modelPath({ slug: "maramures" })).toBe("/invitatii-nunta/maramures");
    expect(isCategoryProductPath("/accesorii-nunta/maramures")).toBe(true);
    expect(isCategoryProductPath("/jurnale/bunico-povesteste-mi")).toBe(true);
    expect(isCategoryProductPath("/accesorii-nunta/gata")).toBe(false);
    expect(isCategoryProductPath("/jurnale/Bunico")).toBe(false);
    expect(isCategoryProductPath("/invitatii-nunta/maramures")).toBe(false);
    expect(isModelPath("/accesorii-nunta/maramures")).toBe(false);
    expect(regionKey({ region: "Țara Hațegului", slug: "x" })).toBe("tara-hategului");
  });
  it("textele categoriilor sunt în toate limbile, fără goluri, cu numele fiecărei părți", () => {
    for (const c of ["accesorii", "jurnal"] as const) {
      const all = c === "accesorii" ? CATEGORY_TEXT.accesorii : CATEGORY_TEXT.jurnal;
      for (const l of TEXT_LOCALES) {
        const t = all[l];
        expect(t, `${c} ${l}`).toBeDefined();
        for (const [k, v] of Object.entries(t)) if (typeof v === "string") expect(v.trim(), `${c} ${l} ${k}`).not.toBe("");
        expect(Object.keys(t.parts).sort(), `${c} ${l}`).toEqual(Object.keys(SHOP_CATEGORIES[c].parts).sort());
        expect(t.hubMetaTitle.length, `${c} ${l} hubMetaTitle`).toBeLessThanOrEqual(90);
      }
    }
    for (const l of TEXT_LOCALES) {
      for (const [k, v] of Object.entries(CATEGORY_TEXT.generic[l])) expect(v.trim(), `generic ${l} ${k}`).not.toBe("");
      for (const [k, v] of Object.entries(CATEGORY_TEXT.set[l])) expect(v.trim(), `set ${l} ${k}`).not.toBe("");
      expect(CATEGORY_TEXT.generic[l].mailSubject).toContain("{name}");
      expect(CATEGORY_TEXT.generic[l].mailGiftBody).toContain("{from}");
    }
    // Engleza americană = cea britanică.
    expect(categoryText("jurnal", "en-US").hubTitle).toBe(categoryText("jurnal", "en-GB").hubTitle);
  });
  it("invitațiile primesc exact textele de până acum", () => {
    for (const l of LOCALES) {
      const t = categoryText("invitatie", l);
      const base = SHOP_TEXT[l === "en-US" ? "en-GB" : l];
      for (const [k, v] of Object.entries(base)) expect(t[k as keyof typeof base]).toBe(v);
    }
  });
  it("fără limbaj religios în titlurile categoriilor noi", () => {
    for (const all of [CATEGORY_TEXT.accesorii, CATEGORY_TEXT.jurnal]) for (const t of Object.values(all)) {
      expect(`${t.hubTitle} ${t.hubMetaTitle} ${t.label}`).not.toMatch(/biseric|bibli|church|bible|kirche|chiesa|église|iglesia/i);
    }
  });
});

describe("SEO și adresele", () => {
  it("listele sunt pagini publice în toate limbile; produsele au rută dinamică; paginile de după plată sunt private", () => {
    for (const c of ["accesorii", "jurnal"] as const) {
      const path = SHOP_CATEGORIES[c].path;
      expect(PUBLIC_PAGES.map((p) => p.path)).toContain(path);
      expect(pageLocales(path)).toEqual(LOCALES);
      expect(PRIVATE_PREFIXES).toContain(`${path}/gata`);
      expect(isPublicPath(`${path}/un-produs`)).toBe(true);
      expect(isPublicPath(`${path}/gata`)).toBe(false);
      expect(hasRealTranslation(`${path}/un-produs`, "de")).toBe(true);
      expect(readFileSync("src/middleware.ts", "utf8")).toContain(`"${path}/:slug"`);
    }
    expect(PRIVATE_PREFIXES).toContain("/api/magazin/");
  });
  it("sitemap: produsele publicate, la adresa categoriei lor, cu hreflang și poze", () => {
    const urls = shopSitemapUrls([{ ...ACC, texts: { ...ACC.texts, "en-GB": { name: "Maramureș", tagline: "Set", description: "Menu" } } }]);
    expect(urls.map((u) => u.path)).toEqual(["/accesorii-nunta/maramures", "/en/accesorii-nunta/maramures", "/en-us/accesorii-nunta/maramures"]);
    expect(urls[0].images).toEqual(["/poze-invitatii/maramures-abcd1234.webp"]);
    expect(urls[0].alternates?.["x-default"]).toBe("/accesorii-nunta/maramures");
  });
  it("schema Product și paginile proprii există pentru ambele categorii", () => {
    const comp = readFileSync("src/components/MagazinDigital.tsx", "utf8");
    expect(comp).toContain('"@type": "Product"');
    expect(comp).toContain("priceCurrency");
    for (const dir of ["accesorii-nunta", "jurnale"]) {
      for (const f of [`src/app/(site)/${dir}/page.tsx`, `src/app/(site)/${dir}/[slug]/page.tsx`, `src/app/(site)/${dir}/gata/page.tsx`, `src/app/(public)/pub/[v]/${dir}/page.tsx`, `src/app/(public)/pub/[v]/${dir}/[slug]/page.tsx`]) {
        expect(() => readFileSync(f), f).not.toThrow();
      }
    }
  });
  it("Admin: paginile noi sunt în meniu, iar funcția e în Centrul de cunoștințe", () => {
    const menu = readFileSync("src/lib/admin-menu.ts", "utf8");
    expect(menu).toContain('href: "/admin/accesorii-nunta"');
    expect(menu).toContain('href: "/admin/jurnale"');
    expect(readFileSync("src/lib/cunostinte/functii.ts", "utf8")).toContain('key: "magazin-accesorii-jurnale"');
  });
});

describe("plata: aceeași ca la invitații, fără codurile invitațiilor", () => {
  it("accesoriile și jurnalele nu primesc câmpul de cod și nici produsul Stripe al invitațiilor", async () => {
    const sent: URLSearchParams[] = [];
    const fake = (async (_u: string, init: { body: URLSearchParams }) => { sent.push(init.body); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/x" })); }) as unknown as typeof fetch;
    const env = { STRIPE_INVITATII_PRODUCT: "prod_TestInvitatie123" };
    await createShopCheckout({ model: ACC, locale: "ro", origin: "https://carteaneamului.ro", waiver: "Acord", seller: "PFA" }, fake, env);
    const b = sent[0];
    expect(b.has("allow_promotion_codes")).toBe(false);
    expect(b.has("line_items[0][price_data][product]")).toBe(false);
    expect(b.get("line_items[0][price_data][product_data][name]")).toBe("Maramureș");
    expect(b.get("line_items[0][price_data][unit_amount]")).toBe("5900");
    expect(b.get("line_items[0][price_data][currency]")).toBe("ron");
    expect(b.get("metadata[kind]")).toBe("accesorii-nunta");
    expect(b.get("mode")).toBe("payment");
    expect(b.get("invoice_creation[enabled]")).toBe("true");
    expect(b.get("success_url")).toBe("https://carteaneamului.ro/accesorii-nunta/gata?session_id={CHECKOUT_SESSION_ID}");
    expect(b.get("cancel_url")).toBe("https://carteaneamului.ro/accesorii-nunta/maramures");
    await createShopCheckout({ model: { ...ACC, category: "jurnal", slug: "bunico" }, locale: "de", origin: "https://carteaneamului.ro", waiver: "A", seller: "P" }, fake, env);
    expect(sent[1].has("allow_promotion_codes")).toBe(false);
    expect(sent[1].get("metadata[kind]")).toBe("jurnal-familie");
    expect(sent[1].get("line_items[0][price_data][currency]")).toBe("eur");
    // Invitațiile au în continuare codurile și produsul lor.
    await createShopCheckout({ model: { ...ACC, category: undefined, parts: undefined }, locale: "ro", origin: "https://carteaneamului.ro", waiver: "A", seller: "P" }, fake, env);
    expect(sent[2].get("allow_promotion_codes")).toBe("true");
    expect(sent[2].get("line_items[0][price_data][product]")).toBe("prod_TestInvitatie123");
  });
  it("webhook-ul recunoaște plățile noi și le ține categoria", () => {
    const s = { id: "cs_test_acc12345678", payment_status: "paid", amount_total: 5900, currency: "ron", customer_details: { email: "a@b.ro" }, metadata: { kind: "accesorii-nunta", slug: "maramures", locale: "ro" } };
    expect(shopEvent({ type: "checkout.session.completed", data: { object: s } })?.paid).toMatchObject({ category: "accesorii", slug: "maramures", email: "a@b.ro" });
    expect(shopPaidFromSession({ ...s, metadata: { ...s.metadata, kind: "jurnal-familie" } })).toMatchObject({ category: "jurnal" });
    // O invitație rămâne exact cum era (fără categorie în comandă = invitație).
    expect(shopPaidFromSession({ ...s, metadata: { ...s.metadata, kind: SHOP_KIND } })).not.toHaveProperty("category");
  });
  it("linkul de descărcare: invitațiile pe ruta lor, celelalte pe /api/magazin/descarca", () => {
    expect(downloadUrl("https://carteaneamului.ro", "T")).toBe("https://carteaneamului.ro/api/invitatii-nunta/descarca/T");
    expect(downloadUrl("https://carteaneamului.ro/", "T", "jurnal")).toBe("https://carteaneamului.ro/api/magazin/descarca/T");
  });
  it("ruta de plată nouă nu atinge checkout-ul cărții de familie și nu cere coduri", () => {
    const route = readFileSync("src/app/api/magazin/start/route.ts", "utf8");
    expect(route).not.toContain("allow_promotion_codes");
    expect(route).not.toMatch(/from "@\/lib\/plati"/);
    expect(readFileSync("src/lib/plati.ts", "utf8")).not.toContain("accesorii");
  });
  it("rapoartele de plăți numără comenzile pe categorie", () => {
    expect(SALE_KIND).toMatchObject({ invitatie: "invitație de nuntă", accesorii: "accesorii nuntă", jurnal: "jurnal de familie" });
    expect(readFileSync("src/lib/plati-test.ts", "utf8")).toContain("coalesce(category, 'invitatie') as kind");
  });
});

describe("în baza de date", () => {
  let db: Db;
  const { files, store } = memStore();
  beforeAll(async () => { db = createDb(); await runMigrations(db); });

  it("migrația: invitația Maramureș rămâne invitație; același slug poate fi și set de accesorii, dar nu de două ori în aceeași categorie", async () => {
    const [m] = await db.select().from(shopProduct).where(eq(shopProduct.slug, "maramures"));
    expect(m).toMatchObject({ category: "invitatie", parts: [] });
    const r = await createProduct(db, input());
    expect(r.ok).toBe(true);
    expect(await createProduct(db, input())).toMatchObject({ ok: false });
    expect((await createProduct(db, input({ category: "jurnal", slug: "maramures", parts: [] }))).ok).toBe(true);
    // Invitațiile nu văd produsele altor categorii.
    expect((await modelBySlug(db, "maramures"))?.category).toBe("invitatie");
    expect((await modelBySlug(db, "maramures", { category: "accesorii" }))?.parts).toEqual(["meniu", "carduri-loc"]);
    expect((await adminProducts(db)).every((p) => p.category === "invitatie")).toBe(true);
    expect((await adminProducts(db, "accesorii")).map((p) => p.slug)).toEqual(["maramures"]);
  });
  it("formularul din Admin: categoria, „Ce conține” și formatele ei; invitațiile rămân fără categorie", () => {
    const base = { slug: "bunico-povesteste-mi", priceRon: "39", priceEur: "8", "t.ro.name": "Bunico, povestește-mi", "t.ro.tagline": "x".repeat(300), "t.ro.description": "Jurnal" };
    const j = parseProductForm(form({ ...base, category: "jurnal", parts: ["bunica", "bunic", "meniu"], formats: ["A4", "5x7"] }));
    expect(j).toMatchObject({ ok: true, value: { category: "jurnal", parts: ["bunica", "bunic"], formats: ["A4"], priceRon: 3900, priceEur: 800 } });
    expect(parseProductForm(form({ ...base, "t.ro.tagline": "x".repeat(301), category: "jurnal" })).ok).toBe(false);
    expect(parseProductForm(form({ ...base, category: "altceva" })).ok).toBe(false);
    const inv = parseProductForm(form({ ...base, formats: ["5x7"] }));
    expect(inv.ok && inv.value).not.toHaveProperty("category");
    expect(inv.ok && inv.value.formats).toEqual(["5x7"]);
  });
  it("un produs nu-și schimbă categoria din formular", async () => {
    const [p] = await adminProducts(db, "accesorii");
    expect(await updateProduct(db, p.id, input({ category: "jurnal" }))).toMatchObject({ ok: false });
    expect(await updateProduct(db, p.id, input({ parts: ["meniu"] }))).toMatchObject({ ok: true });
  });
  it("fișierul: accesoriile primesc ZIP la magazin/accesorii-nunta/<slug>.zip, nu PDF; jurnalele primesc și un PDF", async () => {
    const [acc] = await adminProducts(db, "accesorii");
    const [jur] = await adminProducts(db, "jurnal");
    const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj << /Type /Page >> endobj\n2 0 obj << /Type /Pages >> endobj\n%%EOF\n");
    expect(inspectPdf(pdf)).toEqual({ ok: true, pages: 1 });
    expect(inspectPdf(pdf.subarray(0, 30)).ok).toBe(false);
    const up = async (id: string, body: Uint8Array, upload: string) => {
      expect((await putZipChunk(store, id, upload, 0, body)).ok).toBe(true);
      return finishZipUpload(db, store, { productId: id, uploadId: upload, parts: 1, size: body.length });
    };
    expect(await up(acc.id, pdf, "11111111-2222-4333-8444-555555555551")).toMatchObject({ ok: false });
    const r = await up(jur.id, pdf, "11111111-2222-4333-8444-555555555552");
    expect(r).toMatchObject({ ok: true, kind: "pdf", pages: 1 });
    expect(files.get("magazin/jurnale/maramures.pdf")).toEqual(pdf);
    expect((await modelBySlug(db, "maramures", { category: "jurnal" }))).toMatchObject({ zipKey: "magazin/jurnale/maramures.pdf", zipName: "jurnal-maramures.pdf" });
    // Invitația Maramureș (alt produs, aceeași regiune) nu e atinsă.
    expect((await modelBySlug(db, "maramures"))?.zipKey ?? null).toBeNull();
  });
  it("„Completează setul”: setul publicat din aceeași regiune apare lângă invitație, și invitația lângă set", async () => {
    const inv = (await modelBySlug(db, "maramures"))!;
    expect(await sameRegion(db, inv, "accesorii")).toBeNull();
    await db.update(shopProduct).set({ status: "published", zipKey: "magazin/accesorii-nunta/maramures.zip", images: [{ src: "/poze-invitatii/maramures-abcd1234.webp", width: 100, height: 100 }] })
      .where(eq(shopProduct.category, "accesorii"));
    expect((await sameRegion(db, inv, "accesorii"))?.category).toBe("accesorii");
    expect(await sameRegion(db, { region: "Bucovina", slug: "bucovina" }, "accesorii")).toBeNull();
    // Invitația e ciornă (fără ZIP), deci nu apare lângă set.
    expect(await sameRegion(db, (await publishedModel(db, "maramures", "accesorii"))!, "invitatie")).toBeNull();
    expect((await publishedModels(db, "accesorii")).map((m) => m.slug)).toEqual(["maramures"]);
    expect(await publishedModels(db)).toEqual([]);
  });
  it("comutatorul fiecărei categorii e separat; sitemap-ul ia doar categoriile pornite", async () => {
    expect((await shopSitemap(db)).map((u) => u.path)).toContain("/accesorii-nunta/maramures");
    await setShopOpen(db, false, null, new Date(), "accesorii");
    expect(await shopOpen(db, "accesorii")).toBe(false);
    expect(await shopOpen(db)).toBe(true);
    expect((await shopSitemap(db)).map((u) => u.path)).not.toContain("/accesorii-nunta/maramures");
    await setShopOpen(db, true, null, new Date(), "accesorii");
  });
  it("comanda: ține categoria, linkul descarcă fișierul categoriei, vânzările se numără pe categorie", async () => {
    const mails: { category: string; email: string }[] = [];
    const mailer = async (o: { category: string; email: string }) => { mails.push({ category: o.category, email: o.email }); return { ok: true as const, id: "m" }; };
    const paid = shopPaidFromSession({ id: "cs_test_acc00000001", payment_status: "paid", amount_total: 5900, currency: "ron", customer_details: { email: "mire@exemplu.ro" }, metadata: { kind: "accesorii-nunta", slug: "maramures", locale: "ro" } })!;
    const r = await fulfilShopOrder(db, paid, "https://carteaneamului.ro", new Date(), mailer, mailer);
    expect(r.created).toBe(true);
    expect(r.order).toMatchObject({ category: "accesorii", slug: "maramures" });
    expect(mails).toEqual([{ category: "accesorii", email: "mire@exemplu.ro" }]);
    const found = await orderByToken(db, downloadToken(paid.id));
    expect(found?.order.category).toBe("accesorii");
    expect(await salesOf(db, "maramures", "accesorii")).toBe(1);
    expect(await salesOf(db, "maramures")).toBe(0);
    expect(await salesOf(db, "maramures", "jurnal")).toBe(0);
    expect(await resendShopMail(db, paid.id, "https://carteaneamului.ro", new Date(Date.now() + 120_000), mailer)).toBe("ok");
    const [row] = await db.select().from(shopOrder).where(eq(shopOrder.id, paid.id));
    expect(row.emailsSent).toBe(2);
  });
  it("textele emailului: subiectul și butonul sunt ale categoriei, nu „Invitația de nuntă”", () => {
    const t = categoryText("jurnal", "ro");
    expect(t.mailSubject).not.toMatch(/invita/i);
    expect(t.mailButton).toBe("Descarcă fișierele");
    expect(categoryText("accesorii", "de").partsLabel).toBe("Was das Set enthält");
    expect(CATEGORY_KEYS).toEqual(["invitatie", "accesorii", "jurnal"]);
  });
});
