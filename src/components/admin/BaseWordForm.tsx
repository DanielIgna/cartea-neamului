"use client";
import { useState, useTransition } from "react";
import { saveJourneyBaseWord, type AdminFormState } from "@/app/admin-actions";
import WordBlocks from "@/components/WordBlocks";

/**
 * Editorul cuvântului de la finalul călătoriei: textul într-o parte, cum se vede în cealaltă (pe telefon, unul sub altul).
 * „Pune înapoi textul inițial” cere o confirmare, ca textul scris să nu se piardă dintr-o apăsare.
 */
export default function BaseWordForm({ text: saved, original, changed, max }: { text: string; original: string; changed: boolean; max: number }) {
  const [text, setText] = useState(saved);
  const [msg, setMsg] = useState<AdminFormState>(null);
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const dirty = text.trim() !== saved.trim();
  const run = (reset: boolean) => start(async () => {
    const r = await saveJourneyBaseWord(reset ? null : text);
    setMsg(r);
    setAsking(false);
    if (r?.ok && reset) setText(original);
  });
  const edit = (v: string) => { setText(v); setMsg(null); };

  return (
    <div className="admin-zones word-editor">
      <div>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
          Un rând care începe cu „## ” e titlu, unul care începe cu „&gt; ” e verset (cu trimiterea după „ — ”), iar un rând gol începe un
          paragraf nou.
        </p>
        <textarea value={text} onChange={(e) => edit(e.target.value)} rows={24} maxLength={max} disabled={pending} aria-label="Cuvântul de la final" />
        <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>{text.length} din {max} de caractere{dirty ? " · nesalvat" : ""}</p>
        <div className="actions" style={{ marginTop: 10, alignItems: "center" }}>
          <button type="button" className="btn primary" onClick={() => run(false)} disabled={pending || !dirty || !text.trim()}>
            {pending ? "Se salvează…" : "Salvează"}
          </button>
          {dirty && <button type="button" className="btn" onClick={() => edit(saved)} disabled={pending}>Renunță la ce n-ai salvat</button>}
          {changed && !asking && <button type="button" className="btn" onClick={() => setAsking(true)} disabled={pending}>Pune înapoi textul inițial</button>}
          {changed && asking && (
            <>
              <span>Sigur? Textul tău se pierde.</span>
              <button type="button" className="btn danger" onClick={() => run(true)} disabled={pending}>Da, pune textul inițial</button>
              <button type="button" className="btn" onClick={() => setAsking(false)} disabled={pending}>Nu</button>
            </>
          )}
          {msg && <span role="status" className={msg.error ? "err" : "muted"}>{msg.error ?? msg.ok}</span>}
        </div>
      </div>
      <div>
        <div className="section-label">Cum se vede</div>
        <article className="card journey-card word word-preview"><WordBlocks text={text} /></article>
      </div>
    </div>
  );
}
