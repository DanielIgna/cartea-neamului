/**
 * Povestea vremurilor: în ce lume s-a născut cineva și ce a trăit, după anul și locul nașterii.
 * Totul e scris de mână, pe ținuturi istorice și pe epoci, fără inteligență artificială și fără costuri.
 * Ținuturile au avut istorii diferite până la 1918 (Ardealul sub Habsburgi și apoi sub Ungaria, Principatele sub turci,
 * Bucovina sub Austria, Basarabia sub Rusia, Dobrogea sub otomani), așa că și poveștile diferă.
 * Aici stau anii, ținuturile și felul fiecărui eveniment; cuvintele, în fiecare limbă, sunt în src/i18n/messages/vremuri/,
 * sub aceleași id-uri (partea „Vremuri” din texte).
 */
import type { roVremuri } from "@/i18n/messages/vremuri/ro";

type Words = (typeof roVremuri)["Vremuri"];
export type EraId = keyof Words["eras"];
export type EventId = keyof Words["events"];
/** Ținutul istoric din România (sau Basarabia), cu numele lui în fiecare limbă. */
export type Region = keyof Words["regions"];

/** Ținutul istoric, după județ (sau țară pentru cei născuți în afara României). */
export type Area = "ardeal" | "bucovina" | "regat" | "dobrogea" | "basarabia" | "lume";
export type Tone = "bine" | "greu" | "schimbare";
export type HistEvent = { id: EventId; year: number; to?: number; tone: Tone; areas: Area[]; counties?: string[]; weight?: 1 | 2 | 3 };
/** `own`: ținuturile cu povestea lor despre viața de atunci; celelalte o au pe cea comună („all”). */
export type Era = { id: EraId; from: number; to: number; own: Area[] };
/** Ce poveste despre viața de atunci se potrivește: a ținutului sau cea comună. */
export type LifeKey = Area | "all";
export type Origin = {
  area: Area;
  /** Ținutul din România (sau Basarabia): „transilvania”, „banat”, „moldova”. */
  region?: Region;
  /** Pentru cei născuți în altă țară: codul ei („IT”), ca s-o numim în limba cititorului. */
  cc?: string;
  /** Țara scrisă în fișă, când n-o recunoaștem. */
  country?: string;
  county?: string; // codul județului: „CJ”
  place: string; // cum e scris în fișă: „Huedin”
  /** Locul e luat de la o rudă apropiată, fiindcă fișa nu are locul nașterii. */
  guess?: string;
};

/** Județul de azi → ținutul istoric. Satu Mare și Bihorul au fost tot sub Ungaria, ca Ardealul. */
const COUNTY_REGION: Record<string, [Area, Region]> = {
  AB: ["ardeal", "transilvania"], BV: ["ardeal", "transilvania"], CJ: ["ardeal", "transilvania"], CV: ["ardeal", "transilvania"], HR: ["ardeal", "transilvania"],
  HD: ["ardeal", "transilvania"], MS: ["ardeal", "transilvania"], SB: ["ardeal", "transilvania"], SJ: ["ardeal", "transilvania"], BN: ["ardeal", "transilvania"],
  MM: ["ardeal", "maramures"], SM: ["ardeal", "satmar"], BH: ["ardeal", "crisana"], AR: ["ardeal", "crisana"], TM: ["ardeal", "banat"], CS: ["ardeal", "banat"],
  SV: ["bucovina", "bucovina"],
  BC: ["regat", "moldova"], BT: ["regat", "moldova"], GL: ["regat", "moldova"], IS: ["regat", "moldova"], NT: ["regat", "moldova"], VS: ["regat", "moldova"], VN: ["regat", "moldova"],
  AG: ["regat", "muntenia"], B: ["regat", "muntenia"], BR: ["regat", "muntenia"], BZ: ["regat", "muntenia"], CL: ["regat", "muntenia"], DB: ["regat", "muntenia"],
  GR: ["regat", "muntenia"], IL: ["regat", "muntenia"], IF: ["regat", "muntenia"], PH: ["regat", "muntenia"], TR: ["regat", "muntenia"],
  DJ: ["regat", "oltenia"], GJ: ["regat", "oltenia"], MH: ["regat", "oltenia"], OT: ["regat", "oltenia"], VL: ["regat", "oltenia"],
  CT: ["dobrogea", "dobrogea"], TL: ["dobrogea", "dobrogea"],
};
export function regionOfCounty(code: string | null | undefined): [Area, Region] | null {
  return code ? COUNTY_REGION[code] ?? null : null;
}
/** Ținutul pentru o țară (codul ei): Republica Moldova e Basarabia, restul e „lumea largă”. */
export function areaOfCountry(cc: string): Area | null {
  return cc === "RO" ? null : cc === "MD" ? "basarabia" : "lume";
}

/** Nordul Ardealului dat Ungariei în 1940 (județele care au fost în cea mai mare parte acolo). */
const NORD = ["CJ", "SJ", "BH", "SM", "MM", "BN", "MS", "HR", "CV"];
const MOLDOVA = ["BC", "BT", "GL", "IS", "NT", "VS", "VN", "SV"];
const RO: Area[] = ["ardeal", "bucovina", "regat", "dobrogea"];
const ALL: Area[] = [...RO, "basarabia"];
const WORLD: Area[] = [...ALL, "lume"];

export const ERAS: Era[] = [
  { id: "vechi", from: 0, to: 1699, own: ["ardeal", "lume"] },
  { id: "stapaniri", from: 1700, to: 1820, own: ["ardeal", "regat", "bucovina", "basarabia", "dobrogea", "lume"] },
  { id: "tudor", from: 1821, to: 1847, own: ["ardeal", "regat", "basarabia", "dobrogea", "bucovina", "lume"] },
  { id: "revolutia", from: 1848, to: 1866, own: ["ardeal", "regat", "bucovina", "basarabia", "dobrogea", "lume"] },
  { id: "inainte", from: 1867, to: 1913, own: ["ardeal", "regat", "bucovina", "basarabia", "dobrogea", "lume"] },
  { id: "razboi1", from: 1914, to: 1918, own: ["ardeal", "regat", "bucovina", "basarabia", "dobrogea", "lume"] },
  { id: "romaniaMare", from: 1919, to: 1939, own: ["ardeal", "basarabia", "dobrogea", "lume"] },
  { id: "razboi2", from: 1940, to: 1947, own: ["ardeal", "basarabia", "bucovina", "dobrogea", "lume"] },
  { id: "comunism", from: 1948, to: 1964, own: ["ardeal", "basarabia", "lume"] },
  { id: "ceausescu", from: 1965, to: 1989, own: ["ardeal", "basarabia", "lume"] },
  { id: "tranzitie", from: 1990, to: 2006, own: ["basarabia", "lume"] },
  { id: "europa", from: 2007, to: 2100, own: ["basarabia", "lume"] },
];

export const EVENTS: HistEvent[] = [
  { id: "1600-mihai-viteazul", year: 1600, tone: "schimbare", areas: ["ardeal", "regat", "bucovina", "basarabia"], weight: 2 },
  { id: "1699-pacea-karlowitz", year: 1699, tone: "schimbare", areas: ["ardeal"] },
  { id: "1700-unirea-biserica", year: 1700, tone: "schimbare", areas: ["ardeal"] },
  { id: "1711-domniile-fanariote", year: 1711, to: 1821, tone: "greu", areas: ["regat", "bucovina", "basarabia"] },
  { id: "1718-banatul-turci", year: 1718, tone: "schimbare", areas: ["ardeal"], counties: ["TM", "CS"] },
  { id: "1746-constantin-mavrocordat", year: 1746, to: 1749, tone: "bine", areas: ["regat", "bucovina", "basarabia"] },
  { id: "1762-satele-jurul", year: 1762, tone: "schimbare", areas: ["ardeal"], counties: ["BN"] },
  { id: "1775-austria-nordul", year: 1775, tone: "schimbare", areas: ["bucovina"], weight: 2 },
  { id: "1784-rascoala-horea", year: 1784, tone: "greu", areas: ["ardeal"], weight: 2 },
  { id: "1785-iosif-ii", year: 1785, tone: "bine", areas: ["ardeal"] },
  { id: "1791-supplex-libellus", year: 1791, tone: "schimbare", areas: ["ardeal"] },
  { id: "1812-rusia-basarabia", year: 1812, tone: "greu", areas: ["basarabia", "regat"], weight: 2 },
  { id: "1813-ciuma-caragea", year: 1813, to: 1814, tone: "greu", areas: ["regat"] },
  { id: "1816-vara-recolte", year: 1816, to: 1817, tone: "greu", areas: ["ardeal", "bucovina", "regat", "lume"] },
  { id: "1821-revolutia-tudor", year: 1821, tone: "schimbare", areas: ["regat"], weight: 2 },
  { id: "1831-epidemie-holera", year: 1831, tone: "greu", areas: ALL },
  { id: "1832-regulamentul-organic", year: 1832, tone: "schimbare", areas: ["regat"] },
  { id: "1838-gazeta-transilvania", year: 1838, tone: "bine", areas: ["ardeal"] },
  { id: "1848-revolutia-adunarea", year: 1848, tone: "schimbare", areas: ["ardeal", "regat", "bucovina"], weight: 3 },
  { id: "1848-iobagia-desfiintata", year: 1848, tone: "bine", areas: ["ardeal", "bucovina"], weight: 3 },
  { id: "1848-razboiul-civil", year: 1848, to: 1849, tone: "greu", areas: ["ardeal"], weight: 2 },
  { id: "1853-razboiul-crimeii", year: 1853, to: 1856, tone: "greu", areas: ["regat"] },
  { id: "1855-robii-romi", year: 1855, to: 1856, tone: "bine", areas: ["regat"] },
  { id: "1856-sudul-basarabiei", year: 1856, tone: "bine", areas: ["basarabia"] },
  { id: "1859-unirea-principatelor", year: 1859, tone: "bine", areas: ["regat"], weight: 3 },
  { id: "1861-infiinteaza-astra", year: 1861, tone: "bine", areas: ["ardeal"] },
  { id: "1864-reforma-agrara", year: 1864, tone: "bine", areas: ["regat"], weight: 3 },
  { id: "1866-carol-i", year: 1866, tone: "schimbare", areas: ["regat"] },
  { id: "1867-dualismul-austro", year: 1867, tone: "greu", areas: ["ardeal"], weight: 3 },
  { id: "1869-tren-principate", year: 1869, tone: "bine", areas: ["regat"] },
  { id: "1875-deschide-universitatea", year: 1875, tone: "bine", areas: ["bucovina"] },
  { id: "1877-razboiul-independenta", year: 1877, to: 1878, tone: "bine", areas: ["regat"], weight: 3 },
  { id: "1878-dobrogea-romania", year: 1878, tone: "schimbare", areas: ["dobrogea", "regat"], weight: 3 },
  { id: "1881-romania-regat", year: 1881, tone: "bine", areas: ["regat", "dobrogea"] },
  { id: "1892-memorandumul-romanilor", year: 1892, to: 1894, tone: "greu", areas: ["ardeal"], weight: 2 },
  { id: "1895-podul-cernavoda", year: 1895, tone: "bine", areas: ["dobrogea"] },
  { id: "1895-plecare-america", year: 1895, to: 1914, tone: "schimbare", areas: ["ardeal", "bucovina"], weight: 2 },
  { id: "1907-rascoala-taranilor", year: 1907, tone: "greu", areas: ["regat"], weight: 3 },
  { id: "1907-legile-apponyi", year: 1907, tone: "greu", areas: ["ardeal"], weight: 2 },
  { id: "1913-razboi-balcanic", year: 1913, tone: "schimbare", areas: ["regat", "dobrogea"] },
  { id: "1914-razboi-mondial", year: 1914, tone: "greu", areas: ["ardeal", "bucovina"], weight: 3 },
  { id: "1914-razboi-mondial-lume", year: 1914, tone: "greu", areas: ["lume", "basarabia"], weight: 3 },
  { id: "1916-romania-razboi", year: 1916, tone: "greu", areas: ["regat", "dobrogea", "ardeal"], weight: 3 },
  { id: "1917-iarna-foametei", year: 1917, tone: "schimbare", areas: ["regat"], weight: 2 },
  { id: "1918-gripa-spaniola", year: 1918, tone: "greu", areas: WORLD, weight: 2 },
  { id: "1918-unire-basarabia", year: 1918, tone: "bine", areas: ALL, weight: 3 },
  { id: "1919-razboiul-ungaria", year: 1919, tone: "schimbare", areas: ["ardeal"] },
  { id: "1921-reforma-agrara", year: 1921, tone: "bine", areas: ALL, weight: 3 },
  { id: "1929-criza-graul", year: 1929, to: 1933, tone: "greu", areas: WORLD, weight: 2 },
  { id: "1938-carol-ii", year: 1938, tone: "greu", areas: ALL },
  { id: "1939-razboi-mondial", year: 1939, tone: "greu", areas: ["lume"], weight: 3 },
  { id: "1940-uniunea-sovietica", year: 1940, tone: "greu", areas: ["basarabia", "bucovina", "regat"], weight: 3 },
  { id: "1940-dictatul-viena", year: 1940, tone: "greu", areas: ["ardeal", "regat", "bucovina"], weight: 3 },
  { id: "1940-ocupatia-horthysta", year: 1940, to: 1944, tone: "greu", areas: ["ardeal"], counties: NORD, weight: 3 },
  { id: "1940-cadrilaterul-dat", year: 1940, tone: "greu", areas: ["dobrogea"], weight: 3 },
  { id: "1940-cutremur-vrancea", year: 1940, tone: "greu", areas: ["regat"], weight: 2 },
  { id: "1941-romania-razboi", year: 1941, tone: "greu", areas: ["regat", "ardeal", "bucovina", "dobrogea", "basarabia"], weight: 3 },
  { id: "1941-deportarile-sovietice", year: 1941, tone: "greu", areas: ["basarabia", "bucovina"] },
  { id: "1941-evreii-romii", year: 1941, to: 1942, tone: "greu", areas: ["regat", "bucovina", "basarabia"], weight: 2 },
  { id: "1942-stalingradul-zeci", year: 1942, to: 1943, tone: "greu", areas: ["regat", "ardeal", "bucovina", "dobrogea", "basarabia"], weight: 2 },
  { id: "1944-evreii-nordul", year: 1944, tone: "greu", areas: ["ardeal"], counties: NORD, weight: 2 },
  { id: "1944-bombardamentele-americane", year: 1944, tone: "greu", areas: ["regat"], counties: ["B", "IF", "PH", "DB", "GR", "IL", "TR", "AG", "BZ"], weight: 2 },
  { id: "1944-august-romania", year: 1944, tone: "schimbare", areas: RO, weight: 3 },
  { id: "1945-germanii-ardeal", year: 1945, tone: "greu", areas: ["ardeal"], weight: 2 },
  { id: "1945-termina-razboi", year: 1945, tone: "bine", areas: WORLD, weight: 3 },
  { id: "1945-guvernul-petru", year: 1945, tone: "schimbare", areas: RO },
  { id: "1946-seceta-foametea", year: 1946, to: 1947, tone: "greu", areas: ["regat", "basarabia", "bucovina"], counties: [...MOLDOVA, "MD"], weight: 3 },
  { id: "1947-regele-mihai", year: 1947, tone: "greu", areas: RO, weight: 3 },
  { id: "1948-nationalizarea-fabricile", year: 1948, tone: "greu", areas: RO, weight: 2 },
  { id: "1948-biserica-greco", year: 1948, tone: "greu", areas: ["ardeal"], weight: 2 },
  { id: "1949-colectivizarea-pamantul", year: 1949, to: 1962, tone: "greu", areas: RO, weight: 3 },
  { id: "1949-deportarile-iulie", year: 1949, tone: "greu", areas: ["basarabia"], weight: 3 },
  { id: "1949-canalul-dunare", year: 1949, to: 1953, tone: "greu", areas: ["dobrogea", "regat"] },
  { id: "1951-deportarile-baragan", year: 1951, tone: "greu", areas: ["ardeal", "regat"], counties: ["TM", "CS", "MH", "DJ", "AR"], weight: 3 },
  { id: "1952-reforma-monetara", year: 1952, tone: "greu", areas: RO },
  { id: "1956-revolutia-ungaria", year: 1956, tone: "greu", areas: ["ardeal"] },
  { id: "1956-emisiune-televiziunii", year: 1956, tone: "bine", areas: RO },
  { id: "1957-sputnik-satelit", year: 1957, tone: "schimbare", areas: ["lume"] },
  { id: "1958-trupele-sovietice", year: 1958, tone: "bine", areas: RO, weight: 2 },
  { id: "1964-detinutii-politici", year: 1964, tone: "bine", areas: RO, weight: 2 },
  { id: "1965-nicolae-ceausescu", year: 1965, tone: "schimbare", areas: RO, weight: 2 },
  { id: "1966-decretul-interzice", year: 1966, tone: "greu", areas: RO, weight: 2 },
  { id: "1968-ceausescu-refuza", year: 1968, tone: "schimbare", areas: RO },
  { id: "1969-om-luna", year: 1969, tone: "bine", areas: ["lume", ...RO] },
  { id: "1970-inundatiile-mari", year: 1970, tone: "greu", areas: RO, weight: 2 },
  { id: "1977-cutremurul-martie", year: 1977, tone: "greu", areas: RO, weight: 3 },
  { id: "1977-greva-minerilor", year: 1977, tone: "schimbare", areas: ["ardeal"], counties: ["HD"], weight: 2 },
  { id: "1978-sasii-svabii", year: 1978, to: 1989, tone: "schimbare", areas: ["ardeal"] },
  { id: "1981-cartelelor-cozi", year: 1981, to: 1989, tone: "greu", areas: RO, weight: 3 },
  { id: "1987-revolta-muncitorilor", year: 1987, tone: "schimbare", areas: ["ardeal"], counties: ["BV"], weight: 2 },
  { id: "1989-revolutia-timisoara", year: 1989, tone: "schimbare", areas: RO, weight: 3 },
  { id: "1989-cade-zidul", year: 1989, tone: "bine", areas: ["lume", "basarabia"], weight: 3 },
  { id: "1990-mineriada-minerii", year: 1990, tone: "greu", areas: RO },
  { id: "1991-legea-pamantului", year: 1991, tone: "bine", areas: RO, weight: 3 },
  { id: "1991-republica-moldova", year: 1991, tone: "schimbare", areas: ["basarabia", "lume"], weight: 3 },
  { id: "1992-razboiul-nistru", year: 1992, tone: "greu", areas: ["basarabia"], weight: 2 },
  { id: "1992-jocul-caritas", year: 1992, to: 1994, tone: "greu", areas: RO },
  { id: "1993-inflatia-preturile", year: 1993, to: 1997, tone: "greu", areas: RO, weight: 2 },
  { id: "2002-vize-europa", year: 2002, tone: "schimbare", areas: RO, weight: 2 },
  { id: "2004-romania-nato", year: 2004, tone: "bine", areas: RO },
  { id: "2007-romania-uniunea", year: 2007, tone: "bine", areas: [...RO, "basarabia"], weight: 3 },
  { id: "2008-criza-economica", year: 2008, to: 2010, tone: "greu", areas: WORLD, weight: 2 },
  { id: "2014-moldovenii-pot", year: 2014, tone: "bine", areas: ["basarabia"] },
  { id: "2020-pandemia-covid", year: 2020, to: 2021, tone: "greu", areas: WORLD, weight: 3 },
  { id: "2022-rusia-invadeaza", year: 2022, tone: "greu", areas: WORLD, weight: 3 },
  { id: "2025-romania-deplin", year: 2025, tone: "bine", areas: RO },
];

export const eraOf = (year: number) => ERAS.find((e) => year >= e.from && year <= e.to) ?? ERAS[ERAS.length - 1];

/** Evenimentele care au atins ținutul cuiva. Fără ținut știut: doar cele mari, care au atins tot neamul românesc. */
export function eventsFor(origin: Pick<Origin, "area" | "county"> | null): HistEvent[] {
  return EVENTS.filter((e) => {
    if (!origin) return e.areas.includes("regat") && e.areas.includes("ardeal");
    if (!e.areas.includes(origin.area)) return false;
    // Un eveniment legat de anumite județe: doar acolo (pentru Basarabia, „MD” în listă).
    if (e.counties) return origin.area === "basarabia" ? e.counties.includes("MD") : !!origin.county && e.counties.includes(origin.county);
    return true;
  });
}

/** `age` = vârsta când a început; `ongoing` = începuse deja când s-a născut (anii cartelelor pentru cine s-a născut în 1985). */
export type Lived = { event: HistEvent; age: number; ongoing?: boolean };
export type Story = {
  year: number;
  era: Era;
  /** Povestea despre viața de atunci: a ținutului omului sau cea comună. */
  life: LifeKey;
  /** Ce se întâmplase cu puțin înainte să se nască (cel mult 12 ani). */
  before: HistEvent[];
  /** Ce a trăit, cu vârsta de atunci. */
  lived: Lived[];
  origin: Origin | null;
};

/** Povestea vremurilor pentru cineva: epoca nașterii, cum se trăia în ținutul lui și ce a trăit. */
export function storyFor(p: { birthYear: number | null; deathYear: number | null; living: boolean }, origin: Origin | null, now = new Date().getFullYear(), maxLived = 9): Story | null {
  const y = p.birthYear;
  if (y === null || y > now) return null;
  const era = eraOf(y);
  const life: LifeKey = origin && era.own.includes(origin.area) ? origin.area : "all";
  const evs = eventsFor(origin);
  const end = p.deathYear ?? (p.living ? now : Math.min(now, y + 75));
  const before = evs.filter((e) => (e.to ?? e.year) < y && (e.to ?? e.year) >= y - 12).sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1) || b.year - a.year).slice(0, 3)
    .sort((a, b) => a.year - b.year);
  let lived = evs.filter((e) => (e.to ?? e.year) >= y && e.year <= end).map((event) => (event.year < y ? { event, age: 0, ongoing: true } : { event, age: event.year - y }));
  // Prea multe: păstrăm întâi cele mari, apoi cele din copilărie, în ordinea anilor.
  if (lived.length > maxLived) {
    const keep = new Set([...lived].sort((a, b) => (b.event.weight ?? 1) - (a.event.weight ?? 1) || a.age - b.age).slice(0, maxLived).map((l) => l.event));
    lived = lived.filter((l) => keep.has(l.event));
  }
  return { year: y, era, life, before, lived, origin };
}

/** „la 12 ani”, „în anul nașterii”, „copil de 3 ani”. */
export function ageWords(age: number, sex: "M" | "F" | "U", ongoing = false) {
  if (ongoing) return "de când s-a născut";
  if (age === 0) return "în anul nașterii";
  const ani = age === 1 ? "un an" : age < 20 ? `${age} ani` : `${age} de ani`;
  if (age < 7) return `copil${sex === "F" ? "ă" : ""} de ${ani}`;
  return `la ${ani}`;
}
