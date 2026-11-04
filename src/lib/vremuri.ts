/**
 * Povestea vremurilor: în ce lume s-a născut cineva și ce a trăit, după anul și locul nașterii.
 * Totul e scris de mână, în română, pe ținuturi istorice și pe epoci, fără inteligență artificială și fără costuri.
 * Ținuturile au avut istorii diferite până la 1918 (Ardealul sub Habsburgi și apoi sub Ungaria, Principatele sub turci,
 * Bucovina sub Austria, Basarabia sub Rusia, Dobrogea sub otomani), așa că și poveștile diferă.
 */

/** Ținutul istoric, după județ (sau țară pentru cei născuți în afara României). */
export type Area = "ardeal" | "bucovina" | "regat" | "dobrogea" | "basarabia" | "lume";
export type Tone = "bine" | "greu" | "schimbare";
export type HistEvent = { year: number; to?: number; text: string; tone: Tone; areas: Area[]; counties?: string[]; weight?: 1 | 2 | 3 };
export type Era = { from: number; to: number; name: string; life: Partial<Record<Area | "*", string>> };
export type Origin = {
  area: Area;
  region: string; // „Transilvania”, „Banat”, „Moldova”, „Italia”
  county?: string; // codul județului: „CJ”
  place: string; // cum e scris în fișă: „Huedin”
  /** Locul e luat de la o rudă apropiată, fiindcă fișa nu are locul nașterii. */
  guess?: string;
};

/** Județul de azi → ținutul istoric și numele lui. Satu Mare și Bihorul au fost tot sub Ungaria, ca Ardealul. */
const COUNTY_REGION: Record<string, [Area, string]> = {
  AB: ["ardeal", "Transilvania"], BV: ["ardeal", "Transilvania"], CJ: ["ardeal", "Transilvania"], CV: ["ardeal", "Transilvania"], HR: ["ardeal", "Transilvania"],
  HD: ["ardeal", "Transilvania"], MS: ["ardeal", "Transilvania"], SB: ["ardeal", "Transilvania"], SJ: ["ardeal", "Transilvania"], BN: ["ardeal", "Transilvania"],
  MM: ["ardeal", "Maramureș"], SM: ["ardeal", "Sătmar"], BH: ["ardeal", "Crișana"], AR: ["ardeal", "Crișana"], TM: ["ardeal", "Banat"], CS: ["ardeal", "Banat"],
  SV: ["bucovina", "Bucovina"],
  BC: ["regat", "Moldova"], BT: ["regat", "Moldova"], GL: ["regat", "Moldova"], IS: ["regat", "Moldova"], NT: ["regat", "Moldova"], VS: ["regat", "Moldova"], VN: ["regat", "Moldova"],
  AG: ["regat", "Muntenia"], B: ["regat", "Muntenia"], BR: ["regat", "Muntenia"], BZ: ["regat", "Muntenia"], CL: ["regat", "Muntenia"], DB: ["regat", "Muntenia"],
  GR: ["regat", "Muntenia"], IL: ["regat", "Muntenia"], IF: ["regat", "Muntenia"], PH: ["regat", "Muntenia"], TR: ["regat", "Muntenia"],
  DJ: ["regat", "Oltenia"], GJ: ["regat", "Oltenia"], MH: ["regat", "Oltenia"], OT: ["regat", "Oltenia"], VL: ["regat", "Oltenia"],
  CT: ["dobrogea", "Dobrogea"], TL: ["dobrogea", "Dobrogea"],
};
export function regionOfCounty(code: string | null | undefined): [Area, string] | null {
  return code ? COUNTY_REGION[code] ?? null : null;
}
/** Ținutul pentru o țară (codul ei): Republica Moldova e Basarabia, restul e „lumea largă”. */
export function areaOfCountry(cc: string): Area | null {
  return cc === "RO" ? null : cc === "MD" ? "basarabia" : "lume";
}

/** Nordul Ardealului dat Ungariei în 1940 (județele care au fost în cea mai mare parte acolo). */
const NORD = ["CJ", "SJ", "BH", "SM", "MM", "BN", "MS", "HR", "CV"];
const MOLDOVA = ["BC", "BT", "GL", "IS", "NT", "VS", "VN", "SV"];
const RO: Area[] = ["ardeal", "bucovina", "regat", "dobrogea"];
const ALL: Area[] = [...RO, "basarabia"];
const WORLD: Area[] = [...ALL, "lume"];

export const ERAS: Era[] = [
  {
    from: 0, to: 1699, name: "Vremurile vechi",
    life: {
      "*": "Aproape toți oamenii trăiau la sat, din pământ și din vite, după rânduiala bisericii și a anotimpurilor. Cei mai mulți erau țărani legați de moșia unui boier sau a unui nobil: lucrau zile pe an pentru stăpân și dădeau dijmă din recoltă. Războaiele dintre turci, Habsburgi, poloni și tătari treceau des peste sate, iar ciuma și foametea veneau la câțiva ani o dată. Puțini știau carte; preotul și dascălul bisericii erau aproape singurii.",
      ardeal: "Ardealul era un principat cu principele lui, dator cu tribut sultanului. Țara o conduceau nobilii unguri, sașii și secuii; românii, deși cei mai mulți, nu erau socotiți o „națiune” cu drepturi și trăiau aproape toți ca iobagi pe moșiile nobililor. Viața se ducea la sat, în jurul bisericii de lemn, cu munca pe pământul stăpânului și cu pribegii când veneau oștile.",
      lume: "Lumea era încă una a satelor și a regatelor: cei mai mulți oameni munceau pământul, călătoreau puțin și trăiau după rânduiala bisericii. Războaiele, ciuma și foametea treceau des peste ei.",
    },
  },
  {
    from: 1700, to: 1820, name: "Veacul stăpânirilor străine",
    life: {
      "*": "Ținuturile românești erau împărțite între marile imperii. Țăranii trăiau din puțin, în case de lemn sau de chirpici, cu clacă la boier și dări mari. Războaiele ruso-turce și austro-turce treceau prin sate, iar ciuma și holera secerau oameni. Școli erau foarte puține, mai ales pe lângă mănăstiri.",
      ardeal: "Ardealul trecuse sub Habsburgi, iar Viena îl conducea prin nobilimea locală. Românii erau aproape toți iobagi: lucrau pentru nobil zile întregi pe săptămână și nu puteau pleca de pe moșie fără voie. Unirea cu Biserica Romei (1700) a adus primele școli românești la Blaj, iar de acolo au ieșit cărturarii Școlii Ardelene. Spre sfârșitul veacului, după răscoala lui Horea, împăratul Iosif al II-lea a slăbit lanțurile iobăgiei.",
      regat: "În Moldova și în Țara Românească domneau principi greci din Fanar, numiți de sultan: își cumpărau tronul și își scoteau banii din dări puse pe țărani. Țara era des ocupată de ruși sau de austrieci în războaiele lor cu turcii. Satele se goleau când veneau oștile sau ciuma, iar oamenii fugeau „în bejenie” prin păduri. Constantin Mavrocordat a desființat rumânia (șerbia), dar claca la boier a rămas.",
      bucovina: "Până în 1775, Bucovina a fost partea de nord a Moldovei, cu mănăstirile ei vechi. Apoi Austria a luat-o și a început s-o organizeze ca o provincie a imperiului: drumuri, școli germane și colonii de oameni aduși din alte părți.",
      basarabia: "Basarabia era partea de răsărit a Moldovei, între Prut și Nistru, iar în sud stăpâneau turcii și tătarii. Războaiele dintre ruși și turci s-au purtat chiar pe aici, iar în 1812 Rusia a luat ținutul de la Moldova.",
      dobrogea: "Dobrogea era de aproape 400 de ani sub turci: un ținut de stepă, cu sate de tătari, turci, români, bulgari și lipoveni, prin care treceau des oștile rusești în drum spre Constantinopol.",
      lume: "Era veacul marilor imperii și al regilor absoluți. Cei mai mulți oameni munceau pământul, foarte puțini știau carte, iar războaiele și ciuma treceau des peste sate.",
    },
  },
  {
    from: 1821, to: 1847, name: "Anii de după Tudor",
    life: {
      "*": "După 1821, lumea începea să se miște: apăreau primele ziare și școli în limba română, iar tinerii boierilor plecau la studii la Paris. Țăranii însă trăiau ca înainte, din clacă și dijmă, cu holera din 1831 și cu ani de secetă care aduceau foamete.",
      ardeal: "În Ardeal iobăgia rămânea în picioare: țăranul român lucra pe moșia nobilului și plătea dări statului și bisericii. La Brașov, Gheorghe Barițiu scotea „Gazeta de Transilvania” (1838), prima gazetă românească de aici, iar la Blaj se ridicau dascăli și preoți care au deșteptat satele.",
      regat: "După Tudor Vladimirescu au revenit domnii pământeni, iar după războiul din 1828–1829 rușii au ocupat Principatele și le-au dat Regulamentul Organic, un fel de primă constituție. Comerțul cu grâne pe Dunăre s-a deschis, porturile Brăila și Galați au crescut, dar țăranii au primit mai multe zile de clacă, nu mai puține.",
      basarabia: "Basarabia devenise o gubernie a Rusiei: boierii își păstrau o vreme drepturile, dar limba rusă intra în administrație, iar în sud se așezau coloniști germani, bulgari și găgăuzi.",
      dobrogea: "Dobrogea rămânea sub turci, o stepă rar locuită, pustiită de războiul ruso-turc din 1828–1829.",
      bucovina: "Bucovina era o provincie austriacă, pe atunci alipită Galiției: administrația vorbea germană și polonă, dar satele rămâneau românești și ucrainene.",
      lume: "Europa se refăcea după războaiele lui Napoleon. În apus apăreau primele fabrici și căi ferate, dar cei mai mulți oameni trăiau încă la sat, din munca pământului.",
    },
  },
  {
    from: 1848, to: 1866, name: "Revoluția de la 1848 și Unirea",
    life: {
      "*": "Anul 1848 a scuturat toată Europa, iar românii din toate ținuturile au cerut drepturi și pământ. A urmat o vreme de mari schimbări: libertatea țăranilor, primele căi ferate în Europa, școala pentru toți ca idee nouă. Satul rămânea însă sărac, cu mulți copii și mulți morți mici.",
      ardeal: "În 1848 iobăgia a fost desființată, iar țăranul a devenit stăpân pe pământul pe care îl lucra. Dar anii 1848–1849 au adus și războiul civil dintre români și unguri, cu sate arse și mii de morți, cu Avram Iancu în Munții Apuseni. După înfrângerea revoluției, Viena a condus Ardealul direct, cu jandarmi și funcționari austrieci. În 1861 s-a înființat ASTRA, care a dus cărți și școli în satele românești.",
      regat: "În 1859 Moldova și Țara Românească s-au unit sub Alexandru Ioan Cuza. Cuza a dat pământ țăranilor (1864), a desființat claca, a făcut școala primară obligatorie și gratuită și a eliberat robii romi. Pentru prima dată, un țăran putea avea pământul lui. În 1866 a venit pe tron Carol I.",
      bucovina: "În 1849 Bucovina a devenit o provincie a Austriei, cu dietă proprie la Cernăuți. Iobăgia fusese desființată și aici în 1848, iar orașul Cernăuți creștea ca un mic Viena al estului.",
      basarabia: "Basarabia era sub Rusia. După Războiul Crimeii, în 1856, sudul ei (Cahul, Bolgrad, Ismail) a revenit Moldovei, iar apoi Principatelor Unite.",
      dobrogea: "Dobrogea era încă otomană; după Războiul Crimeii aici au fost așezați mii de tătari din Crimeea și cerchezi din Caucaz.",
      lume: "Revoluțiile din 1848 au cuprins toată Europa. Au urmat ani de căi ferate, telegraf și fabrici, iar oamenii începeau să plece de la sat la oraș sau peste ocean.",
    },
  },
  {
    from: 1867, to: 1913, name: "Lumea de dinaintea marelui război",
    life: {
      "*": "Erau ani de pace lungă, de trenuri noi și de orașe care creșteau, dar la sat viața se schimba încet: munca era făcută cu mâna și cu boii, familiile aveau câte opt-zece copii, iar mulți mureau mici. Bărbații făceau armata câțiva ani, femeile țeseau tot ce purta casa.",
      ardeal: "Din 1867 Ardealul a fost alipit Ungariei. Statul maghiar voia ca toți să devină unguri: școlile românești au fost strâmtorate (legile Apponyi, 1907), iar românii aveau puțini deputați. Satele se țineau în jurul bisericii și al școlii confesionale. Mulți bărbați au plecat „la America”, în fabricile și minele din Statele Unite, ca să facă bani de pământ, și unii s-au întors, alții nu.",
      regat: "România a câștigat independența în războiul din 1877–1878 și a devenit regat în 1881. Se făceau căi ferate, poduri, școli și cazărmi, iar grâul românesc pleca pe Dunăre în toată Europa. Țăranii însă aveau prea puțin pământ și lucrau în dijmă pe moșiile arendașilor; nemulțumirea a izbucnit în răscoala din 1907, înăbușită de armată.",
      bucovina: "Sub Austria, Bucovina era o provincie liniștită și relativ prosperă, cu școli, drumuri și universitatea de la Cernăuți (1875). Românii, ucrainenii, evreii, germanii și polonii trăiau unii lângă alții. Mulți țărani au plecat și de aici la muncă în America și în Canada.",
      basarabia: "Sub Rusia, Basarabia era rusificată: școala și slujbele erau în rusește, iar țăranii moldoveni rămâneau aproape toți fără carte. Satele trăiau din grâu, vin și vite, departe de orașele mari.",
      dobrogea: "În 1878 Dobrogea a intrat în România. Statul a adus aici coloniști români din toate părțile, a construit portul Constanța și podul de la Cernavodă (1895), iar stepa a început să fie arată.",
      lume: "Era „la belle époque”: trenuri, vapoare, lumină electrică în orașe și milioane de europeni plecați în America. La sat, munca se făcea însă tot cu mâna și cu animalele.",
    },
  },
  {
    from: 1914, to: 1918, name: "Marele Război",
    life: {
      "*": "Războiul i-a luat pe bărbați din sate, iar femeile, copiii și bătrânii au rămas să ducă singuri munca. Rechizițiile, foametea și tifosul au făcut mai multe victime decât gloanțele în unele locuri. În 1918 gripa spaniolă a mai lovit o dată. Și tot în 1918 a venit Unirea, cea mai mare bucurie a generației.",
      ardeal: "Bărbații din Ardeal au fost mobilizați în armata austro-ungară și trimiși să lupte în Galiția, în Serbia și în munții Italiei, uneori chiar împotriva românilor din regat. Când România a intrat în război, în 1916, mulți au fost bănuiți și arestați. La 1 decembrie 1918, la Alba Iulia, zeci de mii de oameni au cerut unirea cu România.",
      regat: "România a intrat în război în august 1916. După câteva luni, Bucureștiul și jumătate de țară au fost ocupate de nemți, iar guvernul, armata și sute de mii de refugiați s-au strâns în Moldova, la Iași. Iarna 1916–1917 a fost cumplită: frig, foamete și tifos exantematic. În vara lui 1917, la Mărăști, Mărășești și Oituz, armata a oprit înaintarea dușmanului.",
      bucovina: "Bucovina a fost câmp de luptă între ruși și austrieci, ocupată și eliberată de mai multe ori. La 28 noiembrie 1918 s-a unit cu România.",
      basarabia: "După prăbușirea Rusiei țariste în 1917, Basarabia și-a făcut Sfatul Țării și la 27 martie 1918 s-a unit cu România.",
      dobrogea: "Dobrogea a fost ocupată de armatele germane și bulgare în toamna lui 1916, iar mulți oameni au fugit spre Moldova sau au fost luați ostatici.",
      lume: "Europa era în Primul Război Mondial: milioane de bărbați pe front, rații și foamete acasă, iar la sfârșit gripa spaniolă.",
    },
  },
  {
    from: 1919, to: 1939, name: "România Mare",
    life: {
      "*": "După Unire, toate ținuturile erau într-o singură țară. Reforma agrară din 1921 a dat pământ țăranilor, iar mulți foști soldați au devenit pentru prima dată proprietari. Satele aveau școală, preot, cârciumă și horă duminica; trenul și radioul ajungeau tot mai departe. Cei mai mulți oameni trăiau încă la sat, fără curent și fără medic, iar mulți copii mureau mici. Marea Criză din 1929–1933 a făcut ca grâul să nu mai valoreze aproape nimic.",
      ardeal: "Ardealul era acum în România: se deschideau școli românești și universitatea românească din Cluj (1919), iar pământul marilor moșii a fost împărțit țăranilor. Satele aveau rânduiala lor veche, cu biserica, școala și cooperativa, iar unii dintre cei plecați în America s-au întors și și-au cumpărat pământ.",
      basarabia: "Basarabia era acum în România: s-au deschis școli românești, țăranii au primit pământ prin reforma din 1918, dar ținutul rămânea sărac, cu drumuri proaste, iar granița de pe Nistru cu Uniunea Sovietică era închisă.",
      dobrogea: "Dobrogea creștea: Constanța devenise portul mare al țării, iar în Cadrilater, în sud, statul așeza familii de aromâni veniți din Balcani.",
      lume: "Lumea de după Primul Război Mondial: orașe care creșteau, primele automobile și radiouri, apoi Marea Criză din 1929 și ridicarea dictaturilor.",
    },
  },
  {
    from: 1940, to: 1947, name: "Al Doilea Război Mondial și anii de după",
    life: {
      "*": "În vara lui 1940, România a pierdut o treime din teritoriu fără să tragă un foc. A urmat războiul: bărbații pe front, întâi spre răsărit, apoi, după 23 august 1944, spre apus. Au fost ani de rechiziții, de bombardamente, de deportări ale evreilor și ale romilor și de refugii. După război, armata sovietică a rămas în țară, comuniștii au luat puterea pas cu pas, iar seceta din 1946–1947 a adus foametea.",
      ardeal: "În august 1940, prin Dictatul de la Viena, nordul Ardealului a fost dat Ungariei. Familiile s-au rupt în două, cu granița între ele, iar mulți români din nord au fugit spre sud. În toamna lui 1944, luptele pentru eliberarea Ardealului de Nord s-au dat chiar prin sate. Iarna lui 1945 i-a luat pe mulți germani din Ardeal și Banat la muncă silnică în Uniunea Sovietică.",
      basarabia: "În iunie 1940 Basarabia a fost ocupată de Uniunea Sovietică. În 1941 au venit deportările în Siberia, apoi războiul a adus-o înapoi la România, iar în 1944 sovieticii s-au întors. Seceta din 1946–1947 a adus o foamete în care au murit zeci de mii de oameni.",
      bucovina: "În iunie 1940 nordul Bucovinei, cu Cernăuțiul, a fost luat de Uniunea Sovietică; sudul, cu Suceava, a rămas în România. Mulți au fugit din nord, iar războiul a trecut de două ori prin ținut.",
      dobrogea: "În septembrie 1940 Cadrilaterul a fost dat Bulgariei, iar familiile de români și aromâni de acolo au fost mutate în nordul Dobrogei, în casele bulgarilor plecați. Portul Constanța a fost bombardat în anii războiului.",
      lume: "Era vremea celui de-Al Doilea Război Mondial: bombardamente, refugii, rații și, pentru milioane de oameni, deportări și lagăre.",
    },
  },
  {
    from: 1948, to: 1964, name: "Anii grei ai comunismului",
    life: {
      "*": "Regele fusese silit să plece, iar comuniștii au luat totul: fabricile, băncile, pământul. Țăranii au fost împinși, cu forța, să-și dea pământul și vitele la colectiv (CAP), iar cei care nu voiau, numiți „chiaburi”, erau arestați sau umiliți. Mulți oameni au ajuns în închisori politice sau la Canal. În același timp, curentul electric a ajuns în tot mai multe sate, iar copiii mergeau toți la școală.",
      ardeal: "Biserica Greco-Catolică, cea a multor români din Ardeal, a fost desființată în 1948, iar preoții ei au fost arestați. Munții au ținut ani de zile grupuri de partizani anticomuniști. Colectivizarea a schimbat satul pentru totdeauna: tinerii au început să plece la oraș, în fabrici.",
      basarabia: "Basarabia devenise Republica Sovietică Moldovenească. În iulie 1949, zeci de mii de oameni au fost deportați în Siberia, iar satele au fost colectivizate în colhozuri. Limba română se scria cu litere rusești și se numea „moldovenească”.",
      lume: "Era începutul Războiului Rece: Europa era împărțită în două, iar lumea se refăcea după război.",
    },
  },
  {
    from: 1965, to: 1989, name: "Epoca Ceaușescu",
    life: {
      "*": "Anii '60 și '70 au adus blocuri, fabrici noi și slujbe la oraș; mulți tineri au plecat de la sat, iar alții făceau naveta. Aveai casă, școală și slujbă asigurate, dar nu și libertatea de a spune ce gândești sau de a călători. Avortul era interzis, așa că s-au născut mulți copii. În anii '80, ca să plătească datoriile țării, Ceaușescu a pus totul pe cartelă: cozi la pâine, frig în case, lumina tăiată seara și două ore de televizor pe zi. Securitatea era peste tot.",
      ardeal: "Ardealul și Banatul s-au industrializat repede, cu fabrici la Cluj, Brașov, Timișoara și Hunedoara. În același timp, sașii și șvabii au plecat în masă în Germania, iar satele lor au rămas pe jumătate goale.",
      basarabia: "În Moldova Sovietică satele erau colhozuri, iar orașele se umpleau de fabrici și de oameni aduși din alte republici. Rusa era limba la care aveai nevoie ca să urci în viață. Spre sfârșitul anilor '80 oamenii au început să ceară limba română și alfabetul latin.",
      lume: "Era vremea Războiului Rece, a zborurilor în spațiu, a muzicii pop și a televizorului în fiecare casă.",
    },
  },
  {
    from: 1990, to: 2006, name: "Anii tranziției",
    life: {
      "*": "După 1989 oamenii au putut vorbi, vota și călători liber. Pământul a fost dat înapoi familiilor, dar fabricile s-au închis una după alta, iar banii își pierdeau valoarea de la o lună la alta. Mulți au rămas fără slujbă; după 2002, când nu mai trebuia viză, sute de mii au plecat la muncă în Italia, Spania și Germania. Au venit telefoanele mobile, televiziunile private și, încet, internetul.",
      basarabia: "Republica Moldova și-a declarat independența în 1991. Limba română a revenit cu litere latine, dar războiul de pe Nistru din 1992 a rupt Transnistria. Sărăcia a împins mulți oameni la muncă în Rusia, Italia și România.",
      lume: "Lumea de după căderea Zidului Berlinului: granițe deschise, internet și telefoane mobile.",
    },
  },
  {
    from: 2007, to: 2100, name: "România în Europa",
    life: {
      "*": "România a intrat în Uniunea Europeană în 2007: drumuri și școli refăcute cu bani europeni, granițe deschise și rude împrăștiate prin toată Europa. Telefonul inteligent și internetul au intrat în fiecare casă. Au fost și ani grei: criza din 2009–2010, pandemia din 2020 și războiul din Ucraina, din 2022, chiar la granița țării.",
      basarabia: "Republica Moldova s-a apropiat de Europa: din 2014 oamenii călătoresc fără viză, mulți au și cetățenie română, iar țara a cerut să intre în Uniunea Europeană.",
      lume: "Lumea telefoanelor inteligente și a internetului, a călătoriilor ieftine, dar și a crizelor mari: criza din 2008, pandemia și războiul din Ucraina.",
    },
  },
];

export const EVENTS: HistEvent[] = [
  { year: 1600, text: "Mihai Viteazul unește pentru scurtă vreme Țara Românească, Ardealul și Moldova", tone: "schimbare", areas: ["ardeal", "regat", "bucovina", "basarabia"], weight: 2 },
  { year: 1699, text: "Pacea de la Karlowitz: Ardealul intră sub stăpânirea Habsburgilor", tone: "schimbare", areas: ["ardeal"] },
  { year: 1700, text: "Unirea cu Biserica Romei: se naște Biserica Greco-Catolică, iar la Blaj apar primele școli românești", tone: "schimbare", areas: ["ardeal"] },
  { year: 1711, to: 1821, text: "Domniile fanariote: principi greci numiți de sultan, cu dări tot mai mari", tone: "greu", areas: ["regat", "bucovina", "basarabia"] },
  { year: 1718, text: "Banatul trece de la turci la Habsburgi", tone: "schimbare", areas: ["ardeal"], counties: ["TM", "CS"] },
  { year: 1746, to: 1749, text: "Constantin Mavrocordat desființează rumânia și vecinia: țăranii nu mai pot fi vânduți cu moșia", tone: "bine", areas: ["regat", "bucovina", "basarabia"] },
  { year: 1762, text: "Satele din jurul Năsăudului devin sate de grăniceri: scapă de iobăgie, dar bărbații slujesc la armată", tone: "schimbare", areas: ["ardeal"], counties: ["BN"] },
  { year: 1775, text: "Austria ia nordul Moldovei și îl numește Bucovina", tone: "schimbare", areas: ["bucovina"], weight: 2 },
  { year: 1784, text: "Răscoala lui Horea, Cloșca și Crișan, înecată în sânge", tone: "greu", areas: ["ardeal"], weight: 2 },
  { year: 1785, text: "Iosif al II-lea desființează legarea iobagilor de glie", tone: "bine", areas: ["ardeal"] },
  { year: 1791, text: "Supplex Libellus Valachorum: românii din Ardeal cer să fie socotiți națiune", tone: "schimbare", areas: ["ardeal"] },
  { year: 1812, text: "Rusia ia Basarabia de la Moldova", tone: "greu", areas: ["basarabia", "regat"], weight: 2 },
  { year: 1813, to: 1814, text: "„Ciuma lui Caragea” în Țara Românească", tone: "greu", areas: ["regat"] },
  { year: 1816, to: 1817, text: "„Anul fără vară”: recolte pierdute și foamete în toată Europa", tone: "greu", areas: ["ardeal", "bucovina", "regat", "lume"] },
  { year: 1821, text: "Revoluția lui Tudor Vladimirescu; se încheie domniile fanariote", tone: "schimbare", areas: ["regat"], weight: 2 },
  { year: 1831, text: "Prima mare epidemie de holeră", tone: "greu", areas: ALL },
  { year: 1832, text: "Regulamentul Organic, sub ocupație rusească", tone: "schimbare", areas: ["regat"] },
  { year: 1838, text: "Apare „Gazeta de Transilvania” la Brașov", tone: "bine", areas: ["ardeal"] },
  { year: 1848, text: "Revoluția de la 1848: Adunarea de la Blaj și Proclamația de la Islaz", tone: "schimbare", areas: ["ardeal", "regat", "bucovina"], weight: 3 },
  { year: 1848, text: "Iobăgia e desființată: țăranii devin stăpâni pe pământul lor", tone: "bine", areas: ["ardeal", "bucovina"], weight: 3 },
  { year: 1848, to: 1849, text: "Războiul civil din Ardeal; Avram Iancu în Munții Apuseni", tone: "greu", areas: ["ardeal"], weight: 2 },
  { year: 1853, to: 1856, text: "Războiul Crimeii: Principatele ocupate de ruși, apoi de austrieci", tone: "greu", areas: ["regat"] },
  { year: 1855, to: 1856, text: "Robii romi sunt eliberați", tone: "bine", areas: ["regat"] },
  { year: 1856, text: "Sudul Basarabiei revine Moldovei", tone: "bine", areas: ["basarabia"] },
  { year: 1859, text: "Unirea Principatelor sub Alexandru Ioan Cuza", tone: "bine", areas: ["regat"], weight: 3 },
  { year: 1861, text: "Se înființează ASTRA, care duce cărți și școli în satele românești", tone: "bine", areas: ["ardeal"] },
  { year: 1864, text: "Reforma agrară a lui Cuza și școala primară obligatorie și gratuită", tone: "bine", areas: ["regat"], weight: 3 },
  { year: 1866, text: "Carol I vine pe tron; prima Constituție", tone: "schimbare", areas: ["regat"] },
  { year: 1867, text: "Dualismul austro-ungar: Ardealul e alipit Ungariei", tone: "greu", areas: ["ardeal"], weight: 3 },
  { year: 1869, text: "Primul tren din Principate, între București și Giurgiu", tone: "bine", areas: ["regat"] },
  { year: 1875, text: "Se deschide Universitatea din Cernăuți", tone: "bine", areas: ["bucovina"] },
  { year: 1877, to: 1878, text: "Războiul de Independență: Plevna, Grivița, Smârdan", tone: "bine", areas: ["regat"], weight: 3 },
  { year: 1878, text: "Dobrogea intră în România", tone: "schimbare", areas: ["dobrogea", "regat"], weight: 3 },
  { year: 1881, text: "România devine regat", tone: "bine", areas: ["regat", "dobrogea"] },
  { year: 1892, to: 1894, text: "Memorandumul românilor din Ardeal și procesul memorandiștilor de la Cluj", tone: "greu", areas: ["ardeal"], weight: 2 },
  { year: 1895, text: "Podul de la Cernavodă leagă Dobrogea de restul țării", tone: "bine", areas: ["dobrogea"] },
  { year: 1895, to: 1914, text: "Marea plecare „la America”: zeci de mii de oameni pleacă la muncă peste ocean", tone: "schimbare", areas: ["ardeal", "bucovina"], weight: 2 },
  { year: 1907, text: "Marea răscoală a țăranilor, înăbușită de armată cu mii de morți", tone: "greu", areas: ["regat"], weight: 3 },
  { year: 1907, text: "Legile Apponyi: școlile românești silite să predea în maghiară", tone: "greu", areas: ["ardeal"], weight: 2 },
  { year: 1913, text: "Al Doilea Război Balcanic; Cadrilaterul intră în România", tone: "schimbare", areas: ["regat", "dobrogea"] },
  { year: 1914, text: "Începe Primul Război Mondial: bărbații din Ardeal și Bucovina pleacă pe front în armata austro-ungară", tone: "greu", areas: ["ardeal", "bucovina"], weight: 3 },
  { year: 1914, text: "Începe Primul Război Mondial", tone: "greu", areas: ["lume", "basarabia"], weight: 3 },
  { year: 1916, text: "România intră în război; Bucureștiul e ocupat, guvernul fuge la Iași", tone: "greu", areas: ["regat", "dobrogea", "ardeal"], weight: 3 },
  { year: 1917, text: "Iarna foametei și a tifosului în Moldova; victoriile de la Mărăști, Mărășești și Oituz", tone: "schimbare", areas: ["regat"], weight: 2 },
  { year: 1918, text: "Gripa spaniolă", tone: "greu", areas: WORLD, weight: 2 },
  { year: 1918, text: "Marea Unire: Basarabia (27 martie), Bucovina (28 noiembrie) și Ardealul (1 decembrie, la Alba Iulia) se unesc cu România", tone: "bine", areas: ALL, weight: 3 },
  { year: 1919, text: "Războiul cu Ungaria lui Béla Kun; se deschide universitatea românească din Cluj", tone: "schimbare", areas: ["ardeal"] },
  { year: 1921, text: "Reforma agrară: țăranii, mai ales foștii soldați, primesc pământ", tone: "bine", areas: ALL, weight: 3 },
  { year: 1929, to: 1933, text: "Marea Criză: grâul nu mai valorează aproape nimic, țăranii se îngroapă în datorii", tone: "greu", areas: WORLD, weight: 2 },
  { year: 1938, text: "Carol al II-lea desființează partidele: începe dictatura regală", tone: "greu", areas: ALL },
  { year: 1939, text: "Începe al Doilea Război Mondial", tone: "greu", areas: ["lume"], weight: 3 },
  { year: 1940, text: "Uniunea Sovietică ocupă Basarabia și nordul Bucovinei", tone: "greu", areas: ["basarabia", "bucovina", "regat"], weight: 3 },
  { year: 1940, text: "Dictatul de la Viena: nordul Ardealului e dat Ungariei", tone: "greu", areas: ["ardeal", "regat", "bucovina"], weight: 3 },
  { year: 1940, to: 1944, text: "Ocupația horthystă în nordul Ardealului: școli românești închise, preoți și învățători alungați, masacre la Ip și Trăznea", tone: "greu", areas: ["ardeal"], counties: NORD, weight: 3 },
  { year: 1940, text: "Cadrilaterul e dat Bulgariei; românii și aromânii de acolo sunt mutați în nordul Dobrogei", tone: "greu", areas: ["dobrogea"], weight: 3 },
  { year: 1940, text: "Marele cutremur din Vrancea (10 noiembrie)", tone: "greu", areas: ["regat"], weight: 2 },
  { year: 1941, text: "România intră în război împotriva Uniunii Sovietice; pogromul de la Iași", tone: "greu", areas: ["regat", "ardeal", "bucovina", "dobrogea", "basarabia"], weight: 3 },
  { year: 1941, text: "Deportările sovietice în Siberia", tone: "greu", areas: ["basarabia", "bucovina"] },
  { year: 1941, to: 1942, text: "Evreii și romii deportați în Transnistria", tone: "greu", areas: ["regat", "bucovina", "basarabia"], weight: 2 },
  { year: 1942, to: 1943, text: "Stalingradul: zeci de mii de soldați români morți sau prizonieri", tone: "greu", areas: ["regat", "ardeal", "bucovina", "dobrogea", "basarabia"], weight: 2 },
  { year: 1944, text: "Evreii din nordul Ardealului sunt deportați la Auschwitz", tone: "greu", areas: ["ardeal"], counties: NORD, weight: 2 },
  { year: 1944, text: "Bombardamentele americane asupra Bucureștiului și Ploieștiului", tone: "greu", areas: ["regat"], counties: ["B", "IF", "PH", "DB", "GR", "IL", "TR", "AG", "BZ"], weight: 2 },
  { year: 1944, text: "23 august: România trece de partea Aliaților; în toamnă e eliberat nordul Ardealului", tone: "schimbare", areas: RO, weight: 3 },
  { year: 1945, text: "Germanii din Ardeal și Banat duși la muncă silnică în Uniunea Sovietică", tone: "greu", areas: ["ardeal"], weight: 2 },
  { year: 1945, text: "Se termină al Doilea Război Mondial", tone: "bine", areas: WORLD, weight: 3 },
  { year: 1945, text: "Guvernul Petru Groza, impus de sovietici; o nouă reformă agrară", tone: "schimbare", areas: RO },
  { year: 1946, to: 1947, text: "Seceta și foametea cea mare", tone: "greu", areas: ["regat", "basarabia", "bucovina"], counties: [...MOLDOVA, "MD"], weight: 3 },
  { year: 1947, text: "Regele Mihai e silit să abdice; economiile oamenilor se topesc la stabilizarea monetară", tone: "greu", areas: RO, weight: 3 },
  { year: 1948, text: "Naționalizarea: fabricile, minele și băncile trec la stat", tone: "greu", areas: RO, weight: 2 },
  { year: 1948, text: "Biserica Greco-Catolică e desființată, preoții ei arestați", tone: "greu", areas: ["ardeal"], weight: 2 },
  { year: 1949, to: 1962, text: "Colectivizarea: pământul și vitele luate cu forța la CAP; „chiaburii” arestați", tone: "greu", areas: RO, weight: 3 },
  { year: 1949, text: "Deportările din 6 iulie în Siberia; satele trec la colhoz", tone: "greu", areas: ["basarabia"], weight: 3 },
  { year: 1949, to: 1953, text: "Canalul Dunăre–Marea Neagră, lagăr de muncă pentru deținuții politici", tone: "greu", areas: ["dobrogea", "regat"] },
  { year: 1951, text: "Deportările în Bărăgan: mii de familii de la granița cu Iugoslavia, duse pe câmp gol", tone: "greu", areas: ["ardeal", "regat"], counties: ["TM", "CS", "MH", "DJ", "AR"], weight: 3 },
  { year: 1952, text: "A doua reformă monetară: banii strânși se pierd din nou", tone: "greu", areas: RO },
  { year: 1956, text: "Revoluția din Ungaria; arestări printre studenții din Cluj și Timișoara", tone: "greu", areas: ["ardeal"] },
  { year: 1956, text: "Prima emisiune a Televiziunii Române", tone: "bine", areas: RO },
  { year: 1957, text: "Sputnik, primul satelit, zboară în jurul Pământului", tone: "schimbare", areas: ["lume"] },
  { year: 1958, text: "Trupele sovietice pleacă din România", tone: "bine", areas: RO, weight: 2 },
  { year: 1964, text: "Deținuții politici sunt eliberați", tone: "bine", areas: RO, weight: 2 },
  { year: 1965, text: "Nicolae Ceaușescu ajunge la putere", tone: "schimbare", areas: RO, weight: 2 },
  { year: 1966, text: "Decretul 770 interzice avortul: se nasc „decrețeii”", tone: "greu", areas: RO, weight: 2 },
  { year: 1968, text: "Ceaușescu refuză invadarea Cehoslovaciei; țara e împărțită în județe", tone: "schimbare", areas: RO },
  { year: 1969, text: "Primul om pe Lună, văzut la televizor în toată lumea", tone: "bine", areas: ["lume", ...RO] },
  { year: 1970, text: "Inundațiile mari din mai: sute de sate sub ape", tone: "greu", areas: RO, weight: 2 },
  { year: 1977, text: "Cutremurul din 4 martie: aproape 1.600 de morți, cei mai mulți în București", tone: "greu", areas: RO, weight: 3 },
  { year: 1977, text: "Greva minerilor din Valea Jiului", tone: "schimbare", areas: ["ardeal"], counties: ["HD"], weight: 2 },
  { year: 1978, to: 1989, text: "Sașii și șvabii pleacă în masă în Germania", tone: "schimbare", areas: ["ardeal"] },
  { year: 1981, to: 1989, text: "Anii cartelelor: cozi la pâine, frig în case și lumina tăiată", tone: "greu", areas: RO, weight: 3 },
  { year: 1987, text: "Revolta muncitorilor de la Brașov", tone: "schimbare", areas: ["ardeal"], counties: ["BV"], weight: 2 },
  { year: 1989, text: "Revoluția: Timișoara (16 decembrie), apoi Bucureștiul; cade Ceaușescu", tone: "schimbare", areas: RO, weight: 3 },
  { year: 1989, text: "Cade Zidul Berlinului", tone: "bine", areas: ["lume", "basarabia"], weight: 3 },
  { year: 1990, text: "Mineriada: minerii aduși la București bat studenții din Piața Universității", tone: "greu", areas: RO },
  { year: 1991, text: "Legea pământului: familiile își primesc înapoi pământul luat la colectiv", tone: "bine", areas: RO, weight: 3 },
  { year: 1991, text: "Republica Moldova își declară independența; Uniunea Sovietică se destramă", tone: "schimbare", areas: ["basarabia", "lume"], weight: 3 },
  { year: 1992, text: "Războiul de pe Nistru", tone: "greu", areas: ["basarabia"], weight: 2 },
  { year: 1992, to: 1994, text: "Jocul Caritas de la Cluj: mii de familii își pierd economiile", tone: "greu", areas: RO },
  { year: 1993, to: 1997, text: "Inflația mare: prețurile se dublează de la un an la altul; fabricile se închid", tone: "greu", areas: RO, weight: 2 },
  { year: 2002, text: "Fără vize în Europa: începe plecarea la muncă în Italia și Spania", tone: "schimbare", areas: RO, weight: 2 },
  { year: 2004, text: "România intră în NATO", tone: "bine", areas: RO },
  { year: 2007, text: "România intră în Uniunea Europeană", tone: "bine", areas: [...RO, "basarabia"], weight: 3 },
  { year: 2008, to: 2010, text: "Criza economică: salarii tăiate și slujbe pierdute", tone: "greu", areas: WORLD, weight: 2 },
  { year: 2014, text: "Moldovenii pot călători fără viză în Uniunea Europeană", tone: "bine", areas: ["basarabia"] },
  { year: 2020, to: 2021, text: "Pandemia de COVID-19", tone: "greu", areas: WORLD, weight: 3 },
  { year: 2022, text: "Rusia invadează Ucraina; refugiați primiți în case la granița noastră", tone: "greu", areas: WORLD, weight: 3 },
  { year: 2025, text: "România intră deplin în spațiul Schengen", tone: "bine", areas: RO },
];

export const eraOf = (year: number) => ERAS.find((e) => year >= e.from && year <= e.to) ?? ERAS[ERAS.length - 1];

/** Evenimentele care au atins ținutul cuiva. Fără ținut știut: doar cele mari, care au atins tot neamul românesc. */
export function eventsFor(origin: Pick<Origin, "area" | "county"> | null): HistEvent[] {
  return EVENTS.filter((e) => {
    if (!origin) return e.areas.includes("regat") && e.areas.includes("ardeal");
    if (!e.areas.includes(origin.area)) return false;
    // Un eveniment legat de anumite județe: doar acolo (pentru Basarabia, „MD” în listă).
    if (e.counties) return origin.area === "basarabia" ? e.counties.includes("MD") : !!origin.county && e.counties.includes(origin.county);
    return true;
  });
}

/** `age` = vârsta când a început; `ongoing` = începuse deja când s-a născut (anii cartelelor pentru cine s-a născut în 1985). */
export type Lived = { event: HistEvent; age: number; ongoing?: boolean };
export type Story = {
  year: number;
  era: Era;
  life: string;
  /** Ce se întâmplase cu puțin înainte să se nască (cel mult 12 ani). */
  before: HistEvent[];
  /** Ce a trăit, cu vârsta de atunci. */
  lived: Lived[];
  /** „în Transilvania” / „în Italia” / null când nu știm locul. */
  where: string | null;
  origin: Origin | null;
};

/** Povestea vremurilor pentru cineva: epoca nașterii, cum se trăia în ținutul lui și ce a trăit. */
export function storyFor(p: { birthYear: number | null; deathYear: number | null; living: boolean }, origin: Origin | null, now = new Date().getFullYear(), maxLived = 9): Story | null {
  const y = p.birthYear;
  if (y === null || y > now) return null;
  const era = eraOf(y);
  const life = (origin && era.life[origin.area]) ?? era.life["*"] ?? "";
  const evs = eventsFor(origin);
  const end = p.deathYear ?? (p.living ? now : Math.min(now, y + 75));
  const before = evs.filter((e) => (e.to ?? e.year) < y && (e.to ?? e.year) >= y - 12).sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1) || b.year - a.year).slice(0, 3)
    .sort((a, b) => a.year - b.year);
  let lived = evs.filter((e) => (e.to ?? e.year) >= y && e.year <= end).map((event) => (event.year < y ? { event, age: 0, ongoing: true } : { event, age: event.year - y }));
  // Prea multe: păstrăm întâi cele mari, apoi cele din copilărie, în ordinea anilor.
  if (lived.length > maxLived) {
    const keep = new Set([...lived].sort((a, b) => (b.event.weight ?? 1) - (a.event.weight ?? 1) || a.age - b.age).slice(0, maxLived).map((l) => l.event));
    lived = lived.filter((l) => keep.has(l.event));
  }
  const where = origin ? `în ${origin.region}` : null;
  return { year: y, era, life, before, lived, where, origin };
}

/** „la 12 ani”, „în anul nașterii”, „copil de 3 ani”. */
export function ageWords(age: number, sex: "M" | "F" | "U", ongoing = false) {
  if (ongoing) return "de când s-a născut";
  if (age === 0) return "în anul nașterii";
  const ani = age === 1 ? "un an" : age < 20 ? `${age} ani` : `${age} de ani`;
  if (age < 7) return `copil${sex === "F" ? "ă" : ""} de ${ani}`;
  return `la ${ani}`;
}
