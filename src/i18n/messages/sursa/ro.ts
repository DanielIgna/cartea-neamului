/**
 * Alegerea pentru cookie-urile de analiză, pe pagina Politicii de confidențialitate (src/components/CookieChoice.tsx), ca omul
 * să o poată schimba oricând (Daniel, 16.11.2026; src/lib/sursa-shared.ts).
 */
import type { Widen } from "../types";

export const roSursa = {
  CookieChoice: {
    title: "Alegerea ta pentru cookie-urile de analiză",
    now: "Acum:",
    analytics: "Ai acceptat cookie-urile de analiză.",
    necessary: "Folosim doar cookie-urile necesare.",
    none: "Încă n-ai ales.",
    accept: "Accept cookie-urile de analiză",
    refuse: "Doar cele necesare",
    saved: "Am salvat alegerea.",
  },
} as const;
export type SursaCatalog = Widen<typeof roSursa>;
