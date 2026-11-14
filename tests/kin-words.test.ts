import { describe, expect, it } from "vitest";
import { kinLabel } from "@/lib/kin-words";
import { buildGraph, kinship, type KinTerm, type Sex } from "@/lib/kinship";
import { LOCALES, type Locale } from "@/i18n/locales";

/** Aceleași legături, în fiecare limbă: tată, străbunic, nepoată, frate după tată, nepoată de frate, frate al bunicului, vară primară… */
const CASES: [KinTerm, Sex][] = [
  [{ t: "blood", up: 1, down: 0 }, "M"],
  [{ t: "blood", up: 3, down: 0 }, "M"],
  [{ t: "blood", up: 0, down: 2 }, "F"],
  [{ t: "blood", up: 1, down: 1, half: "M" }, "M"],
  [{ t: "blood", up: 1, down: 2 }, "F"],
  [{ t: "blood", up: 3, down: 1 }, "M"],
  [{ t: "blood", up: 2, down: 2 }, "F"],
  [{ t: "blood", up: 3, down: 3 }, "F"],
  [{ t: "blood", up: 3, down: 2 }, "M"],
  [{ t: "parentSpouse", parent: "M", when: "after", order: 2 }, "F"],
  [{ t: "parentSpouse", parent: "M", when: "before", order: 1 }, "F"],
  [{ t: "siblingInLaw" }, "F"],
  [{ t: "parentInLaw" }, "F"],
  [{ t: "spouseKin", kin: { t: "blood", up: 2, down: 2 }, spouse: "M" }, "F"],
];

const WANT: Record<Locale, string[]> = {
  ro: ["tată", "străbunic", "nepoată", "frate după tată", "nepoată de frate", "frate al bunicului/bunicii", "vară primară", "vară de-a doua",
    "văr primar, dintr-o generație mai veche", "mamă vitregă", "prima soție a tatălui", "cumnată", "soacră", "rudă prin alianță: vară primară, din neamul soțului"],
  "en-GB": ["father", "great-grandfather", "granddaughter", "paternal half-brother", "niece", "great-uncle", "first cousin", "second cousin",
    "first cousin once removed", "stepmother", "father’s first wife", "sister-in-law", "mother-in-law", "relative by marriage: first cousin, on the husband’s side"],
  "en-US": ["father", "great-grandfather", "granddaughter", "paternal half-brother", "niece", "great-uncle", "first cousin", "second cousin",
    "first cousin once removed", "stepmother", "father’s first wife", "sister-in-law", "mother-in-law", "relative by marriage: first cousin, on the husband’s side"],
  fr: ["père", "arrière-grand-père", "petite-fille", "demi-frère par le père", "nièce", "grand-oncle", "cousine germaine", "cousine issue de germain",
    "cousin germain, d’une génération plus ancienne", "belle-mère", "première épouse du père", "belle-sœur", "belle-mère", "parente par alliance : cousine germaine, du côté du mari"],
  es: ["padre", "bisabuelo", "nieta", "medio hermano por parte de padre", "sobrina", "tío abuelo", "prima hermana", "prima segunda",
    "primo hermano, de una generación anterior", "madrastra", "primera esposa del padre", "cuñada", "suegra", "pariente política: prima hermana, por parte del esposo"],
  nl: ["vader", "overgrootvader", "kleindochter", "halfbroer van vaderskant", "nicht", "oudoom", "volle nicht", "verre nicht",
    "volle neef, uit een oudere generatie", "stiefmoeder", "eerste vrouw van de vader", "schoonzus", "schoonmoeder", "aangetrouwde familie: volle nicht, van de kant van de man"],
  de: ["Vater", "Urgroßvater", "Enkelin", "Halbbruder väterlicherseits", "Nichte", "Großonkel", "Cousine", "Cousine 2. Grades",
    "Cousin, aus einer älteren Generation", "Stiefmutter", "erste Ehefrau des Vaters", "Schwägerin", "Schwiegermutter", "angeheiratet: Cousine, aus der Familie des Ehemanns"],
  it: ["padre", "bisnonno", "nipote", "fratello per parte di padre", "nipote (figlia di fratello o sorella)", "prozio", "cugina", "cugina di secondo grado",
    "cugino, di una generazione precedente", "matrigna", "prima moglie del padre", "cognata", "suocera", "parente acquisita: cugina, dalla parte del marito"],
  hu: ["apa", "dédapa", "unoka", "apai féltestvér", "unokahúg", "nagyszülő testvére", "unokatestvér", "másodunokatestvér",
    "unokatestvér, egy idősebb nemzedékből", "mostohaanya", "az apa első felesége", "sógornő", "anyós", "házasság révén rokon: unokatestvér, a férj családjából"],
  he: ["אב", "סבא רבא", "נכדה", "אח למחצה מצד האב", "אחיינית", "אח של סבא או סבתא", "בת דודה", "בת דודה שנייה",
    "בן דוד, מדור מבוגר יותר", "אם חורגת", "בת הזוג הראשונה של האב", "גיסה", "חותנת או חמות", "קרבה מנישואין: בת דודה, מצד הבעל"],
};

describe("numele rudeniilor în fiecare limbă", () => {
  it.each(LOCALES)("%s", (l) => {
    expect(CASES.map(([term, sex]) => kinLabel(term, sex, l))).toEqual(WANT[l]);
  });

  it("niciun nume gol sau „undefined”, până departe în arbore", () => {
    const sexes: Sex[] = ["M", "F", "U"];
    for (const l of LOCALES) for (const sex of sexes) for (let up = 0; up <= 12; up++) for (let down = 0; down <= 12; down++) {
      if (up === 0 && down === 0) continue;
      const w = kinLabel({ t: "blood", up, down }, sex, l);
      expect(w.trim().length > 0 && !/undefined|NaN/.test(w), `${l} ${sex} ${up}/${down}: „${w}”`).toBe(true);
    }
  });

  it("kinship() dă și legătura, nu doar numele românesc", () => {
    const people = [{ id: "ego", sex: "M" as const }, { id: "tata", sex: "M" as const }, { id: "mama", sex: "F" as const }, { id: "sora", sex: "F" as const }, { id: "cumnat", sex: "M" as const }];
    const g = buildGraph(people, [
      { type: "parent_child", a: "tata", b: "ego" }, { type: "parent_child", a: "mama", b: "ego" },
      { type: "parent_child", a: "tata", b: "sora" }, { type: "parent_child", a: "mama", b: "sora" },
      { type: "partnership", a: "sora", b: "cumnat" },
    ]);
    const k = kinship(g, "ego", "cumnat")!;
    expect(k).toMatchObject({ label: "cumnat", term: { t: "siblingInLaw" }, sex: "M", degree: null });
    expect(kinLabel(k.term, k.sex, "de")).toBe("Schwager");
    expect(kinLabel(kinship(g, "ego", "sora")!.term, "F", "fr")).toBe("sœur");
  });
});
