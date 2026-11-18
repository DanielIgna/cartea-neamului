/**
 * Modelul cărții (oferta din 18 noiembrie 2026): cât omul n-a cumpărat cartea PDF a arborelui (și n-are acces gratuit), pagina
 * cărții nu citește nimic din arborele lui. Arată o carte făcută dintr-o familie închipuită, Florescu din „Valea Verde”, cu poze
 * desenate, o poveste, arborele și un exemplu de cod QR. Nimic de aici nu vine din baza de date.
 */
import type { PersonView } from "./tree-data";
import type { Rel } from "./kinship";
import type { Raised } from "./raised";
import type { BookMemory } from "./lada-db";

/** Textele modelului, în limba cărții (src/i18n/messages/carte/<limba>.ts, cheile `Book.sample…`). */
export type SampleWords = {
  occ1: string; occ2: string; occ3: string; occ4: string; bio1: string; bio2: string;
  memTitle: string; memQuestion: string; memBody: string;
};

/** Un portret desenat (nu o poză adevărată): un chip în tonuri sepia, cu inițialele dedesubt. */
function portrait(initials: string, sex: "M" | "F", hue: number) {
  const hair = sex === "F"
    ? `<path d="M30 52c0-22 12-34 30-34s30 12 30 34c0 8-2 18-6 24 2-14 0-26-6-32-6 6-26 8-36 2-6 8-8 18-6 30-4-6-6-16-6-24z" fill="hsl(${hue},28%,30%)"/>`
    : `<path d="M34 46c0-18 10-28 26-28s26 10 26 28c-4-8-10-12-26-12s-22 4-26 12z" fill="hsl(${hue},25%,28%)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><defs><radialGradient id="g" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#f4e7cf"/><stop offset="1" stop-color="#c9ad80"/></radialGradient></defs>`
    + `<rect width="120" height="150" fill="url(#g)"/><path d="M14 150c4-30 22-44 46-44s42 14 46 44z" fill="hsl(${hue},22%,36%)"/>`
    + `<ellipse cx="60" cy="58" rx="24" ry="29" fill="#e6c9a2"/>${hair}`
    + `<text x="60" y="140" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#5b4630" opacity=".55">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const base = (o: Partial<PersonView> & Pick<PersonView, "id" | "givenName" | "surname" | "sex">): PersonView => ({
  name: `${o.givenName} ${o.surname}`, birthSurname: null, birthText: null, birthPlace: null, deathText: null, deathPlace: null,
  birthCountry: null, deathCountry: null, residencePlace: null, residenceCountry: null, birthYear: null, deathYear: null, approx: false,
  living: false, discreet: false, claimed: false, occupation: null, biography: null, notes: null, createdBy: null, claimedBy: null, photoId: null,
  documents: [], accountImage: null, ...o,
});
const born = (y: number, place = "Valea Verde") => ({ birthText: String(y), birthYear: y, birthPlace: place });
const died = (y: number, place = "Valea Verde") => ({ deathText: String(y), deathYear: y, deathPlace: place });

/** Familia închipuită: patru generații, de la Ion Florescu (1898) la strănepotul Luca (2010). Cartea pornește de la Andrei. */
export function sampleFamily(w: SampleWords) {
  const P = (p: Parameters<typeof base>[0], hue: number) => {
    const v = base(p);
    return { ...v, accountImage: portrait(`${v.givenName[0]}. ${v.surname[0]}.`, v.sex === "F" ? "F" : "M", hue) };
  };
  const list: PersonView[] = [
    P({ id: "m-andrei", givenName: "Andrei", surname: "Florescu", sex: "M", living: true, ...born(1980, "Brașov"), occupation: w.occ4, residencePlace: "Brașov" }, 210),
    P({ id: "m-vasile", givenName: "Vasile", surname: "Florescu", sex: "M", living: true, ...born(1952), occupation: w.occ2 }, 30),
    P({ id: "m-victoria", givenName: "Victoria", surname: "Florescu", birthSurname: "Lungu", sex: "F", living: true, ...born(1955, "Poiana") }, 350),
    P({ id: "m-gheorghe", givenName: "Gheorghe", surname: "Florescu", sex: "M", ...born(1925), ...died(1999), occupation: w.occ2 }, 25),
    P({ id: "m-ana", givenName: "Ana", surname: "Florescu", birthSurname: "Munteanu", sex: "F", ...born(1930, "Poiana"), ...died(2015), occupation: w.occ3, biography: w.bio2 }, 15),
    P({ id: "m-petru", givenName: "Petru", surname: "Lungu", sex: "M", ...born(1928, "Poiana"), ...died(2001, "Poiana") }, 120),
    P({ id: "m-floarea", givenName: "Floarea", surname: "Lungu", sex: "F", ...born(1931, "Poiana"), ...died(2012, "Poiana") }, 300),
    P({ id: "m-ion", givenName: "Ion", surname: "Florescu", sex: "M", ...born(1898), ...died(1971), occupation: w.occ1, biography: w.bio1 }, 40),
    P({ id: "m-maria", givenName: "Maria", surname: "Florescu", birthSurname: "Stan", sex: "F", ...born(1902), ...died(1985) }, 5),
    P({ id: "m-elena", givenName: "Elena", surname: "Florescu", sex: "F", ...born(1929), ...died(2010) }, 330),
    P({ id: "m-mihaela", givenName: "Mihaela", surname: "Florescu", sex: "F", living: true, ...born(1984, "Brașov") }, 280),
    P({ id: "m-luca", givenName: "Luca", surname: "Florescu", sex: "M", living: true, ...born(2010, "Brașov") }, 200),
  ];
  const pc = (a: string, b: string): Rel => ({ type: "parent_child", a: `m-${a}`, b: `m-${b}` });
  const pr = (a: string, b: string, start: string): Rel => ({ type: "partnership", a: `m-${a}`, b: `m-${b}`, start });
  const rels: Rel[] = [
    pr("ion", "maria", "1923"), pc("ion", "gheorghe"), pc("maria", "gheorghe"), pc("ion", "elena"), pc("maria", "elena"),
    pr("gheorghe", "ana", "1950"), pc("gheorghe", "vasile"), pc("ana", "vasile"),
    pr("petru", "floarea", "1952"), pc("petru", "victoria"), pc("floarea", "victoria"),
    pr("vasile", "victoria", "1978"), pc("vasile", "andrei"), pc("victoria", "andrei"), pc("vasile", "mihaela"), pc("victoria", "mihaela"),
    pc("andrei", "luca"),
  ];
  const raised: Raised[] = [];
  const people = Object.fromEntries(list.map((p) => [p.id, p])) as Record<string, PersonView>;
  // Numerotarea strămoșilor (1 = Andrei, 2 = tatăl, 3 = mama, 4–7 bunicii, 8–9 străbunicii dinspre tată).
  const slots: Record<number, string> = { 1: "m-andrei", 2: "m-vasile", 3: "m-victoria", 4: "m-gheorghe", 5: "m-ana", 6: "m-petru", 7: "m-floarea", 8: "m-ion", 9: "m-maria" };
  const memory: BookMemory = {
    id: "m-amintire", personId: "m-ana", chapter: "copilaria", title: w.memTitle, question: w.memQuestion, askedBy: "Andrei Florescu", body: w.memBody,
    when: "1954", year: 1954, place: "Poiana", photoId: null, audio: true, audioSeconds: 94, recordedBy: "Andrei Florescu", createdAt: "2026-01-01T00:00:00.000Z",
  };
  return { people, rels, raised, centerId: "m-andrei", slots, memory };
}
