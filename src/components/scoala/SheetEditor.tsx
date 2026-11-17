"use client";
import { useEffect, useState } from "react";
import type { SheetSlug } from "@/lib/scoala";

/**
 * Fișa pentru școală completată pe ecran (cu cont): câmpurile se țin pe acest telefon sau calculator (localStorage), iar
 * „Tipărește” scoate fișa curată, pe A4, cu carteaneamului.ro în subsol.
 */
export default function SheetEditor({ slug, title, questions, quiz }: { slug: SheetSlug; title: string; questions: string[]; quiz: [string, string][] }) {
  const key = `cn-fisa-${slug}`;
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => { try { setV(JSON.parse(localStorage.getItem(key) ?? "{}")); } catch { /* gol */ } }, [key]);
  const set = (k: string, x: string) => setV((o) => { const n = { ...o, [k]: x }; try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* fără stocare */ } return n; });
  const box = (k: string, label: string) => (
    <div className="ws-box" key={k}>
      <small>{label}</small>
      <input aria-label={`${label}: nume`} placeholder="Nume și prenume" value={v[`${k}-n`] ?? ""} onChange={(e) => set(`${k}-n`, e.target.value)} />
      <input aria-label={`${label}: anul și locul nașterii`} placeholder="Anul, localitatea" value={v[`${k}-d`] ?? ""} onChange={(e) => set(`${k}-d`, e.target.value)} />
    </div>
  );
  const row = (keys: [string, string][]) => <div className="ws-row" style={{ gridTemplateColumns: `repeat(${keys.length}, 1fr)` }}>{keys.map(([k, l]) => box(k, l))}</div>;
  return (
    <div className="worksheet">
      <div className="ws-head">
        <h1>{title}</h1>
        <input className="ws-name" aria-label="Numele elevului" placeholder="Numele elevului, clasa" value={v.elev ?? ""} onChange={(e) => set("elev", e.target.value)} />
      </div>
      {slug === "arbore-strabunici" && row([["ss1", "Străbunic"], ["ss2", "Străbunică"], ["ss3", "Străbunic"], ["ss4", "Străbunică"], ["ss5", "Străbunic"], ["ss6", "Străbunică"], ["ss7", "Străbunic"], ["ss8", "Străbunică"]])}
      {(slug === "arbore-3-generatii" || slug === "arbore-strabunici") && (
        <>
          {row([["bp1", "Bunicul (tata tatălui)"], ["bp2", "Bunica (mama tatălui)"], ["bm1", "Bunicul (tata mamei)"], ["bm2", "Bunica (mama mamei)"]])}
          {row([["tata", "Tata"], ["mama", "Mama (și numele de fată)"]])}
          {row([["eu", "Eu"]])}
        </>
      )}
      {slug === "interviu-bunici" && (
        <ol className="ws-q">
          {questions.map((q, i) => <li key={q}><b>{q}</b><textarea rows={2} aria-label={q} value={v[`q${i}`] ?? ""} onChange={(e) => set(`q${i}`, e.target.value)} /></li>)}
        </ol>
      )}
      {slug === "cine-ce-ruda-imi-este" && (
        <ol className="ws-q">
          {quiz.map(([q]) => <li key={q}><b>{q}</b> <input aria-label={q} value={v[q] ?? ""} onChange={(e) => set(q, e.target.value)} /></li>)}
        </ol>
      )}
      <p className="ws-foot">carteaneamului.ro · fișă gratuită pentru proiectul de la școală</p>
      <div className="actions no-print"><button type="button" className="btn primary" onClick={() => window.print()}>Tipărește</button></div>
    </div>
  );
}
