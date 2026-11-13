"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerProblem, deleteProblem } from "@/app/probleme-actions";

/** Răspunsul pentru om și starea problemei, în Admin → Probleme. */
export default function ProblemActions({ id, reply, status }: { id: string; reply: string; status: string }) {
  const router = useRouter();
  const [text, setText] = useState(reply);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (st: string) => start(async () => { setMsg(await answerProblem(id, text, st)); router.refresh(); });
  return (
    <div className="stack" style={{ gap: 8 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span className="muted" style={{ fontSize: 14 }}>Răspunsul pentru om (îl vede pe pagina „Raportează o problemă”)</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={4000} style={{ font: "inherit", resize: "vertical" }}
          placeholder="De pildă: Mulțumim! Am reparat legătura dintre Maria și Ion." />
      </label>
      <div className="actions" style={{ flexWrap: "wrap" }}>
        <button className="btn primary" disabled={pending} onClick={() => run("rezolvat")}>{text.trim() && text.trim() !== reply ? "Trimite și marchează rezolvată" : "Marchează rezolvată"}</button>
        <button className="btn" disabled={pending} onClick={() => run(status === "rezolvat" ? "vazut" : status)}>{text.trim() !== reply ? "Trimite răspunsul" : status === "rezolvat" ? "Redeschide" : "Salvează"}</button>
        {status === "nou" && <button className="btn" disabled={pending} onClick={() => run("vazut")}>Am văzut-o</button>}
        <button className="btn" disabled={pending} onClick={() => { if (window.confirm("Ștergi de tot problema și pozele ei?")) start(async () => { setMsg(await deleteProblem(id)); router.refresh(); }); }}>Șterge</button>
      </div>
      {msg?.ok && <span className="ok" style={{ fontSize: 14 }}>{msg.ok}</span>}
      {msg?.error && <span className="err" style={{ fontSize: 14 }}>{msg.error}</span>}
    </div>
  );
}
