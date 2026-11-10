/**
 * Istoria Bisericii lui Hristos, prigonită de la început până azi: de la apostoli, prin martirii Romei, reformatori,
 * închisorile comuniste, până la creștinii prigoniți acum. Aici stă doar așezarea: epocile cu anii lor, martorii fiecărei
 * epoci (w1, w2…) și care dintre ei sunt „la noi”, eroii și pașii Bibliei românești. Textele, scrise de mână, sunt în
 * src/i18n/messages/biserica/ (partea „Church”), în fiecare limbă, cu versetele din Biblia clasică a limbii.
 */

/** O epocă: anii ei și martorii ei, în ordine; `ro` = s-a petrecut pe pământul României de azi (sau privește direct românii). */
export type ChurchEra = { id: string; from: number; to: number; witnesses: { key: string; ro: boolean }[] };

const w = (...ro: boolean[]) => ro.map((x, i) => ({ key: `w${i + 1}`, ro: x }));
const _ = false, RO = true;

export const CHURCH_ERAS: ChurchEra[] = [
  { id: "apostoli", from: 30, to: 100, witnesses: w(_, _, _, RO, _) },
  { id: "roma", from: 100, to: 313, witnesses: w(_, _, _, _, _, RO, RO) },
  { id: "evul-mediu", from: 313, to: 1500, witnesses: w(RO, _, _, _) },
  { id: "reforma", from: 1500, to: 1700, witnesses: w(_, _, _, RO, RO, _, _, RO) },
  { id: "trezire", from: 1700, to: 1900, witnesses: w(RO, _, _) },
  { id: "secolul-xx", from: 1900, to: 1989, witnesses: w(_, RO, RO, _, RO, RO, RO, RO) },
  { id: "azi", from: 1990, to: 2026, witnesses: w(_, _, _, RO) },
];

/** Ce martori au și vorbele lor, așa cum au rămas scrise. */
export const WITNESS_QUOTES = new Set(["apostoli.w1", "roma.w2", "reforma.w1", "reforma.w3"]);

/** Eroii credinței din închisorile comuniste: câte paragrafe are povestea fiecăruia. */
export const HEROES = [
  { id: "wurmbrand", paragraphs: 4 },
  { id: "moldoveanu", paragraphs: 4 },
  { id: "dorz", paragraphs: 4 },
] as const;

/** Pașii Bibliei în limba română (b1…b9); doar b4 (Noul Testament de la Bălgrad) are un citat. */
export const BIBLE_STEPS = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"] as const;
export const STEP_QUOTES = new Set(["b4"]);
export const INFLUENCE = ["i1", "i2", "i3", "i4"] as const;
export const END_VERSES = ["v1", "v2", "v3"] as const;

/** Epoca în care cade un an (pentru legături din arbore). */
export function churchEraOf(year: number): ChurchEra | undefined {
  return CHURCH_ERAS.find((e) => year >= e.from && year <= e.to);
}
