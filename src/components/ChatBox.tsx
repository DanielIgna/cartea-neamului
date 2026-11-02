"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions";

type Msg = { id: string; mine: boolean; body: string; at: string };
const when = (iso: string) => new Date(iso).toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Conversația: mesajele noi apar singure (reîmprospătare la 8 secunde cât pagina e deschisă). */
export default function ChatBox({ treeId, to, messages, canSend, reason }: { treeId: string; to: string; messages: Msg[]; canSend: boolean; reason: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendMessage, null);
  const form = useRef<HTMLFormElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state && "ok" in state) { form.current?.reset(); router.refresh(); } }, [state]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 8000);
    return () => clearInterval(t);
  }, [router]);
  return (
    <>
      <div className="chat" style={{ margin: "14px 0" }}>
        {messages.length ? messages.map((m) => (
          <div key={m.id} className={`bubble${m.mine ? " me" : ""}`}>{m.body}<small>{when(m.at)}</small></div>
        )) : <p className="muted">Niciun mesaj încă. Scrie primul.</p>}
        <div ref={end} />
      </div>
      {canSend ? (
        <form ref={form} action={action} className="form">
          <input type="hidden" name="treeId" value={treeId} />
          <input type="hidden" name="to" value={to} />
          <textarea name="body" required placeholder="Scrie un mesaj…" style={{ minHeight: 70 }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.current?.requestSubmit(); } }} />
          {state && "error" in state && <p className="err">{state.error}</p>}
          <div className="actions"><button className="btn primary" disabled={pending}>{pending ? "Se trimite…" : "Trimite"}</button></div>
        </form>
      ) : <p className="muted">{reason}</p>}
    </>
  );
}
