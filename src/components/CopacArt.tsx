"use client";
// Fonturile Copacului (moștenire caldă): se descarcă doar literele folosite (fiecare alfabet e un fișier separat).
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/source-serif-4/500.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-sans-3/500.css";
import "@fontsource/source-sans-3/600.css";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "use-intl";
import type { PersonView } from "@/lib/tree-data";
import type { DescNode } from "./charts";
import { lifeDates, years } from "@/lib/person-text";
import { MORE, TREE, type Pt, type Scene, type TNode } from "@/lib/tree-layout";

/**
 * Copacul neamului în stil „moștenire caldă” (Daniel, 2026-11-27): pergament, trunchi organic cu scoarță, rădăcini, ciorchini de frunziș,
 * medalioane cu plăcuțe pe linia directă, soțul/soția cu cadru întrerupt, frații și verii ca pastile pe ramuri, rigla generațiilor în stânga.
 * Două straturi în același sistem de coordonate: dedesubt un SVG (lemnul, frunzișul, rigla), deasupra oamenii, ca elemente HTML
 * (textul rămâne tăios la orice zoom). Așezarea vine neschimbată din tree-layout.ts; aici se schimbă doar desenul.
 */

/** Un număr „aleator” dar mereu același pentru aceeași persoană, ca frunzișul să nu sară la fiecare desen. */
export function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

/** O ramură plină care se subțiază: o curbă Bézier cu grosime w0 la bază și w1 la vârf. */
export function taper(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number, n = 18) {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const len = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
    L.push([x - (dy / len) * w, y + (dx / len) * w]);
    R.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return `M${L.map(f).join("L")}L${R.reverse().map(f).join("L")}Z`;
}

/** Forma unei frunze (lentilă cu vârf), cu centrul în (x, y). */
const leafPath = (x: number, y: number, w: number, h: number, tilt = 0) => {
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const P = (dx: number, dy: number) => `${(x + dx * c - dy * s).toFixed(1)} ${(y + dx * s + dy * c).toFixed(1)}`;
  return `M${P(-w / 2, 0)}Q${P(0, -h)} ${P(w / 2, 0)}Q${P(0, h)} ${P(-w / 2, 0)}Z`;
};

/** Loc în stânga pentru rigla generațiilor. */
const GUT = 64;
/** Pe linia directă, centrul medalionului stă puțin deasupra rândului, plăcuța dedesubt. */
const MED_DY = -20;
const FOLIAGE = ["#8A9A6B", "#6E7F52", "#C5CDA0"];

/** Trei ciorchini de frunziș refolosiți peste tot (elipse suprapuse, nu frunze desenate una câte una). */
function clusterSymbol(id: string, seed: string) {
  const rnd = seeded(seed);
  const els = Array.from({ length: 12 }, (_, i) => {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 34;
    return <ellipse key={i} cx={(Math.cos(a) * r * 1.25).toFixed(1)} cy={(Math.sin(a) * r * 0.85).toFixed(1)} rx={(12 + rnd() * 10).toFixed(1)} ry={(8 + rnd() * 7).toFixed(1)}
      transform={`rotate(${Math.round(rnd() * 180)} ${(Math.cos(a) * r * 1.25).toFixed(1)} ${(Math.sin(a) * r * 0.85).toFixed(1)})`}
      fill={FOLIAGE[i % 3]} fillOpacity={0.35 + rnd() * 0.35} />;
  });
  return <symbol id={id} viewBox="-70 -55 140 110" overflow="visible">{els}</symbol>;
}

/** Monograma: inițiala prenumelui și a numelui (MI = Mărjel Igna); cu două prenume, inițialele lor (ID = Ioan Daniel). */
const initials = (p: PersonView) => {
  const first = (w: string) => [...w][0] ?? "";
  const given = (p.givenName || "").split(/[\s-]+/).filter(Boolean);
  return (given.length > 1 ? first(given[0]) + first(given[1]) : first(given[0] ?? "") + first(p.surname || "")).toLocaleUpperCase();
};
const photoOf = (p: PersonView) => (p.photoId ? `/api/document/${p.photoId}` : p.accountImage ?? null);

type ArtProps = {
  scene: Scene; people: Record<string, PersonView>; selectedId: string | null; egoPath: Set<string>;
  onSelectPerson: (id: string) => void; onCenter: (id: string) => void;
  ariaLabel: string; label: (rootId: string) => string;
  hidden: Map<string, number>; open: Set<string>; onToggle: (id: string) => void;
};

export default function CopacArt({ scene, people, selectedId, egoPath, onSelectPerson, onCenter, ariaLabel, label, hidden, open, onToggle }: ArtProps) {
  const t = useTranslations("Charts"), locale = useLocale();
  const nKids = (k: number) => t("kids", { count: k });
  const { rowH } = TREE;
  const { W, H, baseY, nodes, fam, trunk, bases, couple, noShoots } = scene;
  const stage = useRef<HTMLDivElement>(null);

  // Cât de mare e desenul acum față de mărimea lui firească: stratul cu oameni se mărește la fel ca SVG-ul de dedesubt,
  // iar la zoom mic sau mare oamenii de pe ramuri arată mai puțin sau mai mult (doar inițiale / și anii).
  useLayoutEffect(() => {
    const st = stage.current, svg = st?.querySelector<SVGSVGElement>(":scope > svg");
    if (!st || !svg) return;
    const upd = () => {
      const k = svg.getBoundingClientRect().width / (W + GUT) || 1;
      st.style.setProperty("--k", String(k));
      st.dataset.zoom = k < 0.6 ? "far" : k > 1.3 ? "near" : "mid";
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [W]);

  const art = useMemo(() => {
    // Trunchiul se îngustează de la rădăcini spre coroană, după înălțime, nu după câți urmași duce.
    const topY = Math.min(...trunk.map((s) => s.p[3][1]), baseY - 1), span = Math.max(1, baseY - topY);
    const wBase = bases.length > 1 ? 84 : 104;
    const wAt = (y: number) => { const f = Math.min(1, Math.max(0, (baseY - y) / span)); return wBase + (30 - wBase) * Math.pow(f, 0.75); };
    const segs = trunk.map((s, i) => {
      const [p0, p1, p2, p3] = s.p;
      // O ușoară unduire, ca la un trunchi adevărat (doar pe bucățile drepte; îmbinările stau sub medalioane).
      const rnd = seeded(`trunk${i}${p0[0]}`), wob = p0[0] === p3[0] ? (rnd() - 0.5) * 20 : 0;
      const q1: Pt = [p1[0] + wob, p1[1]], q2: Pt = [p2[0] - wob * 0.7, p2[1]];
      const w0 = s.root ? wAt(p0[1]) * 1.12 : wAt(p0[1]), w1 = wAt(p3[1]);
      return { d: taper(p0, q1, q2, p3, w0, w1, 24), onPath: s.onPath };
    });
    const lineEnds = new Set(trunk.map((s) => `${s.p[3][0]}|${s.p[3][1]}`));
    const onTrunk = (p: TNode, x: number) => p.trunk && lineEnds.has(`${x}|${p.y}`);
    const branchFrom = (p: TNode, c: DescNode) => {
      const f = fam.get(p.node.id)!, u = f.unions.find((x) => x.sp === c.via);
      return u ? { x: u.knot, y: p.y + 6 } : { x: f.P, y: p.y - 10 };
    };
    const branches = nodes.filter((n) => !n.trunk && n.parent).map((n) => {
      const p = n.parent!, from = branchFrom(p, n.node), to = fam.get(n.node.id)!.P, dx = to - from.x;
      const k = n.node.apart ? 0.6 : 1, w0 = Math.min(14, 6 + 2 * Math.sqrt(n.size)) * k, w1 = Math.max(2.5, w0 * 0.3);
      const sx = from.x + Math.sign(dx) * (onTrunk(p, from.x) ? wAt(p.y) * 0.38 : 0);
      return { key: n.node.id, d: taper([sx, from.y], [sx + dx * 0.55, from.y - rowH * 0.14], [to, n.y + rowH * 0.5], [to, n.y + 6], w0, w1), onPath: egoPath.has(n.node.id) && egoPath.has(p.node.id), apart: !!n.node.apart };
    });
    // Rădăcinile: câte 7 pe fiecare trunchi, care se întind în lături și se subțiază pe linia pământului.
    const roots = bases.flatMap((b) => [-1, 1].flatMap((s) => [0.45, 0.8, 1.25].map((k, j) => {
      const rnd = seeded(`root${b.root}${s}${j}`), len = (70 + rnd() * 40) * k * (bases.length > 1 ? 0.9 : 1), x0 = b.x + s * (14 + j * 8);
      return { key: `${b.root}${s}${j}`, d: taper([x0, baseY - 22 + j * 4], [x0 + s * len * 0.35, baseY - 2], [x0 + s * len * 0.7, baseY + 6 + j * 2], [x0 + s * len, baseY + 12 + j * 3], 30 - j * 7, 4) };
    })).concat([{ key: `${b.root}c`, d: taper([b.x, baseY - 12], [b.x + 4, baseY + 2], [b.x - 2, baseY + 10], [b.x + 3, baseY + 20], 26, 5) }]));
    // Frunzișul: ciorchini mai deși sus, în coroană, rari la mijloc, deloc jos lângă rădăcini.
    const foliage = nodes.flatMap((n) => {
      const f = fam.get(n.node.id)!, h = (baseY - n.y) / span, rnd = seeded(n.node.id);
      if (n.node.id.startsWith(MORE)) return [];
      const k = h > 0.62 ? (n.trunk ? 4 : 3) : h > 0.3 ? (n.trunk ? 2 : 2) : n.trunk ? 0 : 1;
      const spread = 90 + f.unions.length * 110, crown = n.y === topY;
      const one = (i: number, x: number, y: number, s: number) => ({ key: `${n.node.id}f${i}`, x, y, s, r: Math.round((rnd() - 0.5) * 40), sym: Math.floor(rnd() * 3) });
      // Vârful coroanei: un evantai de ciorchini în jurul celui mai tânăr de pe trunchi.
      if (n.trunk && crown) return Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (1.05 + (i / 6) * 0.9); return one(i, f.mid + Math.cos(a) * (120 + rnd() * 30), n.y - 10 + Math.sin(a) * (70 + rnd() * 20), 1 + rnd() * 0.6); });
      return Array.from({ length: k }, (_, i) => {
        const dir = n.trunk ? (i % 2 ? 1 : -1) : 0;
        const cx = (n.trunk ? f.mid + dir * (110 + rnd() * 70) : f.mid + (rnd() - 0.5) * spread);
        return one(i, cx, n.y - 18 + (rnd() - 0.5) * 60, 0.8 + rnd() * 0.7);
      });
    });
    // Lăstari: rămurele cu câte o frunză la cei fără copii (vârfurile copacului).
    const shoots = nodes.filter((n) => !n.node.children.length && !n.trunk && n.depth > 0 && !noShoots.has(n.node.id) && !hidden.has(n.node.id) && !n.node.id.startsWith(MORE)).flatMap((n) => {
      const rnd = seeded(`${n.node.id}s`), f = fam.get(n.node.id)!, ox = f.unions.length ? f.unions[f.unions.length - 1].knot : f.P;
      return [-1, 1].map((dir, i) => {
        const ang = -Math.PI / 2 + dir * (0.6 + rnd() * 0.3), len = 34 + rnd() * 12;
        const sx = ox + dir * 6, sy = n.y - 12, ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
        return { key: `${n.node.id}s${i}`, d: taper([sx, sy], [sx + (ex - sx) * 0.2, sy - len * 0.4], [ex - (ex - sx) * 0.3, ey + 4], [ex, ey], 3, 1, 8), leaf: leafPath(ex, ey, 18, 8, ang) };
      });
    });
    // Rigla generațiilor: 1 jos, la rădăcină; câte un semn în dreptul fiecărui rând de pe linia directă.
    const rows = [...new Set(nodes.filter((n) => n.trunk).map((n) => n.y))].sort((a, b) => b - a);
    // Ciorchinii nu ies din desen (s-ar tăia la margine).
    for (const f of foliage) f.x = Math.min(W - 60 * f.s, Math.max(-GUT / 2 + 60 * f.s, f.x));
    return { segs, branches, roots, foliage, shoots, rows };
  }, [scene, egoPath, hidden, rowH, W, H, baseY, nodes, fam, trunk, bases, noShoots]);

  const gx = (bases[0].x + bases[bases.length - 1].x) / 2, spanX = (bases[bases.length - 1].x - bases[0].x) / 2;
  const kidsOf = (d: DescNode, via: string | null) => {
    const sh = fam.get(d.id)?.unions.map((u) => u.sp) ?? [];
    return d.children.filter((c) => (via ? c.via === via : !sh.includes(c.via ?? ""))).length;
  };
  const father = couple && people[couple.father], mother = couple && people[couple.mother];
  const X = (x: number) => x + GUT;
  // În copacul cu o rădăcină, la început stă la vedere cel mai tânăr om de pe linia ta (de obicei tu).
  const focusId = nodes.filter((n) => n.trunk && egoPath.has(n.node.id)).sort((a, b) => a.y - b.y)[0]?.node.id;

  // Oamenii (stratul HTML): linia directă cu medalion și plăcuță, soții cu cadru întrerupt, ceilalți ca pastile pe ramuri.
  const cards: React.ReactNode[] = [];
  const links: React.ReactNode[] = [];
  for (const n of nodes) {
    const person = people[n.node.id];
    if (!person || n.node.id.startsWith(MORE)) continue;
    const { y } = n, f = fam.get(n.node.id)!, { P } = f;
    const unions = f.unions.map((u) => ({ ...u, sp: people[u.sp] })).filter((u) => u.sp);
    const ly = n.trunk ? y + MED_DY : y;
    for (const u of unions) {
      const k = kidsOf(n.node, u.sp.id);
      links.push(
        <g key={`u${n.node.id}${u.sp.id}`}>
          <line x1={P} y1={ly} x2={u.x} y2={ly} stroke="#C9A86C" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={u.knot} cy={ly} r={4.5} fill="#FBF6EB" stroke="#C9A86C" strokeWidth={2}><title>{t("couple", { a: person.givenName, b: u.sp.givenName, count: k })}</title></circle>
          {k > 0 && <circle cx={u.knot} cy={y + 9} r={4.5} fill="#4A2F1F" stroke="#C9A86C" strokeWidth={1.2} />}
        </g>,
      );
    }
    const card = (who: PersonView, cx: number, blood: boolean, extra?: string) => {
      const sel = selectedId === who.id, ego = egoPath.has(who.id), yrs = years(who, locale);
      const surname = who.birthSurname && !blood ? t("bornAsShort", { surname: who.surname, birth: who.birthSurname, sex: who.sex }) : who.surname;
      const aria = `${blood ? who.name : t("spouseOf", { name: who.name })}${yrs ? `, ${yrs}` : ""}`;
      const cls = `cp-node ${n.trunk ? "cp-direct" : "cp-pill"}${blood ? "" : " cp-spouse"}${ego ? " cp-ego" : ""}${sel ? " cp-sel" : ""}`;
      const img = n.trunk ? photoOf(who) : null;
      return (
        <button key={`${n.node.id}:${who.id}`} type="button" className={cls} data-focus={!couple && blood && who.id === focusId ? "1" : undefined} style={{ left: X(cx), top: y }} aria-label={aria} aria-pressed={sel}
          title={`${blood ? "" : "⚭ "}${who.name} ${lifeDates(who, locale)}`.trim()}
          onClick={() => onSelectPerson(who.id)} onDoubleClick={() => onCenter(who.id)}>
          {n.trunk ? (
            <>
              <span className="cp-med">{img ? <img src={img} alt="" referrerPolicy="no-referrer" loading="lazy" /> : initials(who)}</span>
              <span className="cp-plate">
                <b>{who.givenName} {surname}</b>
                {yrs && <small>{yrs}</small>}
                {extra && <small className="cp-kids">{extra}</small>}
              </span>
            </>
          ) : (
            <>
              <span className="cp-ini" aria-hidden>{initials(who)}</span>
              <span className="cp-full">
                <b>{who.givenName}</b>
                {!blood && <small className="cp-sur">{surname}</small>}
                {yrs && <small className="cp-yr">{yrs}</small>}
                {extra && <small className="cp-kids">{extra}</small>}
              </span>
            </>
          )}
        </button>
      );
    };
    const alone = kidsOf(n.node, null);
    cards.push(card(person, P, true, alone > 0 && (n.trunk || !unions.length) ? nKids(alone) : undefined));
    for (const u of unions) {
      const k = couple && n.node.id === couple.father && u.sp.id === couple.mother ? Math.max(couple.kids, kidsOf(n.node, u.sp.id)) : kidsOf(n.node, u.sp.id);
      cards.push(card(u.sp, u.x, false, k > 0 ? nKids(k) : undefined));
    }
  }
  // „+N frați”: frații strânși ai cuiva de pe linie, un cerc închis în rândul lor.
  const badges: React.ReactNode[] = [];
  for (const n of nodes.filter((m) => m.node.id.startsWith(MORE))) {
    const id = n.node.id, k = hidden.get(id) ?? 0, x = fam.get(id)!.P, lab = t("showSiblings", { count: k });
    badges.push(
      <button key={id} type="button" className="cp-badge" style={{ left: X(x), top: n.y }} aria-label={lab} title={lab} aria-expanded={false} onClick={() => onToggle(id)}>
        +{k}<small>{t("siblingsShort", { count: k })}</small>
      </button>,
    );
  }
  for (const n of nodes.filter((m) => m.trunk && open.has(MORE + m.node.id))) {
    const x = fam.get(n.node.id)!.P, lab = t("hideSiblings");
    badges.push(<button key={`less${n.node.id}`} type="button" className="cp-badge cp-less" style={{ left: X(x - 50), top: n.y + MED_DY }} aria-label={lab} title={lab} aria-expanded onClick={() => onToggle(MORE + n.node.id)}>−</button>);
  }
  // „+N” deasupra cuiva de pe ramuri desface ramura lui; „−” o strânge la loc.
  for (const n of nodes.filter((m) => !m.trunk && !m.node.id.startsWith(MORE) && (hidden.has(m.node.id) || (open.has(m.node.id) && m.node.children.length)))) {
    const id = n.node.id, k = hidden.get(id), x = fam.get(id)!.P, lab = k ? t("showBranch", { count: k }) : t("hideBranch");
    badges.push(
      <button key={`fold${id}`} type="button" className={k ? "cp-badge cp-fold" : "cp-badge cp-less"} style={{ left: X(x), top: n.y - 40 }} aria-label={lab} title={lab} aria-expanded={!k} onClick={() => onToggle(id)}>
        {k ? `+${k}` : "−"}
      </button>,
    );
  }

  const vbW = W + GUT;
  const r0 = art.rows[0], rN = art.rows[art.rows.length - 1];
  return (
    <div className="cp-stage" ref={stage}>
      <svg viewBox={`${-GUT} 0 ${vbW} ${H}`} role="img" aria-label={ariaLabel} style={{ width: vbW, maxWidth: "none", display: "block" }}>
        <defs>
          <linearGradient id="cp-bark" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#4A2F1F" /><stop offset="0.3" stopColor="#6B4530" /><stop offset="0.42" stopColor="#8B5E3C" />
            <stop offset="0.62" stopColor="#6B4530" /><stop offset="1" stopColor="#4A2F1F" />
          </linearGradient>
          <linearGradient id="cp-branch" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8B5E3C" /><stop offset="0.5" stopColor="#6B4530" /><stop offset="1" stopColor="#4A2F1F" />
          </linearGradient>
          <pattern id="cp-bark-lines" width="16" height="70" patternUnits="userSpaceOnUse">
            <path d="M2 0C4 18 1 34 3 52S2 66 3 70M9 0C7 14 10 30 8 46S10 62 9 70M14 6C15 20 13 30 14 44" fill="none" stroke="#3A2414" strokeWidth="1.1" opacity="0.5" />
          </pattern>
          <filter id="cp-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.3" /></filter>
          <radialGradient id="cp-ground"><stop offset="0" stopColor="#C9A86C" stopOpacity="0.35" /><stop offset="1" stopColor="#E8D5B5" stopOpacity="0" /></radialGradient>
          {clusterSymbol("cp-c0", "a")}{clusterSymbol("cp-c1", "bb")}{clusterSymbol("cp-c2", "ccc")}
        </defs>
        {/* Pământul */}
        <ellipse cx={gx} cy={baseY + 16} rx={Math.max(Math.min(gx + GUT - 10, W - gx - 10, 300 + spanX), 140)} ry={30} fill="url(#cp-ground)" />
        <path d={`M${gx - spanX - 220} ${baseY + 22}Q${gx} ${baseY + 14} ${gx + spanX + 220} ${baseY + 22}`} stroke="#B89A72" strokeWidth={1} fill="none" opacity={0.5} />
        {/* Coroana, în spatele lemnului și al oamenilor */}
        <g filter="url(#cp-soft)">
          {art.foliage.map((f) => <use key={f.key} href={`#cp-c${f.sym}`} x={-70} y={-55} width={140} height={110} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.r}) scale(${f.s.toFixed(2)})`} />)}
        </g>
        {/* Rigla generațiilor */}
        {art.rows.length > 1 && (
          <g className="cp-ruler" fill="#6B5340" stroke="#6B5340">
            <line x1={-GUT + 30} x2={-GUT + 30} y1={r0 + MED_DY} y2={rN + MED_DY} strokeWidth={1.2} opacity={0.7} />
            {art.rows.map((y, i) => (
              <g key={y}>
                <circle cx={-GUT + 30} cy={y + MED_DY} r={3.2} fill="#F4E9D4" strokeWidth={1.2} />
                <text x={-GUT + 40} y={y + MED_DY + 4.5} stroke="none" fontSize={13}>{i + 1}</text>
              </g>
            ))}
            <text stroke="none" fontSize={11} letterSpacing={1.6} transform={`translate(${-GUT + 14} ${(r0 + rN) / 2 + MED_DY}) rotate(-90)`} textAnchor="middle">{t("generationRuler").toLocaleUpperCase(locale)}</text>
          </g>
        )}
        {/* Rădăcinile și trunchiul (în Amândouă: două trunchiuri care se unesc în părinți), cu scoarță */}
        {art.roots.map((r) => <path key={r.key} d={r.d} fill="#4A2F1F" />)}
        {art.segs.map((s, i) => <path key={`t${i}`} d={s.d} fill="url(#cp-bark)" />)}
        <g opacity={0.22}>{art.segs.map((s, i) => <path key={`tb${i}`} d={s.d} fill="url(#cp-bark-lines)" />)}</g>
        {art.branches.map((b) => <path key={`b${b.key}`} d={b.d} fill="url(#cp-branch)" opacity={b.apart ? 0.8 : 1} stroke={b.onPath ? "#C9A86C" : "none"} strokeWidth={1} />)}
        {art.shoots.map((s) => <g key={s.key}><path d={s.d} fill="#6B4530" /><path d={s.leaf} fill="#8A9A6B" stroke="#6E7F52" strokeWidth={0.6} /></g>)}
        {links}
        {/* Căsătoria părinților, în care se unesc cele două trunchiuri: acolo pornește coroana (și acolo se oprește privirea la început). */}
        {couple && father && mother && (
          <g>
            <line x1={couple.P} y1={couple.y + MED_DY} x2={couple.x} y2={couple.y + MED_DY} stroke="#C9A86C" strokeWidth={3} strokeLinecap="round" />
            <circle data-focus="1" cx={couple.knot} cy={couple.y + MED_DY} r={6} fill="#FBF6EB" stroke="#C9A86C" strokeWidth={2.4}>
              <title>{t("couple", { a: father.givenName, b: mother.givenName, count: couple.kids })}</title>
            </circle>
          </g>
        )}
        {bases.map((b) => (
          <text key={`l${b.root}`} x={b.x} y={baseY + 42} textAnchor="middle" fill="#3A2A1A" fontSize={17} fontWeight={600} className="cp-base">{label(b.root)}</text>
        ))}
      </svg>
      <div className="cp-layer" style={{ width: vbW, height: H }}>
        {cards}
        {badges}
      </div>
    </div>
  );
}
