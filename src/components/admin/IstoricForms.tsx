"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTreeLimit, saveUserLimit, undoTreeChange, type AdminFormState } from "@/app/admin-actions";

const UNDO_LABEL = { restore: "Pune înapoi", revert: "Anulează corectura", remove: "Scoate din arbore" } as const;
const UNDO_ASK = {
  restore: "Pun fișa înapoi în arbore, cu legăturile ei?",
  revert: "Pun înapoi valorile de dinainte de această corectură?",
  remove: "Scot persoana din arbore? Rămâne în istoric și se poate pune înapoi.",
} as const;

/** Butonul de anulare de pe un rând din istoric, cu o confirmare în pagină (fără ferestre ale browserului). */
export function UndoButton({ logId, kind }: { logId: string; kind: keyof typeof UNDO_LABEL }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [msg, setMsg] = useState<AdminFormState>(null);
  const [pending, start] = useTransition();
  if (msg?.ok) return <span className="muted" role="status">{msg.ok}</span>;
  if (!ask) return <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 13 }} onClick={() => setAsk(true)}>{UNDO_LABEL[kind]}</button>;
  return (
    <span style={{ display: "grid", gap: 6 }}>
      <small>{UNDO_ASK[kind]}</small>
      <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" className="btn primary" style={{ padding: "3px 10px", fontSize: 13 }} disabled={pending}
          onClick={() => start(async () => { const r = await undoTreeChange(logId); setMsg(r); if (r?.ok) router.refresh(); })}>{pending ? "…" : "Da"}</button>
        <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 13 }} onClick={() => { setAsk(false); setMsg(null); }}>Nu</button>
      </span>
      {msg?.error && <small className="err">{msg.error}</small>}
    </span>
  );
}

type Opt = { id: string; label: string };

/** Limita unui om: alegi omul, limita și o notă (de ce). */
export function UserLimitForm({ people, modes, preset }: { people: Opt[]; modes: Record<string, string>; preset?: { userId: string; mode: string; note: string | null } }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveUserLimit, null);
  return (
    <form action={action} className="form">
      <div className="row">
        <label>Omul
          <select name="userId" defaultValue={preset?.userId ?? ""} required>
            <option value="" disabled>Alege…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label>Limita
          <select name="mode" defaultValue={preset?.mode ?? "fara-stergeri"}>
            {Object.entries(modes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            <option value="normal">Fără limită (ca toți)</option>
          </select>
        </label>
      </div>
      <label>Notă pentru tine (de ce)
        <input name="note" maxLength={200} defaultValue={preset?.note ?? ""} placeholder="de pildă: a șters din greșeală frații lui Avram" />
      </label>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending}>{pending ? "Salvez…" : "Salvează limita"}</button>
        <span role="status" className={state?.error ? "err" : "muted"}>{state?.error ?? state?.ok ?? ""}</span>
      </div>
    </form>
  );
}

/** Limita unui arbore întreg. */
export function TreeLimitForm({ trees, modes, preset }: { trees: Opt[]; modes: Record<string, string>; preset?: { treeId: string } }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveTreeLimit, null);
  return (
    <form action={action} className="form">
      <div className="row">
        <label>Arborele
          <select name="treeId" defaultValue={preset?.treeId ?? ""} required>
            <option value="" disabled>Alege…</option>
            {trees.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label>Limita
          <select name="mode" defaultValue="editori">
            {Object.entries(modes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            <option value="normal">Deschis, ca înainte</option>
          </select>
        </label>
      </div>
      <label>Notă pentru tine (de ce)
        <input name="note" maxLength={200} placeholder="de pildă: se ceartă doi veri pe aceeași bunică" />
      </label>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending}>{pending ? "Salvez…" : "Salvează limita"}</button>
        <span role="status" className={state?.error ? "err" : "muted"}>{state?.error ?? state?.ok ?? ""}</span>
      </div>
    </form>
  );
}

/** Scoate repede o limită din listă. */
export function LiftLimit({ kind, id }: { kind: "user" | "tree"; id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button type="button" className="btn" style={{ padding: "3px 10px", fontSize: 13 }} disabled={pending} onClick={() => start(async () => {
        const f = new FormData();
        f.set(kind === "user" ? "userId" : "treeId", id);
        f.set("mode", "normal");
        const r = await (kind === "user" ? saveUserLimit : saveTreeLimit)(null, f);
        if (r?.error) setErr(r.error); else router.refresh();
      })}>{pending ? "…" : "Scoate limita"}</button>
      {err && <small className="err">{err}</small>}
    </>
  );
}
