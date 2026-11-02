import type { GedcomData, GIndividual } from "./gedcom";

/** Familie de exemplu, inventată: neamul Pop din Ieud (Maramureș). Cheia = număr Ahnentafel față de Andrei. */
type Demo = { given: string; surname: string; born?: string; b: string; bp: string; d?: string; dp?: string; occ?: string; note?: string };
export const DEMO: Record<number, Demo> = {
  1: { given: "Andrei", surname: "Pop", b: "1988", bp: "Cluj-Napoca", occ: "Inginer software", note: "A pornit arborele în 2026, din caietul de amintiri al bunicii Ana." },
  2: { given: "Ioan", surname: "Pop", b: "1958", bp: "Sighetu Marmației", occ: "Tâmplar", note: "Păstrează lada de zestre a familiei." },
  3: { given: "Maria", surname: "Pop", born: "Dunca", b: "1961", bp: "Bârsana", occ: "Învățătoare" },
  4: { given: "Gheorghe", surname: "Pop", b: "1929", bp: "Ieud", d: "2004", dp: "Ieud", occ: "Agricultor" },
  5: { given: "Ana", surname: "Pop", born: "Bud", b: "1932", bp: "Botiza", d: "2015", dp: "Ieud", occ: "Țesătoare", note: "Povestea despre anii războiului și despre tatăl ei, Mihai." },
  6: { given: "Vasile", surname: "Dunca", b: "1934", bp: "Bârsana", d: "1999", dp: "Bârsana", occ: "Meșter lemnar" },
  7: { given: "Floare", surname: "Dunca", born: "Hotea", b: "1936", bp: "Rozavlea", d: "2011", dp: "Bârsana" },
  8: { given: "Toader", surname: "Pop", b: "1898", bp: "Ieud", d: "1967", dp: "Ieud", occ: "Tâmplar, cântăreț de strană", note: "A luptat pe frontul italian în 1917." },
  9: { given: "Irina", surname: "Pop", born: "Bizău", b: "1902", bp: "Ieud", d: "1980", dp: "Ieud" },
  10: { given: "Mihai", surname: "Bud", b: "1900", bp: "Botiza", d: "1944", dp: "front, Ungaria", note: "Căzut în toamna lui 1944." },
  11: { given: "Paraschiva", surname: "Bud", born: "Tivadar", b: "1905", bp: "Botiza", d: "1988", dp: "Botiza" },
  12: { given: "Grigore", surname: "Dunca", b: "1903", bp: "Bârsana", d: "1971", dp: "Bârsana" },
  13: { given: "Ileana", surname: "Dunca", born: "Rednic", b: "1908", bp: "Bârsana", d: "1990", dp: "Bârsana" },
  14: { given: "Petru", surname: "Hotea", b: "1905", bp: "Rozavlea", d: "1977", dp: "Rozavlea" },
  15: { given: "Sofia", surname: "Hotea", born: "Marchiș", b: "1910", bp: "Rozavlea", d: "1995", dp: "Rozavlea" },
  16: { given: "Ilie", surname: "Pop", b: "1870", bp: "Ieud", d: "1931", dp: "Ieud" },
  17: { given: "Măriuța", surname: "Pop", born: "Iuga", b: "1874", bp: "Ieud", d: "1940", dp: "Ieud" },
  18: { given: "Simion", surname: "Bizău", b: "ABT 1868", bp: "Ieud", d: "1920", dp: "Ieud" },
  20: { given: "Ștefan", surname: "Bud", b: "1872", bp: "Botiza", d: "1916", dp: "front, Galiția" },
  21: { given: "Ana", surname: "Bud", born: "Codrea", b: "1876", bp: "Botiza", d: "1950", dp: "Botiza" },
  24: { given: "Nicolae", surname: "Dunca", b: "1875", bp: "Bârsana", d: "1939", dp: "Bârsana" },
  25: { given: "Rozalia", surname: "Dunca", born: "Pașca", b: "1879", bp: "Bârsana", d: "1945", dp: "Bârsana" },
  26: { given: "Dumitru", surname: "Rednic", b: "1880", bp: "Bârsana", d: "1951", dp: "Bârsana" },
  30: { given: "Ioan", surname: "Marchiș", b: "1882", bp: "Rozavlea", d: "1960", dp: "Rozavlea" },
  31: { given: "Varvara", surname: "Marchiș", born: "Ilieș", b: "1885", bp: "Rozavlea", d: "1968", dp: "Rozavlea" },
  // generația 5 (născuți cca. 1835–1855)
  32: { given: "Vasile", surname: "Pop", b: "1841", bp: "Ieud", d: "1903", dp: "Ieud", occ: "Agricultor" },
  33: { given: "Anuța", surname: "Pop", born: "Mihali", b: "1846", bp: "Ieud", d: "1910", dp: "Ieud" },
  34: { given: "Grigore", surname: "Iuga", b: "1844", bp: "Ieud", d: "1899", dp: "Ieud" },
  35: { given: "Rusalina", surname: "Iuga", born: "Știr", b: "ABT 1850", bp: "Ieud", d: "1921", dp: "Ieud" },
  36: { given: "Alexandru", surname: "Bizău", b: "ABT 1840", bp: "Ieud", d: "1897", dp: "Ieud" },
  40: { given: "Petru", surname: "Bud", b: "1845", bp: "Botiza", d: "1912", dp: "Botiza", occ: "Morar" },
  41: { given: "Ileana", surname: "Bud", born: "Pop", b: "1850", bp: "Botiza", d: "1918", dp: "Botiza" },
  48: { given: "Simion", surname: "Dunca", b: "1848", bp: "Bârsana", d: "1915", dp: "Bârsana" },
  49: { given: "Marina", surname: "Dunca", born: "Hojda", b: "1852", bp: "Bârsana", d: "1930", dp: "Bârsana" },
  60: { given: "Gavrilă", surname: "Marchiș", b: "ABT 1855", bp: "Rozavlea", d: "1925", dp: "Rozavlea" },
  // generația 6 (cca. 1805–1820)
  64: { given: "Ioan", surname: "Pop", b: "1812", bp: "Ieud", d: "1871", dp: "Ieud", note: "Trecut în conscripția urbarială din 1820 ca fiu de iobag." },
  65: { given: "Floare", surname: "Pop", born: "Gherman", b: "1816", bp: "Ieud", d: "1880", dp: "Ieud" },
  68: { given: "Toader", surname: "Iuga", b: "ABT 1815", bp: "Ieud", d: "1870", dp: "Ieud" },
  80: { given: "Mihai", surname: "Bud", b: "1818", bp: "Botiza", d: "1879", dp: "Botiza" },
  96: { given: "Nicolae", surname: "Dunca", b: "ABT 1820", bp: "Bârsana", d: "1888", dp: "Bârsana" },
  // generația 7 (cca. 1775–1790)
  128: { given: "Gheorghe", surname: "Pop", b: "1783", bp: "Ieud", d: "1848", dp: "Ieud", occ: "Cantor" },
  129: { given: "Maria", surname: "Pop", born: "Balea", b: "ABT 1788", bp: "Ieud", d: "1852", dp: "Ieud" },
  160: { given: "Ilie", surname: "Bud", b: "ABT 1790", bp: "Botiza", d: "1850", dp: "Botiza" },
  192: { given: "Vasile", surname: "Dunca", b: "ABT 1790", bp: "Bârsana", d: "1856", dp: "Bârsana" },
  // generația 8 (cca. 1750)
  256: { given: "Toader", surname: "Pop", b: "ABT 1752", bp: "Ieud", d: "1817", dp: "Ieud", note: "Apare în registrul parohial greco-catolic, primul păstrat la Ieud." },
  257: { given: "Ana", surname: "Pop", born: "Chindriș", b: "ABT 1757", bp: "Ieud", d: "1820", dp: "Ieud" },
  384: { given: "Ștefan", surname: "Dunca", b: "ABT 1760", bp: "Bârsana", d: "1824", dp: "Bârsana" },
  // generația 9 (cca. 1720)
  512: { given: "Ion", surname: "Pop", b: "ABT 1721", bp: "Ieud", d: "1784", dp: "Ieud" },
  513: { given: "Paraschiva", surname: "Pop", b: "ABT 1726", bp: "Ieud", d: "1790", dp: "Ieud" },
  // generația 10 (cca. 1690)
  1024: { given: "Petru", surname: "Pop", b: "ABT 1690", bp: "Ieud", d: "AFT 1750", dp: "Ieud", note: "Cel mai vechi strămoș cunoscut, pomenit într-o conscripție a Maramureșului din 1715." },
};

export function demoGedcom(): GedcomData {
  const nums = Object.keys(DEMO).map(Number);
  const individuals: GIndividual[] = nums.map((n) => {
    const p = DEMO[n];
    return {
      xref: `@I${n}@`, given: p.given, surname: p.surname, birthSurname: p.born,
      sex: n === 1 || n % 2 === 0 ? "M" : "F",
      birth: { date: p.b, place: p.bp }, death: p.d ? { date: p.d, place: p.dp } : undefined,
      deceased: !!p.d, occupation: p.occ, note: p.note,
    };
  });
  const families = nums
    .filter((n) => DEMO[2 * n] || DEMO[2 * n + 1])
    .map((n) => ({
      xref: `@F${n}@`, husb: DEMO[2 * n] ? `@I${2 * n}@` : undefined, wife: DEMO[2 * n + 1] ? `@I${2 * n + 1}@` : undefined,
      children: [`@I${n}@`],
    }));
  return { individuals, families };
}

/**
 * Rudele colaterale și urmașii din exemplu: frați, soți și copii, legați prin xref-ul GEDCOM.
 * `parents` și `partner` trimit la @I<n>@ (Ahnentafel) sau la alte rude din listă (@X<n>@).
 */
export type DemoExtra = Demo & { xref: string; sex: "M" | "F"; parents?: string[]; partner?: string; living?: boolean };
export const DEMO_EXTRAS: DemoExtra[] = [
  { xref: "@X1@", given: "Elena", surname: "Pop", born: "Moldovan", sex: "F", b: "1990", bp: "Cluj-Napoca", partner: "@I1@", living: true, occ: "Medic" },
  { xref: "@X2@", given: "Matei", surname: "Pop", sex: "M", b: "2019", bp: "Cluj-Napoca", parents: ["@I1@", "@X1@"], living: true },
  { xref: "@X3@", given: "Ilinca", surname: "Pop", sex: "F", b: "2022", bp: "Cluj-Napoca", parents: ["@I1@", "@X1@"], living: true },
  { xref: "@X4@", given: "Cristina", surname: "Rus", born: "Pop", sex: "F", b: "1985", bp: "Sighetu Marmației", parents: ["@I2@", "@I3@"], living: true, occ: "Profesoară" },
  { xref: "@X5@", given: "Radu", surname: "Rus", sex: "M", b: "1983", bp: "Baia Mare", partner: "@X4@", living: true },
  { xref: "@X6@", given: "Luca", surname: "Rus", sex: "M", b: "2014", bp: "Baia Mare", parents: ["@X4@", "@X5@"], living: true },
  { xref: "@X7@", given: "Vasile", surname: "Pop", sex: "M", b: "1955", bp: "Ieud", parents: ["@I4@", "@I5@"], living: true, occ: "Preot" },
  { xref: "@X8@", given: "Lucreția", surname: "Pop", born: "Văleanu", sex: "F", b: "1957", bp: "Ieud", partner: "@X7@", living: true },
  { xref: "@X9@", given: "Mihai", surname: "Pop", sex: "M", b: "1983", bp: "Sighetu Marmației", parents: ["@X7@", "@X8@"], living: true },
  { xref: "@X10@", given: "Maria", surname: "Hodor", born: "Pop", sex: "F", b: "1926", bp: "Ieud", d: "2010", dp: "Vadu Izei", parents: ["@I8@", "@I9@"], note: "Sora mai mare a lui Gheorghe; a plecat la Vadu Izei după căsătorie." },
  { xref: "@X11@", given: "Ion", surname: "Pop", sex: "M", b: "1873", bp: "Ieud", d: "1950", dp: "Ieud", parents: ["@I32@", "@I33@"], note: "Fratele lui Ilie; a ținut moara de pe Valea Ieudului." },
  { xref: "@X12@", given: "Ana", surname: "Bud", sex: "F", b: "1903", bp: "Botiza", d: "1979", dp: "Botiza", parents: ["@I20@", "@I21@"] },
];
