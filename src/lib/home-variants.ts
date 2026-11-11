/**
 * Variantele gata de ales pentru fiecare loc al primei pagini (fișiere în public/home/variante, toate Unsplash License;
 * sursele în public/home/CREDITS.md). Poza inițială a locului (public/home/<file>.jpg) nu e aici: e mereu prima.
 * `start: true` la banner = intră în rotație cât timp adminul n-a ales altceva.
 */
export type HomeVariant = { file: string; credit: string; start?: boolean };

export const HOME_VARIANTS: Record<string, HomeVariant[]> = {
  banner: [
    { file: "variante/banner-1", credit: "Jennifer Kalenberg", start: true },
    { file: "variante/banner-2", credit: "Cameorn Steele", start: true },
    { file: "variante/banner-3", credit: "Thay Jesus", start: true },
    { file: "variante/banner-4", credit: "Vitaly Gariev" },
    { file: "variante/banner-5", credit: "Rajiv Perera" },
    { file: "variante/banner-6", credit: "Marian Strinoiu", start: true },
    { file: "variante/s1-banner-2", credit: "Marian Strinoiu", start: true },
    { file: "variante/s1-banner-3", credit: "Kat von Wood" },
    { file: "variante/s1-banner-6", credit: "Daria Trofimova" },
    { file: "variante/s1-banner-4", credit: "Tetiana Shadrina" },
    { file: "variante/vechi-banner", credit: "Stefan Vibes" },
  ],
  gen1: [
    { file: "variante/bunici-1", credit: "Adrian Botica" },
    { file: "variante/bunici-2", credit: "Raymond Petrik" },
    { file: "variante/bunici-3", credit: "malwina nogaj" },
    { file: "variante/bunici-4", credit: "Mosoianu Bogdan" },
    { file: "variante/bunici-5", credit: "PerOla Hammar" },
    { file: "variante/s1-bunici-5", credit: "Diego Marín" },
    { file: "variante/s1-bunici-2", credit: "Marian Strinoiu" },
    { file: "variante/s1-bunici-3", credit: "Valentin Balan" },
    { file: "variante/vechi-bunici", credit: "Flaviu Costin" },
  ],
  gen2: [
    { file: "variante/familie-1", credit: "Jessica Rockowitz" },
    { file: "variante/familie-2", credit: "Seljan Salim" },
    { file: "variante/familie-3", credit: "C.F. Photography" },
    { file: "variante/familie-4", credit: "Jessica Rockowitz" },
    { file: "variante/familie-5", credit: "Nathan Dumlao" },
    { file: "variante/familie-6", credit: "Dominic Chasse" },
    { file: "variante/familie-7", credit: "Olek Buzunov" },
    { file: "variante/s1-parinti-1", credit: "Alexander Zvir" },
    { file: "variante/vechi-familie", credit: "Peter Dlhy" },
  ],
  gen3: [
    { file: "variante/tineri-1", credit: "Olek Buzunov" },
    { file: "variante/tineri-2", credit: "Olek Buzunov" },
    { file: "variante/tineri-3", credit: "Ahmet Yüksek" },
    { file: "variante/s1-tineri-2", credit: "Olek Buzunov" },
    { file: "variante/vechi-tineri", credit: "Logan Weaver" },
  ],
  gen4: [
    { file: "variante/copii-1", credit: "Vitolda Klein" },
    { file: "variante/copii-2", credit: "Olek Buzunov" },
    { file: "variante/copii-3", credit: "Daria Trofimova" },
    { file: "variante/copii-4", credit: "Portraits of Modern Dairy" },
    { file: "variante/s1-copii-1", credit: "Olek Buzunov" },
  ],
  memories: [
    { file: "variante/bunic-nepot-1", credit: "OPPO Find X5 Pro" },
    { file: "variante/bunic-nepot-2", credit: "Ekaterina Shakharova" },
    { file: "variante/bunic-nepot-3", credit: "Christian Bowen" },
    { file: "variante/bunic-nepot-4", credit: "Isaac Quesada" },
    { file: "variante/bunic-nepot-5", credit: "Malin Björk" },
    { file: "variante/bunic-nepot-6", credit: "Tim Mossholder" },
  ],
  map: [
    { file: "variante/sat-1", credit: "Biro Zoltan" },
    { file: "variante/sat-2", credit: "Florin Gorgan" },
    { file: "variante/sat-3", credit: "Sinziana Mihalache" },
    { file: "variante/sat-4", credit: "Cristina G." },
  ],
  book: [
    { file: "variante/album-1", credit: "Roman Kraft" },
    { file: "variante/album-2", credit: "Chris Curry" },
    { file: "variante/album-3", credit: "Cheryl Winn-Boujnida" },
  ],
  sunset: [
    { file: "variante/apus-1", credit: "Tá Focando" },
    { file: "variante/apus-2", credit: "Shelby Bauman" },
  ],
  table: [
    { file: "variante/masa-1", credit: "Marissa Price" },
    { file: "variante/masa-2", credit: "Jelly Marketing" },
  ],
  hands: [
    { file: "variante/maini-1", credit: "Loume Visser" },
    { file: "variante/maini-2", credit: "Joshua Hoehne" },
  ],
};
