import type { CountryExtra } from "./tipuri";

/**
 * Pasul 4 al extinderii diaspora (Daniel, 17.11.2026): celelalte 11 țări primesc ghid propriu, ambasada și consulatele
 * României, particularități și întrebări frecvente (în română). Aceleași reguli ca în extins.ts.
 *
 * Misiunile: doar cele găsite la 17.11.2026 în surse oficiale: paginile mae.ro ale misiunilor (Franța: Paris, Lyon, Marsilia,
 * Strasbourg; Austria: Viena, Salzburg; Grecia: Atena, Salonic), lista Comisiei Europene pentru protecția consulară (Elveția:
 * Berna) și lista Ministerului de Externe grec (Grecia). Consulatele onorifice nu apar.
 */
const MAE_LIST = { name: "Ministerul Afacerilor Externe – misiunile României", url: "https://www.mae.ro/romanian-missions", note: { ro: "lista oficială a ambasadelor și consulatelor, cu zona fiecăruia", en: "official list of embassies and consulates and the area each covers" } };

export const EXTRA_2: Record<string, CountryExtra> = {
  franta: {
    stats: { name: "INSEE – Institut national de la statistique", url: "https://www.insee.fr", note: { ro: "străinii și imigranții din Franța, pe țări de naștere", en: "foreigners and immigrants in France, by country of birth", fr: "étrangers et immigrés par pays de naissance" } },
    missions: [
      { kind: "embassy", city: "Paris", url: "https://www.mae.ro/romanian-missions/3189" },
      { kind: "cg", city: "Lyon", url: "https://lyon.mae.ro" },
      { kind: "cg", city: "Marsilia", url: "https://www.mae.ro/romanian-missions/3267" },
      { kind: "cg", city: "Strasbourg", url: "https://strasbourg.mae.ro" },
    ],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "În Franța trăiesc azi mai multe generații de români: urmașii exilului de după 1947, familiile venite după 1990 și cei plecați după 2007, la muncă sau la studii. Pentru primele două generații, primul pas e o discuție cu cei mai bătrâni din familie: numele satului, al bisericii, al nașilor. Pentru cei sosiți mai recent, părinții și bunicii din România știu aproape tot ce trebuie pentru primele trei generații.",
        "Actele românești se cer prin secția consulară a ambasadei de la Paris sau prin consulatele generale de la Lyon, Marsilia și Strasbourg, după departamentul în care locuiești. Programarea se face pe econsulat.ro. Poți cere un duplicat de certificat, poți transcrie un act francez în registrele românești sau poți da o procură unei rude din țară.",
        "Pentru partea franceză a familiei, arhivele departamentale au pus online, gratuit, registrele de stare civilă mai vechi de aproximativ 100 de ani și registrele parohiale de dinainte de Revoluție. Un strămoș francez se poate căuta astfel, adesea, până în secolul al XVII-lea.",
        "Paris a fost și orașul exilului românesc de după 1947: acolo au apărut ziare și reviste ale exilului, s-au ținut întâlniri ale asociațiilor și s-au păstrat arhive personale. Pentru o familie din exil, scrisorile, fotografiile și actele păstrate acasă sunt adesea mai bogate decât orice registru, așa că merită scanate și trecute în arbore, cu numele celor din imagini.",
      ],
    },
    specifics: {
      ro: [
        "În Franța, femeia căsătorită își păstrează legal numele de naștere (nom de naissance), iar numele soțului e doar nume de folosință. În actele franceze vei găsi deci bunica sub numele ei de fată, ceea ce ajută mult la căutare: e același obicei ca în registrele vechi românești, unde mama copilului apare adesea cu numele părinților ei.",
        "Actele de naturalizare ale românilor deveniți cetățeni francezi, mai ales între cele două războaie și după 1947, sunt păstrate în arhivele publice franceze și pot da locul exact al nașterii în România, numele părinților și data sosirii. Merită căutate când familia a pierdut legătura cu satul de origine.",
        "Numele românești apar în actele franceze fără diacritice și uneori scrise după pronunția franceză, cu „ch” în loc de „ș” sau „ts” în loc de „ț”. Încearcă toate formele când cauți în registrele franceze sau compari acte din cele două țări.",
      ],
    },
    faq: {
      ro: [
        { q: "De care consulat țin în Franța?", a: "Depinde de departamentul în care locuiești: Parisul, Lyonul, Marsilia sau Strasbourgul. Lista departamentelor pentru fiecare e pe pagina oficială a misiunii, pe mae.ro." },
        { q: "Trebuie apostilă pentru un act românesc folosit în Franța?", a: "De obicei nu. Între țările Uniunii Europene actele publice de stare civilă circulă fără apostilă, iar la cerere primești un formular multilingv care le însoțește, ca să nu mai fie nevoie de traducere." },
        { q: "Bunicul a venit în Franța după 1947. Cum găsesc satul lui?", a: "Caută-i actul de naturalizare sau de căsătorie francez, unde e trecut locul nașterii. Cu numele satului, pagina localității de pe Cartea Neamului îți arată comuna și județul de care ține azi, deci și arhiva unde sunt registrele." },
        { q: "Copilul meu s-a născut în Franța. Are nevoie de acte românești?", a: "Dacă vrei să aibă cetățenia și actele românești (certificat, pașaport, cod numeric personal), nașterea se transcrie în registrele românești, prin consulat sau la starea civilă din România." },
        { q: "Pot face arborele în franceză?", a: "Da. Site-ul are varianta în franceză, iar fiecare rudă îl vede în limba ei, pe același arbore." },
      ],
    },
  },

  austria: {
    stats: { name: "Statistik Austria", url: "https://www.statistik.at", note: { ro: "populația din Austria, pe cetățenii și landuri", en: "population of Austria by citizenship and province", de: "Bevölkerung nach Staatsangehörigkeit und Bundesland" } },
    missions: [
      { kind: "embassy", city: "Viena", url: "https://www.mae.ro/romanian-missions/3164" },
      { kind: "cg", city: "Salzburg", url: "https://salzburg.mae.ro" },
    ],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "Austria și România au o istorie comună lungă: Transilvania, Banatul și Bucovina au făcut parte, timp de secole, din monarhia habsburgică, iar Viena a fost capitala la care mergeau studenții, ofițerii și negustorii din aceste provincii. Pentru multe familii din vestul României, arborele duce deci, firesc, și prin arhivele austriece.",
        "Actele românești se cer prin secția consulară a ambasadei de la Viena sau prin consulatul general de la Salzburg, după landul în care locuiești, cu programare pe econsulat.ro. De acolo poți cere duplicate, poți transcrie actele austriece sau poți da o procură unei rude din România.",
        "În Austria, starea civilă de stat există abia din 1938–1939. Pentru anii de dinainte, sursa principală sunt registrele parohiilor (Matriken). O mare parte din registrele catolice austriece sunt online, gratuit, pe portalul Matricula, iar parohiile evanghelice și comunitățile evreiești au avut registrele lor.",
        "Viena a fost, până în 1918, orașul în care se făceau carierele din tot imperiul. Mulți transilvăneni, bucovineni și bănățeni au studiat la universitatea de acolo sau au servit în administrația imperială. Matricolele universității și anuarele vremii pot arăta locul nașterii și numele tatălui unui strămoș care a trecut pe acolo, ceea ce îți dă satul de la care pornește căutarea în România.",
      ],
    },
    specifics: {
      ro: [
        "Arhiva de război a Austriei (Kriegsarchiv, parte din Arhivele de Stat de la Viena) păstrează fișele de recrutare ale soldaților armatei austro-ungare, inclusiv ale celor din Transilvania, Banat și Bucovina. O astfel de fișă dă de obicei anul și locul nașterii, confesiunea, meseria și unitatea în care a servit strămoșul.",
        "După al Doilea Război Mondial, mulți șvabi dunăreni din Banat și din alte regiuni s-au stabilit în Austria, mai ales în Austria Superioară. Urmașii lor caută azi satele bănățene ale bunicilor, iar actele vechi ale acestor sate sunt de obicei la arhivele județene din Timișoara și Arad sau în registrele parohiilor romano-catolice.",
        "În Austria, fiecare locuință se declară la registrul populației (Meldezettel). Pentru rudele care au trăit acolo în secolul XX, evidențele vechi de domiciliu ale orașelor, păstrate în arhivele municipale, precum cea a Vienei, pot arăta adrese, date de naștere și membrii familiei.",
      ],
    },
    faq: {
      ro: [
        { q: "De care misiune țin în Austria?", a: "De secția consulară de la Viena sau de consulatul general de la Salzburg, după landul în care locuiești. Lista oficială e pe mae.ro." },
        { q: "Străbunicul a fost soldat austro-ungar. Unde îi găsesc datele?", a: "La Arhiva de război a Austriei, la Viena, unde sunt fișele de recrutare. Ai nevoie de numele lui, de anul aproximativ al nașterii și de satul de origine." },
        { q: "Am nevoie de apostilă pentru un act românesc în Austria?", a: "De obicei nu: între țările Uniunii Europene, actele publice de stare civilă circulă fără apostilă, iar la cerere primești și un formular multilingv." },
        { q: "Unde caut familia de șvabi bănățeni?", a: "În registrele parohiilor romano-catolice din satele lor și, pentru anii de după 1895, în registrele de stare civilă, păstrate la arhivele județene din Banat. Pagina fiecărei localități îți arată de ce județ ține azi satul." },
        { q: "Pot face arborele în germană?", a: "Da. Site-ul are varianta în germană, iar rudele din România completează același arbore în română." },
        { q: "Bunicii erau din Bucovina. Unde le caut actele?", a: "Pentru satele din sudul Bucovinei, la Arhivele Naționale, Serviciul Județean Suceava. Pentru nordul Bucovinei, azi în Ucraina, registrele sunt de obicei în arhiva regională din Cernăuți." },
      ],
    },
  },

  belgia: {
    stats: { name: "Statbel – oficiul belgian de statistică", url: "https://statbel.fgov.be", note: { ro: "populația din Belgia, pe cetățenii", en: "population of Belgium by nationality", fr: "population par nationalité" } },
    missions: [{ kind: "embassy", city: "Bruxelles", url: "https://www.mae.ro/romanian-missions/3167" }],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "Românii din Belgia sunt de mai multe feluri: lucrători în construcții și servicii, veniți mai ales după 2007, și funcționari ai instituțiilor europene de la Bruxelles, cu familiile lor. Copiii lor cresc vorbind franceza sau olandeza, iar arborele familiei e adesea legătura lor cu bunicii rămași acasă.",
        "Actele românești se cer prin secția consulară a ambasadei de la Bruxelles, cu programare pe econsulat.ro: duplicate de certificate, transcrierea actelor belgiene, procuri pentru rude. Pentru generațiile vechi din România, registrele de peste 100 de ani sunt la Arhivele Naționale, pe județe.",
        "Pentru partea belgiană a familiei, Arhivele Statului din Belgia au pus online multe registre de stare civilă și registre parohiale vechi, căutabile după nume pentru o parte din localități. Starea civilă belgiană începe la sfârșitul secolului al XVIII-lea, odată cu administrația franceză.",
        "Bruxelles e și sediul principalelor instituții europene, iar familiile românilor care lucrează acolo sunt adesea împărțite între mai multe țări. Un arbore pe care îl completează împreună rudele din Belgia, din România și din alte părți păstrează legătura dintre ele, cu poze, povești și datele importante ale fiecăruia.",
        "Pentru actele mai vechi din România, gândește-te întâi la regiunea de unde vine familia: în Transilvania, Banat și Crișana starea civilă începe în 1895, iar în Moldova și Țara Românească în 1865. Înainte de acești ani, singurele registre sunt cele ale parohiilor, la Arhivele Naționale sau la parohii.",
      ],
    },
    specifics: {
      ro: [
        "Belgia are trei limbi oficiale, iar actele se emit în limba comunei: franceză, olandeză sau germană. Același oraș poate apărea cu două nume, de exemplu Liège și Luik sau Anvers și Antwerpen, așa că notează în arbore numele folosit în act.",
        "În Belgia, ca și în Franța, femeia căsătorită își păstrează legal numele de naștere. În actele belgiene, bunica sau mama apare deci sub numele de fată, ceea ce face mai ușoară legătura cu actele ei românești.",
        "Fiecare comună belgiană ține registrul populației, cu toți cei care locuiesc acolo. Pentru o rudă care a trăit în Belgia, un extras din acest registru poate arăta adresele, data sosirii și membrii gospodăriei.",
        "Multe acte belgiene vechi sunt scrise de mână, în franceză sau olandeză, cu formule care se repetă: „est né”, „geboren”, „fils de”, „zoon van”. Învață aceste câteva cuvinte și vei citi ușor un registru vechi, chiar fără să știi limba.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Belgia?", a: "La secția consulară a ambasadei de la Bruxelles, cu programare pe econsulat.ro." },
        { q: "Pot folosi în Belgia un certificat românesc fără traducere?", a: "Pentru actele de stare civilă, între țările Uniunii Europene poți cere un formular multilingv care însoțește actul și înlocuiește de obicei traducerea; nu e nevoie de apostilă." },
        { q: "Unde caut strămoșii belgieni ai soțului sau soției?", a: "În registrele de stare civilă și parohiale ale Arhivelor Statului din Belgia, multe dintre ele online. Ai nevoie de numele comunei și de un an aproximativ." },
        { q: "Copilul meu s-a născut la Bruxelles. Ce fac pentru actele românești?", a: "Transcrii nașterea în registrele românești, prin ambasadă sau la starea civilă din România, ca să primească certificat românesc și cod numeric personal." },
        { q: "Pot face arborele în franceză sau olandeză?", a: "În franceză și în olandeză, da: site-ul are ambele variante, iar bunicii din România văd același arbore în română." },
        { q: "Cât durează un certificat românesc cerut din Belgia?", a: "De obicei câteva săptămâni, pentru că cererea trece de la ambasadă la primăria din România și înapoi. O procură dată unei rude din țară poate scurta drumul." },
      ],
    },
  },

  irlanda: {
    stats: { name: "CSO – Central Statistics Office", url: "https://www.cso.ie", note: { ro: "recensământul Irlandei, pe cetățenii", en: "Census of Ireland by nationality" } },
    missions: [{ kind: "embassy", city: "Dublin", url: "https://www.mae.ro/romanian-missions/3197" }],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "Cei mai mulți români din Irlanda au venit după 2007, la muncă în construcții, în sănătate, în industria alimentară și în firmele de tehnologie din Dublin. Au deci, de obicei, părinți și bunici în România, care sunt cea mai bună sursă pentru primele trei generații ale arborelui.",
        "Actele românești se cer prin secția consulară a ambasadei de la Dublin, cu programare pe econsulat.ro. De acolo poți cere duplicate, poți transcrie actele irlandeze sau poți da o procură unei rude din țară. Registrele românești de peste 100 de ani sunt la Arhivele Naționale, pe județe.",
        "Pentru partea irlandeză a familiei, portalul guvernamental irishgenealogy.ie are gratuit registrele de stare civilă istorice: nașterile mai vechi de 100 de ani, căsătoriile mai vechi de 75 și decesele mai vechi de 50. Multe registre parohiale catolice sunt și ele online, la Biblioteca Națională a Irlandei.",
        "Mulți români din Irlanda au venit din aceleași câteva zone, mai ales din Moldova și din nord-vestul țării, și s-au regăsit apoi în aceleași orașe irlandeze. Dacă vrei să afli cine mai e din satul tău, pagina localității de pe Cartea Neamului îți arată familiile care au rădăcini acolo și care au ales să fie găsite.",
        "Pentru registrele vechi din România, gândește-te la regiune: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865, iar înainte de acești ani singurele registre sunt cele parohiale. Arhivele Naționale răspund și la cereri trimise prin e-mail, cu numele, satul și anul aproximativ.",
      ],
    },
    specifics: {
      ro: [
        "Recensămintele irlandeze din 1901 și 1911 sunt online, gratuit, la Arhivele Naționale ale Irlandei, cu fiecare gospodărie, vârsta, religia și locul nașterii. Pentru o familie irlandeză, sunt adesea primul loc de căutat după actele de stare civilă.",
        "În actele irlandeze, numele românești apar fără diacritice și uneori cu prenumele adaptat în engleză: Gheorghe devine George, Ioan devine John. Notează în arbore ambele forme, ca rudele din cele două țări să recunoască aceeași persoană.",
        "Irlanda folosește engleza și irlandeza, iar multe localități au două nume. În actele vechi, satele și parohiile apar de obicei cu numele englezesc, pe care îl vei găsi și în hărțile istorice ale țării.",
        "Pentru catolicii irlandezi, registrele parohiale de botez trec de obicei numele nașilor și numele de fată al mamei. Sunt de mare folos pentru anii de dinainte de 1864, când a început în Irlanda înregistrarea civilă a tuturor nașterilor.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Irlanda?", a: "La secția consulară a ambasadei de la Dublin, cu programare pe econsulat.ro." },
        { q: "Am nevoie de apostilă în Irlanda pentru un act românesc?", a: "Irlanda e în Uniunea Europeană, deci pentru actele publice de stare civilă nu e nevoie de apostilă; poți cere și un formular multilingv care le însoțește." },
        { q: "Unde găsesc actele familiei irlandeze a partenerului?", a: "Pe irishgenealogy.ie, portalul gratuit al statului irlandez, și în recensămintele din 1901 și 1911 de la Arhivele Naționale ale Irlandei." },
        { q: "Copilul meu născut în Irlanda poate avea acte românești?", a: "Da. Nașterea se transcrie în registrele românești, prin ambasadă sau la starea civilă din România." },
        { q: "Arborele poate fi în engleză pentru copii?", a: "Da. Site-ul are varianta în engleză, iar bunicii completează același arbore în română." },
        { q: "Unde sunt registrele de botez ale bunicilor din România?", a: "Registrele parohiale mai vechi sunt la Arhivele Naționale, la serviciul județean al satului; cele mai noi pot fi încă la parohie. Află întâi parohia, apoi întreabă la arhiva județului." },
      ],
    },
  },

  olanda: {
    stats: { name: "CBS – Centraal Bureau voor de Statistiek", url: "https://www.cbs.nl", note: { ro: "populația Țărilor de Jos, pe țări de origine", en: "population of the Netherlands by origin" } },
    missions: [{ kind: "embassy", city: "Haga", url: "https://www.mae.ro/romanian-missions/3238" }],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "Românii din Țările de Jos au venit mai ales după 2007 și după 2014, când s-au ridicat ultimele restricții pe piața muncii: lucrători în agricultură, sere și logistică, dar și ingineri, medici și studenți. Mulți au familia apropiată în România, de unde pornește firesc arborele.",
        "Actele românești se cer prin secția consulară a ambasadei de la Haga, cu programare pe econsulat.ro: duplicate de certificate, transcrierea actelor olandeze, procuri. Registrele vechi din România sunt la primării (cele mai noi de 100 de ani) și la Arhivele Naționale, pe județe.",
        "Pentru partea olandeză a familiei, starea civilă există din 1811, de pe vremea administrației franceze, iar registrele vechi sunt indexate și căutabile gratuit pe portaluri precum WieWasWie și Open Archives. Înainte de 1811, sursele sunt registrele bisericilor.",
        "Mulți români din Țările de Jos lucrează sezonier și se întorc des acasă. Fiecare drum acasă e o ocazie bună pentru arbore: o discuție cu bunicii, fotografii vechi scanate cu telefonul, numele nașilor și ale satelor din jur. Trecute imediat în arbore, ele rămân pentru toată familia.",
        "Pentru actele vechi din România, ține minte regula regiunilor: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865. Înainte, singurele registre sunt cele ale parohiilor, păstrate la Arhivele Naționale sau la parohii.",
      ],
    },
    specifics: {
      ro: [
        "Numele olandeze au adesea particule (van, de, van der), care la sortare se pun separat de nume: Jan van Dijk apare sub D. Când cauți un strămoș olandez într-un index, încearcă și cu particula, și fără ea.",
        "Fiecare comună olandeză ține registrul populației (BRP). Pentru o rudă care a trăit acolo, un extras din acest registru poate arăta datele personale, adresele și membrii familiei; pentru persoanele decedate, fișele vechi de populație se cer de la Centraal Bureau voor Genealogie.",
        "În actele olandeze, femeia apare sub numele de naștere, iar numele soțului poate fi folosit în viața de zi cu zi. Pentru arbore, folosește numele de naștere, ca și în actele românești.",
        "Actele olandeze de căsătorie din secolul al XIX-lea sunt foarte bogate: trec vârsta, locul nașterii și meseria mirilor, numele părinților lor și dacă aceștia mai trăiau. Dintr-un singur act de căsătorie poți afla deci două generații, iar de acolo pornești spre următoarea.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Țările de Jos?", a: "La secția consulară a ambasadei de la Haga, cu programare pe econsulat.ro." },
        { q: "Trebuie tradus un certificat românesc în Țările de Jos?", a: "Pentru actele de stare civilă poți cere formularul multilingv al Uniunii Europene, care de obicei înlocuiește traducerea; apostila nu e necesară între țările Uniunii." },
        { q: "Unde caut familia olandeză a partenerului?", a: "Pe portalurile gratuite cu registrele de stare civilă olandeze, de la 1811 încoace, și în registrele bisericilor pentru anii mai vechi." },
        { q: "Copilul meu s-a născut în Țările de Jos. Ce acte românești îi fac?", a: "Transcrii nașterea în registrele românești, prin ambasadă sau la starea civilă din România, ca să primească certificat și cod numeric personal." },
        { q: "Pot face arborele în olandeză?", a: "Da. Site-ul are varianta în olandeză, iar rudele din România completează același arbore în română." },
        { q: "Cât durează un certificat românesc cerut din Țările de Jos?", a: "De obicei câteva săptămâni, pentru că cererea trece prin ambasadă la primăria din România. O procură dată unei rude din țară poate scurta drumul." },
      ],
    },
  },

  portugalia: {
    stats: { name: "INE – Instituto Nacional de Estatística", url: "https://www.ine.pt", note: { ro: "populația străină din Portugalia, pe cetățenii", en: "foreign population in Portugal by nationality" } },
    missions: [{ kind: "embassy", city: "Lisabona", url: "https://www.mae.ro/romanian-missions/3220" }],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "Românii au venit în Portugalia mai ales la începutul anilor 2000, la muncă în construcții și agricultură, iar mulți s-au așezat în zona Lisabonei și în sud. Alături de ei au venit și mulți moldoveni din Republica Moldova, cu care împart adesea aceleași comunități.",
        "Actele românești se cer prin secția consulară a ambasadei de la Lisabona, cu programare pe econsulat.ro. Pentru registrele vechi, Arhivele Naționale din România răspund și la cereri trimise prin e-mail, cu numele, satul și anul aproximativ.",
        "Pentru partea portugheză a familiei, arhivele districtuale au digitizat multe registre parohiale și de stare civilă, consultabile gratuit online. Registrele parohiale portugheze sunt foarte vechi, iar unele merg până în secolul al XVI-lea.",
        "Mulți români din Portugalia s-au întors acasă după criza din 2008, iar alții au rămas și și-au crescut copiii acolo. În astfel de familii, rudele sunt împărțite între cele două țări, iar un arbore comun, completat de fiecare în limba lui, păstrează legătura și datele importante ale fiecăruia.",
        "Pentru actele vechi din România, ține minte regula regiunilor: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865. Înainte, singurele registre sunt cele ale parohiilor, păstrate la Arhivele Naționale sau la parohii, iar pentru moldovenii din Republica Moldova registrele sunt de obicei în arhivele de la Chișinău.",
      ],
    },
    specifics: {
      ro: [
        "Portughezii au de obicei mai multe nume de familie, primul de la mamă și ultimul de la tată, de exemplu Maria Silva Costa. În registrele vechi, numele se pot schimba de la o generație la alta, așa că leagă oamenii după părinți și nași, nu doar după nume.",
        "În Portugalia, actele se cer de la Conservatória do Registo Civil. Certificatele pot fi cerute și online, iar un certificat portughez de naștere are adesea în margine mențiunile despre căsătorie și deces, ca registrele românești.",
        "Pentru copiii crescuți în Portugalia, numele românești pot primi forme portugheze: Ioana devine Joana, Ion devine João. Treci ambele forme în arbore, ca rudele din ambele țări să recunoască aceeași persoană.",
        "Registrele parohiale portugheze trec adesea, la botez, și numele bunicilor din ambele părți, nu doar ale părinților. Un singur act de botez poate da astfel trei generații, ceea ce face partea portugheză a arborelui neobișnuit de ușor de urmărit înapoi.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Portugalia?", a: "La secția consulară a ambasadei de la Lisabona, cu programare pe econsulat.ro." },
        { q: "Trebuie apostilă pentru actele românești în Portugalia?", a: "Nu, pentru actele publice de stare civilă între țările Uniunii Europene; la cerere primești un formular multilingv care le însoțește." },
        { q: "Unde caut familia portugheză a partenerului?", a: "În registrele parohiale și de stare civilă digitizate de arhivele districtuale portugheze, consultabile gratuit online." },
        { q: "Copilul meu s-a născut în Portugalia. Are nevoie de acte românești?", a: "Dacă vrei să aibă cetățenia și actele românești, nașterea se transcrie în registrele românești, prin ambasadă sau la starea civilă din România." },
        { q: "Pot face arborele în altă limbă decât româna?", a: "Da, în engleză, spaniolă și în celelalte limbi ale site-ului. Rudele din România completează același arbore în română." },
        { q: "Familia mea e din Republica Moldova. Unde caut actele vechi?", a: "Registrele parohiale și de stare civilă vechi din Basarabia sunt de obicei la Agenția Națională a Arhivelor a Republicii Moldova, la Chișinău. Actele mai noi se cer de la starea civilă." },
      ],
    },
  },

  suedia: {
    stats: { name: "SCB – Statistiska centralbyrån", url: "https://www.scb.se", note: { ro: "populația Suediei, pe țări de naștere", en: "population of Sweden by country of birth" } },
    missions: [{ kind: "embassy", city: "Stockholm", url: "https://www.mae.ro/romanian-missions/3233" }],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "În Suedia au ajuns români în mai multe valuri: refugiați politici înainte de 1989, apoi, după 1990 și mai ales după 2007, medici, ingineri, studenți și familii. Copiii lor cresc vorbind suedeza, iar arborele familiei e un drum bun spre limba și satele bunicilor.",
        "Actele românești se cer prin secția consulară a ambasadei de la Stockholm, cu programare pe econsulat.ro. Pentru registrele vechi din România, scrie Arhivelor Naționale, la serviciul județean al satului, cu numele și anul aproximativ.",
        "Pentru partea suedeză a familiei, Arhivele Naționale ale Suediei au online, gratuit, registrele parohiale vechi, inclusiv registrele de examinare a casei (husförhörslängder), în care preotul trecea an de an fiecare gospodărie, cu nașteri, mutări și decese.",
        "Pentru refugiații de dinainte de 1989, legătura cu familia din România a fost adesea întreruptă ani la rând. Scrisorile, fotografiile și actele păstrate de ei sunt o comoară pentru urmași: scanează-le și trece-le în arbore, cu numele celor din imagini, cât încă mai trăiesc oamenii care îi recunosc.",
        "Pentru actele vechi din România, ține minte regula regiunilor: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865. Înainte, singurele registre sunt cele ale parohiilor, la Arhivele Naționale sau la parohii. Un arbore bine făcut leagă fiecare persoană de actul din care vin datele ei.",
      ],
    },
    specifics: {
      ro: [
        "Până în 1991, evidența populației în Suedia a fost ținută de parohiile Bisericii Suediei, iar apoi de Agenția fiscală (Skatteverket). De aceea, pentru strămoșii suedezi, registrele bisericii sunt sursa principală, chiar și pentru secolul XX.",
        "Multe nume suedeze vechi erau patronimice, după numele tatălui: fiul lui Anders era Andersson, iar fiica, Andersdotter. Numele de familie fixe s-au generalizat abia la începutul secolului XX, așa că în registrele vechi numele se schimbă la fiecare generație.",
        "În Suedia, fiecare om are un număr personal (personnummer), trecut în toate actele. Pentru o rudă care a trăit acolo, cu numărul personal găsești mai ușor actele ei la autorități.",
        "Registrele suedeze de mutare arată când și unde s-a mutat fiecare om dintr-o parohie în alta. Cu ele poți urmări o familie de la o parohie la alta, chiar dacă numele s-a schimbat între timp, și poți afla unde să cauți generația următoare.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Suedia?", a: "La secția consulară a ambasadei de la Stockholm, cu programare pe econsulat.ro." },
        { q: "Am nevoie de apostilă în Suedia?", a: "Nu pentru actele publice de stare civilă din altă țară a Uniunii Europene; poți cere și formularul multilingv care le însoțește." },
        { q: "Unde caut strămoșii suedezi ai partenerului?", a: "În registrele parohiale puse online de Arhivele Naționale ale Suediei, mai ales în registrele anuale ale gospodăriilor." },
        { q: "Copilul meu născut în Suedia poate avea acte românești?", a: "Da. Nașterea se transcrie în registrele românești, prin ambasadă sau la starea civilă din România." },
        { q: "Pot face arborele în engleză?", a: "Da. Site-ul are varianta în engleză, iar rudele din România completează același arbore în română." },
        { q: "Cât durează un certificat românesc cerut din Suedia?", a: "De obicei câteva săptămâni, pentru că cererea trece prin ambasadă la primăria din România. O procură dată unei rude din țară poate scurta drumul." },
        { q: "Bunicul a plecat din România înainte de 1989. Mai găsesc actele lui?", a: "Da, de obicei. Actele lui de naștere și căsătorie sunt la primăria unde au fost înregistrate, iar cele mai vechi de 100 de ani la Arhivele Naționale, pe județe." },
      ],
    },
  },

  danemarca: {
    stats: { name: "Danmarks Statistik", url: "https://www.dst.dk", note: { ro: "populația Danemarcei, pe țări de origine", en: "population of Denmark by country of origin" } },
    missions: [{ kind: "embassy", city: "Copenhaga", url: "https://www.mae.ro/romanian-missions/3181" }],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "Românii din Danemarca au venit mai ales după 2007, la muncă în agricultură, construcții, sănătate și tehnologie, sau la studii. Mulți sunt tineri, cu părinți și bunici acasă, care pot completa ușor primele generații ale arborelui.",
        "Actele românești se cer prin secția consulară a ambasadei de la Copenhaga, cu programare pe econsulat.ro. Pentru generațiile mai vechi, registrele de peste 100 de ani sunt la Arhivele Naționale din România, pe județe.",
        "Pentru partea daneză a familiei, Arhivele Naționale ale Danemarcei au online, gratuit, registrele parohiale (kirkebøger) și recensămintele vechi. Registrele parohiale daneze sunt păstrate, pentru multe parohii, încă din secolul al XVII-lea.",
        "Mulți români din Danemarca sunt tineri plecați la studii sau la muncă, iar copiii lor cresc vorbind daneza. Pentru acești copii, arborele familiei e o poartă spre limba și locurile bunicilor: fotografiile satului, numele străbunicilor și poveștile lor, adunate într-un loc pe care îl pot vedea oricând.",
        "Pentru actele vechi din România, ține minte regula regiunilor: în Transilvania, Banat și Crișana starea civilă începe în 1895, iar în Moldova și Țara Românească în 1865. Înainte de acești ani, singurele registre sunt cele ale parohiilor, păstrate la Arhivele Naționale sau, uneori, încă la parohie. Arhivele răspund și la cereri trimise prin e-mail.",
      ],
    },
    specifics: {
      ro: [
        "În Danemarca, evidența nașterilor, căsătoriilor și deceselor a fost ținută multă vreme de parohiile Bisericii Daneze, nu de primării. De aceea, pentru strămoșii danezi, registrele parohiale sunt sursa principală.",
        "Ca în Suedia, multe nume daneze vechi erau patronimice: fiul lui Hans era Hansen, iar fiica, Hansdatter. Numele s-au fixat abia în secolul al XIX-lea, așa că leagă generațiile după părinți și locuri, nu doar după nume.",
        "Fiecare locuitor al Danemarcei are un număr CPR, trecut în toate actele. Pentru o rudă care a trăit acolo, cu acest număr găsești mai ușor actele ei.",
        "Recensămintele daneze din secolul al XIX-lea, făcute la câțiva ani o dată, trec fiecare gospodărie cu vârsta și locul nașterii oamenilor. Împreună cu registrele parohiale, ele îți permit să urmărești o familie din recensământ în recensământ.",
        "Poliția din Copenhaga a ținut registre ale emigranților plecați spre America și alte țări, de la sfârșitul secolului al XIX-lea. Dacă partenerul are rude plecate atunci, aceste registre pot arăta data plecării, vârsta și locul de unde veneau.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Danemarca?", a: "La secția consulară a ambasadei de la Copenhaga, cu programare pe econsulat.ro." },
        { q: "Trebuie apostilă în Danemarca pentru un act românesc?", a: "Nu pentru actele publice de stare civilă între țările Uniunii Europene; poți cere și formularul multilingv." },
        { q: "Unde caut familia daneză a partenerului?", a: "În registrele parohiale și recensămintele puse online de Arhivele Naționale ale Danemarcei." },
        { q: "Copilul meu s-a născut în Danemarca. Ce fac?", a: "Dacă vrei să aibă acte românești, transcrii nașterea în registrele românești, prin ambasadă sau la starea civilă din România." },
        { q: "Pot face arborele în engleză?", a: "Da. Site-ul are varianta în engleză, iar rudele din România completează același arbore în română." },
        { q: "Cât durează un certificat românesc cerut din Danemarca?", a: "De obicei câteva săptămâni, pentru că cererea trece prin ambasadă la primăria din România. O procură dată unei rude din țară poate scurta drumul." },
        { q: "Unde găsesc actele străbunicilor din România?", a: "Actele mai noi de 100 de ani sunt la primăria unde au fost înregistrate, iar cele mai vechi și registrele parohiale la Arhivele Naționale, la serviciul județean al satului." },
      ],
    },
  },

  elvetia: {
    stats: { name: "BFS – Oficiul Federal de Statistică", url: "https://www.bfs.admin.ch", note: { ro: "populația străină din Elveția, pe cetățenii", en: "foreign population in Switzerland by nationality", de: "ausländische Bevölkerung nach Staatsangehörigkeit", fr: "population étrangère par nationalité" } },
    missions: [{ kind: "embassy", city: "Berna", address: "Kirchenfeldstrasse 78, 3005 Bern", url: "https://berna.mae.ro" }],
    missionsSource: { name: "Comisia Europeană – protecția consulară, România în Elveția", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-switzerland-ch_en", note: { ro: "adresa secției consulare", en: "address of the consular section" } },
    guide: {
      ro: [
        "Elveția a primit români în mai multe valuri: exilați după 1947, refugiați înainte de 1989 și, după 1990, medici, ingineri, cercetători, studenți și lucrători în sănătate și turism. Comunitatea e împărțită între regiunile de limbă germană, franceză și italiană.",
        "Actele românești se cer prin secția consulară a ambasadei de la Berna, cu programare pe econsulat.ro: duplicate de certificate, transcrierea actelor elvețiene, procuri pentru rude. Pentru registrele vechi, Arhivele Naționale din România răspund la cereri trimise prin e-mail.",
        "Pentru partea elvețiană a familiei, fiecare cetățean elvețian are un loc de origine (Heimatort), unde au fost ținute, generație după generație, registrele familiei. Locul de origine e cheia arborelui elvețian, chiar dacă familia n-a mai locuit acolo de mult.",
        "Pentru familiile din exil, multe documente au rămas în arhive personale: scrisori, fotografii, acte aduse din țară. Ele sunt adesea singura legătură cu satul de origine, așa că merită scanate și trecute în arbore, cu numele celor din imagini, cât încă mai trăiesc oamenii care îi recunosc.",
        "Pentru actele vechi din România, ține minte regula regiunilor: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865. Înainte de acești ani, singurele registre sunt cele ale parohiilor, păstrate la Arhivele Naționale sau la parohii.",
      ],
    },
    specifics: {
      ro: [
        "Elveția nu e în Uniunea Europeană, așa că regulile UE despre actele fără apostilă nu se aplică aici. Întreabă autoritatea care îți cere actul dacă are nevoie de apostilă sau de traducere legalizată; România și Elveția fac parte amândouă din Convenția de la Haga privind apostila.",
        "Actele elvețiene se emit în limba cantonului: germană, franceză, italiană sau romanșă. Un oraș poate avea mai multe nume, de exemplu Genève și Genf sau Biel și Bienne, așa că notează forma din act.",
        "Registrele parohiale elvețiene vechi sunt de obicei în arhivele cantonale, nu într-o arhivă centrală. Pentru un strămoș elvețian, află mai întâi cantonul și locul de origine, apoi caută arhiva cantonului.",
        "Registrele de familie elvețiene trec, pentru fiecare familie de cetățeni ai unei comune, nașterile, căsătoriile, copiii și decesele, de obicei din a doua jumătate a secolului al XIX-lea. Un singur extras din registrul de familie poate da mai multe generații dintr-odată.",
        "Pentru românii stabiliți în Elveția, dosarele de ședere și de naturalizare ale autorităților cantonale pot arăta data sosirii, locul nașterii din România și numele părinților.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Elveția?", a: "La secția consulară a ambasadei de la Berna (Kirchenfeldstrasse 78), cu programare pe econsulat.ro." },
        { q: "Trebuie apostilă pentru un act românesc în Elveția?", a: "Poate fi nevoie, pentru că Elveția nu e în Uniunea Europeană. Verifică la autoritatea elvețiană care îți cere actul." },
        { q: "Ce e locul de origine al unei familii elvețiene?", a: "E comuna de care ține familia ca cetățeni elvețieni, trecută în acte. Acolo au fost ținute registrele familiei, chiar dacă oamenii au trăit în altă parte." },
        { q: "Copilul meu născut în Elveția poate avea acte românești?", a: "Da. Nașterea se transcrie în registrele românești, prin ambasadă sau la starea civilă din România." },
        { q: "Pot face arborele în germană sau franceză?", a: "Da, în amândouă. Fiecare rudă vede același arbore în limba ei." },
        { q: "Cât durează un certificat românesc cerut din Elveția?", a: "De obicei câteva săptămâni, pentru că cererea trece prin ambasadă la primăria din România. O procură dată unei rude din țară poate scurta drumul." },
      ],
    },
  },

  grecia: {
    stats: { name: "ELSTAT – Autoritatea Statistică Elenă", url: "https://www.statistics.gr", note: { ro: "populația străină din Grecia, pe cetățenii", en: "foreign population in Greece by citizenship" } },
    missions: [
      { kind: "embassy", city: "Atena", url: "https://atena.mae.ro" },
      { kind: "cg", city: "Salonic", url: "https://salonic.mae.ro" },
    ],
    missionsSource: { name: "Ministerul Afacerilor Externe al Greciei – România", url: "https://mfa.gr/en/countries-and-areas/romania", note: { ro: "misiunile României în Grecia", en: "Romanian missions in Greece" } },
    guide: {
      ro: [
        "Legăturile dintre români și greci sunt vechi: în secolele XVIII–XIX, mulți negustori greci s-au așezat în porturile dunărene, la Brăila și Galați, și în orașele Țării Românești și ale Moldovei. Multe familii românești de azi au deci un strămoș grec, iar mulți greci au rude în România.",
        "Românii de azi din Grecia au venit mai ales după 1990, la muncă în agricultură, construcții, turism și îngrijire. Actele românești se cer prin secția consulară a ambasadei de la Atena sau prin consulatul general de la Salonic, după regiune, cu programare pe econsulat.ro.",
        "Pentru partea greacă a familiei, actele se cer de la oficiul de stare civilă al municipalității (lixiarheio). Pentru anii mai vechi, registrele de familie ale municipalităților (dimotologhia) arată membrii fiecărei familii și sunt o sursă foarte bună pentru arbore.",
        "Pentru actele vechi din România, ține minte regula regiunilor: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865. Înainte de acești ani, singurele registre sunt cele ale parohiilor, la Arhivele Naționale sau la parohii. Pentru familiile cu strămoși greci, registrele bisericilor grecești din orașele dunărene merită și ele căutate.",
      ],
    },
    specifics: {
      ro: [
        "Numele grecești au formă diferită pentru femei: soția și fiica lui Papadopoulos se numesc Papadopoulou. În actele vechi românești, numele grecești au fost adesea românizate, așa că un strămoș grec poate apărea cu un nume care nu mai seamănă cu cel original.",
        "În nordul Greciei trăiește de secole o comunitate de aromâni, care vorbesc un grai înrudit cu româna. În perioada interbelică, unele familii de aromâni s-au mutat în România, mai ales în Dobrogea, iar urmașii lor caută azi satele din Grecia ale bunicilor.",
        "Cele mai multe acte grecești vechi sunt scrise cu alfabetul grecesc, cu nume transcrise în moduri diferite în alfabetul latin. Când cauți un nume, încearcă mai multe transcrieri, de exemplu Georgios și Yiorgos.",
        "Multe acte grecești trec și numele tatălui după prenume, în genitiv, ceea ce ajută mult la legarea generațiilor: știi din același act cum îl chema pe tatăl persoanei căutate.",
      ],
    },
    faq: {
      ro: [
        { q: "De care misiune țin în Grecia?", a: "De secția consulară de la Atena sau de consulatul general de la Salonic, după regiunea în care locuiești. Lista oficială e pe mae.ro." },
        { q: "Am nevoie de apostilă pentru un act românesc în Grecia?", a: "Nu pentru actele publice de stare civilă între țările Uniunii Europene; poți cere și formularul multilingv." },
        { q: "Am un strămoș grec venit la Brăila. Unde îl caut?", a: "În registrele de stare civilă ale Brăilei, de după 1865, la Arhivele Naționale, Serviciul Județean Brăila, unde întrebi și de registrele bisericii grecești din oraș." },
        { q: "Copilul meu născut în Grecia poate avea acte românești?", a: "Da. Nașterea se transcrie în registrele românești, prin consulat sau la starea civilă din România." },
        { q: "Pot face arborele în engleză?", a: "Da. Site-ul are varianta în engleză, iar rudele din România completează același arbore în română." },
        { q: "Familia mea e de aromâni. Unde le caut rădăcinile?", a: "Pentru cei veniți în România, în registrele de stare civilă din Dobrogea, de după 1925. Pentru satele din Grecia, în registrele de familie ale municipalităților grecești și în registrele parohiilor." },
        { q: "Cât durează un certificat românesc cerut din Grecia?", a: "De obicei câteva săptămâni, pentru că cererea trece prin consulat la primăria din România. O procură dată unei rude din țară poate scurta drumul." },
      ],
    },
  },

  cipru: {
    stats: { name: "CYSTAT – Serviciul de Statistică al Ciprului", url: "https://www.cystat.gov.cy", note: { ro: "populația Ciprului, pe cetățenii", en: "population of Cyprus by citizenship" } },
    missions: [{ kind: "embassy", city: "Nicosia", url: "https://www.mae.ro/romanian-missions/3175" }],
    missionsSource: MAE_LIST,
    guide: {
      ro: [
        "Românii din Cipru au venit mai ales după 2007, la muncă în turism, construcții, servicii și îngrijire, în orașele Nicosia, Limassol, Larnaca și Paphos. Mulți au familia apropiată în România, deci primele generații ale arborelui se completează ușor, cu ajutorul părinților și bunicilor.",
        "Actele românești se cer prin secția consulară a ambasadei de la Nicosia, cu programare pe econsulat.ro. Pentru registrele vechi, Arhivele Naționale din România răspund la cereri trimise prin e-mail, cu numele, satul și anul aproximativ.",
        "În Cipru, actele de stare civilă se cer de la Departamentul pentru Registrul Civil și Migrație. Pentru partea cipriotă a familiei, registrele vechi ale parohiilor ortodoxe și registrele de stare civilă sunt sursele principale.",
        "Mulți români din Cipru lucrează în turism, cu sezoane lungi și puțin timp liber. Un arbore început cu ce știi deja, părinții, bunicii și satul, poate fi completat apoi de rudele de acasă, care au adesea fotografiile și actele vechi ale familiei.",
        "Când ceri acte vechi din România, află întâi comuna și județul de care ține azi satul familiei: multe sate și-au schimbat numele sau au trecut de la o comună la alta. Pagina fiecărei localități de pe Cartea Neamului îți arată comuna, județul și arhiva unde sunt registrele, iar Arhivele Naționale răspund și la cereri trimise prin e-mail.",
      ],
    },
    specifics: {
      ro: [
        "Cipru folosește greaca și turca, iar engleza e larg folosită în administrație. Actele pot fi emise în greacă sau în engleză, iar numele localităților au adesea forme diferite în cele două limbi, de exemplu Lefkosia pentru Nicosia.",
        "Multe cupluri din alte țări se căsătoresc civil în Cipru. Dacă părinții sau bunicii s-au căsătorit acolo, actul de căsătorie se cere de la municipalitatea unde a avut loc cununia, iar pentru a fi recunoscut în România se transcrie în registrele românești.",
        "Ca în Grecia, numele grecești cipriote au formă diferită pentru femei și pot fi transcrise în mai multe feluri în alfabetul latin. Încearcă toate formele când cauți o persoană în acte.",
        "Pentru familiile cipriote, numele tatălui apare adesea în acte după prenume, ca în Grecia, iar satul de origine e trecut cu grijă, pentru că multe familii au fost strămutate după 1974. Pentru cei plecați atunci din satele din nord, registrele vechi pot fi greu de găsit, iar amintirile bătrânilor sunt cu atât mai prețioase.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Cipru?", a: "La secția consulară a ambasadei de la Nicosia, cu programare pe econsulat.ro." },
        { q: "Trebuie apostilă pentru actele românești în Cipru?", a: "Nu pentru actele publice de stare civilă între țările Uniunii Europene; poți cere și formularul multilingv care le însoțește." },
        { q: "M-am căsătorit în Cipru. Trebuie transcrisă căsătoria?", a: "Da, ca să apară în actele românești: căsătoria se transcrie prin ambasadă sau la starea civilă din România." },
        { q: "Copilul meu născut în Cipru poate avea acte românești?", a: "Da. Nașterea se transcrie în registrele românești, prin ambasadă sau la starea civilă din România." },
        { q: "Pot face arborele în engleză?", a: "Da. Site-ul are varianta în engleză, iar rudele din România completează același arbore în română." },
        { q: "Cât durează un certificat românesc cerut din Cipru?", a: "De obicei câteva săptămâni, pentru că cererea trece prin ambasadă la primăria din România. O procură dată unei rude din țară poate scurta drumul." },
        { q: "Unde găsesc actele străbunicilor din România?", a: "Actele mai noi de 100 de ani sunt la primăria unde au fost înregistrate, iar cele mai vechi și registrele parohiale la Arhivele Naționale, la serviciul județean al satului." },
      ],
    },
  },
};
