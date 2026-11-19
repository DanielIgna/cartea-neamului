import { describe, expect, it } from "vitest";
import { analyze, breaksTone, expectedCtr, learn, mergeIdeas, tokens, verdictOf, weightOf, type GscData, type StrategState } from "@/lib/seo/strateg";
import { changedPaths, fingerprintOf, planChecks, stuck, type GoogleState } from "@/lib/seo/google-anunt";
import { auditPages } from "@/lib/seo-audit";
import { seoKeywords } from "@/data/seo-keywords";
import { AUTOMATIONS } from "@/lib/autonomie";

const U = "https://carteaneamului.ro";
const row = (keys: string[], impressions: number, position: number, clicks = 0) => ({ keys, impressions, position, clicks, ctr: impressions ? clicks / impressions : 0 });
const kw = (query: string, impressions: number, position: number, prevPosition: number | null = null, clicks = 0) =>
  ({ query, impressions, position, prevPosition, clicks, ctr: impressions ? clicks / impressions : 0, prevImpressions: 0, isNew: prevPosition == null });

const pages = auditPages();
const guide = pages.find((p) => p.indexable && p.path.startsWith("/ghid/"))!;

describe("Strategul SEO: analiza", () => {
  const gsc: GscData = {
    queries: [
      kw("registre parohiale online", 300, 9, 8),
      kw("dosar pensie veteran razboi bunic", 80, 34),
      kw("pensie veteran razboi acte", 40, 40),
      kw("rugaciune pentru strabuni", 200, 30),
      kw("cartea neamului", 500, 1),
      kw("arbore genealogic", 400, 12, 7, 2),
    ],
    pages: [row([`${U}${guide.path}`], 900, 6, 3)],
    queryPages: [
      row(["registre parohiale online", `${U}${guide.path}`], 300, 9, 1),
      row(["cartea neamului", `${U}/`], 500, 1, 200),
      row(["arbore genealogic", `${U}${guide.path}`], 400, 12, 2),
    ],
  };
  const a = analyze({ gsc, pages, keywords: seoKeywords(), now: new Date("2026-11-19T10:00:00Z") });

  it("propune urcarea căutărilor de pe locurile 4–20 la pagina care există", () => {
    const near = a.ideas.find((i) => i.id === `aproape:${guide.path}`);
    expect(near?.queries).toEqual(["arbore genealogic", "registre parohiale online"]);
  });

  it("vede titlul care nu e apăsat față de locul lui", () => {
    expect(a.ideas.some((i) => i.id === `titlu:${guide.path}`)).toBe(true);
  });

  it("grupează căutările fără pagină într-o temă nouă și sare peste brand și regula de ton", () => {
    const teme = a.ideas.filter((i) => i.kind === "tema");
    expect(teme.some((t) => t.queries.includes("dosar pensie veteran razboi bunic") && t.queries.includes("pensie veteran razboi acte"))).toBe(true);
    expect(teme.flatMap((t) => t.queries)).not.toContain("rugaciune pentru strabuni");
    expect(a.skippedTone).toBeGreaterThan(0);
    expect(a.ideas.flatMap((i) => i.queries)).not.toContain("cartea neamului");
  });

  it("vede căutările care au coborât", () => {
    expect(a.ideas.some((i) => i.kind === "scadere" && i.queries.includes("arbore genealogic"))).toBe(true);
  });

  it("fără Search Console propune doar din planul de cuvinte", () => {
    const b = analyze({ gsc: null, pages, keywords: seoKeywords() });
    expect(b.ideas.every((i) => i.kind === "plan")).toBe(true);
    expect(b.perf).toEqual([]);
  });

  it("are unelte de bază corecte", () => {
    expect(tokens("Cum găsești certificatul de naștere al bunicului")).toEqual(["gasesti", "certificatul", "nastere", "bunicului"]);
    expect(breaksTone("Biblia familiei")).toBe(true);
    expect(expectedCtr(1)).toBeGreaterThan(expectedCtr(5));
    expect(expectedCtr(30)).toBe(0.01);
  });
});

describe("Strategul SEO: învățarea", () => {
  it("judecă rezultatul după 28 de zile", () => {
    expect(verdictOf({ clicks: 10, impressions: 500, position: 9 }, { clicks: 20, impressions: 600, position: 6 })).toBe("a-mers");
    expect(verdictOf({ clicks: 10, impressions: 500, position: 6 }, { clicks: 4, impressions: 400, position: 9 })).toBe("n-a-mers");
    expect(verdictOf({ clicks: 1, impressions: 50, position: 15 }, { clicks: 1, impressions: 55, position: 14.5 })).toBe("neclar");
  });

  it("urcă felurile de propuneri care au mers", () => {
    let l = learn({}, { kind: "titlu", cluster: "ghid" }, "a-mers");
    l = learn(l, { kind: "titlu", cluster: "ghid" }, "a-mers");
    l = learn(l, { kind: "tema", cluster: "ghid" }, "n-a-mers");
    expect(weightOf(l, "fel:titlu")).toBeGreaterThan(1);
    expect(weightOf(l, "fel:tema")).toBeLessThan(1);
    expect(weightOf(l, "fel:aproape")).toBe(1);
  });

  it("păstrează deciziile, uită respinsele după 90 de zile și măsoară ce e făcut de 28 de zile", () => {
    const now = new Date("2026-12-31T00:00:00Z");
    const base = { kind: "titlu" as const, title: "t", why: "", action: "", path: "/ghid/x", cluster: "ghid", queries: ["q"], impressions: 100, clicks: 2, position: 8, links: [], score: 1 };
    const prev: StrategState = { learned: {}, lastRun: null, perf: [], skippedTone: 0, gsc: true, ideas: [
      { ...base, id: "a", status: "nou", createdAt: "2026-11-01T00:00:00Z" },
      { ...base, id: "b", status: "respins", createdAt: "2026-08-01T00:00:00Z", decidedAt: "2026-09-01T00:00:00Z" },
      { ...base, id: "c", status: "facut", createdAt: "2026-11-01T00:00:00Z", decidedAt: "2026-11-20T00:00:00Z", doneAt: "2026-11-20T00:00:00Z", baseline: { clicks: 2, impressions: 100, position: 8 } },
      { ...base, id: "d", status: "acceptat", createdAt: "2026-11-01T00:00:00Z", decidedAt: "2026-12-01T00:00:00Z" },
    ] };
    const gsc: GscData = { queries: [], pages: [row([`${U}/ghid/x`], 200, 4, 12)], queryPages: [] };
    const m = mergeIdeas(prev, [{ ...base, id: "a", score: 5 }, { ...base, id: "d", score: 5 }, { ...base, id: "e", score: 3 }], gsc, now);
    const ids = m.ideas.map((i) => `${i.id}:${i.status}`);
    expect(ids).toContain("a:nou");
    expect(ids).toContain("e:nou");
    expect(ids).toContain("d:acceptat");
    expect(ids.filter((x) => x.startsWith("d:"))).toHaveLength(1);
    expect(ids.some((x) => x.startsWith("b:"))).toBe(false);
    expect(m.ideas.find((i) => i.id === "c")?.result?.verdict).toBe("a-mers");
    expect(m.learned["fel:titlu"]).toEqual({ tried: 1, wins: 1 });
    expect(m.measured).toBe(1);
  });
});

describe("Google în ziua schimbării", () => {
  it("la prima rulare nu pune tot site-ul la urmărit; apoi doar ce s-a schimbat", () => {
    const v = new Map([["/a", "1"], ["/b", "2"], ["/c", "3"]]);
    expect(changedPaths(v, {}, true)).toEqual([]);
    expect(changedPaths(v, { "/a": "1", "/b": "vechi" }, false)).toEqual(["/b", "/c"]);
    expect(fingerprintOf(v)).toBe(fingerprintOf(new Map([["/c", "3"], ["/a", "1"], ["/b", "2"]])));
    expect(fingerprintOf(v)).not.toBe(fingerprintOf(new Map([["/a", "1"]])));
  });

  it("verifică după 3 zile, apoi la 4 zile, de cel mult 4 ori", () => {
    const now = new Date("2026-11-20T06:00:00Z");
    const w = [
      { path: "/nou", added: "2026-11-19T06:00:00Z", checks: 0, lastAt: null, verdict: null },
      { path: "/gata", added: "2026-11-10T06:00:00Z", checks: 0, lastAt: null, verdict: null },
      { path: "/recent", added: "2026-11-10T06:00:00Z", checks: 1, lastAt: "2026-11-18T06:00:00Z", verdict: "NEUTRAL" },
      { path: "/blocat", added: "2026-10-01T06:00:00Z", checks: 4, lastAt: "2026-11-01T06:00:00Z", verdict: "NEUTRAL" },
    ];
    const p = planChecks(w, ["/schimbat"], now);
    expect(p.due.map((x) => x.path)).toEqual(["/gata"]);
    expect(p.watch.map((x) => x.path)).toContain("/schimbat");
    const s = { watch: p.watch } as GoogleState;
    expect(stuck(s).map((x) => x.path)).toEqual(["/blocat"]);
  });
});

describe("comutatoarele", () => {
  it("strategul și anunțul la Google sunt oprite până le pornește Daniel", () => {
    for (const k of ["strateg-seo", "google-zilnic"]) expect(AUTOMATIONS.find((a) => a.key === k)?.defaultOn).toBe(false);
  });
});
