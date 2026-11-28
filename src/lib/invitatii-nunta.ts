import type { Locale } from "@/i18n/locales";
import { SHOP_TEXT, type ShopText } from "./invitatii-nunta-texte";

/**
 * Rubrica „Invitații de nuntă” (Daniel, 27.11.2026): invitații digitale cu motive populare din regiunile României, vândute
 * fără cont (src/lib/invitatii-nunta-server.ts). Modelele stau în baza de date (tabelul shop_product) și se adaugă, se schimbă,
 * se publică și se retrag din Admin → Invitații de nuntă (src/lib/invitatii-nunta-produse.ts); paginile, sitemap-ul, hreflang-ul,
 * plata, webhook-ul și emailul le citesc de acolo.
 * (Fișier fără importuri de pe server: îl folosesc și public-pages.ts, middleware-ul și paginile din browser.)
 */
export const SHOP_PATH = "/invitatii-nunta";
/** Pagina de după plată (privată, noindex). Nu poate fi slug de model. */
export const SHOP_DONE_PATH = `${SHOP_PATH}/gata`;
/** Tipul plății în metadata Stripe: webhook-ul îl tratează separat, înainte de plățile contului (paidSession). */
export const SHOP_KIND = "invitatie-nunta";
/** Linkul de descărcare e valabil 30 de zile de la plată. */
export const LINK_DAYS = 30;
/** Unde stau fișierele în storage-ul privat: ZIP-ul fiecărui model e `magazin/invitatii-nunta/<slug>.zip`. */
export const SHOP_STORAGE = "magazin/invitatii-nunta";
export const zipKeyFor = (slug: string) => `${SHOP_STORAGE}/${slug}.zip`;
/** Pozele de prezentare urcate din Admin (publice, servite de /poze-invitatii/<fișier>). */
export const PHOTO_PREFIX = `${SHOP_STORAGE}/poze/`;
export const PHOTO_ROUTE = "/poze-invitatii";
export const PHOTO_FILE = /^[a-z0-9-]{1,80}-[0-9a-f]{8}\.(webp|jpg|png)$/;

/** Slugurile care nu pot fi modele (adrese ale rubricii). */
export const RESERVED_SLUGS = ["gata", "nou", "poze"];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isModelSlug = (s: unknown): s is string => typeof s === "string" && s.length <= 60 && SLUG_RE.test(s) && !RESERVED_SLUGS.includes(s);
/** /invitatii-nunta/<slug>: pagina unui model (publică pentru middleware; pagina însăși dă 404 dacă modelul nu e publicat). */
export const isModelPath = (p: string) => p.startsWith(`${SHOP_PATH}/`) && isModelSlug(p.slice(SHOP_PATH.length + 1));

/* ---------- Categoriile magazinului (Daniel, 28.11.2026) ---------- */

/**
 * Magazinul digital fără cont are trei categorii, în același tabel (shop_product), cu aceeași plată Stripe, același email și
 * aceeași descărcare: invitațiile de nuntă (neschimbate), accesoriile de nuntă pe regiuni și jurnalele de familie. Fiecare are
 * adresa ei, pagina de după plată, locul în storage, comutatorul din Admin și felul plății în metadata Stripe. Codurile de reducere
 * merg doar la invitații (produsul fix STRIPE_INVITATII_PRODUCT); celelalte categorii nu primesc câmpul de cod pe pagina Stripe.
 */
export type ShopCategory = "invitatie" | "accesorii" | "jurnal";
export type CategoryInfo = {
  key: ShopCategory;
  /** Adresa listei (/accesorii-nunta); produsul e la <path>/<slug>, pagina de după plată la <path>/gata. */
  path: string;
  /** Felul plății în metadata Stripe (webhook-ul îl recunoaște). */
  kind: string;
  /** Locul fișierelor private în storage. */
  storage: string;
  admin: string;
  /** Cheia comutatorului din Admin (app_setting). */
  switchKey: string;
  /** Numele în Admin. */
  adminLabel: string;
  adminItem: string;
  /** Ce fișier se urcă: doar ZIP sau ZIP ori PDF. */
  file: "zip" | "zip-pdf";
  /** Formatele de bifat în Admin. */
  formats: Record<string, string>;
  /** Ce poate conține produsul (de bifat în Admin), cu numele în română; textele publice sunt în magazin-texte.ts. */
  parts: Record<string, string>;
  /** Codurile de reducere create în Stripe pentru invitații merg aici? */
  promoCodes: boolean;
  /** Numele fișierului primit de client, fără extensie. */
  fileName: (slug: string) => string;
  /** Categoria din schema Product (Google). */
  schemaCategory: string;
};

export const SHOP_CATEGORIES: Record<ShopCategory, CategoryInfo> = {
  invitatie: {
    key: "invitatie", path: "/invitatii-nunta", kind: "invitatie-nunta", storage: "magazin/invitatii-nunta", admin: "/admin/invitatii-nunta",
    switchKey: "invitatii_nunta", adminLabel: "Invitații de nuntă", adminItem: "model", file: "zip",
    formats: { "5x7": "5×7 inch", A5: "A5", A6: "A6", "4x6": "4×6 inch" }, parts: {}, promoCodes: true,
    fileName: (slug) => `invitatie-nunta-${slug}`, schemaCategory: "Wedding invitations",
  },
  accesorii: {
    key: "accesorii", path: "/accesorii-nunta", kind: "accesorii-nunta", storage: "magazin/accesorii-nunta", admin: "/admin/accesorii-nunta",
    switchKey: "accesorii_nunta", adminLabel: "Accesorii nuntă", adminItem: "set", file: "zip",
    formats: { A4: "A4", A5: "A5", A6: "A6", "5x7": "5×7 inch", "4x6": "4×6 inch", "10x15": "10×15 cm" },
    parts: { meniu: "Meniu", "carduri-loc": "Carduri de loc", "save-the-date": "Save the date", multumire: "Carduri de mulțumire", "numere-masa": "Numere de masă" },
    promoCodes: false, fileName: (slug) => `accesorii-nunta-${slug}`, schemaCategory: "Wedding stationery",
  },
  jurnal: {
    key: "jurnal", path: "/jurnale", kind: "jurnal-familie", storage: "magazin/jurnale", admin: "/admin/jurnale",
    switchKey: "jurnale", adminLabel: "Jurnale de familie", adminItem: "jurnal", file: "zip-pdf",
    formats: { A4: "A4", A5: "A5", Letter: "US Letter" },
    parts: { bunica: "Varianta pentru bunica", bunic: "Varianta pentru bunic" },
    promoCodes: false, fileName: (slug) => `jurnal-${slug}`, schemaCategory: "Family journals",
  },
};
export const CATEGORY_KEYS = Object.keys(SHOP_CATEGORIES) as ShopCategory[];
export const isCategory = (v: unknown): v is ShopCategory => typeof v === "string" && v in SHOP_CATEGORIES;
export const categoryOf = (v: unknown): ShopCategory => (isCategory(v) ? v : "invitatie");
export const categoryInfo = (c: unknown): CategoryInfo => SHOP_CATEGORIES[categoryOf(c)];
/** Categoria după felul plății din metadata Stripe, sau null dacă plata nu e a magazinului. */
export const categoryByKind = (kind: unknown): ShopCategory | null => CATEGORY_KEYS.find((c) => SHOP_CATEGORIES[c].kind === kind) ?? null;
export const doneSlugPath = (c: ShopCategory) => `${SHOP_CATEGORIES[c].path}/gata`;
/** Adresa unui produs din categoriile noi (/accesorii-nunta/<slug>, /jurnale/<slug>), pentru middleware și sitemap. */
export const isCategoryProductPath = (p: string) => (["accesorii", "jurnal"] as const).some((c) => {
  const base = `${SHOP_CATEGORIES[c].path}/`;
  return p.startsWith(base) && isModelSlug(p.slice(base.length));
});
/** Cheia fișierului privat al unui produs: ZIP-ul (sau, la jurnale, PDF-ul) la <storage>/<slug>.<ext>. */
export const productFileKey = (c: ShopCategory, slug: string, ext: "zip" | "pdf" = "zip") => `${SHOP_CATEGORIES[c].storage}/${slug}.${ext}`;
/** Regiunea ca slug („Țara Hațegului” → „tara-hategului”), ca să se potrivească invitația cu setul de accesorii. */
export const regionKey = (m: { region: string; slug: string }) => slugify(m.region || m.slug);

/** Limbile site-ului în care se pot scrie textele unui model (engleza americană o folosește pe cea britanică). */
export type TextLocale = Exclude<Locale, "en-US">;
export const textKey = (l: Locale): TextLocale => (l === "en-US" ? "en-GB" : l);

/** Textele unui model într-o limbă; româna e obligatorie, celelalte limbi sunt opționale. */
export type ProductText = {
  name: string;
  /** Titlul paginii (H1); gol = numele. */
  title?: string;
  /** Descrierea scurtă (sub titlu și pe listă). */
  tagline: string;
  /** Descrierea lungă. */
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Variantele de culoare, separate prin „;”. */
  colors?: string;
};
export type ShopImage = { src: string; width: number; height: number; key?: string };
export type ProductStatus = "draft" | "published" | "archived";

/** Un model, cum îl folosesc paginile (din rândul shop_product). */
export type ShopModel = {
  id: string;
  /** Categoria (lipsă = invitație). */
  category?: ShopCategory;
  /** Ce conține produsul (cheile din SHOP_CATEGORIES[…].parts). */
  parts?: string[];
  slug: string;
  region: string;
  status: ProductStatus;
  texts: Partial<Record<TextLocale, ProductText>>;
  /** Limbile din fișierele invitației (ro, en, it…). */
  languages: string[];
  formats: string[];
  /** Prețul, în lei și în euro (numere întregi sau cu zecimale). */
  priceLei: number;
  priceEur: number;
  images: ShopImage[];
  zipKey: string | null;
  zipName: string | null;
  updatedAt: Date;
};

/** Limbile invitației pe care le poate bifa Daniel în Admin (codurile ISO). */
export const INVITATION_LANGS = ["ro", "en", "it", "es", "de", "fr", "hu"] as const;
/** Formatele de bifat în Admin, cu eticheta lor. */
export const FORMATS: Record<string, string> = { "5x7": "5×7 inch", A5: "A5", A6: "A6", "4x6": "4×6 inch" };

export const modelPath = (m: Pick<ShopModel, "slug"> & { category?: ShopCategory }) => `${SHOP_CATEGORIES[m.category ?? "invitatie"].path}/${m.slug}`;

/** Textele rubricii într-o limbă (engleza americană = cea britanică). */
export const shopText = (locale: Locale): ShopText => SHOP_TEXT[textKey(locale)] ?? SHOP_TEXT["en-GB"];

/** Textele unui model în limba dată, sau `null` dacă nu e scris în ea. */
export function modelText(m: Pick<ShopModel, "texts">, locale: Locale): (ProductText & { title: string; metaTitle: string; metaDescription: string }) | null {
  const t = m.texts[textKey(locale)];
  if (!t?.name?.trim() || !t.description?.trim()) return null;
  const title = t.title?.trim() || t.name;
  return { ...t, title, metaTitle: t.metaTitle?.trim() || title, metaDescription: t.metaDescription?.trim() || t.tagline || t.description.slice(0, 155) };
}

/** Limbile site-ului în care modelul are pagină (cele cu text; engleza britanică aduce și pe cea americană). */
export function modelLocales(m: Pick<ShopModel, "texts">, all: readonly Locale[]): Locale[] {
  return all.filter((l) => modelText(m, l) !== null);
}

/** „{name}” → valoarea dată. */
export const fill = (s: string, v: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

/**
 * Prețul unui model, socotit doar pe server din baza de date: lei pentru româna, euro pentru celelalte limbi. Suma e în unitatea
 * mică (bani / cenți), cum o cere Stripe; eticheta e scrisă cum se scrie în limba omului.
 */
export function shopPrice(m: Pick<ShopModel, "priceLei" | "priceEur">, locale: Locale) {
  const lei = locale === "ro";
  const v = lei ? m.priceLei : m.priceEur;
  const d = Number.isInteger(v) ? 0 : 2;
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  return { value: v, amount: Math.round(v * 100), currency: lei ? ("ron" as const) : ("eur" as const), label: lei ? `${n} lei` : `${n} €` };
}

/** Slugul din nume: fără diacritice, litere mici, cratime („Țara Hațegului” → „tara-hategului”). */
export function slugify(name: string): string {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
}

/** Ce lipsește ca un model să poată fi publicat (gol = se poate). */
export function publishProblems(m: Pick<ShopModel, "texts" | "images" | "zipKey" | "priceLei" | "priceEur">): string[] {
  const out: string[] = [];
  if (!m.zipKey) out.push("Lipsește fișierul ZIP.");
  if (!m.images.length) out.push("Lipsește cel puțin o poză de prezentare.");
  if (!modelText(m, "ro")) out.push("Lipsesc numele sau descrierea lungă în română.");
  if (!(m.priceLei > 0) || !(m.priceEur > 0)) out.push("Prețul trebuie să fie mai mare decât zero.");
  return out;
}
