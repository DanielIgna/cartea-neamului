import type { Surname } from "./nume";
import { nameQuality } from "./nume-extra";

/**
 * Pragul de indexare (Daniel, 14.11.2026, „vreau să fie corect indexată”): o pagină intră în Google doar dacă are destul conținut
 * propriu. Paginile de sub prag rămân deschise oamenilor (și legate din site), dar au „noindex, follow” și nu intră în sitemap,
 * ca Google să nu vadă pagini subțiri sau aproape la fel (asta trage în jos tot site-ul). Admin → SEO → Indexare le arată.
 */
/**
 * Pragul pentru paginile de nume (planul SEO, etapa 4, 18.11.2026): cuvintele proprii se numără cu scorul de calitate
 * (src/lib/seo/quality.ts), adică fără frazele care se repetă pe alte pagini de nume cu alt nume în ele. Ținta din plan e 400;
 * pragul de acum lasă în Google doar paginile cu conținut real și urcă pe măsură ce numele primesc text scris anume.
 */
export const NAME_MIN_WORDS = 100;

/** Cuvintele proprii ale paginii de nume (fără frazele comune). */
export const nameOwnWords = (n: Surname) => nameQuality(n).own;

/** null = indexabilă; altfel motivul. */
export function nameGate(n: Surname): string | null {
  const q = nameQuality(n);
  return q.own < NAME_MIN_WORDS ? `doar ${q.own} cuvinte proprii (pragul e ${NAME_MIN_WORDS}, ținta 400); ${q.commonPct}% din text e comun cu alte pagini de nume` : null;
}

/**
 * Localitățile (/localitati/<județ>/<localitate>): fiecare are populația, satele, vecinii și distanțele ei, dar o comună cu un
 * singur sat și puțini locuitori are prea puține lucruri proprii ca să merite o pagină în Google. Când va avea o istorie scrisă
 * anume, pragul se poate coborî.
 */
export const UAT_MIN_POP_SINGLE_VILLAGE = 2000;
/** Calitatea: o comună cu un singur sat și puțini locuitori nu intră niciodată (până primește text propriu). */
export function uatThin(u: { kind: string; pop: number; villages: unknown[] }): string | null {
  if (u.kind !== "c" || u.villages.length > 1 || u.pop >= UAT_MIN_POP_SINGLE_VILLAGE) return null;
  return `comună cu un singur sat și ${u.pop} locuitori (pragul e ${UAT_MIN_POP_SINGLE_VILLAGE} sau mai multe sate)`;
}
/**
 * Ritmul (Daniel, 14.11.2026: „începe cu 50 de pagini pe zi”): municipiile și orașele intră în Google de la început; comunele
 * intră pe rând, prin motorul de publicare, ca Google să nu primească dintr-odată mii de pagini noi. Până atunci au noindex.
 */
export function uatGate(u: { kind: string; pop: number; villages: unknown[] }, published?: (u: never) => boolean): string | null {
  if (u.kind !== "c") return null;
  // Etapa 3 (17.11.2026): și comunele mici cu un singur sat intră în coadă; le publică motorul doar dacă trec controlul de
  // calitate (cuvinte unice, date proprii, asemănare cu vecinii), deci rămân noindex cât timp n-au destul text propriu.
  if (published?.(u as never)) return null;
  return uatThin(u) ?? "în coada de publicare (intră în Google pe rând, câteva zeci pe zi)";
}
