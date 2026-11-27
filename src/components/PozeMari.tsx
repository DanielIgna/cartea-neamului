"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";

type Img = { src: string; width: number; height: number };
type T = { open: string; close: string; prev: string; next: string };

/** Textele pentru cititoarele de ecran (butoanele au doar semne: ×, ‹, ›). */
export const ZOOM_TEXT: Record<Locale, T> = {
  ro: { open: "Mărește poza", close: "Închide", prev: "Poza de dinainte", next: "Poza următoare" },
  "en-GB": { open: "Enlarge image", close: "Close", prev: "Previous image", next: "Next image" },
  "en-US": { open: "Enlarge image", close: "Close", prev: "Previous image", next: "Next image" },
  fr: { open: "Agrandir l’image", close: "Fermer", prev: "Image précédente", next: "Image suivante" },
  es: { open: "Ampliar la imagen", close: "Cerrar", prev: "Imagen anterior", next: "Imagen siguiente" },
  nl: { open: "Afbeelding vergroten", close: "Sluiten", prev: "Vorige afbeelding", next: "Volgende afbeelding" },
  de: { open: "Bild vergrößern", close: "Schließen", prev: "Vorheriges Bild", next: "Nächstes Bild" },
  it: { open: "Ingrandisci l’immagine", close: "Chiudi", prev: "Immagine precedente", next: "Immagine successiva" },
  hu: { open: "Kép nagyítása", close: "Bezárás", prev: "Előző kép", next: "Következő kép" },
  he: { open: "הגדלת התמונה", close: "סגירה", prev: "התמונה הקודמת", next: "התמונה הבאה" },
  pt: { open: "Ampliar a imagem", close: "Fechar", prev: "Imagem anterior", next: "Imagem seguinte" },
  el: { open: "Μεγέθυνση εικόνας", close: "Κλείσιμο", prev: "Προηγούμενη εικόνα", next: "Επόμενη εικόνα" },
  sv: { open: "Förstora bilden", close: "Stäng", prev: "Föregående bild", next: "Nästa bild" },
  da: { open: "Forstør billedet", close: "Luk", prev: "Forrige billede", next: "Næste billede" },
  nb: { open: "Forstørr bildet", close: "Lukk", prev: "Forrige bilde", next: "Neste bilde" },
  uk: { open: "Збільшити зображення", close: "Закрити", prev: "Попереднє зображення", next: "Наступне зображення" },
  sr: { open: "Увећај слику", close: "Затвори", prev: "Претходна слика", next: "Следећа слика" },
  bg: { open: "Увеличи снимката", close: "Затвори", prev: "Предишна снимка", next: "Следваща снимка" },
  tr: { open: "Resmi büyüt", close: "Kapat", prev: "Önceki resim", next: "Sonraki resim" },
};

/**
 * Pozele mari (Daniel, 27.11.2026): un clic pe o poză de prezentare (orice element cu data-zoom="<n>" din pagină) o deschide pe tot
 * ecranul. Între poze se trece cu săgețile de pe ecran, cu tastele ← → sau trăgând cu degetul; se închide cu ×, cu Esc sau cu un
 * clic/atingere în afara pozei. Folosește <dialog>, deci focusul rămâne înăuntru și Esc merge singur.
 */
export default function PozeMari({ images, alt, locale }: { images: Img[]; alt: string; locale: Locale }) {
  const t = ZOOM_TEXT[locale] ?? ZOOM_TEXT.ro;
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
