"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";

const MIN = 0.1, MAX = 4, STEP = 1.25;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, z));

/**
 * Zoom pe desenele arborelui: plus și minus, „tot desenul” (cât încape pe ecran), pe tot ecranul, Ctrl + rotița mouse-ului,
 * ciupit cu două degete (pe telefon și pe trackpad) și tras cu mouse-ul ca să te miști prin desen.
 * Desenele sunt SVG, deci rămân clare la orice mărime: schimbăm doar lățimea lor, înălțimea vine din proporții.
 */
export default function ZoomBox({ children, resetKey, boxRef, full, onFull }: {
  children: ReactNode; resetKey: string; boxRef?: RefObject<HTMLDivElement | null>; full: boolean; onFull: (on: boolean) => void;
}) {
  const own = useRef<HTMLDivElement>(null);
  const box = boxRef ?? own;
  const inner = useRef<HTMLDivElement>(null);
  // null = mărimea obișnuită a desenului (cum îl așază pagina); altfel de câte ori e mai mare decât mărimea lui firească.
  const [zoom, setZoom] = useState<number | null>(null);
  const zoomRef = useRef<number | null>(null);
  zoomRef.current = zoom;
  const natW = useRef(0);

  const svgOf = () => inner.current?.querySelector("svg") ?? null;
  const natural = () => {
    const vb = svgOf()?.viewBox?.baseVal;
    return vb && vb.width > 0 && vb.height > 0 ? { w: vb.width, h: vb.height } : null;
  };
  /** Mărimea de acum față de cea firească (și înainte de primul zoom, când desenul are mărimea lui obișnuită). */
  const current = () => {
    const n = natural(), s = svgOf();
    if (zoomRef.current !== null || !n || !s) return zoomRef.current ?? 1;
    return s.getBoundingClientRect().width / n.w;
  };
  /** Schimbă mărimea păstrând pe loc punctul de sub deget sau de sub mouse (implicit, mijlocul ferestrei desenului). */
  const zoomTo = (next: number, x?: number, y?: number) => {
    const el = box.current, s = svgOf(), n = natural();
    if (!el || !s || !n) return;
    const z1 = clamp(next), r = el.getBoundingClientRect();
    const ex = x ?? r.left + el.clientWidth / 2, ey = y ?? r.top + el.clientHeight / 2;
    const before = s.getBoundingClientRect(), z0 = before.width / n.w;
    const ux = (ex - before.left) / z0, uy = (ey - before.top) / z0;
    natW.current = n.w;
    flushSync(() => setZoom(z1));
    const after = s.getBoundingClientRect();
    el.scrollLeft += after.left + ux * z1 - ex;
    el.scrollTop += after.top + uy * z1 - ey;
  };
  /** Tot desenul pe ecran, cât încape și pe lățime, și pe înălțime. */
  const fit = () => {
    const el = box.current, n = natural();
    if (!el || !n) return;
    const h = full ? el.clientHeight : window.innerHeight * 0.78;
    natW.current = n.w;
    flushSync(() => setZoom(clamp(Math.min((el.clientWidth - 4) / n.w, (h - 4) / n.h))));
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = 0;
  };
  const fns = useRef({ zoomTo, current, fit });
  fns.current = { zoomTo, current, fit };

  // Alt desen (altă vedere, alt centru, alte generații): dacă e mai lat decât fereastra, îl micșorăm cât să se vadă pe lățime
  // (dar nu sub jumătate, ca numele să rămână de citit); altfel rămâne cum e. Pe tot ecranul, tot desenul.
  useLayoutEffect(() => {
    if (full) {
      const f = requestAnimationFrame(() => fns.current.fit());
      return () => cancelAnimationFrame(f);
    }
    const el = box.current, n = natural();
    if (el && n && n.w > el.clientWidth + 4) {
      natW.current = n.w;
      setZoom(clamp(Math.max(0.5, (el.clientWidth - 4) / n.w)));
    } else setZoom(null);
  }, [resetKey, full]);

  // Pe tot ecranul: Esc închide, iar pagina de dedesubt nu se mai derulează.
  useEffect(() => {
    if (!full) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onFull(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = prev; };
  }, [full, onFull]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const touches = new Map<number, { x: number; y: number }>();
    let drag: { id: number; x: number; y: number; sl: number; st: number; moved: boolean } | null = null;
    let pinch: { d: number; z: number } | null = null;
    let swallowClick = false, frame = 0, pending: (() => void) | null = null;
    const later = (fn: () => void) => {
      pending = fn;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; const f = pending; pending = null; f?.(); });
    };
    const two = () => {
      const [a, b] = [...touches.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        if (e.button === 0) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop, moved: false };
        return;
      }
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) pinch = { d: two().d, z: fns.current.current() };
    };
    const move = (e: PointerEvent) => {
      if (drag && e.pointerId === drag.id) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 5) {
          drag.moved = true;
          el.setPointerCapture(e.pointerId);
          el.classList.add("dragging");
        }
        if (drag.moved) { el.scrollLeft = drag.sl - dx; el.scrollTop = drag.st - dy; }
        return;
      }
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && touches.size === 2) {
        const p = pinch, t = two();
        if (p.d > 0) later(() => fns.current.zoomTo((p.z * t.d) / p.d, t.x, t.y));
      }
    };
    const up = (e: PointerEvent) => {
      if (drag && e.pointerId === drag.id) {
        // După ce ai tras de desen, nu deschidem și fișa persoanei de sub mouse.
        if (drag.moved) { swallowClick = true; el.classList.remove("dragging"); }
        drag = null;
      }
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
    };
    const click = (e: MouseEvent) => { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } };
    // Ctrl (sau Cmd) + rotița; ciupitul pe trackpad vine tot așa în Chrome, Edge și Firefox. Rotița simplă derulează, ca de obicei.
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const f = Math.exp(-Math.max(-50, Math.min(50, e.deltaY)) * 0.006);
      fns.current.zoomTo(fns.current.current() * f, e.clientX, e.clientY);
    };
    // Safari pe Mac: ciupitul pe trackpad vine ca „gesture”. Pe telefon îl prindem din atingeri, mai sus.
    const touchScreen = "ontouchstart" in window;
    let g0 = 1;
    const gStart = (e: Event) => { if (touchScreen) return; e.preventDefault(); g0 = fns.current.current(); };
    const gChange = (e: Event) => {
      if (touchScreen) return;
      e.preventDefault();
      const g = e as Event & { scale: number; clientX: number; clientY: number };
      fns.current.zoomTo(g0 * g.scale, g.clientX, g.clientY);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("click", click, true);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("gesturestart", gStart);
    el.addEventListener("gesturechange", gChange);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("click", click, true);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("gesturestart", gStart);
      el.removeEventListener("gesturechange", gChange);
    };
  }, [box]);

  const zoomed = zoom !== null && natW.current > 0;
  return (
    <div className="zoom-wrap">
      <div className="zoom-tools" role="group" aria-label="Mărimea desenului">
        <button type="button" onClick={() => zoomTo(current() / STEP)} aria-label="Micșorează" title="Micșorează">−</button>
        {zoomed && <span className="zt-pct" aria-live="polite">{Math.round(zoom * 100)}%</span>}
        <button type="button" onClick={() => zoomTo(current() * STEP)} aria-label="Mărește" title="Mărește">+</button>
        <button type="button" className="zt-text" onClick={fit} title="Tot desenul, cât încape pe ecran">Tot</button>
        <button type="button" className="zt-text" onClick={() => onFull(!full)} aria-pressed={full} title={full ? "Închide (Esc)" : "Pe tot ecranul"}>
          {full ? "Închide" : (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Pe tot ecranul" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4" />
            </svg>
          )}
        </button>
      </div>
      <div ref={box} className="chartbox zoomable">
        <div ref={inner} className={zoomed ? "zoom-inner zoomed" : "zoom-inner"}
          style={zoomed ? ({ "--zw": `${Math.round(natW.current * zoom)}px` } as React.CSSProperties) : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
