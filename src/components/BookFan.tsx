import type { PersonView } from "@/lib/tree-data";
import { arc, fanRadii, fillFor } from "@/lib/fan-geometry";
import { clip, lifeDates, years } from "@/lib/person-text";
import type { Locale } from "@/i18n/locales";

/**
 * Evantaiul strămoșilor, pentru carte: același desen ca pe site (tatăl în stânga, mama în dreapta), dar fără butoane
 * și fără „+ adaugă”. Locurile necunoscute rămân doar conturate, ca cititorul să vadă ce lipsește.
 * Se desenează pe server, ca pagina cărții să fie gata înainte să ajungă în browser, în limba cărții (datele și cuvintele vin de la pagină).
 */
export default function BookFan({ slots, generations, centerHidden = false, locale = "ro", label, livingLabel }: {
  slots: Record<number, PersonView>; generations: number; centerHidden?: boolean; locale?: Locale; label: string; livingLabel: string;
}) {
  const R = fanRadii(generations), maxR = R[generations + 1];
  const cx = maxR + 20, cy = maxR + 10, A0 = -210, SPAN = 240;
  const W = 2 * cx, H = cy + maxR * 0.5 + 20;
  const center = slots[1];
  const sectors = [];
  for (let g = 1; g <= generations; g++) {
    const count = 2 ** g;
    for (let k = 0; k < count; k++) {
      const n = count + k, p = slots[n];
      const a1 = A0 + (SPAN * k) / count, a2 = A0 + (SPAN * (k + 1)) / count, mid = (a1 + a2) / 2, rm = (R[g] + R[g + 1]) / 2;
      if (!p) {
        // Un loc gol se conturează doar lângă cineva cunoscut și doar pe inelele late; altfel desenul s-ar umple de goluri.
        if (slots[Math.floor(n / 2)] && g <= 4) sectors.push(<path key={n} d={arc(R[g], R[g + 1], a1, a2, cx, cy)} fill="none" stroke="var(--line)" strokeDasharray="3 3" />);
        continue;
      }
      const tx = cx + rm * Math.cos((mid * Math.PI) / 180), ty = cy + rm * Math.sin((mid * Math.PI) / 180);
      const left = mid < -90;
      const rot = g <= 2 ? mid + 90 : left ? mid + 180 : mid;
      const fs = g <= 2 ? 13 : g === 3 ? 11.5 : g === 4 ? 10.5 : 9.5;
      // Cât text încape: pe inelele din mijloc, de-a lungul arcului; pe celelalte, de-a lungul razei.
      const room = g <= 2 ? (rm * (SPAN / count) * Math.PI) / 180 : R[g + 1] - R[g] - 6;
      const fit = (s: string, size = fs) => clip(s, Math.max(4, Math.floor(room / (size * 0.52))));
      const label = g <= 2 ? (
        <>
          <tspan x={tx} dy={-8} fontWeight={700}>{fit(p.name)}</tspan>
          <tspan x={tx} dy={16} fill="var(--muted)">{lifeDates(p, locale)}</tspan>
        </>
      ) : g <= 4 ? (
        <>
          <tspan x={tx} dy={-6} fontWeight={700}>{fit(p.givenName)}</tspan>
          <tspan x={tx} dy={fs + 1} fontWeight={700}>{fit(p.surname)}</tspan>
          <tspan x={tx} dy={fs + 1} fill="var(--muted)" fontSize={fs - 1}>{years(p, locale)}</tspan>
        </>
      ) : (
        <>
          <tspan x={tx} dy={-2} fontWeight={700}>{fit(p.givenName)}</tspan>
          <tspan x={tx} dy={fs + 1} fill="var(--muted)" fontSize={fs - 1}>{p.birthYear ?? ""}</tspan>
        </>
      );
      sectors.push(
        <g key={n}>
          <path d={arc(R[g], R[g + 1], a1, a2, cx, cy)} fill={fillFor(n)} stroke="var(--line)" strokeWidth={g >= 6 ? 0.8 : 1.1} />
          <text x={tx} y={ty} textAnchor="middle" transform={`rotate(${rot} ${tx} ${ty})`} fill="var(--ink)" fontSize={fs}>{label}</text>
        </g>,
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: "100%", display: "block", margin: "0 auto" }}>
      {sectors}
      <circle cx={cx} cy={cy} r={R[1] - 2} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
      {center ? (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--ink)" fontSize={15} fontWeight={700} style={{ fontFamily: "var(--display)" }}>
            <tspan x={cx}>{clip(center.givenName, 16)}</tspan><tspan x={cx} dy={17}>{clip(center.surname, 16)}</tspan>
          </text>
          <text x={cx} y={cy + 32} textAnchor="middle" fill="var(--muted)" fontSize={12}>{lifeDates(center, locale)}</text>
        </>
      ) : (
        <text x={cx} y={cy + 5} textAnchor="middle" fill="var(--muted)" fontSize={13}>{centerHidden ? livingLabel : ""}</text>
      )}
    </svg>
  );
}
