"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setChatLimit } from "@/app/actions";
import { romanDegree } from "@/lib/kinship";

/** Doar proprietarul arborelui alege până la ce grad de rudenie își pot scrie membrii. */
export default function ChatLimit({ treeId, limit }: { treeId: string; limit: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <label className="gen-select" style={{ marginBottom: 10 }}>
      Ca proprietar, alegi până la ce grad își pot scrie rudele:
      <select defaultValue={limit} disabled={pending} onChange={(e) => {
        const v = Number(e.target.value);
        start(async () => { const r = await setChatLimit(treeId, v); setErr(r.error ?? null); router.refresh(); });
      }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>gradul {romanDegree(d)}{d === 2 ? " (frați, bunici)" : d === 4 ? " (veri primari)" : d === 6 ? " (veri de-al doilea)" : ""}</option>)}
      </select>
      {err && <span className="err">{err}</span>}
    </label>
  );
}
