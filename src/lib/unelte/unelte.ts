/**
 * Uneltele gratuite (/unelte, planul SEO, 18.11.2026): merg fără cont, totul se calculează în browser și nimic nu se trimite
 * la server. După rezultat apare îndemnul de a salva arborele (7 zile gratuite, fără card). Fișier fără importuri de pe server.
 */
export type Tool = { slug: string; name: string; title: string; description: string; h1: string; lead: string; faq: { q: string; a: string }[] };

export const TOOLS: Tool[] = [
  {
    slug: "calculator-grad-de-rudenie", name: "Calculatorul de rudenie",
    title: "Calculator grad de rudenie: cum se numește ruda ta",
    description: "Alegi drumul de la tine la rudă (tata, fratele lui, fiul lui) și afli cum se numește ruda și ce grad are, după Codul civil. Gratuit, fără cont.",
    h1: "Calculatorul gradului de rudenie",
    lead: "Alege, pas cu pas, drumul de la tine la ruda la care te gândești. Afli cum se numește și ce grad de rudenie are, numărat ca în Codul civil.",
    faq: [
      { q: "Cum se numără gradul de rudenie?", a: "În linie dreaptă, după numărul generațiilor (părinte–copil: gradul I). În linie colaterală, urci până la strămoșul comun și cobori la cealaltă rudă, numărând fiecare treaptă: verii primari sunt rude de gradul IV." },
      { q: "Calculatorul ține cont de rudele prin căsătorie?", a: "Da. Pune soțul sau soția ca prim pas (rudele soțului: socri, cumnați) sau ca ultim pas (soțul unei rude: ginere, noră, cumnat). Cuscrii apar ca „fiul → soția → mama”." },
      { q: "Se trimite ceva la server?", a: "Nu. Calculul se face în browser, iar drumul ales nu se salvează nicăieri." },
    ],
  },
  {
    slug: "arbore-printabil", name: "Arborele de tipărit",
    title: "Arbore genealogic de completat, gratuit, de tipărit",
    description: "Un arbore genealogic gol, de tipărit acasă sau de salvat ca PDF, pe 3, 4 sau 5 generații. Îl completezi de mână, cu bunicii. Gratuit, fără cont.",
    h1: "Arbore genealogic de completat, de tipărit",
    lead: "Alege câte generații vrei, scrie un titlu și tipărește foaia sau salveaz-o ca PDF din fereastra de tipărire. Foaia se face în browser, fără să trimiți ceva.",
    faq: [
      { q: "Cum salvez arborele ca PDF?", a: "Apasă „Tipărește sau salvează PDF” și alege „Salvează ca PDF” în locul imprimantei. Funcționează pe calculator și pe telefon." },
      { q: "Câte căsuțe are?", a: "Pe 3 generații: 7 căsuțe (tu, părinții, bunicii). Pe 4: 15, cu străbunicii. Pe 5: 31, cu stră-străbunicii; pe acesta e bine să-l tipărești pe A3 sau pe orizontală." },
      { q: "Pot folosi foaia la școală?", a: "Da, e gratuită. Pentru proiectele de la școală vezi și paginile pentru școli, cu fișe pe clase." },
    ],
  },
  {
    slug: "intrebari-pentru-bunici-pdf", name: "Întrebări pentru bunici, de tipărit",
    title: "Întrebări pentru bunici: listă de tipărit sau PDF gratuit",
    description: "40 de întrebări pentru bunici, pe teme (familia, copilăria, satul, nunta, vremurile grele), pe o foaie de tipărit sau de salvat PDF. Gratuit.",
    h1: "Întrebări pentru bunici, de tipărit",
    lead: "Tipărește lista sau salveaz-o ca PDF și ia-o cu tine la următoarea vizită. Lasă loc pentru răspunsuri sau înregistrează-le cu telefonul.",
    faq: [
      { q: "Câte întrebări să pun într-o vizită?", a: "Câteva, nu toate. Alege o temă, pornește de la o fotografie și lasă povestea să curgă: întrebările sunt doar un sprijin." },
      { q: "Pot înregistra răspunsurile?", a: "Da, dacă bunicii sunt de acord. Glasul lor e o amintire prețioasă pentru nepoți." },
      { q: "Unde găsesc mai multe sfaturi?", a: "În ghidul despre întrebările pentru bunici și în cel despre cum îi intervievezi." },
    ],
  },
  {
    slug: "calculator-generatii", name: "Calculatorul de generații",
    title: "Calculator de generații: în ce an s-au născut strămoșii",
    description: "Scrie anul nașterii tale și află în ce interval s-au născut probabil părinții, bunicii, străbunicii și strămoșii mai vechi. O estimare, gratuit.",
    h1: "În ce an s-a născut probabil străbunicul?",
    lead: "Scrie anul în care te-ai născut (sau al celui mai vechi strămoș pe care îl știi sigur) și vezi în ce ani s-au născut probabil generațiile dinainte. E o estimare, utilă ca să știi ce registre să cauți.",
    faq: [
      { q: "Câți ani are o generație?", a: "În medie, în jur de 25–30 de ani, dar între un părinte și un copil pot fi de la vreo 18 până la peste 40 de ani. De aceea calculatorul dă un interval, nu un an." },
      { q: "De ce intervalul e tot mai larg?", a: "Fiecare generație adaugă nesiguranță. La a patra sau a cincea generație, intervalul poate avea câteva decenii: caută în registre câțiva ani înainte și după." },
      { q: "La ce mă ajută?", a: "Să știi în ce registre să cauți: de pildă, dacă un strămoș s-a născut probabil înainte de 1895, în Transilvania îl cauți în registrele parohiale, nu în cele de stare civilă." },
    ],
  },
];

export const toolPath = (t: Pick<Tool, "slug">) => `/unelte/${t.slug}`;
export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug) ?? null;
export const TOOLS_TITLE = "Unelte gratuite de genealogie: rudenie, arbore, generații";
export const TOOLS_DESCRIPTION = "Unelte gratuite, fără cont: calculatorul de rudenie, arborele de completat, întrebările pentru bunici și calculatorul de generații.";

/** Estimarea anilor de naștere, generație cu generație (între MIN și MAX ani între părinte și copil, în medie AVG). */
export const GEN_MIN = 18, GEN_AVG = 28, GEN_MAX = 40;
export const GEN_NAMES = ["părinții", "bunicii", "străbunicii", "stră-străbunicii", "a 5-a generație în urmă", "a 6-a generație în urmă", "a 7-a generație în urmă", "a 8-a generație în urmă"];
export function generationYears(year: number, generations = 6): { name: string; from: number; likely: number; to: number }[] {
  return Array.from({ length: Math.min(generations, GEN_NAMES.length) }, (_, i) => {
    const g = i + 1;
    // Intervalul e larg la capete, dar cel mai probabil e în jurul mediei; arătăm media ± o marjă care crește cu generațiile.
    const margin = Math.round(Math.min(g * (GEN_MAX - GEN_MIN) / 2, 6 + g * 4));
    const likely = year - g * GEN_AVG;
    return { name: GEN_NAMES[i], from: likely - margin, likely, to: likely + margin };
  });
}
