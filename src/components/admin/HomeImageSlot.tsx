"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetHomeImage } from "@/app/admin-actions";
import { shrinkPhoto } from "@/lib/shrink-photo";

/** Un loc de pe prima pagină în Admin → Poze prima pagină: poza de acum, încărcarea uneia noi și întoarcerea la cea inițială. */
export default function HomeImageSlot({ slot, label, hint, src, original, custom, wide }:
  { slot: string; label: string; hint: string; src: string; original: string; custom: boolean; wide: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();

  async function upload(file: File) {
    setBusy(true); setMsg(null);
    setPreview(URL.createObjectURL(file));
    try {
      const small = await shrinkPhoto(file, wide ? 2400 : 1600);
      const fd = new FormData();
      fd.set("slot", slot); fd.set("file", small);
      const res = await fetch("/api/admin/poze", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ error: body.error ?? "Nu s-a putut încărca poza." }); setPreview(null); }
      else { setMsg({ ok: "Am pus poza nouă. Așa se vede de acum pe prima pagină." }); router.refresh(); }
    } catch {
      setMsg({ error: "Nu s-a putut încărca poza. Încearcă din nou." }); setPreview(null);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="card home-slot">
      <div className={`home-slot-img${wide ? " wide" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview ?? src} alt={`Poza de acum: ${label}`} />
        {custom && !preview && <span className="pill ok">poza ta</span>}
      </div>
      <h3>{label}</h3>
      <p className="muted">{hint}</p>
      <div className="actions">
        <label className="btn primary">
          {busy ? "Se încarcă…" : "Pune altă poză"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        </label>
        {custom && (
          <button type="button" className="btn" disabled={pending || busy}
            onClick={() => start(async () => { const r = await resetHomeImage(slot); setMsg(r); setPreview(null); router.refresh(); })}>
            Pune înapoi poza inițială
          </button>
        )}
        {custom && <a className="muted" href={original} target="_blank" rel="noreferrer">vezi poza inițială</a>}
      </div>
      {msg && <p role="status" className={msg.error ? "err" : "muted"}>{msg.error ?? msg.ok}</p>}
    </div>
  );
}
