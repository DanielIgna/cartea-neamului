"use client";
import { useActionState } from "react";
import { createTree } from "@/app/actions";

/** Arborele făcut în alt program de genealogie, adus întreg dintr-un fișier GEDCOM. Pornirea de la zero e în FamilyStart. */
export default function GedcomImport() {
  const [state, action, pending] = useActionState(createTree, null);
  return (
    <form action={action} className="form">
      <h2 style={{ fontSize: 20 }}>Ai arborele într-un fișier?</h2>
      <p className="muted" style={{ margin: 0 }}>Dacă l-ai făcut în alt program de genealogie, salvează-l acolo ca fișier GEDCOM (.ged) și adu-l aici întreg.</p>
      <label>Numele arborelui<input name="name" placeholder="Neamul Pop din Ieud" required /></label>
      <label>Regiunea<input name="region" placeholder="Maramureș" /></label>
      <label>Fișierul GEDCOM<input type="file" name="gedcom" accept=".ged,.gedcom,text/plain" required /></label>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Se aduce…" : "Adu arborele"}</button>
    </form>
  );
}
