import type { Surname } from "./nume";

/**
 * Pragul de indexare (Daniel, 14.11.2026, „vreau să fie corect indexată”): o pagină intră în Google doar dacă are destul conținut
 * propriu. Paginile de sub prag rămân deschise oamenilor (și legate din site), dar au „noindex, follow” și nu intră în sitemap,
 * ca Google să nu vadă pagini subțiri sau aproape la fel (asta trage în jos tot site-ul). Admin → SEO → Indexare le arată.
 */
export const NAME_MIN_WORDS = 8;

const words = (s: string | undefined) => (s ? s.replace(/[*_]/g, "").split(/\s+/).filter(Boolean).length : 0);

/** Cuvintele scrise anume pentru acest nume (sensul și nota), fără textul comun tuturor paginilor de nume. */
export const nameOwnWords = (n: Surname) => words(n.meaning) + words(n.note);

/** null = indexabilă; altfel motivul. */
export function nameGate(n: Surname): string | null {
  const w = nameOwnWords(n);
  return w < NAME_MIN_WORDS ? `doar ${w} cuvinte proprii (pragul e ${NAME_MIN_WORDS}); restul paginii e text comun` : null;
}
