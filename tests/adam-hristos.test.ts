import { describe, expect, it } from "vitest";
import { EPOCHS, FLOOD_AM, VERSIONS, chainYears, indexAll, subLine, years, type BNode } from "@/lib/adam-hristos";
import { layoutEpoch } from "@/components/AdamHristos";

describe("De la Adam la Hristos", () => {
  const ys = new Map(chainYears().map((r) => [r.id, r]));

  it("anii de la facerea lumii ies ca în textul ebraic", () => {
    expect(ys.get("adam")).toMatchObject({ born: 0, died: 930 });
    expect(ys.get("noe")!.born).toBe(1056);
    expect(ys.get("noe")!.born + 600).toBe(FLOOD_AM);
    expect(ys.get("metusala")!.died).toBe(FLOOD_AM); // a murit în anul potopului
    expect(ys.get("arpacsad")!.born).toBe(FLOOD_AM + 2); // „la doi ani după potop”
    expect(ys.get("avraam")!.born).toBe(1948);
    expect(ys.get("sem")!.died).toBeGreaterThan(ys.get("avraam")!.died); // Sem a trăit mai mult decât Avraam
    expect(ys.get("lameh")!.born + 56).toBe(ys.get("adam")!.died);
    // Iacov avea 130 de ani când a venit în Egipt, iar Iosif 39.
    expect(ys.get("iacov")!.born + 130).toBe(ys.get("iosif-eg")!.born + 39);
  });

  it("totalurile din tabelul cu cele trei texte se potrivesc cu cifrele de pe rânduri", () => {
    const sum = (k: "mt" | "lxx" | "sp", from: number, to: number) => VERSIONS.slice(from, to).reduce((a, v) => a + (v[k] ?? 0), 0);
    expect([sum("mt", 0, 10), sum("lxx", 0, 10), sum("sp", 0, 10)]).toEqual([1656, 2242, 1307]);
    expect([sum("mt", 10, 20), sum("lxx", 10, 20), sum("sp", 10, 20)]).toEqual([292, 1072, 942]);
  });

  it("fiecare persoană are un id unic și trimiteri la Biblie", () => {
    const seen = new Set<string>();
    const walk = (n: BNode) => {
      expect(seen.has(n.id), n.id).toBe(false);
      seen.add(n.id);
      expect(n.refs.length, n.id).toBeGreaterThan(3);
      (n.kids ?? []).forEach(walk);
    };
    EPOCHS.forEach((e) => e.roots.forEach(walk));
    expect(indexAll().size).toBe(seen.size);
  });

  it("linia lui Hristos nu se rupe în niciun arbore și ajunge la Isus", () => {
    const idx = indexAll();
    for (const [id, { node, parent }] of idx) {
      if (node.main && parent && id !== "isus") expect(parent.main, `${id} are părintele în afara liniei`).toBe(true);
    }
    expect(idx.get("isus")!.node.main).toBe(true);
    expect(idx.get("eli")!.node.luke).toBe(true);
  });

  it("nodurile din desen nu se suprapun, iar Iosif stă sub Eli", () => {
    for (const e of EPOCHS) {
      const { placed } = layoutEpoch(e);
      const ps = [...placed.values()];
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        if (a.y === b.y) expect(Math.abs(a.x - b.x), `${e.id}: ${a.n.id} / ${b.n.id}`).toBeGreaterThanOrEqual(128);
      }
    }
    const last = layoutEpoch(EPOCHS[EPOCHS.length - 1]).placed;
    expect(last.get("iosif")!.depth).toBe(last.get("eli")!.depth + 1);
  });

  it("scrie anii corect în română", () => {
    expect(years(1)).toBe("1 an");
    expect(years(17)).toBe("17 ani");
    expect(years(930)).toBe("930 de ani");
    expect(years(110)).toBe("110 ani");
    expect(years(120)).toBe("120 de ani");
    expect(subLine({ id: "x", name: "X", reign: "40 de ani", refs: "Rut 4" })).toBe("a domnit 40 de ani");
  });
});
