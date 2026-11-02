import { describe, it, expect } from "vitest";
import { parseGedcom, writeGedcom } from "@/lib/gedcom";
import { demoGedcom } from "@/lib/demo-data";

const SAMPLE = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME Toader /Pop/
1 SEX M
1 BIRT
2 DATE ABT 1898
2 PLAC Ieud, Maramureș
1 DEAT
2 DATE 1967
1 NOTE Tâmplar și cântăreț
2 CONT de strană.
1 FAMS @F1@
0 @I2@ INDI
1 NAME Irina /Pop/
1 NAME Irina /Bizău/
2 TYPE birth
1 SEX F
1 FAMS @F1@
0 @I3@ INDI
1 NAME Gheorghe /Pop/
1 SEX M
1 FAMC @F1@
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 MARR
2 DATE 1925
1 CHIL @I3@
0 TRLR`;

describe("GEDCOM", () => {
  it("citește persoane, nume de naștere, note pe mai multe rânduri și familii", () => {
    const g = parseGedcom(SAMPLE);
    expect(g.individuals).toHaveLength(3);
    const toader = g.individuals[0];
    expect(toader).toMatchObject({ given: "Toader", surname: "Pop", sex: "M", deceased: true, birth: { date: "ABT 1898", place: "Ieud, Maramureș" } });
    expect(toader.note).toBe("Tâmplar și cântăreț\nde strană.");
    expect(g.individuals[1].birthSurname).toBe("Bizău");
    expect(g.families[0]).toMatchObject({ husb: "@I1@", wife: "@I2@", children: ["@I3@"], marriage: { date: "1925" } });
  });

  it("scrie și recitește fără pierderi (round-trip)", () => {
    const data = demoGedcom();
    const back = parseGedcom(writeGedcom(data));
    expect(back.individuals).toHaveLength(data.individuals.length);
    expect(back.families).toHaveLength(data.families.length);
    const ana = back.individuals.find((i) => i.xref === "@I5@")!;
    expect(ana).toMatchObject({ given: "Ana", surname: "Pop", birthSurname: "Bud", sex: "F", birth: { date: "1932", place: "Botiza" } });
  });
});
