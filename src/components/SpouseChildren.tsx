"use client";
import { useState, useTransition } from "react";
import { linkChildren, otherRelation } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/**
 * Propunere: copiii soțului/soției care au trecut un singur părinte. Pentru fiecare: „Da, e și al lui/ei”
 * sau „Nu, e din altă relație” (primește un părinte fără nume, discret, ca propunerea să nu mai apară).
 */
export default function SpouseChildren({ treeId, p, spouse, kids, onDone }: { treeId: string; p: PersonView; spouse: PersonView; kids: PersonView[]; onDone: (msg: string) => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const role = p.sex === "F" ? "mama" : p.sex === "M" ? "tatăl" : "părintele";
  const asRole: "father" | "mother" = p.sex === "M" || (p.sex === "U" && spouse.sex === "F") ? "father" : "mother";
  const yes = (k: PersonView) => start(async () => {
    const r = await linkChildren(treeId, p.id, [k.id]);
    if (r.error) setErr(r.error); else onDone(`${p.givenName} este acum ${role} lui ${k.givenName}.`);
  });
  const no = (k: PersonView) => start(async () => {
    const r = await otherRelation(treeId, k.id, asRole);
    if (r.error) setErr(r.error); else onDone(`${k.givenName} apare acum dintr-o altă relație a lui ${spouse.givenName}; în desen pornește doar din ${spouse.givenName}.`);
  });
  return (
    <div className="confirm" style={{ marginTop: 10 }}>
      <b>{p.givenName}</b> e {p.sex === "F" ? "soția" : p.sex === "M" ? "soțul" : "partenerul"} lui {spouse.givenName}. {kids.length === 1 ? "Copilul" : "Copiii"} lui {spouse.givenName} de mai jos {kids.length === 1 ? "are" : "au"} trecut un singur părinte. {kids.length === 1 ? "Este" : "Sunt"} și {kids.length === 1 ? "al" : "ai"} {p.sex === "F" ? "ei" : "lui"}?
      {kids.map((k) => (
        <div key={k.id} className="actions" style={{ marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ minWidth: 150 }}>{k.name}{k.birthYear ? ` (${k.birthYear})` : ""}</span>
          <button className="btn primary" disabled={pending} onClick={() => yes(k)}>Da, e și {p.sex === "F" ? "al ei" : p.sex === "M" ? "al lui" : "al său"}</button>
          <button className="btn" disabled={pending} onClick={() => no(k)}>Nu, e din altă relație</button>
        </div>
      ))}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
