"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Graficele din Admin → Analiză, fără biblioteci: linia traficului (cu linie de urmărire și cifrele la atingere), inelul surselor
 * și harta „zi × oră”. Culorile vin din --viz-1… (globals.css), alese și verificate pentru daltonism, în tema deschisă și închisă.
 */

type Point = { key: string; label: string; visitors: number; sessions: number };

export function TrafficChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // Lățimea desenului e cea reală a cardului, ca scrisul să rămână de aceeași mărime pe telefon și pe calculator.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 500 ? 200 : 240, L = 34, B = 24, T = 10;
  const max = Math.max(4, ...data.map((d) => Math.max(d.visitors, d.sessions)));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const x = (i: number) => L + (data.length <= 1 ? (W - L) / 2 : (i * (W - L - 8)) / (data.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const line = (k: "visitors" | "sessions") => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join("");
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const every = Math.max(1, Math.ceil(data.length / Math.max(3, Math.floor(W / 90))));
  const h = hover != null ? data[hover] : null;
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * (W - L) + L;
    let best = 0;
    data.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    setHover(best);
  };
  return (
    <div className="viz">
      <div className="viz-legend" aria-hidden="true">
        <span><i style={{ background: "var(--viz-1)" }} />Vizitatori unici</span>
        <span><i style={{ background: "var(--viz-2)" }} />Sesiuni</span>
      </div>
      <div style={{ position: "relative" }} ref={box}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Traficul pe zile: vizitatori unici și sesiuni" style={{ width: "100%", height: "auto", display: "block" }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t ? "3 4" : undefined} />
              <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{t}</text>
            </g>
          ))}
          {data.map((d, i) => (i % every === 0 || i === data.length - 1) && (
            <text key={d.key} x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">{d.label}</text>
          ))}
          <path d={`${line("visitors")}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="var(--viz-1)" opacity={0.12} />
          <path d={line("sessions")} fill="none" stroke="var(--viz-2)" strokeWidth={2} strokeLinejoin="round" />
          <path d={line("visitors")} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" />
          {h && hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--muted)" strokeDasharray="2 3" />
              <circle cx={x(hover)} cy={y(h.sessions)} r={4.5} fill="var(--viz-2)" stroke="var(--surface)" strokeWidth={2} />
              <circle cx={x(hover)} cy={y(h.visitors)} r={4.5} fill="var(--viz-1)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
          <rect x={L} y={0} width={W - L} height={H - B} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        {h && hover != null && (
          <div className="viz-tip" style={{ left: `${(100 * x(hover)) / W}%` }}>
            <b>{h.label}</b>
            <span><i style={{ background: "var(--viz-1)" }} />Vizitatori: {h.visitors}</span>
            <span><i style={{ background: "var(--viz-2)" }} />Sesiuni: {h.sessions}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function niceStep(max: number) {
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw && Number.isInteger(s)) ?? Math.ceil(raw);
}

/** Inelul surselor: cel mult 5 felii plus „Altele”, cu legenda (nume, număr, procent) dedesubt. */
export function Donut({ data, label }: { data: { label: string; count: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = data.slice(0, 5);
  const rest = data.slice(5).reduce((a, b) => a + b.count, 0);
  const parts = rest ? [...top, { label: "Altele", count: rest }] : top;
  const total = parts.reduce((a, b) => a + b.count, 0);
  const R = 70, r = 44, C = 90;
  let a0 = -Math.PI / 2;
  const arcs = parts.map((p, i) => {
    const a1 = a0 + (total ? (2 * Math.PI * p.count) / total : 0);
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const pt = (rad: number, a: number) => `${(C + rad * Math.cos(a)).toFixed(2)},${(C + rad * Math.sin(a)).toFixed(2)}`;
    const d = parts.length === 1
      ? `M${C},${C - R}A${R},${R} 0 1 1 ${C - 0.01},${C - R}L${C - 0.01},${C - r}A${r},${r} 0 1 0 ${C},${C - r}Z`
      : `M${pt(R, a0)}A${R},${R} 0 ${big} 1 ${pt(R, a1)}L${pt(r, a1)}A${r},${r} 0 ${big} 0 ${pt(r, a0)}Z`;
    a0 = a1;
    return { d, i, p };
  });
  const h = hover != null ? parts[hover] : null;
  return (
    <div className="viz donut">
      <svg viewBox="0 0 180 180" role="img" aria-label={label} style={{ width: 180, maxWidth: "100%", height: "auto" }}>
        {total ? arcs.map(({ d, i, p }) => (
          <path key={p.label} d={d} fill={`var(--viz-${i + 1})`} stroke="var(--surface)" strokeWidth={2} opacity={hover == null || hover === i ? 1 : 0.45}
            onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}><title>{`${p.label}: ${p.count}`}</title></path>
        )) : <circle cx={C} cy={C} r={(R + r) / 2} fill="none" stroke="var(--line)" strokeWidth={R - r} />}
        <text x={C} y={C - 2} textAnchor="middle" fontSize={h ? 13 : 22} fontWeight={700} fill="var(--ink)">{h ? h.label.slice(0, 16) : total}</text>
        <text x={C} y={C + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{h ? `${h.count} · ${total ? Math.round((100 * h.count) / total) : 0}%` : "sesiuni"}</text>
      </svg>
      <ul className="viz-keys">
        {parts.map((p, i) => (
          <li key={p.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <i style={{ background: `var(--viz-${i + 1})` }} />{p.label} <b>{p.count}</b> <small>{total ? Math.round((100 * p.count) / total) : 0}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
/** Harta „zi × oră”: cu cât e mai închisă căsuța, cu atât au început mai multe sesiuni atunci. */
export function WeekHeat({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  return (
    <div className="viz heat" role="table" aria-label="Sesiunile pe zile și ore">
      <div role="row" className="heat-row heat-head"><span />{Array.from({ length: 24 }, (_, h) => <span key={h} role="columnheader">{h % 3 === 0 ? h : ""}</span>)}</div>
      {grid.map((row, d) => (
        <div role="row" className="heat-row" key={d}>
          <span role="rowheader">{DAYS[d]}</span>
          {row.map((v, h) => (
            <span key={h} role="cell" className="heat-cell" title={`${DAYS[d]}, ${h}:00–${h}:59: ${v} ${v === 1 ? "sesiune" : "sesiuni"}`}
              style={{ background: v ? `color-mix(in srgb, var(--viz-1) ${Math.round(12 + (88 * v) / max)}%, var(--surface-2))` : undefined }} />
          ))}
        </div>
      ))}
      <div className="heat-scale"><span>puține</span><i /><span>multe</span></div>
    </div>
  );
}
