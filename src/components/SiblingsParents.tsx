"use client";
import { useState, useTransition } from "react";
import { otherRelation, replacePlaceholder, setParent } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/**
 * Propunere: frații au un părinte pe care persoana nu-l are (ea a rămas fără mamă, ori cu „Tată necunoscut” pus automat când
 * i s-au adăugat frații), așa că neamul de pe partea aceea nu ajunge la ea. „Da” o leagă de același părinte: un „Tată necunoscut”
 * se înlocuiește cu el pentru toți copiii lui (`alsoFor`). „Nu” îi pune un loc gol discret (apare doar în fișa ei), ca propunerea să nu mai apară.
 */
export default function SiblingsParents({ treeId, p, role, parent, current, alsoFor = [], onDone }: {
  treeId: string; p: PersonView; role: "father" | "mother"; parent: PersonView; current?: PersonView; alsoFor?: PersonView[]; onDone: (msg: string) => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const word = role === "father" ? "tatăl" : "mama", her = p.sex === "F" ? "ei" : "lui";
  const names = alsoFor.map((x) => x.givenName).join(", ");
  const yes = () => start(async () => {
    const r = current ? await replacePlaceholder(treeId, current.id, parent.id) : await setParent(treeId, p.id, role, parent.id);
    if (r.error) return setErr(r.error);
    onDone(`${parent.name} este acum și ${word} lui ${p.givenName}${names ? ` (și al lui ${names})` : ""}${current ? `, în locul lui „${current.givenName}”` : ""}. Neamul de pe partea aceea ajunge acum și la ${p.sex === "F" ? "ea" : "el"}.`);
  });
  const no = () => start(async () => {
    const r = await otherRelation(treeId, p.id, role);
    if (r.error) setErr(r.error); else onDone(`Am notat că ${p.givenName} are ${role === "father" ? "alt tată" : "altă mamă"} decât frații ${her}.`);
  });
  return (
    <div className="confirm" style={{ marginTop: 10 }}>
      Frații {her} au ca {role === "father" ? "tată" : "mamă"} pe <b>{parent.name}</b>, dar {current
        ? <>la {p.givenName} {word} e trecut{role === "mother" ? "ă" : ""} „{current.givenName}”{names ? <> (la fel ca la {names})</> : null}</>
        : <>{p.givenName} nu are {role === "father" ? "tată" : "mamă"} în arbore</>}. E și {word} {her}?
      <div className="actions" style={{ marginTop: 6, flexWrap: "wrap" }}>
        <button className="btn primary" disabled={pending} onClick={yes}>{pending ? "Se leagă…" : `Da, e ${word} ${her}`}</button>
        <button className="btn" disabled={pending} onClick={no}>Nu, are {role === "father" ? "alt tată" : "altă mamă"}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
