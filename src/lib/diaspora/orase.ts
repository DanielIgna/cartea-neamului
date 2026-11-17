import type { Region } from "./tipuri";
import { MORE } from "./orase-mai-mult";

/**
 * Pasul 2 al extinderii diaspora (Daniel, 17.11.2026): orașele mari cu români din Europa și Israel, la /diaspora/<țară>/<oraș>.
 * Paginile sunt în română (publicul e român; nu dublăm orașele în toate limbile). Fiecare are text propriu: comunitatea, ce
 * consulat o servește (din lista verificată din extins.ts, prin `mission`), unde se cer actele locale și ce arhive are orașul.
 * Fără biserici, asociații sau cifre pe care nu le putem verifica. O pagină sub 300 de cuvinte proprii rămâne în afara Google.
 */
type City = Omit<Region, "kind" | "langs" | "where" | "name"> & { name: string; where?: string };
const city = (c: City): Region => ({
  ...c, kind: "city", langs: ["ro"], name: { ro: c.name }, where: { ro: c.where ?? `în ${c.name}` },
  notes: { ...c.notes, ro: [...(c.notes.ro ?? []), ...(MORE[c.slug] ?? [])] },
});

export const EUROPE_CITIES: Region[] = [
  // ------------------------------------------------------------------ Italia
  city({
    slug: "roma", country: "it", name: "Roma", mission: ["Roma"],
    notes: { ro: [
      "Roma are cei mai mulți români dintre toate orașele Italiei, iar cartierele și comunele din jur, de la Tor Bella Monaca și Torre Angela până la Guidonia, Tivoli sau Ladispoli, au familii românești venite mai ales după 2002. Mulți au lucrat la început în construcții și în îngrijirea vârstnicilor, apoi și-au deschis firme proprii, iar copiii lor merg azi la liceele și universitățile romane.",
      "Roma e și orașul cu cea mai veche prezență culturală românească în Italia: Accademia di Romania, fondată în 1922 în Valle Giulia, a găzduit generații de artiști și cercetători români. În același oraș se află Ambasada României și un consulat general, care servește Lazio și regiunile din jur; programarea se face pe econsulat.ro.",
      "Pentru actele italiene ale familiei (nașteri, căsătorii, certificate de rezidență), mergi la anagrafe și la stato civile ale Comune di Roma, pe municipii. Dacă ai rude italiene vechi, Archivio di Stato di Roma păstrează registre și acte notariale, iar portalul Antenati are multe registre de stare civilă online.",
      "Pentru partea din România, cel mai simplu e să începi cu bunicii: un apel video în care le arăți pozele vechi îți dă numele, satul și anii. Apoi cauți satul pe Cartea Neamului ca să afli de ce comună și de ce arhivă județeană ține, iar consulatul te ajută cu certificatele.",
    ] },
  }),
  city({
    slug: "milano", country: "it", name: "Milano", mission: ["Milano"],
    notes: { ro: [
      "Milano și Lombardia au una dintre cele mai mari comunități de români din nordul Italiei. Aici au venit mulți tineri cu studii, atrași de firmele, spitalele și universitățile orașului, dar și familii care lucrează în construcții, transport și comerț în comunele din hinterlandul milanez.",
      "Consulatul general al României de la Milano servește Lombardia și o parte din regiunile vecine; zona exactă e pe pagina oficială de competență a ambasadei. Prin el poți cere certificate din România, poți da procuri și poți transcrie nașterea copiilor născuți în Italia, cu programare pe econsulat.ro.",
      "Actele italiene se cer de la Comune di Milano (anagrafe și stato civile), iar pentru familiile mixte cu rădăcini lombarde, Archivio di Stato di Milano are registre vechi, acte notariale și fonduri ale fostelor instituții austriece din Lombardia, de dinainte de unificarea Italiei.",
      "Mulți români din Milano sunt deja a doua generație care trăiește în oraș. Pentru copiii crescuți aici, un arbore al familiei completat cu bunicii din Moldova, Transilvania sau Muntenia e felul cel mai simplu de a afla de unde vin: fiecare poate adăuga ce știe, de pe telefon, în limba lui.",
    ] },
  }),
  city({
    slug: "torino", country: "it", name: "Torino", mission: ["Torino"],
    notes: { ro: [
      "Torino e unul dintre orașele cu cea mai mare pondere a românilor în populație din toată Italia: românii sunt cea mai numeroasă comunitate străină din oraș și din provincie. Au venit masiv după 2002, mulți din Moldova (Bacău, Neamț, Vaslui) și din zona Clujului și a Maramureșului, și au lucrat în construcții, în industria auto și în îngrijire.",
      "Consulatul general al României de la Torino servește Piemontul și Valle d'Aosta, după lista oficială de competență a ambasadei. Programarea pentru certificate, procuri, pașapoarte și transcrierea nașterilor se face pe econsulat.ro.",
      "Pentru actele locale, Comune di Torino eliberează certificatele de stare civilă și de rezidență, inclusiv formularele multilingve care însoțesc actele în România. Archivio di Stato di Torino, una dintre cele mai vechi arhive din Italia, păstrează registrele fostului Regat al Sardiniei, utile pentru familiile mixte cu rădăcini piemonteze.",
      "Pentru că mulți au venit din aceleași sate, în Torino se întâlnesc des oameni din aceeași comună. Merită întrebați și ei: bătrânii unui sat știu adesea cine cu cine e rudă și cum îi chema pe străbunicii pe care nu i-ai cunoscut.",
    ] },
  }),
  city({
    slug: "bologna", country: "it", name: "Bologna", mission: ["Bologna"],
    notes: { ro: [
      "Bologna și Emilia-Romagna au o comunitate românească numeroasă, răspândită în orașele de pe Via Emilia, de la Piacenza și Parma până la Modena, Reggio Emilia, Bologna și Rimini. Românii lucrează aici în industrie, agricultură, logistică și îngrijire, iar mulți studenți români învață la Universitatea din Bologna, cea mai veche din Europa.",
      "Orașul are un consulat general al României, trecut în lista oficială a consulatelor străine din Italia. Zona lui și programul sunt pe pagina oficială a ambasadei, iar programarea se face pe econsulat.ro, pentru certificate, procuri și transcrieri.",
      "Actele italiene se cer de la Comune di Bologna. Pentru familiile mixte, Archivio di Stato di Bologna are registre de stare civilă și fonduri din perioada în care orașul făcea parte din Statul Papal, iar multe registre de stare civilă italiene sunt online, gratuit, pe portalul Antenati.",
      "Când cauți rude în actele italiene, ține minte că funcționarii scriau des numele românești fără diacritice și uneori inversau numele cu prenumele. În arbore, notează ambele forme, ca să le poată găsi și copiii, și bunicii.",
    ] },
  }),

  // ------------------------------------------------------------------ Spania
  city({
    slug: "madrid", country: "es", name: "Madrid", mission: ["Madrid"],
    notes: { ro: [
      "Comunitatea Madrid are cei mai mulți români din Spania, iar orașele din jurul capitalei au devenit adevărate centre românești: Coslada, San Fernando de Henares, Alcalá de Henares, Arganda del Rey, Torrejón de Ardoz și Getafe. Primii au venit la sfârșitul anilor '90, iar cei mai mulți după 2002, în anii de boom al construcțiilor.",
      "La Madrid se află Ambasada României, a cărei secție consulară servește comunitatea din capitală și din provinciile vecine. Programarea se face pe econsulat.ro, iar pagina oficială a ambasadei arată ce provincii ține fiecare consulat din Spania.",
      "Actele spaniole se cer de la Registro Civil, unde poți obține și certificate plurilingve, folosite în România fără traducere. Pentru familiile mixte, Archivo Histórico Nacional și arhivele istorice ale Comunității Madrid păstrează documente vechi, iar fiecare provincie are propriul Archivo Histórico Provincial.",
      "Pentru copiii crescuți la Coslada sau la Alcalá, arborele familiei e o legătură cu satul bunicilor: mulți au plecat din Teleorman, Dâmbovița, Olt și Dolj, dar și din Moldova. Un apel video cu bunicii, cu pozele vechi pe ecran, e cel mai bun început.",
    ] },
  }),
  city({
    slug: "castellon", country: "es", name: "Castellón de la Plana", where: "în Castellón de la Plana", mission: ["Castellón de la Plana"],
    notes: { ro: [
      "Castellón de la Plana e unul dintre cele mai românești orașe din Spania: aici românii sunt de mulți ani cea mai mare comunitate străină, iar în multe cartiere se aude româna pe stradă. Au venit mai ales după 2000, mulți din Muntenia și Oltenia, și au lucrat în industria ceramicii, în construcții și în agricultura de citrice din provincie.",
      "Orașul are propriul consulat al României, care servește provincia Castellón. Acolo îți ceri actele din România, dai procuri și transcrii nașterea copiilor născuți în Spania, cu programare pe econsulat.ro.",
      "Actele spaniole se cer de la Registro Civil din Castellón. Archivo Histórico Provincial de Castellón păstrează documente vechi ale provinciei, utile pentru familiile mixte româno-spaniole, iar registrele parohiale spaniole sunt de obicei în arhivele diecezane.",
      "Pentru că atât de multe familii din Castellón vin din aceleași județe, aici e ușor să găsești oameni din satul bunicilor tăi. Întreabă-i ce știu despre neamul tău: o poveste spusă de un vecin de-acasă poate completa un arbore mai bine decât un act.",
    ] },
  }),
  city({
    slug: "valencia", country: "es", name: "Valencia", mission: ["Valencia"],
    notes: { ro: [
      "Valencia și Comunitatea Valenciană au, în afară de Castellón, o comunitate românească mare în orașul Valencia și în comunele din jur, unde mulți lucrează în construcții, servicii, port și agricultură. Mulți au venit după 2002, iar o a doua generație s-a născut și a crescut aici.",
      "Valencia are un consulat general al României; provinciile pe care le servește sunt trecute pe pagina oficială a ambasadei. Prin el poți cere certificate românești, poți da procuri și poți transcrie nașterile, cu programare pe econsulat.ro.",
      "Pentru acte spaniole, Registro Civil din Valencia eliberează certificate, inclusiv în format plurilingv. Archivo del Reino de Valencia și Archivo Histórico Provincial păstrează documente vechi, utile pentru familiile cu rădăcini valenciene.",
      "Un sfat pentru arbore: în actele spaniole copiii au două nume de familie, al tatălui și al mamei. Când îi treci în arbore, scrie numele așa cum apar în actul românesc și notează forma spaniolă, ca să nu se încurce rudele care caută.",
    ] },
  }),
  city({
    slug: "barcelona", country: "es", name: "Barcelona", mission: ["Barcelona"],
    notes: { ro: [
      "Barcelona și Catalonia au o comunitate românească mare, răspândită în oraș și în orașele din jur, precum și în provinciile Girona, Lleida și Tarragona. În Lleida și în zonele agricole, mulți români au lucrat sezonier la cules de fructe înainte să se stabilească definitiv.",
      "Barcelona are un consulat general al României, care servește Catalonia; zona lui exactă e pe pagina oficială a ambasadei. Pentru acte din România, procuri și transcrierea nașterilor, programarea se face pe econsulat.ro.",
      "Actele spaniole se cer de la Registro Civil. Arxiu Nacional de Catalunya și arhivele comarcale păstrează documente vechi ale familiilor catalane, iar multe registre parohiale sunt în arhivele diecezane.",
      "În Catalonia actele pot fi în catalană sau în spaniolă, iar numele de botez sunt scrise uneori în forma catalană. Pentru un copil născut aici din părinți români, verifică la transcriere forma numelui, ca să fie aceeași în actele din ambele țări.",
    ] },
  }),
  city({
    slug: "zaragoza", country: "es", name: "Zaragoza", mission: ["Zaragoza"],
    notes: { ro: [
      "Zaragoza și Aragonul au una dintre comunitățile românești importante din nordul Spaniei. Mulți au venit după 2002 și au lucrat în construcții, în logistică și în agricultura din valea Ebrului, iar românii sunt de mulți ani printre cele mai mari comunități străine din oraș.",
      "Orașul are un consulat al României, care servește Aragonul și provinciile apropiate, după lista oficială a ambasadei. Acolo îți ceri actele românești și transcrii nașterile copiilor, cu programare pe econsulat.ro.",
      "Pentru actele spaniole mergi la Registro Civil din Zaragoza. Archivo Histórico Provincial de Zaragoza păstrează documente vechi ale provinciei, iar Arhiva Coroanei de Aragon, la Barcelona, are documentele istorice ale vechiului regat.",
      "Dacă părinții tăi au venit din aceeași zonă cu alți români din Zaragoza, comunitatea poate fi o sursă bună: oamenii din același sat își amintesc nume, porecle și înrudiri. Notează-le în arbore cu sursa lor, ca să știi mai târziu de la cine le ai.",
    ] },
  }),
  city({
    slug: "almeria", country: "es", name: "Almería", mission: ["Almería"],
    notes: { ro: [
      "Provincia Almería e cunoscută pentru serele ei uriașe din câmpia de la El Ejido și Níjar, unde lucrează mii de muncitori străini, printre ei mulți români. Comunitatea s-a format mai ales după 2002, iar o parte din cei veniți ca sezonieri au rămas cu familia.",
      "Almería are o reprezentanță consulară a României, trecută pe pagina oficială a ambasadei la Madrid. Pentru certificate din România, procuri și transcrierea nașterilor copiilor născuți aici, programarea se face pe econsulat.ro.",
      "Actele spaniole se cer de la Registro Civil. Archivo Histórico Provincial de Almería păstrează documente vechi ale provinciei, utile pentru familiile mixte.",
      "Pentru muncitorii plecați de-acasă cu ani în urmă, bunicii sunt adesea singurii care mai știu numele străbunicilor. Un arbore completat de la distanță, cu ei, păstrează aceste nume înainte să se piardă, iar copiii crescuți în Andaluzia vor avea de unde le citi.",
    ] },
  }),

  city({
    slug: "sevilla", country: "es", name: "Sevilla", mission: ["Sevilla"],
    notes: { ro: [
      "Sevilla și Andaluzia occidentală au o comunitate românească formată mai ales după 2002. Mulți au venit întâi ca sezonieri la cules de căpșuni și fructe de pădure în provincia Huelva, apoi s-au stabilit cu familia în orașele andaluze, în agricultură, construcții și servicii.",
      "Sevilla are un consulat general al României; provinciile pe care le servește sunt pe pagina oficială a ambasadei de la Madrid. Pentru certificate din România, procuri și transcrierea nașterilor, programarea se face pe econsulat.ro.",
      "Actele spaniole se cer de la Registro Civil. Archivo Histórico Provincial de Sevilla păstrează documente vechi ale provinciei, iar orașul mai are una dintre cele mai cunoscute arhive din lume, Archivo General de Indias, cu documentele vechiului imperiu spaniol.",
      "Mulți dintre cei care au lucrat în sere sau pe câmp au plecat de-acasă singuri, lăsând copiii cu bunicii. Pentru familiile astea, arborele e o punte: copiii, părinții și bunicii completează același arbore, fiecare de unde e, cu numele și poveștile pe care le știe.",
    ] },
  }),
  city({
    slug: "bilbao", country: "es", name: "Bilbao", mission: ["Bilbao"],
    notes: { ro: [
      "Bilbao și nordul Spaniei, din Țara Bascilor până în Navarra, La Rioja și Cantabria, au comunități românești mai mici decât Madridul sau Valencia, dar bine așezate. Mulți lucrează în industrie, construcții și în viile din La Rioja, unde au venit întâi la cules de struguri.",
      "Bilbao are un consulat general al României, care servește provinciile din nordul Spaniei; lista lor e pe pagina oficială a ambasadei. Pentru acte din România, procuri și transcrieri, programarea se face pe econsulat.ro.",
      "Actele spaniole se cer de la Registro Civil. Pentru familiile basce, Archivo Histórico Foral de Bizkaia și arhivele diecezane păstrează registre vechi, iar în Țara Bascilor actele pot fi în spaniolă și în bască.",
      "Ca peste tot în Spania, numele copiilor se scriu cu două nume de familie. Când îi treci în arbore, păstrează forma din actul românesc și notează și forma spaniolă: așa îi găsesc ușor și rudele din România, și cele din Spania.",
    ] },
  }),

  // ------------------------------------------------------------------ Germania
  city({
    slug: "munchen", country: "de", name: "München", mission: ["München"],
    notes: { ro: [
      "München și Bavaria au cea mai mare comunitate românească din Germania: atât sași și șvabi plecați din România înainte de 1990, cât și români veniți după 2007 și mai ales după 2014, când au putut lucra liber în Germania. Mulți lucrează în industria auto, în inginerie, în sănătate și în construcții.",
      "Consulatul general al României de la München se află pe Richard-Strauss-Straße 149, 81679 München, după lista oficială a Ministerului de Externe german. Programarea pentru certificate, procuri, pașapoarte și transcrieri se face pe econsulat.ro.",
      "Actele germane de stare civilă se cer de la Standesamt München, care poate elibera și certificate internaționale (mehrsprachig). Stadtarchiv München și Bayerisches Hauptstaatsarchiv păstrează documente vechi, utile pentru familiile mixte cu rădăcini bavareze.",
      "Pentru familiile de sași sau șvabi, același sat are adesea un nume german, unul maghiar și unul românesc. Când îl cauți pe Cartea Neamului, folosește numele românesc de azi; în arbore poți nota toate formele, ca să le găsească și rudele din Germania.",
    ] },
  }),
  city({
    slug: "nurnberg", country: "de", name: "Nürnberg", mission: ["München"],
    notes: { ro: [
      "Nürnberg și orașele din Franconia, precum Fürth și Erlangen, au o comunitate românească mare, în care se amestecă familii de sași și șvabi stabiliți aici din anii '70–'90 și români veniți după 2007. Mulți lucrează în industrie, logistică, sănătate și IT.",
      "Fiind în Bavaria, Nürnberg ține de obicei de consulatul general al României de la München; zona exactă e pe pagina oficială a ambasadei de la Berlin. Programarea se face pe econsulat.ro.",
      "Actele germane se cer de la Standesamt Nürnberg. Stadtarchiv Nürnberg are una dintre cele mai bogate arhive orășenești din Germania, iar Landeskirchliches Archiv al Bisericii Evanghelice din Bavaria, tot la Nürnberg, păstrează registre bisericești, utile pentru familiile mixte.",
      "Pentru cei veniți recent, arborele începe cu părinții și bunicii din România. Pentru familiile săsești, merită căutate și asociațiile pe sate de origine, care au strâns liste de familii, fotografii și cronici.",
    ] },
  }),
  city({
    slug: "stuttgart", country: "de", name: "Stuttgart", mission: ["Stuttgart"],
    notes: { ro: [
      "Stuttgart și Baden-Württemberg au mulți români, atât urmași ai sașilor și șvabilor stabiliți în sudul Germaniei, cât și muncitori și ingineri veniți după 2007, atrași de industria auto și de firmele de inginerie din regiune.",
      "Consulatul general al României de la Stuttgart se află pe Hauptstätter Straße 68–70, 70178 Stuttgart, după lista oficială a Ministerului de Externe german. Programarea pentru acte, procuri și transcrieri se face pe econsulat.ro.",
      "Actele germane se cer de la Standesamt Stuttgart. Landesarchiv Baden-Württemberg, cu sediul principal la Stuttgart, păstrează documente vechi ale landului, iar multe registre bisericești sunt în arhivele bisericilor evanghelice și catolice.",
      "Familiile de șvabi bănățeni din Baden-Württemberg au adesea strămoși plecați în secolul al XVIII-lea din sud-vestul Germaniei spre Banat. Un arbore complet poate face drumul întreg: din satul german, în Banat, și înapoi în Germania, două sute de ani mai târziu.",
    ] },
  }),
  city({
    slug: "berlin", country: "de", name: "Berlin", mission: ["Berlin"],
    notes: { ro: [
      "Berlinul are o comunitate românească tânără și diversă: studenți, cercetători, artiști, informaticieni, medici și muncitori, veniți mai ales după 2007. Mulți au plecat singuri și țin legătura cu familia de-acasă prin telefon.",
      "La Berlin se află Ambasada României, pe Dorotheenstraße 62–66, după lista oficială a Ministerului de Externe german. Secția ei consulară servește Berlinul și landurile din jur; programarea se face pe econsulat.ro.",
      "Actele germane se cer de la Standesamt-ul cartierului unde s-a petrecut evenimentul. Landesarchiv Berlin păstrează registre de stare civilă vechi, iar Bundesarchiv, tot la Berlin, are documente naționale, utile pentru cine caută urmele unor rude în Germania secolului XX.",
      "În Berlin are sediul și Institutul Cultural Român, cu evenimente și o bibliotecă. Pentru cine trăiește departe de familie, un arbore completat de la distanță, cu părinții și bunicii, e un fel de a păstra legătura și de a strânge poveștile lor înainte să se piardă.",
    ] },
  }),

  // ------------------------------------------------------------------ Marea Britanie
  city({
    slug: "londra", country: "gb", name: "Londra", mission: ["London"],
    notes: { ro: [
      "Londra are cea mai mare comunitate românească din Marea Britanie, crescută foarte repede după 2014. Mulți români locuiesc în nordul și estul orașului, în cartiere ca Harrow, Brent, Enfield, Haringey, Barking și Newham, și lucrează în construcții, transport, sănătate, finanțe și IT.",
      "Ambasada României e la Arundel House, 4 Palace Green, London W8 4QD, iar secția ei consulară la M.E.I.C. House, 344 Kensington High Street, London W14 8NS, după lista oficială a Comisiei Europene. Programarea se face pe econsulat.ro.",
      "Actele britanice se cer de la General Register Office pentru Anglia și Țara Galilor sau de la register office-ul cartierului (borough) unde s-a înregistrat evenimentul. London Metropolitan Archives păstrează registre parohiale și documente vechi ale orașului, iar The National Archives, la Kew, are documentele naționale.",
      "Pentru că Marea Britanie nu mai e în Uniunea Europeană, actele românești folosite aici au nevoie de apostilă și traducere, iar cele britanice folosite în România de apostila FCDO. Ține copii scanate ale actelor în arbore: îți scutesc multe drumuri.",
    ] },
  }),
  city({
    slug: "manchester", country: "gb", name: "Manchester", mission: ["Manchester"],
    notes: { ro: [
      "Manchester și orașele din nord-vestul Angliei au o comunitate românească în creștere, formată mai ales după 2014: muncitori, studenți la universitățile orașului, medici și asistente în spitalele din regiune.",
      "Consulatul general al României de la Manchester se află la 9 Cooper Street, Manchester M2 2FW, după lista oficială a Comisiei Europene. Pentru certificate din România, procuri și transcrierea nașterilor, programarea se face pe econsulat.ro.",
      "Actele britanice se cer de la General Register Office sau de la register office-ul local. Manchester Central Library găzduiește Archives+, cu arhivele orașului și ale regiunii, iar indexurile nașterilor, căsătoriilor și deceselor din Anglia se pot căuta gratuit pe FreeBMD.",
      "Copiii născuți în Anglia din părinți români au nevoie de transcrierea nașterii pentru acte românești, cu certificatul britanic apostilat și tradus. Merită făcută din timp, ca să nu fie o grabă când copilul are nevoie de pașaport.",
    ] },
  }),
  city({
    slug: "edinburgh", country: "gb", name: "Edinburgh", mission: ["Edinburgh"],
    notes: { ro: [
      "Edinburgh și Scoția au o comunitate românească mai mică decât Anglia, dar tot mai vizibilă după 2014: studenți și cercetători la universitățile scoțiene, medici, ingineri și muncitori în turism, construcții și agricultură.",
      "Consulatul general al României de la Edinburgh se află la 7–9 North St David Street, Edinburgh EH2 1AW, după lista oficială a Comisiei Europene. Programarea pentru acte se face pe econsulat.ro.",
      "Scoția are propriul sistem de stare civilă, separat de Anglia: înregistrarea civilă începe aici în 1855, iar actele se cer de la National Records of Scotland. Registrele vechi, recensămintele și testamentele scoțiene se pot căuta pe ScotlandsPeople, una dintre cele mai bune surse genealogice online din lume.",
      "Pentru familiile mixte româno-scoțiene, partea scoțiană a arborelui se poate face adesea până în secolul al XVIII-lea, din registrele parohiale vechi. Partea românească începe la bunicii din țară: întreabă-i, apoi caută satul pe Cartea Neamului.",
    ] },
  }),

  city({
    slug: "birmingham", country: "gb", name: "Birmingham",
    notes: { ro: [
      "Birmingham și West Midlands au una dintre comunitățile românești mari din Anglia, formată mai ales după 2014: muncitori în construcții, logistică și fabrici, șoferi, asistente și medici, dar și mulți antreprenori care și-au deschis firme mici.",
      "Birmingham nu are consulat al României. Actele se cer la secția consulară a ambasadei de la Londra sau la consulatul general de la Manchester, după zona fiecăruia trecută pe pagina oficială; programarea se face pe econsulat.ro.",
      "Actele britanice se cer de la General Register Office sau de la register office-ul din Birmingham. Library of Birmingham găzduiește arhivele orașului, cu registre parohiale și documente locale, iar indexurile de stare civilă din Anglia și Țara Galilor se pot căuta gratuit pe FreeBMD.",
      "Pentru actele românești folosite în Anglia îți trebuie apostilă și traducere, iar pentru cele britanice folosite în România, apostila FCDO. Păstrează în arbore copii ale actelor importante ale familiei: certificatele de naștere și căsătorie ale părinților și bunicilor îți vor folosi mereu.",
    ] },
  }),

  // ------------------------------------------------------------------ Israel
  city({
    slug: "tel-aviv", country: "il", name: "Tel Aviv", mission: ["Tel Aviv", "Ramat Gan"],
    notes: { ro: [
      "Tel Aviv și orașele din jur, de la Ramat Gan și Givatayim până la Holon, Bat Yam și Petah Tikva, au primit după 1948 zeci de mii de evrei din România. Mulți au păstrat zeci de ani limba română acasă, ziare și cafenele românești, iar nepoții lor caută azi orașele de unde au plecat bunicii.",
      "Ambasada României e la Tel Aviv, iar secția ei consulară la Ramat Gan, în Paz Tower 2, Str. Shoham 2, etajul 8, după lista oficială a Comisiei Europene. Programarea se face pe econsulat.ro.",
      "Pentru actele israeliene, Rashut HaUhlusin (Autoritatea pentru Populație și Imigrație) eliberează certificatele de stare civilă. Arhivele Statului Israel păstrează dosarele de imigrare și alte documente utile, iar Yad Vashem are baza de date a numelor victimelor Holocaustului.",
      "Cel mai important lucru pentru arbore e numele de familie dinainte de emigrare, așa cum era scris în România. Caută-l în actele vechi ale bunicilor: certificate românești, pașapoarte, scrisori. Cu el poți cere actele de la primăria sau de la arhiva județeană din orașul de origine.",
    ] },
  }),
  city({
    slug: "haifa", country: "il", name: "Haifa", mission: ["Tel Aviv", "Ramat Gan"],
    notes: { ro: [
      "Haifa și nordul Israelului au primit, după 1948, mulți imigranți din România, care au lucrat în port, în industrie și în noile cartiere ale orașului. Ca și în Tel Aviv, prima generație vorbea româna acasă, iar nepoții vorbesc azi ebraica.",
      "Haifa nu are consulat al României; actele se cer la secția consulară a Ambasadei, la Ramat Gan (Paz Tower 2, Str. Shoham 2, etajul 8), cu programare pe econsulat.ro.",
      "Portul Haifa a fost locul de sosire al multor imigranți, iar listele de sosire și dosarele de imigrare sunt la Arhivele Statului Israel. Pentru perioada Holocaustului, Yad Vashem păstrează numele victimelor și mărturiile completate de rude.",
      "Pentru familiile venite din Transilvania de nord sau din Maramureș, actele din anii 1940–1944 sunt în maghiară, iar orașele au și nume maghiare (Nagyvárad pentru Oradea, Máramarossziget pentru Sighet). Pe Cartea Neamului găsești localitatea după numele ei românesc de azi.",
    ] },
  }),
];

/** Orașele noi din SUA și Canada (în română; cele cinci mari de dinainte, cu engleza lor, sunt în america.ts). */
export const AMERICA_CITIES: Region[] = [
  city({
    slug: "sacramento", country: "us", parent: "california", name: "Sacramento", mission: ["Los Angeles"],
    notes: { ro: [
      "Sacramento și orașele din jur, precum Citrus Heights, Roseville, Rancho Cordova și Elk Grove, au una dintre cele mai mari comunități românești din vestul Statelor Unite. S-a format mai ales după 1990, când au venit familii întregi, adesea cu mulți copii, care și-au adus apoi rudele.",
      "Pentru actele din România, California ține de consulatul general al României de la Los Angeles (11766 Wilshire Boulevard, Suite 560), după lista oficială a Comisiei Europene și a ambasadei. Programarea se face pe econsulat.ro, iar o parte din servicii se pot face prin corespondență.",
      "Actele americane de naștere, căsătorie și deces se cer de la County Clerk-Recorder al comitatului unde s-a petrecut evenimentul sau de la California Department of Public Health. La Sacramento se află și California State Archives, cu documente vechi ale statului.",
      "Multe familii de aici au plecat din același sat sau din aceeași zonă a României și s-au regăsit în California. Asta face arborele mai ușor: verii, unchii și bunicii sunt adesea la câțiva kilometri unii de alții, iar fiecare poate completa ce știe.",
    ] },
  }),
  city({
    slug: "detroit", country: "us", parent: "michigan", name: "Detroit", mission: ["Chicago"],
    notes: { ro: [
      "Detroit e unul dintre orașele cu cea mai veche prezență românească din America: în primele decenii ale secolului XX, industria auto a adus aici muncitori din Transilvania și Banat. Comunitatea a avut cluburi, societăți de ajutor reciproc și presă proprie, iar după 1990 au venit ingineri și familii noi, mai ales în suburbii.",
      "Michigan ține de obicei de consulatul general al României de la Chicago (737 North Michigan Avenue, Suite 2300); zona exactă e pe pagina oficială a ambasadei de la Washington. La Detroit există și un consulat general onorific, trecut pe site-ul Ministerului Afacerilor Externe.",
      "Pentru strămoșii veniți de mult, Burton Historical Collection de la Detroit Public Library e una dintre cele mai cunoscute colecții genealogice din America. Actele de stare civilă din Michigan se cer de la comitat sau de la Michigan Vital Records.",
      "Un indiciu de știut: mulți urmași ai primului val și-au americanizat numele de familie mai târziu, nu la sosire. Dosarul de naturalizare trece de obicei ambele forme și, adesea, satul de origine.",
    ] },
  }),
  city({
    slug: "cleveland", country: "us", parent: "ohio", name: "Cleveland", mission: ["Chicago"],
    notes: { ro: [
      "Cleveland are una dintre cele mai vechi comunități românești din Statele Unite. Pe la 1900–1920, mii de țărani din satele din jurul Sibiului, Făgărașului, Albei și din Banat au venit să lucreze în oțelăriile și fabricile orașului, iar mulți și-au adus apoi familiile.",
      "Ohio ține de obicei de consulatul general al României de la Chicago; zona exactă e pe pagina oficială a ambasadei. Programarea pentru acte se face pe econsulat.ro.",
      "Pentru istoria comunității, Western Reserve Historical Society are colecții despre grupurile etnice din Cleveland, iar Cuyahoga County păstrează actele de stare civilă și dosarele de naturalizare vechi ale comitatului. Recensămintele americane din 1910, 1920 și 1930 notează limba maternă, anul sosirii și cetățenia.",
      "Mulți urmași ai primului val știu doar că bunicul „era din Transilvania”. Cu satul găsit în dosarul de naturalizare sau pe lista de pasageri, îl poți căuta pe Cartea Neamului ca să afli comuna, județul și arhiva unde sunt registrele lui vechi.",
    ] },
  }),
  city({
    slug: "miami", country: "us", parent: "florida", name: "Miami", mission: ["Miami"],
    notes: { ro: [
      "Miami și sudul Floridei au o comunitate românească formată în mare parte după 1990: oameni de afaceri, specialiști, pensionari veniți din alte state americane și familii atrase de clima și de economia regiunii.",
      "Orașul are un consulat general al României, trecut pe pagina oficială a ambasadei de la Washington. Pentru certificate din România, procuri, pașapoarte și transcrierea nașterilor, programarea se face pe econsulat.ro.",
      "Actele de stare civilă din Florida se cer de la Florida Bureau of Vital Statistics sau de la departamentul de sănătate al comitatului. Actele americane folosite în România au nevoie de apostilă, pusă de Secretary of State al Floridei, și de traducere.",
      "Mulți români din Florida au venit după ce au trăit în alte state sau în alte țări, așa că familia e împrăștiată pe mai multe continente. Un arbore comun, pe care îl completează fiecare de unde e, adună la un loc ce știe fiecare.",
    ] },
  }),
  city({
    slug: "vancouver", country: "ca", parent: "british-columbia", name: "Vancouver", mission: ["Vancouver"],
    notes: { ro: [
      "Vancouver și orașele din jur, precum Burnaby, Surrey și Coquitlam, au o comunitate românească formată mai ales după 1990: ingineri, informaticieni, medici și familii tinere venite prin programele de imigrare canadiene.",
      "Consulatul general al României de la Vancouver se află la 555 Burrard Street, Suite 855, după lista oficială a Comisiei Europene. Pentru acte din România, procuri și transcrierea nașterilor, programarea se face pe econsulat.ro.",
      "Actele de stare civilă din British Columbia se cer de la BC Vital Statistics Agency. BC Archives, de la Royal BC Museum din Victoria, au indexuri vechi de nașteri, căsătorii și decese, căutabile online, iar Library and Archives Canada are recensămintele și listele de sosire.",
      "Din ianuarie 2024 Canada folosește apostila de la Haga: actele canadiene folosite în România se apostilează în Canada și se traduc. Copiii născuți aici din părinți români au nevoie de transcrierea nașterii pentru acte românești.",
    ] },
  }),
  city({
    slug: "calgary", country: "ca", parent: "alberta", name: "Calgary",
    notes: { ro: [
      "Calgary și Edmonton au comunități românești crescute mult după 2000, mai ales prin ingineri și specialiști în energie, IT și construcții. Alberta are însă și o istorie românească mult mai veche: la sfârșitul secolului al XIX-lea, coloniști din Bucovina au primit pământ în prerii, iar satul Boian, din Alberta, poartă numele satului bucovinean din care au plecat.",
      "Calgary nu are consulat al României. Actele se cer la consulatul de care ține Alberta, după lista oficială a ambasadei de la Ottawa, cu programare pe econsulat.ro.",
      "Actele de stare civilă din Alberta se cer de la Alberta Vital Statistics. Provincial Archives of Alberta, la Edmonton, păstrează documente despre coloniștii din prerii, iar Library and Archives Canada are recensămintele din 1906, 1916 și 1926 pentru provinciile prerilor.",
      "Pentru urmașii coloniștilor din Bucovina, ține minte că strămoșii apar în actele canadiene de atunci ca „Austrian”, iar satele lor sunt azi fie în județul Suceava, fie în regiunea Cernăuți, în Ucraina. Pe Cartea Neamului găsești satele din România după numele lor de azi.",
    ] },
  }),
];
