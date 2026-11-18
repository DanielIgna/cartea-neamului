/**
 * Secțiunea /cadouri (planul SEO, etapa 2, Daniel 18.11.2026): hubul darurilor, paginile pe ocazii și pe destinatari.
 * Totul scris de mână, în română, doar despre ce există în produs: un an pe un plan (Basic, Familie, Premium), dăruit printr-o
 * legătură sau un card de tipărit, cu arborele, pozele și glasurile familiei. Prețurile NU sunt aici: pagina le citește din
 * Admin → Manager control. Doar ce există în produs, fără opinii sau cifre inventate.
 *
 * Crăciunul are pagina lui de dinainte, /cadou-de-sarbatori (tradusă în toate limbile); /cadouri/craciun trimite acolo.
 * Fișier fără importuri de pe server.
 */
import type { SeasonKey } from "@/lib/seo/sezon";

export const GIFTS_HUB = "/cadouri";
export const CHRISTMAS_PATH = "/cadou-de-sarbatori";
export const GIFTS_TITLE = "Cadouri pentru familie: idei pe ocazii și persoane";
export const GIFTS_DESCRIPTION = "Idei de cadou pentru părinți, bunici, socri sau nași, de Crăciun, Paște, nuntă de aur sau botez: povestea familiei, dăruită pentru un an.";
/** Când s-a schimbat ultima dată conținutul secțiunii (data de rezervă din sitemap; data reală e în src/data/seo-versiuni.json). */
export const GIFTS_UPDATED = new Date("2026-11-18T00:00:00Z");

export type Faq = { q: string; a: string };
export type GiftTier = "basic" | "familie" | "premium";
export type GiftPage = {
  slug: string;
  kind: "ocazie" | "destinatar";
  /** Numele scurt (în hub, în firul de navigare). */
  name: string;
  /** <title>, cel mult 60 de caractere. */
  title: string;
  /** Meta descriere, 120–155 de caractere. */
  description: string;
  h1: string;
  lead: string;
  /** De ce se potrivește darul: paragrafe proprii paginii. */
  why: { h2: string; p: string[] };
  /** A doua parte a textului: ce rămâne după anul dăruit (EXTRA, mai jos). */
  more?: { h2: string; p: string[] };
  /** Idei de folosire, specifice ocaziei sau persoanei. */
  ideas: { h2: string; items: string[] };
  /** Un bilet scurt, de pus pe card sau în mesaj. */
  note: string;
  /** Planul potrivit, cu motivul (prețul vine din Admin). */
  tier: GiftTier;
  tierWhy: string;
  faq: Faq[];
  season?: SeasonKey;
  /** Alte pagini din secțiune, înrudite (slug-uri). */
  related: string[];
};

export const giftPath = (p: { slug: string }) => `${GIFTS_HUB}/${p.slug}`;

const OCAZII: GiftPage[] = [
  {
    slug: "ziua-bunicilor", kind: "ocazie", name: "Ziua Bunicilor", season: "ziua-bunicilor",
    title: "Cadou de Ziua Bunicilor: povestea lor, păstrată",
    description: "Un cadou de Ziua Bunicilor care contează: un an în care bunicii își spun povestea, pun pozele vechi în arbore și își înregistrează glasul.",
    h1: "Cadou de Ziua Bunicilor: un an în care povestea lor nu se pierde",
    lead: "Bunicii nu mai au nevoie de lucruri. Au nevoie să fie ascultați. Darul acesta e un an în care ce știu ei despre neam ajunge scris, cu poze și cu glasul lor.",
    why: {
      h2: "De ce e un dar potrivit pentru Ziua Bunicilor",
      p: [
        "Ziua Bunicilor e una dintre puținele zile din an făcute anume pentru ei. E bine ca darul să fie despre ei, nu despre ce le mai trebuie în casă. Un an în Cartea Neamului înseamnă că numele părinților și bunicilor lor, satul de unde vin și întâmplările pe care le povestesc la masă capătă un loc unde nu se mai pierd.",
        "Pentru mulți bunici, a fi întrebați „cum era pe vremea voastră?” e un dar în sine. Arborele dă discuției un fir: pornești de la ei, urci la părinții lor, apoi la bunici, și la fiecare nume apare o poveste.",
      ],
    },
    ideas: {
      h2: "Cum puteți folosi darul chiar în ziua aceea",
      items: [
        "Așezați-vă lângă ei cu telefonul și înregistrați o poveste de cinci minute: cum s-au cunoscut, prima casă, un an greu.",
        "Scoateți albumul vechi și fotografiați împreună pozele pe care nu le mai știe nimeni în afară de ei, cu nume și ani.",
        "Lăsați-i pe ei să spună cine ce rudă e. Voi doar scrieți în arbore.",
        "Puneți nepoții să pună întrebări din ghidul cu întrebări pentru bunici.",
      ],
    },
    note: "Pentru bunica și bunicul: tot ce ne-ați povestit vreodată merită să rămână. Anul acesta îl scriem împreună.",
    tier: "basic", tierWhy: "Basic ajunge pentru arborele bunicilor, cu pozele și glasurile lor. Dacă vreți ca mai mulți nepoți să scrie, alegeți Familie.",
    faq: [
      { q: "Când e Ziua Bunicilor?", a: "Familiile o țin la date diferite. Darul nu are termen: legătura nu expiră, așa că îl puteți da oricând vă adunați cu bunicii." },
      { q: "Bunicii nu au email. Merge?", a: "Contul se poate face pe adresa unui copil sau nepot, care apoi completează împreună cu bunicii. Important e ca poveștile să fie ale lor." },
    ],
    related: ["pentru-bunici", "zi-de-nastere-bunici", "pentru-bunica", "pentru-bunic"],
  },
  {
    slug: "paste", kind: "ocazie", name: "Paște", season: "paste",
    title: "Cadou de Paște pentru familie: arborele neamului",
    description: "Un cadou de Paște pentru părinți și bunici: un an în care familia adunată la masă pune în arbore numele, pozele și poveștile celor de demult.",
    h1: "Cadou de Paște pentru familie: poveștile spuse la masă, păstrate",
    lead: "De Paște se adună de obicei toată familia, uneori singura dată pe an. E momentul în care cei bătrâni povestesc și cei tineri ascultă. Darul acesta face ca poveștile să rămână și după ce se strânge masa.",
    why: {
      h2: "De ce de Paște",
      p: [
        "Masa de Paște e una dintre puținele ocazii în care sunt de față trei sau patru generații. Bunicii își amintesc de Paștile din copilăria lor, de obiceiurile din sat, de rudele plecate. Dacă în ziua aceea cineva deschide arborele și întreabă „cum îl chema pe tatăl tău?”, discuția pornește singură.",
        "Un an în Cartea Neamului e un dar pe care îl folosește toată familia, nu doar cel care îl primește: fiecare poate adăuga ce știe, din casa lui, după ce pleacă.",
      ],
    },
    ideas: {
      h2: "Idei pentru masa de Paște",
      items: [
        "După masă, întrebați-i pe cei mai în vârstă cum se țineau sărbătorile când erau copii și înregistrați-le răspunsul.",
        "Fiecare ramură a familiei adaugă în arbore părinții și bunicii pe care îi știe.",
        "Fotografiați pozele vechi din casa părintească înainte să se împartă sau să se piardă.",
        "Notați satul de unde vine fiecare ramură: e primul pas spre actele vechi din arhive.",
      ],
    },
    note: "De Paște ne-am adunat toți. Hai să păstrăm și ce ne-am povestit: arborele neamului nostru, pentru un an întreg.",
    tier: "familie", tierWhy: "Familie lasă mai multe rude să scrie în același arbore, potrivit când darul e pentru toată masa.",
    faq: [
      { q: "Pot da darul în săptămâna dinaintea Paștelui?", a: "Da. Legătura nu expiră, iar anul începe abia când cel care o primește apasă „Primește anul”." },
      { q: "Toată familia trebuie să-și facă cont?", a: "Doar cine vrea să scrie în arbore. Cine doar se uită nu plătește nimic, pe niciun plan." },
    ],
    related: ["reuniune-de-familie", "pentru-familie", "pentru-parinti"],
  },
  {
    slug: "1-martie", kind: "ocazie", name: "1 Martie", season: "martie",
    title: "Cadou de 1 Martie pentru mama sau bunica",
    description: "Pe lângă mărțișor, un cadou de 1 Martie care rămâne: un an în care mama sau bunica pune în arbore pozele, numele și poveștile familiei.",
    h1: "Cadou de 1 Martie: pe lângă mărțișor, ceva care rămâne",
    lead: "Mărțișorul se poartă câteva zile. Darul acesta durează un an și lasă în urmă arborele familiei, cu pozele și glasurile celor dragi.",
    why: {
      h2: "Un mărțișor cu poveste",
      p: [
        "De 1 Martie se dăruiește de obicei ceva mic, legat cu șnur alb și roșu. Mulți dintre noi țin minte mărțișoarele primite de la mama sau de la bunica, și obiceiurile din satul lor. E o zi bună să le întrebi cum era primăvara când erau ele copii.",
        "Darul acesta merge foarte bine lângă mărțișor: un card de tipărit, cu un bilet scurt, pus în plic, care deschide un an în care mama sau bunica își pune amintirile la un loc.",
      ],
    },
    ideas: {
      h2: "Cum îl puteți da",
      items: [
        "Tipăriți cardul și puneți-l în plic, împreună cu mărțișorul.",
        "Trimiteți legătura pe WhatsApp dimineața, cu o poză veche cu ea.",
        "Înregistrați-o povestind despre mărțișoarele din copilăria ei: e prima înregistrare din arbore.",
        "Căutați împreună o poză de primăvară din albumul vechi și puneți-o lângă numele ei.",
      ],
    },
    note: "Un mărțișor care nu se pierde până la anul: povestea familiei noastre, scrisă de tine.",
    tier: "basic", tierWhy: "Basic e suficient pentru un dar de 1 Martie: un arbore, cu pozele și glasurile familiei.",
    faq: [
      { q: "Pot dărui și un card tipărit, nu doar un link?", a: "Da. După plată primiți legătura și puteți tipări un card cu biletul vostru și un cod de scanat cu telefonul." },
    ],
    related: ["8-martie", "pentru-mama", "pentru-bunica"],
  },
  {
    slug: "8-martie", kind: "ocazie", name: "8 Martie", season: "martie",
    title: "Cadou de 8 Martie pentru mama: povestea ei",
    description: "Cadou de 8 Martie pentru mama, altfel decât florile: un an în care povestea ei, pozele de familie și glasul ei ajung în arborele neamului.",
    h1: "Cadou de 8 Martie pentru mama: povestea ei, nu încă un obiect",
    lead: "Florile de 8 Martie țin o săptămână. Povestea mamei, cu pozele și vocea ei, rămâne pentru copii și nepoți.",
    why: {
      h2: "De ce povestea mamei e un dar pentru ea",
      p: [
        "Mama e de obicei cea care ține minte familia: cine cu cine s-a căsătorit, ziua fiecăruia, cine pe cine a botezat. De multe ori nimeni nu a întrebat-o niciodată despre ea: despre copilăria ei, despre mama ei, despre cum a fost când ați venit voi pe lume.",
        "Darul acesta îi spune: ce știi tu contează și vrem să rămână. Un an în care ea pune în arbore ce știe, iar voi o ajutați cu telefonul și cu pozele.",
      ],
    },
    ideas: {
      h2: "Idei pentru ziua de 8 Martie",
      items: [
        "Întrebați-o despre mama ei și înregistrați răspunsul: e una dintre cele mai frumoase înregistrări pe care le poate avea o familie.",
        "Puneți în arbore poza ei de la nuntă sau din tinerețe, cu anul și locul.",
        "Lăsați-o să completeze ramura ei, iar voi pe cea a tatălui.",
        "Dacă sunteți departe, trimiteți legătura dimineața și sunați-o seara să începeți împreună.",
      ],
    },
    note: "Mamă, tu ții minte toată familia. Anul acesta o scriem împreună, cu pozele și glasul tău.",
    tier: "basic", tierWhy: "Basic ajunge pentru arborele mamei, cu poze și înregistrări. Dacă vreți să scrieți și voi, frații, alegeți Familie.",
    faq: [
      { q: "Mama nu se pricepe la telefon. Se descurcă?", a: "Contul îl puteți face împreună, în câteva minute. Adăugarea unei persoane sau a unei poze e la un buton distanță, iar voi puteți completa în locul ei." },
    ],
    related: ["1-martie", "ziua-mamei", "pentru-mama"],
  },
  {
    slug: "ziua-mamei", kind: "ocazie", name: "Ziua Mamei", season: "ziua-mamei",
    title: "Cadou de Ziua Mamei: povestea familiei ei",
    description: "Cadou emoțional de Ziua Mamei: un an în Cartea Neamului, în care mama își pune la un loc părinții, bunicii, pozele vechi și amintirile.",
    h1: "Cadou de Ziua Mamei: de unde vine mama",
    lead: "La noi, Ziua Mamei se ține în prima duminică din mai. E ziua potrivită să o întrebați nu doar ce face, ci de unde vine: părinții ei, satul ei, copilăria ei.",
    why: {
      h2: "Un dar despre rădăcinile mamei",
      p: [
        "Știm de obicei mai multe despre familia tatălui, pentru că numele de familie merge pe linia lui. Ramura mamei se pierde mai ușor: numele ei de fată, al mamei ei, al bunicii ei. Darul acesta e un prilej să le scrieți înainte să nu le mai știe nimeni.",
        "Arborele arată pe rând ramura fiecărui părinte, așa că mama își poate vedea neamul ei întreg, nu doar ca anexă a celui al tatălui.",
      ],
    },
    ideas: {
      h2: "Cum începeți",
      items: [
        "Întrebați-o numele de fată al mamei și al bunicii ei, și scrieți-le în arbore.",
        "Înregistrați-o povestind despre casa în care a crescut.",
        "Căutați satul ei pe harta neamului și vedeți dacă mai sunt familii de acolo.",
        "Puneți împreună pozele de la botezurile și nunțile din familia ei.",
      ],
    },
    note: "Mamă, de Ziua ta vrem să aflăm mai mult despre tine: de unde vii, cine ți-au fost părinții și bunicii. Ți-am dăruit un an să scriem asta.",
    tier: "basic", tierWhy: "Basic e de ajuns ca mama să-și pună ramura familiei, cu pozele și glasul ei.",
    faq: [
      { q: "Ce se întâmplă după un an?", a: "Anul nu se reînnoiește singur și nu se ia nimic de pe card. Arborele rămâne al ei; îl vede și îl poate descărca oricând." },
    ],
    related: ["8-martie", "pentru-mama", "ziua-tatalui"],
  },
  {
    slug: "ziua-tatalui", kind: "ocazie", name: "Ziua Tatălui", season: "ziua-tatalui",
    title: "Cadou de Ziua Tatălui: arborele neamului lui",
    description: "Cadou de Ziua Tatălui pentru un tată care le are pe toate: un an în care își urcă neamul pe linia numelui, din tată în tată, cu poze și povești.",
    h1: "Cadou de Ziua Tatălui: neamul lui, din tată în tată",
    lead: "La noi, Ziua Tatălui se ține în a doua duminică din mai. Pentru un tată care „nu are nevoie de nimic”, un dar bun e să-l întrebi de tatăl lui și de bunicul lui.",
    why: {
      h2: "De ce un tată se bucură de un arbore",
      p: [
        "Mulți tați sunt curioși de unde vine numele lor, chiar dacă nu o spun. Cartea Neamului arată spița neamului pe linia bărbătească, din tată în tată, cât de sus știe familia. Pentru un tată e o bucurie să vadă cum numele lui merge înapoi patru sau cinci generații.",
        "E și un dar care îl pune pe el în rolul celui care știe: el povestește, el completează, el corectează ce au scris alții.",
      ],
    },
    ideas: {
      h2: "Ce puteți face împreună",
      items: [
        "Scrieți spița pe linia lui: tatăl, bunicul, străbunicul, cu satul fiecăruia.",
        "Întrebați-l de armată, de primul serviciu, de casa pe care a construit-o, și înregistrați-l.",
        "Căutați pe pagina numelui de familie ce înseamnă numele lui și unde e frecvent.",
        "Fotografiați actele vechi din casă: livrete, diplome, acte de proprietate.",
      ],
    },
    note: "Tată, ne-ai spus mereu de unde venim. Anul acesta scriem asta în Cartea Neamului, din tată în tată.",
    tier: "basic", tierWhy: "Basic ajunge pentru spița lui. Dacă vreți să-l ajute și frații sau verii, alegeți Familie.",
    faq: [
      { q: "Ce e o spiță?", a: "Linia neamului din tată în tată, pe numele de familie. În Cartea Neamului fiecare își alege ramurile pe care le urmărește; implicit sunt cele ale ambilor părinți." },
    ],
    related: ["pentru-tata", "ziua-mamei", "pensionare"],
  },
  {
    slug: "nunta-de-aur", kind: "ocazie", name: "Nunta de aur",
    title: "Cadou pentru nunta de aur: povestea celor 50 de ani",
    description: "Cadou pentru nunta de aur a părinților sau bunicilor: povestea celor 50 de ani împreună, cu pozele de la nuntă, copiii, nepoții și glasurile lor.",
    h1: "Cadou pentru nunta de aur: cei 50 de ani, puși la un loc",
    lead: "Cincizeci de ani de căsnicie înseamnă copii, nepoți, poate strănepoți, case, plecări și întoarceri. Darul acesta adună toată povestea într-un singur loc, unde o poate vedea fiecare rudă.",
    why: {
      h2: "De ce se potrivește la o nuntă de aur",
      p: [
        "La nunta de aur se strâng toți cei care au pornit din cei doi: copii, nepoți, cumnați, nași. Arborele îi arată pe toți dintr-o privire, pornind de la cuplul care sărbătorește. E poate prima dată când cei doi își văd tot neamul pe care l-au întemeiat.",
        "Poza de la nunta lor, din urmă cu cincizeci de ani, își găsește locul lângă pozele de acum. Iar povestea felului în care s-au cunoscut, spusă de ei, poate fi înregistrată și ascultată de strănepoți.",
      ],
    },
    ideas: {
      h2: "Idei pentru ziua sărbătorii",
      items: [
        "Rugați-i să povestească, fiecare pe rând, cum s-au cunoscut, și înregistrați amândouă variantele.",
        "Adunați de la rude pozele de la nunta lor și de la botezurile copiilor.",
        "Proiectați arborele pe un ecran la petrecere și lăsați invitații să se găsească în el.",
        "Fiecare copil adaugă familia lui: soți, copii, nepoți.",
      ],
    },
    note: "Pentru cei 50 de ani ai voștri: toată familia pe care ați început-o, într-un singur arbore, cu povestea voastră spusă de voi.",
    tier: "familie", tierWhy: "Familie lasă mai multe rude să scrie în același arbore: potrivit când copiii și nepoții adaugă fiecare ramura lui.",
    faq: [
      { q: "Pot dărui darul din partea tuturor copiilor?", a: "Da. Unul dintre voi plătește, iar pe card puteți scrie numele tuturor. Apoi fiecare frate poate fi invitat să scrie în arbore." },
      { q: "Există și o carte?", a: "Cartea familiei în PDF se cumpără separat și se face din datele voastre. Prețul ei îl vedeți pe pagina cu prețuri." },
    ],
    related: ["nunta-de-argint", "aniversare-casatorie", "pentru-parinti", "pentru-bunici"],
  },
  {
    slug: "nunta-de-argint", kind: "ocazie", name: "Nunta de argint",
    title: "Cadou pentru nunta de argint a părinților",
    description: "Cadou pentru nunta de argint: un an în care cei doi pun în arborele familiei 25 de ani împreună, pozele de la nuntă și neamurile din care vin.",
    h1: "Cadou pentru nunta de argint: 25 de ani și două neamuri",
    lead: "La 25 de ani de căsnicie, cei doi au de obicei copii mari, părinți încă în viață și destule amintiri cât să umple un album. E vârsta potrivită să pună familia pe hârtie, cât încă pot întreba părinții.",
    why: {
      h2: "De ce la nunta de argint",
      p: [
        "O căsnicie leagă două neamuri. La nunta de argint, ambele ramuri sunt încă vii: părinții celor doi pot spune cine au fost bunicii și străbunicii. Peste douăzeci de ani, multe dintre aceste răspunsuri nu le mai poate da nimeni.",
        "Darul acesta e un an în care cei doi își așază cele două neamuri unul lângă altul, cu copiii lor la mijloc.",
      ],
    },
    ideas: {
      h2: "Cum îl folosiți",
      items: [
        "Fiecare dintre cei doi își completează ramura: părinți, bunici, frați.",
        "Puneți poza de la nuntă și pe cele de la botezurile copiilor.",
        "Întrebați-i pe părinții lor, cât puteți, despre bunici, și înregistrați răspunsurile.",
        "Copiii pot adăuga ce știu ei și pot invita verii.",
      ],
    },
    note: "Pentru 25 de ani împreună: cele două neamuri ale voastre, puse în sfârșit în același arbore.",
    tier: "basic", tierWhy: "Basic e de ajuns pentru cei doi. Dacă vreți să scrie și copiii, alegeți Familie.",
    faq: [
      { q: "Se pot vedea separat ramura soțului și a soției?", a: "Da. Arborele arată ramurile ambilor, iar fiecare își poate alege ce spițe urmărește." },
    ],
    related: ["nunta-de-aur", "aniversare-casatorie", "pentru-cuplu", "pentru-parinti"],
  },
  {
    slug: "aniversare-casatorie", kind: "ocazie", name: "Aniversare de căsătorie",
    title: "Cadou de aniversare a căsătoriei: povestea voastră",
    description: "Cadou de aniversare a căsătoriei pentru soț, soție sau părinți: arborele celor două familii, cu pozele de la nuntă și povestea voastră.",
    h1: "Cadou de aniversare a căsătoriei: povestea a două familii",
    lead: "Oricâți ani ar fi, o aniversare de căsătorie e ziua în care două familii au devenit una. Darul acesta le pune pe amândouă în același arbore.",
    why: {
      h2: "De ce e un dar de aniversare",
      p: [
        "Un cuplu știe de obicei puțin despre bunicii celuilalt. Arborele comun e o cale frumoasă de a afla: de unde vine familia soțului, din ce sat e bunica soției, cine pe cine a cununat.",
        "Darul merge și pentru propria aniversare, și pentru a părinților: cei care sărbătoresc își spun povestea, iar voi o păstrați.",
      ],
    },
    ideas: {
      h2: "Idei",
      items: [
        "Scrieți în arbore data și locul cununiei, cu poza de la nuntă.",
        "Fiecare povestește cum l-a cunoscut pe celălalt, înregistrat.",
        "Căutați pe hartă satele din care vin cele două familii.",
        "Adăugați și nașii, cu poza de la cununie: și ei fac parte din poveste.",
      ],
    },
    note: "La mulți ani nouă! Anul acesta scriem povestea noastră și a celor două familii din care venim.",
    tier: "basic", tierWhy: "Basic e potrivit pentru un cuplu: un arbore cu ambele familii.",
    faq: [
      { q: "Îl pot dărui partenerului meu?", a: "Da. Darul poate fi pentru oricine are sau își face un cont; dacă aveți deja un an plătit, anul dăruit se adaugă după el." },
    ],
    related: ["nunta-de-argint", "nunta-de-aur", "pentru-cuplu"],
  },
  {
    slug: "botez", kind: "ocazie", name: "Botez",
    title: "Cadou de botez original: arborele copilului",
    description: "Cadou de botez original pentru părinți sau de la nași: arborele familiei copilului, cu bunicii, străbunicii și glasurile lor, pentru când va crește.",
    h1: "Cadou de botez original: de unde vine copilul",
    lead: "La botez copilul primește un nume. Darul acesta îi dă și neamul din spatele numelui: părinții, bunicii și străbunicii lui, pe toate ramurile.",
    why: {
      h2: "De ce un arbore la botez",
      p: [
        "Un copil născut acum are de obicei toți bunicii în viață și, uneori, străbunici. Peste zece sau douăzeci de ani, când va întreba de unde vine, mulți dintre ei nu vor mai fi. Darul acesta e un an în care familia scrie pentru el ce știe acum.",
        "Glasul străbunicii care îi cântă sau îi spune o binecuvântare, înregistrat în primul lui an, e un lucru pe care nu-l mai poate primi altfel.",
      ],
    },
    ideas: {
      h2: "Cum îl folosește familia",
      items: [
        "Copilul e primul în arbore; de la el se urcă la părinți, bunici și străbunici.",
        "Înregistrați bunicii și străbunicii vorbindu-i copilului, ca să le audă vocea când va fi mare.",
        "Puneți pozele de la botez lângă cele de la botezurile părinților lui, dacă le găsiți.",
        "Nașii pot fi adăugați și ei, cu poza de la botez.",
      ],
    },
    note: "Pentru micuț, la botez: de unde vii și cine te-a iubit de la început. Să le asculți glasul când vei fi mare.",
    tier: "familie", tierWhy: "Familie lasă ambele familii, a mamei și a tatălui, să scrie în același arbore.",
    faq: [
      { q: "E un dar potrivit de la nași?", a: "Da. Nașii pot dărui anul părinților, iar pe card pot scrie un bilet pentru fin." },
      { q: "Datele copilului sunt publice?", a: "Nu. Arborele e privat: îl văd doar cei pe care familia îi invită. Paginile publice ale site-ului nu arată date despre persoane în viață." },
    ],
    related: ["pentru-nasi", "pentru-parinti", "pentru-familie"],
  },
  {
    slug: "pensionare", kind: "ocazie", name: "Pensionare",
    title: "Cadou de pensionare original: arborele neamului",
    description: "Cadou de pensionare original: un an în care proaspătul pensionar își caută strămoșii, pune pozele în ordine și își scrie povestea pentru nepoți.",
    h1: "Cadou de pensionare: în sfârșit, timp pentru povestea familiei",
    lead: "Mulți oameni spun ani la rând „când ies la pensie, mă apuc de arborele familiei”. Darul acesta e chiar începutul.",
    why: {
      h2: "De ce la pensionare",
      p: [
        "Pensia aduce timp, iar genealogia cere timp: discuții cu rudele, căutări prin acte, poze de scanat, satele bunicilor de vizitat. E o pasiune pe care mulți o descoperă tocmai atunci și care îi ține în legătură cu toată familia.",
        "Spre deosebire de un obiect, darul acesta îi dă proaspătului pensionar un proiect: un an în care pune la un loc tot ce știe, cu ghiduri despre cum se caută strămoșii în arhive.",
      ],
    },
    ideas: {
      h2: "Primele lucruri de făcut",
      items: [
        "Scrieți ce știți de la memorie: părinți, bunici, frați, cu satele lor.",
        "Citiți ghidurile despre actele de stare civilă și registrele parohiale, apoi faceți o listă de întrebări pentru arhivă.",
        "Scanați albumele de familie, câte unul pe săptămână.",
        "Înregistrați-vă povestea vieții pentru nepoți, capitol cu capitol.",
      ],
    },
    note: "La pensie ai, în sfârșit, timp pentru ce ai amânat. Începe cu povestea familiei noastre. Noi te ajutăm.",
    tier: "familie", tierWhy: "Familie dă loc pentru un arbore mare și pentru rudele care vor să ajute.",
    faq: [
      { q: "Are nevoie de cunoștințe de genealogie?", a: "Nu. Se pornește de la ce știe, iar ghidurile gratuite de pe site arată pas cu pas unde se caută actele vechi." },
    ],
    related: ["pentru-tata", "pentru-mama", "pentru-parinti"],
  },
  {
    slug: "zi-de-nastere-bunici", kind: "ocazie", name: "Ziua de naștere a bunicilor",
    title: "Cadou de ziua bunicii sau a bunicului: povestea lor",
    description: "Cadou de ziua de naștere pentru bunica sau bunicul: un an în care viața lor ajunge în arborele familiei, cu poze din tinerețe și glasul lor.",
    h1: "Cadou de ziua de naștere a bunicilor: viața lor, scrisă",
    lead: "La 70, 80 sau 90 de ani, bunicii au văzut o lume care nu mai există. Darul acesta e un an în care viața lor ajunge scrisă și înregistrată, pentru nepoți.",
    why: {
      h2: "De ce la ziua lor",
      p: [
        "La o zi de naștere rotundă, bunicii sunt de obicei înconjurați de familie și se uită înapoi. Întrebările vin de la sine: unde te-ai născut, cum era școala, ce făceau părinții tăi.",
        "Cartea Neamului are și o autobiografie ghidată pentru oamenii în viață: întrebări pe capitole, la care bunicii pot răspunde în scris sau cu glasul, cu ajutorul nepoților.",
      ],
    },
    ideas: {
      h2: "La petrecere",
      items: [
        "Fiecare nepot pune bunicului o întrebare și o înregistrează.",
        "Adunați poze din fiecare deceniu al vieții lui și puneți-le în arbore, în ordine.",
        "Scrieți numele tuturor fraților lui: mulți nepoți nu-și știu unchii mari.",
        "Începeți împreună primul capitol al autobiografiei.",
      ],
    },
    note: "La mulți ani! Ai trăit atâtea lucruri pe care noi nu le știm. Anul acesta ni le spui, și le păstrăm pentru totdeauna.",
    tier: "basic", tierWhy: "Basic ajunge pentru arborele și povestea bunicului sau bunicii.",
    faq: [
      { q: "Ce e autobiografia ghidată?", a: "Un șir de întrebări pe capitole (copilăria, școala, munca, familia), la care omul răspunde în ritmul lui, scris sau înregistrat." },
    ],
    related: ["ziua-bunicilor", "pentru-bunica", "pentru-bunic"],
  },
  {
    slug: "reuniune-de-familie", kind: "ocazie", name: "Reuniune de familie",
    title: "Cadou pentru reuniunea de familie: arborele comun",
    description: "Cadou pentru o reuniune de familie sau o întâlnire a neamului: un arbore comun, în care fiecare rudă invitată adaugă ramura ei, cu poze și povești.",
    h1: "Cadou pentru reuniunea de familie: un arbore la care scrie tot neamul",
    lead: "La o întâlnire a neamului, jumătate din discuții sunt „al cui ești tu?”. Un arbore comun răspunde la întrebare și rămâne după ce se termină ziua.",
    why: {
      h2: "De ce un arbore comun",
      p: [
        "La reuniunile de familie se strâng veri de-al doilea și de-al treilea care nu s-au văzut niciodată. Arborele le arată cum sunt legați și îi lasă pe fiecare să-și adauge ramura, de acasă, în săptămânile de după.",
        "Darul pentru organizator (sau pentru cel mai bătrân din neam) e un an în care arborele crește cu fiecare rudă invitată.",
      ],
    },
    ideas: {
      h2: "Cum organizați ziua",
      items: [
        "Înainte de reuniune, trimiteți invitațiile în arbore, ca fiecare să-și pună ramura.",
        "La întâlnire, arătați arborele pe un ecran și lăsați oamenii să se găsească.",
        "Înregistrați-i pe cei mai în vârstă povestind despre strămoșul comun.",
        "Faceți o poză de grup și puneți-o în arbore, cu data și locul.",
      ],
    },
    note: "Pentru tot neamul nostru: un arbore în care fiecare își pune ramura, ca să știm cum suntem legați.",
    tier: "premium", tierWhy: "Premium are cele mai largi limite de persoane și de rude care scriu: potrivit pentru un neam întreg.",
    faq: [
      { q: "Rudele invitate plătesc ceva?", a: "Cine doar vede arborele nu plătește nimic. Cine vrea să scrie are 7 zile gratuite, fără card; condițiile pentru rudele care scriu sunt pe pagina cu prețuri." },
    ],
    related: ["pentru-familie", "paste", "nunta-de-aur"],
  },
  {
    slug: "cadou-de-ultim-moment", kind: "ocazie", name: "Cadou de ultim moment",
    title: "Cadou de ultim moment, digital, primit imediat",
    description: "Ai uitat de cadou? Un dar digital, primit imediat după plată: o legătură pe WhatsApp sau un card de tipărit acasă, pentru un an în Cartea Neamului.",
    h1: "Cadou de ultim moment: digital, primit pe loc, deloc banal",
    lead: "Magazinele s-au închis, curierul nu mai ajunge, iar petrecerea e diseară. Darul acesta îl cumperi în câteva minute și îl ai imediat: o legătură sau un card pe care îl tipărești acasă.",
    why: {
      h2: "De ce merge chiar și în ultima clipă",
      p: [
        "Nu așteptați nimic prin poștă: după plată primești pe loc legătura darului. O poți trimite pe WhatsApp sau pe email, ori poți tipări un card cu biletul tău și un cod de scanat cu telefonul. Dacă nu ai imprimantă, îl poți salva ca PDF și îl poți arăta pe telefon.",
        "Și totuși nu pare un dar luat în grabă: e un an în care cel care îl primește își pune la un loc familia, pozele și glasurile celor dragi.",
      ],
    },
    ideas: {
      h2: "Cum îl dai în zece minute",
      items: [
        "Cumperi darul și scrii un bilet scurt pentru cel care îl primește.",
        "Tipărești cardul sau îl salvezi ca PDF.",
        "Îl pui într-un plic sau îl trimiți pe telefon.",
        "La petrecere, îi arăți cum se deschide: scanează codul și apasă „Primește anul”.",
      ],
    },
    note: "Știu, l-am cumpărat azi. Dar e despre noi toți: un an să punem familia la un loc.",
    tier: "basic", tierWhy: "Basic e cel mai simplu dar de ultim moment; îl poți alege și pe Familie sau Premium.",
    faq: [
      { q: "Cât de repede primesc darul?", a: "Imediat după plată, pe pagina darurilor tale. Nu așteptați nimic prin poștă." },
      { q: "Legătura expiră?", a: "Nu. Se poate primi o singură dată, de un singur cont, oricând." },
    ],
    related: ["pentru-parinti", "pentru-familie", "pentru-cuplu"],
  },
];

const DESTINATARI: GiftPage[] = [
  {
    slug: "pentru-bunici", kind: "destinatar", name: "Pentru bunici",
    title: "Cadou pentru bunici: povestea și glasul lor, păstrate",
    description: "Cadou pentru bunici care au tot: un an în care își pun neamul, pozele vechi și glasul în arborele familiei, pentru nepoți și strănepoți.",
    h1: "Cadou pentru bunici care „au tot”",
    lead: "Bunicii spun mereu că nu le trebuie nimic. Au dreptate: le trebuie timp cu voi și cineva care să le asculte poveștile. Darul acesta le dă pe amândouă.",
    why: {
      h2: "De ce e un dar bun pentru bunici",
      p: [
        "Bunicii sunt ultima generație care își amintește de străbunici: numele lor, satul, meseria, războaiele prin care au trecut. Când nu mai sunt, aceste lucruri se pierd de cele mai multe ori pentru totdeauna.",
        "Darul nu le cere să învețe ceva greu. Ei povestesc, voi scrieți. Ei vă arată pozele, voi le fotografiați. Glasul lor, înregistrat cu telefonul, rămâne pentru strănepoți.",
      ],
    },
    ideas: {
      h2: "Ce puteți face cu bunicii",
      items: [
        "O seară pe lună de povești: câte un strămoș pe rând.",
        "Fotografiați pozele vechi și puneți fiecăreia nume, an și loc.",
        "Înregistrați un cântec, o rugăciune, o rețetă spusă de bunica.",
        "Lăsați-i să corecteze ce ați scris: ei știu cel mai bine.",
      ],
    },
    note: "Dragi bunici, nu vă trebuie nimic, știm. Dar nouă ne trebuie poveștile voastre. Anul acesta le scriem împreună.",
    tier: "basic", tierWhy: "Basic e suficient pentru arborele bunicilor. Pentru mai mulți nepoți care scriu, Familie.",
    faq: [
      { q: "Bunicii trebuie să folosească telefonul?", a: "Nu neapărat. Contul îl poate ține un nepot sau un copil, care completează împreună cu ei." },
      { q: "Ce se întâmplă cu înregistrările după un an?", a: "Nu se șterge nimic. Arborele rămâne, se vede și se poate descărca; doar adăugările noi cer un an nou. Pentru ca toată familia să vadă în continuare pozele mari și glasurile, există și Păstrarea." },
    ],
    related: ["pentru-bunica", "pentru-bunic", "ziua-bunicilor", "zi-de-nastere-bunici"],
  },
  {
    slug: "pentru-bunica", kind: "destinatar", name: "Pentru bunica",
    title: "Cadou pentru bunica: rețetele, cântecele și poveștile ei",
    description: "Cadou pentru bunica: un an în care glasul ei, cântecele, rețetele și poveștile de familie ajung înregistrate în arborele neamului.",
    h1: "Cadou pentru bunica: glasul ei, pentru totdeauna",
    lead: "Bunica e de multe ori cea care știe toate rudele, toate zilele de naștere și toate poveștile. Darul acesta le păstrează, cu glasul ei.",
    why: {
      h2: "De ce bunica",
      p: [
        "În multe familii, bunica ține minte neamul: cine s-a căsătorit cu cine, cine a plecat în lume, cine a botezat pe cine. Ea știe și numele de fată ale femeilor din familie, care se pierd cel mai ușor din acte.",
        "Mulți nepoți regretă mai târziu că nu au înregistrat-o niciodată cântând sau povestind. Darul acesta e un motiv să o faceți acum.",
      ],
    },
    ideas: {
      h2: "Ce înregistrați cu bunica",
      items: [
        "Un cântec sau o colindă din satul ei.",
        "Rețeta pe care o face doar ea, spusă pas cu pas.",
        "Numele de fată ale mamei și ale bunicii ei.",
        "Povestea nunții ei și poza de atunci.",
      ],
    },
    note: "Bunico, vreau să-ți aud glasul și peste ani. Spune-mi toate poveștile, și le păstrăm aici.",
    tier: "basic", tierWhy: "Basic ajunge pentru arborele și înregistrările bunicii.",
    faq: [
      { q: "Câte înregistrări încap?", a: "Depinde de plan; plafoanele fiecărui plan sunt scrise pe pagina cu prețuri și se schimbă doar din panoul nostru, nu pe ascuns." },
    ],
    related: ["pentru-bunici", "pentru-bunic", "1-martie", "zi-de-nastere-bunici"],
  },
  {
    slug: "pentru-bunic", kind: "destinatar", name: "Pentru bunic",
    title: "Cadou pentru bunic: spița neamului și poveștile lui",
    description: "Cadou pentru bunic: un an în care își urcă spița neamului din tată în tată, își spune poveștile din armată, de la muncă și din sat.",
    h1: "Cadou pentru bunic: spița neamului, spusă de el",
    lead: "Bunicul știe de obicei spița: tatăl lui, bunicul lui, de unde vine numele. Darul acesta îl pune să o spună, iar voi o scrieți.",
    why: {
      h2: "De ce bunicul",
      p: [
        "Bunicii au trecut prin vremuri pe care nepoții le știu doar din cărți: colectivizarea, armata de pe atunci, plecările la oraș. Poveștile lor sunt istoria familiei, dar și o bucată din istoria țării.",
        "Mulți bunici nu vorbesc mult. Arborele le dă un motiv: „bunicule, cum îl chema pe tatăl tău?” deschide de obicei o poveste lungă.",
      ],
    },
    ideas: {
      h2: "Întrebări bune pentru bunic",
      items: [
        "De unde vine numele nostru de familie?",
        "Ce meserie avea tatăl tău? Dar bunicul tău?",
        "Unde ai făcut armata și cum era?",
        "Ce s-a întâmplat cu pământul familiei?",
      ],
    },
    note: "Bunicule, tu știi spița neamului nostru. Spune-ne-o, s-o știe și strănepoții.",
    tier: "basic", tierWhy: "Basic e suficient pentru spița și poveștile bunicului.",
    faq: [
      { q: "Ce facem dacă bunicul nu-și mai amintește numele?", a: "Lăsați locul gol sau scrieți ce se știe. Ghidurile gratuite arată unde se pot căuta numele în actele vechi." },
    ],
    related: ["pentru-bunici", "pentru-bunica", "ziua-tatalui", "pentru-tata"],
  },
  {
    slug: "pentru-mama", kind: "destinatar", name: "Pentru mama",
    title: "Cadou emoțional pentru mama: povestea familiei ei",
    description: "Cadou emoțional pentru mama: un an în care își pune la un loc familia, pozele vechi și amintirile, cu ramura ei pusă la loc de cinste.",
    h1: "Cadou emoțional pentru mama",
    lead: "Pentru mama, cel mai frumos dar e de obicei timpul vostru și interesul pentru ce ține ea minte. Darul acesta le aduce pe amândouă.",
    why: {
      h2: "De ce e un dar care o atinge",
      p: [
        "Mama a păstrat probabil pozele, actele și scrisorile familiei. A ținut minte zilele de naștere ale tuturor. Darul acesta îi arată că știți asta și că vreți să păstrați ce a strâns.",
        "E un dar pe care îl faceți împreună: voi o ajutați cu telefonul, ea vă spune cine e în poze.",
      ],
    },
    ideas: {
      h2: "Cum îl folosiți cu mama",
      items: [
        "O duminică cu albumele pe masă: puneți în arbore câte zece poze.",
        "Întrebați-o despre bunicii ei și înregistrați-o.",
        "Scrieți împreună cum v-a crescut: un capitol în autobiografia ei.",
        "Dacă stați departe, completați arborele în timp ce vorbiți la telefon.",
      ],
    },
    note: "Mamă, tu ai păstrat tot. Acum păstrăm împreună, pentru copiii noștri.",
    tier: "basic", tierWhy: "Basic e de ajuns pentru mama. Dacă scriu și frații, alegeți Familie.",
    faq: [
      { q: "O pot ajuta de la distanță?", a: "Da. Puteți fi amândoi în același arbore: ea adaugă de pe telefonul ei, voi de pe al vostru, și vedeți imediat ce a scris celălalt." },
    ],
    related: ["8-martie", "ziua-mamei", "pentru-parinti", "pentru-tata"],
  },
  {
    slug: "pentru-tata", kind: "destinatar", name: "Pentru tata",
    title: "Cadou pentru tata care are tot: neamul lui",
    description: "Cadou pentru tata care spune că nu-i trebuie nimic: un an în care își urcă neamul din tată în tată și își pune la loc pozele și actele vechi.",
    h1: "Cadou pentru tata care „are tot”",
    lead: "Tații sunt cei mai greu de surprins cu un cadou. Unul care îi pune întrebări despre tatăl și bunicul lui îi place de obicei mai mult decât arată.",
    why: {
      h2: "De ce merge la tata",
      p: [
        "Mulți tați au în sertar acte vechi: livretul militar al bunicului, un act de proprietate, o diplomă. Darul acesta le dă un loc lângă oamenii cărora le-au aparținut.",
        "Spița neamului din tată în tată, pe numele lui, e de obicei partea care îl prinde cel mai repede.",
      ],
    },
    ideas: {
      h2: "Cu ce începeți",
      items: [
        "Fotografiați actele vechi din casă și puneți-le în arbore.",
        "Întrebați-l despre tatăl lui și despre satul bunicilor.",
        "Căutați numele lui de familie pe pagina numelor: ce înseamnă și unde e frecvent.",
        "Plănuiți o zi în satul bunicilor, cu arborele pe telefon.",
      ],
    },
    note: "Tată, ai de toate. Dar povestea neamului nostru, scrisă de tine, încă nu o avem.",
    tier: "basic", tierWhy: "Basic e suficient pentru tata. Dacă ajută și frații lui, alegeți Familie.",
    faq: [
      { q: "Se pot pune acte vechi, nu doar poze?", a: "Da, actele se pot fotografia și pune lângă persoana căreia îi aparțin, în limitele planului." },
    ],
    related: ["ziua-tatalui", "pentru-bunic", "pensionare", "pentru-parinti"],
  },
  {
    slug: "pentru-parinti", kind: "destinatar", name: "Pentru părinți",
    title: "Cadou pentru părinți: arborele familiei, împreună",
    description: "Cadou pentru părinți, de Crăciun, la aniversare sau fără motiv: un an în care își pun la un loc ambele neamuri, cu pozele și glasurile bunicilor.",
    h1: "Cadou pentru părinți: cele două neamuri ale lor, într-un arbore",
    lead: "Părinții voștri vin din două familii, poate din două regiuni diferite. Darul acesta îi pune să le scrie pe amândouă, una lângă alta, cu voi la mijloc.",
    why: {
      h2: "De ce pentru părinți",
      p: [
        "Părinții sunt puntea dintre voi și bunici. Ei încă își amintesc de bunicii lor, pe care voi poate nu i-ați cunoscut. Darul acesta e un an în care pun în scris ce știu, înainte să se uite.",
        "E și un dar pe care îl împărțiți: ei completează, voi adăugați pozele voastre, iar copiii voștri văd de unde vin.",
      ],
    },
    ideas: {
      h2: "Cum îl folosiți",
      items: [
        "Fiecare părinte își completează ramura, cu părinții și bunicii lui.",
        "Puneți poza lor de la nuntă și pe cele cu voi copii.",
        "Înregistrați-i povestind cum s-au cunoscut.",
        "Arătați-le harta: satele din care vin cele două familii.",
      ],
    },
    note: "Dragi părinți, voi știți de unde venim. Anul acesta scrieți-ne și nouă, cu poze și cu glasul vostru.",
    tier: "familie", tierWhy: "Familie lasă ambii părinți și copiii să scrie în același arbore.",
    faq: [
      { q: "Pot da darul de Crăciun?", a: "Da. Pagina de Crăciun are toți pașii; legătura nu expiră, așa că o puteți cumpăra din timp." },
    ],
    related: ["pentru-mama", "pentru-tata", "nunta-de-aur", "pentru-socri"],
  },
  {
    slug: "pentru-socri", kind: "destinatar", name: "Pentru socri",
    title: "Cadou inspirat pentru socri: neamul lor, în arbore",
    description: "Cadou inspirat pentru socri: un an în care își pun neamul în arbore, iar nepoții află de unde vine cealaltă jumătate a familiei lor.",
    h1: "Cadou inspirat pentru socri",
    lead: "Cadoul pentru socri e de obicei cel mai greu: vrei să arate că îți pasă, fără să fie prea personal. Interesul pentru familia lor face exact asta.",
    why: {
      h2: "De ce merge la socri",
      p: [
        "Copiii voștri au două neamuri. Darul acesta le arată socrilor că vreți ca nepoții să-l știe și pe al lor: bunicii, satul, poveștile.",
        "Socrii simt de obicei că darul e și pentru ei, și pentru nepoți. E un gest care apropie familiile.",
      ],
    },
    ideas: {
      h2: "Cum îl dați",
      items: [
        "Tipăriți cardul cu un bilet din partea nepoților.",
        "La următoarea vizită, rugați-i să povestească despre părinții lor.",
        "Puneți-i pe nepoți să-i întrebe și să înregistreze.",
        "Legați arborele lor de al vostru, ca nepoții să vadă ambele familii.",
      ],
    },
    note: "Dragi socri, nepoții vor să știe și de unde veniți voi. Ne povestiți?",
    tier: "basic", tierWhy: "Basic e de ajuns pentru arborele socrilor.",
    faq: [
      { q: "Arborele lor se poate lega de al nostru?", a: "Da. Se pot invita reciproc, iar copiii apar în ambele familii." },
    ],
    related: ["pentru-parinti", "pentru-bunici", "pentru-nasi"],
  },
  {
    slug: "pentru-nasi", kind: "destinatar", name: "Pentru nași",
    title: "Cadou pentru nași: o legătură care se păstrează",
    description: "Cadou pentru nași, la nuntă, la botez sau la o aniversare: un an în care își pun neamul în arbore, cu finii lor la locul lor în poveste.",
    h1: "Cadou pentru nași",
    lead: "Nașii sunt familie fără să fie rude de sânge. În multe neamuri, legătura de nășie trece din generație în generație. Darul acesta o pune în scris.",
    why: {
      h2: "De ce pentru nași",
      p: [
        "La noi, nășia e o legătură serioasă, care leagă familii pentru zeci de ani. Mulți nași au la rândul lor nași care i-au cununat sau botezat pe ei, iar uneori aceleași familii se nășesc de trei generații.",
        "Un an în Cartea Neamului e un dar care le arată nașilor că le prețuiți familia și povestea, nu doar ajutorul.",
      ],
    },
    ideas: {
      h2: "Idei",
      items: [
        "Pe card, un bilet de la fini, cu poza de la nuntă sau de la botez.",
        "Rugați-i să povestească de nașii lor.",
        "Puneți în arbore pozele de la cununiile și botezurile la care au fost nași.",
        "Dacă familiile voastre se nășesc de mai multe generații, scrieți-o.",
      ],
    },
    note: "Dragi nași, sunteți parte din povestea noastră. Vrem să o știm și pe a voastră.",
    tier: "basic", tierWhy: "Basic e un dar potrivit pentru nași.",
    faq: [
      { q: "E potrivit ca dar de mulțumire după nuntă?", a: "Da. Îl puteți da oricând: legătura nu expiră, iar anul începe când nașii o primesc." },
    ],
    related: ["botez", "pentru-socri", "aniversare-casatorie"],
  },
  {
    slug: "pentru-cuplu", kind: "destinatar", name: "Pentru cuplu",
    title: "Cadou pentru cuplu: arborele celor două familii",
    description: "Cadou pentru cuplu, proaspăt căsătoriți sau de mult împreună: arborele comun al celor două familii, cu pozele și poveștile ambelor neamuri.",
    h1: "Cadou pentru cuplu: două familii, un singur arbore",
    lead: "Când doi oameni își unesc viețile, își unesc și neamurile. Darul acesta le dă un loc unde cele două familii stau una lângă alta.",
    why: {
      h2: "De ce pentru un cuplu",
      p: [
        "Un cuplu tânăr are de obicei părinți și bunici în viață pe ambele părți. E momentul ideal să le scrie poveștile, înainte să vină copiii și grijile.",
        "Pentru un cuplu de mult împreună, arborele comun e o cale de a privi înapoi: nunta, copiii, casele, oamenii care i-au ajutat.",
      ],
    },
    ideas: {
      h2: "Cum îl folosesc",
      items: [
        "Fiecare își scrie ramura, apoi le citesc una alteia.",
        "Pun poza de la nuntă și pe ale părinților de la nunțile lor.",
        "Își invită părinții să completeze.",
        "Notează satele din care vin familiile și plănuiesc o vizită.",
      ],
    },
    note: "Pentru voi doi: două familii care de acum sunt una. Un loc pentru povestea amândurora.",
    tier: "basic", tierWhy: "Basic e potrivit pentru un cuplu; Familie dacă vor să scrie și părinții.",
    faq: [
      { q: "E potrivit ca dar de nuntă?", a: "Da, mai ales dacă îl însoțiți de un bilet. Legătura nu expiră, așa că mirii îl pot primi după luna de miere." },
    ],
    related: ["aniversare-casatorie", "nunta-de-argint", "pentru-nasi"],
  },
  {
    slug: "pentru-familie", kind: "destinatar", name: "Pentru toată familia",
    title: "Cadou personalizat pentru familie: arborele neamului",
    description: "Cadou personalizat pentru toată familia: un arbore comun în care fiecare rudă scrie ce știe, cu pozele, actele și glasurile celor dragi.",
    h1: "Cadou personalizat pentru familie",
    lead: "Un dar „personalizat” poartă de obicei un nume gravat. Acesta poartă numele întregului neam, scris de familie.",
    why: {
      h2: "De ce e personalizat cu adevărat",
      p: [
        "Nu există doi arbori la fel. Ce primește familia nu e un obiect cu numele ei, ci locul în care își scrie singură povestea: oamenii, satele, pozele, vocile.",
        "Fiecare rudă poate fi invitată să adauge ramura ei. Cine doar vrea să vadă nu plătește nimic, pe niciun plan.",
      ],
    },
    ideas: {
      h2: "Cum crește arborele",
      items: [
        "Cel care primește darul pornește arborele de la el și de la părinți.",
        "Invită frații, verii și unchii să adauge ce știu.",
        "Fiecare pune poze din casa lui.",
        "Cei mai în vârstă își înregistrează poveștile.",
      ],
    },
    note: "Pentru familia noastră: un loc al tuturor, în care fiecare scrie ce știe.",
    tier: "familie", tierWhy: "Familie e gândit pentru o familie mare, cu mai multe rude care scriu.",
    faq: [
      { q: "Poate fi văzut de toată familia fără plată?", a: "Da. Cine doar vede arborele nu plătește nimic. Condițiile pentru cine scrie sunt pe pagina cu prețuri." },
    ],
    related: ["reuniune-de-familie", "pentru-parinti", "paste"],
  },
];

export const GIFT_PAGES: GiftPage[] = [...OCAZII, ...DESTINATARI];
export const giftPage = (slug: string) => GIFT_PAGES.find((p) => p.slug === slug) ?? null;

/** Ocaziile din hub, cu Crăciunul (pagina de dinainte) ca ocazie proprie. */
export type HubOccasion = { key: SeasonKey | null; name: string; path: string; text: string };
export const CHRISTMAS: HubOccasion = {
  key: "craciun", name: "Crăciun", path: CHRISTMAS_PATH,
  text: "Darul de Crăciun pentru părinți și bunici: un an în Cartea Neamului, dat la masa de sărbători.",
};

/** Numărul de cuvinte proprii ale paginii (fără șablonul comun), pentru filtrul de calitate. */
export function giftWords(p: GiftPage): number {
  const text = [p.h1, p.lead, p.why.h2, ...p.why.p, ...(p.more ? [p.more.h2, ...p.more.p] : []), p.ideas.h2, ...p.ideas.items, p.note, p.tierWhy, ...p.faq.flatMap((f) => [f.q, f.a])].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * A doua parte a fiecărei pagini: ce rămâne după anul dăruit, spus pe ocazia sau persoana paginii, plus o întrebare în plus.
 * Ținută separat ca textul de bază să rămână ușor de citit; se adaugă la pagini mai jos.
 */
const EXTRA: Record<string, { h2: string; p: string[]; faq?: Faq }> = {
  "ziua-bunicilor": {
    h2: "Ce rămâne după un an",
    p: [
      "La sfârșitul anului, familia are un arbore în care bunicii nu mai sunt doar „bunica și bunicul”, ci oameni cu nume întregi, cu părinți, frați și sate de unde au plecat. Lângă ei stau pozele din tinerețe și câteva înregistrări cu glasul lor, pe care nepoții le pot asculta oricând, de pe telefon.",
      "Multe familii descoperă în timpul acesta rude despre care nu știau: un frate al bunicului plecat în America, o soră a bunicii măritată în alt județ. Arborele îi leagă pe toți și, dacă vreți, îi puteți invita să completeze.",
      "Iar bunicii simt că ce au trăit contează. Pentru mulți, asta e partea cea mai frumoasă a darului.",
    ],
    faq: { q: "Pot nepoții să completeze în locul bunicilor?", a: "Da. Contul poate fi al unui nepot; bunicii povestesc, iar nepotul scrie și înregistrează." },
  },
  paste: {
    h2: "De la masa de Paște la arhivă",
    p: [
      "Ce aflați la masă e începutul. Când știți satul și numele străbunicilor, puteți căuta mai departe actele lor: registrele parohiale, actele de stare civilă, recensămintele vechi. Ghidurile gratuite de pe site arată pas cu pas unde se găsesc și cum se cer.",
      "Paștele are și avantajul că revine în fiecare an. Anul viitor, la aceeași masă, puteți arăta ce ați aflat între timp: o poză găsită la o mătușă, un act vechi, un străbunic despre care nu știa nimeni.",
    ],
    faq: { q: "Trebuie să știm multe ca să începem?", a: "Nu. E de ajuns să știți părinții și bunicii. Restul se adaugă pe rând, de la fiecare rudă care își amintește ceva." },
  },
  "1-martie": {
    h2: "De ce un dar pentru femeile din familie",
    p: [
      "În actele vechi, femeile apar mai greu: își schimbau numele la căsătorie, iar ramura lor se pierde după o generație sau două. De aceea numele de fată al mamei, al bunicii și al străbunicii sunt printre cele mai prețioase lucruri pe care le puteți scrie în arbore.",
      "1 Martie e începutul primăverii și un prilej bun să le întrebați pe mama și pe bunica de unde vin ele, nu doar familia în care au intrat prin căsătorie. Pe site găsiți și un ghid despre cum afli numele de fată al bunicii din acte.",
    ],
    faq: { q: "Se poate dărui unei prietene, nu doar mamei?", a: "Da. Darul e pentru oricine își face un cont; anul începe când îl primește." },
  },
  "8-martie": {
    h2: "Povestea ei, pentru nepoți",
    p: [
      "Copiii știu de obicei ce face mama acum, dar puțin despre cine era înainte: unde a crescut, cum o chema pe învățătoarea ei, ce voia să devină. În Cartea Neamului poate scrie o autobiografie ghidată, cu întrebări pe capitole, la care răspunde în scris sau cu vocea, în ritmul ei.",
      "Peste ani, nepoții ei vor putea asculta cum își povestește copilăria. E genul de dar care crește în valoare cu fiecare an care trece.",
    ],
    faq: { q: "Ce e autobiografia ghidată?", a: "Un șir de întrebări pe capitole (copilăria, școala, munca, familia), la care omul răspunde când are timp, în scris sau înregistrat." },
  },
  "ziua-mamei": {
    h2: "Ramura mamei, pusă la loc",
    p: [
      "Când se face un arbore, de obicei se urcă pe numele tatălui. Ramura mamei rămâne scurtă: un nume de fată, poate un sat. Darul acesta e un prilej să o urcați și pe ea câteva generații, cu ajutorul mamei și al rudelor ei.",
      "Dacă rudele mamei sunt răspândite prin țară sau în străinătate, le puteți invita în arbore. Fiecare adaugă ce știe, iar mama vede cum neamul ei crește la loc.",
    ],
    faq: { q: "Rudele mamei pot vedea arborele fără cont plătit?", a: "Da. Cine doar vede arborele nu plătește nimic; condițiile pentru cine scrie sunt pe pagina cu prețuri." },
  },
  "ziua-tatalui": {
    h2: "Numele lui, înapoi în timp",
    p: [
      "Pe site există pagini pentru sute de nume de familie românești: ce înseamnă, de unde vin și în ce regiuni sunt mai frecvente. Pentru un tată curios, e un punct de plecare bun: află ce spune numele lui, apoi îl urcă în arbore din tată în tată.",
      "Când ajungeți la generațiile de dinainte de 1900, actele vechi sunt de obicei în arhivele județene sau în registrele parohiale. Ghidurile gratuite arată cum le cereți; arborele ține minte ce ați găsit și de unde.",
    ],
    faq: { q: "Putem urca și pe linia mamei lui?", a: "Da. Fiecare își alege ramurile pe care le urmărește; spița pe numele de familie e doar una dintre ele." },
  },
  "nunta-de-aur": {
    h2: "O poveste de cincizeci de ani, pe ani",
    p: [
      "Arborele nu e doar o listă de nume. Fiecare persoană are o pagină cu poze, întâmplări și înregistrări, iar familia poate vedea pe o hartă locurile prin care a trecut neamul: satul în care s-au născut cei doi, orașul în care s-au mutat, casele copiilor.",
      "Pentru o nuntă de aur, asta înseamnă că povestea celor cincizeci de ani poate fi spusă în ordine: anul nunții, nașterea fiecărui copil, nunțile copiilor, nepoții. Fiecare rudă adaugă bucata pe care o știe, iar la final povestea e a tuturor.",
    ],
  },
  "nunta-de-argint": {
    h2: "Ce aflați despre voi înșivă",
    p: [
      "Mulți soți descoperă abia când fac arborele că familiile lor au trecut prin aceleași lucruri: bunici plecați la oraș în aceiași ani, străbunici care au luptat pe același front, sate aflate la câțiva kilometri unul de altul.",
      "La 25 de ani de căsnicie, arborele comun e și un dar pentru copii: le arată cele două neamuri din care vin, cât încă pot pune întrebări bunicilor. Copiii pot fi invitați să scrie și ei.",
    ],
    faq: { q: "Poate fi o surpriză?", a: "Da. Darul se cumpără din contul vostru, iar cei doi îl primesc doar când deschid legătura sau scanează codul de pe card." },
  },
  "aniversare-casatorie": {
    h2: "Un an în care vă cunoașteți familiile",
    p: [
      "Chiar și după mulți ani împreună, puțini soți știu numele bunicilor celuilalt sau satul străbunicilor. Arborele comun e o cale liniștită de a afla: fiecare întreabă în familia lui, apoi vă arătați ce ați găsit.",
      "Puteți adăuga și momentele voastre: data cununiei civile și religioase, nașii, prima casă, nașterea copiilor. Peste ani, aniversarea următoare are deja o poveste întreagă la care să vă uitați împreună.",
      "Dacă darul e pentru părinții voștri, aniversarea e un prilej să-i rugați să povestească, iar voi să scrieți.",
    ],
    faq: { q: "Pot dărui un an pe un plan mai mare?", a: "Da. Puteți alege Basic, Familie sau Premium; prețurile sunt pe pagină și pe pagina cu prețuri." },
  },
  botez: {
    h2: "Pentru când copilul va întreba „de unde venim?”",
    p: [
      "Fiecare copil ajunge să întrebe, la un moment dat, de unde vine familia lui. Peste zece sau cincisprezece ani, răspunsul poate fi gata: un arbore cu numele străbunicilor, satele lor, poze și înregistrări cu vocile celor care l-au ținut în brațe la botez.",
      "Pentru familiile despărțite de distanță, cu bunici în țară și părinți în străinătate, arborele e și un loc comun în care fiecare parte a familiei adaugă ce știe, de oriunde.",
    ],
  },
  pensionare: {
    h2: "Un proiect care leagă generațiile",
    p: [
      "Genealogia e una dintre puținele pasiuni care aduc împreună toată familia: pensionarul caută, copiii ajută cu tehnologia, nepoții pun întrebări. Mulți descoperă că le place să meargă prin arhive, să citească registre vechi și să descifreze scrisul de mână de acum o sută de ani.",
      "Pe site sunt ghiduri gratuite despre actele de stare civilă, registrele parohiale, catagrafii și conscripții, plus un glosar cu termenii din actele vechi. Arborele ține minte ce s-a găsit și de unde, ca munca să nu se piardă.",
    ],
  },
  "zi-de-nastere-bunici": {
    h2: "O lume care nu mai există",
    p: [
      "Un bunic de 85 de ani s-a născut într-o țară foarte diferită de cea de azi. A văzut războiul sau anii de după, colectivizarea, mutarea la oraș, schimbarea banilor. Ce povestește el despre toate acestea nu se găsește în nicio carte de istorie: e istoria familiei voastre.",
      "Darul de ziua lui e un an în care aceste povești ajung înregistrate și legate de oamenii și locurile despre care vorbește. Nepoții le pot asculta de pe telefon, oricând, chiar și peste mulți ani.",
    ],
  },
  "reuniune-de-familie": {
    h2: "După reuniune, arborele continuă",
    p: [
      "O reuniune durează o zi. Arborele comun durează mult mai mult: verii care s-au cunoscut la întâlnire își pot adăuga copiii, pozele și poveștile ani la rând. Data viitoare când vă adunați, aveți deja de unde porni.",
      "Pe site găsiți și pagina „Din aceleași locuri”, care arată familii cu rădăcini în același sat, și o hartă a neamului. La o reuniune, ele ajută să vedeți dintr-o privire de unde a pornit fiecare ramură.",
    ],
    faq: { q: "Câte rude pot scrie în arbore?", a: "Depinde de plan; numărul de rude care scriu e trecut la fiecare plan, pe pagina cu prețuri." },
  },
  "cadou-de-ultim-moment": {
    h2: "De ce nu pare un cadou de ultim moment",
    p: [
      "Un cadou de ultim moment e de obicei ceva generic: o sticlă, un parfum, o carte luată din raft. Darul acesta e despre familia celui care îl primește, așa că nu poate fi generic, oricât de târziu l-ai cumpărat.",
      "Dacă vrei să-l faci mai personal, pune în bilet o amintire comună sau numele unui bunic. Iar dacă ai cinci minute în plus, adaugă tu primele persoane în arbore înainte să-l dai: părinții, bunicii, o poză veche.",
    ],
  },
  "pentru-bunici": {
    h2: "Ce aflați de la bunici",
    p: [
      "Bunicii știu lucruri pe care nu le mai știe nimeni: porecla străbunicului, de ce s-a mutat familia dintr-un sat în altul, cine a murit în război și unde e îngropat. Uneori știu și unde sunt actele vechi: în pod, într-o ladă, la un văr.",
      "Toate acestea pot fi scrise lângă oamenii despre care vorbesc. Pe site găsiți și un ghid cu întrebări pentru bunici și unul despre cum le înregistrați glasul, ca prima discuție să meargă ușor.",
    ],
  },
  "pentru-bunica": {
    h2: "Ce știe doar bunica",
    p: [
      "Bunica știe de obicei cum se chema fiecare femeie din familie înainte de căsătorie, cine cu cine a fost cumetru și ce s-a întâmplat cu rudele plecate. Știe și obiceiurile: cum se făcea o nuntă în satul ei, ce se gătea de sărbători, ce cântece se cântau la clacă.",
      "În arbore, toate acestea își găsesc loc: numele în căsuțele lor, poveștile pe paginile persoanelor, cântecele ca înregistrări. Nepoții care vor să păstreze rețetele sau cântecele ei le vor avea cu glasul ei.",
    ],
    faq: { q: "Bunica locuiește în alt oraș. Merge?", a: "Da. Puteți completa împreună la telefon sau când o vizitați; arborele e același de oriunde îl deschideți." },
  },
  "pentru-bunic": {
    h2: "Ce poate afla familia din poveștile lui",
    p: [
      "Poveștile bunicului sunt adesea pline de indicii pentru căutările în arhive: numele satului în care a făcut armata, regimentul tatălui lui, anul în care familia și-a pierdut pământul. Scrise în arbore, aceste detalii devin puncte de plecare pentru căutări în actele vechi.",
      "Pe site găsiți ghiduri despre actele militare, despre listele de pierderi din războaie și despre registrele parohiale. Cu informațiile de la bunic, căutarea are de unde porni.",
      "Chiar dacă nu mergeți niciodată la arhivă, înregistrările lui rămân pentru nepoți.",
    ],
    faq: { q: "Se pot pune în arbore și fotografii cu acte militare?", a: "Da. Actele se pot fotografia și pune lângă persoana căreia îi aparțin, în limitele planului." },
  },
  "pentru-mama": {
    h2: "Un dar pe care îl faceți împreună",
    p: [
      "Mulți spun că cel mai frumos lucru la darul acesta nu e arborele în sine, ci serile petrecute cu mama la albume. Ea își amintește de oameni pe care voi nu i-ați cunoscut, iar voi aflați lucruri despre ea pe care nu le știați.",
      "Arborele păstrează tot ce ați aflat: pozele cu nume și ani, poveștile, înregistrările. Dacă aveți frați, îi puteți invita, ca fiecare să adauge ce își amintește din copilărie.",
      "Peste ani, copiii voștri vor putea vedea cine a fost bunica lor înainte să fie bunică.",
    ],
    faq: { q: "Pot dărui un an pe Familie, ca să scriem și noi, frații?", a: "Da. Familie lasă mai multe rude să scrie în același arbore; prețul fiecărui plan e pe pagină." },
  },
  "pentru-tata": {
    h2: "Ce poate descoperi",
    p: [
      "Mulți tați se apucă de arbore „doar să vadă” și nu se mai opresc: găsesc un străbunic în registrele parohiale, un nume de sat pe o hartă veche, o rudă îndepărtată care are o poză pe care nu o mai avea nimeni.",
      "Pe site găsiți ghiduri gratuite despre arhive, registre și acte vechi, plus pagini despre sute de nume de familie și despre toate județele. Arborele ține minte ce a găsit și de unde, ca să poată reveni oricând.",
      "Și poate, într-o zi, merge cu nepoții în satul de unde vine numele lor.",
    ],
    faq: { q: "Are nevoie de calculator?", a: "Nu. Merge și de pe telefon; pentru scanat poze vechi e de ajuns camera telefonului." },
  },
  "pentru-parinti": {
    h2: "Ce rămâne pentru nepoți",
    p: [
      "Părinții voștri sunt bunicii copiilor voștri. Ce scriu acum despre familia lor, nepoții vor citi peste ani: cine au fost străbunicii, din ce sate vin, ce meserii aveau, ce au trăit.",
      "Arborele e același pentru toată familia. Fiecare își vede ramurile lui: copiii voștri văd ambele familii ale lor, iar părinții voștri își văd tot neamul, cu voi și cu nepoții la locul vostru.",
      "Iar dacă un an nu ajunge, nimic nu se pierde: arborele rămâne, se vede și se poate descărca.",
    ],
  },
  "pentru-socri": {
    h2: "Două familii, un singur arbore pentru nepoți",
    p: [
      "Mulți copii știu bine familia unui părinte și foarte puțin pe a celuilalt. Darul acesta echilibrează lucrurile: socrii își scriu neamul, iar nepoții îl văd la fel de clar ca pe celălalt.",
      "E și un prilej bun de discuție la masă, fără subiecte grele: socrii povestesc despre părinții lor, despre satul lor, despre cum era când erau tineri. Iar voi arătați că vă interesează familia lor, nu doar ce ați primit de la ea.",
      "Biletul de pe card poate fi semnat de nepoți, ca darul să vină și din partea lor.",
    ],
    faq: { q: "Socrii nu vorbesc română bine. Merge?", a: "Site-ul are mai multe limbi, între care engleza, maghiara și germana. Fiecare își alege limba din colțul de sus." },
  },
  "pentru-nasi": {
    h2: "Nășia, scrisă în arbore",
    p: [
      "În multe sate, nășia lega familii întregi: cine i-a cununat pe bunici le-a botezat apoi copiii și le-a cununat nepoții. Aceste legături se pierd ușor, pentru că nu apar în actele de stare civilă.",
      "În arbore, nașii pot fi adăugați ca persoane, cu povestea nășiei scrisă pe pagina lor și cu pozele de la cununie și de la botez. Darul pentru nași e și un mod de a le spune că fac parte din povestea voastră, nu doar din ziua nunții.",
      "Iar nașii pot afla, la rândul lor, de unde vine propriul lor neam.",
    ],
    faq: { q: "Putem pune nașii în arborele nostru?", a: "Da. Îi puteți adăuga ca persoane în arbore și puteți scrie în povestea paginii lor pe cine au cununat sau botezat, cu pozele de atunci." },
  },
  "pentru-cuplu": {
    h2: "Un început bun pentru o familie nouă",
    p: [
      "Un cuplu care își face arborele la început are un avantaj: îl poate completa pe măsură ce familia crește. Primul copil, botezul, prima casă, toate se adaugă pe rând, iar peste ani copiii găsesc povestea scrisă de la început.",
      "Pentru un cuplu căsătorit de mult, arborele e o cale de a privi înapoi împreună: pozele de la nuntă, părinții care nu mai sunt, prietenii și nașii care i-au însoțit.",
      "Oricare ar fi povestea lor, darul le dă un loc în care să o țină.",
    ],
    faq: { q: "Pot dărui anul mirilor, fără să știu dacă au cont?", a: "Da. Legătura merge pentru oricine își face un cont; anul începe când îl primesc." },
  },
  "pentru-familie": {
    h2: "Ce face arborele pentru o familie mare",
    p: [
      "În familiile mari, fiecare știe o bucată: o mătușă știe ramura bunicii, un unchi are pozele de la țară, un văr din străinătate are actele străbunicului. Arborele comun le pune la un loc fără ca cineva să adune totul de mână.",
      "Fiecare persoană din arbore are pagina ei, cu poze, întâmplări și înregistrări. Familia poate vedea pe hartă satele din care vine, iar spițele neamului pe fiecare ramură, din tată în tată.",
      "Iar pentru cine vrea și o carte, cartea familiei în PDF se face din aceleași date, cumpărată separat.",
    ],
  },
};

for (const p of GIFT_PAGES) {
  const x = EXTRA[p.slug];
  if (!x) continue;
  p.more = { h2: x.h2, p: x.p };
  if (x.faq) p.faq = [...p.faq, x.faq];
}
