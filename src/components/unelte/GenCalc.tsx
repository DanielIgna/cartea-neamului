"use client";
import { useState } from "react";
import Link from "next/link";
import { generationYears } from "@/lib/unelte/unelte";

/** Calculatorul de generații: o estimare a anilor de naștere, generație cu generație, făcută în browser. */
export default function GenCalc() {
  const now = new Date().getFullYear();
  const [year, setYear] = useState("1990");
  const y = Number(year);
  const ok = Number.isInteger(y) && y >= 1700 && y <= now;
  return (
    <div className="card">
      <label className="gen-in">Anul nașterii (al tău sau al celui mai vechi strămoș pe care îl știi sigur){" "}
        <input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} aria-describedby="gen-help" />
      </label>
      <p id="gen-help" className="muted small">Un an între 1700 și {now}.</p>
      {ok ? (
        <>
          <div className="an-scroll">
            <table className="an-table gen-table">
              <thead><tr><th>Generația</th><th>Cel mai probabil</th><th>Interval de căutat</th></tr></thead>
              <tbody>{generationYears(y).map((g) => <tr key={g.name}><td>{g.name}</td><td>în jur de {g.likely}</td><td>{g.from}–{g.to}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="cta-top">
            <Link className="btn primary" href="/intrare?mod=cont-nou&src=unealta-generatii">Începe arborele cu ei →</Link>
            <small className="muted">7 zile gratuite, fără card</small>
          </p>
        </>
      ) : <p role="status">Scrie un an cu patru cifre.</p>}
    </div>
  );
}
