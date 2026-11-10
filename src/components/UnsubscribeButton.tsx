"use client";
import { useState, useTransition } from "react";
import { unsubscribePartner } from "@/app/parteneri-actions";

/** Butonul de pe pagina de dezabonare: retrage acordul la apăsare. Textele vin traduse de la pagină. */
export default function UnsubscribeButton({ token, label, working, done, bad }: { token: string; label: string; working: string; done: string; bad: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (msg) return <p className={msg.ok ? "notice" : "err"} role="status">{msg.text}</p>;
  return (
    <div className="actions">
      <button className="btn primary" disabled={pending} onClick={() => start(async () => {
        const r = await unsubscribePartner(token);
        setMsg(r.ok ? { ok: true, text: done } : { ok: false, text: bad });
      })}>{pending ? working : label}</button>
    </div>
  );
}
