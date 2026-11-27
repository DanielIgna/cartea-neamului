/**
 * Ciornele de diaspora aprobate de Daniel. O ciornă apare pe site (pagină, sitemap, legături, hreflang) doar după ce cheia ei
 * e aici: „tara:<slug>”, „regiune:<țară>/<slug>” sau „tema:<slug>”. Până atunci se citește doar în Admin → SEO → Ciorne.
 */
export const APROBATE = new Set<string>([
  // Daniel, 19.11.2026: „aprob și restul ciornelor”.
  "tara:ucraina",
  "regiune:ua/cernauti",
  "regiune:ua/sudul-basarabiei",
  "regiune:it/lazio",
  "regiune:it/piemonte",
  "regiune:it/lombardia",
  "regiune:it/veneto",
  "regiune:es/castilla-la-mancha",
  "regiune:es/andalucia",
  "regiune:es/comunitat-valenciana",
  "regiune:es/cataluna",
  "regiune:de/bayern",
  "regiune:de/baden-wuerttemberg",
  "regiune:de/nordrhein-westfalen",
  "regiune:at/oberoesterreich",
  "tema:istoria-romanilor-din-italia",
  "tema:istoria-romanilor-din-spania",
  "tema:istoria-romanilor-din-germania",
  "tema:istoria-romanilor-din-austria",
  "tema:istoria-romanilor-din-marea-britanie",
  "tema:istoria-romanilor-din-franta",
  "tema:istoria-romanilor-din-olanda",
  "tema:istoria-romanilor-din-belgia",
  "tema:istoria-romanilor-din-irlanda",
  // Daniel, 19.11.2026: „aprob” (PR #209: orașele în limba țării și Norvegia).
  "tara:norvegia",
  "limba:gb/londra/en", "limba:gb/manchester/en", "limba:gb/birmingham/en", "limba:gb/edinburgh/en",
  "limba:es/madrid/es", "limba:es/castellon/es", "limba:es/valencia/es", "limba:es/barcelona/es",
  // Daniel, 19.11.2026: „aprob” (lotul 2, PR #211).
  "limba:it/roma/it", "limba:it/milano/it", "limba:it/torino/it",
  "limba:de/munchen/de", "limba:de/berlin/de", "limba:at/viena/de", "limba:fr/paris/fr",
  // Daniel, 19.11.2026 23:08: aprobare permanentă („ruleaza fara mine”) – lotul 3.
  "limba:us/miami/en", "limba:it/bologna/it", "limba:de/nurnberg/de", "limba:de/stuttgart/de", "limba:fr/lyon/fr",
  // Aceeași aprobare permanentă: Republica Moldova, Serbia, Bulgaria, Turcia, Luxemburg.
  "tara:republica-moldova", "tara:serbia", "tara:bulgaria", "tara:turcia", "tara:luxemburg",
  // Minoritățile din România (aceeași aprobare): aromânii, turcii și tătarii, romii, lipovenii, ucrainenii, sârbii, slovacii, bulgarii.
  "tema:aromani", "tema:turci-si-tatari-din-dobrogea", "tema:romi", "tema:rusi-lipoveni", "tema:ucraineni-din-romania",
  "tema:sarbi-din-romania", "tema:slovaci-din-romania", "tema:bulgari-din-romania",
  // Daniel, 27.11.2026: „indexare și pe Australia și Noua Zeelandă” (aprobare permanentă pentru paginile SEO).
  "tara:australia", "tara:noua-zeelanda",
  // Daniel, 27.11.2026: „da” la „Români în Asia” și „da adauga le” la Brazilia, Argentina, Emirate și Qatar.
  "tema:romani-in-asia", "tema:romani-in-brazilia", "tema:romani-in-argentina", "tema:romani-in-emirate-si-qatar",
]);
