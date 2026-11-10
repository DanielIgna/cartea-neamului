import { describe, expect, it } from "vitest";
import { BIBLE_STEPS, CHURCH_ERAS, HEROES, STEP_QUOTES, WITNESS_QUOTES, churchEraOf } from "@/lib/istoria-bisericii";
import { loadMessages } from "@/i18n/messages";
import { LOCALES } from "@/i18n/locales";
import { roBiserica } from "@/i18n/messages/biserica/ro";

const church = roBiserica.Church;
type Verse = { text: string; ref: string };

describe("istoria Bisericii", () => {
  it("are epocile în ordine, fără goluri", () => {
    for (let i = 1; i < CHURCH_ERAS.length; i++) expect(CHURCH_ERAS[i].from).toBeLessThanOrEqual(CHURCH_ERAS[i - 1].to + 1);
    expect(new Set(CHURCH_ERAS.map((e) => e.id)).size).toBe(CHURCH_ERAS.length);
  });
  it("așezarea și textele se potrivesc: fiecare martor, erou și pas are textul lui", () => {
    const eras = church.eras as Record<string, { w: Record<string, { quote?: string }> }>;
    expect(Object.keys(eras).sort()).toEqual(CHURCH_ERAS.map((e) => e.id).sort());
    for (const e of CHURCH_ERAS) {
      expect(Object.keys(eras[e.id].w), e.id).toEqual(e.witnesses.map((x) => x.key));
      for (const x of e.witnesses) expect(Boolean(eras[e.id].w[x.key].quote), `${e.id}.${x.key}`).toBe(WITNESS_QUOTES.has(`${e.id}.${x.key}`));
    }
    expect(Object.keys(church.heroes).sort()).toEqual(HEROES.map((h) => h.id).sort());
    const steps = church.steps as Record<string, { quote?: string }>;
    expect(Object.keys(steps)).toEqual([...BIBLE_STEPS]);
    for (const b of BIBLE_STEPS) expect(Boolean(steps[b].quote), b).toBe(STEP_QUOTES.has(b));
  });
  it("în fiecare limbă, fiecare epocă și fiecare erou are verset cu trimitere", async () => {
    for (const l of LOCALES) {
      const c = ((await loadMessages(l)) as unknown as typeof import("@/i18n/messages/ro").ro).Church;
      const eras = c.eras as Record<string, { verse: Verse }>;
      const heroes = c.heroes as Record<string, { verse: Verse }>;
      for (const v of [c.promise, ...Object.values(eras).map((e) => e.verse), ...Object.values(heroes).map((h) => h.verse)]) {
        expect(v.text.length, l).toBeGreaterThan(10);
        expect(v.ref, l).toMatch(/\d+[:,]\d+/);
      }
    }
  });
  it("germana și maghiara scriu trimiterile cu virgulă, celelalte cu două puncte", async () => {
    expect(((await loadMessages("de")) as unknown as typeof import("@/i18n/messages/ro").ro).Church.promise.ref).toBe("Matthäus 16,18");
    expect(((await loadMessages("hu")) as unknown as typeof import("@/i18n/messages/ro").ro).Church.promise.ref).toBe("Máté 16,18");
    expect(((await loadMessages("fr")) as unknown as typeof import("@/i18n/messages/ro").ro).Church.promise.ref).toBe("Matthieu 16:18");
  });
  it("are eroii ceruți și pașii Bibliei românești", () => {
    expect(HEROES.map((h) => h.id)).toEqual(expect.arrayContaining(["wurmbrand", "moldoveanu", "dorz"]));
    expect(church.steps.b5.year).toBe("1688");
  });
  it("găsește epoca unui an", () => {
    expect(churchEraOf(1521)?.id).toBe("reforma");
    expect(churchEraOf(1950)?.id).toBe("secolul-xx");
  });
});
