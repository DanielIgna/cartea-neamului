"use client";
/**
 * Bucățile cu care se lucrează în Centrul de cunoștințe: formularul unui document, harta funcțiilor (listă / matrice, filtre)
 * și harta dependențelor (hartă cu zoom / matrice). Datele vin gata verificate de pe server (src/lib/cunostinte/verificare.ts).
 */
import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { updateDoc, type DocActionState } from "@/app/cunostinte-actions";

/* ---------- Documente ---------- */

export function DocForm({ id, status, note }: { id: string; status: string; note?: string }) {
  const [s, action, pending] = useActionState<DocActionState, FormData>(updateDoc, null);
  return (
    <form action={action} className="kc-docform">
      <input type="hidden" name="id" value={id} />
      <label>Stare
        <select name="status" defaultValue={status}>
          <option value="activ">Activ</option>
          <option value="revizuire">De revizuit</option>
          <option value="ciorna">Ciornă</option>
          <option value="arhivat">Arhivat</option>
        </select>
      </label>
      <label className="kc-note">Notiță (doar pentru tine)
        <input name="note" defaultValue={note ?? ""} maxLength={300} placeholder="de ex. vorbit cu avocatul pe 20 nov." />
      </label>
      <div className="kc-docform-btns">
        <button className="btn" type="submit" disabled={pending}>Salvează</button>
        <button className="btn primary" type="submit" name="reviewed" value="1" disabled={pending}>Am recitit azi</button>
      </div>
      {s && <span className={s.ok ? "ok" : "err"} role="status" style={{ fontSize: 13 }}>{s.ok ?? s.error}</span>}
    </form>
  );
}

/* ---------- Harta funcțiilor ---------- */

type Cell = { mark: string; note: string };
export type FnRow = {
  key: string; name: string; area: string; areaLabel: string; lifecycle: string; lifecycleLabel: string; risk: string; riskLabel: string; riskWhy: string;
  health: string; healthLabel: string; verification: string; verificationLabel: string; what: string; errors7: number; issues: string[]; docs: string[];
  cells: Record<string, Cell>; dashboard?: string; human?: string;
};
const SIGN: Record<string, string> = { ok: "✓", partial: "~", lipsa: "✗", necunoscut: "?", nedeclarat: "—" };
const MARK_LABEL: Record<string, string> = { ok: "verificat", partial: "parțial", lipsa: "lipsește / rupt", necunoscut: "nu s-a putut verifica", nedeclarat: "nu are" };

function MarkBox({ c }: { c: Cell }) {
  return <span className={`kc-mark m-${c.mark}`} title={`${MARK_LABEL[c.mark]}: ${c.note}`} aria-label={`${MARK_LABEL[c.mark]}: ${c.note}`}>{SIGN[c.mark]}</span>;
}

type Opt = { value: string; label: string };
export function FunctionMap({ rows, cols, filters }: { rows: FnRow[]; cols: { key: string; label: string }[]; filters: Record<"area" | "lifecycle" | "health" | "risk" | "verification", Opt[]> }) {
  const [view, setView] = useState<"lista" | "matrice">("lista");
  const [f, setF] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const words = q.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((r) => Object.entries(f).every(([k, v]) => !v || (r as unknown as Record<string, string>)[k] === v)
      && words.every((w) => `${r.name} ${r.what} ${r.key} ${r.areaLabel}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(w)));
  }, [rows, f, q]);
  const NAMES: Record<string, string> = { area: "zona", lifecycle: "ciclu de viață", health: "sănătate", risk: "risc", verification: "verificare" };
  return (
    <div className="stack">
      <div className="kc-toolbar">
        <div className="kc-seg" role="group" aria-label="Cum arăt">
          <button type="button" className={view === "lista" ? "on" : ""} aria-pressed={view === "lista"} onClick={() => setView("lista")}>☰ Listă</button>
          <button type="button" className={view === "matrice" ? "on" : ""} aria-pressed={view === "matrice"} onClick={() => setView("matrice")}>▦ Matrice</button>
        </div>
        <input className="kc-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută o funcție…" aria-label="Caută o funcție" />
      </div>
      <div className="kc-filters">
        {(Object.keys(filters) as (keyof typeof filters)[]).map((k) => (
          <select key={k} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={NAMES[k]}>
            <option value="">{NAMES[k]} (toate)</option>
            {filters[k].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <span className="muted kc-count">{shown.length}/{rows.length}</span>
      </div>

      {view === "lista" ? (
        <ul className="kc-fnlist">
          {shown.map((r) => (
            <li key={r.key} id={r.key}>
              <details className="card kc-fn">
                <summary>
                  <span className={`kc-dot h-${r.health}`} aria-label={`sănătate ${r.healthLabel}`} />
                  <span className="kc-fn-name">{r.name}<small className="muted">{r.areaLabel}</small></span>
                  <span className="kc-pills">
                    <span className="pill">{r.lifecycleLabel}</span>
                    <span className={`pill ${r.risk === "ridicat" ? "bad" : r.risk === "mediu" ? "warn" : ""}`}>risc {r.riskLabel.toLowerCase()}</span>
                    <span className={`pill ${r.verification === "verificat" ? "ok" : r.verification === "rupt" ? "bad" : "warn"}`}>{r.verificationLabel}</span>
                  </span>
                </summary>
                <p style={{ marginTop: 10 }}>{r.what}</p>
                {r.issues.length > 0 && <ul className="kc-issues">{r.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
                <dl className="kc-cells">
                  {cols.map((c) => (
                    <div key={c.key}><dt>{c.label}</dt><dd><MarkBox c={r.cells[c.key]} /> {r.cells[c.key].note}</dd></div>
                  ))}
                </dl>
                <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
                  De ce riscul e {r.riskLabel.toLowerCase()}: {r.riskWhy}
                  {r.docs.length > 0 && <> · Documente: {r.docs.map((d, i) => <span key={d}>{i ? ", " : ""}<Link href={`/admin/cunostinte?q=${d}`}>{d}</Link></span>)}</>}
                  {r.dashboard && <> · <Link href={r.dashboard}>Deschide panoul</Link></>}
                </p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <div className="kc-matrix-wrap">
          <table className="kc-matrix">
            <thead><tr><th scope="col">Funcție</th>{cols.map((c) => <th key={c.key} scope="col">{c.label}</th>)}</tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.key}>
                  <th scope="row"><span className={`kc-dot h-${r.health}`} aria-hidden="true" />{r.name}</th>
                  {cols.map((c) => <td key={c.key}><MarkBox c={r.cells[c.key]} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted kc-legend">
        <span><span className="kc-mark m-ok">✓</span> verificat</span> <span><span className="kc-mark m-partial">~</span> parțial</span>{" "}
        <span><span className="kc-mark m-lipsa">✗</span> lipsește / rupt</span> <span><span className="kc-mark m-necunoscut">?</span> nu s-a putut verifica</span>{" "}
        <span><span className="kc-mark m-nedeclarat">—</span> nu are</span>
      </p>
    </div>
  );
}

/* ---------- Harta dependențelor ---------- */

type GNode = { id: string; kind: string; label: string; sub?: string; state: string; health?: string };
type GEdge = { from: string; to: string; kind: string; state: string };
const EDGE_COLOR: Record<string, string> = {
  guverneaza: "var(--plum)", alimenteaza: "#3f7fa6", produce: "var(--accent)", declanseaza: "var(--ochre)", foloseste: "var(--good)",
};
const colorOf = (e: GEdge) => (e.state === "rupt" ? "var(--red)" : e.state === "necunoscut" ? "var(--muted)" : EDGE_COLOR[e.kind] ?? "var(--muted)");

export function DepGraph({ nodes, edges, cols, legend }: { nodes: GNode[]; edges: GEdge[]; cols: { kind: string; label: string }[]; legend: { key: string; label: string }[] }) {
  const [view, setView] = useState<"harta" | "matrice">("harta");
  const [zoom, setZoom] = useState(1);
  const [sel, setSel] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const COLW = 250, NODEW = 200, ROWH = 46, TOP = 40, PAD = 16;
  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    cols.forEach((c, ci) => nodes.filter((nd) => nd.kind === c.kind).forEach((nd, i) => m.set(nd.id, { x: PAD + ci * COLW, y: TOP + i * ROWH })));
    return m;
  }, [nodes, cols]);
  const height = TOP + Math.max(...cols.map((c) => nodes.filter((nd) => nd.kind === c.kind).length)) * ROWH + PAD;
  const width = PAD * 2 + (cols.length - 1) * COLW + NODEW;
  const linked = useMemo(() => {
    if (!sel) return null;
    const s = new Set<string>([sel]);
    for (const e of edges) if (e.from === sel || e.to === sel) { s.add(e.from); s.add(e.to); }
    return s;
  }, [sel, edges]);
  const fnNodes = nodes.filter((nd) => nd.kind === "fn");
  const others = cols.filter((c) => c.kind !== "fn");
  const broken = edges.filter((e) => e.state === "rupt").length;

  return (
    <div className={`card kc-graph${full ? " full" : ""}`}>
      <p className="muted kc-graph-meta">
        {nodes.length} noduri · {edges.length} legături{broken ? <> · <b style={{ color: "var(--red)" }}>{broken} rupte</b></> : " · nicio legătură ruptă"}
      </p>
      <p className="kc-legend-line">
        {legend.map((l) => <span key={l.key}><i style={{ background: l.key === "rupt" ? "var(--red)" : l.key === "necunoscut" ? "var(--muted)" : EDGE_COLOR[l.key] }} />{l.label}</span>)}
      </p>
      <div className="kc-toolbar">
        <div className="kc-seg" role="group" aria-label="Cum arăt">
          <button type="button" className={view === "harta" ? "on" : ""} aria-pressed={view === "harta"} onClick={() => setView("harta")}>Hartă</button>
          <button type="button" className={view === "matrice" ? "on" : ""} aria-pressed={view === "matrice"} onClick={() => setView("matrice")}>Matrice</button>
        </div>
        {view === "harta" && (
          <div className="kc-seg" role="group" aria-label="Mărime">
            <button type="button" onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))} aria-label="Mărește">＋</button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(1)))} aria-label="Micșorează">－</button>
            <button type="button" onClick={() => { setZoom(1); setSel(null); box.current?.scrollTo({ left: 0, top: 0 }); }} aria-label="Înapoi la început">⌖</button>
            <button type="button" onClick={() => setFull((v) => !v)} aria-pressed={full} aria-label={full ? "Ieși din ecran întreg" : "Ecran întreg"}>{full ? "✕" : "⤢"}</button>
          </div>
        )}
      </div>
      {view === "harta" ? (
        <>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 6px" }}>Apasă pe un nod ca să vezi doar legăturile lui. Pe telefon, trage în lateral.</p>
          <div className="kc-graph-box" ref={box}>
            <svg width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Harta dependențelor: ${nodes.length} noduri, ${edges.length} legături`}>
              {cols.map((c, ci) => <text key={c.kind} x={PAD + ci * COLW} y={22} className={`kc-col k-${c.kind}`}>{c.label.toUpperCase()}</text>)}
              {edges.map((e, i) => {
                const a = pos.get(e.from), b = pos.get(e.to);
                if (!a || !b) return null;
                const fwd = b.x > a.x;
                const x1 = fwd ? a.x + NODEW : a.x, x2 = fwd ? b.x : b.x + NODEW;
                const y1 = a.y + 16, y2 = b.y + 16, dx = Math.max(40, Math.abs(x2 - x1) / 2) * (fwd ? 1 : -1);
                const on = !linked || (linked.has(e.from) && linked.has(e.to));
                return <path key={i} d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`} fill="none" stroke={colorOf(e)} strokeWidth={on && linked ? 2.4 : 1.5}
                  strokeDasharray={e.state === "necunoscut" ? "4 4" : undefined} opacity={on ? 0.85 : 0.08} />;
              })}
              {nodes.map((nd) => {
                const p = pos.get(nd.id)!;
                const on = !linked || linked.has(nd.id);
                return (
                  <g key={nd.id} transform={`translate(${p.x},${p.y})`} opacity={on ? 1 : 0.25} className="kc-node" onClick={() => setSel(sel === nd.id ? null : nd.id)}
                    role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(sel === nd.id ? null : nd.id); } }}
                    aria-label={`${nd.label}${nd.sub ? `, ${nd.sub}` : ""}${nd.state === "rupt" ? ", rupt" : ""}`}>
                    <rect width={NODEW} height={32} rx={16} className={`kc-nrect s-${nd.state}${sel === nd.id ? " sel" : ""}`} />
                    {nd.health && <circle cx={14} cy={16} r={5} className={`kc-hdot h-${nd.health}`} />}
                    <text x={nd.health ? 26 : 14} y={20} className="kc-ntext">{nd.label.length > 27 ? `${nd.label.slice(0, 26)}…` : nd.label}</text>
                    <title>{`${nd.label}${nd.sub ? ` · ${nd.sub}` : ""}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </>
      ) : (
        <div className="kc-matrix-wrap">
          <table className="kc-matrix kc-depm">
            <thead><tr><th scope="col">Motor</th>{others.map((c) => <th key={c.kind} scope="col">{c.label}</th>)}</tr></thead>
            <tbody>
              {fnNodes.map((fnd) => (
                <tr key={fnd.id}>
                  <th scope="row"><span className={`kc-dot h-${fnd.health}`} aria-hidden="true" />{fnd.label}</th>
                  {others.map((c) => {
                    const linkedN = edges.filter((e) => (e.from === fnd.id || e.to === fnd.id)).map((e) => (e.from === fnd.id ? e.to : e.from))
                      .map((id) => nodes.find((x) => x.id === id)!).filter((x) => x?.kind === c.kind);
                    return (
                      <td key={c.kind}>
                        {linkedN.length ? linkedN.map((x) => <span key={x.id} className={`kc-chip s-${x.state}`} title={x.sub ?? x.label}>{x.label}</span>) : <span className="muted">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
