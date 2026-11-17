import type { Region } from "./tipuri";

/**
 * Pasul 4 al extinderii diaspora (Daniel, 17.11.2026): orașele din celelalte țări, la /diaspora/<țară>/<oraș>, în română,
 * cu aceleași reguli ca orase.ts: comunitatea, misiunea care o servește (din lista verificată, prin `mission`), unde se cer
 * actele locale și ce arhive are orașul. Fără biserici, asociații sau cifre pe care nu le putem verifica.
 */
type City = Omit<Region, "kind" | "langs" | "where" | "name"> & { name: string; where?: string };
const city = (c: City): Region => ({ ...c, kind: "city", langs: ["ro"], name: { ro: c.name }, where: { ro: c.where ?? `în ${c.name}` } });

export const EUROPE_CITIES_2: Region[] = [
  // ------------------------------------------------------------------ Franța
  city({
    slug: "paris", country: "fr", name: "Paris", mission: ["Paris"],
    notes: { ro: [
      "Parisul și Île-de-France au cea mai mare comunitate de români din Franța. Aici au trăit, între cele două războaie și în anii comunismului, mulți dintre marii artiști și scriitori români: Constantin Brâncuși, George Enescu, Emil Cioran, Eugène Ionesco. Atelierul lui Brâncuși, refăcut lângă Centrul Pompidou, și mormintele lui Brâncuși, Cioran și Ionesco din cimitirul Montparnasse sunt și azi locuri pe care românii din Paris le arată copiilor.",
      "După 1990 și mai ales după 2007 au venit studenți, medici, ingineri, muncitori și familii întregi, care locuiesc azi atât în Paris, cât și în orașele din jur. Pentru ei, actele românești se cer prin secția consulară a ambasadei de la Paris, cu programare pe econsulat.ro: certificate, procuri, transcrierea nașterilor și a căsătoriilor.",
      "Actele franceze se cer de la primăria arondismentului (mairie d'arrondissement) sau a comunei unde s-a petrecut evenimentul. Arhivele Parisului au online registrele de stare civilă vechi ale orașului; pentru anii de dinainte de 1860, registrele originale au ars în 1871, iar arhiva are în locul lor o parte din acte refăcute după incendiu.",
      "Multe familii din exilul de după 1947 au păstrat acasă scrisori, fotografii și acte aduse din țară. Pentru urmașii lor, acestea sunt adesea singura legătură cu satul de origine: scanează-le, notează numele celor din imagini cât încă trăiește cineva care îi recunoaște, și pune-le în arbore. Cu numele satului, pagina localității de pe Cartea Neamului te duce la arhiva județeană potrivită.",
      "Pentru o familie cu rădăcini în exil, presa exilului românesc de la Paris, păstrată în marile biblioteci, poate avea anunțuri de căsătorie sau de deces, liste de membri ai asociațiilor și articole despre oameni pe care familia i-a uitat. Merită căutat numele bunicilor și în aceste colecții.",
      "Copiii crescuți la Paris află adesea de la școală despre Brâncuși sau Ionesco. Pentru ei, arborele familiei poate lega numele mari din manuale de propriii bunici: oameni din aceleași sate și orașe, cu povești la fel de interesante, pe care doar familia le mai știe.",
    ] },
  }),
  city({
    slug: "lyon", country: "fr", name: "Lyon", mission: ["Lyon"],
    notes: { ro: [
      "Lyonul și regiunea Auvergne-Rhône-Alpes au o comunitate românească în creștere, cu muncitori în construcții și industrie, personal medical, cercetători și mulți studenți la universitățile și școlile de inginerie ale orașului. Mulți au venit după 2007, iar o parte s-au așezat în orașele din jur, de la Villeurbanne până la Saint-Étienne și Grenoble.",
      "La Lyon funcționează un consulat general al României, care servește departamentele din regiune; lista exactă e pe pagina oficială a consulatului. Prin el ceri certificate din România, dai procuri rudelor din țară, transcrii nașterea copiilor născuți în Franța și îți reînnoiești actele, cu programare pe econsulat.ro.",
      "Actele franceze se cer de la primăria comunei unde s-a petrecut evenimentul. Arhivele municipale ale Lyonului și arhivele departamentale au pus online registrele vechi de stare civilă și registrele parohiale de dinainte de Revoluție, așa că partea franceză a unei familii mixte se poate căuta adesea, de acasă, câteva secole înapoi.",
      "Lyonul a fost timp de secole orașul mătăsii, cu ateliere care au atras lucrători din toată Europa. Dacă familia partenerului are rădăcini lyoneze vechi, actele de căsătorie din secolul al XIX-lea arată de obicei meseria mirilor și a părinților lor, iar meseria e un bun indiciu pentru a lega generațiile între ele.",
      "Pentru partea din România, începe cu ce știu părinții și bunicii: numele complete, satul, anii. Apoi află de ce comună și de ce județ ține satul azi; registrele mai vechi de 100 de ani sunt la Arhivele Naționale, pe județe, iar cele mai noi la primării.",
      "Pentru studenții români de la Lyon, arborele familiei poate începe chiar acum, cu ce știu părinții și bunicii, și poate fi completat pe parcurs, la fiecare drum acasă.",
      "Familiile din regiunea Lyonului au adesea rude și în Elveția, la doar câteva ore de drum, sau în Italia. Pe Cartea Neamului, toate aceste ramuri stau în același arbore, iar fiecare rudă îl vede în limba ei, de la franceză și italiană până la română.",
    ] },
  }),
  city({
    slug: "marsilia", country: "fr", name: "Marsilia", mission: ["Marsilia"],
    notes: { ro: [
      "Marsilia, cel mai mare port al Franței la Mediterana, a fost mereu un oraș al celor veniți de departe. Românii din Provence-Alpes-Côte d'Azur lucrează aici în construcții, port, turism, sănătate și agricultură, iar mulți locuiesc în orașele de pe coastă, de la Toulon până la Nisa.",
      "Marsilia are un consulat general al României, trecut pe lista oficială a misiunilor românești. Zona lui exactă e pe pagina oficială; acolo ceri certificate din România, procuri, transcrieri de nașteri și căsătorii și pașapoarte, cu programare pe econsulat.ro.",
      "Actele franceze se cer de la primăria unde s-a petrecut evenimentul. Arhivele departamentale ale departamentului Bouches-du-Rhône, la Marsilia, au online registrele vechi de stare civilă și parohiale, iar pentru familiile cu strămoși marinari sau negustori merită căutate și registrele portului și ale tribunalului comercial.",
      "Pentru că Marsilia a primit de-a lungul timpului italieni, armeni, greci și oameni din nordul Africii, multe familii de aici sunt mixte. Un arbore comun, în care fiecare ramură e completată de cine o cunoaște cel mai bine, în limba lui, e cel mai bun mod de a ține împreună o astfel de familie.",
      "Pentru registrele românești vechi, ține minte că în Transilvania, Banat și Crișana starea civilă de stat începe în 1895, iar în Moldova și Țara Românească în 1865. Înainte, sursele sunt registrele parohiilor, păstrate de obicei la Arhivele Naționale, la serviciul județean al satului.",
      "Familiile din sudul Franței trec des granița spre Italia și Spania, unde au și ele rude. Pe Cartea Neamului, ramurile din toate cele trei țări stau în același arbore, iar fiecare rudă îl vede în limba ei: franceză, italiană, spaniolă sau română.",
      "Pentru copiii crescuți la Marsilia, o vizită în satul bunicilor e adesea prima întâlnire cu locurile familiei. Pregătiți-o împreună: căutați satul pe hartă, aflați numele străbunicilor și treceți-le în arbore, ca vizita să aibă și o poveste.",
    ] },
  }),
  city({
    slug: "strasbourg", country: "fr", name: "Strasbourg", mission: ["Strasbourg"],
    notes: { ro: [
      "Strasbourg e sediul Consiliului Europei și al Parlamentului European, iar pe lângă românii care lucrează aici în instituțiile europene trăiesc în Alsacia și familii venite la muncă, studenți la universitatea orașului și personal medical. România are la Strasbourg și o reprezentanță permanentă pe lângă Consiliul Europei.",
      "Consulatul general al României de la Strasbourg servește departamentele din estul Franței; lista exactă e pe pagina oficială. Prin el ceri certificate din România, procuri și transcrieri, cu programare pe econsulat.ro.",
      "Alsacia are o istorie aparte: între 1871 și 1918 a făcut parte din Germania, iar actele de stare civilă din acei ani sunt scrise în germană. Numele localităților apar și ele în două forme, franceză și germană, așa că pentru o familie alsaciană caută amândouă. Arhivele Alsaciei au online registrele vechi de stare civilă și parohiale.",
      "Pentru familiile românești, istoria Alsaciei seamănă cu cea a Transilvaniei: aceeași localitate cu nume în mai multe limbi, aceleași registre scrise în limba administrației de atunci. Cine a învățat să citească acte vechi maghiare sau germane din Transilvania se descurcă ușor și cu cele alsaciene.",
      "Pentru partea din România, începe cu ce știu cei vii, apoi află comuna și județul satului. Actele mai noi de 100 de ani sunt la primării; cele mai vechi și registrele parohiale, la Arhivele Naționale, pe județe.",
      "Mulți dintre cei care lucrează la Strasbourg în instituțiile europene se mută des, cu familiile lor, dintr-o țară în alta. Un arbore al familiei, ținut în același loc oriunde ar fi, păstrează datele și poveștile care altfel s-ar pierde la fiecare mutare.",
      "Pentru o familie alsaciană, un act de căsătorie din anii 1871–1918 poate fi scris în germană, iar unul de după 1918 în franceză, pentru aceleași persoane. Notează în arbore ambele forme ale numelor și ale localităților, ca să le recunoască oricine din familie.",
      "Strasbourgul e la doar câțiva kilometri de Germania, iar mulți români din Alsacia lucrează sau au rude de cealaltă parte a Rinului. Actele germane se cer de la oficiul de stare civilă al orașului german unde s-a petrecut evenimentul.",
    ] },
  }),

  // ------------------------------------------------------------------ Austria
  city({
    slug: "viena", country: "at", name: "Viena", mission: ["Viena"],
    notes: { ro: [
      "Viena a fost, până în 1918, capitala la care mergeau studenții, ofițerii și negustorii din Transilvania, Banat și Bucovina. Aici a studiat Mihai Eminescu între 1869 și 1872, iar mulți intelectuali români din Ardeal și Bucovina s-au format la universitatea vieneză. Azi, Viena are cea mai mare comunitate de români din Austria, cu muncitori, personal medical, studenți și familii.",
      "Actele românești se cer prin secția consulară a ambasadei de la Viena, cu programare pe econsulat.ro: certificate, procuri, transcrierea nașterilor și căsătoriilor, pașapoarte.",
      "Pentru actele austriece, starea civilă de stat există din 1938–1939; înainte, sursele sunt registrele parohiilor. Arhiva orașului și a landului Viena păstrează evidențele vechi de domiciliu (Meldezettel), utile pentru rudele care au trăit în oraș, iar cimitirele vieneze au o căutare online după numele celor înmormântați.",
      "Arhivele de Stat ale Austriei, la Viena, păstrează și fișele de recrutare ale soldaților armatei austro-ungare din toate provinciile imperiului. Pentru un străbunic din Transilvania, Banat sau Bucovina care a fost soldat, o astfel de fișă poate da anul și locul nașterii, confesiunea și meseria.",
      "Pentru familiile din vestul României, Viena e adesea o piesă a arborelui: un străbunic care a lucrat acolo, o căsătorie încheiată acolo, un copil născut acolo. Notează orașul fiecărui eveniment în arbore, pentru că de el depinde unde cauți actul.",
      "Viena a fost și orașul multor negustori și meseriași din Transilvania și Banat, care veneau pentru câțiva ani și se întorceau acasă. Dacă în familie se povestește despre un străbunic care a lucrat la Viena, caută-l în evidențele de domiciliu ale orașului, unde apar data sosirii și locul nașterii.",
      "Pentru copiii crescuți la Viena, istoria comună a Austriei și a Transilvaniei e o poveste bună de spus: aceiași împărați în manualele ambelor țări, aceleași clădiri în Viena și în Sibiu sau Timișoara. Arborele familiei le arată unde se întâlnesc cele două istorii în propria lor familie.",
    ] },
  }),
  city({
    slug: "salzburg", country: "at", name: "Salzburg", mission: ["Salzburg"],
    notes: { ro: [
      "Salzburg și landurile din vestul Austriei au mulți români care lucrează în turism, hoteluri, restaurante, construcții și îngrijire, unii doar sezonier, alții stabiliți de ani buni cu familiile lor. Copiii lor cresc vorbind germana, iar legătura cu bunicii din România se ține adesea prin telefon.",
      "Salzburg are un consulat general al României, care servește landurile din vestul Austriei; lista exactă e pe pagina oficială. Acolo ceri certificate din România, procuri, transcrieri și pașapoarte, cu programare pe econsulat.ro.",
      "Pentru actele austriece vechi, sursa principală sunt registrele parohiale, pentru că starea civilă de stat începe abia în 1938–1939. Registrele catolice ale arhidiecezei Salzburg sunt în mare parte online, gratuit, pe portalul Matricula, iar arhiva landului Salzburg păstrează fonduri ale administrației vechi.",
      "Pentru românii care lucrează sezonier, drumurile acasă sunt cel mai bun prilej pentru arbore: o seară cu bunicii, câteva poze vechi fotografiate cu telefonul și numele satelor și ale nașilor. Trecute imediat în arbore, ele rămân la îndemâna întregii familii, oriunde ar fi.",
      "Pentru registrele românești, află întâi comuna și județul satului; actele mai noi de 100 de ani sunt la primării, iar cele mai vechi și registrele parohiale la Arhivele Naționale, pe județe. În Transilvania starea civilă începe în 1895, în Moldova și Țara Românească în 1865.",
      "Mulți români din vestul Austriei lucrează și în Tirol sau Vorarlberg, unde actele se cer tot de la comunele locale. Notează în arbore orașul exact al fiecărui eveniment, al nașterii sau al căsătoriei, pentru că de el depinde unde ceri actul.",
      "Pentru copiii crescuți aici, munții Salzburgului seamănă cu cei ai Maramureșului, ai Bucovinei sau ai Mărginimii Sibiului, de unde vin multe familii. O fotografie a satului bunicilor lângă una din Austria e un început bun pentru o poveste a familiei.",
      "Când ceri un act vechi din România de la distanță, dă cât mai multe detalii: numele complet, anul aproximativ, satul și comuna de atunci. Arhivele răspund mai repede când știu exact ce caută.",
    ] },
  }),

  // ------------------------------------------------------------------ Belgia
  city({
    slug: "bruxelles", country: "be", name: "Bruxelles", mission: ["Bruxelles"],
    notes: { ro: [
      "Bruxelles are o comunitate românească amestecată: funcționari ai instituțiilor europene, diplomați și consultanți, dar și muncitori în construcții, transport și servicii, veniți mai ales după 2007. Cei mai mulți trăiesc în cele 19 comune ale Regiunii Bruxelles-Capitală, fiecare cu primăria și registrele ei.",
      "Actele românești se cer prin secția consulară a ambasadei de la Bruxelles, cu programare pe econsulat.ro: certificate, procuri, transcrierea nașterilor și căsătoriilor, pașapoarte.",
      "Actele belgiene se cer de la comuna unde s-a petrecut evenimentul, nu de la orașul Bruxelles în general: Schaerbeek, Anderlecht, Ixelles sau Etterbeek au fiecare starea civilă proprie. Actele se emit în franceză sau olandeză, la alegere, iar Arhivele Statului au online multe registre vechi de stare civilă și parohiale.",
      "Pentru copiii crescuți la Bruxelles între trei-patru limbi, arborele familiei e un loc în care toate se întâlnesc: bunicii completează în română, copiii citesc în franceză sau olandeză, iar fiecare vede aceeași familie. Pozele vechi, cu numele celor din ele, sunt partea pe care copiii o privesc cel mai des.",
      "Pentru registrele vechi din România, ține minte regiunile: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865. Înainte, sursele sunt registrele parohiilor, la Arhivele Naționale, pe județe.",
      "Pentru funcționarii europeni care se mută des, un arbore ținut într-un singur loc păstrează actele, pozele și poveștile familiei, oriunde i-ar duce cariera. Rudele din România îl pot completa în același timp, fiecare cu ce știe.",
      "Comunele din Bruxelles țin și registrul populației, cu toți locuitorii lor. Pentru o rudă care a trăit în Belgia, un extras din acest registru arată adresele, data sosirii și membrii gospodăriei, ceea ce ajută mult la reconstituirea unei familii.",
      "Când ceri un act vechi din România de la distanță, dă cât mai multe detalii: numele complet, anul aproximativ, satul și comuna de atunci. Arhivele județene răspund mai repede când știu exact ce să caute și unde.",
    ] },
  }),

  // ------------------------------------------------------------------ Irlanda
  city({
    slug: "dublin", country: "ie", name: "Dublin", mission: ["Dublin"],
    notes: { ro: [
      "Dublinul are cea mai mare comunitate de români din Irlanda. Mulți au venit după 2007 și lucrează în construcții, sănătate, comerț și în firmele de tehnologie din oraș, iar o parte s-au așezat în orașele din jur. Copiii lor cresc vorbind engleza, cu bunicii la un apel distanță.",
      "Actele românești se cer prin secția consulară a ambasadei de la Dublin, cu programare pe econsulat.ro: certificate, procuri, transcrieri și pașapoarte.",
      "Pentru actele irlandeze, Oficiul General de Stare Civilă eliberează certificatele, iar portalul gratuit irishgenealogy.ie are registrele istorice de nașteri, căsătorii și decese. Arhivele Naționale ale Irlandei, la Dublin, au online recensămintele din 1901 și 1911, cu fiecare gospodărie din țară.",
      "Cimitirul Glasnevin din Dublin, deschis în prima jumătate a secolului al XIX-lea, are evidențe ale celor înmormântați acolo, care pot fi căutate după nume. Pentru o familie dublineză veche, sunt un bun complement al actelor de deces.",
      "Pentru partea din România, ține minte regiunile: în Transilvania, Banat și Crișana starea civilă începe în 1895, iar în Moldova și Țara Românească în 1865. Înainte, sursele sunt registrele parohiilor, păstrate de obicei la Arhivele Naționale, la serviciul județean al satului. Află întâi comuna și județul de care ține azi satul familiei.",
      "Pentru familiile mixte româno-irlandeze, cele două jumătăți ale arborelui se fac diferit: partea irlandeză pe portalurile gratuite ale statului irlandez, partea românească pornind de la bunici și ajungând la registrele parohiale din arhivele județene. Pe Cartea Neamului stau în același arbore.",
      "Copiii crescuți la Dublin primesc la școală, uneori, teme despre familie și originea ei. E un bun prilej să sune la bunici și să afle cum îi chema pe străbunici, din ce sat erau și ce meserii aveau, apoi să treacă totul în arbore.",
      "Dacă ai nevoie urgent de un act din România, procura dată unei rude din țară e de obicei calea cea mai rapidă: o semnezi la ambasadă, iar ruda ridică actul de la primărie și ți-l trimite.",
    ] },
  }),

  // ------------------------------------------------------------------ Portugalia
  city({
    slug: "lisabona", country: "pt", name: "Lisabona", mission: ["Lisabona"],
    notes: { ro: [
      "Lisabona și orașele din jur au mulți români veniți la începutul anilor 2000, la muncă în construcții, agricultură și servicii, alături de mulți moldoveni din Republica Moldova. Unii s-au întors acasă după criza din 2008, alții au rămas și și-au crescut copiii aici.",
      "Actele românești se cer prin secția consulară a ambasadei de la Lisabona, cu programare pe econsulat.ro: certificate, procuri, transcrieri și pașapoarte.",
      "Actele portugheze se cer de la Conservatória do Registo Civil. La Lisabona se află și Arhiva Națională Torre do Tombo, una dintre cele mai vechi instituții de acest fel din Europa, care păstrează și registrele parohiale ale districtului Lisabona, multe dintre ele consultabile online, gratuit.",
      "Registrele de botez portugheze trec adesea numele bunicilor din ambele părți, așa că un singur act poate da trei generații. Pentru o familie mixtă româno-portugheză, partea portugheză a arborelui se poate face astfel, de multe ori, câteva secole înapoi.",
      "Pentru moldovenii din Republica Moldova, registrele vechi sunt de obicei la Chișinău, la Agenția Națională a Arhivelor. Pentru cei din România, află întâi comuna și județul satului; actele mai noi de 100 de ani sunt la primării, iar cele mai vechi la Arhivele Naționale, pe județe.",
      "Lisabona a fost mereu un oraș de plecări și sosiri, cu un port deschis spre lume. Familiile mixte de aici au adesea rude în Brazilia, Angola sau alte țări de limbă portugheză, iar un arbore comun le poate aduna pe toate, fiecare ramură completată de cine o cunoaște.",
      "Pentru copiii crescuți la Lisabona, care vorbesc portugheza mai bine decât româna, arborele familiei e o cale ușoară spre limba bunicilor: numele satelor, poreclele, meseriile vechi. Fiecare poveste trecută în arbore e o lecție de română fără manual.",
      "Dacă ai nevoie urgent de un act din România, procura dată unei rude din țară e de obicei calea cea mai rapidă: o semnezi la ambasadă, iar ruda ridică actul de la primărie și ți-l trimite prin poștă.",
    ] },
  }),

  // ------------------------------------------------------------------ Grecia
  city({
    slug: "atena", country: "gr", name: "Atena", mission: ["Atena"],
    notes: { ro: [
      "Atena și Attica au cei mai mulți români din Grecia, veniți mai ales după 1990, la muncă în construcții, îngrijire, curățenie, turism și comerț. Mulți au trăit aici zeci de ani, iar copiii lor au crescut vorbind greaca.",
      "Actele românești se cer prin secția consulară a ambasadei de la Atena, cu programare pe econsulat.ro: certificate, procuri, transcrierea nașterilor și căsătoriilor, pașapoarte.",
      "Actele grecești se cer de la oficiul de stare civilă al municipalității (lixiarheio), iar registrele de familie ale municipalităților (dimotologhia) arată membrii fiecărei familii înscrise acolo. Arhivele Generale ale Statului, cu sediul central la Atena, păstrează fonduri vechi ale administrației grecești.",
      "Legăturile dintre greci și români sunt vechi: în secolele XVIII–XIX, mulți negustori greci s-au așezat în porturile dunărene și în orașele românești. Multe familii au deci rude de ambele părți, iar numele grecești au fost adesea românizate în actele vechi românești, așa că merită căutate în mai multe forme.",
      "Pentru partea din România, pornește de la cel mai vechi act pe care îl are familia, de obicei certificatul de naștere sau de căsătorie al bunicilor, și mergi înapoi generație cu generație. Fiecare act îți dă numele părinților, deci pasul următor, iar registrele de peste 100 de ani sunt la Arhivele Naționale, pe județe.",
      "Mulți români din Atena au trăit aici de la începutul anilor '90, iar unii și-au întemeiat familii cu greci. Pentru copiii acestor familii, arborele are o parte greacă și una românească, ambele cu rădăcini ortodoxe și cu registre parohiale vechi, fiecare în limba lui.",
      "Când cauți un nume grecesc în actele românești vechi, încearcă și forma românizată: un nume care se termina în -opoulos sau -idis poate apărea scurtat sau tradus. Pentru numele românești în actele grecești, încearcă și forma cu terminație grecească, mai ales la femei.",
      "Pentru românii care au trăit în Grecia zeci de ani, actele grecești ale copiilor și ale căsătoriilor trebuie transcrise în registrele românești ca să apară și în actele din România. Ambasada te poate ajuta cu pașii, iar transcrierea se poate face și la starea civilă din țară.",
    ] },
  }),
  city({
    slug: "salonic", country: "gr", name: "Salonic", mission: ["Salonic"],
    notes: { ro: [
      "Salonicul e al doilea oraș al Greciei și centrul Macedoniei grecești. Românii de aici lucrează în construcții, agricultură, turism și servicii, mulți veniți după 1990. Orașul are o istorie lungă de oraș cu multe neamuri: greci, evrei sefarzi, turci, armeni, aromâni și slavi au trăit aici secole la rând.",
      "La Salonic funcționează un consulat general al României, care servește nordul Greciei; lista exactă e pe pagina oficială. Acolo ceri certificate din România, procuri, transcrieri și pașapoarte, cu programare pe econsulat.ro.",
      "Actele grecești se cer de la oficiul de stare civilă al municipalității. Arhiva Istorică a Macedoniei, la Salonic, parte din Arhivele Generale ale Statului, păstrează fonduri ale administrației regiunii, utile pentru familiile cu rădăcini în nordul Greciei.",
      "În satele din nordul Greciei trăiește de secole o comunitate de aromâni, care vorbesc un grai înrudit cu româna. În perioada interbelică, unele familii de aromâni s-au mutat în România, mai ales în Dobrogea; urmașii lor caută azi satele bunicilor din Grecia, iar Salonicul e adesea punctul de plecare.",
      "Pentru registrele din România, află întâi comuna și județul de care ține azi satul familiei. Actele mai noi de 100 de ani sunt la primării, iar cele mai vechi și registrele parohiale la Arhivele Naționale, pe județe; pentru aromânii din Dobrogea, registrele de stare civilă încep după 1878.",
      "Comunitatea evreiască sefardă a Salonicului a fost una dintre cele mai mari din Europa până la deportările din 1943. Pentru familiile evreiești cu rude în România și în Grecia, arhivele comunității și bazele de date ale Yad Vashem sunt locurile principale de căutare.",
      "Pentru românii din nordul Greciei, consulatul de la Salonic e mai aproape decât ambasada de la Atena. Programarea se face tot pe econsulat.ro, iar pentru acte urgente o procură dată unei rude din România poate scurta drumul.",
      "Când cauți un nume în actele grecești vechi, încearcă mai multe transcrieri în alfabetul latin și forma de feminin a numelui de familie, care diferă de cea de masculin.",
    ] },
  }),

  // ------------------------------------------------------------------ Cipru
  city({
    slug: "nicosia", country: "cy", name: "Nicosia", mission: ["Nicosia"],
    notes: { ro: [
      "Nicosia e capitala Ciprului și ultima capitală împărțită din Europa: partea de nord e sub administrație turco-cipriotă din 1974. Românii din Cipru trăiesc în Nicosia, dar și la Limassol, Larnaca și Paphos, unde lucrează în turism, construcții, servicii și îngrijire.",
      "Actele românești se cer prin secția consulară a ambasadei de la Nicosia, cu programare pe econsulat.ro: certificate, procuri, transcrierea nașterilor și căsătoriilor, pașapoarte.",
      "Actele cipriote se cer de la Departamentul pentru Registrul Civil și Migrație, iar căsătoriile civile de la municipalitatea unde au avut loc. Arhivele de Stat ale Ciprului, la Nicosia, păstrează fonduri ale administrației insulei, inclusiv din perioada britanică.",
      "Multe cupluri din alte țări se căsătoresc civil în Cipru. Dacă părinții sau bunicii s-au căsătorit acolo, căsătoria trebuie transcrisă în registrele românești ca să apară în actele din România; ambasada te poate ajuta cu pașii.",
      "Pentru registrele vechi din România, ține minte regiunile: în Transilvania, Banat și Crișana starea civilă începe în 1895, în Moldova și Țara Românească în 1865. Înainte, sursele sunt registrele parohiilor, păstrate la Arhivele Naționale, pe județe. Pagina fiecărei localități de pe Cartea Neamului îți arată de ce comună și de ce județ ține satul.",
      "Pentru românii din Cipru, distanța față de casă e mare, iar drumurile acasă sunt rare. Un arbore completat de la distanță, cu ajutorul rudelor din țară, păstrează legătura cu satul și cu bunicii: fiecare adaugă ce știe, de pe telefon, iar toată familia vede același arbore.",
      "Copiii crescuți în Cipru vorbesc adesea greaca, engleza și româna. Pentru ei, arborele familiei, cu pozele bunicilor și numele satelor, e un loc în care cele trei limbi se întâlnesc, iar povestea familiei rămâne a lor, oriunde ar ajunge.",
      "Dacă ai nevoie urgent de un act din România, o procură semnată la ambasadă și dată unei rude din țară e de obicei calea cea mai rapidă: ruda ridică actul de la primărie și ți-l trimite.",
    ] },
  }),
];
