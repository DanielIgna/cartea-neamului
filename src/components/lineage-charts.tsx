"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import type { PersonView } from "@/lib/tree-data";
import { genOf, fillFor, onSide, type DescNode, type Side, type Slots } from "./charts";
import { clip, lifeDates, years } from "@/lib/person-text";
import { fold, foldTwin, layoutSingle, layoutTwin, type TwinParts } from "@/lib/tree-layout";
import CopacArt from "./CopacArt";

/**
 * Desenele „de la trunchi în sus”: copacul neamului și evantaiul urmașilor.
 * Fiecare persoană primește loc pe orizontală (sau un unghi) proporțional cu câți urmași fără copii are sub ea,
 * ca o familie cu 13 frați să-și facă loc fără să se suprapună.
 */
type Props = {
  root: DescNode; people: Record<string, PersonView>; selectedId: string | null; egoPath: Set<string>;
  onSelectPerson: (id: string) => void; onCenter: (id: string) => void;
};

type Placed = { node: DescNode; depth: number; a: number; b: number; parent?: Placed };

/** Împarte intervalul [0, 1) între urmași, după numărul de „frunze” din fiecare ramură. */
function place(root: DescNode) {
  const leaves = new Map<DescNode, number>();
  const count = (d: DescNode): number => {
    const n = d.children.length ? d.children.reduce((s, c) => s + count(c), 0) : 1;
    leaves.set(d, n);
    return n;
  };
  count(root);
  const out: Placed[] = [];
  const walk = (d: DescNode, depth: number, a: number, b: number, parent?: Placed) => {
    const me: Placed = { node: d, depth, a, b, parent };
    out.push(me);
    let x = a;
    const total = leaves.get(d)!;
    for (const c of d.children) {
      const w = ((b - a) * leaves.get(c)!) / total;
      walk(c, depth + 1, x, x + w, me);
      x += w;
    }
  };
  walk(root, 0, 0, 1);
  return { placed: out, leaves: leaves.get(root)!, depth: Math.max(...out.map((p) => p.depth)) };
}

const keyAct = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

/* ---------- Copacul adevărat: desenul e în CopacArt.tsx ---------- */

/** Copacul neamului: trunchiul e linia de la cel mai vechi la cel mai tânăr; fiecare familie e o ramură, din ea ramuri mai subțiri și lăstari. */
/** Ce ramuri sunt desfăcute de mână; `all` = toate (fără nimic strâns). */
function useFolds(all: boolean) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return { open, toggle, all };
}

type FoldProps = { allBranches?: boolean };

export function LineageTree({ allBranches = false, ...props }: Props & FoldProps) {
  const t = useTranslations("Charts");
  const { root, people, egoPath } = props;
  const { open, toggle, all } = useFolds(allBranches);
  const folded = useMemo(() => (all ? { root, hidden: new Map<string, number>() } : fold(root, egoPath, open)), [all, root, egoPath, open]);
  const scene = layoutSingle(folded.root, (id) => !!people[id], egoPath, !all);
  return <CopacArt {...props} scene={scene} hidden={folded.hidden} open={all ? new Set() : open} onToggle={toggle} ariaLabel={t("treeLabel")}
    label={(id) => (people[id] ? t("treeRoot", { surname: people[id].surname, name: people[id].name }) : "")} />;
}

/**
 * Copacul cu două rădăcini: neamul tatălui în stânga, neamul mamei în dreapta. Cele două trunchiuri se apleacă unul spre altul
 * și se unesc în căsătoria părinților; de acolo crește o singură coroană, cu copiii lor și urmașii acestora.
 */
export function TwinTree({ parts, allBranches = false, ...props }: Omit<Props, "root"> & FoldProps & { parts: TwinParts }) {
  const t = useTranslations("Charts");
  const { people, egoPath } = props;
  const { open, toggle, all } = useFolds(allBranches);
  const folded = useMemo(() => (all ? { parts, hidden: new Map<string, number>() } : foldTwin(parts, egoPath, open)), [all, parts, egoPath, open]);
  const scene = layoutTwin(folded.parts, (id) => !!people[id], egoPath, !all);
  return <CopacArt {...props} scene={scene} hidden={folded.hidden} open={all ? new Set() : open} onToggle={toggle} ariaLabel={t("twinLabel")}
    label={(id) => { const p = people[id], sur = p?.birthSurname?.trim() || p?.surname; return p ? (sur ? t("familyOf", { surname: sur }) : t("familyOfName", { name: p.name })) : ""; }} />;
}

/** Evantaiul urmașilor: trunchiul în mijloc, fiecare generație un inel, fiecare ramură o felie cât urmașii ei. */
export function DescendantFan({ root, people, selectedId, egoPath, onSelectPerson, onCenter }: Props) {
  const t = useTranslations("Charts"), locale = useLocale();
  const kids = (d: DescNode) => (d.children.length ? t("kids", { count: d.children.length }) : "");
  const { placed, depth } = place(root);
  const r0 = 70, ring = depth > 7 ? 62 : 74, maxR = r0 + depth * ring;
  const cx = maxR + 20, cy = maxR + 10, A0 = -210, SPAN = 240;
  const W = 2 * cx, H = cy + maxR * 0.5 + 20;
  const pt = (r: number, a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const arc = (r1: number, r2: number, a1: number, a2: number) => {
    const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
    const lg = a2 - a1 > 180 ? 1 : 0;
    return `M${x1} ${y1}A${r2} ${r2} 0 ${lg} 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 ${lg} 0 ${x4} ${y4}Z`;
  };
  const rootP = people[root.id];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("descFanLabel")} style={depth >= 6 ? { width: W, maxWidth: "none", display: "block", margin: "0 auto" } : { width: "100%", maxWidth: 820, display: "block", margin: "0 auto" }}>
      {placed.filter((p) => p.depth > 0).map((p) => {
        const person = people[p.node.id];
        if (!person) return null;
        const a1 = A0 + SPAN * p.a, a2 = A0 + SPAN * p.b, mid = (a1 + a2) / 2;
        const r1 = r0 + (p.depth - 1) * ring, r2 = r1 + ring, rm = (r1 + r2) / 2;
        const [tx, ty] = pt(rm, mid);
        const wide = (a2 - a1) * (Math.PI / 180) * rm > 90; // felie destul de lată pentru text de-a curmezișul
        const rot = wide ? mid + 90 : mid < -90 ? mid + 180 : mid;
        const ego = egoPath.has(p.node.id);
        return (
          <g key={p.node.id} className={`sector${selectedId === p.node.id ? " sel" : ""}`} tabIndex={0} role="button" aria-label={person.name}
            onClick={() => onSelectPerson(p.node.id)} onDoubleClick={() => onCenter(p.node.id)} onKeyDown={keyAct(() => onSelectPerson(p.node.id))}>
            <title>{`${person.name} ${lifeDates(person, locale)}${kids(p.node) ? ` · ${kids(p.node)}` : ""}`}</title>
            <path d={arc(r1, r2, a1, a2)} fill={ego ? "var(--accent-soft)" : `var(--pat-${Math.min(1 + (p.depth % 4), 4)})`} stroke={ego ? "var(--accent)" : "var(--line)"} strokeWidth={ego ? 1.6 : 0.8} />
            <text x={tx} y={ty} textAnchor="middle" transform={`rotate(${rot} ${tx} ${ty})`} fill="var(--ink)" fontSize={wide ? 11 : 9}>
              <tspan x={tx} dy={-2} fontWeight={700}>{clip(person.givenName, wide ? 16 : 10)}</tspan>
              <tspan x={tx} dy={11} fill="var(--muted)">{person.birthYear ?? ""}</tspan>
            </text>
          </g>
        );
      })}
      {rootP && (
        <g className={`sector${selectedId === root.id ? " sel" : ""}`} tabIndex={0} role="button" aria-label={rootP.name} onClick={() => onSelectPerson(root.id)} onKeyDown={keyAct(() => onSelectPerson(root.id))}>
          <circle cx={cx} cy={cy} r={r0 - 2} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
          <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--ink)" fontSize={14} fontWeight={700} style={{ fontFamily: "var(--display)" }}>
            <tspan x={cx}>{rootP.givenName}</tspan><tspan x={cx} dy={16}>{rootP.surname}</tspan>
          </text>
          <text x={cx} y={cy + 30} textAnchor="middle" fill="var(--muted)" fontSize={11}>{lifeDates(rootP, locale)}</text>
        </g>
      )}
    </svg>
  );
}

/** Câte generații de strămoși urcă în clepsidră: trei pe amândouă spițele (părinți, bunici, străbunici), patru pe una singură, cât să încapă la fel de lat. */
export const hourglassUp = (generations: number, side?: Side | null) => Math.min(generations, side ? 4 : 3);

/**
 * Clepsidra: persoana aleasă la mijloc, strămoșii ei deasupra (tatăl spre stânga, mama spre dreapta, ori doar spița aleasă)
 * și urmașii dedesubt, cu soții alături. Forma se lărgește singură în sus sau în jos, după câte generații sunt.
 */
export function Hourglass({ slots, generations, down, people, selectedId, onSelectPerson, onSelectSlot, onCenter, side }: {
  slots: Slots; generations: number; down: DescNode; people: Record<string, PersonView>; selectedId: string | null;
  onSelectPerson: (id: string) => void; onSelectSlot: (n: number) => void; onCenter: (id: string) => void; side?: Side | null;
}) {
  const t = useTranslations("Charts"), locale = useLocale();
  const bw = 118, bh = 40, rowH = 74, colW = bw + 10;
  const upGens = hourglassUp(generations, side);
  // Strămoșii ca un arbore „întors”: fiecare are loc doar cât îi trebuie, ca să nu rămână găuri pentru părinți necunoscuți.
  // Cu o singură spiță, deasupra urcă doar neamul tatălui sau doar al mamei.
  const toNode = (n: number): DescNode => ({ id: String(n), partners: [], children: [2 * n, 2 * n + 1].filter((c) => slots[c] && genOf(c) <= upGens && onSide(c, side)).map(toNode) });
  const upTree = place(toNode(1));
  const topGen = upTree.depth;
  const { placed, leaves, depth } = place(down);
  const W = Math.max(upTree.leaves * colW, leaves * colW, 520) + 20;
  const midY = 30 + topGen * rowH;
  const H = midY + depth * rowH + bh + 60;
  const upAt = new Map(upTree.placed.map((p) => [Number(p.node.id), p]));
  // Fiecare jumătate își ia doar lățimea de care are nevoie, centrată pe persoana din mijloc.
  const upW = upTree.leaves * colW, downW = leaves * colW;
  const upPos = (n: number) => { const p = upAt.get(n)!; return { x: (W - upW) / 2 + ((p.a + p.b) / 2) * upW, y: midY - p.depth * rowH }; };
  const downPos = (p: Placed) => ({ x: (W - downW) / 2 + ((p.a + p.b) / 2) * downW, y: midY + p.depth * rowH });
  const ups = [...upAt.keys()].filter((n) => n > 1);
  const box = (x: number, y: number, p: PersonView, key: string, fill: string, sel: boolean, onClick: () => void, onDbl?: () => void) => (
    <g key={key} className={`sector${sel ? " sel" : ""}`} tabIndex={0} role="button" aria-label={p.name} onClick={onClick} onDoubleClick={onDbl} onKeyDown={keyAct(onClick)}>
      <title>{`${p.name} ${lifeDates(p, locale)}`}</title>
      <rect x={x - bw / 2} y={y - bh / 2} width={bw} height={bh} rx={6} fill={fill} stroke="var(--line)" />
      <text x={x} y={y - 3} textAnchor="middle" fill="var(--ink)" fontSize={11.5} fontWeight={700}>{clip(p.name, 17)}</text>
      <text x={x} y={y + 12} textAnchor="middle" fill="var(--muted)" fontSize={10}>{lifeDates(p, locale)}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("hourglassLabel")} style={{ width: W, maxWidth: "none", display: "block", margin: "0 auto" }}>
      <text x={14} y={20} fill="var(--muted)" fontSize={12}>{t("hourBefore", { name: people[down.id]?.givenName ?? "" })}</text>
      <text x={14} y={midY + rowH / 2 + 4} fill="var(--muted)" fontSize={12}>{t("hourAfter", { name: people[down.id]?.givenName ?? "" })}</text>
      {ups.map((n) => {
        const a = upPos(n), b = upPos(Math.floor(n / 2));
        if (!b) return null;
        return <path key={`u${n}`} d={`M${b.x} ${b.y - bh / 2}V${(a.y + b.y) / 2}H${a.x}V${a.y + bh / 2}`} fill="none" stroke="var(--line)" strokeWidth={1.2} />;
      })}
      {placed.filter((p) => p.parent).map((p) => {
        const a = downPos(p.parent!), b = downPos(p);
        return <path key={`d${p.node.id}`} d={`M${a.x} ${a.y + bh / 2}V${(a.y + b.y) / 2}H${b.x}V${b.y - bh / 2}`} fill="none" stroke="var(--line)"
          strokeWidth={p.node.apart ? 0.8 : 1.2} opacity={p.node.apart ? 0.75 : 1} />;
      })}
      {ups.map((n) => { const { x, y } = upPos(n); return box(x, y, slots[n], `n${n}`, fillFor(n), selectedId === slots[n].id, () => onSelectSlot(n), () => onCenter(slots[n].id)); })}
      {placed.map((p) => {
        const person = people[p.node.id];
        if (!person) return null;
        const { x, y } = downPos(p);
        // Soții desenați, în ordinea căsătoriilor (cei discreți nu apar); cu doi, câte unul de fiecare parte a liniei copiilor.
        const partners = p.node.partners.map((id) => people[id]).filter(Boolean).slice(-2);
        return (
          <g key={`p${p.node.id}`}>
            {box(x, y, person, `b${p.node.id}`, p.depth === 0 ? "var(--accent-soft)" : "var(--desc)", selectedId === p.node.id, () => onSelectPerson(p.node.id), () => onCenter(p.node.id))}
            {partners.map((partner, i) => {
              const two = partners.length === 2, tx = two ? x + (i === 0 ? -6 : 6) : x;
              return (
                <g key={`s${partner.id}`} className={`sector${selectedId === partner.id ? " sel" : ""}`} tabIndex={0} role="button" aria-label={t("spouseOf", { name: partner.name })}
                  onClick={() => onSelectPerson(partner.id)} onKeyDown={keyAct(() => onSelectPerson(partner.id))}>
                  <title>{`⚭ ${partner.name} ${lifeDates(partner, locale)}`}</title>
                  <text x={tx} y={y + bh / 2 + 12} textAnchor={two ? (i === 0 ? "end" : "start") : "middle"} fill="var(--muted)" fontSize={10}>⚭ {clip(two ? partner.givenName : partner.name, two ? 10 : 20)}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
