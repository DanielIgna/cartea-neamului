/**
 * Verificarea registrului (Admin → Centru de cunoștințe): ce e declarat în functii.ts și documente.ts, pus față în față cu
 * ce există cu adevărat: fișierele și adresele din codul publicat (cod.json), tabelele din baza de date, cifrele din ele,
 * automatizările din Autonomie, erorile de pe server, cheile de mediu și meniul din Admin.
 *
 * Reguli: ce nu se poate verifica e „?” (necunoscut), nu bifat; nicio cifră nu e inventată; fără AI. Funcțiile de calcul
 * (evaluate, health, graph…) sunt pure, ca să se poată testa fără bază de date.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { ALL_ADMIN_ITEMS } from "../admin-menu";
import { ENV_KEYS, envSet } from "../admin";
import { AUTOMATIONS, automationSwitches, lastRuns, type AutoKey } from "../autonomie";
import cod from "./cod.json";
import { DOCS, type DocStatus, type KDoc } from "./documente";
import { FUNCTIONS, type Fn, type Lifecycle } from "./functii";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;

/* ---------- Ce s-a găsit ---------- */

export type Mark = "ok" | "partial" | "lipsa" | "necunoscut" | "nedeclarat";
export const MARK: Record<Mark, { sign: string; label: string }> = {
  ok: { sign: "✓", label: "verificat" },
  partial: { sign: "~", label: "parțial" },
  lipsa: { sign: "✗", label: "lipsește / rupt" },
  necunoscut: { sign: "?", label: "nu s-a putut verifica" },
  nedeclarat: { sign: "—", label: "nu are" },
};
export const COLS = ["engine", "routes", "db", "metric", "automation", "dashboard", "test", "env", "decision"] as const;
export type Col = (typeof COLS)[number];
export const COL_LABEL: Record<Col, string> = {
  engine: "Motor", routes: "Pagini / API", db: "Baza", metric: "Metrică", automation: "Automatizare", dashboard: "Panou", test: "Teste", env: "Chei", decision: "Decizie",
};

export type Health = "verde" | "galben" | "rosu" | "gri";
export const HEALTH: Record<Health, string> = { verde: "Verde", galben: "Galben", rosu: "Roșu", gri: "Gri" };
export type Verif = "verificat" | "partial" | "rupt" | "neverificat";
export const VERIF: Record<Verif, string> = { verificat: "Verificat", partial: "Parțial", rupt: "Legături rupte", neverificat: "Neverificat" };

export type DocState = { status?: DocStatus; reviewedAt?: string; by?: string; note?: string };
export type Facts = {
  files: Set<string>;
  routes: Set<string>;
  /** null = baza de date n-a răspuns. */
  tables: Set<string> | null;
  metrics: Map<string, { total: number; last30: number | null } | "eroare">;
  env: (key: string) => boolean;
  /** null = nu s-a putut citi jurnalul automatizărilor. */
  automations: Map<string, { on: boolean; status: string | null; last: string | null; paused?: string }> | null;
  /** Erori pe server în ultimele 7 zile, pe adresă (fără parametri). */
  errors: Map<string, number>;
  menu: Set<string>;
  docState: Record<string, DocState>;
  now: Date;
};

export type Cell = { mark: Mark; note: string };
export type FnEval = {
  fn: Fn;
  cells: Record<Col, Cell>;
  lifecycle: Lifecycle;
  health: Health;
  verification: Verif;
  errors7: number;
  issues: string[];
  docs: string[];
};

/** /arbore/[id]/persoana/[pid] → o expresie care prinde /arbore/abc/persoana/xyz. */
export function routeRegex(pattern: string) {
  const body = pattern.split("/").map((s) => (/^\[\.\.\..+\]$/.test(s) ? ".+" : /^\[.+\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|\\]/g, "\\$&"))).join("/");
  return new RegExp(`^${body}/?$`);
}

export function effectiveDocStatus(d: KDoc, state: Record<string, DocState>): DocStatus {
  return state[d.id]?.status ?? d.status;
}
export const docsFor = (key: string) => DOCS.filter((d) => d.governs.includes(key));

const neededEnv = new Set(ENV_KEYS.filter((k) => k.needed).map((k) => k.key));

/** Evaluarea unei funcții față de ce s-a găsit. Pură. */
export function evaluate(fn: Fn, f: Facts): FnEval {
  const planned = fn.lifecycle === "planificat" || fn.lifecycle === "oprit";
  const issues: string[] = [];
  const cells = {} as Record<Col, Cell>;

  const missingFiles = fn.engine.filter((p) => !f.files.has(p));
  cells.engine = !fn.engine.length ? { mark: "nedeclarat", note: planned ? "încă fără cod" : "fără fișiere declarate" }
    : missingFiles.length ? { mark: "lipsa", note: `lipsesc: ${missingFiles.join(", ")}` } : { mark: "ok", note: `${fn.engine.length} fișiere găsite` };
  if (missingFiles.length) issues.push(`Fișiere care nu mai există: ${missingFiles.join(", ")}`);

  const allRoutes = [...(fn.pages ?? []), ...(fn.api ?? [])];
  const missingRoutes = allRoutes.filter((r) => !f.routes.has(r));
  cells.routes = !allRoutes.length ? { mark: "nedeclarat", note: "fără pagini sau adrese proprii" }
    : missingRoutes.length ? { mark: "lipsa", note: `lipsesc: ${missingRoutes.join(", ")}` } : { mark: "ok", note: `${allRoutes.length} adrese găsite` };
  if (missingRoutes.length) issues.push(`Adrese care nu mai există: ${missingRoutes.join(", ")}`);

  const tables = fn.tables ?? [];
  const missingTables = f.tables ? tables.filter((t) => !f.tables!.has(t)) : [];
  cells.db = !tables.length ? { mark: "nedeclarat", note: "fără tabele" } : !f.tables ? { mark: "necunoscut", note: "baza de date n-a răspuns" }
    : missingTables.length ? { mark: "lipsa", note: `lipsesc: ${missingTables.join(", ")}` } : { mark: "ok", note: `${tables.length} tabele găsite` };
  if (missingTables.length) issues.push(`Tabele care lipsesc din baza de date: ${missingTables.join(", ")}`);

  if (!fn.metric) cells.metric = { mark: "nedeclarat", note: "fără metrică" };
  else {
    const m = f.metrics.get(fn.metric.table);
    cells.metric = !m ? { mark: "necunoscut", note: "nu s-a putut număra" } : m === "eroare" ? { mark: "lipsa", note: `nu se poate număra din ${fn.metric.table}` }
      : { mark: "ok", note: `${m.total.toLocaleString("ro-RO")} ${fn.metric.label}${m.last30 != null ? ` · ${m.last30.toLocaleString("ro-RO")} în 30 de zile` : ""}` };
  }

  const autos = fn.automations ?? [];
  if (!autos.length) cells.automation = { mark: "nedeclarat", note: "nimic automat" };
  else if (!f.automations) cells.automation = { mark: "necunoscut", note: "jurnalul automatizărilor nu s-a putut citi" };
  else {
    const st = autos.map((k) => ({ k, label: AUTOMATIONS.find((a) => a.key === k)?.label ?? k, s: f.automations!.get(k) }));
    const bad = st.filter((x) => x.s?.status === "eroare" || x.s?.paused);
    const off = st.filter((x) => !x.s?.on);
    const never = st.filter((x) => x.s?.on && !x.s.last);
    cells.automation = bad.length ? { mark: "lipsa", note: `dă eroare: ${bad.map((x) => x.label).join(", ")}` }
      : off.length || never.length ? { mark: "partial", note: [off.length ? `oprite: ${off.map((x) => x.label).join(", ")}` : "", never.length ? `n-au rulat: ${never.map((x) => x.label).join(", ")}` : ""].filter(Boolean).join(" · ") }
      : { mark: "ok", note: `${autos.length} pornite și rulează` };
    if (bad.length) issues.push(`Automatizare cu eroare: ${bad.map((x) => x.label).join(", ")}`);
  }

  cells.dashboard = !fn.dashboard ? { mark: "nedeclarat", note: "fără panou în Admin" }
    : f.menu.has(fn.dashboard) && f.routes.has(fn.dashboard) ? { mark: "ok", note: fn.dashboard } : { mark: "lipsa", note: `${fn.dashboard} nu e în meniu` };

  const tests = fn.tests ?? [];
  const missingTests = tests.filter((t) => !f.files.has(t));
  cells.test = !tests.length ? (planned ? { mark: "nedeclarat", note: "—" } : { mark: "partial", note: "fără teste automate" })
    : missingTests.length ? { mark: "lipsa", note: `lipsesc: ${missingTests.join(", ")}` } : { mark: "ok", note: `${tests.length} fișiere de test` };

  const env = fn.env ?? [];
  const missingEnv = env.filter((k) => !f.env(k));
  cells.env = !env.length ? { mark: "nedeclarat", note: "fără chei" } : missingEnv.length ? { mark: missingEnv.some((k) => neededEnv.has(k)) ? "lipsa" : "partial", note: `lipsesc: ${missingEnv.join(", ")}` }
    : { mark: "ok", note: `${env.length} chei puse` };
  if (missingEnv.length && !planned) issues.push(`Chei lipsă în Vercel: ${missingEnv.join(", ")}`);

  const docs = docsFor(fn.key).filter((d) => effectiveDocStatus(d, f.docState) !== "arhivat");
  const active = docs.filter((d) => effectiveDocStatus(d, f.docState) === "activ");
  cells.decision = !docs.length ? (fn.human ? { mark: "partial", note: fn.human } : { mark: "nedeclarat", note: "fără document" })
    : !active.length ? { mark: "partial", note: `în revizuire: ${docs.map((d) => d.id).join(", ")}` }
    : { mark: fn.human && fn.lifecycle !== "live" ? "partial" : "ok", note: `${active.map((d) => d.id).join(", ")}${fn.human ? ` · ${fn.human}` : ""}` };

  const res = [...allRoutes].map(routeRegex);
  let errors7 = 0;
  if (res.length) for (const [path, c] of f.errors) if (res.some((r) => r.test(path))) errors7 += c;
  if (errors7) issues.push(`${errors7} erori pe server în 7 zile pe adresele ei`);

  // Ciclul de viață: o funcție „live” fără cheile ei e doar gata, așteaptă cheile.
  const lifecycle: Lifecycle = fn.lifecycle === "live" && missingEnv.length ? "implementat" : fn.lifecycle;

  const marks = COLS.map((c) => cells[c].mark);
  const health: Health = planned ? "gri"
    : (["engine", "routes", "db", "dashboard", "metric", "automation"] as Col[]).some((c) => cells[c].mark === "lipsa") || cells.env.mark === "lipsa" || errors7 >= 5 ? "rosu"
    : marks.includes("partial") || errors7 > 0 ? "galben" : "verde";
  const hard = (["engine", "routes", "db", "dashboard", "test"] as Col[]).some((c) => cells[c].mark === "lipsa");
  const verification: Verif = hard ? "rupt" : planned && !fn.engine.length ? "neverificat" : marks.includes("necunoscut") ? "partial" : "verificat";

  return { fn, cells, lifecycle, health, verification, errors7, issues, docs: docs.map((d) => d.id) };
}

/* ---------- Documentele ---------- */

export type DocEval = {
  doc: KDoc;
  status: DocStatus;
  reviewedAt: string | null;
  nextReview: string;
  overdue: boolean;
  /** Cât de sănătoase sunt funcțiile guvernate (verde = 1, galben = 0,5), în procente; null dacă nu guvernează nimic. */
  health: number | null;
  reasons: string[];
  note?: string;
};

export function evaluateDoc(d: KDoc, fns: Map<string, FnEval>, state: Record<string, DocState>, now: Date): DocEval {
  const status = effectiveDocStatus(d, state);
  const reviewedAt = state[d.id]?.reviewedAt ?? null;
  const base = new Date(reviewedAt ?? `${d.date}T00:00:00Z`);
  const next = new Date(base.getTime() + d.reviewEveryDays * DAY);
  const overdue = status !== "arhivat" && next.getTime() < now.getTime();
  const gov = d.governs.map((k) => fns.get(k)).filter((x): x is FnEval => !!x && x.health !== "gri");
  const health = gov.length ? Math.round((100 * gov.reduce((a, e) => a + (e.health === "verde" ? 1 : e.health === "galben" ? 0.5 : 0), 0)) / gov.length) : null;
  const reasons: string[] = [];
  if (status === "revizuire") reasons.push("e marcat „De revizuit”");
  if (status === "ciorna") reasons.push("e încă ciornă");
  if (overdue) reasons.push(`trebuia recitit până pe ${next.toISOString().slice(0, 10)}`);
  if (status !== "arhivat") {
    const red = d.governs.filter((k) => fns.get(k)?.health === "rosu");
    if (red.length) reasons.push(`guvernează funcții cu roșu: ${red.map((k) => fns.get(k)!.fn.name).join(", ")}`);
    if (d.open?.length && status !== "activ") reasons.push(`${d.open.length} pași deschiși`);
  }
  return { doc: d, status, reviewedAt, nextReview: next.toISOString().slice(0, 10), overdue, health, reasons, note: state[d.id]?.note };
}

/* ---------- Harta dependențelor ---------- */

export type NodeKind = "doc" | "fn" | "metric" | "auto" | "api" | "table" | "dash";
export const NODE_COLS: { kind: NodeKind; label: string }[] = [
  { kind: "doc", label: "Documente" }, { kind: "fn", label: "Motoare" }, { kind: "metric", label: "Metrici" }, { kind: "auto", label: "Automatizări" },
  { kind: "api", label: "API" }, { kind: "table", label: "Tabele" }, { kind: "dash", label: "Panouri" },
];
export type EdgeKind = "guverneaza" | "alimenteaza" | "produce" | "declanseaza" | "foloseste";
export const EDGE_LABEL: Record<EdgeKind | "rupt" | "necunoscut", string> = {
  guverneaza: "Guvernează", alimenteaza: "Alimentează", produce: "Produce / expune", declanseaza: "Declanșează", foloseste: "Folosește", rupt: "Rupt", necunoscut: "Necunoscut",
};
export type GNode = { id: string; kind: NodeKind; label: string; sub?: string; state: "ok" | "rupt" | "necunoscut"; health?: Health };
export type GEdge = { from: string; to: string; kind: EdgeKind; state: "ok" | "rupt" | "necunoscut" };

export function buildGraph(evals: FnEval[], docs: DocEval[], f: Facts) {
  const nodes = new Map<string, GNode>();
  const edges: GEdge[] = [];
  const add = (n: GNode) => { if (!nodes.has(n.id)) nodes.set(n.id, n); return n.id; };
  const tState = (t: string): GNode["state"] => (!f.tables ? "necunoscut" : f.tables.has(t) ? "ok" : "rupt");
  for (const e of evals) {
    const fid = add({ id: `fn:${e.fn.key}`, kind: "fn", label: e.fn.name, sub: e.lifecycle, state: e.verification === "rupt" ? "rupt" : "ok", health: e.health });
    for (const d of docs) {
      if (d.status === "arhivat" || !d.doc.governs.includes(e.fn.key)) continue;
      edges.push({ from: add({ id: `doc:${d.doc.id}`, kind: "doc", label: `${d.doc.id} · ${d.doc.title}`, sub: d.status, state: "ok" }), to: fid, kind: "guverneaza", state: "ok" });
    }
    for (const a of e.fn.automations ?? []) {
      const s = f.automations?.get(a);
      const st: GNode["state"] = !f.automations ? "necunoscut" : s?.status === "eroare" || s?.paused ? "rupt" : "ok";
      edges.push({ from: add({ id: `auto:${a}`, kind: "auto", label: AUTOMATIONS.find((x) => x.key === a)?.label ?? a, sub: s?.on ? "pornită" : "oprită", state: st }), to: fid, kind: "declanseaza", state: st });
    }
    for (const r of e.fn.api ?? []) {
      const st: GNode["state"] = f.routes.has(r) ? "ok" : "rupt";
      edges.push({ from: fid, to: add({ id: `api:${r}`, kind: "api", label: r, state: st }), kind: "produce", state: st });
    }
    for (const t of e.fn.tables ?? []) edges.push({ from: fid, to: add({ id: `table:${t}`, kind: "table", label: t, state: tState(t) }), kind: "foloseste", state: tState(t) });
    if (e.fn.metric) {
      const mid = add({ id: `metric:${e.fn.key}`, kind: "metric", label: e.fn.metric.label, sub: e.cells.metric.note, state: e.cells.metric.mark === "lipsa" ? "rupt" : e.cells.metric.mark === "ok" ? "ok" : "necunoscut" });
      edges.push({ from: fid, to: mid, kind: "produce", state: nodes.get(mid)!.state });
      const tid = add({ id: `table:${e.fn.metric.table}`, kind: "table", label: e.fn.metric.table, state: tState(e.fn.metric.table) });
      edges.push({ from: tid, to: mid, kind: "alimenteaza", state: nodes.get(tid)!.state });
    }
    if (e.fn.dashboard) {
      const st: GNode["state"] = e.cells.dashboard.mark === "ok" ? "ok" : "rupt";
      edges.push({ from: fid, to: add({ id: `dash:${e.fn.dashboard}`, kind: "dash", label: ALL_ADMIN_ITEMS.find((i) => i.href === e.fn.dashboard)?.label ?? e.fn.dashboard, sub: e.fn.dashboard, state: st }), kind: "alimenteaza", state: st });
    }
  }
  const seen = new Set<string>();
  const uniq = edges.filter((x) => { const k = `${x.from}>${x.to}>${x.kind}`; if (seen.has(k)) return false; seen.add(k); return true; });
  return { nodes: [...nodes.values()], edges: uniq };
}

/* ---------- Ce se citește din baza de date ---------- */

export const STATE_KEY = "cunostinte_stare";

export async function readDocState(db: Pick<Db, "select">): Promise<Record<string, DocState>> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${STATE_KEY}`);
  return (r?.value ?? {}) as Record<string, DocState>;
}
export async function saveDocState(db: Pick<Db, "insert">, value: Record<string, DocState>, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: STATE_KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
}

const SAFE = /^[a-z_]+$/;

export async function gatherFacts(db: Db, now = new Date()): Promise<Facts> {
  const files = new Set(cod.files);
  const routes = new Set(cod.routes.map((r) => r.path));
  let tables: Set<string> | null = null;
  let withCreated = new Set<string>();
  try {
    const t = await rows<{ table_name: string }>(db, sql`select table_name from information_schema.tables where table_schema = 'public'`);
    tables = new Set(t.map((x) => x.table_name));
    const c = await rows<{ table_name: string }>(db, sql`select table_name from information_schema.columns where table_schema = 'public' and column_name = 'created_at'`);
    withCreated = new Set(c.map((x) => x.table_name));
  } catch { /* baza n-a răspuns: tabelele rămân „?” */ }

  const metrics = new Map<string, { total: number; last30: number | null } | "eroare">();
  if (tables) {
    const wanted = [...new Set(FUNCTIONS.flatMap((fn) => (fn.metric ? [fn.metric.table] : [])))].filter((t) => SAFE.test(t));
    await Promise.all(wanted.map(async (t) => {
      if (!tables!.has(t)) { metrics.set(t, "eroare"); return; }
      try {
        const name = sql.raw(`"${t}"`);
        const [r] = withCreated.has(t)
          ? await rows(db, sql`select count(*) as total, count(*) filter (where created_at > now() - interval '30 days') as last30 from ${name}`)
          : await rows(db, sql`select count(*) as total from ${name}`);
        metrics.set(t, { total: n(r?.total), last30: withCreated.has(t) ? n(r?.last30) : null });
      } catch { metrics.set(t, "eroare"); }
    }));
  }

  let automations: Facts["automations"] = null;
  try {
    const [sw, last] = await Promise.all([automationSwitches(db), lastRuns(db)]);
    automations = new Map(AUTOMATIONS.map((a) => [a.key, { on: sw[a.key], status: last.get(a.key)?.status ?? null, last: last.get(a.key)?.last ?? null, paused: sw.paused?.[a.key as AutoKey] }]));
  } catch { /* fără tabelele automatizărilor */ }

  const errors = new Map<string, number>();
  try {
    for (const r of await rows<{ entity_id: string; c: number }>(db, sql`select entity_id, count(*) as c from audit_log where entity = 'eroare' and created_at > now() - interval '7 days' group by entity_id`))
      errors.set(r.entity_id, n(r.c));
  } catch { /* fără jurnal */ }

  let docState: Record<string, DocState> = {};
  try { docState = await readDocState(db); } catch { /* fără setări */ }

  return { files, routes, tables, metrics, env: envSet, automations, errors, menu: new Set(ALL_ADMIN_ITEMS.map((i) => i.href)), docState, now };
}

export function countBy<T extends string>(items: T[]) {
  const m = {} as Record<T, number>;
  for (const i of items) m[i] = (m[i] ?? 0) + 1;
  return m;
}

/** Tot ce trebuie paginilor: funcțiile evaluate, documentele, coada de revizuire, graficul și rezumatul. */
export async function knowledge(db: Db, now = new Date()) {
  const facts = await gatherFacts(db, now);
  return knowledgeFrom(facts);
}

export function knowledgeFrom(facts: Facts) {
  const evals = FUNCTIONS.map((fn) => evaluate(fn, facts));
  const byKey = new Map(evals.map((e) => [e.fn.key, e]));
  const docs = DOCS.map((d) => evaluateDoc(d, byKey, facts.docState, facts.now));
  const queue = docs.filter((d) => d.reasons.length && d.status !== "arhivat")
    .sort((a, b) => b.reasons.length - a.reasons.length || a.nextReview.localeCompare(b.nextReview));
  const live = evals.filter((e) => e.health !== "gri");
  const summary = {
    functions: evals.length,
    live: live.length,
    green: live.filter((e) => e.health === "verde").length,
    yellow: live.filter((e) => e.health === "galben").length,
    red: live.filter((e) => e.health === "rosu").length,
    broken: evals.filter((e) => e.verification === "rupt").length,
    unknown: evals.filter((e) => e.verification === "partial").length,
    docs: docs.length,
    review: queue.length,
    dbOk: !!facts.tables,
    files: cod.files.length,
    routes: cod.routes.length,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };
  return { facts, evals, docs, queue, summary };
}

/** Pentru scorul din Autonomie: doar cifrele. Dacă ceva pică, întoarce null (verificarea apare atunci ca „nu s-a putut citi”). */
export async function knowledgeSummary(db: Db, now = new Date()) {
  try { return (await knowledge(db, now)).summary; } catch { return null; }
}
