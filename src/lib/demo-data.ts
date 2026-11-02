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
