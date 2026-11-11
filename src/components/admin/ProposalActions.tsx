"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideHomePhoto } from "@/app/film-actions";

/** Butoanele unei poze propuse: „Pune pe prima pagină”, „Nu acum” sau „Scoate de pe pagină”. */
export default function ProposalActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (d: "approve" | "reject" | "remove") => start(async () => { const r = await decideHomePhoto(id, d); setMsg(r); router.refresh(); });
  return (
    <div className="actions" style={{ marginTop: 8 }}>
      {status !== "approved" && <button className="btn primary" disabled={pending} onClick={() => run("approve")}>Pune pe prima pagină</button>}
      {status === "pending" && <button className="btn" disabled={pending} onClick={() => run("reject")}>Nu acum</button>}
      {status === "approved" && <button className="btn" disabled={pending} onClick={() => run("remove")}>Scoate de pe pagină</button>}
      {msg?.ok && <span className="ok" style={{ fontSize: 14 }}>{msg.ok}</span>}
      {msg?.error && <span className="err" style={{ fontSize: 14 }}>{msg.error}</span>}
    </div>
  );
}
