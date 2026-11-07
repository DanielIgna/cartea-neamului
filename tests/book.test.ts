import { describe, it, expect } from "vitest";
import { createTranslator } from "use-intl/core";
import { bookOptions, bookWords, buildBook, cleanText, dateKind, generationOf, generationTitle, photoUrl, shownPerson, type BookOptions } from "@/lib/book";
import { loadMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/locales";
import { parseFuzzyDate } from "@/lib/dates";
import type { PersonView } from "@/lib/tree-data";
import type { Rel } from "@/lib/kinship";

/**
 * Familia lui Avram, ca în arborele adevărat: Gavril și Onița (trunchiul); Avram cu Iosefina (discretă) → Mariana;
 * Avram cu Floarea (căsătoriți în 1958) → Ioan Daniel și Nicolae, amândoi în viață; Floarea a crescut-o pe Mariana.
 * Sora lui Avram, Ana, e în viață. Tatăl Floarei nu se știe („Tată necunoscut”).
 */
const pv = (id: string, givenName: string, surname: string, sex: "M" | "F", extra: Partial<PersonView> = {}): PersonView => {
  const b = parseFuzzyDate(extra.birthText ?? null), d = parseFuzzyDate(extra.deathText ?? null);
  return {
    id, name: `${givenName} ${surname}`.trim(), givenName, surname, birthSurname: null, sex, birthText: null, birthPlace: null, deathText: null, deathPlace: null,
    birthCountry: null, deathCountry: null, residencePlace: null, residenceCountry: null, birthYear: b.year, deathYear: d.year, approx: b.approx,
    living: false, discreet: false, claimed: false, occupation: null, biography: null, notes: null, createdBy: null, claimedBy: null, photoId: null,
    accountImage: null, documents: [], ...extra,
  };
};
const people: Record<string, PersonView> = Object.fromEntries([
  pv("gavril", "Gavril", "Igna", "M", { birthText: "1890", deathText: "1960", birthPlace: "Sâncraiu" }),
  pv("onita", "Onița", "Igna", "F", { birthText: "1895", deathText: "1970", birthPlace: "Sâncraiu" }),
  pv("avram", "Avram", "Igna", "M", { birthText: "12.03.1932", deathText: "05.11.2008", birthPlace: "Huedin", occupation: "tâmplar", biography: "A făcut mobila pentru tot satul." }),
  pv("ana", "Ana", "Igna", "F", { birthText: "1935", living: true, birthPlace: "Huedin" }),
  pv("iosefina", "Iosefina", "", "F", { discreet: true }),
  pv("floarea", "Floarea", "Igna", "F", { birthSurname: "Pop", birthText: "1936", deathText: "2010", birthPlace: "Huedin" }),
  pv("tata", "Tată necunoscut", "", "M"),
  pv("mariana", "Mariana", "Moldovan", "F", { birthSurname: "Igna", birthText: "1955", deathText: "2019" }),
  pv("daniel", "Ioan Daniel", "Igna", "M", { birthText: "14.07.1970", living: true, birthPlace: "Cluj-Napoca", residencePlace: "Torino", residenceCountry: "Italia", photoId: "poza-daniel",
    documents: [{ id: "poza-daniel", title: "profil.jpg", kind: "photo", dateText: null, hasFile: true }, { id: "nunta", title: "IMG_2034.jpg", kind: "photo", dateText: "1995", hasFile: true, description: "La nuntă, în Huedin" }] }),
  pv("nicolae", "Nicolae", "Igna", "M", { birthText: "1973", living: true }),
].map((p) => [p.id, p]));
const rels: Rel[] = [
  { type: "partnership", a: "gavril", b: "onita" },
  ...["avram", "ana"].flatMap((c): Rel[] => [{ type: "parent_child", a: "gavril", b: c }, { type: "parent_child", a: "onita", b: c }]),
  { type: "partnership", a: "avram", b: "iosefina" },
  { type: "partnership", a: "avram", b: "floarea", start: "1958" },
  { type: "parent_child", a: "avram", b: "mariana" }, { type: "parent_child", a: "iosefina", b: "mariana" },
  ...["daniel", "nicolae"].flatMap((c): Rel[] => [{ type: "parent_child", a: "avram", b: c }, { type: "parent_child", a: "floarea", b: c }]),
  { type: "parent_child", a: "tata", b: "floarea" },
];
const slots = { 1: "daniel", 2: "avram", 3: "floarea", 4: "gavril", 5: "onita", 6: "tata" };
const book = (o: Partial<BookOptions> = {}, words?: ReturnType<typeof bookWords>) =>
  buildBook({ people, rels, raised: [{ child: "mariana", carer: "floarea" }], centerId: "daniel", slots, options: { living: "tot", photos: true, format: "A4", ...o }, words });
/** Cuvintele cărții într-o limbă, ca pe pagina cărții cu `?limba=`. */
const wordsIn = async (locale: Locale) => bookWords(locale, createTranslator({ locale, messages: await loadMessages(locale), namespace: "Book" }));
const names = (ids: { name: string }[]) => ids.map((e) => e.name);

describe("cartea neamului", () => {
  it("așază oamenii pe generații, de la cei mai vechi, familie lângă familie", () => {
    const b = book();
    expect(b.generations.map((g) => [g.title, g.subtitle])).toEqual([
      ["Generația I", "Generația bunicilor lui Ioan Daniel"],
      ["Generația a II-a", "Generația părinților lui Ioan Daniel"],
      ["Generația a III-a", "Generația lui Ioan Daniel"],
    ]);
    // Avram cu Floarea alături, apoi sora lui; Iosefina (discretă) și „Tată necunoscut” nu au fișă.
    expect(b.generations.map((g) => names(g.entries))).toEqual([
      ["Gavril Igna", "Onița Igna"],
      ["Avram Igna", "Floarea Igna", "Ana Igna"],
      ["Mariana Moldovan", "Ioan Daniel Igna", "Nicolae Igna"],
    ]);
    expect(b.stats).toMatchObject({ people: 8, generations: 3, from: 1890, to: 1973 });
    expect(b.stats.oldest?.name).toBe("Gavril Igna");
    expect(b.stats.places[0]).toEqual(["Huedin", 3]);
  });

  it("fișa: părinții, căsătoriile cu copiii lor, cine a crescut pe cine", () => {
    const b = book();
    const fisa = (id: string) => b.generations.flatMap((g) => g.entries).find((e) => e.id === id)!;
    const avram = fisa("avram");
    expect(avram).toMatchObject({ dates: "12.03.1932–05.11.2008", born: "12.03.1932, Huedin", died: "05.11.2008", occupation: "tâmplar" });
    // Întâi căsătoria cu Floarea; copiii mamei discrete apar la urmă, fără numele ei.
    expect(avram.unions.map((u) => [u.spouse?.name ?? null, u.married, names(u.children)])).toEqual([
      ["Floarea Igna", "1958", ["Ioan Daniel Igna", "Nicolae Igna"]],
      [null, "", ["Mariana Moldovan"]],
    ]);
    // Mama discretă apare doar la „Părinți”, în fișa fetei, fără trimitere la o fișă a ei.
    expect(fisa("mariana").parents).toEqual([{ id: "avram", name: "Avram Igna", dates: "12.03.1932–05.11.2008" }, { id: null, name: "Iosefina", dates: "" }]);
    expect(names(fisa("mariana").carers)).toEqual(["Floarea Igna"]);
    expect(names(fisa("floarea").raised)).toEqual(["Mariana Moldovan"]);
    expect(fisa("floarea").parents).toEqual([]); // fără „Tată necunoscut”
    expect(fisa("daniel")).toMatchObject({ lives: "Torino, Italia", photo: "/api/document/poza-daniel", album: [{ src: "/api/document/nunta", caption: "La nuntă, în Huedin, 1995" }] });
  });

  it("urmașii trunchiului la rând, cu numerele lor", () => {
    const b = book();
    expect(b.trunk?.name).toBe("Gavril Igna");
    expect(b.outline.map((l) => `${l.num} ${l.person.name}${l.spouses.length ? ` ⚭ ${names(l.spouses).join(", ")}` : ""}${l.from ? ` (${l.from})` : ""}`)).toEqual([
      "1 Gavril Igna ⚭ Onița Igna",
      "1.1 Avram Igna ⚭ Floarea Igna",
      "1.1.1 Mariana Moldovan (din altă relație)",
      "1.1.2 Ioan Daniel Igna",
      "1.1.3 Nicolae Igna",
      "1.2 Ana Igna",
    ]);
    expect(b.tree?.id).toBe("gavril");
    expect([...b.path].sort()).toEqual(["avram", "daniel", "floarea", "gavril", "onita"]); // drumul de la trunchi la Ioan Daniel, pe toate liniile
    expect(Object.keys(b.treePeople).sort()).toEqual(["ana", "avram", "daniel", "floarea", "gavril", "mariana", "nicolae", "onita"]);
    expect(b.treePeople.avram.biography).toBeNull(); // desenul nu primește poveștile
  });

  it("evantaiul strămoșilor, fără „Tată necunoscut”", () => {
    const b = book();
    expect(Object.keys(b.fan).sort()).toEqual(["1", "2", "3", "4", "5"]);
    expect(b.fanGenerations).toBe(2);
  });

  it("indexul de nume, cu numele de fată trecut și separat", () => {
    expect(book().index.map((l) => l.label)).toEqual([
      "Igna, Ana", "Igna, Avram", "Igna, Floarea (n. Pop)", "Igna, Gavril", "Igna, Ioan Daniel", "Igna, Mariana (căs. Moldovan)",
      "Igna, Nicolae", "Igna, Onița", "Moldovan, Mariana (n. Igna)", "Pop, Floarea (căs. Igna)",
    ]);
  });

  it("cei în viață doar cu numele: fără date, locuri, poze și povești", () => {
    const b = book({ living: "nume" });
    const daniel = b.generations[2].entries.find((e) => e.id === "daniel")!;
    expect(daniel).toMatchObject({ name: "Ioan Daniel Igna", dates: "", born: "", lives: "", photo: null, album: [] });
    expect(b.stats.to).toBe(1955); // anii celor în viață nu se scriu nicăieri
    expect(b.fan[1]).toMatchObject({ name: "Ioan Daniel Igna", birthText: null, birthYear: null });
  });

  it("fără cei în viață: nu apar deloc, iar fișele părinților spun doar câți sunt", () => {
    const b = book({ living: "ascunsi" });
    expect(b.centerName).toBeNull();
    expect(b.generations.map((g) => g.subtitle)).toEqual(["", "", ""]);
    expect(b.generations.flatMap((g) => names(g.entries))).not.toContain("Ioan Daniel Igna");
    const avram = b.generations[1].entries.find((e) => e.id === "avram")!;
    expect(avram.unions[0]).toMatchObject({ spouse: { name: "Floarea Igna" }, children: [], hidden: 2 });
    expect(b.outline.map((l) => [l.num, l.person.name, l.hidden])).toEqual([["1", "Gavril Igna", 1], ["1.1", "Avram Igna", 2], ["1.1.1", "Mariana Moldovan", 0]]);
    expect(b.fan[1]).toBeUndefined();
  });

  it("în limba cărții: titlurile generațiilor, datele, țara, „din altă relație” și numele de fată", async () => {
    const de = book({}, await wordsIn("de"));
    expect(de.generations.map((g) => [g.title, g.subtitle])).toEqual([
      ["Generation I", "Die Generation der Großeltern von Ioan Daniel"],
      ["Generation II", "Die Generation der Eltern von Ioan Daniel"],
      ["Generation III", "Die Generation von Ioan Daniel"],
    ]);
    const fisa = (id: string) => de.generations.flatMap((g) => g.entries).find((e) => e.id === id)!;
    expect(fisa("avram").unions[0]).toMatchObject({ married: "1958", marriedKind: "year" });
    expect(fisa("daniel").lives).toBe("Torino, Italien"); // țara se traduce, orașul rămâne cum l-a scris familia
    expect(de.outline.find((l) => l.from)?.from).toBe("aus einer anderen Beziehung");
    expect(de.index.map((l) => l.label)).toContain("Igna, Floarea (geb. Pop)");
    expect(de.index.map((l) => l.label)).toContain("Pop, Floarea (verh. Igna)");
    // În maghiară, numărul vine înaintea cuvântului, iar datele se scriu cu anul în față.
    const hu = book({}, await wordsIn("hu"));
    expect(hu.generations.map((g) => g.title)).toEqual(["I. nemzedék", "II. nemzedék", "III. nemzedék"]);
    expect(hu.generations.flatMap((g) => g.entries).find((e) => e.id === "avram")!.dates).toBe("1932. 03. 12.–2008. 11. 05.");
    // Engleza: „née” la femei, „born” la bărbați.
    const en = book({}, await wordsIn("en-GB"));
    expect(en.index.map((l) => l.label)).toContain("Moldovan, Mariana (née Igna)");
    // Fără cuvinte date, cartea e în română, ca până acum.
    expect(book().generations[0].title).toBe("Generația I");
  });

  it("cum s-a scris data căsătoriei, ca fraza să se potrivească („la 3 mai 1958”, „în 1958”, „pe la 1958”)", () => {
    expect(dateKind("03.05.1958")).toBe("date");
    expect(dateKind("1958")).toBe("year");
    expect(dateKind("cca 1958")).toBe("other");
    expect(dateKind("")).toBe("other");
  });

  it("fără poze, când așa se alege", () => {
    const daniel = book({ photos: false }).generations[2].entries.find((e) => e.id === "daniel")!;
    expect(daniel).toMatchObject({ photo: null, album: [] });
  });
});

describe("alegerile și textele cărții", () => {
  it("citește alegerile din adresă, cu valori sigure", () => {
    expect(bookOptions({})).toEqual({ living: "nume", photos: true, format: "A4" });
    expect(bookOptions({ vii: "tot", poze: "nu", format: "A5" })).toEqual({ living: "tot", photos: false, format: "A5" });
    expect(bookOptions({ vii: "<script>", format: ["A5", "A4"] })).toEqual({ living: "nume", photos: true, format: "A5" });
  });

  it("curăță textele scrise", () => {
    expect(cleanText({ title: "  Neamul Igna  ", preface: "Rândul unu\r\n\r\n\r\n\r\nRândul doi", author: 7 })).toEqual({ title: "Neamul Igna", subtitle: "", author: "", preface: "Rândul unu\n\nRândul doi" });
    expect(cleanText({ title: "x".repeat(500) }).title).toHaveLength(120);
    expect(cleanText(null)).toEqual({ title: "", subtitle: "", author: "", preface: "" });
  });

  it("numele generațiilor", () => {
    expect(generationTitle(4)).toBe("Generația a IV-a");
    expect(generationOf(-3, "Ana")).toBe("Generația străbunicilor lui Ana");
    expect(generationOf(-6, "Ana")).toBe("Cu 6 generații înaintea lui Ana");
    expect(generationOf(2, "Ana")).toBe("Generația nepoților lui Ana");
  });

  it("poza de profil: cea încărcată, altfel cea din Google, mai mare", () => {
    expect(photoUrl({ photoId: "abc", accountImage: "https://lh3.googleusercontent.com/a/x=s96-c" })).toBe("/api/document/abc");
    expect(photoUrl({ photoId: null, accountImage: "https://lh3.googleusercontent.com/a/x=s96-c" })).toBe("https://lh3.googleusercontent.com/a/x=s600-c");
    expect(photoUrl({ photoId: null, accountImage: null })).toBeNull();
  });

  it("cei în viață: tot, doar numele sau deloc", () => {
    const ana = people.ana;
    expect(shownPerson(ana, "tot")).toBe(ana);
    expect(shownPerson(ana, "nume")).toMatchObject({ name: "Ana Igna", birthYear: null, birthPlace: null });
    expect(shownPerson(ana, "ascunsi")).toBeNull();
    expect(shownPerson(people.avram, "ascunsi")).toBe(people.avram);
  });
});
