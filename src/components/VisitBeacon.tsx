"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ctaTarget } from "@/lib/cta";

/**
 * Numărarea anonimă a vizitelor (Admin → Analiză, src/lib/vizite.ts): la fiecare pagină deschisă trimite doar adresa paginii,
 * site-ul de unde a venit omul, eticheta de campanie din link (utm_…), lățimea ecranului și limba paginii. Nu pune cookie-uri și
 * nu ține nimic în browser. La clic pe un buton de început („Începe arborele”, „Plătește”) trimite doar adresa butonului. Cine are „Do Not Track” sau „Global Privacy Control” pornit nu e numărat deloc.
 */
export default function VisitBeacon() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string };
    if (nav.globalPrivacyControl || nav.doNotTrack === "1") return;
    const q = new URLSearchParams(window.location.search);
    // Sursa (site-ul din care a venit) contează doar la prima pagină; la paginile următoare omul vine din site.
    const ref = first.current ? document.referrer || null : null;
    first.current = false;
    const body = JSON.stringify({
      path: window.location.pathname, ref, src: q.get("src"),
      us: q.get("utm_source") ?? q.get("ref"), um: q.get("utm_medium"), uc: q.get("utm_campaign"),
      w: Math.round(window.innerWidth), lang: document.documentElement.lang || null,
    });
    try {
      if (!navigator.sendBeacon?.("/api/vizita", new Blob([body], { type: "application/json" })))
        void fetch("/api/vizita", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    } catch { /* nu e nimic de făcut */ }
  }, [pathname]);

  // Clicurile pe butoanele de început („Începe arborele”, „Plătește”, „Dăruiește”…): doar spre ce adresă duc și de pe ce pagină.
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string };
    if (nav.globalPrivacyControl || nav.doNotTrack === "1") return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a[href], [data-cta]");
      if (!el) return;
      const target = el.getAttribute("data-cta") || ctaTarget(el.getAttribute("href"));
      if (!target) return;
      const body = JSON.stringify({ path: window.location.pathname, cta: target.slice(0, 60) });
      try {
        if (!navigator.sendBeacon?.("/api/vizita", new Blob([body], { type: "application/json" })))
          void fetch("/api/vizita", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
      } catch { /* nu e nimic de făcut */ }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
