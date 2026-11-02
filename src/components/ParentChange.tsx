"use client";
import { useState, useTransition } from "react";
import { setParent } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/**
 * „Schimbă mama / tatăl”: pentru copiii dintr-o altă căsătorie. Propune soțiile (soții) celuilalt părinte,
 * o persoană nouă sau scoaterea legăturii greșite.
 */
export default function ParentChange({ treeId, p, current, candidates, role, onAddNew, onChanged }: {
  treeId: string; p: PersonView; current: PersonView | undefined; candidates: PersonView[]; role: "father" | "mother";
  onAddNew: () => void; onChanged: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const word = role === "mother" ? "mama" : "tatăl";
  const run = (id: string | null, msg: string, then?: () => void) => start(async () => {
    const r = await setParent(treeId, p.id, role, id);
    if (r.error) return setErr(r.error);
    setOpen(false);
    if (then) then(); else onChanged(msg);
  });
  if (!open) return <button className="btn" onClick={() => setOpen(true)}>Schimbă {word}</button>;
  const others = candidates.filter((c) => c.id !== current?.id);
  return (
    <div className="confirm" style={{ width: "100%" }}>
      <div style={{ marginBottom: 8 }}>
        {current ? <>Acum {word} lui {p.givenName} este <b>{current.name}</b>. </> : null}
        Cine e de fapt {word}?
      </div>
      <div className="actions" style={{ flexWrap: "wrap", marginTop: 0 }}>
        {others.map((c) => (
          <button key={c.id} className="btn" disabled={pending} onClick={() => run(c.id, `${c.name} este acum ${word} lui ${p.givenName}.`)}>{c.name}{c.birthYear ? ` (${c.birthYear})` : ""}</button>
        ))}
        <button className="btn primary" disabled={pending} onClick={() => run(null, "", onAddNew)}>Altă persoană, o adaug acum</button>
        {current && <button className="btn" disabled={pending} onClick={() => run(null, `Am scos legătura cu ${current.name}.`)}>Nu știu, scoate-o pe {current.givenName}</button>}
        <button className="btn" disabled={pending} onClick={() => setOpen(false)}>Renunță</button>
      </div>
      {others.length > 0 && <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>Am propus {role === "mother" ? "soțiile" : "soții"} celuilalt părinte trecute în arbore.</p>}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
