"use client";
import { useActionState, useState } from "react";
import { createInviteLink } from "@/app/actions";

export default function InvitePanel({ treeId, personId, personName }: { treeId: string; personId?: string; personName?: string }) {
  const [state, action, pending] = useActionState(createInviteLink, null);
  const [copied, setCopied] = useState("");
  const copy = async (v: string) => {
    try { await navigator.clipboard.writeText(v); setCopied("Link copiat."); } catch { setCopied("Selectează linkul și copiază-l manual."); }
  };
  return (
    <form action={action} className="form">
      <input type="hidden" name="treeId" value={treeId} />
      {personId && <input type="hidden" name="personId" value={personId} />}
      <label>Ce poate face {personName ?? "ruda"}
        <select name="role" defaultValue="contributor">
          <option value="contributor">Contributor: adaugă persoane, poze, documente</option>
          <option value="editor">Editor: corectează tot arborele</option>
          <option value="viewer">Vizitator: doar vede</option>
        </select>
      </label>
      <button className="btn primary" disabled={pending}>{pending ? "Se creează…" : personId ? `Creează invitație pentru ${personName}` : "Creează link de invitație"}</button>
      {state && "error" in state && state.error && <p className="err">{state.error}</p>}
      {state && "link" in state && state.link && (
        <div className="linkbox">
          <input readOnly value={state.link} onFocus={(e) => e.currentTarget.select()} aria-label="Link de invitație" />
          <button type="button" className="btn" onClick={() => copy(state.link!)}>Copiază</button>
          <small className="muted" style={{ width: "100%" }}>{copied || `Valabil până la ${state.expiresAt}. Trimite-l pe WhatsApp sau email.`}</small>
        </div>
      )}
    </form>
  );
}
