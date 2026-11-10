import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person, relationship, tree } from "@/db/schema";
import { ancestorsOf, buildGraph, type Graph } from "@/lib/kinship";
import { loadTimeline } from "@/lib/tree-data";
import { requireUser, roleIn } from "@/lib/access";
import { HISTORICAL_EVENTS } from "@/lib/history";
import { getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Branch = "father" | "mother" | "both" | "own" | "other";
const BRANCHES: Branch[] = ["father", "mother", "both", "own", "other"];
const FILL: Record<Branch, string> = { father: "var(--pat-1)", mother: "var(--mat-1)", both: "color-mix(in srgb, var(--plum) 32%, var(--surface))", own: "var(--leaf-pat)", other: "var(--surface-2)" };

/** Rudele de sânge prin `parent`: el, strămoșii lui și toți urmașii acestora; plus soții/soțiile lor (intrați prin căsătorie). */
function bloodLine(g: Graph, parent: string | undefined) {
  const out = new Set<string>();
  if (!parent) return out;
  const stack = ancestorsOf(g, parent).map(([x]) => x);
  while (stack.length) {
    const x = stack.pop()!;
    if (out.has(x)) continue;
    out.add(x);
    stack.push(...(g.children.get(x) ?? []));
  }
  for (const x of [...out]) for (const sp of g.partners.get(x) ?? []) out.add(sp);
  return out;
}

/**
 * Cronologia: viața fiecăruia ca o bară pe fundalul istoriei. Culoarea arată ramura față de tine (linia tatălui, a mamei,
 * amândouă pentru frați, tu și urmașii tăi); se poate alege o ramură sau un secol (`?ramura=`, `?secol=`).
 */
export default async function Timeline({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ramura?: string; secol?: string }> }) {
  const { id } = await params;
  const q = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/cronologie`);
  if (!(await roleIn(db, id, me.id))) notFound();
  const [t] = await db.select().from(tree).where(eq(tree.id, id));
  if (!t) notFound();
  const locale = await getLocale();
  const tt = await getT("Timeline", locale);
  const all = await loadTimeline(db, id, locale);
  const now = new Date().getFullYear();
  // Ramura fiecăruia față de cel care se uită (fișa lui), altfel față de persoana de la care pornește arborele.
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, id));
  const g = buildGraph(all.map((p) => ({ id: p.id, sex: p.sex })), rels);
  const ego = mine?.id ?? t.rootPersonId ?? null;
  const parents = ego ? g.parents.get(ego) ?? [] : [];
  const sexOf = (x: string) => all.find((p) => p.id === x)?.sex;
  const fatherSide = bloodLine(g, parents.find((x) => sexOf(x) === "M") ?? (parents.length > 1 ? parents[0] : undefined));
  const motherSide = bloodLine(g, parents.find((x) => sexOf(x) === "F") ?? (parents.length > 1 ? parents[1] : undefined));
  const own = new Set<string>();
  if (ego) { const st = [ego]; while (st.length) { const x = st.pop()!; if (own.has(x)) continue; own.add(x); st.push(...(g.children.get(x) ?? [])); } }
  const branchOf = (x: string): Branch => own.has(x) ? "own" : fatherSide.has(x) && motherSide.has(x) ? "both" : fatherSide.has(x) ? "father" : motherSide.has(x) ? "mother" : "other";
  const used = new Set(all.map((p) => branchOf(p.id)));
  const branch = BRANCHES.includes(q.ramura as Branch) ? (q.ramura as Branch) : null;
  const centuries = [...new Set(all.map((p) => Math.floor(p.birthYear! / 100) + 1))].sort((a, b) => a - b);
  const century = Number(q.secol) && centuries.includes(Number(q.secol)) ? Number(q.secol) : null;
  // Un secol: cei care au trăit măcar o parte din el.
  const people = all.filter((p) => (!branch || branchOf(p.id) === branch) && (!century || (p.birthYear! <= century * 100 && (p.deathYear ?? (p.living ? now : p.birthYear!)) > (century - 1) * 100)));
  const link = (o: { ramura?: string | null; secol?: number | null }) => {
    const r = o.ramura === undefined ? branch : o.ramura, c = o.secol === undefined ? century : o.secol;
    const sp = new URLSearchParams();
    if (r) sp.set("ramura", r);
    if (c) sp.set("secol", String(c));
    return `/arbore/${id}/cronologie${sp.size ? `?${sp}` : ""}`;
  };
  const minY = Math.floor(Math.min(...people.map((p) => p.birthYear!), now - 60) / 20) * 20, maxY = now + 4;
  const W = 920;
  const events = HISTORICAL_EVENTS.filter((e) => e.to >= minY && (!t.region || e.regions.includes("*") || e.regions.includes(t.region)));
  const L = 170, R = 880, y0 = 72, rh = 22, H = y0 + people.length * rh + 30;
  const X = (y: number) => L + ((y - minY) / (maxY - minY)) * (R - L);
  const ticks = Array.from({ length: Math.floor((maxY - minY) / 20) + 1 }, (_, i) => minY + i * 20);
  return (
    <div className="card">
      <div className="toolbar"><div className="title">{tt("title")}</div><Link className="btn" href={`/arbore/${id}`}>{tt("back")}</Link></div>
      <div className="timeline-filters">
        <div className="seg seg-wrap" role="group" aria-label={tt("branchLabel")}>
          <Link className="seg-link" aria-current={!branch ? "true" : undefined} href={link({ ramura: null })}>{tt("allBranches")}</Link>
          {BRANCHES.filter((b) => used.has(b)).map((b) => (
            <Link key={b} className="seg-link" aria-current={branch === b ? "true" : undefined} href={link({ ramura: b })}>
              <i className="sw" style={{ background: FILL[b] }} aria-hidden />{tt(`branch.${b}`)}
            </Link>
          ))}
        </div>
        {centuries.length > 1 && (
          <div className="seg seg-wrap" role="group" aria-label={tt("centuryLabel")}>
            <Link className="seg-link" aria-current={!century ? "true" : undefined} href={link({ secol: null })}>{tt("allCenturies")}</Link>
            {centuries.map((c) => <Link key={c} className="seg-link" aria-current={century === c ? "true" : undefined} href={link({ secol: c })}>{tt("century", { century: c })}</Link>)}
          </div>
        )}
      </div>
      <p className="legend timeline-legend">
        {BRANCHES.filter((b) => used.has(b)).map((b) => <span key={b}><i className="sw" style={{ background: FILL[b] }} />{tt(`branchLegend.${b}`)}</span>)}
        <span><i className="sw" style={{ background: "transparent", border: "2px solid var(--accent)" }} />{tt("livingLegend")}</span>
      </p>
      {!people.length && <p className="muted">{tt("noneHere")}</p>}
      <div className="chartbox">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tt("aria")} style={{ width: "100%", minWidth: 720 }}>
          {events.map((e, i) => (
            <g key={e.title}>
              <rect x={X(e.from)} y={y0 - 10} width={Math.max(X(e.to) - X(e.from), 3)} height={H - y0 - 14} fill="var(--event)" />
              <text x={X(e.from)} y={18 + (i % 3) * 15} fill="var(--accent)" fontSize={11} fontWeight={700}>{tt(`events.${e.id}`)} {e.from === e.to ? e.from : `${e.from}–${e.to}`}</text>
            </g>
          ))}
          {ticks.map((y) => (
            <g key={y}><line x1={X(y)} x2={X(y)} y1={y0 - 10} y2={H - 24} stroke="var(--line)" strokeDasharray="2 4" /><text x={X(y)} y={H - 8} textAnchor="middle" fill="var(--muted)" fontSize={11}>{y}</text></g>
          ))}
          {people.map((p, k) => {
            const y = y0 + k * rh, end = p.deathYear ?? (p.living ? now : p.birthYear! + 1);
            return (
              <g key={p.id}>
                <text x={L - 8} y={y + 4} textAnchor="end" fill="var(--ink)" fontSize={13}>{p.name}</text>
                <rect x={X(p.birthYear!)} y={y - 7} width={Math.max(X(end) - X(p.birthYear!), 4)} height={14} rx={7} fill={FILL[branchOf(p.id)]} stroke={p.living ? "var(--accent)" : "var(--line)"} strokeWidth={p.living ? 1.5 : 1} />
                {/* Anii: după bară, iar dacă nu mai încap în desen (cei în viață ajung până azi), înăuntrul ei, spre capăt. */}
                {(() => {
                  const years = p.living && !p.deathYear ? tt("toPresent", { from: String(p.birthYear) }) : `${p.birthYear}${p.deathYear ? `–${p.deathYear}` : ""}`;
                  const inside = X(end) + 8 + years.length * 7 > W - 4;
                  return <text x={inside ? X(end) - 8 : X(end) + 6} y={y + 4} textAnchor={inside ? "end" : "start"} fill={inside ? "var(--ink)" : "var(--muted)"} fontSize={12}>{years}</text>;
                })()}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
