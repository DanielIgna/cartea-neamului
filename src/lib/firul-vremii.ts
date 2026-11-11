/**
 * „Firul vremii”: o singură axă a anilor pe care stau, aliniate, poporul lui Dumnezeu (patriarhii, judecătorii, împărații lui
 * Iuda și ai lui Israel, proorocii) și popoarele din jur (Egipt, Mesopotamia, Asia Mică și Grecia, Persia și Roma), plus
 * pământul nostru (geto-dacii). Scris de mână; anii sunt aproximativi și urmează cronologia folosită de mulți istorici
 * pentru împărați (Thiele) și, pentru patriarhi, socoteala care ia literal 1 Împărați 6:1 și Exodul 12:40.
 * Anii înainte de Hristos sunt numere negative (-586 = 586 î.Hr.).
 */

export type LaneId = "linia" | "israel" | "iuda" | "nord" | "prooroci" | "egipt" | "mesopotamia" | "apus" | "persia-roma" | "noi";

export const LANES: { id: LaneId; label: string; group: "biblia" | "lumea" | "noi" }[] = [
  { id: "linia", label: "Oameni din neamul lui Hristos", group: "biblia" },
  { id: "israel", label: "Poporul lui Israel", group: "biblia" },
  { id: "iuda", label: "Împărații lui Iuda (miazăzi)", group: "biblia" },
  { id: "nord", label: "Împărații lui Israel (miazănoapte)", group: "biblia" },
  { id: "prooroci", label: "Prooroci", group: "biblia" },
  { id: "egipt", label: "Egiptul", group: "lumea" },
  { id: "mesopotamia", label: "Mesopotamia: Ur, Babilon, Asiria", group: "lumea" },
  { id: "apus", label: "Asia Mică și Grecia", group: "lumea" },
  { id: "persia-roma", label: "Persia și Roma", group: "lumea" },
  { id: "noi", label: "Pe pământul nostru", group: "noi" },
];

export type Span = {
  id: string;
  lane: LaneId;
  label: string;
  from: number;
  to: number;
  /** Anii sunt nesiguri (desenat cu margini estompate). */
  approx?: boolean;
  /** Pentru o legătură spre un arbore din pagina „De la Adam la Hristos” (id-ul persoanei de acolo). */
  person?: string;
  note?: string;
  refs?: string;
};

export type Moment = { id: string; year: number; label: string; note?: string; refs?: string; approx?: boolean };

/** Prima și ultima dată de pe axă. */
export const START = -2200;
export const END = 40;

const s = (lane: LaneId, id: string, label: string, from: number, to: number, extra: Partial<Span> = {}): Span => ({ id, lane, label, from, to, ...extra });

export const SPANS: Span[] = [
  // Oameni din neamul lui Hristos (anii vieții)
  s("linia", "avraam", "Avraam", -2166, -1991, { person: "avraam", refs: "Geneza 12–25", note: "Chemat din Ur al Haldeilor, a trăit ca străin în Canaan. Anii î.Hr. vin din socoteala care ia literal cifrele Bibliei; mulți istorici îl pun cu câteva secole mai târziu." }),
  s("linia", "isaac", "Isaac", -2066, -1886, { person: "isaac", refs: "Geneza 21–35" }),
  s("linia", "iacov", "Iacov (Israel)", -2006, -1859, { person: "iacov", refs: "Geneza 25–50", note: "A coborât în Egipt la 130 de ani și a murit acolo la 147." }),
  s("linia", "iosif", "Iosif", -1915, -1805, { person: "iosif-eg", refs: "Geneza 37–50", note: "Al doilea om din Egipt după faraon. Dacă socoteala e bună, a trăit în vremea Regatului Mijlociu egiptean." }),
  s("linia", "moise", "Moise", -1526, -1406, { person: "moise", refs: "Exodul – Deuteronomul", note: "Din seminția lui Levi, nu din linia lui Hristos, dar prin el a dat Dumnezeu Legea. 40 de ani la curtea faraonului, 40 în Madian, 40 în pustie." }),
  s("linia", "boaz", "Boaz și Rut", -1150, -1080, { approx: true, person: "boaz", refs: "Rut 1–4", note: "„Pe vremea judecătorilor” (Rut 1:1). Anii lor nu se cunosc; locul de pe axă e doar aproximativ." }),
  s("linia", "david", "David", -1040, -970, { person: "david", refs: "1 Samuel 16 – 1 Împărați 2" }),
  s("linia", "zorobabel", "Zorobabel", -570, -500, { approx: true, person: "zorobabel", refs: "Ezra 2–5; Hagai", note: "A condus întoarcerea din robie și rezidirea Templului." }),
  s("linia", "iosif-maria", "Iosif și Maria", -40, 20, { approx: true, person: "iosif", refs: "Matei 1–2; Luca 1–2" }),
  s("linia", "isus", "Isus Hristos", -5, 30, { approx: true, person: "isus", refs: "Evangheliile", note: "Născut pe la 6–4 î.Hr., sub Irod cel Mare; răstignit și înviat pe la anul 30 (unii socotesc 33)." }),

  // Poporul lui Israel
  s("israel", "patriarhii", "Patriarhii în Canaan", -2091, -1876, { refs: "Geneza 12–46" }),
  s("israel", "egipt", "În Egipt", -1876, -1446, { refs: "Exodul 1–12; Exodul 12:40", note: "430 de ani, după Exodul 12:40. Septuaginta socotește aici și anii din Canaan, ceea ce ar scurta șederea în Egipt la jumătate." }),
  s("israel", "pustia", "Pustia", -1446, -1406, { refs: "Numeri; Deuteronomul", note: "40 de ani, de la ieșirea din Egipt până la intrarea în Canaan. Mulți istorici pun ieșirea pe la 1260 î.Hr." }),
  s("israel", "judecatorii", "Iosua și judecătorii", -1406, -1050, { refs: "Iosua; Judecători; Rut; 1 Samuel 1–7", note: "Otniel, Ehud, Debora, Ghedeon, Iefta, Samson, Eli, Samuel. Unii judecători au condus în același timp în părți diferite ale țării, de aceea anii lor nu se pot pune unul după altul." }),
  s("israel", "regatul-unit", "Regatul unit: Saul, David, Solomon", -1050, -931, { refs: "1 Samuel 8 – 1 Împărați 11" }),
  s("israel", "impartit", "Regatul împărțit", -931, -586, { refs: "1 Împărați 12 – 2 Împărați 25", note: "Zece seminții la miazănoapte (Israel, capitala Samaria) și Iuda cu Beniamin la miazăzi (capitala Ierusalim)." }),
  s("israel", "robia", "Robia babiloniană", -586, -538, { refs: "2 Împărați 25; Daniel; Ieremia 29:10", note: "Cei 70 de ani ai lui Ieremia se socotesc de obicei de la primii robi (605 î.Hr.) până la întoarcere (538–536)." }),
  s("israel", "persana", "Sub perși: Templul rezidit", -538, -332, { refs: "Ezra; Neemia; Estera; Hagai; Zaharia; Maleahi" }),
  s("israel", "greaca", "Sub greci", -332, -167, { note: "După Alexandru cel Mare, Iudeea a fost întâi sub Ptolemeii din Egipt, apoi sub Seleucizii din Siria." }),
  s("israel", "macabei", "Macabeii", -167, -63, { note: "Răscoala împotriva lui Antioh al IV-lea, care pângărise Templul. Templul a fost curățit în 164 î.Hr. (sărbătoarea Hanuka, pomenită în Ioan 10:22)." }),
  s("israel", "roma", "Sub romani", -63, END, { note: "Pompei intră în Ierusalim în 63 î.Hr. Irod cel Mare domnește între 37 și 4 î.Hr.; el a mărit Templul în care a intrat Domnul Isus." }),

  // Împărații lui Iuda
  s("iuda", "saul", "Saul", -1050, -1010, { refs: "1 Samuel 9–31", note: "Primul împărat, din seminția lui Beniamin." }),
  s("iuda", "k-david", "David", -1010, -970, { person: "david", refs: "2 Samuel" }),
  s("iuda", "solomon", "Solomon", -970, -931, { person: "solomon", refs: "1 Împărați 1–11" }),
  s("iuda", "roboam", "Roboam", -931, -913, { person: "roboam" }),
  s("iuda", "abia", "Abia", -913, -911, { person: "abia" }),
  s("iuda", "asa", "Asa", -911, -870, { person: "asa" }),
  s("iuda", "iosafat", "Iosafat", -873, -848, { person: "iosafat" }),
  s("iuda", "ioram", "Ioram", -853, -841, { person: "ioram" }),
  s("iuda", "ahazia", "Ahazia", -841, -840, { person: "ahazia" }),
  s("iuda", "atalia", "Atalia", -841, -835, { refs: "2 Împărați 11", note: "Mama lui Ahazia, fiica lui Ahab. A omorât neamul împărătesc și a domnit șase ani; singura femeie pe tronul lui Iuda." }),
  s("iuda", "ioas", "Ioas", -835, -796, { person: "ioas" }),
  s("iuda", "amatia", "Amația", -796, -767, { person: "amatia" }),
  s("iuda", "ozia", "Ozia", -792, -740, { person: "ozia" }),
  s("iuda", "iotam", "Iotam", -750, -732, { person: "iotam" }),
  s("iuda", "ahaz", "Ahaz", -735, -715, { person: "ahaz" }),
  s("iuda", "ezechia", "Ezechia", -715, -686, { person: "ezechia" }),
  s("iuda", "manase", "Manase", -697, -642, { person: "manase-r" }),
  s("iuda", "amon", "Amon", -642, -640, { person: "amon" }),
  s("iuda", "iosia", "Iosia", -640, -609, { person: "iosia" }),
  s("iuda", "ioiachim", "Ioiachim", -609, -598, { person: "ioiachim" }),
  s("iuda", "zedechia", "Zedechia", -597, -586, { person: "zedechia" }),

  // Împărații lui Israel (miazănoapte)
  s("nord", "ieroboam", "Ieroboam I", -931, -910, { refs: "1 Împărați 12–14", note: "A pus viței de aur la Betel și la Dan, ca poporul să nu mai urce la Ierusalim." }),
  s("nord", "nadab", "Nadab", -910, -909),
  s("nord", "baesa", "Baeșa", -909, -886),
  s("nord", "ela", "Ela", -886, -885),
  s("nord", "omri", "Omri", -885, -874, { refs: "1 Împărați 16:23–28", note: "A zidit Samaria, noua capitală. Inscripții asiriene numesc Israelul „casa lui Omri”." }),
  s("nord", "ahab", "Ahab", -874, -853, { refs: "1 Împărați 16–22", note: "Cu Izabela, a adus închinarea la Baal. În vremea lui a proorocit Ilie." }),
  s("nord", "ahazia-n", "Ahazia", -853, -852),
  s("nord", "ioram-n", "Ioram", -852, -841),
  s("nord", "iehu", "Iehu", -841, -814, { refs: "2 Împărați 9–10", note: "Apare închinându-se înaintea împăratului asirian Salmanasar al III-lea pe Obeliscul negru, aflat azi la British Museum." }),
  s("nord", "ioahaz-n", "Ioahaz", -814, -798),
  s("nord", "ioas-n", "Ioas", -798, -782),
  s("nord", "ieroboam2", "Ieroboam al II-lea", -793, -753, { refs: "2 Împărați 14:23–29", note: "Domnie lungă și bogată; Amos și Osea au mustrat nedreptatea din vremea lui." }),
  s("nord", "menahem", "Menahem", -752, -742),
  s("nord", "pecah", "Pecah", -740, -732),
  s("nord", "osea-r", "Osea", -732, -722, { refs: "2 Împărați 17", note: "Ultimul împărat. Asirienii au cucerit Samaria în 722 î.Hr. și au dus poporul în robie." }),

  // Prooroci
  s("prooroci", "samuel", "Samuel", -1105, -1015, { approx: true, refs: "1 Samuel 1–25" }),
  s("prooroci", "ilie", "Ilie", -875, -848, { approx: true, refs: "1 Împărați 17 – 2 Împărați 2" }),
  s("prooroci", "elisei", "Elisei", -850, -795, { approx: true, refs: "2 Împărați 2–13" }),
  s("prooroci", "iona", "Iona", -790, -770, { approx: true, refs: "Iona; 2 Împărați 14:25", note: "Trimis să propovăduiască în Ninive, capitala asirienilor." }),
  s("prooroci", "amos", "Amos", -765, -750, { approx: true }),
  s("prooroci", "osea", "Osea", -755, -715, { approx: true }),
  s("prooroci", "isaia", "Isaia", -740, -681, { approx: true, refs: "Isaia 1:1; 6:1" }),
  s("prooroci", "mica", "Mica", -735, -700, { approx: true, refs: "Mica 5:2", note: "A spus că Stăpânitorul lui Israel se va naște în Betleem." }),
  s("prooroci", "ieremia", "Ieremia", -627, -580, { approx: true }),
  s("prooroci", "daniel", "Daniel", -605, -536, { approx: true, refs: "Daniel 1:1; 10:1", note: "Dus la Babilon de tânăr, a slujit sub babilonieni și sub perși." }),
  s("prooroci", "ezechiel", "Ezechiel", -593, -571, { approx: true }),
  s("prooroci", "hagai", "Hagai și Zaharia", -520, -518, { refs: "Hagai 1:1; Zaharia 1:1" }),
  s("prooroci", "maleahi", "Maleahi", -440, -420, { approx: true, note: "Ultimul prooroc al Vechiului Testament. Urmează aproape 400 de ani fără prooroc, până la Ioan Botezătorul." }),
  s("prooroci", "ioan", "Ioan Botezătorul", -5, 29, { approx: true, refs: "Luca 1; 3; Matei 3", note: "Rudă cu Domnul Isus, cu șase luni mai mare. A pregătit calea Lui." }),

  // Egiptul
  s("egipt", "eg-mijlociu", "Regatul Mijlociu", -2050, -1650, { approx: true }),
  s("egipt", "hicsosi", "Hicsoșii", -1650, -1550, { approx: true, note: "Stăpânitori veniți din Canaan și Siria, care au domnit în nordul Egiptului." }),
  s("egipt", "eg-nou", "Regatul Nou: Tutmes, Ramses", -1550, -1070, { approx: true, note: "Vremea marilor faraoni. Stela lui Merneptah (c. 1208 î.Hr.) e cea mai veche pomenire a lui Israel în afara Bibliei." }),
  s("egipt", "eg-tarziu", "Egiptul slăbit", -1070, -525, { approx: true, note: "Faraonul Șișac (Șoșenc I) a jefuit Ierusalimul în vremea lui Roboam (1 Împărați 14:25); Neco l-a ucis pe Iosia la Meghido (609)." }),
  s("egipt", "eg-persan", "Sub perși", -525, -332),
  s("egipt", "ptolemei", "Ptolemeii", -305, -30, { note: "Urmașii unui general al lui Alexandru. La Alexandria s-a tradus Vechiul Testament în grecește (Septuaginta). Ultima a fost Cleopatra." }),

  // Mesopotamia
  s("mesopotamia", "ur", "Ur", -2112, -2004, { approx: true, note: "Cetatea din care a plecat Avraam (Geneza 11:31) era atunci una dintre cele mai bogate din lume." }),
  s("mesopotamia", "bab-vechi", "Babilonul vechi: Hamurabi", -1894, -1595, { approx: true, note: "Hamurabi (c. 1792–1750 î.Hr.) a scris unul dintre cele mai vechi coduri de legi." }),
  s("mesopotamia", "asiria", "Imperiul asirian", -911, -609, { note: "Cel mai temut imperiu al vremii. A cucerit Samaria (722) și a împresurat Ierusalimul (701). Capitala, Ninive, a căzut în 612." }),
  s("mesopotamia", "bab-nou", "Babilonul lui Nabucodonosor", -626, -539, { note: "Nabucodonosor (605–562) a distrus Ierusalimul și Templul în 586. Babilonul a căzut în noaptea ospățului lui Belșațar (Daniel 5)." }),

  // Asia Mică și Grecia
  s("apus", "hititi", "Hitiții", -1650, -1180, { approx: true, note: "Popor din Anatolia. Avraam a cumpărat peștera Macpela de la Efron hetitul (Geneza 23); Urie, soțul Bat-Șebei, era hetit." }),
  s("apus", "grecia-veche", "Grecia arhaică", -800, -480, { approx: true, note: "Homer, primele Olimpiade (776), cetățile-stat. Coloniile grecești ajung și pe țărmul Mării Negre." }),
  s("apus", "grecia-clasica", "Grecia clasică: Atena", -480, -336, { note: "Socrate, Platon, Aristotel; Partenonul. În aceeași vreme trăiau Ezra și Neemia." }),
  s("apus", "alexandru", "Alexandru cel Mare", -336, -323, { note: "A cucerit Persia, Egiptul și Iudeea. Limba greacă a devenit limba comună a lumii, cea în care s-a scris Noul Testament." }),
  s("apus", "seleucizi", "Seleucizii (Siria)", -312, -63),

  // Persia și Roma
  s("persia-roma", "persia", "Imperiul persan", -550, -330, { note: "Cirus a cucerit Babilonul (539) și i-a lăsat pe iudei să se întoarcă (Ezra 1). Darius, Xerxes (Ahașveroș din cartea Estera), Artaxerxe." }),
  s("persia-roma", "roma-regi", "Roma: regii", -753, -509, { approx: true }),
  s("persia-roma", "roma-rep", "Republica romană", -509, -27),
  s("persia-roma", "roma-imp", "Imperiul roman", -27, END, { note: "August (27 î.Hr.–14 d.Hr.) a dat porunca recensământului din Luca 2:1. Sub Tiberiu a început lucrarea Domnului Isus (Luca 3:1)." }),

  // Pe pământul nostru: întâi ce spune arheologia (culturile, numite după locul unde au fost găsite), apoi oamenii pomeniți în scris.
  s("noi", "bronz", "Epoca bronzului: Monteoru, Wietenberg, Otomani", -2000, -1500, { approx: true, note: "Sate de agricultori și păstori, cu cetăți pe dealuri, unelte și arme de bronz și podoabe din aurul Transilvaniei, ca pumnalele de aur de la Perșinari (Dâmbovița). Nu știm cum se numeau oamenii aceștia; arheologii le dau culturilor numele locului unde le-au găsit." }),
  s("noi", "bronz-tarziu", "Noua și Coslogeni", -1500, -1150, { approx: true, note: "Sfârșitul epocii bronzului, cu așezări de păstori de la Carpați până la Nistru și în Dobrogea." }),
  s("noi", "tracii", "Tracii din nord: epoca fierului", -1150, -650, { approx: true, note: "Odată cu fierul, arheologii văd aici aceeași lume de la Balcani la Carpați: tracii. Din ramura lor de la nordul Dunării se vor desprinde geții și dacii. Grecii vorbeau de traci ca de cel mai numeros neam după indieni (Herodot)." }),
  s("noi", "geto-dacii", "Geții și dacii", -650, END, { approx: true, note: "Grecii îi numeau geți, romanii daci; Strabon spune că e același neam și aceeași limbă. Se închinau lui Zalmoxis, despre care Herodot povestește că le învățase nemurirea sufletului (Herodot scrie despre el ca despre o tradiție, nu ca despre un fapt pe care l-a văzut)." }),
  s("noi", "colonii", "Histria, Tomis, Callatis", -657, -100, { approx: true, note: "Colonii grecești pe țărmul Dobrogei. Histria, întemeiată pe la 657 î.Hr., e cel mai vechi oraș atestat de pe pământul României." }),
  s("noi", "dromihete", "Dromihete", -300, -280, { approx: true, note: "Rege get din Câmpia Dunării. L-a învins și l-a prins pe Lisimah, unul dintre urmașii lui Alexandru, apoi l-a lăsat liber după un ospăț." }),
  s("noi", "burebista", "Burebista", -82, -44, { note: "A unit triburile geto-dacilor într-un stat mare, de la Dunărea de mijloc până la Marea Neagră, în aceeași vreme cu Iulius Cezar. Strabon scrie că marele preot Deceneu l-a ajutat să-i învețe pe daci ascultarea și cumpătarea, până acolo încât și-au tăiat viile." }),
  s("noi", "sarmizegetusa", "Cetățile din Munții Orăștiei", -100, END, { approx: true, note: "Sarmizegetusa Regia, Costești, Blidaru, Piatra Roșie: centrul statului dac, cu sanctuarul de la Sarmizegetusa. Aici se va da războiul cu romanii, după Hristos (101–106)." }),
];

export const MOMENTS: Moment[] = [
  { id: "chemarea", year: -2091, label: "Chemarea lui Avraam", refs: "Geneza 12:1–4", note: "Avraam avea 75 de ani când a plecat din Haran." },
  { id: "in-egipt", year: -1876, label: "Iacov coboară în Egipt", refs: "Geneza 46–47" },
  { id: "exodul", year: -1446, label: "Ieșirea din Egipt", refs: "Exodul 12–14; 1 Împărați 6:1", note: "Data vine din 1 Împărați 6:1 (480 de ani până la Templu). Mulți istorici o pun pe la 1260 î.Hr., în vremea lui Ramses al II-lea." },
  { id: "templul", year: -966, label: "Templul lui Solomon", refs: "1 Împărați 6" },
  { id: "imparte", year: -931, label: "Regatul se împarte", refs: "1 Împărați 12" },
  { id: "roma", year: -753, label: "Întemeierea Romei (după tradiție)", approx: true },
  { id: "samaria", year: -722, label: "Asirienii cuceresc Samaria", refs: "2 Împărați 17" },
  { id: "sanherib", year: -701, label: "Sanherib la porțile Ierusalimului", refs: "2 Împărați 18–19; Isaia 36–37" },
  { id: "daniel", year: -605, label: "Primii robi duși la Babilon (Daniel)", refs: "Daniel 1:1–6" },
  { id: "distrus", year: -586, label: "Ierusalimul și Templul distruse", refs: "2 Împărați 25; Plângerile lui Ieremia", note: "Unii socotesc 587 î.Hr." },
  { id: "cirus", year: -538, label: "Cirus îi lasă pe iudei să se întoarcă", refs: "Ezra 1; Isaia 44:28" },
  { id: "templul2", year: -515, label: "Templul al doilea e gata", refs: "Ezra 6:15" },
  { id: "darius-geti", year: -514, label: "Herodot: geții i se împotrivesc lui Darius", note: "Herodot îi numește pe geți „cei mai viteji și cei mai drepți dintre traci”. E prima știre scrisă despre strămoșii noștri." },
  { id: "alex-dunare", year: -335, label: "Alexandru trece Dunărea împotriva geților", note: "Arrian povestește că Alexandru cel Mare a trecut Dunărea într-o noapte, pe plute și bărci din trunchiuri, și a ars o cetate a geților. E una dintre cele mai vechi știri sigure despre geții de la nord de Dunăre." },
  { id: "neemia", year: -445, label: "Neemia rezidește zidurile", refs: "Neemia 2–6" },
  { id: "alexandru", year: -332, label: "Alexandru cel Mare ia Iudeea" },
  { id: "septuaginta", year: -250, label: "Septuaginta, la Alexandria", approx: true, note: "Prima traducere a Vechiului Testament, din ebraică în greacă. Pe ea o citau adesea apostolii." },
  { id: "hanuka", year: -164, label: "Macabeii curăță Templul", note: "Sărbătoarea înnoirii Templului (Hanuka), la care Domnul Isus a fost în Templu (Ioan 10:22)." },
  { id: "pompei", year: -63, label: "Pompei intră în Ierusalim" },
  { id: "nasterea", year: -5, label: "Nașterea Domnului Isus", approx: true, refs: "Matei 2; Luca 2", note: "Pe la 6–4 î.Hr. Numărătoarea anilor de după Hristos, făcută în secolul al VI-lea, a ieșit cu câțiva ani mai târziu." },
  { id: "crucea", year: 30, label: "Răstignirea și învierea", approx: true, refs: "Evangheliile; 1 Corinteni 15:3–8", note: "Pe la anul 30 (unii socotesc 33)." },
];

/** „586 î.Hr.” / „30 d.Hr.” */
export function yearText(y: number, approx = false): string {
  const t = y < 0 ? `${-y} î.Hr.` : `${y} d.Hr.`;
  return approx ? `c. ${t}` : t;
}

/** „931–913 î.Hr.” sau „5 î.Hr.–30 d.Hr.” */
export function spanText(a: number, b: number, approx = false): string {
  const c = approx ? "c. " : "";
  if (a < 0 && b < 0) return `${c}${-a}–${-b} î.Hr.`;
  if (a >= 0 && b >= 0) return `${c}${a}–${b} d.Hr.`;
  return `${c}${-a} î.Hr.–${b} d.Hr.`;
}

/**
 * Așază barele unui rând fără să se suprapună: fiecare bară intră pe primul sub-rând unde încape (cu o mică distanță).
 * Întoarce sub-rândul fiecărei bare și câte sub-rânduri are rândul.
 */
export function packLane(spans: Span[], gapYears = 2): { row: Map<string, number>; rows: number } {
  const ends: number[] = [];
  const row = new Map<string, number>();
  for (const sp of [...spans].sort((a, b) => a.from - b.from || b.to - a.to)) {
    let r = ends.findIndex((e) => e + gapYears <= sp.from);
    if (r < 0) { r = ends.length; ends.push(sp.to); } else ends[r] = sp.to;
    row.set(sp.id, r);
  }
  return { row, rows: Math.max(1, ends.length) };
}
