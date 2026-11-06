"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Măsoară cât stă omul, activ, în fiecare parte a site-ului: doar cât timp pagina e în față și omul a mișcat ceva (a apăsat,
 * a scris, a derulat) în ultimele două minute. Trimite la un minut, când schimbă pagina și când pleacă. Apare doar la cei care
 * au spus „Bine” la anunț. Pagina arborelui spune singură cum e desenat arborele: `data-sectiune` și `data-sectiune-cale` pe
 * <html>, plus evenimentul „cn:sectiune” când omul schimbă desenul.
 */
const TICK = 5, SEND_EVERY = 60, IDLE_MS = 120_000;

type Current = { path: string; hint: string | undefined; seconds: number; view: boolean };

/** Felul arborelui, doar dacă pagina care l-a spus e chiar cea de acum. */
function hintFor(path: string) {
  const el = document.documentElement;
  return el.dataset.sectiuneCale === path ? el.dataset.sectiune : undefined;
}

export default function UsageBeat() {
  const pathname = usePathname();
  const cur = useRef<Current>({ path: "", hint: undefined, seconds: 0, view: false });
  const send = useRef<() => void>(() => {});

  useEffect(() => {
    const phone = window.matchMedia("(pointer: coarse)").matches && Math.min(window.screen.width, window.screen.height) < 820;
    const app = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let lastInput = Date.now();
    send.current = () => {
      const c = cur.current;
      if (!c.path || (c.seconds < TICK && !c.view)) return;
      const body = JSON.stringify({ path: c.path, hint: c.hint ?? null, seconds: c.seconds, view: c.view, phone, app });
      c.seconds = 0;
      c.view = false;
      if (!navigator.sendBeacon?.("/api/folosire", new Blob([body], { type: "application/json" }))) {
        fetch("/api/folosire", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
      }
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
    const onHide = () => { if (document.visibilityState === "hidden") send.current(); };
    const onLeave = () => send.current();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput < IDLE_MS) cur.current.seconds += TICK;
      if (cur.current.seconds >= SEND_EVERY) send.current();
    }, TICK * 1000);
    const inputs = ["pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;
    for (const e of inputs) window.addEventListener(e, active, { passive: true });
    window.addEventListener("cn:sectiune", onHint);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.clearInterval(timer);
      for (const e of inputs) window.removeEventListener(e, active);
      window.removeEventListener("cn:sectiune", onHint);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onLeave);
      send.current();
    };
  }, []);

  // Pagină nouă: ce s-a strâns pe cea veche pleacă, iar cea nouă se numără ca deschisă.
  useEffect(() => {
    if (cur.current.path && cur.current.path !== pathname) send.current();
    cur.current = { path: pathname, hint: hintFor(pathname), seconds: 0, view: true };
  }, [pathname]);

  return null;
}
