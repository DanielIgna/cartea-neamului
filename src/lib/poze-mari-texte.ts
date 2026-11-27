import type { Locale } from "@/i18n/locales";

/** Textele pozelor mari (PozeMari.tsx), separat de componenta din browser, ca paginile de pe server să le poată citi. */
export type ZoomText = { open: string; close: string; prev: string; next: string };

/** Textele pentru cititoarele de ecran (butoanele au doar semne: ×, ‹, ›). */
export const ZOOM_TEXT: Record<Locale, ZoomText> = {
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

export const zoomText = (locale: Locale): ZoomText => ZOOM_TEXT[locale] ?? ZOOM_TEXT.ro;
