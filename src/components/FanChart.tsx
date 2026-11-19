/**
 * Arborele în evantai: tu în mijloc, părinții, bunicii și străbunicii pe inele; tata în stânga, mama în dreapta.
 * Folosit pe prima pagină (cardul „Arborele”, cu nume de probă) și în „Începe chiar acum” (src/components/TryTree.tsx),
 * unde numele scrise de vizitator apar pe loc. Fără "use client": merge și pe server, și în browser.
 */

const CX = 220, CY = 222;
const RINGS = [
  { r0: 58, r1: 108, names: [["Ion", "1948"], ["Maria", "1951"]] },
  { r0: 110, r1: 160, names: [["Mihai", "1921"], ["Ana", "1924"], ["Vasile", "1919"], ["Elena", "1926"]] },
  { r0: 162, r1: 208, names: [["Petru"], ["Ileana"], ["Toma"], ["Sofia"], ["Simion"], ["Lucia"], ["Iacob"], ["Irina"]] },
] as const;
const pt = (r: number, a: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
const f = (n: number) => n.toFixed(1);
function sector(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 0 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 0 0 ${f(x3)} ${f(y3)}Z`;
}
const FAN = RINGS.flatMap((ring, depth) => ring.names.map((name, i) => {
  const n = ring.names.length, a0 = Math.PI + (Math.PI * i) / n, a1 = Math.PI + (Math.PI * (i + 1)) / n;
  const [tx, ty] = pt((ring.r0 + ring.r1) / 2, (a0 + a1) / 2);
  return { d: sector(ring.r0, ring.r1, a0 + 0.008, a1 - 0.008), side: i < n / 2 ? "pat" : "mat", depth, tx, ty, name };
}));
const [ax, ay] = pt(222, Math.PI), [bx, by] = pt(222, 2 * Math.PI);

/** Numele de probă de pe prima pagină; `names` le poate schimba pe inele (ordinea: tata, mama, apoi bunicii…). */
export default function FanChart({ you, names, live }: { you: string; names?: (readonly string[] | undefined)[]; live?: boolean }) {
  return (
    <svg className={`lp-fan${live ? " lp-fan-live" : ""}`} viewBox="0 0 440 232" aria-hidden="true">
      <path d={`M${f(ax)} ${f(ay)}A222 222 0 0 1 ${f(bx)} ${f(by)}`} className="lp-fan-orbit" />
      {FAN.map((seg, i) => { const s = names?.[i] ? { ...seg, name: names[i]!, empty: names[i]![0] === "?" } : { ...seg, empty: false }; return (
        <g key={i} className={s.empty ? "lp-seg-empty" : undefined}>
          <path d={s.d} className={`lp-seg lp-${s.side}-${s.depth + 1}`} />
          <text x={f(s.tx)} y={f(s.ty + (s.name.length > 1 ? -2 : 4))} className={s.depth === 2 ? "lp-fan-sm" : "lp-fan-name"}>{s.name[0]}</text>
          {s.name.length > 1 && <text x={f(s.tx)} y={f(s.ty + 13)} className="lp-fan-year">{s.name[1]}</text>}
        </g>
      ); })}
      <path d={`M${CX - 54} ${CY}A54 54 0 0 1 ${CX + 54} ${CY}Z`} className="lp-you" />
      <text x={CX} y={CY - 18} className="lp-you-text">{you.length > 14 ? `${you.slice(0, 13)}…` : you}</text>
    </svg>
  );
}

