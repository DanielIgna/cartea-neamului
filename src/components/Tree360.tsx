"use client";
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import type { PersonView } from "@/lib/tree-data";
import { layout360, project, type Seed, yawFacing, angleDiff, ROW_H, type Cam, type Node3 } from "@/lib/tree360";
import { useLocale, useTranslations } from "use-intl";
import { storyFor, type Origin } from "@/lib/vremuri";
import { toneColor, useTimesWords } from "./TimesStory";
import { clip, DATE_WORDS } from "@/lib/person-text";

const PITCH = -0.38; // privit puțin de sus
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Props = {
  /** Rădăcinile: o spiță, sau amândouă (neamul tatălui și al mamei), cu legăturile de căsătorie dintre ele. */
  seeds: Seed[]; links?: [string, string][]; people: Record<string, PersonView>; selectedId: string | null; egoPath: Set<string>;
  onSelectPerson: (id: string) => void; onCenter: (id: string) => void; originOf: (id: string) => Origin | null;
};

/**
 * Copacul 360°: neamul pe inele, de jur împrejurul trunchiului, pe care îl învârți cu mouse-ul sau cu degetul.
 * „Povestea neamului” trece prin oameni în ordinea nașterii: copacul se întoarce spre fiecare, iar dedesubt apare
 * lumea în care s-a născut, după ținutul lui, și ce a trăit.
 */
export default function Tree360({ seeds, links = [], people, selectedId, egoPath, onSelectPerson, onCenter, originOf }: Props) {
  const t = useTranslations("Charts"), tp = useTranslations("Person"), tt = useTranslations("Times"), w = useTimesWords(), locale = useLocale();
  const lay = useMemo(() => layout360(seeds), [seeds]);
  const root = seeds[0].node;
  // Pe telefon desenul stă în picioare, ca să încapă un copac înalt.
  const wrap = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = narrow ? 600 : 1000, H = narrow ? 860 : 700;
  const byId = useMemo(() => new Map(lay.nodes.map((n) => [n.id, n])), [lay]);
  const span = Math.max(lay.radius + 70, lay.height / 2 + 90, 260);
  const base: Cam = { yaw: 0.35, pitch: PITCH, cy: lay.height / 2, dist: span * 3 };
  const [cam, setCam] = useState<Cam>(base);
  const [zoom, setZoom] = useState(1);
  const [spin, setSpin] = useState(false);
  const target = useRef<{ yaw: number; cy: number; zoom: number } | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; id: number } | null>(null);
  const dragged = useRef(false); // clicul de după o rotire nu alege pe nimeni
  const [story, setStory] = useState<number | null>(null);
  const [autoplay, setAutoplay] = useState(false);

  // Pornește oprit: îl învârți tu cu mâna, sau apeși „Rotește singur”.
  // Alt neam (alt trunchi): o luăm de la capăt.
  useEffect(() => { setCam({ ...base, dist: span * 3 }); setZoom(1); setStory(null); target.current = null; }, [seeds]); // eslint-disable-line react-hooks/exhaustive-deps

  // O singură buclă de desen: rotirea lentă, ori drumul spre omul din poveste.
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  useEffect(() => {
    let raf = 0, last = performance.now();
    const step = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      const tg = target.current;
      if (tg) {
        const k = 1 - Math.pow(0.9, dt / 16);
        setCam((c) => {
          const dy = angleDiff(c.yaw, tg.yaw), dc = tg.cy - c.cy;
          if (Math.abs(dy) < 0.0008 && Math.abs(dc) < 0.3) return c;
          return { ...c, yaw: c.yaw + dy * k, cy: c.cy + dc * k, pitch: c.pitch + (PITCH - c.pitch) * k };
        });
        const dz = tg.zoom - zoomRef.current;
        if (Math.abs(dz) > 0.002) setZoom((z) => z + dz * k);
      } else if (spin && !drag.current) setCam((c) => ({ ...c, yaw: c.yaw + dt * 0.00018 }));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [spin]);

  // Povestea: oamenii cu anul nașterii, de la cel mai vechi la cel mai tânăr.
  const steps = useMemo(() => lay.nodes.map((n) => people[n.id]).filter((p): p is PersonView => !!p && p.birthYear !== null)
    .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)
    .sort((a, b) => a.birthYear! - b.birthYear! || a.name.localeCompare(b.name, "ro")), [lay, people]);
  const withoutYear = useMemo(() => new Set(lay.nodes.map((n) => n.id)).size - steps.length, [lay, steps]);
  const focus = (id: string) => {
    const n = byId.get(id);
    if (!n) return;
    setSpin(false);
    target.current = { yaw: n.x === 0 && n.z === 0 ? cam.yaw : yawFacing(Math.atan2(n.z, n.x)), cy: n.y, zoom: Math.max(1.5, zoom) };
  };
  const goStep = (i: number) => {
    const p = steps[i];
    if (!p) return;
    setStory(i);
    onSelectPerson(p.id);
    focus(p.id);
  };
  const stopStory = () => { setStory(null); setAutoplay(false); target.current = { yaw: cam.yaw, cy: lay.height / 2, zoom: 1 }; };
  useEffect(() => {
    if (!autoplay || story === null) return;
    const t = setTimeout(() => (story + 1 < steps.length ? goStep(story + 1) : setAutoplay(false)), 13000);
    return () => clearTimeout(t);
  }, [autoplay, story, steps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rotire cu mouse-ul sau cu degetul; un clic fără mișcare alege omul.
  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    setSpin(false); // l-ai prins cu mâna: stă pe loc până îl pornești din nou
    dragged.current = false;
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) { d.moved = true; e.currentTarget.setPointerCapture(e.pointerId); setSpin(false); target.current = null; }
    d.x = e.clientX; d.y = e.clientY;
    setCam((c) => ({ ...c, yaw: c.yaw + dx * 0.009, pitch: clamp(c.pitch + dy * 0.005, -1.2, 0.3) }));
  };
  const onUp = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) { dragged.current = true; e.currentTarget.releasePointerCapture?.(e.pointerId); }
  };
  const turn = (a: number) => { setSpin(false); target.current = null; setCam((c) => ({ ...c, yaw: c.yaw + a })); };
  const zoomBy = (f: number) => { target.current = null; setZoom((z) => clamp(z * f, 0.5, 4)); };
  const onKey = (e: React.KeyboardEvent) => {
    const k: Record<string, () => void> = {
      ArrowLeft: () => turn(-0.25), ArrowRight: () => turn(0.25),
      ArrowUp: () => setCam((c) => ({ ...c, pitch: clamp(c.pitch - 0.1, -1.2, 0.3) })), ArrowDown: () => setCam((c) => ({ ...c, pitch: clamp(c.pitch + 0.1, -1.2, 0.3) })),
      "+": () => zoomBy(1.2), "=": () => zoomBy(1.2), "-": () => zoomBy(1 / 1.2), " ": () => setSpin((s) => !s),
    };
    if (k[e.key]) { e.preventDefault(); k[e.key](); }
  };

  // Desenul: totul proiectat, apoi de la ce e în spate la ce e în față.
  const scale = Math.min(W / 2 / (lay.radius + 80), H / 2 / (lay.height / 2 + 110)) * 0.95 * zoom;
  const P = (p: { x: number; y: number; z: number }) => {
    const q = project(p, cam);
    return { x: W / 2 + q.x * scale, y: H / 2 + q.y * scale, z: q.z, s: q.s };
  };
  type Item = { z: number; el: React.ReactNode };
  const items: Item[] = [];
  const ground = Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return P({ x: Math.cos(a) * lay.radius * 0.55, y: -ROW_H * 0.55, z: Math.sin(a) * lay.radius * 0.55 }); });
  const trunkBase = P({ x: 0, y: -ROW_H * 0.55, z: 0 });
  const rootPs = seeds.map((sd) => byId.get(sd.node.id)).filter((n): n is Node3 => !!n).map((n) => ({ id: n.id, p: P({ x: n.x, y: Math.min(n.y, 0), z: n.z }), top: P(n) }));
  const zoomLine = clamp(scale * 1.6, 0.5, 2.2);
  for (const n of lay.nodes) {
    if (!n.parent) continue;
    const par = byId.get(n.parent);
    if (!par) continue;
    const a = P(par), b = P(n);
    if (n.spouse) {
      items.push({ z: (a.z + b.z) / 2 + 1, el: <line key={`s${n.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--ochre)" strokeWidth={1.6 * zoomLine * b.s} strokeDasharray="4 3" opacity={fade(b.z, span)} /> });
      continue;
    }
    const c = P({ x: par.x, y: n.y - ROW_H * 0.4, z: par.z });
    const onPath = egoPath.has(n.id) && egoPath.has(par.id);
    const w = Math.max(1.4, 7.5 - n.depth * 1.2) * zoomLine * ((a.s + b.s) / 2) * (n.apart ? 0.55 : 1);
    items.push({
      z: (a.z + b.z) / 2 + 2,
      el: <path key={`e${n.id}`} d={`M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`} fill="none" stroke={onPath ? "var(--accent)" : "var(--tree-bark)"} strokeWidth={w} strokeLinecap="round" opacity={fade((a.z + b.z) / 2, span)} />,
    });
  }
  for (const [a1, b1] of links) {
    const na = byId.get(a1), nb = byId.get(b1);
    if (!na || !nb) continue;
    const a = P(na), b = P(nb);
    items.push({ z: (a.z + b.z) / 2 + 1, el: <line key={`m${a1}${b1}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--ochre)" strokeWidth={2.4 * zoomLine} strokeDasharray="6 4" opacity={fade((a.z + b.z) / 2, span)} /> });
  }
  const nodeEl = (n: Node3) => {
    const p = people[n.id];
    if (!p) return null;
    const q = P(n);
    const r = (n.spouse ? 11 : 15) * q.s * zoomLine;
    const sel = n.id === selectedId, path = egoPath.has(n.id);
    const front = q.z < span * 0.15;
    const label = sel || (front && q.s * zoomLine > 0.62);
    const op = sel ? 1 : fade(q.z, span);
    const fill = path ? "var(--accent-soft)" : n.spouse ? "var(--leaf-spouse)" : p.sex === "F" ? "var(--leaf-mat)" : "var(--leaf-pat)";
    const fs = clamp(12.5 * q.s * zoomLine, 8, 17);
    return {
      z: q.z,
      el: (
        <g key={`n${n.id}`} className="n360" transform={`translate(${q.x},${q.y})`} opacity={op} onClick={() => { if (!dragged.current) onSelectPerson(n.id); }}
          onDoubleClick={() => onCenter(n.id)} role="button" aria-label={p.name}>
          <title>{p.birthYear ? `${p.name}, ${tp("bornYear", { year: `${p.approx ? DATE_WORDS[locale].approx : ""}${p.birthYear}`, sex: p.sex })}` : p.name}</title>
          <circle r={r} fill={fill} stroke={sel ? "var(--accent)" : "var(--leaf-edge)"} strokeWidth={sel ? 3.2 : 1.4} />
          <text textAnchor="middle" dy="0.35em" fontSize={r * 0.85} fontWeight={700} fill="var(--ink)">{initials(p)}</text>
          {label && (
            <text className="n360-label" textAnchor="middle" y={r + fs + 1} fontSize={fs}>
              <tspan fontWeight={sel ? 700 : 600}>{clip(p.givenName || p.name, 16)}</tspan>
              {p.birthYear !== null && <tspan x={0} dy={fs * 1.1} fontSize={fs * 0.82} fill="var(--muted)">{p.approx ? DATE_WORDS[locale].approx : ""}{p.birthYear}{p.deathYear ? `–${p.deathYear}` : ""}</tspan>}
            </text>
          )}
        </g>
      ),
    };
  };
  for (const n of lay.nodes) { const it = nodeEl(n); if (it) items.push(it); }
  items.sort((a, b) => b.z - a.z);

  const cur = story !== null ? steps[story] : null;
  const s = cur ? storyFor(cur, originOf(cur.id)) : null;
  const prev = story !== null && story > 0 ? steps[story - 1] : null;
  const newEra = !!(s && (!prev || storyFor(prev, null)?.era.id !== s.era.id));

  return (
    <div className="t360" ref={wrap}>
      <div className="t360-tools">
        <button className="btn primary" onClick={() => (story === null ? goStep(0) : stopStory())} disabled={!steps.length}>
          {story === null ? t("storyStart") : t("storyStop")}
        </button>
        <span className="t360-turn">
          <button onClick={() => turn(-0.4)} aria-label={t("rotateLeft")} title={t("rotateLeft")}>⟲</button>
          <button className="zt-text" onClick={() => setSpin((v) => !v)} aria-pressed={spin}>{spin ? t("spinStop") : t("spinStart")}</button>
          <button onClick={() => turn(0.4)} aria-label={t("rotateRight")} title={t("rotateRight")}>⟳</button>
          <button onClick={() => zoomBy(1.25)} aria-label={t("zoomIn")}>+</button>
          <button onClick={() => zoomBy(0.8)} aria-label={t("zoomOut")}>−</button>
          <button className="zt-text" onClick={() => { target.current = null; setZoom(1); setCam({ ...base, yaw: cam.yaw }); }}>{t("wholeTree")}</button>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="t360-svg" tabIndex={0} onKeyDown={onKey} role="img"
        aria-label={t("label360", { names: seeds.map((sd) => people[sd.node.id]?.name ?? "").join(` ${t("and")} `) })}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1); } }}>
        <polygon points={ground.map((g) => `${g.x},${g.y}`).join(" ")} fill="var(--tree-ground)" opacity={0.7} />
        {rootPs.map((r) => (
          <path key={`t${r.id}`} d={`M${trunkBase.x},${trunkBase.y} Q${r.p.x},${trunkBase.y} ${r.p.x},${r.p.y} L${r.top.x},${r.top.y}`} fill="none"
            stroke="var(--tree-bark-dark)" strokeWidth={(seeds.length > 1 ? 8 : 11) * zoomLine} strokeLinecap="round" />
        ))}
        {items.map((i) => i.el)}
      </svg>
      {cur && s && (
        <div className="t360-story" aria-live="polite">
          {newEra && <div className="era-chip">{tt("newChapter", { era: w.era(s.era), years: w.eraYears(s) })}</div>}
          <h3>{cur.name}</h3>
          <p className="times-born">{w.born(cur, s)}{s.origin?.guess ? ` (${tt("guessShort", { name: s.origin.guess })})` : ""}.</p>
          <p className="times-life">{w.life(s)}</p>
          {s.lived.length > 0 && (
            <ul className="times-list">
              {s.lived.slice(0, 5).map(({ event: e, age, ongoing }) => (
                <li key={e.id}><i style={{ background: toneColor(e.tone) }} title={w.tone(e.tone)} /><b>{e.year}</b> <span className="muted">({w.age(age, cur.sex, ongoing)})</span> {w.event(e)}</li>
              ))}
            </ul>
          )}
          <div className="t360-nav">
            <button className="btn" onClick={() => goStep(story! - 1)} disabled={story === 0}>{t("back")}</button>
            <span className="muted">{t("stepOf", { n: story! + 1, total: steps.length })}</span>
            <button className="btn primary" onClick={() => goStep(story! + 1)} disabled={story! + 1 >= steps.length}>{t("next")}</button>
            <button className="btn" aria-pressed={autoplay} onClick={() => setAutoplay((a) => !a)}>{autoplay ? t("pause") : t("autoplay")}</button>
          </div>
          {withoutYear > 0 && story === 0 && <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>{t("withoutYear", { count: withoutYear })}</p>}
        </div>
      )}
    </div>
  );
}

/** Ce e în spatele copacului se vede mai șters. */
function fade(z: number, span: number) {
  return clamp(0.95 - (z / span) * 0.55, 0.28, 1);
}
function initials(p: PersonView) {
  return `${(p.givenName || p.name || "?")[0] ?? ""}${(p.surname || "")[0] ?? ""}`.toUpperCase();
}
