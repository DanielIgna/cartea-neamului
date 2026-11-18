/**
 * Calendarul sezonier al paginilor de cadouri (planul SEO, 18.11.2026). Paginile rămân publicate tot anul, la aceeași adresă;
 * în fereastra sezonului lor sunt scoase în față (primele în hubul /cadouri). Totul după ora României.
 * - Crăciun: 15 octombrie – 25 decembrie;
 * - 1 și 8 Martie: cu 5 săptămâni înainte;
 * - Paște (ortodox): cu 5 săptămâni înainte;
 * - Ziua Mamei (prima duminică din mai) și Ziua Tatălui (a doua duminică din mai, Legea 319/2009): din 1 aprilie;
 * - Ziua Bunicilor: iunie – iulie;
 * - început de an școlar: august – octombrie.
 * Fișier fără importuri de pe server.
 */
export type SeasonKey = "craciun" | "martie" | "paste" | "ziua-mamei" | "ziua-tatalui" | "ziua-bunicilor" | "scoala";

const DAY = 86_400_000;
/** Data de azi în România, ca dată UTC la miezul nopții (ca să comparăm doar zilele). */
function roToday(now: Date): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

/** Paștele ortodox (calendarul iulian, mutat în cel gregorian: +13 zile între 1900 și 2099). */
export function orthodoxEaster(year: number): Date {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  return new Date(utc(year, month, day).getTime() + 13 * DAY);
}

/** A n-a duminică dintr-o lună. */
function nthSunday(year: number, month: number, n: number): Date {
  const first = utc(year, month, 1);
  const offset = (7 - first.getUTCDay()) % 7;
  return utc(year, month, 1 + offset + 7 * (n - 1));
}

function windowOf(key: SeasonKey, year: number): [Date, Date] {
  switch (key) {
    case "craciun": return [utc(year, 10, 15), utc(year, 12, 25)];
    case "martie": return [new Date(utc(year, 3, 1).getTime() - 35 * DAY), utc(year, 3, 8)];
    case "paste": { const e = orthodoxEaster(year); return [new Date(e.getTime() - 35 * DAY), e]; }
    case "ziua-mamei": return [utc(year, 4, 1), nthSunday(year, 5, 1)];
    case "ziua-tatalui": return [utc(year, 4, 1), nthSunday(year, 5, 2)];
    case "ziua-bunicilor": return [utc(year, 6, 1), utc(year, 7, 31)];
    case "scoala": return [utc(year, 8, 1), utc(year, 10, 31)];
  }
}

export function inSeason(key: SeasonKey, now = new Date()): boolean {
  const t = roToday(now).getTime();
  const [a, b] = windowOf(key, roToday(now).getUTCFullYear());
  return t >= a.getTime() && t <= b.getTime();
}

/** Cât mai e până la sfârșitul sezonului (zile), sau null dacă nu e în sezon: cel mai apropiat iese primul. */
export function daysLeft(key: SeasonKey, now = new Date()): number | null {
  if (!inSeason(key, now)) return null;
  const [, b] = windowOf(key, roToday(now).getUTCFullYear());
  return Math.round((b.getTime() - roToday(now).getTime()) / DAY);
}

/** Ordinea în hub: întâi ce e în sezon (cel mai apropiat primul), apoi restul, în ordinea dată. */
export function seasonalOrder<T extends { key?: SeasonKey | null }>(items: T[], now = new Date()): T[] {
  const left = (x: T) => (x.key ? daysLeft(x.key, now) : null);
  return items.map((x, i) => ({ x, i, d: left(x) }))
    .sort((p, q) => (p.d === null ? 1 : 0) - (q.d === null ? 1 : 0) || (p.d ?? 0) - (q.d ?? 0) || p.i - q.i)
    .map((y) => y.x);
}
