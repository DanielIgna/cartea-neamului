import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOCS } from "@/lib/cunostinte/documente";
import { FUNCTIONS } from "@/lib/cunostinte/functii";
import { buildGraph, evaluate, evaluateDoc, knowledgeFrom, routeRegex, type Facts } from "@/lib/cunostinte/verificare";
import { ALL_ADMIN_ITEMS } from "@/lib/admin-menu";
import { AUTO_KEYS } from "@/lib/autonomie";

/** Adresele din src/app, scoase direct din fișiere (la fel ca scripts/harta-cod.ts). */
function scanRoutes() {
  const out = new Set<string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/^(page\.tsx|route\.tsx?)$/.test(name)) {
        const parts = p.split(/[\\/]/).slice(2, -1).filter((s) => !/^\(.*\)$/.test(s));
        if (parts[0] !== "pub") out.add(`/${parts.join("/")}`);
      }
    }
  };
  walk("src/app");
  return out;
}
const schema = readFileSync("src/db/schema.ts", "utf8");
const schemaTables = new Set([...schema.matchAll(/pgTable\(\s*"([a-z_]+)"/g)].map((m) => m[1]));

describe("registrul funcțiilor față de cod", () => {
  const routes = scanRoutes();
  it("cheile sunt unice", () => {
    expect(new Set(FUNCTIONS.map((f) => f.key)).size).toBe(FUNCTIONS.length);
    expect(new Set(DOCS.map((d) => d.id)).size).toBe(DOCS.length);
  });
  for (const fn of FUNCTIONS) {
    it(`${fn.key}: fișierele, adresele, tabelele și testele există`, () => {
      for (const p of [...fn.engine, ...(fn.tests ?? [])]) expect(existsSync(p), p).toBe(true);
      for (const r of [...(fn.pages ?? []), ...(fn.api ?? [])]) expect(routes.has(r), r).toBe(true);
      for (const t of [...(fn.tables ?? []), ...(fn.metric ? [fn.metric.table] : [])]) expect(schemaTables.has(t), t).toBe(true);
      for (const a of fn.automations ?? []) expect(AUTO_KEYS as readonly string[]).toContain(a);
      if (fn.dashboard) expect(ALL_ADMIN_ITEMS.map((i) => i.href)).toContain(fn.dashboard);
    });
  }
  it("fiecare document guvernează funcții care există; cele arhivate spun ce le-a înlocuit", () => {
    const keys = new Set(FUNCTIONS.map((f) => f.key));
    for (const d of DOCS) {
      for (const k of d.governs) expect(keys.has(k), `${d.id} → ${k}`).toBe(true);
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (d.replacedBy) expect(DOCS.some((x) => x.id === d.replacedBy)).toBe(true);
    }
  });
  it("cod.json are toate adresele de azi (rulează `npm run harta` dacă pică)", () => {
    const cod = JSON.parse(readFileSync("src/lib/cunostinte/cod.json", "utf8")) as { routes: { path: string }[] };
    const have = new Set(cod.routes.map((r) => r.path));
    for (const r of routes) expect(have.has(r), r).toBe(true);
  });
});

function facts(over: Partial<Facts> = {}): Facts {
  return {
    files: new Set(["src/lib/a.ts", "tests/a.test.ts"]), routes: new Set(["/a", "/api/a/[id]", "/admin/x"]), tables: new Set(["t1"]),
    metrics: new Map([["t1", { total: 5, last30: 2 }]]), env: () => true, automations: new Map([["sanatate", { on: true, status: "ok", last: "2026-11-13" }]]),
    errors: new Map(), menu: new Set(["/admin/x"]), docState: {}, now: new Date("2026-11-14T00:00:00Z"), ...over,
  };
}
const fn = {
  key: "x", name: "X", area: "sistem" as const, lifecycle: "live" as const, risk: "scazut" as const, riskWhy: "", what: "",
  engine: ["src/lib/a.ts"], pages: ["/a"], api: ["/api/a/[id]"], tables: ["t1"], metric: { table: "t1", label: "rânduri" },
  automations: ["sanatate" as const], dashboard: "/admin/x", tests: ["tests/a.test.ts"], env: ["CRON_SECRET"],
};

describe("verificarea", () => {
  it("adresele cu parametri prind căile reale", () => {
    expect(routeRegex("/arbore/[id]/persoana/[pid]").test("/arbore/abc/persoana/9")).toBe(true);
    expect(routeRegex("/arbore/[id]").test("/arbore/abc/harta")).toBe(false);
    expect(routeRegex("/api/auth/[...all]").test("/api/auth/sign-in/email")).toBe(true);
  });
  it("totul găsit = verde și verificat", () => {
    const e = evaluate(fn, facts());
    expect(e.health).toBe("verde");
    expect(e.verification).toBe("verificat");
    expect(e.cells.metric.note).toContain("5 rânduri");
  });
  it("un fișier dispărut = legătură ruptă și roșu", () => {
    const e = evaluate(fn, facts({ files: new Set(["tests/a.test.ts"]) }));
    expect(e.cells.engine.mark).toBe("lipsa");
    expect(e.verification).toBe("rupt");
    expect(e.health).toBe("rosu");
  });
  it("baza de date care nu răspunde nu e bifată: e „?”", () => {
    const e = evaluate(fn, facts({ tables: null, metrics: new Map() }));
    expect(e.cells.db.mark).toBe("necunoscut");
    expect(e.verification).toBe("partial");
  });
  it("o cheie lipsă: funcția e „gata, așteaptă”, galbenă", () => {
    const e = evaluate(fn, facts({ env: () => false }));
    expect(e.lifecycle).toBe("implementat");
    expect(e.health).toBe("galben");
  });
  it("erorile pe adresele funcției se numără", () => {
    const e = evaluate(fn, facts({ errors: new Map([["/api/a/123", 6], ["/altceva", 9]]) }));
    expect(e.errors7).toBe(6);
    expect(e.health).toBe("rosu");
  });
  it("un document trecut de data de recitire intră în coadă; „Am recitit” îl scoate", () => {
    const d = DOCS.find((x) => x.status === "activ")!;
    const late = new Date(new Date(`${d.date}T00:00:00Z`).getTime() + (d.reviewEveryDays + 1) * 86_400_000);
    expect(evaluateDoc(d, new Map(), {}, late).overdue).toBe(true);
    expect(evaluateDoc(d, new Map(), { [d.id]: { reviewedAt: late.toISOString() } }, late).overdue).toBe(false);
  });
  it("registrul real: rezumatul și harta se construiesc, fără legături rupte la fișiere", () => {
    const cod = JSON.parse(readFileSync("src/lib/cunostinte/cod.json", "utf8")) as { files: string[]; routes: { path: string }[] };
    const f = facts({ files: new Set([...cod.files, "src/lib/cunostinte/cod.json"]), routes: new Set(cod.routes.map((r) => r.path)), tables: schemaTables,
      metrics: new Map(), automations: null, menu: new Set(ALL_ADMIN_ITEMS.map((i) => i.href)) });
    const k = knowledgeFrom(f);
    expect(k.summary.functions).toBe(FUNCTIONS.length);
    expect(k.evals.filter((e) => e.verification === "rupt").map((e) => e.fn.key)).toEqual([]);
    const g = buildGraph(k.evals, k.docs, f);
    expect(g.nodes.some((n) => n.kind === "doc")).toBe(true);
    for (const e of g.edges) {
      expect(g.nodes.some((n) => n.id === e.from)).toBe(true);
      expect(g.nodes.some((n) => n.id === e.to)).toBe(true);
    }
  });
});
