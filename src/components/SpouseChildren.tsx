"use client";
import { useState, useTransition } from "react";
import { linkChildren } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/**
 * Propunere: copiii soțului/soției care n-o au trecută pe această persoană ca părinte.
 * Toți sunt bifați; cei din altă căsătorie se debifează.
 */
export default function SpouseChildren({ treeId, p, spouse, kids, onDone }: { treeId: string; p: PersonView; spouse: PersonView; kids: PersonView[]; onDone: (msg: string) => void }) {
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState(() => new Set(kids.map((k) => k.id)));
  const [err, setErr] = useState<string | null>(null);
  const role = p.sex === "F" ? "mama" : p.sex === "M" ? "tatăl" : "părintele";
  return (
    <div className="confirm" style={{ marginTop: 10 }}>
      <b>{p.givenName}</b> e {p.sex === "F" ? "soția" : p.sex === "M" ? "soțul" : "partenerul"} lui {spouse.givenName}. {kids.length === 1 ? "Copilul" : "Copiii"} lui {spouse.givenName} de mai jos nu {p.sex === "F" ? "o" : "îl"} {kids.length === 1 ? "are" : "au"} încă pe {p.givenName} ca {role}. {kids.length === 1 ? "Este" : "Sunt"} și {kids.length === 1 ? "al" : "ai"} {p.sex === "F" ? "ei" : "lui"}?
      <div className="share" style={{ border: 0, padding: "6px 0" }}>
        {kids.map((k) => (
          <label key={k.id}><input type="checkbox" checked={chosen.has(k.id)} onChange={(e) => {
            const n = new Set(chosen); if (e.target.checked) n.add(k.id); else n.delete(k.id); setChosen(n);
          }} /> {k.name}{k.birthYear ? ` (${k.birthYear})` : ""}</label>
        ))}
        <small className="muted">Debifează copiii făcuți cu altă persoană.</small>
      </div>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending || !chosen.size} onClick={() => start(async () => {
          const r = await linkChildren(treeId, p.id, [...chosen]);
          if (r.error) setErr(r.error); else onDone(`${p.givenName} este acum ${role} pentru ${r.linked} ${r.linked === 1 ? "copil" : "copii"} ai lui ${spouse.givenName}.`);
        })}>{pending ? "Se leagă…" : "Da, leagă-i"}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
