"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "use-intl";

const MIN = 0.1, MAX = 4, STEP = 1.25;
/** Sub mărimea asta numele din desene nu se mai citesc pe un telefon. */
const READABLE = 0.8;
/** Ecran tactil fără mouse (telefon, tabletă). */
const touchy = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, z));

/**
 * Zoom pe desenele arborelui: plus și minus, „tot desenul” (cât încape pe ecran), pe tot ecranul, Ctrl + rotița mouse-ului,
 * ciupit cu două degete (pe telefon și pe trackpad) și tras cu mouse-ul ca să te miști prin desen.
 * Desenele sunt SVG, deci rămân clare la orice mărime: schimbăm doar lățimea lor, înălțimea vine din proporții.
 */
export default function ZoomBox({ children, resetKey, boxRef, full, onFull, startZoom }: {
  children: ReactNode; resetKey: string; boxRef?: RefObject<HTMLDivElement | null>; full: boolean; onFull: (on: boolean) => void;
  /** Pentru desene foarte late (axa anilor): pornește cel puțin de la mărimea asta și lasă desenul să se deruleze pe lățime. */
  startZoom?: number;
}) {
  const t = useTranslations("Charts");
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
  const fit = (auto = false) => {
    const el = box.current, n = natural();
    if (!el || !n) return;
    const h = full ? el.clientHeight : window.innerHeight * 0.78;
    natW.current = n.w;
    const whole = Math.min((el.clientWidth - 4) / n.w, (h - 4) / n.h);
    // Pe telefon, pe tot ecranul, „tot desenul” ar face numele prea mici: pornim de la o mărime la care se citesc
    // și așezăm mijlocul desenului pe ecran; de acolo te miști cu un deget. Butonul „Tot” arată tot desenul oricum.
    // La fel la desenele care cer o mărime de pornire (urmașii unui neam mare): pe tot ecranul nu se micșorează sub ea.
    const floor = auto && full ? (startZoom ? Math.min(startZoom, 0.9) : touchy() ? READABLE : 0) : 0;
    flushSync(() => setZoom(clamp(Math.max(whole, floor))));
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = floor > whole ? Math.max(0, (el.scrollHeight - el.clientHeight) / 2) : 0;
  };
  const fns = useRef({ zoomTo, current, fit });
  fns.current = { zoomTo, current, fit };

  // Alt desen (altă vedere, alt centru, alte generații): dacă e mai lat decât fereastra, îl micșorăm cât să se vadă pe lățime
  // (dar nu sub jumătate, ca numele să rămână de citit); altfel rămâne cum e. Pe tot ecranul, tot desenul.
  useLayoutEffect(() => {
    if (full) {
      const f = requestAnimationFrame(() => fns.current.fit(true));
      return () => cancelAnimationFrame(f);
    }
    const el = box.current, n = natural();
    if (el && n && n.w > el.clientWidth + 4) {
      // Pe telefon pornim de la o mărime la care numele se citesc, cu mijlocul desenului pe ecran (acolo e persoana din centru).
      const z = clamp(Math.max(startZoom ?? (touchy() ? READABLE : 0.5), (el.clientWidth - 4) / n.w));
      natW.current = n.w;
      setZoom(z);
      const f = requestAnimationFrame(() => { el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; });
      return () => cancelAnimationFrame(f);
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
      if (e.pointerType === "touch") return; // atingerile le citim mai jos, din touchstart/touchmove
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
    // Pe ecranul tactil: un deget derulează pagina (desenul nu prinde degetul), două degete mută și măresc desenul.
    let duo: { d: number; z: number; x: number; y: number } | null = null;
    const mid = (l: TouchList) => ({ d: Math.hypot(l[0].clientX - l[1].clientX, l[0].clientY - l[1].clientY), x: (l[0].clientX + l[1].clientX) / 2, y: (l[0].clientY + l[1].clientY) / 2 });
    const tStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) { duo = null; return; }
      e.preventDefault();
      const m = mid(e.touches);
      duo = { d: m.d, z: fns.current.current(), x: m.x, y: m.y };
      el.parentElement?.classList.remove("hint-on");
    };
    const tMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !duo) { const w = el.parentElement; w?.classList.add("hint-on"); window.clearTimeout(hintT); hintT = window.setTimeout(() => w?.classList.remove("hint-on"), 1400); return; }
      if (!duo || e.touches.length !== 2) return;
      e.preventDefault();
      const m = mid(e.touches), p = duo;
      later(() => {
        if (p.d > 0) fns.current.zoomTo((p.z * m.d) / p.d, m.x, m.y);
        el.scrollLeft -= m.x - p.x;
        el.scrollTop -= m.y - p.y;
        p.x = m.x; p.y = m.y;
      });
    };
    const tEnd = (e: TouchEvent) => { if (e.touches.length < 2) duo = null; };
    let hintT = 0;
    el.addEventListener("touchstart", tStart, { passive: false });
    el.addEventListener("touchmove", tMove, { passive: false });
    el.addEventListener("touchend", tEnd);
    el.addEventListener("touchcancel", tEnd);
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
      window.clearTimeout(hintT);
      el.removeEventListener("touchstart", tStart);
      el.removeEventListener("touchmove", tMove);
      el.removeEventListener("touchend", tEnd);
      el.removeEventListener("touchcancel", tEnd);
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
    <div className="zoom-wrap" data-hint={t("twoFingers")}>
      <div className="zoom-tools" role="group" aria-label={t("zoomGroup")}>
        <button type="button" onClick={() => zoomTo(current() / STEP)} aria-label={t("zoomOut")} title={t("zoomOut")}>−</button>
        {zoomed && <span className="zt-pct" aria-live="polite">{Math.round(zoom * 100)}%</span>}
        <button type="button" onClick={() => zoomTo(current() * STEP)} aria-label={t("zoomIn")} title={t("zoomIn")}>+</button>
        <button type="button" className="zt-text" onClick={() => fit()} title={t("fitTitle")}>{t("fit")}</button>
        <button type="button" className="zt-text" onClick={() => onFull(!full)} aria-pressed={full} title={full ? t("closeEsc") : t("fullScreen")}>
          {full ? t("close") : (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-label={t("fullScreen")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4" />
            </svg>
          )}
          {!full && <span className="only-touch zt-label">{t("fullScreen")}</span>}
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
