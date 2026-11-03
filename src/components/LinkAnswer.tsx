"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { answerLink } from "@/app/harta-actions";

/** Răspunsul la o cerere „Din aceleași locuri”: Acceptă / Refuză, „Încheie legătura” sau „Acceptă totuși”. */
export default function LinkAnswer({ id, mode }: { id: string; mode: "ask" | "end" | "undo" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function answer(accept: boolean) {
    setBusy(true); setErr(null);
    const res = await answerLink(id, accept);
    setBusy(false);
    if (res.error) setErr(res.error); else router.refresh();
  }
  return (
    <span className="actions" style={{ margin: 0, alignItems: "center" }}>
      {mode === "ask" && <>
        <button className="btn primary" disabled={busy} onClick={() => answer(true)}>Acceptă</button>
        <button className="btn" disabled={busy} onClick={() => answer(false)}>Refuză</button>
      </>}
      {mode === "undo" && <button className="btn" disabled={busy} onClick={() => answer(true)}>Acceptă totuși</button>}
      {mode === "end" && (sure
        ? <><small>Nu vă veți mai putea scrie.</small><button className="btn" disabled={busy} onClick={() => answer(false)}>Da, încheie</button><button className="btn" onClick={() => setSure(false)}>Nu</button></>
        : <button className="linklike" style={{ fontSize: 13 }} onClick={() => setSure(true)}>Încheie legătura</button>)}
      {err && <small className="err">{err}</small>}
    </span>
  );
}
