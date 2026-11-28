/**
 * Vânzarea invitațiilor de nuntă (Daniel, 27.11.2026), fără cont, separat de plățile contului (src/lib/plati.ts rămâne neatins):
 * - /api/invitatii-nunta/start deschide o plată Stripe Checkout (mode payment) cu metadata kind=invitatie-nunta, slug și locale;
 *   prețul vine din baza de date (shop_product, src/lib/invitatii-nunta-produse.ts), nu din formular; Stripe cere emailul;
 * - webhook-ul (/api/plata/stripe) trimite aici evenimentele cu kind=invitatie-nunta, înainte de paidSession();
 * - comanda se scrie în `shop_order` o singură dată pe sesiune, cu hash-ul unui token lung (HMAC din id-ul sesiunii), valabil
 *   30 de zile; clientul primește linkul pe email (Resend), iar /invitatii-nunta/gata?session_id=… îl arată și el;
 * - /api/invitatii-nunta/descarca/<token> verifică tokenul și trimite ZIP-ul modelului din storage-ul privat
 *   (magazin/invitatii-nunta/<slug>.zip), chiar dacă între timp modelul a fost retras sau arhivat.
 * Rubrica se poate opri din Admin → Invitații de nuntă (app_setting „invitatii_nunta”), fără deploy.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, shopOrder } from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/locales";
import { sendEmail, siteInbox, type EmailResult } from "./email";
import { formatPaid, renderMail } from "./emailuri";
import {
  LINK_DAYS, SHOP_CATEGORIES, categoryByKind, categoryOf, doneSlugPath, fill, isModelSlug, modelPath, modelText, shopPrice,
  type ShopCategory, type ShopModel,
} from "./invitatii-nunta";
import { categoryText } from "./magazin-texte";
import { modelBySlug } from "./invitatii-nunta-produse";
import { operator } from "./legal";

const DAY = 86_400_000;

/* ---------- Comutatorul din Admin ---------- */

export const SHOP_SWITCH_KEY = "invitatii_nunta";

/**
 * E deschisă rubrica (implicit invitațiile; fiecare categorie are comutatorul ei)? Implicit da; dacă baza nu se poate citi (de
 * pildă pe o variantă de probă), tot da, dar plata rămâne oprită acolo.
 */
export async function shopOpen(db: Pick<Db, "select">, category: ShopCategory = "invitatie"): Promise<boolean> {
  try {
    const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, SHOP_CATEGORIES[category].switchKey));
    const v = r?.value as { on?: unknown } | undefined;
    return v?.on !== false;
  } catch {
    return true;
  }
}

export async function setShopOpen(db: Db, on: boolean, by: string | null, now = new Date(), category: ShopCategory = "invitatie") {
  await db.insert(appSetting).values({ key: SHOP_CATEGORIES[category].switchKey, value: { on }, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: { on }, updatedBy: by, updatedAt: now } });
}

/**
 * Se pot face plăți de aici? Trebuie cheia Stripe; în afara producției (Preview, calculatorul de dezvoltare) doar cu o cheie de
 * test (sk_test_ / rk_test_), ca pe o copie de probă să nu se ia niciodată bani adevărați.
 */
export function shopPaymentsReady(env: Record<string, string | undefined> = process.env): boolean {
  const key = env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) return false;
  if (env.VERCEL_ENV === "production") return true;
  return /^(sk|rk)_test_/.test(key);
}

/* ---------- Tokenul de descărcare ---------- */

function tokenSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.SHOP_TOKEN_SECRET?.trim() || env.BETTER_AUTH_SECRET?.trim();
  if (!s) throw new Error("Lipsește SHOP_TOKEN_SECRET (sau BETTER_AUTH_SECRET).");
  return s;
}

/**
 * Tokenul unei comenzi: HMAC-SHA256 din id-ul sesiunii Stripe, cu cheia secretă a site-ului (43 de semne, base64url). Așa pagina
 * de după plată (care știe id-ul sesiunii) arată același link ca emailul, iar în bază stă doar hash-ul lui.
 */
export const downloadToken = (sessionId: string, secret = tokenSecret()) =>
  createHmac("sha256", secret).update(`invitatii-nunta:${sessionId}`).digest("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/** Linkul de descărcare: invitațiile au ruta lor (neschimbată); accesoriile și jurnalele, /api/magazin/descarca/<token>. */
export const downloadUrl = (origin: string, token: string, category: ShopCategory = "invitatie") =>
  `${origin.replace(/\/+$/, "")}${category === "invitatie" ? "/api/invitatii-nunta" : "/api/magazin"}/descarca/${token}`;

/* ---------- Plata ---------- */

/** Limba paginii de plată din Stripe. */
const stripeLocale = (l: string) => (l.startsWith("en") ? "en" : l === "nb" ? "nb" : l);

/**
 * Deschide pagina de plată Stripe pentru un model și dă adresa ei. Factura, acordul pentru acces imediat și datele PFA, ca la
 * plățile existente (createCheckout), dar fără cont: Stripe cere emailul clientului.
 */
/** Ce scrie omul pe pagină: emailul lui (obligatoriu) și, dacă o cumpără pentru altcineva, emailul, numele și mesajul darului. */
export type ShopBuyer = { email: string; gift?: { to: string; toName: string; from: string; note: string } | null };

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
export const isShopEmail = (v: unknown): v is string => typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Formularul de pe pagina modelului → cumpărătorul, sau ce lipsește („email” / „cadou”). */
export function parseShopBuyer(form: FormData): { ok: true; buyer: ShopBuyer } | { ok: false; error: "email" | "cadou" } {
  const email = clean(form.get("email"), 254).toLowerCase();
  if (!isShopEmail(email)) return { ok: false, error: "email" };
  if (form.get("cadou") !== "on") return { ok: true, buyer: { email, gift: null } };
  const to = clean(form.get("cadou_email"), 254).toLowerCase();
  if (!isShopEmail(to)) return { ok: false, error: "cadou" };
  if (to === email) return { ok: true, buyer: { email, gift: null } };
  return { ok: true, buyer: { email, gift: { to, toName: clean(form.get("cadou_nume"), 80), from: clean(form.get("cadou_de_la"), 80), note: clean(form.get("cadou_mesaj"), 300) } } };
}

export async function createShopCheckout(o: {
  model: ShopModel; locale: Locale; origin: string; waiver: string; seller: string; buyer?: ShopBuyer;
}, fetcher: typeof fetch = fetch, env: Record<string, string | undefined> = process.env): Promise<string> {
  const price = shopPrice(o.model, o.locale);
  const category = o.model.category ?? "invitatie";
  const cat = SHOP_CATEGORIES[category];
  const name = (modelText(o.model, o.locale) ?? modelText(o.model, "ro"))?.title ?? o.model.slug;
  // Produsul fix „Invitație de nuntă” din Stripe (Daniel, 27.11.2026): codurile de reducere create în Stripe doar pentru el merg
  // doar la invitații, nu și la plățile contului (/plata, cartea PDF), care nu primesc allow_promotion_codes. Prețul rămâne cel
  // din baza de date; modelul (Maramureș, Bucovina…) stă în metadata și în descrierea plății. Fără variabilă, ca înainte: numele pe linie.
  // Accesoriile și jurnalele (28.11.2026) nu folosesc produsul invitațiilor și nu primesc câmpul de cod: codurile pentru invitații
  // nu li se aplică.
  const product = cat.promoCodes ? env.STRIPE_INVITATII_PRODUCT?.trim() : undefined;
  const item: Record<string, string> = product && /^prod_[A-Za-z0-9]+$/.test(product)
    ? { "line_items[0][price_data][product]": product }
    : { "line_items[0][price_data][product_data][name]": name };
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": price.currency,
    "line_items[0][price_data][unit_amount]": String(price.amount),
    ...item,
    ...(cat.promoCodes ? { allow_promotion_codes: "true" } : {}),
    "metadata[model]": name.slice(0, 450),
    "payment_intent_data[description]": name.slice(0, 900),
    success_url: `${o.origin}${doneSlugPath(category)}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${o.origin}${modelPath(o.model)}`,
    locale: stripeLocale(o.locale),
    "metadata[kind]": cat.kind,
    "metadata[slug]": o.model.slug,
    "metadata[locale]": o.locale,
    // Emailul scris pe pagină (Daniel, 27.11.2026): Stripe îl arată pe pagina de plată și trimite acolo chitanța; linkul pleacă la el
    // sau, la o invitație cumpărată pentru altcineva, la emailul acela, cu numele și mesajul darului.
    ...(o.buyer ? { customer_email: o.buyer.email, "metadata[email]": o.buyer.email } : {}),
    ...(o.buyer?.gift ? {
      "metadata[gift_to]": o.buyer.gift.to, "metadata[gift_name]": o.buyer.gift.toName,
      "metadata[gift_from]": o.buyer.gift.from, "metadata[gift_note]": o.buyer.gift.note,
    } : {}),
    "invoice_creation[enabled]": "true",
    // Confirmarea pe suport durabil a renunțării la retragere (OUG 34/2014): sub butonul de plată și în factură; în subsol, vânzătorul.
    "custom_text[submit][message]": o.waiver.slice(0, 1200),
    "invoice_creation[invoice_data][description]": o.waiver.slice(0, 1500),
    "invoice_creation[invoice_data][footer]": o.seller.slice(0, 5000),
  });
  const r = await fetcher("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = (await r.json()) as { url?: string; error?: { message?: string } };
  if (!r.ok || !j.url) throw new Error(`Stripe: ${j.error?.message ?? r.status}`);
  return j.url;
}

/** Textul acordului (scris pe pagina Stripe și pe factură) și datele vânzătorului. */
export function shopWaiver(locale: Locale, origin: string, category: ShopCategory = "invitatie") {
  const t = categoryText(category, locale);
  const op = operator();
  return {
    waiver: `${t.consent} ${t.license} ${origin}/termeni`,
    seller: `${op.name}, CUI ${op.cui}, ${op.regCom}, ${op.address}. ${op.email}`,
  };
}

export type ShopPaid = {
  /** Lipsă = invitație. */
  category?: ShopCategory;
  id: string; email: string; slug: string; locale: Locale; amount: number; currency: string;
  /** Codul de reducere: id-ul Stripe (promo_…) până îl traduce fillPaymentCodes; "" = fără. */
  promo?: string;
  /** Doar la o invitație cumpărată pentru altcineva: cine a plătit și ce a scris pentru darul lui. `email` e atunci destinatarul. */
  buyerEmail?: string | null; giftToName?: string | null; giftFrom?: string | null; giftNote?: string | null;
};

/** O sesiune Checkout (din webhook sau citită din Stripe) → comanda plătită, dacă e a rubricii și e plătită. */
export function shopPaidFromSession(o: Record<string, unknown> | undefined | null): ShopPaid | null {
  if (!o) return null;
  const md = (o.metadata ?? {}) as Record<string, string>;
  const category = categoryByKind(md.kind);
  if (!category || typeof o.id !== "string") return null;
  if (o.payment_status !== "paid" && o.payment_status !== "no_payment_required") return null;
  // Doar forma slugului: comanda se trece și dacă modelul a fost retras între timp (omul a plătit).
  const details = (o.customer_details ?? {}) as { email?: unknown };
  const email = typeof details.email === "string" ? details.email : typeof o.customer_email === "string" ? o.customer_email : "";
  // Emailul scris pe pagină are întâietate (la Stripe Link, cel din pagina de plată poate fi al contului Link).
  const buyer = isShopEmail(md.email) ? md.email : email.trim().slice(0, 320);
  if (!isModelSlug(md.slug) || !buyer) return null;
  // Codul folosit: Stripe trimite doar id-ul (promo_…); îl traduce în cod fillPaymentCodes. '' = fără reducere.
  const disc = (o.discounts as { promotion_code?: unknown }[] | undefined)?.find((d) => typeof d?.promotion_code === "string")?.promotion_code as string | undefined;
  const base = { ...(category === "invitatie" ? {} : { category }), id: o.id, slug: md.slug, locale: isLocale(md.locale) ? md.locale : "ro" as Locale, amount: Number(o.amount_total ?? 0), currency: String(o.currency ?? ""), promo: disc ?? "" };
  if (isShopEmail(md.gift_to) && md.gift_to !== buyer) {
    return { ...base, email: md.gift_to, buyerEmail: buyer, giftToName: clean(md.gift_name, 80) || null, giftFrom: clean(md.gift_from, 80) || null, giftNote: clean(md.gift_note, 300) || null };
  }
  return { ...base, email: buyer };
}

/**
 * Evenimentul Stripe e al rubricii (kind=invitatie-nunta)? `null` = nu e (merge mai departe la plățile contului); altfel
 * `{ paid }`, cu comanda dacă plata e încheiată (altfel `paid: null`, de pildă un transfer care încă așteaptă).
 */
export function shopEvent(event: unknown): { paid: ShopPaid | null } | null {
  const e = event as { type?: string; data?: { object?: Record<string, unknown> } };
  if (typeof e?.type !== "string" || !e.type.startsWith("checkout.session.")) return null;
  const o = e.data?.object;
  if (!categoryByKind(((o?.metadata ?? {}) as Record<string, string>).kind)) return null;
  const done = e.type === "checkout.session.completed" || e.type === "checkout.session.async_payment_succeeded";
  return { paid: done ? shopPaidFromSession(o) : null };
}

/** Citește o sesiune din Stripe (pagina de după plată, dacă webhook-ul n-a ajuns încă). */
export async function fetchShopSession(id: string, fetcher: typeof fetch = fetch): Promise<ShopPaid | null> {
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id) || !process.env.STRIPE_SECRET_KEY?.trim()) return null;
  const r = await fetcher(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!r.ok) return null;
  return shopPaidFromSession((await r.json()) as Record<string, unknown>);
}

/* ---------- Comanda ---------- */

export type ShopOrderRow = typeof shopOrder.$inferSelect;
type Mailer = (o: ShopOrderRow, token: string, origin: string, model: ShopModel | null) => Promise<EmailResult>;
const findModel = (db: Pick<Db, "select">, slug: string, category?: string | null) => modelBySlug(db, slug, { category: categoryOf(category) }).catch(() => null);

/**
 * Trece comanda o singură dată pe sesiune Stripe și trimite emailul cu linkul. Întoarce comanda (nouă sau deja trecută) și tokenul.
 * O greșeală la email nu strică comanda: pagina de după plată arată linkul oricum și are butonul de retrimitere.
 */
export async function fulfilShopOrder(db: Db, paid: ShopPaid, origin: string, now = new Date(), mailer: Mailer = sendShopMail, buyerMailer: Mailer = sendBuyerMail) {
  const token = downloadToken(paid.id);
  const inserted = await db.insert(shopOrder).values({
    id: paid.id, email: paid.email, slug: paid.slug, locale: paid.locale, amount: paid.amount, currency: paid.currency,
    buyerEmail: paid.buyerEmail ?? null, giftToName: paid.giftToName ?? null, giftFrom: paid.giftFrom ?? null, giftNote: paid.giftNote ?? null,
    promo: paid.promo ?? null, category: paid.category ?? "invitatie", tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + LINK_DAYS * DAY), createdAt: now,
  }).onConflictDoNothing().returning();
  const order = inserted[0] ?? (await orderBySession(db, paid.id));
  if (inserted[0]) {
    const sent = await mailer(inserted[0], token, origin, await findModel(db, paid.slug, paid.category)).catch((e) => { console.error("invitatii-nunta email", e instanceof Error ? e.name : "Error"); return { ok: false } as const; });
    if ("ok" in sent && sent.ok) await db.update(shopOrder).set({ emailsSent: 1, lastEmailAt: now }).where(eq(shopOrder.id, paid.id));
    // La un dar, cel care a plătit primește și el un rând: unde a plecat linkul, cu linkul, dacă vrea să-l trimită și el.
    if (inserted[0].buyerEmail) await buyerMailer(inserted[0], token, origin, await findModel(db, paid.slug, paid.category)).catch((e) => console.error("invitatii-nunta email cumparator", e instanceof Error ? e.name : "Error"));
  }
  return { created: !!inserted[0], order: order!, token };
}

export async function orderBySession(db: Pick<Db, "select">, id: string): Promise<ShopOrderRow | null> {
  const [o] = await db.select().from(shopOrder).where(eq(shopOrder.id, id));
  return o ?? null;
}

/** Comanda unui token: `expired` dacă au trecut cele 30 de zile. Compararea hash-urilor e în timp constant. */
export async function orderByToken(db: Pick<Db, "select">, token: string, now = new Date()): Promise<{ order: ShopOrderRow; expired: boolean } | null> {
  if (!TOKEN_RE.test(token)) return null;
  const h = hashToken(token);
  const [o] = await db.select().from(shopOrder).where(eq(shopOrder.tokenHash, h));
  if (!o || !timingSafeEqual(Buffer.from(o.tokenHash), Buffer.from(h))) return null;
  return { order: o, expired: o.expiresAt.getTime() <= now.getTime() };
}

export async function countDownload(db: Db, id: string) {
  await db.update(shopOrder).set({ downloads: sql`${shopOrder.downloads} + 1` }).where(eq(shopOrder.id, id));
}

/** Emailul cu linkul de descărcare, în limba paginii de pe care s-a cumpărat (cu textele categoriei comenzii). */
export async function sendShopMail(o: ShopOrderRow, token: string, origin: string, model: ShopModel | null): Promise<EmailResult> {
  const locale: Locale = isLocale(o.locale) ? o.locale : "ro";
  const category = categoryOf(o.category);
  const t = categoryText(category, locale);
  const tm = model ? modelText(model, locale) ?? modelText(model, "ro") : null;
  const name = tm?.name ?? o.slug;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(o.expiresAt);
  const op = operator();
  const gift = !!o.buyerEmail;
  const { html, text } = renderMail([
    ...(gift ? [
      { p: o.giftToName ? fill(t.mailGiftHello, { name: o.giftToName }) : t.mailHello },
      { p: fill(t.mailGiftBody, { from: o.giftFrom || t.giftSomeone, name }) },
      ...(o.giftNote ? [{ p: t.mailGiftNote }, { p: `„${o.giftNote}”` }] : []),
    ] : [
      { p: t.mailHello },
      { p: fill(t.mailBody, { name }) },
    ]),
    { rows: [[t.mailWhat, tm?.title ?? o.slug], [t.mailAmount, formatPaid(o.amount, o.currency, locale)]] },
    { button: t.mailButton, href: downloadUrl(origin, token, category) },
    { p: fill(t.mailValid, { date }) },
    { p: t.mailHelp },
    { p: t.blessing },
  ], `${op.name}, CUI ${op.cui}`);
  return sendEmail({ to: o.email, subject: fill(gift ? t.mailGiftSubject : t.mailSubject, { name }), html, text, replyTo: siteInbox(),
    idempotencyKey: `${SHOP_CATEGORIES[category].kind}/${o.id}/${o.emailsSent}`, tag: SHOP_CATEGORIES[category].kind });
}

/** La un dar: confirmarea pentru cel care a plătit (unde a plecat linkul, plus linkul). Chitanța o trimite Stripe. */
export async function sendBuyerMail(o: ShopOrderRow, token: string, origin: string, model: ShopModel | null): Promise<EmailResult> {
  const locale: Locale = isLocale(o.locale) ? o.locale : "ro";
  const category = categoryOf(o.category);
  const t = categoryText(category, locale);
  const tm = model ? modelText(model, locale) ?? modelText(model, "ro") : null;
  const name = tm?.name ?? o.slug;
  const op = operator();
  const { html, text } = renderMail([
    { p: t.mailHello },
    { p: fill(t.mailBuyerBody, { email: o.email }) },
    { button: t.mailButton, href: downloadUrl(origin, token, category) },
    { p: t.blessing },
  ], `${op.name}, CUI ${op.cui}`);
  return sendEmail({ to: o.buyerEmail!, subject: fill(t.mailBuyerSubject, { name }), html, text, replyTo: siteInbox(),
    idempotencyKey: `${SHOP_CATEGORIES[category].kind}/${o.id}/cumparator`, tag: SHOP_CATEGORIES[category].kind });
}

/** Cel mult atâtea emailuri pe comandă, la cel puțin un minut unul de altul. */
export const MAX_EMAILS = 5;
const RESEND_GAP_MS = 60_000;

/** „Retrimite emailul” de pe pagina de după plată. */
export async function resendShopMail(db: Db, sessionId: string, origin: string, now = new Date(), mailer: Mailer = sendShopMail): Promise<"ok" | "limit" | "missing" | "expired" | "error"> {
  const o = await orderBySession(db, sessionId);
  if (!o) return "missing";
  if (o.expiresAt.getTime() <= now.getTime()) return "expired";
  if (o.emailsSent >= MAX_EMAILS || (o.lastEmailAt && now.getTime() - o.lastEmailAt.getTime() < RESEND_GAP_MS)) return "limit";
  const r = await mailer(o, downloadToken(o.id), origin, await findModel(db, o.slug, o.category)).catch(() => ({ ok: false }) as const);
  if (!("ok" in r) || !r.ok) return "error";
  await db.update(shopOrder).set({ emailsSent: o.emailsSent + 1, lastEmailAt: now }).where(eq(shopOrder.id, o.id));
  return "ok";
}

/** Ultimele comenzi ale unei categorii, pentru Admin → Invitații de nuntă / Accesorii nuntă / Jurnale (fără tokenuri). */
export async function recentOrders(db: Pick<Db, "select">, limit = 100, category: ShopCategory = "invitatie") {
  return db.select({ id: shopOrder.id, email: shopOrder.email, slug: shopOrder.slug, locale: shopOrder.locale, amount: shopOrder.amount, currency: shopOrder.currency,
    createdAt: shopOrder.createdAt, expiresAt: shopOrder.expiresAt, emailsSent: shopOrder.emailsSent, downloads: shopOrder.downloads })
    .from(shopOrder).where(eq(shopOrder.category, category)).orderBy(desc(shopOrder.createdAt)).limit(limit);
}
