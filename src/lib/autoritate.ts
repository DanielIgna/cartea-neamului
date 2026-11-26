/**
 * Etapa 5, autoritate (Daniel, 17.11.2026): paginile prin care alte site-uri ajung să vorbească despre noi și să ne dea linkuri.
 * /presa: kitul de presă (ce e Cartea Neamului, cifre, unghiuri de articol, sigla, contact).
 * /arborele-meu: widgetul gratuit pe care familiile îl pun pe blogul lor (src/lib/widget-arbore.ts), cu un link spre noi.
 * Doar în română, ca /scoala; intră în sitemap prin grupul „autoritate” și în Admin → SEO.
 */
export type AuthorityPage = { path: string; title: string; description: string; h1: string };

export const AUTHORITY_UPDATED = new Date("2026-11-17T00:00:00Z");

export const PRESS_PAGE: AuthorityPage = {
  path: "/presa",
  title: "Presă: Cartea Neamului, date, sigle și contact",
  h1: "Cartea Neamului pentru presă",
  description: "Kitul de presă al Cartea Neamului: ce face platforma, cifre la zi, idei de articole, sigla de descărcat și adresa de contact pentru jurnaliști.",
};

export const WIDGET_PAGE: AuthorityPage = {
  path: "/arborele-meu",
  title: "Widgetul gratuit „Arborele meu” pentru blog",
  h1: "Widgetul gratuit „Arborele meu”",
  description: "Pune pe blogul familiei o fișă a neamului: câte persoane, generații și locuri de baștină are arborele. Gratuit, fără nume și fără datele celor vii.",
};

/**
 * /link-spre-noi (Daniel, 26.11.2026: „fă tot ce poți pentru linkuri externe”): textul și codul gata de lipit pentru cine vrea
 * să ne pună un link (profesori, biblioteci, primării, asociații din diaspora, bloguri, site-uri de genealogie în engleză).
 * Emailurile din CRM → Aprobări trimit aici, ca omul de la celălalt capăt să nu aibă nimic de scris.
 */
export const LINK_PAGE: AuthorityPage = {
  path: "/link-spre-noi",
  title: "Pune un link spre resursele gratuite Cartea Neamului",
  h1: "Pune pe site-ul tău resursele gratuite de genealogie",
  description: "Text și cod HTML gata de copiat pentru școli, biblioteci, primării, asociații și bloguri: fișe pentru elevi, ghiduri de arhivă și insigne.",
};

/**
 * Comunicatul pentru 1 Decembrie (Daniel, 26.11.2026, aprobat): „Cum afli dacă străbunicul tău a fost la Alba Iulia”, pornind de la
 * seria Marea Unire. Emailurile către redacții din CRM → Aprobări trimit aici.
 */
export const UNIRE_RELEASE: AuthorityPage = {
  path: "/presa/1-decembrie-2026",
  title: "1 Decembrie: cum afli dacă străbunicul a fost la Alba Iulia",
  h1: "De 1 Decembrie, află dacă străbunicul tău a fost la Alba Iulia",
  description: "Comunicat de presă Cartea Neamului: 1.228 de delegați la Alba Iulia în 1918, unde sunt credenționalele lor și cum își caută familiile strămoșii.",
};

export const AUTHORITY_PAGES = [PRESS_PAGE, WIDGET_PAGE, LINK_PAGE, UNIRE_RELEASE];

/** Un link gata de pus pe alt site: cui i se potrivește, unde duce și ce scrie în el. */
export type LinkKit = { id: string; cui: string; deCe: string; path: string; ancora: string; descriere: string; lang?: "ro" | "en" };

export const LINK_KITS: LinkKit[] = [
  { id: "scoala", cui: "Profesori, învățători, inspectorate și case ale corpului didactic", deCe: "Proiectul „arborele familiei” de la clasele a III-a și a IV-a și orele de istorie: fișe de tipărit, fără cont.",
    path: "/scoala", ancora: "Fișe gratuite: arborele genealogic pentru școală", descriere: "modele de arbore, interviul cu bunicii și gradele de rudenie, de tipărit (Cartea Neamului)" },
  { id: "biblioteca", cui: "Biblioteci județene, orășenești și școlare", deCe: "Cititorii care întreabă la bibliotecă „de unde încep să-mi caut străbunicii”: arhive, registre și baze publice, explicate pe înțeles.",
    path: "/surse-publice", ancora: "Unde îți cauți strămoșii: arhive și baze de date publice", descriere: "ghid gratuit al surselor de genealogie din România și Basarabia (Cartea Neamului)" },
  { id: "primarie", cui: "Primării, muzee sătești, site-uri de sat și monografii locale", deCe: "Fiecare comună are pagina ei: satele, unde se cer actele vechi și la ce arhivă au ajuns registrele. Găsiți pagina comunei la /localitati și puneți-i adresa în loc.",
    path: "/localitati", ancora: "Acte vechi și arhive pentru satele comunei", descriere: "unde se caută strămoșii din fiecare sat (Cartea Neamului)" },
  { id: "diaspora", cui: "Asociații, parohii și școli de duminică ale românilor din străinătate", deCe: "Românii plecați și copiii lor născuți afară: cum afli satul bunicilor de departe, în limba țării în care trăiești.",
    path: "/diaspora", ancora: "Rădăcini românești, de oriunde din lume", descriere: "ghiduri gratuite pentru românii din străinătate, în 18 limbi (Cartea Neamului)" },
  { id: "blog", cui: "Bloguri de familie, de istorie locală și de genealogie", deCe: "Ghiduri care se citesc ușor: registrele parohiale, scrisul chirilic, conscripțiile, numele de familie.",
    path: "/ghid", ancora: "Ghiduri gratuite de genealogie românească", descriere: "de la primii pași până la registrele în latină și chirilică (Cartea Neamului)" },
  { id: "nume", cui: "Site-uri de știri, reviste și pagini de cultură", deCe: "Originea numelor de familie românești, cu variantele și zonele lor. Un subiect pe care cititorii îl caută des.",
    path: "/nume", ancora: "Ce înseamnă numele de familie românești", descriere: "originea și variantele numelor, explicate (Cartea Neamului)" },
  { id: "en", cui: "Genealogy societies, libraries and resource lists in English", deCe: "Free English guide to Romanian archives, parish registers and public databases, for descendants of Romanian, Bukovinian, Banat and Bessarabian emigrants.",
    path: "/en/resurse-genealogie", ancora: "Free Romanian genealogy resources (The Family Book / Cartea Neamului)", descriere: "archives, parish registers and public databases for Romania and Moldova", lang: "en" },
];

/** Unghiurile de articol din kitul de presă: subiecte care țin de familie și istorie, nu de produs. */
export const PRESS_ANGLES: { title: string; text: string }[] = [
  { title: "Vocea bunicilor, păstrată pentru strănepoți", text: "Familiile înregistrează poveștile bătrânilor și le leagă de paginile cărții familiei, cu un cod pe care nepoții îl scanează cu telefonul." },
  { title: "Românii din diaspora își caută satul de baștină", text: "Milioane de români trăiesc în afara țării. Mulți copii crescuți în Italia, Spania sau Germania vor să știe de unde vin bunicii lor." },
  { title: "Arborele genealogic, temă de școală", text: "Fișe gratuite pentru clasele primare și gimnaziu, pe care copiii le completează împreună cu părinții și bunicii." },
  { title: "Ce spun registrele vechi despre satele noastre", text: "Registrele parohiale, catagrafiile și conscripțiile arată cum trăiau oamenii acum două sute de ani. Ghidurile gratuite explică pe înțeles cum se citesc." },
  { title: "Cadoul de sărbători care rămâne în familie", text: "Un arbore al familiei, făcut împreună, cu pozele și glasurile celor dragi, oferit părinților și bunicilor." },
];
