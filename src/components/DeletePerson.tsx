"use client";
import { useState, useTransition } from "react";
import { deletePerson } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/** Ștergerea unei persoane adăugate din greșeală, cu confirmare în pagină. */
export default function DeletePerson({ treeId, p, onDeleted }: { treeId: string; p: PersonView; onDeleted: () => void }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (!ask) return <button className="btn" onClick={() => setAsk(true)}>Șterge</button>;
  return (
    <div className="confirm" style={{ width: "100%" }}>
      Ștergi pe <b>{p.name}</b> din arbore, cu toate legăturile lui (părinți, soți, copii)? Copiii și rudele rămân în arbore.
      <div className="actions">
        <button className="btn danger" disabled={pending} onClick={() => start(async () => { const r = await deletePerson(treeId, p.id); if (r.error) setErr(r.error); else onDeleted(); })}>
          {pending ? "Se șterge…" : "Da, șterge"}
        </button>
        <button className="btn" disabled={pending} onClick={() => setAsk(false)}>Renunță</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
