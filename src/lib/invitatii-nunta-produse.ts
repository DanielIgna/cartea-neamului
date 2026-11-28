/**
 * Modelele de invitații de nuntă, în baza de date (tabelul shop_product), scrise din Admin → Invitații de nuntă (Daniel,
 * 27.11.2026): lista, adăugarea și schimbarea unui model, publicarea și retragerea, arhivarea și ștergerea, pozele și ZIP-ul.
 * Paginile publice, sitemap-ul, plata (prețul se ia mereu de aici, pe server), webhook-ul, emailul și descărcarea citesc tot de aici.
 * Reguli:
 * - un model se publică doar cu ZIP, cel puțin o poză și textele în română (publishProblems);
 * - retras = ciornă: dispare de pe site și din sitemap, dar comenzile plătite se descarcă în continuare;
 * - un model cu vânzări nu se șterge, doar se arhivează; slugul nu se mai schimbă după ce are ZIP sau vânzări.
 */
import { randomUUID } from "node:crypto";
import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { shopOrder, shopProduct } from "@/db/schema";
import { LOCALES } from "@/i18n/locales";
import {
  INVITATION_LANGS, SHOP_CATEGORIES, categoryOf, isCategory, isModelSlug, productFileKey, publishProblems, regionKey,
  type ProductStatus, type ProductText, type ShopCategory, type ShopImage, type ShopModel, type TextLocale,
} from "./invitatii-nunta";

type Row = typeof shopProduct.$inferSelect;
type Reader = Pick<Db, "select">;

/** Limbile în care se pot scrie textele unui model, în ordinea din Admin (româna prima). */
export const TEXT_LOCALES = LOCALES.filter((l): l is TextLocale => l !== "en-US");

const STATUSES: ProductStatus[] = ["draft", "published", "archived"];

export function toModel(r: Row): ShopModel {
  return {
    id: r.id, category: categoryOf(r.category), parts: Array.isArray(r.parts) ? (r.parts as string[]) : [], slug: r.slug, region: r.region,
    status: STATUSES.includes(r.status as ProductStatus) ? (r.status as ProductStatus) : "draft",
    texts: (r.texts ?? {}) as ShopModel["texts"],
    languages: Array.isArray(r.languages) ? (r.languages as string[]) : [],
    formats: Array.isArray(r.formats) ? (r.formats as string[]) : [],
    priceLei: r.priceRon / 100, priceEur: r.priceEur / 100,
    images: Array.isArray(r.images) ? (r.images as ShopImage[]) : [],
    zipKey: r.zipKey, zipName: r.zipName, updatedAt: r.updatedAt,
  };
}

/* ---------- Citirea (paginile publice, plata, emailul) ---------- */

/**
 * Modelele publicate ale unei categorii (implicit invitațiile), în ordinea din Admin. Dacă baza nu se poate citi (o copie de
 * probă fără bază), lista e goală.
 */
export async function publishedModels(db: Reader, category: ShopCategory = "invitatie"): Promise<ShopModel[]> {
  try {
    const rows = await db.select().from(shopProduct).where(and(eq(shopProduct.status, "published"), eq(shopProduct.category, category))).orderBy(asc(shopProduct.sort), asc(shopProduct.publishedAt));
    return rows.map(toModel);
  } catch (e) {
    console.error("invitatii-nunta modele", e instanceof Error ? e.name : "Error");
    return [];
  }
}

/** Un model după slug (în categoria lui, implicit invitațiile), în orice stare (pentru comenzile deja plătite) sau doar publicat. */
export async function modelBySlug(db: Reader, slug: unknown, o: { published?: boolean; category?: ShopCategory } = {}): Promise<ShopModel | null> {
  if (!isModelSlug(slug)) return null;
  const where = and(eq(shopProduct.slug, slug), eq(shopProduct.category, o.category ?? "invitatie"), ...(o.published ? [eq(shopProduct.status, "published")] : []));
  const [r] = await db.select().from(shopProduct).where(where);
  return r ? toModel(r) : null;
}

export const publishedModel = (db: Reader, slug: unknown, category: ShopCategory = "invitatie") => modelBySlug(db, slug, { published: true, category }).catch(() => null);

export async function productById(db: Reader, id: string): Promise<(ShopModel & { row: Row }) | null> {
  if (!/^[\w-]{1,80}$/.test(id)) return null;
  const [r] = await db.select().from(shopProduct).where(eq(shopProduct.id, id));
  return r ? { ...toModel(r), row: r } : null;
}

/** Câte comenzi are un model (după slug, în categoria lui). */
export async function salesOf(db: Reader, slug: string, category: ShopCategory = "invitatie"): Promise<number> {
  const [r] = await db.select({ n: count() }).from(shopOrder).where(and(eq(shopOrder.slug, slug), eq(shopOrder.category, category)));
  return Number(r?.n ?? 0);
}

/** Lista din Admin: toate modelele unei categorii, cu numărul de vânzări. */
export async function adminProducts(db: Reader, category: ShopCategory = "invitatie") {
  const rows = await db.select().from(shopProduct).where(eq(shopProduct.category, category)).orderBy(asc(shopProduct.sort), asc(shopProduct.createdAt));
  const sales = await db.select({ slug: shopOrder.slug, n: count() }).from(shopOrder).where(eq(shopOrder.category, category)).groupBy(shopOrder.slug);
  const by = new Map(sales.map((s) => [s.slug, Number(s.n)]));
  return rows.map((r) => ({ ...toModel(r), row: r, sales: by.get(r.slug) ?? 0 }));
}

/* ---------- Formularul din Admin ---------- */

export type ProductInput = {
  /** Lipsă = invitație. */
  category?: ShopCategory;
  /** Ce conține produsul (accesorii, jurnale). */
  parts?: string[];
  slug: string; region: string; sort: number;
  texts: Partial<Record<TextLocale, ProductText>>;
  languages: string[]; formats: string[];
  priceRon: number; priceEur: number;
};

const LIMITS: Record<keyof ProductText, number> = { name: 80, title: 140, tagline: 300, description: 5000, metaTitle: 80, metaDescription: 220, colors: 300 };
const FIELDS = Object.keys(LIMITS) as (keyof ProductText)[];
const LOCALE_NAME = (l: string) => new Intl.DisplayNames(["ro"], { type: "language" }).of(l === "en-GB" ? "en" : l) ?? l;

/** Prețul scris în formular („45”, „45,50”) → bani / cenți; null dacă nu e bun. */
export function parseMoney(v: unknown, max: number): number | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return null;
  const n = Math.round(Number(s) * 100);
  return n >= 100 && n <= max * 100 ? n : null;
}

const str = (form: FormData, k: string) => {
  const v = form.get(k);
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
};

/**
 * Formularul unui model → datele lui, sau o greșeală pe înțeles. Româna cere numele, descrierea scurtă și pe cea lungă; o altă
 * limbă se salvează doar dacă are ceva scris, și atunci cere aceleași trei.
 */
export function parseProductForm(form: FormData): { ok: true; value: ProductInput } | { ok: false; error: string } {
  const rawCat = form.get("category");
  if (rawCat !== null && !isCategory(rawCat)) return { ok: false, error: "Categoria nu e bună." };
  const category = categoryOf(rawCat);
  const cat = SHOP_CATEGORIES[category];
  const slug = str(form, "slug").toLowerCase();
  if (!isModelSlug(slug)) return { ok: false, error: "Slugul poate avea doar litere mici fără diacritice, cifre și cratime (de pildă „tara-hategului”), și nu poate fi „gata”, „nou” sau „poze”." };
  const region = str(form, "region").slice(0, 80);
  const priceRon = parseMoney(form.get("priceRon"), 10_000);
  const priceEur = parseMoney(form.get("priceEur"), 2_000);
  if (priceRon === null) return { ok: false, error: "Prețul în lei nu e bun (de pildă 45 sau 45,50)." };
  if (priceEur === null) return { ok: false, error: "Prețul în euro nu e bun (de pildă 9 sau 9,50)." };
  const texts: ProductInput["texts"] = {};
  for (const l of TEXT_LOCALES) {
    const t = Object.fromEntries(FIELDS.map((f) => [f, str(form, `t.${l}.${f}`)])) as Record<keyof ProductText, string>;
    const any = FIELDS.some((f) => t[f]);
    if (!any && l !== "ro") continue;
    for (const f of FIELDS) if (t[f].length > LIMITS[f]) return { ok: false, error: `${LOCALE_NAME(l)}: câmpul „${f}” are peste ${LIMITS[f]} de semne.` };
    if (!t.name || !t.tagline || !t.description) return { ok: false, error: `${l === "ro" ? "Română" : LOCALE_NAME(l)}: scrie numele, descrierea scurtă și descrierea lungă (sau lasă limba goală).` };
    texts[l] = Object.fromEntries(FIELDS.filter((f) => t[f]).map((f) => [f, t[f]])) as ProductText;
  }
  const languages = INVITATION_LANGS.filter((l) => form.getAll("languages").includes(l));
  const formats = Object.keys(cat.formats).filter((f) => form.getAll("formats").includes(f));
  const parts = Object.keys(cat.parts).filter((f) => form.getAll("parts").includes(f));
  const sort = Math.max(0, Math.min(9999, Math.round(Number(str(form, "sort") || "0")) || 0));
  // Invitațiile rămân exact ca înainte (fără categorie și părți în date); categoriile noi le au.
  const extra = category === "invitatie" ? {} : { category, parts };
  return { ok: true, value: { ...extra, slug, region, sort, texts, languages, formats, priceRon, priceEur } };
}

/* ---------- Scrierea ---------- */

type Result = { ok: true; id: string } | { ok: false; error: string };

async function slugTaken(db: Reader, slug: string, category: ShopCategory, exceptId?: string) {
  const same = and(eq(shopProduct.slug, slug), eq(shopProduct.category, category));
  const [r] = await db.select({ id: shopProduct.id }).from(shopProduct).where(exceptId ? and(same, ne(shopProduct.id, exceptId)) : same);
  return !!r;
}

/** Un model nou, ca ciornă. */
export async function createProduct(db: Db, v: ProductInput, now = new Date()): Promise<Result> {
  if (await slugTaken(db, v.slug, v.category ?? "invitatie")) return { ok: false, error: `Slugul „${v.slug}” e deja folosit de alt model.` };
  const id = randomUUID();
  await db.insert(shopProduct).values({ id, ...v, status: "draft", createdAt: now, updatedAt: now });
  return { ok: true, id };
}

/**
 * Schimbă un model. Slugul se poate schimba doar cât timp modelul n-are ZIP și nici vânzări (adresa și fișierul depind de el);
 * un model publicat rămâne publicat doar dacă are în continuare textele în română.
 */
export async function updateProduct(db: Db, id: string, v: ProductInput, now = new Date()): Promise<Result> {
  const p = await productById(db, id);
  if (!p) return { ok: false, error: "Modelul nu există." };
  // Categoria nu se schimbă din formular: un produs rămâne în categoria în care a fost creat.
  const cat = p.category ?? "invitatie";
  if ((v.category ?? "invitatie") !== cat) return { ok: false, error: "Produsul e în altă categorie." };
  if (v.slug !== p.slug) {
    if (p.zipKey || (await salesOf(db, p.slug, cat)) > 0) return { ok: false, error: "Slugul nu se mai poate schimba: modelul are deja fișier ZIP sau vânzări." };
    if (await slugTaken(db, v.slug, cat, id)) return { ok: false, error: `Slugul „${v.slug}” e deja folosit de alt model.` };
  }
  if (p.status === "published" && publishProblems({ ...p, texts: v.texts, priceLei: v.priceRon / 100, priceEur: v.priceEur / 100 }).length) {
    return { ok: false, error: "Modelul e publicat: păstrează numele și descrierile în română (sau retrage-l întâi)." };
  }
  await db.update(shopProduct).set({ ...v, updatedAt: now }).where(eq(shopProduct.id, id));
  return { ok: true, id };
}

/**
 * Publică / Retrage (înapoi la ciornă) / Arhivează. Publicarea cere ZIP, o poză și textele în română. Arhivat = scos de tot
 * din vânzare (folosit pentru modelele cu vânzări, care nu se pot șterge); se poate scoate din arhivă ca ciornă.
 */
export async function setProductStatus(db: Db, id: string, action: "publish" | "retract" | "archive", now = new Date()): Promise<Result> {
  const p = await productById(db, id);
  if (!p) return { ok: false, error: "Modelul nu există." };
  if (action === "publish") {
    const problems = publishProblems(p);
    if (problems.length) return { ok: false, error: `Nu se poate publica: ${problems.join(" ")}` };
    await db.update(shopProduct).set({ status: "published", publishedAt: p.row.publishedAt ?? now, updatedAt: now }).where(eq(shopProduct.id, id));
  } else {
    await db.update(shopProduct).set({ status: action === "archive" ? "archived" : "draft", updatedAt: now }).where(eq(shopProduct.id, id));
  }
  return { ok: true, id };
}

/**
 * Șterge un model, doar cu slugul scris din nou ca confirmare și doar dacă n-are nicio vânzare (altfel se arhivează). Se șterg
 * și fișierele lui din storage (ZIP-ul și pozele urcate); pozele din /public ale modelului inițial rămân.
 */
export async function deleteProduct(db: Db, id: string, confirm: string, remove: (keys: string[]) => Promise<unknown>): Promise<Result> {
  const p = await productById(db, id);
  if (!p) return { ok: false, error: "Modelul nu există." };
  if (confirm.trim() !== p.slug) return { ok: false, error: `Ca să ștergi, scrie exact slugul modelului: ${p.slug}` };
  if ((await salesOf(db, p.slug, p.category)) > 0) return { ok: false, error: "Modelul are vânzări, deci nu se șterge: arhivează-l (linkurile clienților merg mai departe)." };
  await db.delete(shopProduct).where(eq(shopProduct.id, id));
  await remove([p.zipKey, ...p.images.map((i) => i.key)].filter((k): k is string => !!k)).catch(() => {});
  return { ok: true, id };
}

/** Adaugă o poză urcată la sfârșitul listei (cel mult 12). */
export const MAX_IMAGES = 12;
export async function addImage(db: Db, id: string, img: ShopImage, now = new Date()): Promise<Result> {
  const p = await productById(db, id);
  if (!p) return { ok: false, error: "Modelul nu există." };
  if (p.images.length >= MAX_IMAGES) return { ok: false, error: `Un model are cel mult ${MAX_IMAGES} poze.` };
  await db.update(shopProduct).set({ images: [...p.images, img], updatedAt: now }).where(eq(shopProduct.id, id));
  return { ok: true, id };
}

/**
 * Noua ordine a pozelor (după `src`), din tragerea în Admin; o poză lăsată afară e ștearsă (și fișierul ei, dacă e urcat).
 * Un model publicat păstrează măcar o poză.
 */
export async function arrangeImages(db: Db, id: string, order: string[], remove: (keys: string[]) => Promise<unknown>, now = new Date()): Promise<Result> {
  const p = await productById(db, id);
  if (!p) return { ok: false, error: "Modelul nu există." };
  const by = new Map(p.images.map((i) => [i.src, i]));
  const next = [...new Set(order)].map((s) => by.get(s)).filter((i): i is ShopImage => !!i);
  if (!next.length && p.status === "published") return { ok: false, error: "Un model publicat trebuie să aibă măcar o poză." };
  const gone = p.images.filter((i) => !next.includes(i)).map((i) => i.key).filter((k): k is string => !!k);
  await db.update(shopProduct).set({ images: next, updatedAt: now }).where(eq(shopProduct.id, id));
  if (gone.length) await remove(gone).catch(() => {});
  return { ok: true, id };
}

/**
 * Fișierul nou al unui model (după verificare): aceeași cheie, versiunea crește; comenzile viitoare și linkurile active îl primesc.
 * `key` doar când fișierul își schimbă felul (la jurnale, un PDF în locul unui ZIP sau invers).
 */
export async function setProductZip(db: Db, id: string, z: { name: string; size: number; files: number; key?: string }, now = new Date()) {
  const p = await productById(db, id);
  if (!p) return null;
  const key = z.key ?? p.zipKey ?? productFileKey(p.category ?? "invitatie", p.slug);
  await db.update(shopProduct).set({
    zipKey: key, zipName: z.name, zipSize: z.size, zipFiles: z.files, zipVersion: sql`${shopProduct.zipVersion} + 1`, zipUpdatedAt: now, updatedAt: now,
  }).where(eq(shopProduct.id, id));
  return key;
}

/* ---------- Același set, pe regiuni (Daniel, 28.11.2026) ---------- */

/**
 * Produsul publicat dintr-o altă categorie care e din aceeași regiune (după regiune, sau după slug dacă regiunea e goală):
 * setul de accesorii pentru o invitație („Completează setul”) sau invitația pentru un set. Fără potrivire sau fără bază: null.
 */
export async function sameRegion(db: Reader, m: Pick<ShopModel, "region" | "slug">, category: ShopCategory): Promise<ShopModel | null> {
  const key = regionKey(m);
  if (!key) return null;
  const list = await publishedModels(db, category);
  return list.find((x) => regionKey(x) === key) ?? null;
}
