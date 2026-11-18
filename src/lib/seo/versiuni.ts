import VERSIONS from "@/data/seo-versiuni.json";

/**
 * Data ultimei schimbări reale a fiecărei pagini din sitemap („lastmod”), din src/data/seo-versiuni.json: adresa → „amprentă dată”.
 * Fișierul îl scrie scripts/seo-versiuni.ts, care schimbă data unei pagini doar când i se schimbă conținutul (vezi
 * src/lib/seo/amprente.ts); tests/seo-versiuni.test.ts pică dacă cineva a schimbat o pagină și n-a rulat scriptul.
 * Pe site nu se calculează nimic: doar se citește data. O adresă care lipsește din fișier primește data dată de pagină.
 */
const MAP = VERSIONS as Record<string, string>;

export function lastmodOf(path: string, fallback: Date): Date {
  const v = MAP[path];
  if (!v) return fallback;
  const d = new Date(`${v.split(" ")[1]}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export const versionEntries = () => MAP;
