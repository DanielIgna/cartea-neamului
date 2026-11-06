"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Măsoară cât stă omul, activ, în fiecare parte a site-ului: doar cât timp pagina e în față și omul a mișcat ceva (a apăsat,
 * a scris, a derulat) în ultimele două minute. Trimite la un minut, când schimbă pagina și când pleacă. Apare doar la cei care
 * au spus „Bine” la anunț. Pagina arborelui spune singură cum e desenat arborele: `data-sectiune` și `data-sectiune-cale` pe
 * <html>, plus evenimentul „cn:sectiune” când omul schimbă desenul.
 *
 * Când pagina se închide, bătaia pleacă pe loc, dar browserul n-o duce mereu la capăt. De aceea rămâne și aici, cel mult o oră,
 * și se trimite din nou la intrarea următoare; fiecare bătaie are un id, iar serverul o numără o singură dată.
 */
const TICK = 5, SEND_EVERY = 60, IDLE_MS = 120_000;
const KEEP_MS = 3_600_000, MAX_KEPT = 20;

type Current = { path: string; hint: string | undefined; seconds: number; view: boolean };
type Beat = { id: string; path: string; hint: string | null; seconds: number; view: boolean; phone: boolean; app: boolean; at: number };

/** Felul arborelui, doar dacă pagina care l-a spus e chiar cea de acum. */
function hintFor(path: string) {
  const el = document.documentElement;
  return el.dataset.sectiuneCale === path ? el.dataset.sectiune : undefined;
}

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
const bodyOf = (b: Beat) => JSON.stringify({ ...b, at: undefined });
const post = (b: Beat) =>
  fetch("/api/folosire", { method: "POST", body: bodyOf(b), keepalive: true, headers: { "content-type": "application/json" } }).then((r) => r.ok, () => false);

function keptBeats(key: string): Beat[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? (v as Beat[]) : [];
  } catch { return []; }
}
function keepBeats(key: string, list: Beat[]) {
  try {
    if (list.length) localStorage.setItem(key, JSON.stringify(list.slice(-MAX_KEPT)));
    else localStorage.removeItem(key);
  } catch { /* fără stocare în browser: bătaia doar se trimite */ }
}

export default function UsageBeat({ userId }: { userId: string }) {
  const pathname = usePathname();
  const cur = useRef<Current>({ path: "", hint: undefined, seconds: 0, view: false });
  const send = useRef<(leaving?: boolean) => void>(() => {});

  useEffect(() => {
    const key = `cn-folosire:${userId}`;
    const phone = window.matchMedia("(pointer: coarse)").matches && Math.min(window.screen.width, window.screen.height) < 820;
    const app = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let lastInput = Date.now();
    const later = (b: Beat) => keepBeats(key, [...keptBeats(key), b]);
    // Ce a rămas de la plecările de dinainte (din ultima oră) se trimite din nou; ce ajunsese deja, serverul lasă deoparte.
    const flush = () => {
      const list = keptBeats(key).filter((b) => b && typeof b.at === "number" && Date.now() - b.at < KEEP_MS);
      keepBeats(key, []);
      for (const b of list) void post(b).then((ok) => { if (!ok) later(b); });
    };
    send.current = (leaving = false) => {
      const c = cur.current;
      if (!c.path || (c.seconds < TICK && !c.view)) return;
      const beat: Beat = { id: newId(), path: c.path, hint: c.hint ?? null, seconds: c.seconds, view: c.view, phone, app, at: Date.now() };
      c.seconds = 0;
      c.view = false;
      if (!leaving) {
        void post(beat).then((ok) => { if (!ok) later(beat); });
        return;
      }
      later(beat);
      navigator.sendBeacon?.("/api/folosire", new Blob([bodyOf(beat)], { type: "application/json" }));
    };
    const active = () => { lastInput = Date.now(); };
    // Omul a schimbat felul arborelui pe aceeași pagină: timpul de până acum ține de felul vechi.
    const onHint = () => {
      const c = cur.current;
      const next = hintFor(c.path);
      if (document.documentElement.dataset.sectiuneCale !== c.path || next === c.hint) return;
      if (c.view && c.seconds < TICK) { c.hint = next; return; }
      send.current();
      c.hint = next;
      c.view = true;
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") send.current(true); else flush(); };
    const onLeave = () => send.current(true);
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) flush(); };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput < IDLE_MS) cur.current.seconds += TICK;
      if (cur.current.seconds >= SEND_EVERY) send.current();
    }, TICK * 1000);
    const inputs = ["pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;
    for (const e of inputs) window.addEventListener(e, active, { passive: true });
    window.addEventListener("cn:sectiune", onHint);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("pageshow", onShow);
    flush();
    return () => {
      window.clearInterval(timer);
      for (const e of inputs) window.removeEventListener(e, active);
      window.removeEventListener("cn:sectiune", onHint);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("pageshow", onShow);
      send.current();
    };
  }, [userId]);

  // Pagină nouă: ce s-a strâns pe cea veche pleacă, iar cea nouă se numără ca deschisă.
  useEffect(() => {
    if (cur.current.path && cur.current.path !== pathname) send.current();
    cur.current = { path: pathname, hint: hintFor(pathname), seconds: 0, view: true };
  }, [pathname]);

  return null;
}
