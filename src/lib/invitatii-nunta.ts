import type { Locale } from "@/i18n/locales";
import { SHOP_TEXT, type ShopText } from "./invitatii-nunta-texte";

/**
 * Rubrica „Invitații de nuntă” (Daniel, 27.11.2026): invitații digitale cu motive populare din regiunile României, vândute
 * fără cont (src/lib/invitatii-nunta-server.ts). Catalogul e static: un model nou se adaugă doar aici (slug, poze, cheia ZIP-ului
 * din storage, prețul) și în textele lui din invitatii-nunta-texte.ts (`models.<slug>`), apoi se urcă ZIP-ul cu
 * scripts/incarca-invitatie-nunta.ts. Paginile, sitemap-ul, hreflang-ul și plata îl preiau singure.
 * (Fișier fără importuri de pe server: îl folosesc și public-pages.ts și middleware-ul.)
 */
export const SHOP_PATH = "/invitatii-nunta";
/** Pagina de după plată (privată, noindex). Nu poate fi slug de model. */
export const SHOP_DONE_PATH = `${SHOP_PATH}/gata`;
/** Tipul plății în metadata Stripe: webhook-ul îl tratează separat, înainte de plățile contului (paidSession). */
export const SHOP_KIND = "invitatie-nunta";
/** Linkul de descărcare e valabil 30 de zile de la plată. */
export const LINK_DAYS = 30;

export type ShopImage = { src: string; width: number; height: number; kind: "mockup" | "crem" | "intunecat" };
export type ShopModel = {
  slug: string;
  /** Cheia ZIP-ului în storage-ul privat (niciodată în /public). */
  zipKey: string;
  /** Numele fișierului primit de client. */
  zipName: string;
  /** Prețul: lei pe pagina în română, euro în celelalte limbi. */
  priceLei: number;
  priceEur: number;
  images: ShopImage[];
  /** Data la care a apărut modelul (pentru sitemap și JSON-LD). */
  since: string;
};

export const SHOP_MODELS: ShopModel[] = [
  {
    slug: "maramures",
    zipKey: "magazin/invitatii-nunta/maramures.zip",
    zipName: "invitatie-nunta-maramures.zip",
    priceLei: 45,
    priceEur: 9,
    images: [
      { src: "/invitatii-nunta/maramures-mockup.webp", width: 1400, height: 1120, kind: "mockup" },
      { src: "/invitatii-nunta/maramures-crem.webp", width: 600, height: 840, kind: "crem" },
      { src: "/invitatii-nunta/maramures-intunecat.webp", width: 600, height: 840, kind: "intunecat" },
    ],
    since: "2026-11-27",
  },
];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const modelBySlug = (slug: unknown): ShopModel | null =>
  typeof slug === "string" && SLUG.test(slug) ? SHOP_MODELS.find((m) => m.slug === slug) ?? null : null;
export const modelPath = (m: Pick<ShopModel, "slug">) => `${SHOP_PATH}/${m.slug}`;

/** Textele rubricii într-o limbă (engleza americană = cea britanică). */
export const shopText = (locale: Locale): ShopText => SHOP_TEXT[locale === "en-US" ? "en-GB" : locale] ?? SHOP_TEXT["en-GB"];
/** Textele unui model într-o limbă. */
export const modelText = (m: Pick<ShopModel, "slug">, locale: Locale) => shopText(locale).models[m.slug as keyof ShopText["models"]];

/** „{name}” → valoarea dată. */
export const fill = (s: string, v: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

/**
 * Prețul unui model, socotit doar pe server din catalog: 45 lei pentru româna, 9 € pentru celelalte limbi. Suma e în unitatea
 * mică (bani / cenți), cum o cere Stripe; eticheta e scrisă cum se scrie în limba omului.
 */
export function shopPrice(m: Pick<ShopModel, "priceLei" | "priceEur">, locale: Locale) {
  const lei = locale === "ro";
  const v = lei ? m.priceLei : m.priceEur;
  const d = Number.isInteger(v) ? 0 : 2;
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  return { value: v, amount: Math.round(v * 100), currency: lei ? ("ron" as const) : ("eur" as const), label: lei ? `${n} lei` : `${n} €` };
}
