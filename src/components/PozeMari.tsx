"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { zoomText } from "@/lib/poze-mari-texte";

type Img = { src: string; width: number; height: number };
/**
 * Pozele mari (Daniel, 27.11.2026): un clic pe o poză de prezentare (orice element cu data-zoom="<n>" din pagină) o deschide pe tot
 * ecranul. Între poze se trece cu săgețile de pe ecran, cu tastele ← → sau trăgând cu degetul; se închide cu ×, cu Esc sau cu un
 * clic/atingere în afara pozei. Folosește <dialog>, deci focusul rămâne înăuntru și Esc merge singur.
 */
export default function PozeMari({ images, alt, locale }: { images: Img[]; alt: string; locale: Locale }) {
  const t = zoomText(locale);
  const ref = useRef<HTMLDialogElement>(null);
  const [at, setAt] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const many = images.length > 1;
  const go = useCallback((d: number) => setAt((i) => (i + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-zoom]");
      if (!el || !ref.current) return;
      const n = Number(el.getAttribute("data-zoom"));
      if (!Number.isInteger(n) || n < 0 || n >= images.length) return;
      e.preventDefault();
      setAt(n);
      if (!ref.current.open) ref.current.showModal();
      document.documentElement.classList.add("zoom-open");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [images.length]);

  const close = () => ref.current?.close();
  const img = images[at];
  if (!images.length) return null;
  return (
    <dialog
      ref={ref}
      className="zoom"
      aria-label={alt}
      onClose={() => document.documentElement.classList.remove("zoom-open")}
      onClick={(e) => { if (e.target === e.currentTarget || (e.target as Element).classList.contains("zoom-stage")) close(); }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      }}
      onTouchStart={(e) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; }}
      onTouchEnd={(e) => {
        const s = touch.current; touch.current = null;
        if (!s || !many) return;
        const p = e.changedTouches[0], dx = p.clientX - s.x, dy = p.clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="zoom-stage">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.src} src={img.src} width={img.width} height={img.height} alt={many ? `${alt} (${at + 1}/${images.length})` : alt} decoding="async" />
        )}
      </div>
      <button type="button" className="zoom-btn zoom-close" onClick={close} aria-label={t.close} autoFocus>×</button>
      {many && (
        <>
          <button type="button" className="zoom-btn zoom-prev" onClick={() => go(-1)} aria-label={t.prev}>‹</button>
          <button type="button" className="zoom-btn zoom-next" onClick={() => go(1)} aria-label={t.next}>›</button>
          <p className="zoom-count" aria-live="polite">{at + 1} / {images.length}</p>
        </>
      )}
    </dialog>
  );
}
