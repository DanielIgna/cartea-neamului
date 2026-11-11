/**
 * Variantele gata de ales pentru fiecare loc al primei pagini (fișiere în public/home/variante, toate Unsplash License;
 * sursele în public/home/CREDITS.md). Poza inițială a locului (public/home/<file>.jpg) nu e aici: e mereu prima.
 * `start: true` la banner = intră în rotație cât timp adminul n-a ales altceva.
 */
export type HomeVariant = { file: string; credit: string; start?: boolean };

export const HOME_VARIANTS: Record<string, HomeVariant[]> = {
  banner: [
    { file: "variante/s1-banner-2", credit: "Marian Strinoiu", start: true },
    { file: "variante/s1-banner-3", credit: "Kat von Wood", start: true },
    { file: "variante/s1-banner-6", credit: "Daria Trofimova" },
    { file: "variante/s1-banner-4", credit: "Tetiana Shadrina" },
    { file: "variante/vechi-banner", credit: "Stefan Vibes" },
  ],
  gen1: [
    { file: "variante/s1-bunici-5", credit: "Diego Marín" },
    { file: "variante/s1-bunici-2", credit: "Marian Strinoiu" },
    { file: "variante/s1-bunici-3", credit: "Valentin Balan" },
    { file: "variante/vechi-bunici", credit: "Flaviu Costin" },
  ],
  gen2: [
    { file: "variante/s1-parinti-1", credit: "Alexander Zvir" },
    { file: "variante/vechi-familie", credit: "Peter Dlhy" },
  ],
  gen3: [
    { file: "variante/s1-tineri-2", credit: "Olek Buzunov" },
    { file: "variante/vechi-tineri", credit: "Logan Weaver" },
  ],
  gen4: [
    { file: "variante/s1-copii-1", credit: "Olek Buzunov" },
  ],
};
