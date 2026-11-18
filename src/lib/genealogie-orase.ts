/**
 * Pasul 3 al extinderii diaspora (Daniel, 17.11.2026): paginile /genealogie/<oraș> pentru orașele mari din România. Fiecare
 * spune cum îți cauți strămoșii din oraș: numele vechi ale orașului, confesiunile și registrele lor, arhiva județeană,
 * particularități. Datele comune (arhiva, regiunea, comunele din jur, numele frecvente din regiune) vin din paginile de
 * localități (content/localitati, src/lib/continut). Paginile regionale (/genealogie/regiune/<regiune>) le face alt fir;
 * legăturile spre ele apar doar după ce sunt publicate (REGION_PAGES_LIVE).
 */
export type GenCity = {
  slug: string; name: string; county: string;
  /** Pagina regională de legat (/genealogie/regiune/<slug>); null = prima regiune a județului. */
  region: "transilvania" | "banat" | "moldova" | "dobrogea" | "crisana" | "muntenia" | "oltenia" | null;
  /** Numele orașului în alte limbi, în actele vechi. */
  oldNames: string[];
  body: { h: string; p: string[] }[];
};

/** Paginile regionale, de la firul de SEO (confirmat 17.11.2026): /genealogie/regiune/<slug>. Devine `true` când sunt publicate. */
export const REGION_PAGES_LIVE = true;
export const regionPagePath = (slug: string) => `/genealogie/regiune/${slug}`;
export const REGION_LABEL: Record<string, string> = {
  transilvania: "Transilvania", banat: "Banat", bucovina: "Bucovina", basarabia: "Basarabia", moldova: "Moldova", dobrogea: "Dobrogea", maramures: "Maramureș",
  crisana: "Crișana", muntenia: "Muntenia", oltenia: "Oltenia",
};
export const GEN_HUB = "/genealogie";
export const genCityPath = (c: GenCity) => `${GEN_HUB}/${c.slug}`;
export const GEN_UPDATED = new Date("2026-11-17T00:00:00Z");

export const GEN_CITIES: GenCity[] = [
  {
    slug: "cluj-napoca", name: "Cluj-Napoca", county: "cluj", region: "transilvania", oldNames: ["Kolozsvár (maghiară)", "Klausenburg (germană)", "Cluj (până în 1974)"],
    body: [
      { h: "Un oraș cu multe confesiuni", p: [
        "Clujul a fost timp de secole un oraș cu mai multe neamuri și confesiuni: români ortodocși și greco-catolici, maghiari reformați, romano-catolici și unitarieni, sași luterani și o comunitate evreiască importantă. Fiecare confesiune și-a ținut registrele ei de botezuri, cununii și înmormântări, așa că primul lucru de aflat despre un strămoș e biserica de care ținea.",
        "Orașul e și centrul Bisericii Unitariene din Transilvania și sediul unei eparhii greco-catolice, ceea ce înseamnă că o parte din registrele vechi ale familiilor din județ au trecut, de-a lungul timpului, prin arhivele acestor instituții.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Starea civilă de stat a început în Transilvania la 1 octombrie 1895, iar registrele dintre 1895 și 1918 sunt în maghiară. Registrele de stare civilă mai vechi de 100 de ani și registrele parohiale predate statului sunt la Serviciul Județean Cluj al Arhivelor Naționale; actele mai noi se cer de la starea civilă a primăriei.",
        "Numele orașului apare în actele vechi ca Kolozsvár sau Klausenburg, iar până în 1974 s-a numit simplu Cluj. Numele de botez se schimbă și ele de la o limbă la alta: același om poate fi Ioan, János sau Johann. Notează în arbore toate formele găsite.",
      ] },
      { h: "Cine a venit în Cluj", p: [
        "Ca toate orașele mari, Clujul a crescut mult în secolul XX cu oameni din satele din jur și din toată Transilvania, mai ales după 1950. Mulți clujeni au deci strămoși în comunele județului sau în județele vecine (Sălaj, Bistrița-Năsăud, Alba, Mureș). Dacă bunicii tăi s-au mutat în oraș, registrele lor vechi sunt în satul de unde au venit, nu în Cluj.",
      ] },
      { h: "Școli, universitate și meserii", p: [
        "Clujul a fost și un oraș al școlilor. Universitatea maghiară s-a deschis în 1872, iar din 1919 orașul a avut universitate românească. Dacă un strămoș a studiat aici, matricolele și cataloagele școlilor și ale universității pot da data și locul nașterii, numele părinților și confesiunea, chiar și când registrele parohiale lipsesc.",
        "Pentru meseriași, breslele orașului și apoi asociațiile lor au lăsat liste de ucenici și calfe. Pentru familiile de țărani din jur, foile de conscripție și, după 1895, registrele de stare civilă ale satelor sunt mai de folos. Începe mereu cu ce știi sigur: un nume, un an, un sat, apoi caută registrul potrivit.",
      ] },
    ],
  },
  {
    slug: "bucuresti", name: "București", county: "bucuresti", region: "muntenia", oldNames: ["Bukarest (germană)", "Bükrös (maghiară)"],
    body: [
      { h: "Registrele Bucureștiului", p: [
        "În Țara Românească, registrele de stare civilă au fost ținute din anii 1830 de preoți, după Regulamentul Organic, iar din decembrie 1865 de primării. Bucureștiul are deci registre de nașteri, căsătorii și decese foarte vechi, pe parohii și apoi pe circumscripții. Cele mai vechi de 100 de ani sunt la Serviciul Municipiului București al Arhivelor Naționale; cele mai noi, la starea civilă a sectorului.",
        "În secolul al XIX-lea, orașul era împărțit în „culori” (Roșu, Galben, Negru, Verde, Albastru), iar actele și recensămintele vechi pomenesc adesea culoarea și mahalaua, de obicei după biserica parohiei. Cu numele mahalalei poți găsi parohia și, prin ea, registrele familiei.",
      ] },
      { h: "Un oraș în care au venit oameni din toată țara", p: [
        "Bucureștiul a crescut repede, mai ales în secolul XX, cu oameni veniți din toate regiunile țării. Majoritatea bucureștenilor de azi au bunici sau străbunici născuți în altă parte, așa că arborele familiei duce aproape mereu în afara orașului. Caută în actele bunicilor locul nașterii: de acolo începe drumul spre registrele vechi.",
        "Datele din actele de dinainte de 1919 sunt de obicei după calendarul vechi (iulian): în secolul al XIX-lea, cu 12 zile în urma calendarului de azi, iar după 1900 cu 13. Când compari date din surse diferite, verifică stilul.",
      ] },
      { h: "Arhivele din București", p: [
        "Pe lângă serviciul municipal, în București se află și sediul central al Arhivelor Naționale, cu fonduri de interes național: catagrafii, documente ale instituțiilor statului, acte ale fostelor ministere. Biblioteca Academiei Române păstrează manuscrise, ziare vechi și colecții de documente utile pentru istoria familiilor.",
      ] },
      { h: "Cimitire, străzi și case", p: [
        "Bucureștiul a devenit capitala Principatelor Unite în 1862. Pe lângă registrele de stare civilă, merită căutate registrele cimitirelor: Bellu s-a deschis în 1858, iar fiecare cimitir mare ține evidența locurilor de veci și a celor înmormântați, adesea cu data decesului și cu numele familiei care plătește locul.",
        "Anuarele Bucureștiului de la sfârșitul secolului al XIX-lea și din prima jumătate a secolului XX, aflate în marile biblioteci, trec negustorii, meseriașii și firmele, cu adresa lor. Cu o adresă poți afla parohia și, uneori, cine mai locuia în aceeași casă. Numele de străzi s-au schimbat de mai multe ori, așa că verifică pe hărțile vechi.",
      ] },
    ],
  },
  {
    slug: "iasi", name: "Iași", county: "iasi", region: "moldova", oldNames: ["Jassy (germană și franceză)", "Jászvásár (maghiară)"],
    body: [
      { h: "Vechea capitală a Moldovei", p: [
        "Iașiul a fost capitala Moldovei până în 1862, la câțiva ani după Unirea din 1859, și unul dintre cele mai mari orașe ale țării, cu boieri, negustori, meșteșugari și o comunitate evreiască foarte mare. Pentru genealogie, asta înseamnă documente bogate: catagrafii, acte de proprietate, registre parohiale și, din anii 1830, registre de stare civilă ținute de preoți.",
        "Catagrafiile, recensămintele fiscale ale Moldovei din secolele XVIII–XIX, arată capii de familie din fiecare mahala și sat, uneori cu meseria și cu numele copiilor. Sunt sursa principală pentru familiile de dinainte de registrele de stare civilă.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Din decembrie 1865, starea civilă e ținută de primării. Registrele mai vechi de 100 de ani sunt la Serviciul Județean Iași al Arhivelor Naționale, iar actele mai noi se cer de la primărie. Registrele din anii 1830–1860 pot fi scrise cu alfabetul chirilic sau cu alfabetul de tranziție, iar datele de dinainte de 1919 sunt după calendarul vechi.",
        "Pentru familiile evreiești din Iași, registrele de stare civilă de după 1865 îi cuprind și pe ei, ca pe toți locuitorii orașului. Mulți au emigrat în secolul XX, mai ales în Statele Unite și în Israel, iar urmașii lor caută azi actele bunicilor după numele scris în România.",
      ] },
      { h: "Satele din jur", p: [
        "Multe familii ieșene vin din comunele județului și din județele vecine, Vaslui, Neamț și Botoșani. Dacă bunicii s-au mutat la Iași în secolul XX, registrele lor vechi sunt la parohia și la primăria satului de origine.",
      ] },
      { h: "Universitatea și cimitirele", p: [
        "La Iași s-a deschis în 1860 prima universitate modernă din România, așa că mulți studenți din toată Moldova au trecut prin oraș. Matricolele universității și ale liceelor vechi, precum Liceul Național, pot arăta locul nașterii și numele tatălui unui strămoș care a învățat aici.",
        "Cimitirul Eternitatea și cimitirele parohiilor vechi au registre de înmormântări, iar comunitatea evreiască a avut cimitirele ei, cu pietre funerare care poartă numele tatălui celui îngropat. Pietrele de mormânt sunt o sursă bună când actul de deces lipsește: fotografiază-le și treci datele în arbore, cu locul de unde le-ai luat.",
      ] },
    ],
  },
  {
    slug: "timisoara", name: "Timișoara", county: "timis", region: "banat", oldNames: ["Temesvár (maghiară)", "Temeswar sau Temeschburg (germană)", "Temišvar (sârbă)"],
    body: [
      { h: "Orașul Banatului", p: [
        "Timișoara a intrat sub stăpânire habsburgică în 1716, după mai bine de 160 de ani de stăpânire otomană, și a devenit centrul Banatului. Au urmat colonizările din secolul al XVIII-lea, cu germani (șvabi), dar și cu alți coloniști, așa că orașul și satele din jur au avut români, șvabi, maghiari, sârbi, evrei, bulgari și slovaci.",
        "Fiecare comunitate și-a ținut registrele în limba și la biserica ei: romano-catolicii în latină și apoi în germană sau maghiară, ortodocșii români și sârbi în română, sârbă sau slavonă, greco-catolicii în latină sau română. Pentru o familie bănățeană, confesiunea e cheia registrelor.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Starea civilă de stat începe și în Banat la 1 octombrie 1895, cu registre în maghiară până în 1918. Registrele mai vechi de 100 de ani și registrele parohiale predate statului sunt la Serviciul Județean Timiș al Arhivelor Naționale; actele mai noi, la primărie.",
        "Același sat poate avea trei sau patru nume în acte: unul românesc, unul german, unul maghiar și, uneori, unul sârbesc. Pagina localității de pe Cartea Neamului te ajută să afli numele de azi.",
      ] },
      { h: "Familii plecate", p: [
        "Mulți șvabi bănățeni au plecat în Germania în anii '70–'90, iar mulți români din Banat au emigrat la începutul secolului XX în America. Urmașii lor caută azi satele bunicilor, iar actele vechi sunt de obicei tot aici, la arhiva județeană.",
      ] },
      { h: "Cartierele istorice și parohiile lor", p: [
        "Timișoara s-a format din cetate și din mai multe cartiere aflate odinioară la distanță de ea: Fabric, Iosefin, Elisabetin, Mehala și altele. Fiecare cartier a avut bisericile lui, romano-catolice, ortodoxe sârbe și române, așa că adresa familiei arată adesea parohia unde au fost botezați copiii.",
        "Orașul a avut din 1884 iluminat public electric pe străzi, printre primele din Europa, semn al unei industrii timpurii care a adus muncitori din tot Banatul. Pentru strămoșii veniți la fabrici, registrele parohiale ale cartierului Fabric sau Iosefin și registrele de stare civilă de după 1895 sunt primul loc de căutat. Trece în arbore și numele străzii, nu doar al orașului.",
      ] },
    ],
  },
  {
    slug: "brasov", name: "Brașov", county: "brasov", region: "transilvania", oldNames: ["Kronstadt (germană)", "Brassó (maghiară)", "Orașul Stalin (1950–1960)"],
    body: [
      { h: "Orașul sașilor și Șcheii Brașovului", p: [
        "Brașovul a fost unul dintre marile orașe săsești ale Transilvaniei, cu cetatea și Biserica Neagră în centru. Românii au trăit de secole în Șcheii Brașovului, unde biserica Sfântul Nicolae are una dintre cele mai vechi școli românești. În satele din jur, în Țara Bârsei, au fost și sate săsești, și sate românești.",
        "Comunitatea evanghelică săsească și-a păstrat registrele și arhivele cu mare grijă, iar parohia evanghelică din Brașov are o arhivă proprie importantă. Pentru familiile românești din Șchei, registrele parohiilor ortodoxe sunt sursa principală pentru anii de dinainte de 1895.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Starea civilă de stat începe la 1 octombrie 1895, cu registre în maghiară până în 1918. Registrele mai vechi de 100 de ani sunt la Serviciul Județean Brașov al Arhivelor Naționale, iar actele mai noi la primărie.",
        "Între 1950 și 1960 orașul s-a numit „Orașul Stalin”, iar actele din acei ani poartă acest nume. Nu te încurca: e tot Brașovul.",
      ] },
      { h: "Oameni veniți la fabrici", p: [
        "După 1950, industria a adus la Brașov zeci de mii de oameni din toată țara, mai ales din Moldova. Mulți brașoveni de azi au deci bunici născuți în alte județe, iar registrele familiei sunt acolo.",
      ] },
      { h: "Tipăriturile și școala din Șchei", p: [
        "În secolul al XVI-lea, diaconul Coresi a tipărit la Brașov, în Șchei, cărți în limba română, printre cele mai vechi din țară. Școala de lângă biserica Sfântul Nicolae păstrează azi un muzeu și documente vechi ale comunității românești din Șchei, inclusiv acte ale familiilor care au slujit biserica.",
        "Pentru familiile săsești, matricolele gimnaziului Honterus și registrele bisericii evanghelice duc adesea cu multe generații în urmă. Pentru familiile românești din Țara Bârsei, caută întâi în registrele parohiilor ortodoxe și greco-catolice din satul de origine, apoi în conscripțiile vremii. Notează numele satelor în română, germană și maghiară, pentru că toate trei apar în acte. Un sat din Țara Bârsei, cum e Hărmanul, poate apărea ca Honigberg sau Szászhermány, și e tot același loc, cu aceleași registre.",
      ] },
    ],
  },
  {
    slug: "constanta", name: "Constanța", county: "constanta", region: "dobrogea", oldNames: ["Tomis (în Antichitate)", "Küstendje sau Köstence (turcă)"],
    body: [
      { h: "Dobrogea după 1878", p: [
        "Dobrogea a fost sub stăpânire otomană până în 1878, când a intrat în componența României. Constanța, port la Marea Neagră, avea atunci turci, tătari, greci, armeni, bulgari, evrei și români, iar în deceniile următoare au venit mulți coloniști români din toate provinciile, inclusiv mocani din Transilvania, cu turmele lor.",
        "Pentru genealogie, asta înseamnă că registrele românești de stare civilă încep aici abia după 1878; pentru anii de dinainte, sursele sunt rare și împrăștiate, iar unele sunt în arhivele otomane.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Registrele de stare civilă mai vechi de 100 de ani sunt la Serviciul Județean Constanța al Arhivelor Naționale, iar actele mai noi la primărie. Comunitățile musulmane, grecești, armenești și lipovenești au avut și registrele lor religioase, în limbile lor.",
        "Multe familii de constănțeni au venit în secolul XX din alte regiuni, mai ales din Muntenia, Moldova și Transilvania, sau din Cadrilater, după 1940. Locul nașterii din actele bunicilor arată de unde trebuie continuată căutarea.",
      ] },
      { h: "Un oraș-port", p: [
        "Portul a adus mereu oameni de pe alte țărmuri. Dacă printre strămoși ai marinari, negustori sau lucrători în port, întreabă la arhiva județeană ce fonduri ale instituțiilor portuare păstrează pentru anii care te interesează.",
      ] },
      { h: "Comunitățile vechi ale orașului", p: [
        "Moscheea Carol I, ridicată între 1910 și 1913, arată cât de importantă era comunitatea musulmană a orașului, de turci și tătari. Familiile acestea au nume care s-au scris diferit în actele românești, după cum le-a auzit funcționarul, așa că merită căutate toate formele lor.",
        "Pentru familiile de greci, armeni și evrei din Constanța, sursele sunt registrele bisericilor și ale comunităților lor, acolo unde s-au păstrat, plus registrele de stare civilă de după 1878. Pentru coloniștii români veniți din alte provincii, actele de împroprietărire de la începutul secolului XX pot arăta locul de unde au plecat. Întreabă la arhiva județeană ce fonduri de împroprietărire există pentru satul tău. Pentru familiile venite din Cadrilater în 1940, caută și satul de origine din sudul Dobrogei, azi în Bulgaria, cu numele lui de atunci.",
      ] },
    ],
  },
  {
    slug: "craiova", name: "Craiova", county: "dolj", region: "oltenia", oldNames: [],
    body: [
      { h: "Cetatea băniei", p: [
        "Craiova a fost reședința băniei Olteniei și cel mai mare oraș al regiunii. Între 1718 și 1739, Oltenia a fost sub stăpânire habsburgică, iar administrația austriacă a lăsat recensăminte și hărți ale satelor oltenești, folosite și azi de istorici și genealogiști.",
        "Ca în tot Vechiul Regat, registrele de stare civilă au fost ținute din anii 1830 de preoți, iar din decembrie 1865 de primării. Pentru anii de dinainte, sursa principală sunt catagrafiile și registrele parohiale.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Registrele mai vechi de 100 de ani sunt la Serviciul Județean Dolj al Arhivelor Naționale, iar actele mai noi la primărie. Datele de dinainte de 1919 sunt după calendarul vechi, iar registrele din anii 1830–1860 pot fi scrise cu alfabetul chirilic sau cu cel de tranziție.",
        "Mulți craioveni au bunici în satele Doljului, ale Oltului, Gorjului sau Mehedințiului. Dacă familia s-a mutat în oraș în secolul XX, registrele vechi sunt la parohia și primăria satului de origine.",
      ] },
      { h: "Oltenii plecați", p: [
        "Din Oltenia au plecat după 2000 mulți oameni la muncă în Spania și Italia. Pentru copiii lor, crescuți acolo, arborele familiei începe cu bunicii rămași în satele din jurul Craiovei, care încă știu numele și poveștile străbunicilor.",
      ] },
      { h: "Casa Băniei și familiile vechi", p: [
        "Casa Băniei, cea mai veche clădire civilă păstrată în Craiova, refăcută la 1699, amintește că orașul a fost centrul administrației Olteniei. Boierii, negustorii și meșteșugarii orașului apar în documente de proprietate, în hotărnicii și în actele judecătorești, utile când cauți o familie veche de dinainte de 1830.",
        "Multe nume de familie oltenești se termină în -escu, care la început arăta familia cuiva: Popescu, al popii; Ionescu, al lui Ion. De aceea, numele de familie singur nu ajunge pentru a lega două familii. Leagă oamenii prin acte: botez, cununie, naș, sat. Un nume de naș care se repetă de la o generație la alta e un indiciu bun că ai găsit familia potrivită. Și poreclele din sat, trecute uneori în acte, ajută să deosebești două familii cu același nume.",
      ] },
    ],
  },
  {
    slug: "oradea", name: "Oradea", county: "bihor", region: "crisana", oldNames: ["Nagyvárad (maghiară)", "Großwardein (germană)"],
    body: [
      { h: "Orașul de pe Crișul Repede", p: [
        "Oradea a fost un mare oraș al Crișanei, cu cetatea ei, cu episcopii romano-catolică și greco-catolică și cu o puternică viață negustorească. În oraș au trăit maghiari, români, evrei și germani, iar fiecare confesiune și-a ținut registrele proprii.",
        "Comunitatea evreiască din Oradea a fost una dintre cele mai mari din regiune, până la deportările din 1944, când orașul era sub administrație maghiară. Urmașii supraviețuitorilor caută azi actele familiei în registrele de stare civilă și în bazele de date ale Yad Vashem.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Starea civilă de stat începe la 1 octombrie 1895, cu registre în maghiară până în 1918 și din nou între 1940 și 1944. Registrele mai vechi de 100 de ani și registrele parohiale predate statului sunt la Serviciul Județean Bihor al Arhivelor Naționale; actele mai noi, la primărie.",
        "Numele orașului apare în acte ca Nagyvárad sau Großwardein, iar multe sate bihorene au și nume maghiare. Pagina localității de pe Cartea Neamului îți arată numele de azi al satului.",
      ] },
      { h: "Familii plecate din Bihor", p: [
        "La începutul secolului XX, mulți bihoreni au emigrat în America, iar după 1990 mulți au plecat în Europa de Vest. Listele de pasageri ale vremii trec adesea satul cu numele maghiar, așa că merită căutate amândouă formele.",
      ] },
      { h: "Registrele greco-catolice și arhitectura nouă", p: [
        "Mulți români din Bihor au fost greco-catolici, iar registrele parohiilor lor au fost ținute adesea în latină. Formele latine ale numelor de botez sunt ușor de recunoscut: Joannes pentru Ioan, Georgius pentru Gheorghe, Maria rămâne Maria. Notează în arbore forma din act, apoi forma pe care o folosea familia.",
        "La începutul secolului XX, Oradea a crescut repede și și-a schimbat înfățișarea, cu multe clădiri noi în centru. Mulți dintre cei veniți atunci la oraș erau din satele bihorene, iar registrele lor sunt la parohiile de acolo. Pentru familiile de meseriași și negustori ai orașului, registrele firmelor și anuarele vremii pot completa datele din actele de stare civilă. Pentru anii 1940–1944, când orașul a fost sub administrație maghiară, actele sunt din nou în maghiară, iar numele oamenilor sunt adesea scrise în formă maghiară.",
      ] },
    ],
  },
  {
    slug: "sibiu", name: "Sibiu", county: "sibiu", region: "transilvania", oldNames: ["Hermannstadt (germană)", "Nagyszeben (maghiară)"],
    body: [
      { h: "Capitala sașilor și a românilor din Transilvania", p: [
        "Sibiul a fost principalul oraș al sașilor din Transilvania, iar Biserica Evanghelică din România își are și azi centrul aici. Arhiva centrală a acestei biserici, la Sibiu, păstrează registre ale multor parohii săsești, foarte utile pentru familiile de sași.",
        "Sibiul a fost și un centru al românilor transilvăneni: aici a păstorit mitropolitul Andrei Șaguna, aici își are sediul Mitropolia Ardealului și aici s-a înființat, în 1861, Asociațiunea ASTRA. Instituțiile acestea au lăsat arhive și publicații prețioase pentru istoria familiilor românești.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Starea civilă de stat începe la 1 octombrie 1895, cu registre în maghiară până în 1918. Registrele mai vechi de 100 de ani sunt la Serviciul Județean Sibiu al Arhivelor Naționale; actele mai noi, la primărie.",
        "Satele din Mărginimea Sibiului (Rășinari, Săliște, Gura Râului, Jina și altele) au o istorie lungă de păstorit, cu turme care urcau vara la munte și coborau iarna spre câmpie. Mulți sibieni au strămoși în aceste sate, ale căror registre parohiale merg adesea până în secolul al XVIII-lea.",
      ] },
      { h: "Sibienii plecați în America", p: [
        "La începutul secolului XX, din satele din jurul Sibiului au plecat mulți oameni în Statele Unite. Urmașii lor găsesc adesea satul de origine în dosarele de naturalizare americane, cu numele german sau maghiar al localității.",
      ] },
      { h: "Muzee, biblioteci și colecții", p: [
        "Muzeul Brukenthal, deschis în 1817, e unul dintre cele mai vechi muzee din această parte a Europei, iar biblioteca lui păstrează cărți și manuscrise vechi. În 2007, Sibiul a fost Capitală Europeană a Culturii, iar multe clădiri vechi din centru au fost restaurate, cu istoria caselor și a familiilor care le-au locuit.",
        "Pentru familiile românești, publicațiile ASTREI și ziarul „Telegraful Român”, apărut la Sibiu din 1853, au tipărit vești din sate, liste de donatori și anunțuri de familie. Le găsești în marile biblioteci și, unele, în colecții digitizate. Un anunț de deces dintr-un ziar vechi poate da numele tuturor copiilor și al satului de origine. Caută după numele de familie și după numele satului, pentru că nu toate anunțurile pomenesc ambele.",
      ] },
    ],
  },
  {
    slug: "galati", name: "Galați", county: "galati", region: "moldova", oldNames: ["Galatz (germană)", "Galac (maghiară)"],
    body: [
      { h: "Portul Moldovei la Dunăre", p: [
        "Galațiul a fost principalul port al Moldovei la Dunăre, cu negustori și meșteșugari greci, evrei, armeni, bulgari, lipoveni și români. Din 1856, aici și-a avut sediul Comisia Europeană a Dunării, care a adus în oraș funcționari și marinari din multe țări.",
        "Comunitățile acestea și-au ținut registrele religioase separat, iar din decembrie 1865 primăria a ținut registrele de stare civilă pentru toți locuitorii. Pentru o familie gălățeană veche, merită aflată întâi comunitatea și biserica de care ținea.",
      ] },
      { h: "Registrele și unde sunt", p: [
        "Registrele mai vechi de 100 de ani sunt la Serviciul Județean Galați al Arhivelor Naționale; actele mai noi, la primărie. Datele de dinainte de 1919 sunt după calendarul vechi, iar pentru anii de dinainte de registre, catagrafiile Moldovei arată capii de familie din oraș și din satele din jur.",
        "Combinatul siderurgic, construit după 1960, a adus la Galați zeci de mii de oameni din toată Moldova și din alte regiuni. Mulți gălățeni au deci bunici născuți în alte județe, iar registrele lor sunt acolo.",
      ] },
      { h: "Legătura cu Basarabia", p: [
        "Galațiul e aproape de granița cu Republica Moldova, iar multe familii au rude de cealaltă parte a Prutului. Pentru strămoșii din Basarabia, registrele sunt de obicei în arhivele din Chișinău.",
      ] },
      { h: "Portul franc și comunitățile lui", p: [
        "Între 1837 și 1883, Galațiul a fost port franc, cu scutiri de taxe care au atras negustori din multe țări. În aceeași perioadă orașul a crescut repede, iar mulți străini s-au stabilit aici, cu registre ținute la bisericile lor, pe lângă cele ale primăriei. Dacă un strămoș a venit de peste hotare, caută-i și țara de origine în actele de căsătorie, unde se trecea de obicei locul nașterii mirilor.",
        "Pentru o familie veche din Galați, pornește de la cel mai bătrân act pe care îl are familia, de obicei un certificat de naștere sau de căsătorie al bunicilor, și mergi înapoi, generație cu generație. Fiecare act îți dă numele părinților, deci pasul următor.",
        "Lipovenii din Galați și din satele dunărene au avut registrele lor bisericești, scrise adesea în rusă sau slavonă, iar numele lor apar în actele românești în forme diferite. Pentru o familie de lipoveni, notează toate variantele numelui și caută și în registrele de stare civilă ale localităților din Delta Dunării și de pe malul fluviului.",
      ] },
    ],
  },
];

export const getGenCity = (slug: string) => GEN_CITIES.find((c) => c.slug === slug) ?? null;
/** Cuvintele proprii ale paginii (pentru prag și teste). */
export const genWords = (c: GenCity) => c.body.flatMap((s) => s.p).join(" ").split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
export const GEN_MIN_WORDS = 300;
export const cityTitle = (c: GenCity) => `Genealogie ${c.name}: arhive, registre, nume | Cartea Neamului`;
export const cityDesc = (c: GenCity) =>
  `Cum îți cauți strămoșii din ${c.name}: numele vechi ale orașului, confesiunile și registrele lor, arhiva, numele frecvente și comunele din jur.`;
