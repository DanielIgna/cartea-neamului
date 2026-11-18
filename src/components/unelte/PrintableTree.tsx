"use client";
import { useState } from "react";

const REL: Record<number, string[]> = {
  0: ["Eu"], 1: ["Tata", "Mama"], 2: ["Bunicul", "Bunica", "Bunicul", "Bunica"],
  3: ["Străbunic", "Străbunică", "Străbunic", "Străbunică", "Străbunic", "Străbunică", "Străbunic", "Străbunică"],
};
const relOf = (g: number, i: number) => REL[g]?.[i] ?? (i % 2 ? "Stră-străbunică" : "Stră-străbunic");

/** Arborele gol de tipărit: rândurile de sus în jos sunt strămoșii cei mai vechi, iar jos ești tu. Totul se face în browser. */
export default function PrintableTree() {
  const [gens, setGens] = useState(4);
  const [title, setTitle] = useState("Arborele familiei");
  const rows = Array.from({ length: gens }, (_, g) => gens - 1 - g);
  return (
    <div className="sp sp-blank">
      <div className="sp-tools no-print">
        <div className="sp-opts" role="group" aria-label="Câte generații">
          {[3, 4, 5].map((n) => <button key={n} type="button" className="btn" aria-pressed={gens === n} onClick={() => setGens(n)}>{n} generații</button>)}
        </div>
        <label>Titlul foii <input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} /></label>
        <p><button type="button" className="btn primary" onClick={() => window.print()}>Tipărește sau salvează PDF</button></p>
      </div>
      <h2 className="sp-title">{title}</h2>
      <div className="sp-tree">
        {rows.map((g) => {
          const n = 2 ** g;
          return (
            <div key={g} className={`sp-row sp-row-${n}`}>
              {Array.from({ length: n }, (_, i) => (
                <div key={i} className={`sp-box${g === 0 ? " sp-me" : i % 2 ? "" : " sp-m"}`}>
                  <span className="sp-rel">{relOf(g, i)}</span>
                  <span className="sp-line" /><span className="sp-line" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p className="sp-foot">carteaneamului.ro</p>
    </div>
  );
}
