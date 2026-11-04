import { describe, it, expect } from "vitest";
import { buildGraph, ancestorsOf, type Rel, type Sex } from "@/lib/kinship";
import { descendants } from "@/lib/family";
import { layoutSingle, layoutTwin, lineRoot, twinParts, TREE, type Scene } from "@/lib/tree-layout";

/**
 * Două spițe, ca la Ioan Daniel: neamul Igna de la Mărjel (prin Gavril și Avram) și neamul Dadului de la Petrea (prin Dadu și Floarea).
 * Avram mai are o fată, Mariana, cu Iosefina (discretă); Gavril mai are copii (Ana, cu familie), Mărjel încă un fiu (Ilie, cu urmași);
 * Floarea are un frate, Toma, cu copii, iar Petrea încă o fiică, Ileana.
 */
const P: [string, Sex, number][] = [
  ["marjel", "M", 1850], ["m-sotie", "F", 1852], ["gavril", "M", 1890], ["onita", "F", 1895], ["ilie", "M", 1885], ["ilie-sotie", "F", 1887],
  ["verisor1", "M", 1915], ["verisor2", "F", 1918], ["ana", "F", 1935], ["ana-sot", "M", 1933], ["ana-fiu", "M", 1960],
  ["avram", "M", 1932], ["iosefina", "F", 1934], ["mariana", "F", 1955], ["floarea", "F", 1936],
  ["daniel", "M", 1970], ["daniel-sotie", "F", 1972], ["daniel-fiu", "M", 2000], ["nicolae", "M", 1973],
  ["petrea", "M", 1855], ["p-sotie", "F", 1858], ["dadu", "M", 1895], ["dadu-sotie", "F", 1900], ["ileana", "F", 1898],
  ["toma", "M", 1940], ["toma-sotie", "F", 1942], ["toma-fiu", "M", 1965], ["toma-fiica", "F", 1968],
];
const kids = (a: string, b: string | null, ...cs: string[]): Rel[] => cs.flatMap((c) => [{ type: "parent_child", a, b: c } as Rel, ...(b ? [{ type: "parent_child", a: b, b: c } as Rel] : [])]);
const wed = (a: string, b: string, start?: string): Rel => ({ type: "partnership", a, b, start });
const rels: Rel[] = [
  wed("marjel", "m-sotie"), ...kids("marjel", "m-sotie", "ilie", "gavril"),
  wed("ilie", "ilie-sotie"), ...kids("ilie", "ilie-sotie", "verisor1", "verisor2"),
  wed("gavril", "onita"), ...kids("gavril", "onita", "avram", "ana"),
  wed("ana", "ana-sot"), ...kids("ana", "ana-sot", "ana-fiu"),
  wed("avram", "iosefina"), ...kids("avram", "iosefina", "mariana"),
  wed("avram", "floarea", "1958"), ...kids("avram", "floarea", "daniel", "nicolae"),
  wed("daniel", "daniel-sotie"), ...kids("daniel", "daniel-sotie", "daniel-fiu"),
  wed("petrea", "p-sotie"), ...kids("petrea", "p-sotie", "dadu", "ileana"),
  wed("dadu", "dadu-sotie"), ...kids("dadu", "dadu-sotie", "floarea", "toma"),
  wed("toma", "toma-sotie"), ...kids("toma", "toma-sotie", "toma-fiu", "toma-fiica"),
];
const g = buildGraph(P.map(([id, sex, birthYear]) => ({ id, sex, birthYear })), rels);
const discreet = new Set(["iosefina"]);
const drawn = (id: string) => !discreet.has(id);
const known = (id: string) => P.some(([x]) => x === id);
const egoPath = new Set(ancestorsOf(g, "daniel").map(([id]) => id));
const ids = (d: { id: string; children: { id: string }[] }): string[] => [d.id, ...d.children.flatMap((c) => ids(c as typeof d))];

/** Locul ocupat de fiecare familie pe rândul ei: persoana și soții desenați lângă ea (plăcuțe și frunze late de 100). */
function overlaps(scene: Scene, skip: Set<string>) {
  const rows = new Map<number, [number, number, string][]>();
  for (const n of scene.nodes) {
    if (skip.has(n.node.id)) continue;
    const f = scene.fam.get(n.node.id)!, xs = [f.P, ...f.unions.map((u) => u.x)];
    rows.set(n.y, [...(rows.get(n.y) ?? []), [Math.min(...xs) - 50, Math.max(...xs) + 50, n.node.id]]);
  }
  const bad: string[] = [];
  for (const spans of rows.values()) {
    spans.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) if (spans[i][0] < spans[i - 1][1] - 0.5) bad.push(`${spans[i - 1][2]} / ${spans[i][2]}`);
  }
  return bad;
}

/** Ramurile pleacă în lături pe rândul părintelui și abia apoi urcă: pe drumul acela nu trebuie să stea altă familie. */
function crossings(scene: Scene) {
  const rows = new Map<number, { id: string; l: number; r: number }[]>();
  for (const n of scene.nodes) {
    const f = scene.fam.get(n.node.id)!, xs = [f.P, ...f.unions.map((u) => u.x)];
    rows.set(n.y, [...(rows.get(n.y) ?? []), { id: n.node.id, l: Math.min(...xs) - 50, r: Math.max(...xs) + 50 }]);
  }
  // Ramurile din nodul părinților trec firesc pe după plăcuțele lor.
  const c = scene.couple, parents = c ? [c.father, c.mother, `${c.father}+${c.mother}`] : [];
  const bad: string[] = [];
  for (const n of scene.nodes) {
    if (n.trunk || !n.parent) continue;
    const p = n.parent, f = scene.fam.get(p.node.id)!, u = f.unions.find((x) => x.sp === n.node.via);
    const from = u ? u.knot : f.P, to = scene.fam.get(n.node.id)!.P, a = Math.min(from, to), b = Math.max(from, to);
    const own = parents.includes(p.node.id) ? parents : [p.node.id];
    for (const s of rows.get(p.y) ?? []) if (!own.includes(s.id) && s.l < b && s.r > a) bad.push(`${p.node.id} → ${n.node.id} peste ${s.id}`);
  }
  return bad;
}

describe("cele două spițe", () => {
  const parts = twinParts(g, drawn, "daniel")!;

  it("pornește implicit de la cel mai vechi strămoș pe linia bărbătească, de o parte și de alta", () => {
    expect(parts).not.toBeNull();
    expect(parts.father).toBe("avram");
    expect(parts.mother).toBe("floarea");
    expect(parts.patRoot).toBe("marjel");
    expect(parts.matRoot).toBe("petrea");
  });

  it("familia comună a părinților se desenează o singură dată, în coroană", () => {
    expect(parts.crown.children.map((c) => c.id)).toEqual(["daniel", "nicolae"]);
    const left = ids(parts.left), right = ids(parts.right);
    // Avram rămâne în neamul lui doar cu Mariana (din altă relație); Floarea, în neamul ei, fără copii.
    expect(left).toContain("mariana");
    expect(left).not.toContain("daniel");
    expect(right).not.toContain("daniel");
    expect(right).toContain("toma-fiu");
    const find = (d: typeof parts.left, id: string): typeof parts.left | null => (d.id === id ? d : d.children.map((c) => find(c, id)).find(Boolean) ?? null);
    expect(find(parts.left, "avram")!.partners).not.toContain("floarea");
    expect(find(parts.right, "floarea")!.partners).not.toContain("avram");
    expect(find(parts.right, "floarea")!.children).toEqual([]);
  });

  it("se poate alege alt strămoș pentru fiecare spiță, dar doar dintre strămoșii părintelui", () => {
    expect(twinParts(g, drawn, "daniel", "gavril", "dadu")!.patRoot).toBe("gavril");
    expect(twinParts(g, drawn, "daniel", "gavril", "dadu")!.matRoot).toBe("dadu");
    // Un om care nu e strămoș al tatălui nu poate fi rădăcina spiței lui: rămâne cea implicită.
    expect(twinParts(g, drawn, "daniel", "petrea", null)!.patRoot).toBe("marjel");
  });

  it("cu doi tați trecuți (și un „Tată necunoscut” rămas lângă cel adevărat), spița tatălui urcă prin cel adevărat", () => {
    const g2 = buildGraph([{ id: "necunoscut", sex: "M" as Sex, birthYear: null }, ...P.map(([id, sex, birthYear]) => ({ id, sex, birthYear }))],
      [{ type: "parent_child", a: "necunoscut", b: "daniel" }, ...rels]);
    const parts = twinParts(g2, drawn, "daniel", null, null, (id) => id === "necunoscut")!;
    expect(parts.father).toBe("avram");
    expect(parts.patRoot).toBe("marjel");
  });

  it("cu tatăl trecut în două fișe, spița urcă prin cel care e soțul mamei și are strămoși", () => {
    const g2 = buildGraph([{ id: "avram2", sex: "M" as Sex, birthYear: 1932 }, ...P.map(([id, sex, birthYear]) => ({ id, sex, birthYear }))],
      [{ type: "parent_child", a: "avram2", b: "daniel" }, ...rels]);
    const parts = twinParts(g2, drawn, "daniel")!;
    expect(parts.father).toBe("avram");
    expect(parts.patRoot).toBe("marjel");
  });

  it("nu leagă spițele când un părinte lipsește sau e discret, ori când neamurile se întâlnesc deja", () => {
    expect(twinParts(g, drawn, "mariana")).toBeNull(); // mama ei e discretă
    expect(twinParts(g, drawn, "avram")).not.toBeNull();
    expect(twinParts(g, drawn, "marjel")).toBeNull(); // fără părinți
    // Verii care se căsătoresc: mama e și ea din neamul Igna, deci un singur copac le cuprinde pe amândouă.
    const g2 = buildGraph([...P.map(([id, sex, birthYear]) => ({ id, sex, birthYear })), { id: "copil", sex: "F" as Sex, birthYear: 1990 }],
      [...rels, ...kids("ana-fiu", "verisor2", "copil")]);
    expect(twinParts(g2, drawn, "copil")).toBeNull();
  });

  it("spița urcă doar din tată în tată: nu trece pe la o femeie, iar un „Tată necunoscut” fără părinți nu e rădăcină", () => {
    const g3 = buildGraph([{ id: "f", sex: "F" }, { id: "tata", sex: "M" }, { id: "mama", sex: "F" }, { id: "bunic", sex: "M" }],
      [{ type: "parent_child", a: "tata", b: "f" }, { type: "parent_child", a: "mama", b: "f" }, { type: "parent_child", a: "bunic", b: "mama" }]);
    expect(lineRoot(g3, "f")).toBe("tata");
    expect(lineRoot(g3, "f", (id) => id === "tata")).toBe("f");
    // Tatăl lui Avram nu e legat de el, doar mama Ana: spița lui Avram se oprește la el, nu urcă la tatăl Anei.
    const g4 = buildGraph([{ id: "avram", sex: "M" }, { id: "ana", sex: "F" }, { id: "iosif", sex: "M" }, { id: "floarea", sex: "F" }],
      [{ type: "parent_child", a: "ana", b: "avram" }, { type: "parent_child", a: "iosif", b: "ana" }, { type: "parent_child", a: "iosif", b: "floarea" }]);
    expect(lineRoot(g4, "avram")).toBe("avram");
    expect(lineRoot(g4, "floarea")).toBe("iosif");
    // Dintre doi tați trecuți, urcăm prin cel cu strămoși.
    const g5 = buildGraph([{ id: "c", sex: "M" }, { id: "dublu", sex: "M" }, { id: "real", sex: "M" }, { id: "marjel", sex: "M" }],
      [{ type: "parent_child", a: "dublu", b: "c" }, { type: "parent_child", a: "real", b: "c" }, { type: "parent_child", a: "marjel", b: "real" }]);
    expect(lineRoot(g5, "c")).toBe("marjel");
  });

  it("așezarea: trunchiurile se unesc în părinți, fiecare om apare o dată și nicio familie nu calcă peste alta", () => {
    const scene = layoutTwin(parts, known, egoPath);
    const people = scene.nodes.map((n) => n.node.id).filter((id) => known(id));
    expect(new Set(people).size).toBe(people.length);
    for (const id of ["marjel", "petrea", "avram", "floarea", "daniel", "daniel-fiu", "toma-fiica", "verisor1", "mariana"]) expect(people).toContain(id);
    const c = scene.couple!;
    expect(scene.fam.get("avram")!.P).toBe(c.knot - TREE.half);
    expect(scene.fam.get("floarea")!.P).toBe(c.knot + TREE.half);
    const [left, right] = scene.bases;
    expect(left.root).toBe("marjel");
    expect(right.root).toBe("petrea");
    expect(left.x).toBeLessThan(c.knot);
    expect(right.x).toBeGreaterThan(c.knot);
    // Coroana crește din nodul părinților: Daniel stă pe trunchiul ei, deasupra nodului.
    const daniel = scene.nodes.find((n) => n.node.id === "daniel")!;
    expect(daniel.trunk).toBe(true);
    expect(daniel.y).toBeLessThan(c.y);
    expect(overlaps(scene, new Set([parts.crown.id]))).toEqual([]);
    // Neamul tatălui crește spre stânga, al mamei spre dreapta.
    const x = (id: string) => scene.nodes.find((n) => n.node.id === id)!.x;
    expect(x("verisor1")).toBeLessThan(left.x);
    expect(x("toma-fiu")).toBeGreaterThan(right.x);
    // Drumul până la Daniel e evidențiat pe ambele trunchiuri.
    expect(scene.trunk.filter((s) => s.onPath).length).toBeGreaterThanOrEqual(5);
    expect(scene.W).toBeGreaterThanOrEqual(680);
    expect(crossings(scene)).toEqual([]);
    // Neamul tatălui e oglindit: soțiile spre margine (stânga), la mama spre dreapta; la mijloc, liniile de sânge față în față.
    const fm = scene.fam.get("marjel")!, fp = scene.fam.get("petrea")!;
    expect(fm.unions[0].x).toBeLessThan(fm.P);
    expect(fp.unions[0].x).toBeGreaterThan(fp.P);
    // Părinții stau la mijloc între trunchiuri, iar bunicii se apleacă deja unul spre altul.
    expect(Math.abs(c.knot - (left.x + right.x) / 2)).toBeLessThan(1);
    expect(right.x - left.x).toBeGreaterThanOrEqual(419);
    expect(x("gavril")).toBeGreaterThan(x("marjel"));
    expect(x("dadu")).toBeLessThan(x("petrea"));
  });

  it("ramurile copiilor pleacă din nodul părinților fără să treacă peste unchii de pe același rând", () => {
    // Fără Mariana (tatăl nu are alți copii), cu un unchi fără urmași lângă trunchi și cu opt copii în coroană, care se întind peste el.
    const extra: [string, Sex][] = [["unchi", "M"], ...[1, 2, 3, 4, 5, 6].map((i): [string, Sex] => [`sora${i}`, "F"])];
    const g5 = buildGraph([...P.map(([id, sex, birthYear]) => ({ id, sex, birthYear })), ...extra.map(([id, sex]) => ({ id, sex }))],
      [...rels.filter((r) => !(r.type === "parent_child" && r.b === "mariana") && !(r.type === "partnership" && r.b === "iosefina")),
        ...kids("gavril", "onita", "unchi"), ...kids("avram", "floarea", ...extra.slice(1).map(([id]) => id))]);
    const p5 = twinParts(g5, drawn, "daniel")!;
    const path5 = new Set(ancestorsOf(g5, "daniel").map(([id]) => id));
    const scene = layoutTwin(p5, (id) => extra.some(([x]) => x === id) || known(id), path5);
    expect(p5.crown.children).toHaveLength(8);
    expect(overlaps(scene, new Set([p5.crown.id]))).toEqual([]);
    expect(crossings(scene)).toEqual([]);
  });

  it("ramurile scurte de jos pot crește spre mijloc, sub coroană, fără să încurce trunchiurile", () => {
    // Mărjel are un tată, Ion, și un frate fără urmași: o ramură care se termină cu mult sub părinți.
    const g4 = buildGraph([...P.map(([id, sex, birthYear]) => ({ id, sex, birthYear })), { id: "ion", sex: "M" as Sex, birthYear: 1820 }, { id: "fratele", sex: "M" as Sex, birthYear: 1853 }],
      [...rels, ...kids("ion", null, "marjel", "fratele")]);
    const p4 = twinParts(g4, drawn, "daniel")!;
    expect(p4.patRoot).toBe("ion");
    const path4 = new Set(ancestorsOf(g4, "daniel").map(([id]) => id));
    const scene = layoutTwin(p4, (id) => id === "ion" || id === "fratele" || known(id), path4);
    const x = (id: string) => scene.nodes.find((n) => n.node.id === id)!.x;
    const [left, right] = scene.bases;
    expect(left.root).toBe("ion");
    expect(x("fratele")).toBeGreaterThan(left.x);
    expect(x("fratele")).toBeLessThan(right.x);
    // Ramurile care urcă până lângă părinți rămân spre margine.
    expect(x("verisor1")).toBeLessThan(left.x);
    expect(x("toma-fiu")).toBeGreaterThan(right.x);
    expect(overlaps(scene, new Set([p4.crown.id]))).toEqual([]);
    expect(crossings(scene)).toEqual([]);
    expect(Math.abs(scene.couple!.knot - (left.x + right.x) / 2)).toBeLessThan(1);
  });

  it("copacul cu o singură rădăcină rămâne cum era: trunchiul de la Mărjel până la Daniel și mai departe", () => {
    const scene = layoutSingle(descendants(g, drawn, "marjel"), known, egoPath);
    const trunk = scene.nodes.filter((n) => n.trunk).map((n) => n.node.id);
    expect(trunk).toEqual(["marjel", "gavril", "avram", "daniel", "daniel-fiu"]);
    expect(scene.bases).toHaveLength(1);
    expect(scene.couple).toBeUndefined();
    expect(overlaps(scene, new Set())).toEqual([]);
    expect(crossings(scene)).toEqual([]);
  });
});
