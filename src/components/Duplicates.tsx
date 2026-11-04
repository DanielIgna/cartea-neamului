"use client";
import { useEffect, useState, useTransition } from "react";
import { mergePeople } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";
import type { Duplicate } from "@/lib/family";

const KEY = (treeId: string) => `cn-nu-sunt-dubluri-${treeId}`;
const pairKey = (d: Duplicate) => [d.keep, d.drop].sort().join("|");
function readDismissed(treeId: string): string[] {
  try { return JSON.parse(localStorage.getItem(KEY(treeId)) ?? "[]"); } catch { return []; }
}

/** Fișe care par aceeași persoană trecută de două ori: le unim (cu o confirmare) sau spunem că nu e aceeași persoană. */
export default function Duplicates({ treeId, pairs, people, kids, onDone, inline }: {
  treeId: string; pairs: Duplicate[]; people: Record<string, PersonView>; kids: (id: string) => number; onDone: (msg: string, keptId: string) => void; inline?: boolean;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => setDismissed(readDismissed(treeId)), [treeId]);
  const [asking, setAsking] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const shown = pairs.filter((d) => !dismissed.includes(pairKey(d)) && people[d.keep] && people[d.drop]);
  if (!shown.length) return null;
  const label = (id: string) => { const n = kids(id); return `${people[id].name}${people[id].birthYear ? `, ${people[id].birthYear}` : ""}${n ? ` (${n === 1 ? "1 copil" : `${n} copii`})` : ""}`; };
  const notSame = (d: Duplicate) => {
    const next = [...dismissed, pairKey(d)];
    setDismissed(next);
    try { localStorage.setItem(KEY(treeId), JSON.stringify(next)); } catch { /* fără memorie locală: apare din nou data viitoare */ }
  };
  const body = (
    <>
      {shown.map((d) => (
        <div key={pairKey(d)} className="confirm" style={{ marginTop: 8 }}>
          Pare aceeași persoană, trecută de două ori: <b>{label(d.keep)}</b> și <b>{label(d.drop)}</b>
          {d.via && people[d.via] ? <>, amândouă legate de {people[d.via].name}</> : null}
          {d.born && people[d.born] ? <>, {people[d.drop].sex === "M" ? "fiul" : people[d.drop].sex === "F" ? "fiica" : "copilul"} lui {people[d.born].name}</> : null}.
          {asking === pairKey(d) ? (
            <>
              <div style={{ margin: "6px 0" }}>Păstrez fișa „{people[d.keep].name}” și mut la ea {d.born ? "părinții, " : ""}copiii, soții, pozele și datele celeilalte; dubla se șterge. Continui?</div>
              <div className="actions" style={{ marginTop: 0 }}>
                <button className="btn primary" disabled={pending} onClick={() => start(async () => {
                  const r = await mergePeople(treeId, d.keep, d.drop);
                  if (r.error) setErr(r.error); else { setAsking(null); onDone(r.message ?? "Fișele au fost unite.", d.keep); }
                })}>{pending ? "Se unesc…" : "Da, unește-le"}</button>
                <button className="btn" disabled={pending} onClick={() => setAsking(null)}>Renunță</button>
              </div>
            </>
          ) : (
            <div className="actions" style={{ marginTop: 6 }}>
              <button className="btn primary" onClick={() => { setErr(null); setAsking(pairKey(d)); }}>Unește-le într-o singură fișă</button>
              <button className="btn" onClick={() => notSame(d)}>Nu e aceeași persoană</button>
            </div>
          )}
        </div>
      ))}
      {err && <p className="err">{err}</p>}
    </>
  );
  if (inline) return body;
  return (
    <div className="card">
      <div className="section-label" style={{ marginTop: 0 }}>Persoane trecute de două ori?</div>
      {body}
    </div>
  );
}

/** Unire de mână: alegi fișa dublă a acestei persoane (scrisă poate altfel, „Ana” și „Anuța”), iar tot ce are trece aici. */
export function MergeWith({ treeId, p, candidates, onDone }: { treeId: string; p: PersonView; candidates: PersonView[]; onDone: (msg: string, keptId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [other, setOther] = useState("");
  const [sure, setSure] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <button className="btn" onClick={() => setOpen(true)} title="Pentru o persoană trecută de două ori în arbore">Unește cu altă fișă</button>;
  const chosen = candidates.find((c) => c.id === other);
  return (
    <div className="confirm" style={{ width: "100%" }}>
      <label>Care fișă e tot {p.givenName}, trecut(ă) a doua oară?
        <select value={other} onChange={(e) => { setOther(e.target.value); setSure(false); }}>
          <option value="">alege…</option>
          {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}{c.birthYear ? `, ${c.birthYear}` : ""}</option>)}
        </select>
      </label>
      {chosen && <p style={{ margin: "6px 0" }}>Tot ce are fișa „{chosen.name}” (copii, soți, părinți, poze, date) trece la „{p.name}”, iar „{chosen.name}” se șterge.</p>}
      <div className="actions" style={{ marginTop: 6 }}>
        {chosen && !sure && <button className="btn primary" onClick={() => setSure(true)}>Unește</button>}
        {chosen && sure && <button className="btn primary" disabled={pending} onClick={() => start(async () => {
          const r = await mergePeople(treeId, p.id, chosen.id);
          if (r.error) setErr(r.error); else { setOpen(false); onDone(r.message ?? "Fișele au fost unite.", p.id); }
        })}>{pending ? "Se unesc…" : `Da, e aceeași persoană`}</button>}
        <button className="btn" disabled={pending} onClick={() => { setOpen(false); setOther(""); setSure(false); }}>Renunță</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
