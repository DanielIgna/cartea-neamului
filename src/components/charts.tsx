"use client";
import { useLocale, useTranslations } from "use-intl";
import type { PersonView } from "@/lib/tree-data";
import type { DescNode } from "@/lib/family";
import { clip, lifeDates, years } from "@/lib/person-text";
import { arc, fanRadii, fillFor, genOf } from "@/lib/fan-geometry";
export type { DescNode };
// Textele („1898–1967”, scurtarea numelor) și geometria evantaiului stau în lib, ca să le poată folosi și paginile de pe server (profilul, cartea).
export { clip, years, fanRadii, fillFor, genOf };

export type Slots = Record<number, PersonView>;
/** O singură spiță: doar neamul tatălui (locurile 2, 4–5, 8–11…) sau doar al mamei (3, 6–7, 12–15…). */
export type Side = "father" | "mother";
type Props = { slots: Slots; selected: number; onSelect: (n: number) => void; onCenter: (id: string) => void; generations?: number; side?: Side | null };
/** Locul `n` e pe spița aleasă (persoana din centru e pe amândouă). */
export const onSide = (n: number, side?: Side | null) => !side || n === 1 || n >> (genOf(n) - 1) === (side === "father" ? 2 : 3);

const keyAct = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

/**
 * Evantai: generațiile pe inele concentrice, 240°, tatăl în stânga, mama în dreapta.
 * Cu o singură spiță, neamul acelui părinte umple tot evantaiul: el e primul inel, părinții lui al doilea, și tot așa.
 */
export function FanChart({ slots, selected, onSelect, onCenter, generations = 4, side }: Props) {
  const t = useTranslations("Charts"), locale = useLocale();
  const R = fanRadii(generations), maxR = R[generations + 1];
  const cx = maxR + 20, cy = maxR + 10, A0 = -210, SPAN = 240;
  const W = 2 * cx, H = cy + maxR * 0.5 + 20;
  const center = slots[1];
  const sectors = [];
  for (let g = 1; g <= generations; g++) {
    // Pe o singură spiță, fiecare inel are jumătate din felii, de două ori mai late: scrisul e cel de la inelul dinăuntru.
    const count = side ? 2 ** (g - 1) : 2 ** g, first = 2 ** g + (side === "mother" ? count : 0), w = side ? g - 1 : g;
    const radial = w >= 5; // pe inelele subțiri textul merge de-a lungul razei
    for (let k = 0; k < count; k++) {
      const n = first + k, p = slots[n];
      const childKnown = !!slots[Math.floor(n / 2)];
      const a1 = A0 + (SPAN * k) / count, a2 = A0 + (SPAN * (k + 1)) / count, mid = (a1 + a2) / 2, rm = (R[g] + R[g + 1]) / 2;
      if (!p && !childKnown) {
        if (g >= 6) continue; // inelele vechi rămân curate: arătăm doar ramurile cunoscute și locurile de completat
        sectors.push(<path key={n} d={arc(R[g], R[g + 1], a1, a2, cx, cy)} fill="none" stroke="var(--line)" strokeOpacity={0.35} />);
        continue;
      }
      const tx = cx + rm * Math.cos((mid * Math.PI) / 180), ty = cy + rm * Math.sin((mid * Math.PI) / 180);
      const left = mid < -90;
      const rot = radial ? (left ? mid + 180 : mid) : w <= 2 ? mid + 90 : left ? mid + 180 : mid;
      const fs = w <= 2 ? 13 : w === 3 ? 11 : w === 4 ? 10 : w <= 6 ? 9 : 8;
      let label;
      if (!p) label = <tspan x={tx} dy={4} fill="var(--muted)">{radial ? "+" : `+ ${t("add")}`}</tspan>;
      else if (radial) label = (
        <>
          <tspan x={tx} dy={w >= 7 ? 3 : -2} fontWeight={700}>{p.givenName}</tspan>
          {w < 7 && <tspan x={tx} dy={10} fill="var(--muted)">{p.birthYear ?? ""}</tspan>}
        </>
      );
      else label = (
        <>
          <tspan x={tx} dy={w <= 2 ? -8 : -6} fontWeight={700}>{w >= 3 ? p.givenName : p.name}</tspan>
          {w >= 3 && <tspan x={tx} dy={11} fontWeight={700}>{p.surname}</tspan>}
          <tspan x={tx} dy={w <= 2 ? 16 : 12} fill="var(--muted)">{w <= 2 ? lifeDates(p, locale) : years(p, locale)}</tspan>
        </>
      );
      sectors.push(
        <g key={n} className={`sector${selected === n ? " sel" : ""}`} tabIndex={0} role="button" aria-label={p ? p.name : t("emptyAdd")}
          onClick={() => onSelect(n)} onDoubleClick={() => p && onCenter(p.id)} onKeyDown={keyAct(() => onSelect(n))}>
          <title>{p ? `${p.name} ${lifeDates(p, locale)}` : t("emptyAdd")}</title>
          <path d={arc(R[g], R[g + 1], a1, a2, cx, cy)} fill={p ? fillFor(n) : "var(--surface)"} stroke={p ? "var(--line)" : "var(--muted)"} strokeWidth={g >= 6 ? 0.8 : 1.2} strokeDasharray={p ? undefined : "4 4"} />
          <text x={tx} y={ty} textAnchor="middle" transform={`rotate(${rot} ${tx} ${ty})`} fill="var(--ink)" fontSize={fs}>{label}</text>
        </g>,
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("fanLabel")} style={generations >= 7 ? { width: W, maxWidth: "none", display: "block", margin: "0 auto" } : { width: "100%", maxWidth: 760, display: "block", margin: "0 auto" }}>
      {sectors}
      {center && (
        <g className={`sector${selected === 1 ? " sel" : ""}`} tabIndex={0} role="button" aria-label={center.name} onClick={() => onSelect(1)} onKeyDown={keyAct(() => onSelect(1))}>
          <circle cx={cx} cy={cy} r={R[1] - 2} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
          <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--ink)" fontSize={15} fontWeight={700} style={{ fontFamily: "var(--display)" }}>
            <tspan x={cx}>{center.givenName}</tspan><tspan x={cx} dy={17}>{center.surname}</tspan>
          </text>
          <text x={cx} y={cy + 32} textAnchor="middle" fill="var(--muted)" fontSize={12}>{lifeDates(center, locale)}</text>
        </g>
      )}
    </svg>
  );
}

/**
 * Arbore clasic, de la stânga la dreapta. Rândurile se dau doar persoanelor și locurilor libere vizibile, deci rămâne compact.
 * Cu o singură spiță, celălalt părinte și neamul lui nu se desenează deloc.
 */
export function ClassicTree({ slots, selected, onSelect, onCenter, generations = 4, side }: Props) {
  const t = useTranslations("Charts"), locale = useLocale();
  const colW = 176, bw = 160, bh = 38, rowH = 44;
  const visible = (n: number) => onSide(n, side) && genOf(n) <= generations && (n === 1 || !!slots[n] || !!slots[Math.floor(n / 2)]);
  const pos: Record<number, { x: number; y: number }> = {};
  let row = 0;
  const place = (n: number): number => {
    const kids = [2 * n, 2 * n + 1].filter((c) => !!slots[n] && visible(c));
    const y = kids.length ? kids.map(place).reduce((a, b) => a + b, 0) / kids.length : 20 + rowH * row++ + rowH / 2;
    pos[n] = { x: 10 + genOf(n) * colW, y };
    return y;
  };
  place(1);
  const all = Object.keys(pos).map(Number);
  const H = rowH * row + 40, W = (Math.max(...all.map(genOf)) + 1) * colW + 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("classicLabel")} style={{ width: W, maxWidth: "none", display: "block" }}>
      {all.filter((n) => n > 1).map((n) => {
        const a = pos[Math.floor(n / 2)], b = pos[n], mx = a.x + bw + (colW - bw) / 2;
        return <path key={`l${n}`} d={`M${a.x + bw} ${a.y}H${mx}V${b.y}H${b.x}`} fill="none" stroke="var(--line)" strokeWidth={1.2} />;
      })}
      {all.map((n) => {
        const p = slots[n], { x, y } = pos[n];
        return (
          <g key={n} className={`sector${selected === n ? " sel" : ""}`} tabIndex={0} role="button" aria-label={p ? p.name : t("empty")}
            onClick={() => onSelect(n)} onDoubleClick={() => p && onCenter(p.id)} onKeyDown={keyAct(() => onSelect(n))}>
            <rect x={x} y={y - bh / 2} width={bw} height={bh} rx={6} fill={p ? fillFor(n) : "var(--surface)"} stroke={p ? "var(--line)" : "var(--muted)"} strokeDasharray={p ? undefined : "4 4"} />
            {p ? (
              <>
                <text x={x + 10} y={y - 3} fill="var(--ink)" fontSize={12.5} fontWeight={700}>{clip(p.name, 22)}</text>
                <text x={x + 10} y={y + 12} fill="var(--muted)" fontSize={11}>{clip(/\d[./-] ?\d/.test(lifeDates(p, locale)) ? lifeDates(p, locale) : [years(p, locale), p.birthPlace].filter(Boolean).join(" · "), 26)}</text>
              </>
            ) : <text x={x + 10} y={y + 4} fill="var(--muted)" fontSize={12}>+ {t("add")}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Descendenții persoanei din centru, de sus în jos: fiecare cu soții desenați alături (în ordinea căsătoriilor) și copiii dedesubt.
 * Copiii unei căsătorii coboară din linia dintre cei doi soți; copiii dintr-o altă relație (cu o persoană discretă) coboară, discret, doar din părinte.
 */
export function DescendantsChart({ root, people, selectedId, onSelectPerson, onCenter, focusId }: {
  root: DescNode; people: Record<string, PersonView>; selectedId: string | null; onSelectPerson: (id: string) => void; onCenter: (id: string) => void;
  /** Persoana adusă la vedere când se deschide desenul (de obicei cea din centru). */
  focusId?: string;
}) {
  const t = useTranslations("Charts"), locale = useLocale();
  const bw = 150, bh = 40, gapX = 16, rowH = 96, partnerW = 150;
  const shown = (d: DescNode) => d.partners.filter((id) => people[id]);
  // Întâi copiii fără celălalt părinte desenat (sub persoană), apoi cei din fiecare căsătorie, în ordine: liniile nu se mai încrucișează.
  const rank = (d: DescNode, c: DescNode) => (c.via ? 1 + shown(d).indexOf(c.via) : 0);
  const kidsOf = (d: DescNode) => [...d.children].sort((a, b) => rank(d, a) - rank(d, b));
  const widthOf = (d: DescNode): number => Math.max(bw + shown(d).length * (partnerW + 6), d.children.reduce((s, c) => s + widthOf(c) + gapX, -gapX));
  type Box = { id: string; x: number; y: number; partnerOf?: string; nth?: number; parent?: { x: number; y: number }; apart?: boolean };
  const boxes: Box[] = [];
  const lay = (d: DescNode, x0: number, depth: number, parent?: { x: number; y: number }, apart?: boolean) => {
    const w = widthOf(d), y = 20 + depth * rowH, sh = shown(d);
    const unitW = bw + sh.length * (partnerW + 6), ux = x0 + (w - unitW) / 2;
    boxes.push({ id: d.id, x: ux, y, parent, apart });
    sh.forEach((pid, i) => boxes.push({ id: pid, x: ux + bw + 6 + i * (partnerW + 6), y, partnerOf: d.id, nth: sh.length > 1 ? i + 1 : undefined }));
    // De unde coboară copiii: din linia dintre persoană și soțul/soția cu care i-a avut, sau din persoană, dacă celălalt părinte nu e desenat.
    const from = (c: DescNode) => {
      const i = c.via ? sh.indexOf(c.via) : -1;
      return i >= 0 ? { x: ux + bw + 3 + i * (partnerW + 6), y: y + bh / 2 } : { x: ux + bw / 2, y: y + bh };
    };
    let cx = x0;
    for (const c of kidsOf(d)) { lay(c, cx, depth + 1, from(c), c.apart); cx += widthOf(c) + gapX; }
  };
  lay(root, 10, 0);
  const W = widthOf(root) + 20, H = Math.max(...boxes.map((b) => b.y)) + bh + 30;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("descLabel")} style={{ width: Math.max(W, 320), maxWidth: "none", display: "block", margin: "0 auto" }}>
      {boxes.filter((b) => b.parent).map((b) => {
        // Copiii din altă relație au linia lor, puțin mai sus și mai subțire, separată de cea a copiilor cuplului.
        const mid = b.y - (rowH - bh) / 2 - (b.apart ? 8 : 0);
        return <path key={`l${b.id}${b.x}`} d={`M${b.parent!.x} ${b.parent!.y}V${mid}H${b.x + bw / 2}V${b.y}`} fill="none"
          stroke="var(--line)" strokeWidth={b.apart ? 0.9 : 1.2} opacity={b.apart ? 0.75 : 1} />;
      })}
      {boxes.map((b) => {
        const p = people[b.id];
        if (!p) return null;
        const isRoot = b.id === root.id && !b.partnerOf;
        return (
          <g key={`${b.id}${b.x}`} className={`sector${selectedId === b.id ? " sel" : ""}`} tabIndex={0} role="button" aria-label={p.name}
            onClick={() => onSelectPerson(b.id)} onDoubleClick={() => onCenter(b.id)} onKeyDown={keyAct(() => onSelectPerson(b.id))}>
            {b.partnerOf && <text x={b.x - 3} y={b.y + bh / 2 + 4} textAnchor="end" fill="var(--muted)" fontSize={12}>⚭{b.nth ?? ""}</text>}
            <rect x={b.x} y={b.y} width={b.partnerOf ? partnerW : bw} height={bh} rx={6} data-focus={b.id === focusId && !b.partnerOf ? "1" : undefined}
              fill={isRoot ? "var(--accent-soft)" : b.partnerOf ? "var(--surface)" : "var(--desc)"} stroke={isRoot ? "var(--accent)" : "var(--line)"} strokeDasharray={b.partnerOf ? "4 3" : undefined} />
            <text x={b.x + 9} y={b.y + 17} fill="var(--ink)" fontSize={12.5} fontWeight={700}>{clip(p.name, 20)}</text>
            <text x={b.x + 9} y={b.y + 32} fill="var(--muted)" fontSize={11}>{lifeDates(p, locale)}</text>
          </g>
        );
      })}
    </svg>
  );
}
