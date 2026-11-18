"use client";
import { useState } from "react";
import Link from "next/link";
import { STEP_LABEL, kinship, roman, type Step } from "@/lib/unelte/rudenie";

const STEPS: Step[] = ["tata", "mama", "frate", "sora", "fiu", "fiica", "sot", "sotie"];
const lui = (s: Step) => (["mama", "sora", "fiica", "sotie"].includes(s) ? "ei" : "lui");

/** Calculatorul de rudenie: drumul se alege cu butoane, iar rezultatul se calculează în browser (src/lib/unelte/rudenie.ts). */
export default function KinCalc({ initial = [] as Step[] }: { initial?: Step[] }) {
  const [path, setPath] = useState<Step[]>(initial);
  const r = path.length ? kinship(path) : null;
  const words = ["eu", ...path.map((s, i) => (i === 0 ? STEP_LABEL[s] : `${STEP_LABEL[s]} ${lui(path[i - 1])}`))];
  return (
    <div className="card kin-calc">
      <p className="kin-path" aria-live="polite"><b>{words.join(" → ")}</b></p>
      <div className="chips" role="group" aria-label="Adaugă un pas">
        {STEPS.map((s) => <button key={s} type="button" className="chip" onClick={() => setPath([...path, s])} disabled={path.length >= 8}>+ {STEP_LABEL[s]}</button>)}
      </div>
      <p className="kin-actions">
        <button type="button" className="btn" onClick={() => setPath(path.slice(0, -1))} disabled={!path.length}>Șterge ultimul pas</button>{" "}
        <button type="button" className="btn" onClick={() => setPath([])} disabled={!path.length}>De la capăt</button>
      </p>
      {r && ("error" in r ? <p className="kin-error" role="status">{r.error}</p> : (
        <div className="kin-result" role="status">
          <p className="kin-name">{r.name}</p>
          <p><b>{r.degree === null ? "Fără grad de rudenie" : `${r.affine ? "Afin" : "Rudă"} de gradul ${roman(r.degree)}`}</b>{r.degree !== null && `, linie ${r.line}`}</p>
          <p>{r.explain}</p>
          {r.page && <p><Link href={`/unelte/rudenie/${r.page}`}>Mai multe despre această relație →</Link></p>}
          <p className="cta-top">
            <Link className="btn primary" href="/intrare?mod=cont-nou&src=unealta-rudenie">Salvează-i pe toți într-un arbore →</Link>
            <small className="muted">7 zile gratuite, fără card</small>
          </p>
        </div>
      ))}
    </div>
  );
}
