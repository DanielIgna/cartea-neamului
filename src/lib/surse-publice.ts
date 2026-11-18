/**
 * „Surse publice” (Daniel, 18.11.2026): unde își pot căuta oamenii strămoșii, în arhive publice și gratuite.
 *
 * Ce face: îi trimite pe oameni la sursă, cu un link care se deschide într-o filă nouă (rel="noopener noreferrer"), și le
 * spune ce să caute. Ce NU face: nu preia, nu copiază și nu arată datele altor site-uri (fără scraping, iframe sau API-uri
 * neoficiale) și nu pune în adresă niciun nume sau an din arborele omului. Instituțiile sunt citate ca surse, nu ca parteneri.
 *
 * Lista de aici e cea implicită; din Admin → Surse publice fiecare sursă se poate opri, pune în altă ordine sau corecta
 * fără publicare (app_setting `surse_publice`, vezi surse-publice-db.ts). Fișierul nu importă nimic de pe server, ca să
 * poată fi folosit și în cardul din arbore.
 */

/** Grupurile de pe pagina /surse-publice, în ordinea lor. */
export const GRUPURI = ["tara", "ardeal", "basarabia", "razboaie", "emigrare", "platit"] as const;
export type Grup = (typeof GRUPURI)[number];
export const GRUP_TITLU: Record<Grup, string> = {
  tara: "Toată țara",
  ardeal: "Transilvania, Banat, Crișana, Maramureș și Bucovina",
  basarabia: "Basarabia",
  razboaie: "Războaie și morminte",
  emigrare: "Emigrare și comunități",
  platit: "Opțional, cu plată",
};

/** Ținutul pentru care e bună o sursă. */
export type Regiune = "transilvania" | "romania" | "basarabia" | "international";
export const REGIUNE_TITLU: Record<Regiune, string> = {
  transilvania: "Transilvania, Banat, Crișana, Maramureș, Bucovina", romania: "toată România", basarabia: "Basarabia", international: "internațional",
};

export type Tip = "stare-civila" | "recensaminte" | "morminte" | "arbori" | "harti" | "ziare" | "militare" | "emigrare" | "inventare";
export const TIP_TITLU: Record<Tip, string> = {
  "stare-civila": "acte de stare civilă și registre parohiale", recensaminte: "recensăminte", morminte: "morminte", arbori: "arbori publici",
  harti: "hărți și cadastru", ziare: "ziare și cărți vechi", militare: "liste militare", emigrare: "emigrare", inventare: "inventare de arhivă",
};

export type Sursa = {
  id: string;
  nume: string;
  /** Ce găsești acolo, pe scurt, în română. */
  descriere: string;
  url: string;
  grup: Grup;
  regiuni: Regiune[];
  /** Perioada acoperită, cum o spunem oamenilor. */
  perioada: string;
  tip: Tip[];
  gratuit: boolean;
  /** Trebuie cont (de obicei gratuit) ca să vezi detaliile. */
  cont: boolean;
  /** Un sfat de căutare, arătat pe pagină și în cardul din arbore. */
  sfat?: string;
  /** O notă scurtă („portal lent”). */
  nota?: string;
  /** Mențiunea obligatorie a sursei, arătată oriunde apare. */
  citare?: string;
  /** Ghidul nostru care explică mai pe larg (/ghid/…), ca să nu scriem același lucru de două ori. */
  ghid?: string;
  activ: boolean;
};

/**
 * Sursele, cu linkurile exact cum le-a dat Daniel (18.11.2026). Nu se pun: Digibuc (nu funcționează), www.hpdt.ro,
 * hpdt.ro:4080, www.dvhh.org, matricula-online.eu (testul tests/surse-publice.test.ts verifică).
 */
export const SURSE: readonly Sursa[] = [
  // Toată țara
  { id: "descopera", nume: "Descoperă – Arhivele Naționale", url: "https://descopera.arhivelenationale.ro/", grup: "tara", regiuni: ["romania"],
    descriere: "Registre de stare civilă scanate, mai vechi de 100 de ani, din toată țara: nașteri, căsătorii și decese, pagină cu pagină.",
    perioada: "registre de peste 100 de ani", tip: ["stare-civila"], gratuit: true, cont: false,
    sfat: "Alege județul și localitatea de azi, apoi anul. Registrele sunt scanate, nu transcrise: răsfoiești paginile ca într-o arhivă.",
    nota: "Portalul e uneori lent; dacă nu se încarcă, încearcă puțin mai târziu.", ghid: "registrele-de-stare-civila", activ: true },
  { id: "anr", nume: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro/", grup: "tara", regiuni: ["romania"],
    descriere: "Inventarele fondurilor de arhivă și cererile de copii după acte (de pildă un certificat de naștere vechi).",
    perioada: "din Evul Mediu până azi", tip: ["inventare", "stare-civila"], gratuit: true, cont: false,
    sfat: "Caută întâi în inventare la ce filială județeană sunt registrele satului; cererea se face la acea filială.",
    nota: "Căutarea e gratuită; copiile cerute pot avea o taxă.", ghid: "cum-ceri-copii-de-la-arhive", activ: true },
  { id: "genealogica", nume: "Genealogica", url: "https://genealogica.ro/", grup: "tara", regiuni: ["romania"],
    descriere: "Un index cu peste 6,6 milioane de înregistrări din registre românești, căutabile după nume.",
    perioada: "în mare parte secolele XIX–XX", tip: ["stare-civila", "recensaminte"], gratuit: true, cont: true,
    sfat: "Căutarea e gratuită; pentru detalii îți faci un cont, care are 50 de credite gratuite pe lună.", activ: true },
  { id: "familysearch", nume: "FamilySearch", url: "https://www.familysearch.org/", grup: "tara", regiuni: ["romania", "basarabia", "international"],
    descriere: "Registre parohiale și de stare civilă din România, inclusiv din Basarabia, fotografiate și puse online, plus arbori publici.",
    perioada: "în mare parte 1800–1950", tip: ["stare-civila", "recensaminte", "arbori"], gratuit: true, cont: true,
    sfat: "Îți faci un cont gratuit. Caută după nume și localitate, dar uită-te și la „Catalog” după localitate: multe registre se răsfoiesc, nu se caută după nume.",
    ghid: "familysearch-pentru-romania", activ: true },
  { id: "bibnat", nume: "Biblioteca Națională – Biblioteca Digitală", url: "https://bibnat.ro/biblioteca-digitala/", grup: "tara", regiuni: ["romania"],
    descriere: "Cărți, ziare și documente vechi scanate, unde poți găsi numele satului sau al familiei.",
    perioada: "secolele XVI–XX", tip: ["ziare"], gratuit: true, cont: false, ghid: "biblioteci-si-ziare-vechi", activ: true },
  // Transilvania, Banat și Bucovina
  { id: "hpdt", nume: "Baza de date a populației Transilvaniei (HPDT), Centrul de Studiere a Populației, UBB Cluj", url: "https://hpdt.ro/", grup: "ardeal", regiuni: ["transilvania"],
    descriere: "Acte de botez, căsătorie și deces din registrele parohiale din Transilvania, transcrise și căutabile după nume.",
    perioada: "1850–1914", tip: ["stare-civila"], gratuit: true, cont: false,
    sfat: "Caută după nume, prenume, localitatea de azi și an. Prenumele apar în multe variante: pentru Ioan caută „Io” sau „Iu” (Ion, Ioan, Iuon, Johannes).",
    citare: "Sursă: Baza de date a populației Transilvaniei / Historical Population Database of Transylvania, Centrul de Studiere a Populației, Universitatea Babeș-Bolyai Cluj-Napoca, https://hpdt.ro/",
    ghid: "nume-schimbate-si-variante", activ: true },
  { id: "hungaricana", nume: "Hungaricana", url: "https://www.hungaricana.hu/en/", grup: "ardeal", regiuni: ["transilvania"],
    descriere: "Cadastru, hărți vechi și urbarii pentru Transilvania și Banat: cine avea pământ, unde și cât.",
    perioada: "secolele XVIII–XX", tip: ["harti", "inventare"], gratuit: true, cont: false,
    sfat: "Numele satelor apar adesea în maghiară sau germană; caută și după numele vechi al localității.", ghid: "cartea-funciara-si-cadastrul-vechi", activ: true },
  { id: "bcucluj", nume: "BCU Cluj – Biblioteca Digitală", url: "https://dspace.bcucluj.ro/", grup: "ardeal", regiuni: ["transilvania"],
    descriere: "Ziare, calendare și cărți vechi din Transilvania, scanate: anunțuri, liste de nume, știri din sate.",
    perioada: "secolele XIX–XX", tip: ["ziare"], gratuit: true, cont: false, ghid: "biblioteci-si-ziare-vechi", activ: true },
  { id: "adatbazisok", nume: "AdatbázisokOnline – Arhivele Naționale ale Ungariei", url: "https://adatbazisokonline.mnl.gov.hu/", grup: "ardeal", regiuni: ["transilvania"],
    descriere: "Bazele de date ale Arhivelor Naționale ale Ungariei: conscripții, liste de nume și registre din fostul Regat al Ungariei, inclusiv Transilvania, Banat, Crișana, Maramureș și Bucovina.",
    perioada: "secolele XVIII–XX", tip: ["recensaminte", "inventare"], gratuit: true, cont: false,
    sfat: "Localitățile sunt scrise în maghiară; caută numele vechi al satului (Huedin = Bánffyhunyad).", ghid: "conscriptiile-din-transilvania", activ: true },
  // Basarabia
  { id: "ana-md", nume: "Arhiva Națională a Moldovei", url: "https://arhiva.gov.md/", grup: "basarabia", regiuni: ["basarabia"],
    descriere: "Arhiva statului din Republica Moldova: registre din Basarabia, dosarele deportărilor și ale repatriaților, cereri de copii.",
    perioada: "secolele XIX–XX", tip: ["stare-civila", "inventare"], gratuit: true, cont: false, activ: true },
  { id: "ana-md-doc", nume: "Arhiva Națională a Moldovei – documente online", url: "https://doc.arhiva.gov.md/", grup: "basarabia", regiuni: ["basarabia"],
    descriere: "Documente scanate din Basarabia: deportări, repatriați și alte fonduri puse online.",
    perioada: "secolele XIX–XX", tip: ["inventare"], gratuit: true, cont: false, activ: true },
  // Războaie și morminte
  { id: "verlustlisten", nume: "Verlustlisten – pierderile armatei austro-ungare (1914–1919)", url: "https://des.genealogy.net/ou1wk/search", grup: "razboaie", regiuni: ["transilvania"],
    descriere: "Listele oficiale cu soldații morți, răniți, prizonieri sau dispăruți din armata austro-ungară, cu satul de origine.",
    perioada: "1914–1919", tip: ["militare"], gratuit: true, cont: false,
    sfat: "Numele satului e scris de obicei în maghiară sau germană; numele de familie poate fi scris după ureche.", ghid: "registrele-militare", activ: true },
  { id: "once", nume: "Lista morților de război (ONCE)", url: "https://data.gov.ro/ro/dataset/lista-mortilor-de-razboi", grup: "razboaie", regiuni: ["romania"],
    descriere: "Lista publică a Oficiului Național pentru Cultul Eroilor cu militarii morți în războaie, pe date.gov.ro.",
    perioada: "războaiele secolului XX", tip: ["militare", "morminte"], gratuit: true, cont: false, ghid: "listele-eroilor-si-monumentele", activ: true },
  { id: "findagrave", nume: "Find a Grave – România", url: "https://www.findagrave.com/cemetery/search?locationId=country_191", grup: "razboaie", regiuni: ["romania", "international"],
    descriere: "Cimitire și morminte fotografiate de voluntari, cu numele și anii de pe cruce.",
    perioada: "mai ales secolele XIX–XX", tip: ["morminte"], gratuit: true, cont: false, ghid: "cum-folosesti-pietrele-funerare", activ: true },
  { id: "billiongraves", nume: "BillionGraves", url: "https://billiongraves.com/", grup: "razboaie", regiuni: ["romania", "international"],
    descriere: "Fotografii de morminte făcute de voluntari, cu locul pe hartă și textul de pe cruce transcris.",
    perioada: "mai ales secolele XIX–XX", tip: ["morminte"], gratuit: true, cont: false, ghid: "cum-folosesti-pietrele-funerare", activ: true },
  { id: "cimitire", nume: "Cimitire.ro", url: "https://cimitire.ro/", grup: "razboaie", regiuni: ["romania"],
    descriere: "Cimitire din România, cu morminte și fotografii puse de oameni.", perioada: "mai ales secolul XX", tip: ["morminte"], gratuit: true, cont: false,
    ghid: "cum-folosesti-pietrele-funerare", activ: true },
  // Emigrare și comunități
  { id: "ellis", nume: "Ellis Island – emigranții sosiți în SUA", url: "https://www.statueofliberty.org/discover/heritagesearch/", grup: "emigrare", regiuni: ["international"],
    descriere: "Listele vapoarelor cu emigranții ajunși la New York, mulți din Transilvania și Banat, cu satul de plecare.",
    perioada: "1820–1957", tip: ["emigrare"], gratuit: true, cont: false,
    sfat: "Numele era scris de funcționarii americani după ureche: încearcă mai multe forme.", ghid: "emigrarea-in-america", activ: true },
  { id: "jewishgen", nume: "JewishGen – România", url: "https://www.jewishgen.org/databases/Romania/", grup: "emigrare", regiuni: ["romania", "international"],
    descriere: "Baze de date pentru familiile evreiești din România: registre, recensăminte, liste de nume.",
    perioada: "secolele XIX–XX", tip: ["stare-civila", "recensaminte"], gratuit: true, cont: true, ghid: "registrele-evreiesti", activ: true },
  { id: "dvhh", nume: "DVHH Banat – familiile de șvabi", url: "https://banat.dvhh.org/", grup: "emigrare", regiuni: ["transilvania"],
    descriere: "Informații despre satele și familiile de șvabi din Banat: istoria satelor, liste de nume, emigrare.",
    perioada: "secolele XVIII–XX", tip: ["arbori", "emigrare"], gratuit: true, cont: false, activ: true },
  { id: "vgss", nume: "VGSS – familiile de sași din Transilvania", url: "https://genealogie.vgss.de/", grup: "emigrare", regiuni: ["transilvania"],
    descriere: "Baza de date genealogică a sașilor transilvăneni, adunată de asociația lor de genealogie.",
    perioada: "secolele XVII–XX", tip: ["arbori"], gratuit: true, cont: false, activ: true },
  // Opțional, cu plată
  { id: "arcanum", nume: "Arcanum", url: "https://adt.arcanum.com/", grup: "platit", regiuni: ["romania", "transilvania"],
    descriere: "Ziare vechi și Monitorul Oficial 1875–1947, căutabile după cuvânt: numiri, decese, procese, anunțuri.",
    perioada: "1875–1947 (Monitorul Oficial)", tip: ["ziare"], gratuit: false, cont: true, activ: true },
  { id: "myheritage", nume: "MyHeritage", url: "https://www.myheritage.ro/", grup: "platit", regiuni: ["international"],
    descriere: "Arbori publici și înregistrări din multe țări; o parte se vede doar cu abonament.", perioada: "diverse", tip: ["arbori"], gratuit: false, cont: true, activ: true },
];

/* ---------- Ce se poate schimba din Admin ---------- */

/** Ce se poate schimba din Admin pentru o sursă (restul rămâne ca în cod). */
export type Schimbare = Partial<Pick<Sursa, "nume" | "descriere" | "url" | "perioada" | "sfat" | "nota" | "activ">> & { ordine?: number };
export type Schimbari = Record<string, Schimbare>;

/** O adresă bună: https, fără date de conectare și fără parametri de urmărire (utm, afiliere). */
export function adresaBuna(url: string): boolean {
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== "https:" || u.username || u.password) return false;
  return ![...u.searchParams.keys()].some((k) => /^utm_|^ref$|^aff|affiliate|^fbclid$|^gclid$/i.test(k));
}

/** Lista finală: cea din cod, cu schimbările din Admin puse peste, în ordinea aleasă. Schimbările stricate sunt ignorate. */
export function aplica(surse: readonly Sursa[], sch: Schimbari = {}): Sursa[] {
  const ord = (s: Sursa, i: number) => (typeof sch[s.id]?.ordine === "number" ? sch[s.id].ordine! : i + 1);
  return surse
    .map((s, i) => {
      const c = sch[s.id] ?? {};
      const txt = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
      return {
        s: {
          ...s,
          nume: txt(c.nume, 160) ?? s.nume, descriere: txt(c.descriere, 600) ?? s.descriere, perioada: txt(c.perioada, 120) ?? s.perioada,
          url: typeof c.url === "string" && adresaBuna(c.url) ? c.url : s.url,
          sfat: c.sfat === "" ? undefined : txt(c.sfat, 600) ?? s.sfat, nota: c.nota === "" ? undefined : txt(c.nota, 300) ?? s.nota,
          activ: typeof c.activ === "boolean" ? c.activ : s.activ,
        },
        o: ord(s, i), i,
      };
    })
    .sort((a, b) => a.o - b.o || a.i - b.i)
    .map((x) => x.s);
}

/* ---------- Cardul „Caută în arhive publice” din arbore ---------- */

/** Județele Transilvaniei, Banatului, Crișanei și Maramureșului (ca la HPDT), plus Suceava pentru Bucovina. */
export const JUDETE_TRANSILVANIA = ["AB", "AR", "BV", "BN", "CJ", "CV", "HD", "HR", "MM", "MS", "SJ", "SM", "SB", "BH", "CS", "TM"] as const;
export const JUDETE_BUCOVINA = ["SV"] as const;
/** Până la ce an arătăm cardul: cei născuți înainte de 1930 (registrele mai vechi de 100 de ani sunt la arhive). */
export const AN_LIMITA = 1930;

/** De unde e omul, cât știm (vezi Origin din vremuri.ts): codul județului, ținutul, codul țării. */
export type Loc = { county?: string | null; area?: string | null; cc?: string | null; region?: string | null };
export type Zona = "transilvania" | "basarabia" | "rest";

export function zonaPentru(loc: Loc | null | undefined): Zona {
  if (!loc) return "rest";
  const c = loc.county?.toUpperCase();
  if (c && ((JUDETE_TRANSILVANIA as readonly string[]).includes(c) || (JUDETE_BUCOVINA as readonly string[]).includes(c))) return "transilvania";
  if (!c && (loc.area === "ardeal" || loc.area === "bucovina")) return "transilvania";
  if (loc.area === "basarabia" || loc.region === "basarabia" || loc.cc === "MD") return "basarabia";
  return "rest";
}

/** Întâi sursele locului, apoi cele bune pentru toți (Daniel, 18.11.2026). */
const ORDINE: Record<Zona, string[]> = {
  transilvania: ["hpdt", "hungaricana", "verlustlisten", "descopera", "genealogica", "familysearch"],
  basarabia: ["ana-md", "ana-md-doc", "familysearch", "descopera", "genealogica"],
  rest: ["familysearch", "descopera", "anr", "genealogica"],
};

/** Sursele recomandate pentru un om, după locul nașterii: doar cele gratuite și pornite, fără dubluri. */
export function recomanda(surse: readonly Sursa[], loc: Loc | null | undefined, max = 5): Sursa[] {
  const byId = new Map(surse.filter((s) => s.activ && s.gratuit).map((s) => [s.id, s]));
  return [...new Set(ORDINE[zonaPentru(loc)])].map((id) => byId.get(id)).filter((s): s is Sursa => !!s).slice(0, max);
}

export type Lipsa = "an" | "loc" | "parinti" | "casatorie" | "deces";
export type OmPentruSugestie = {
  givenName: string; surname: string; birthYear: number | null; birthPlace: string | null; living: boolean; deathText: string | null;
  parents: number; partners: number; placeholder?: boolean;
};

/** Ce îi lipsește omului dintre datele importante. */
export function lipsuri(p: OmPentruSugestie): Lipsa[] {
  const out: Lipsa[] = [];
  if (p.birthYear === null) out.push("an");
  if (!p.birthPlace?.trim()) out.push("loc");
  if (p.parents < 2) out.push("parinti");
  if (p.partners === 0) out.push("casatorie");
  if (!p.living && !p.deathText?.trim()) out.push("deces");
  return out;
}

/**
 * Cardul apare doar când omul e născut înainte de 1930 sau nu are anul nașterii, ȘI îi lipsește ceva important.
 * Nu apare pentru cei în viață (actele lor nu sunt încă la arhive) și nici pentru fișele fără nume („Tată necunoscut”).
 */
export function aratamSugestia(p: OmPentruSugestie): boolean {
  if (p.living || p.placeholder) return false;
  if (!p.givenName.trim() && !p.surname.trim()) return false;
  if (p.birthYear !== null && p.birthYear >= AN_LIMITA) return false;
  return lipsuri(p).length > 0;
}

/** Textul pentru „Copiază datele”: numele, prenumele, localitatea și anul, cât se știu. Rămâne la om, nu pleacă nicăieri. */
export function dateDeCautare(p: { givenName: string; surname: string; birthSurname?: string | null; birthPlace: string | null; birthYear: number | null }, w: { surname: string; given: string; place: string; year: string }) {
  return [
    `${w.surname}: ${[p.surname, p.birthSurname && p.birthSurname !== p.surname ? p.birthSurname : ""].filter(Boolean).join(" / ") || "?"}`,
    `${w.given}: ${p.givenName || "?"}`,
    p.birthPlace?.trim() ? `${w.place}: ${p.birthPlace.trim()}` : null,
    p.birthYear !== null ? `${w.year}: ${p.birthYear}` : null,
  ].filter(Boolean).join("\n");
}

/** „Sursa informației” scrisă de om: textul (cel mult 500 de caractere) și un link https (altfel nimic). */
export function sursaInformatiei(text: unknown, link: unknown): { infoSource: string | null; infoSourceUrl: string | null } {
  const t = typeof text === "string" ? text.trim().slice(0, 500) : "";
  const l = typeof link === "string" ? link.trim().slice(0, 500) : "";
  let url: string | null = null;
  if (l) {
    try { const u = new URL(/^[a-z]+:\/\//i.test(l) ? l : `https://${l}`); if (u.protocol === "https:" || u.protocol === "http:") url = u.toString(); } catch { url = null; }
  }
  return { infoSource: t || null, infoSourceUrl: url };
}

/** Ghidurile noastre legate de surse (pentru linkurile de pe pagină). */
export const ghidulSursei = (s: Sursa) => (s.ghid ? `/ghid/${s.ghid}` : null);
