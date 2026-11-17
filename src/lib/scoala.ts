/**
 * Conținutul secțiunii pentru școli (/scoala), scris de mână, fără date inventate. Fișele gratuite sunt PDF-uri statice din
 * public/scoala/ (făcute cu scripts/fise-scoala.cjs și scripts/fise-scoala-docx.py), fiecare cu carteaneamului.ro în subsol.
 * Fără cont se descarcă PDF-ul; cu cont, fișa se completează și pe ecran (/scoala/fisa/<slug>) și se tipărește.
 */

/** Când s-a schimbat ultima dată conținutul paginilor pentru școli (pentru sitemap). */
export const SCHOOL_UPDATED = new Date("2026-11-17T12:00:00Z");
export type Block = { h2: string; p?: string[]; ul?: string[]; ol?: string[] };
export type Faq = { q: string; a: string };
export type SchoolPage = {
  slug: "" | "clasa-3" | "clasa-4" | "gimnaziu-istorie";
  path: string;
  /** <title>, cel mult 60 de caractere. */
  title: string;
  /** Meta descriere, 120–155 de caractere. */
  description: string;
  h1: string;
  lead: string;
  blocks: Block[];
  faq: Faq[];
  /** Fișele recomandate pe această pagină. */
  sheets: SheetSlug[];
};

export type SheetSlug = "arbore-3-generatii" | "arbore-strabunici" | "interviu-bunici" | "cine-ce-ruda-imi-este";
export type Sheet = { slug: SheetSlug; title: string; what: string; pdf: string; forWhom: string };

export const SHEETS: Sheet[] = [
  { slug: "arbore-3-generatii", title: "Arbore genealogic pe 3 generații", forWhom: "clasele a III-a și a IV-a",
    what: "Eu, părinții și cei patru bunici, în căsuțe mari, cu loc pentru nume, anul nașterii și localitate.", pdf: "/scoala/arbore-3-generatii.pdf" },
  { slug: "arbore-strabunici", title: "Arbore genealogic cu străbunici", forWhom: "clasa a IV-a și gimnaziul",
    what: "Patru generații: eu, părinții, bunicii și cei opt străbunici, cu o căsuță pentru ce meserie aveau.", pdf: "/scoala/arbore-strabunici.pdf" },
  { slug: "interviu-bunici", title: "Interviul cu bunicii (10 întrebări)", forWhom: "toate clasele",
    what: "Zece întrebări simple pentru o discuție cu bunicii, cu loc de scris răspunsurile.", pdf: "/scoala/interviu-bunici.pdf" },
  { slug: "cine-ce-ruda-imi-este", title: "Cine ce rudă îmi este", forWhom: "clasele a III-a și a IV-a",
    what: "Un exercițiu cu gradele de rudenie: unchi, mătușă, văr, nepot, cumnat, socru, cu răspunsurile pe spate.", pdf: "/scoala/cine-ce-ruda-imi-este.pdf" },
];
export const sheetOf = (slug: string) => SHEETS.find((s) => s.slug === slug) ?? null;

export const KIT = {
  classSheet: { title: "Fișa pentru toată clasa", pdf: "/scoala/kit-fisa-clasei.pdf", docx: "/scoala/kit-fisa-clasei.docx",
    what: "Tabelul clasei pentru proiect: fiecare elev, ce a predat (arborele, interviul, prezentarea) și observații." },
  parentLetter: { title: "Scrisoarea pentru părinți", pdf: "/scoala/kit-scrisoare-parinti.pdf", docx: "/scoala/kit-scrisoare-parinti.docx",
    what: "O scrisoare scurtă care le explică părinților proiectul, ce au de făcut acasă și că datele rămân ale familiei." },
};

const FAQ_COMMON: Faq[] = [
  { q: "Fișele sunt gratuite?", a: "Da. PDF-urile se descarcă fără cont și se pot tipări de câte ori e nevoie. Cu un cont, aceleași fișe se completează și pe ecran, apoi se tipăresc." },
  { q: "Ce fac dacă nu știm numele unui bunic sau străbunic?", a: "Lăsați căsuța goală sau scrieți ce se știe („bunicul din Sălaj, îi spuneau Ionică”). Un arbore cu goluri e normal; golurile sunt chiar întrebările pentru următoarea discuție cu rudele." },
  { q: "Copilul are o familie diferită (părinți despărțiți, crescut de bunici, adoptat). Cum facem?", a: "Arborele poate arăta familia în care crește copilul: cei care l-au crescut au locul lor în fișă. Învățătorul poate accepta orice variantă; important e ca exercițiul să nu stânjenească pe nimeni." },
];

export const SCHOOL_PAGES: SchoolPage[] = [
  {
    slug: "", path: "/scoala",
    title: "Arbore genealogic pentru școală: fișe gratuite",
    description: "Arborele genealogic pentru proiectul de la școală: fișe gratuite de tipărit, model pentru copii, interviul cu bunicii și un kit pentru învățători.",
    h1: "Arborele genealogic pentru școală – ghid pentru părinți și învățători",
    lead: "Proiectul „arborele familiei” apare în clasele primare și în gimnaziu. Aici găsiți fișe gratuite de completat, un model de arbore pentru copii, întrebări pentru bunici și un kit pentru toată clasa.",
    blocks: [
      { h2: "Ce înseamnă un arbore genealogic pentru un copil", p: [
        "Un arbore genealogic arată cine din familie cu cine se leagă: copilul, părinții, bunicii și, dacă se știe, străbunicii. Pentru un elev din clasa a III-a sau a IV-a nu e un exercițiu de arhivă, ci unul de memorie de familie: află numele bunicilor, unde s-au născut, ce meserie au avut și învață cuvintele de rudenie.",
        "Cel mai bine iese când proiectul se face împreună: copilul întreabă, adultul ajută la scris, iar bunicii povestesc. Fișele de mai jos sunt făcute pentru acest drum, cu căsuțe mari și cu întrebări pe care un copil le poate pune singur.",
      ] },
      { h2: "Pașii proiectului, pe scurt", ol: [
        "Copilul își scrie numele în căsuța de jos și data nașterii.",
        "Completează părinții: prenumele, numele (la mamă și numele de fată) și localitatea unde s-au născut.",
        "Îi întreabă pe bunici despre ei și despre părinții lor; răspunsurile intră în fișa „Interviul cu bunicii”.",
        "Trece bunicii (și, la clasele mari, străbunicii) în arbore. Ce nu se știe rămâne gol.",
        "Lipește sau desenează câte o poză mică; la prezentare, povestește un lucru aflat de la bunici.",
      ] },
      { h2: "Fișe gratuite de descărcat", p: [
        "Toate fișele sunt PDF-uri pe format A4, se tipăresc alb-negru și au căsuțe destul de mari pentru scrisul de mână. Le puteți tipări pentru toată clasa.",
      ] },
      { h2: "Pentru învățători: kitul clasei", p: [
        "Kitul are fișa pentru toată clasa (cine ce a predat) și o scrisoare pentru părinți, în PDF și în Word, ca să o puteți adapta. Dacă vreți ca elevii să-și facă arborele și online, cu familia, completați formularul de mai jos: după ce confirmăm cu conducerea școlii, primiți un cod de reducere pentru clasa dumneavoastră.",
      ] },
      { h2: "Cum arată un arbore bun pentru școală", ul: [
        "Copilul e jos (sau în centru), părinții deasupra, bunicii deasupra lor: generațiile se citesc de jos în sus.",
        "Fiecare om are numele, anul nașterii și localitatea; la femei, și numele de fată, pentru că el leagă familia mamei.",
        "Liniile arată cine e părintele cui; frații pot sta alături, pe același rând.",
        "O poveste scurtă de la bunici face prezentarea vie: un obicei, o meserie, o întâmplare din copilăria lor.",
      ] },
    ],
    faq: [
      ...FAQ_COMMON,
      { q: "Pot face arborele online și să-l tipăresc pentru școală?", a: "Da. Arborele făcut în Cartea Neamului are butonul „Printează pentru proiectul de la școală”, pe A4 sau A3, cu un desen curat, potrivit pentru copii. Primele 7 zile sunt gratuite, fără card." },
      { q: "Cât de mare trebuie să fie arborele?", a: "Pentru clasele primare ajung trei generații (copilul, părinții, bunicii). La clasa a IV-a și în gimnaziu se pot adăuga străbunicii. Mai important decât numărul de nume e ce află copilul despre ei." },
    ],
    sheets: ["arbore-3-generatii", "arbore-strabunici", "interviu-bunici", "cine-ce-ruda-imi-este"],
  },
  {
    slug: "clasa-3", path: "/scoala/clasa-3",
    title: "Arborele familiei, clasa a III-a: fișă și model",
    description: "Arborele familiei pentru clasa a III-a: ce se cere, un model simplu pe 3 generații, fișa gratuită de completat și cuvintele de rudenie explicate.",
    h1: "Arborele familiei – clasa a III-a",
    lead: "În clasa a III-a, familia apare la ora de educație civică și la lecțiile despre comunitate: cine sunt membrii familiei, ce rol are fiecare și cum se numesc rudele. Un arbore pe trei generații e exact cât trebuie.",
    blocks: [
      { h2: "Ce se urmărește la această vârstă", p: [
        "Copilul învață să-și descrie familia și să folosească corect cuvintele de rudenie: părinți, frați, bunici, unchi, mătuși, veri. Arborele îl ajută să vadă că familia lui are mai multe generații și că fiecare om are un loc al lui.",
        "Nu se cer date exacte sau acte. Ajung prenumele, numele de familie, anul nașterii (dacă se știe) și localitatea.",
      ] },
      { h2: "Modelul pe trei generații", ul: [
        "Rândul de jos: copilul (și, dacă vrea, frații).",
        "Rândul din mijloc: tata și mama.",
        "Rândul de sus: bunicii dinspre tată și bunicii dinspre mamă, patru căsuțe.",
      ], p: ["Fișa „Arbore genealogic pe 3 generații” are exact această așezare, cu căsuțe mari, ușor de completat de mână."] },
      { h2: "Cum lucrați acasă", ol: [
        "Citiți împreună fișa „Cine ce rudă îmi este” și lămuriți cuvintele noi.",
        "Copilul completează singur ce știe; adultul ajută doar la scris.",
        "Sunați sau vizitați bunicii și puneți 3–4 întrebări din fișa de interviu.",
        "Desenați o mică poză sau lipiți o fotografie în căsuța fiecăruia.",
      ] },
    ],
    faq: [
      ...FAQ_COMMON,
      { q: "Trebuie să apară și străbunicii în clasa a III-a?", a: "De obicei nu. Dacă familia îi știe, copilul îi poate adăuga, dar trei generații sunt suficiente pentru proiect." },
    ],
    sheets: ["arbore-3-generatii", "cine-ce-ruda-imi-este", "interviu-bunici"],
  },
  {
    slug: "clasa-4", path: "/scoala/clasa-4",
    title: "Arbore genealogic proiect clasa a IV-a: ghid",
    description: "Proiectul arbore genealogic de la clasa a IV-a, la Istorie: ce cere programa, fișa gratuită cu străbunici, interviul cu bunicii și cum îl prezinți.",
    h1: "Arbore genealogic – proiect pentru clasa a IV-a",
    lead: "La clasa a IV-a începe Istoria, iar primele lecții pornesc de la trecutul fiecăruia: familia, generațiile, izvoarele (poze, acte, amintiri). Arborele genealogic e proiectul tipic al acestor lecții.",
    blocks: [
      { h2: "Ce legătură are arborele cu ora de Istorie", p: [
        "Programa de Istorie pentru clasa a IV-a pornește de la trecutul personal și de la familie: copilul învață ce este o generație, cum se măsoară timpul (an, deceniu, secol) și ce sunt sursele istorice. Arborele genealogic le pune pe toate la un loc: generațiile se văd pe rânduri, anii nașterii arată cum curge timpul, iar pozele vechi, actele și poveștile bunicilor sunt primele „izvoare” ale copilului.",
        "De aceea, la această clasă merită adăugați și străbunicii: patru generații acoperă cam un secol, exact cât le trebuie copiilor ca să înțeleagă ce e un secol.",
      ] },
      { h2: "Ce poate conține proiectul", ul: [
        "Arborele pe patru generații (fișa „Arbore genealogic cu străbunici”).",
        "Interviul cu un bunic sau o bunică (10 întrebări).",
        "O „bandă a timpului” cu anii nașterii din familie, de la cel mai vechi la cel mai nou.",
        "Una-două surse: o fotografie veche, un certificat, o scrisoare (copii, nu originale).",
      ] },
      { h2: "Cum îl prezintă copilul în clasă", ol: [
        "Spune câte generații are arborele și cine e cel mai vechi om din el.",
        "Arată pe bandă cu câți ani în urmă s-a născut acel om și în ce secol.",
        "Povestește un lucru aflat de la bunici, cu cuvintele lui.",
        "Spune ce n-a aflat încă și pe cine ar putea întreba.",
      ] },
    ],
    faq: [
      ...FAQ_COMMON,
      { q: "E nevoie de acte din arhivă pentru proiect?", a: "Nu. Pentru clasa a IV-a ajung amintirile familiei și documentele pe care le aveți acasă. Arhivele (registrele parohiale, starea civilă) sunt pentru cine vrea să meargă mai departe." },
    ],
    sheets: ["arbore-strabunici", "interviu-bunici", "arbore-3-generatii"],
  },
  {
    slug: "gimnaziu-istorie", path: "/scoala/gimnaziu-istorie",
    title: "Arbore genealogic la Istorie, gimnaziu: proiect",
    description: "Arborele genealogic ca proiect de istorie în gimnaziu: familia în istoria locală, surse orale și documente, fișe gratuite și pașii unei mici cercetări.",
    h1: "Arborele genealogic la ora de Istorie – gimnaziu",
    lead: "În gimnaziu, arborele devine o mică cercetare: familia e pusă în istoria locului și a vremii, iar elevul lucrează cu surse orale și cu documente, ca un istoric.",
    blocks: [
      { h2: "Familia ca parte a istoriei locale", p: [
        "Elevii de gimnaziu pot lega datele din arbore de evenimentele pe care le învață: unde erau străbunicii în timpul războaielor mondiale, cum a schimbat colectivizarea viața satului, de ce s-au mutat unii la oraș sau în străinătate. Familia devine un exemplu concret pentru istoria locală.",
        "Un proiect bun are o întrebare de cercetare: „De unde vine familia mea dinspre mamă?”, „Ce meserii au avut oamenii din familia mea în ultimii 100 de ani?”, „Cum a trăit bunicul copilăria în anii ’60?”.",
      ] },
      { h2: "Sursele: orale și scrise", ul: [
        "Sursa orală: interviul cu bunicii, înregistrat sau scris, cu data și numele celui care povestește.",
        "Documente de familie: certificate, livrete de muncă, fotografii cu dedicații, scrisori.",
        "Arhive: actele de stare civilă mai vechi de aproximativ 100 de ani și registrele parohiale stau la Arhivele Naționale, la serviciul județean; cele mai noi, la primăria unde a fost întocmit actul.",
      ] },
      { h2: "Pașii unei mici cercetări", ol: [
        "Alege întrebarea și ramura (dinspre tată sau dinspre mamă).",
        "Completează arborele cu ce știe familia, apoi notează golurile.",
        "Fă interviul și compară ce spun rudele diferite.",
        "Caută un document care confirmă sau infirmă o informație.",
        "Scrie concluzia: ce ai aflat, din ce surse și ce rămâne de cercetat.",
      ] },
    ],
    faq: [
      ...FAQ_COMMON,
      { q: "Unde se cer actele vechi pentru un proiect de gimnaziu?", a: "Actele mai noi de aproximativ 100 de ani se cer de la primăria unde au fost întocmite. Cele mai vechi și registrele parohiale stau la Arhivele Naționale, la serviciul județean. Pentru un proiect școlar, de obicei ajung documentele familiei." },
    ],
    sheets: ["arbore-strabunici", "interviu-bunici"],
  },
];
export const schoolPage = (slug: string) => SCHOOL_PAGES.find((p) => p.slug === slug) ?? null;

/** Întrebările din fișa „Interviul cu bunicii”, folosite și în fișa de pe ecran. */
export const INTERVIEW = [
  "Cum te cheamă și unde te-ai născut?",
  "Cum se numeau părinții tăi și ce meserii aveau?",
  "Cum arăta casa în care ai copilărit?",
  "Ce jocuri jucai când erai de vârsta mea?",
  "Cum era școala ta? Cine ți-a fost învățător?",
  "Ce mâncare îți plăcea cel mai mult și cine o gătea?",
  "Ce sărbători sau obiceiuri aveați în familie?",
  "Cum v-ați cunoscut tu și bunicul (bunica)?",
  "Care e cea mai frumoasă amintire a ta?",
  "Ce ți-ar plăcea să știu eu despre familia noastră?",
];

/** Exercițiul „Cine ce rudă îmi este”: întrebarea și răspunsul. */
export const KINSHIP_QUIZ: [string, string][] = [
  ["Fratele mamei sau al tatălui meu este…", "unchiul meu"],
  ["Sora mamei sau a tatălui meu este…", "mătușa mea"],
  ["Copilul unchiului sau al mătușii mele este…", "vărul (vara) meu"],
  ["Mama mamei mele este…", "bunica mea"],
  ["Tatăl bunicului meu este…", "străbunicul meu"],
  ["Copilul fratelui sau al surorii mele este…", "nepotul (nepoata) meu"],
  ["Soțul surorii mele este…", "cumnatul meu"],
  ["Tatăl soției (sau al soțului) este…", "socrul"],
  ["Eu sunt pentru bunicii mei…", "nepotul (nepoata) lor"],
  ["Părinții, bunicii și străbunicii mei sunt…", "strămoșii (înaintașii) mei"],
];

/* ---------- Arborele de tipărit pentru proiect (/arbore/<id>/scoala) ---------- */

/** Ce rudă e fiecare loc din arbore pentru copil (numerotarea Ahnentafel: 1 = copilul, 2 tata, 3 mama…). */
export function schoolSlotLabel(n: number): string {
  if (n === 1) return "Eu";
  if (n === 2) return "Tata";
  if (n === 3) return "Mama";
  if (n < 8) return `${n % 2 ? "Bunica" : "Bunicul"} (${n < 6 ? "dinspre tata" : "dinspre mama"})`;
  return n % 2 ? "Străbunica" : "Străbunicul";
}
/** Rândurile arborelui, de sus în jos: străbunicii (8–15), bunicii (4–7), părinții (2–3), copilul (1). */
export const SCHOOL_ROWS = [[8, 9, 10, 11, 12, 13, 14, 15], [4, 5, 6, 7], [2, 3], [1]] as const;
