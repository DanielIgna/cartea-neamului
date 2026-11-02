"use client";
import type { PersonView } from "@/lib/tree-data";

export type Slots = Record<number, PersonView>;
type Props = { slots: Slots; selected: number; onSelect: (n: number) => void; onCenter: (id: string) => void; generations?: number };

export const genOf = (n: number) => Math.floor(Math.log2(n));
export const years = (p?: PersonView) =>
  !p ? "" : `${p.approx ? "cca. " : ""}${p.birthYear ?? "?"}${p.deathYear ? `–${p.deathYear}` : p.living ? "" : "–?"}`;
const side = (n: number) => (genOf(n) < 1 ? null : n >> (genOf(n) - 1) === 2 ? "pat" : "mat");
export const fillFor = (n: number) => (genOf(n) === 0 ? "var(--accent-soft)" : `var(--${side(n)}-${Math.min(genOf(n), 4)})`);

function arc(r1: number, r2: number, a1: number, a2: number, cx: number, cy: number) {
  const pt = (r: number, a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${x1} ${y1}A${r2} ${r2} 0 ${lg} 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 ${lg} 0 ${x4} ${y4}Z`;
}

const keyAct = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

/** Evantai: generațiile pe inele concentrice, 240°, tatăl în stânga, mama în dreapta. */
export function FanChart({ slots, selected, onSelect, onCenter, generations = 4 }: Props) {
  const cx = 360, cy = 350, R = [0, 72, 148, 214, 276, 340], A0 = -210, SPAN = 240;
  const center = slots[1];
  const sectors = [];
  for (let g = 1; g <= generations; g++) {
    const count = 2 ** g;
    for (let k = 0; k < count; k++) {
      const n = count + k, p = slots[n];
      const childKnown = !!slots[Math.floor(n / 2)];
      if (!p && !childKnown) {
        sectors.push(<path key={n} d={arc(R[g], R[g + 1], A0 + (SPAN * k) / count, A0 + (SPAN * (k + 1)) / count, cx, cy)} fill="none" stroke="var(--line)" strokeOpacity={0.5} />);
        continue;
      }
      const a1 = A0 + (SPAN * k) / count, a2 = A0 + (SPAN * (k + 1)) / count, mid = (a1 + a2) / 2, rm = (R[g] + R[g + 1]) / 2;
      const tx = cx + rm * Math.cos((mid * Math.PI) / 180), ty = cy + rm * Math.sin((mid * Math.PI) / 180);
      const rot = g <= 2 ? mid + 90 : mid < -90 ? mid + 180 : mid;
      const fs = g <= 2 ? 13 : g === 3 ? 11 : 10;
      sectors.push(
        <g key={n} className={`sector${selected === n ? " sel" : ""}`} tabIndex={0} role="button" aria-label={p ? p.name : "Loc liber, adaugă persoana"}
          onClick={() => onSelect(n)} onDoubleClick={() => p && onCenter(p.id)} onKeyDown={keyAct(() => onSelect(n))}>
          <path d={arc(R[g], R[g + 1], a1, a2, cx, cy)} fill={p ? fillFor(n) : "var(--surface)"} stroke={p ? "var(--line)" : "var(--muted)"} strokeWidth={1.2} strokeDasharray={p ? undefined : "4 4"} />
          <text x={tx} y={ty} textAnchor="middle" transform={`rotate(${rot} ${tx} ${ty})`} fill="var(--ink)" fontSize={fs}>
            {p ? (
              <>
                <tspan x={tx} dy={g <= 2 ? -8 : -6} fontWeight={700}>{g >= 3 ? p.givenName : p.name}</tspan>
                {g >= 3 && <tspan x={tx} dy={11} fontWeight={700}>{p.surname}</tspan>}
                <tspan x={tx} dy={g <= 2 ? 16 : 12} fill="var(--muted)">{years(p)}</tspan>
              </>
            ) : <tspan x={tx} dy={4} fill="var(--muted)">+ adaugă</tspan>}
          </text>
        </g>,
      );
    }
  }
  return (
    <svg viewBox="0 0 720 540" role="img" aria-label="Arbore în evantai" style={{ width: "100%", maxWidth: 760, display: "block", margin: "0 auto" }}>
      {sectors}
      {center && (
        <g className={`sector${selected === 1 ? " sel" : ""}`} tabIndex={0} role="button" aria-label={center.name} onClick={() => onSelect(1)} onKeyDown={keyAct(() => onSelect(1))}>
          <circle cx={cx} cy={cy} r={R[1] - 2} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
          <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--ink)" fontSize={15} fontWeight={700} style={{ fontFamily: "var(--display)" }}>
            <tspan x={cx}>{center.givenName}</tspan><tspan x={cx} dy={17}>{center.surname}</tspan>
          </text>
          <text x={cx} y={cy + 32} textAnchor="middle" fill="var(--muted)" fontSize={12}>{years(center)}</text>
        </g>
      )}
    </svg>
  );
}

/** Arbore clasic, de la stânga la dreapta. */
export function ClassicTree({ slots, selected, onSelect, onCenter, generations = 4 }: Props) {
  const colW = 176, bw = 160, bh = 38, rowH = 44, leaves = 2 ** generations, H = leaves * rowH + 20, W = (generations + 1) * colW;
  const pos: Record<number, { x: number; y: number }> = {};
  for (let g = 0; g <= generations; g++) for (let k = 0; k < 2 ** g; k++) pos[2 ** g + k] = { x: 10 + g * colW, y: (H / 2 ** g) * k + H / 2 ** g / 2 };
  const visible = (n: number) => n === 1 || !!slots[n] || !!slots[Math.floor(n / 2)];
  const all = Object.keys(pos).map(Number).filter(visible);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Arbore clasic" style={{ width: "100%", minWidth: 640, maxWidth: 900 }}>
      {all.filter((n) => n > 1).map((n) => {
        const a = pos[Math.floor(n / 2)], b = pos[n], mx = a.x + bw + (colW - bw) / 2;
        return <path key={`l${n}`} d={`M${a.x + bw} ${a.y}H${mx}V${b.y}H${b.x}`} fill="none" stroke="var(--line)" strokeWidth={1.2} />;
      })}
      {all.map((n) => {
        const p = slots[n], { x, y } = pos[n];
        return (
          <g key={n} className={`sector${selected === n ? " sel" : ""}`} tabIndex={0} role="button" aria-label={p ? p.name : "Loc liber"}
            onClick={() => onSelect(n)} onDoubleClick={() => p && onCenter(p.id)} onKeyDown={keyAct(() => onSelect(n))}>
            <rect x={x} y={y - bh / 2} width={bw} height={bh} rx={6} fill={p ? fillFor(n) : "var(--surface)"} stroke={p ? "var(--line)" : "var(--muted)"} strokeDasharray={p ? undefined : "4 4"} />
            {p ? (
              <>
                <text x={x + 10} y={y - 3} fill="var(--ink)" fontSize={12.5} fontWeight={700}>{p.name}</text>
                <text x={x + 10} y={y + 12} fill="var(--muted)" fontSize={11}>{years(p)}{p.birthPlace ? ` · ${p.birthPlace}` : ""}</text>
              </>
            ) : <text x={x + 10} y={y + 4} fill="var(--muted)" fontSize={12}>+ adaugă</text>}
          </g>
        );
      })}
    </svg>
  );
}
