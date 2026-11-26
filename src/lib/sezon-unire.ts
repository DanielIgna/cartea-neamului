/**
 * Marea Unire pe prima pagină (Daniel, 26.11.2026): în zilele dinaintea lui 1 Decembrie, bannerul arată întâi două desene
 * despre Unire (mulțimea cu drapele la Alba Iulia, trenul cu drapele), apoi pozele obișnuite, iar sub banner apare legătura
 * spre seria de articole. În fiecare an, de la 26 noiembrie până la 3 decembrie inclusiv (ora României); după aceea pagina
 * revine singură la pozele alese în Admin → Poze prima pagină. Doar pe română.
 */
export const UNIRE_START = { month: 11, day: 26 };
export const UNIRE_END = { month: 12, day: 3 };

/** Luna și ziua de azi la București. */
function bucharestMonthDay(now: Date): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", month: "numeric", day: "numeric" }).formatToParts(now);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { month: n("month"), day: n("day") };
}

export function inUnireSeason(now = new Date()): boolean {
  const { month, day } = bucharestMonthDay(now);
  const v = month * 100 + day;
  return v >= UNIRE_START.month * 100 + UNIRE_START.day && v <= UNIRE_END.month * 100 + UNIRE_END.day;
}

/** Desenele bannerului (făcute de noi, fără drepturi de autor ale altcuiva). */
export const UNIRE_BANNER = [
  "/home/unire/marea-unire-1918-multime-drapele-alba-iulia.jpg",
  "/home/unire/marea-unire-1918-tren-cu-drapele-spre-alba-iulia.jpg",
];

/** Seria „Marea Unire 1918” din ghiduri, în ordinea de citire. */
export const UNIRE_SERIES = [
  "arad-1918-drumul-spre-alba-iulia",
  "alba-iulia-1-decembrie-1918-oamenii",
  "delegati-alba-iulia-1918",
  "basarabia-bucovina-1918",
  "cum-sarbatoreau-bunicii-1-decembrie",
  "radacini-din-1918-ghid",
];
