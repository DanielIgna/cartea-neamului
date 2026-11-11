"use client";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteHomeUpload, setHomeActive } from "@/app/admin-actions";
import { shrinkPhoto } from "@/lib/shrink-photo";

type Option = { id: string; src: string; custom: boolean; credit?: string };

/**
 * Un loc de pe prima pagină în Admin → Poze prima pagină: toate pozele dintre care se poate alege (inițiala, variantele,
 * cele încărcate). Un clic pe poză o pune pe pagină; la banner poți bifa mai multe, care se schimbă singure.
 */
export default function HomeImageSlot({ slot, label, hint, wide, multi, max, options, active: initial }:
  { slot: string; label: string; hint: string; wide: boolean; multi: boolean; max: number; options: Option[]; active: string[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(initial);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();

  function save(next: string[]) {
    const prev = active;
    setActive(next); setMsg(null);
    start(async () => {
      const r = await setHomeActive(slot, next);
      if (r?.error) setActive(prev);
      setMsg(r); router.refresh();
    });
  }
  function pick(id: string) {
    if (!multi) { if (active[0] !== id) save([id]); return; }
    if (active.includes(id)) {
      if (active.length === 1) { setMsg({ error: "Lasă măcar o poză în banner." }); return; }
      save(active.filter((a) => a !== id));
    } else if (active.length >= max) setMsg({ error: `În banner pot sta cel mult ${max} poze deodată.` });
    else save([...active, id]);
  }

  async function upload(file: File) {
    setBusy(true); setMsg(null);
    try {
      const small = await shrinkPhoto(file, wide ? 2400 : 1600);
      const fd = new FormData();
      fd.set("slot", slot); fd.set("file", small);
      const res = await fetch("/api/admin/poze", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ error: body.error ?? "Nu s-a putut încărca poza." });
      else { setMsg({ ok: multi ? "Am adăugat poza în banner." : "Am pus poza ta pe pagină." }); router.refresh(); }
    } catch {
      setMsg({ error: "Nu s-a putut încărca poza. Încearcă din nou." });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  // După încărcare sau ștergere vin opțiuni noi de la server; alegerea de pe pagină o luăm tot de acolo.
  const [seen, setSeen] = useState(initial.join());
  if (initial.join() !== seen) { setSeen(initial.join()); setActive(initial); }

  return (
    <div className={`card home-slot${wide ? " wide" : ""}`}>
      <h3>{label}</h3>
      <p className="muted">{hint}</p>
      <ul className={`home-opts${wide ? " wide" : ""}`}>
        {options.map((o) => {
          const n = active.indexOf(o.id);
          return (
            <li key={o.id} className={n >= 0 ? "on" : undefined}>
              <button type="button" onClick={() => pick(o.id)} disabled={pending || busy} aria-pressed={n >= 0}
                title={n >= 0 ? (multi ? "Scoate din banner" : "Pe pagină acum") : "Pune pe pagină"}>
                <Image src={o.src} alt="" fill sizes="200px" unoptimized={o.custom} />
                {n >= 0 && <span className="pill ok">{multi ? `${n + 1} · pe pagină` : "pe pagină"}</span>}
                {o.custom && <span className="pill home-opt-own">poza ta</span>}
              </button>
              {o.custom && (
                <button type="button" className="home-opt-del" disabled={pending || busy} aria-label="Șterge poza"
                  onClick={() => { if (confirm("Ștergi poza asta?")) start(async () => { const r = await deleteHomeUpload(slot, o.id.slice(2)); setMsg(r); router.refresh(); }); }}>
                  ×
                </button>
              )}
              {o.credit && <small className="muted">{o.credit}</small>}
            </li>
          );
        })}
      </ul>
      <div className="actions">
        <label className="btn primary">
          {busy ? "Se încarcă…" : multi ? "Adaugă o poză în banner" : "Pune poza ta"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        </label>
        {multi && <span className="muted">Bifate: {active.length} din cel mult {max}. Se schimbă la câteva secunde, în ordinea numerelor.</span>}
      </div>
      {msg && <p role="status" className={msg.error ? "err" : "muted"}>{msg.error ?? msg.ok}</p>}
    </div>
  );
}
