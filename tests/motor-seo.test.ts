import { describe, expect, it } from "vitest";
import { judge, lineFrequency, shingles, similarity, uniqueWords, MIN_UNIQUE_WORDS } from "@/lib/motor-seo/calitate";
import { parseWiki, wikiLines, titlesFor, hasFacts } from "@/lib/motor-seo/wikipedia";
import { DEFAULTS, nextPace, evaluate } from "@/lib/motor-seo/motor";
import { getUat } from "@/lib/continut/uat";
import { getCounty } from "@/lib/continut/localitati";
import { uatGate } from "@/lib/continut/prag";

const SANCRAIU = `Sâncraiu (în maghiară Kalotaszentkirály) este o comună în județul Cluj, Transilvania, România, formată din satele Alunișu, Brăișoru, Domoșu, Horlacea și Sâncraiu (reședința).
Demografie
Conform recensământului efectuat în 2011, populația comunei Sâncraiu se ridică la 1.567 de locuitori, în scădere față de recensământul anterior din 2002, când fuseseră înregistrați 1.642 de locuitori. Majoritatea locuitorilor sunt maghiari (74,38%), cu o minoritate de români (21,76%). Pentru 3,13% din populație, apartenența etnică nu este cunoscută. Din punct de vedere confesional, majoritatea locuitorilor sunt reformați (68,22%), dar există și minorități de ortodocși (20,1%) și romano-catolici (5,74%). Pentru 3,25% din populație, nu este cunoscută apartenența confesională.`;

describe("controlul de calitate", () => {
  it("asemănarea: aceeași pagină 100%, pagini diferite puțin", () => {
    const a = shingles(["unu doi trei patru cinci șase șapte opt nouă zece"]);
    expect(similarity(a, a)).toBe(100);
    expect(similarity(a, shingles(["cu totul alte cuvinte despre altceva decât înainte aici"]))).toBe(0);
  });
  it("propozițiile repetate pe multe pagini nu sunt cuvinte unice", () => {
    const common = "Aceasta este o propoziție comună tuturor paginilor.";
    const pages = Array.from({ length: 10 }, (_, i) => [common, `Pagina ${i} are ceva propriu numai al ei.`]);
    const f = lineFrequency(pages);
    expect(uniqueWords(pages[0], f)).toBe(8);
  });
  it("o pagină scurtă e ținută noindex, cu motivul", () => {
    const q = judge({ lines: ["Prea puțin text."], facts: ["a"] }, new Map(), []);
    expect(q.ok).toBe(false);
    expect(q.reasons.join(" ")).toMatch(/cuvinte unice/);
    expect(q.reasons.join(" ")).toMatch(/date proprii/);
  });
});

describe("Wikipedia: doar date, propozițiile sunt ale noastre", () => {
  const f = parseWiki(SANCRAIU, "Comuna Sâncraiu, Cluj");
  it("citește recensămintele, etniile, confesiunile și numele maghiar", () => {
    expect(f.census).toEqual({ year: 2011, pop: 1567, prevYear: 2002, prevPop: 1642 });
    expect(f.ethnic).toEqual([["maghiari", 74.38], ["români", 21.76]]);
    expect(f.confession.map((x) => x[0])).toEqual(["reformați", "ortodocși", "romano-catolici"]);
    expect(f.hu).toBe("Kalotaszentkirály");
    expect(f.url).toContain("ro.wikipedia.org/wiki/Comuna_S");
    expect(hasFacts(f)).toBe(true);
  });
  it("nu copiază text din articol", () => {
    const u = getUat("cluj", "sancraiu")!;
    const { lines, guides, facts } = wikiLines(u, f);
    for (const l of lines) expect(SANCRAIU.includes(l)).toBe(false);
    expect(lines.join(" ")).toMatch(/reformați \(68,2%\), cu registrele reformate/);
    expect(guides).toContain("/ghid/registrele-catolice-si-protestante");
    expect(facts.length).toBeGreaterThanOrEqual(3);
  });
  it("un articol fără tipar nu dă date ghicite", () => {
    expect(hasFacts(parseWiki("Un text oarecare despre altceva.", "X"))).toBe(false);
  });
  it("titlurile încercate", () => {
    const u = getUat("cluj", "sancraiu")!;
    expect(titlesFor(u, getCounty("cluj")!)[0]).toBe("Comuna Sâncraiu, Cluj");
  });
  it("cu datele din Wikipedia, pagina are mai multe cuvinte unice decât fără", () => {
    const u = getUat("cluj", "sancraiu")!, c = getCounty("cluj")!;
    const without = evaluate(u, c, {}).quality, withWiki = evaluate(u, c, { wiki: f }).quality;
    expect(withWiki.unique).toBeGreaterThan(without.unique + 80);
    expect(withWiki.facts).toBeGreaterThan(without.facts);
    expect(without.unique).toBeLessThan(MIN_UNIQUE_WORDS);
  });
});

describe("ritmul", () => {
  const s = { ...DEFAULTS };
  it("crește cu 25 când Google ia peste 70%, până la maxim", () => {
    expect(nextPace(s, 80, 30).perDay).toBe(75);
    expect(nextPace({ ...s, perDay: 190 }, 80, 30).perDay).toBe(200);
  });
  it("scade la jumătate sub 50%", () => expect(nextPace({ ...s, perDay: 120 }, 40, 30).perDay).toBe(60));
  it("nu schimbă nimic cu prea puține verificări sau cu ritmul fixat de mână", () => {
    expect(nextPace(s, 90, 5).perDay).toBe(50);
    expect(nextPace({ ...s, autoRamp: false }, 10, 50).perDay).toBe(50);
  });
});

describe("paginile comunelor intră în Google doar publicate", () => {
  it("noindex până la publicare, apoi indexabilă; cele subțiri rămân afară", () => {
    const u = getUat("cluj", "sancraiu")!;
    expect(uatGate(u)).toMatch(/coada/);
    expect(uatGate(u, () => true)).toBeNull();
  });
});
