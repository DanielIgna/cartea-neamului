/**
 * „Istoria umanității” (fostul „Firul vremii”): o singură axă a anilor, de la primele orașe și primele scrieri (c. 3500 î.Hr.)
 * până azi. Pe ea stau, aliniate, marile civilizații (Mesopotamia, Egiptul, Europa veche, Persia și Roma, India și China,
 * Americile), lumea modernă cu ideile și descoperirile ei, Israelul vechi și creștinismul (după relatarea biblică și după
 * istorici) și pământul nostru, de la culturile din pământ la România de azi. Scris de mână; anii foarte vechi sunt
 * aproximativi. Pentru regii lui Iuda și ai lui Israel folosim cronologia lui Thiele, iar pentru patriarhi socoteala care ia
 * literal 1 Împărați 6:1 și Exodul 12:40; textul spune de fiecare dată când un lucru vine doar din relatarea biblică.
 * Anii înainte de anul 1 sunt numere negative (-586 = 586 î.Hr.).
 */

import { CHURCH_ERAS } from "./istoria-bisericii";
import { roBiserica } from "@/i18n/messages/biserica/ro";
import { roVremuri } from "@/i18n/messages/vremuri/ro";

export type LaneId = "mesopotamia" | "egipt" | "apus" | "persia-roma" | "asia" | "americi" | "moderna" | "israel" | "linia" | "iuda" | "nord" | "prooroci" | "biserica" | "puteri" | "noi" | "credinta-noi";

/** Grupurile de rânduri: lumea întreagă, Israelul vechi și creștinismul, pământul nostru (aceleași culori ca înainte). */
export const LANES: { id: LaneId; label: string; group: "biblia" | "lumea" | "noi" }[] = [
  { id: "mesopotamia", label: "Mesopotamia: Sumer, Babilon, Asiria", group: "lumea" },
  { id: "egipt", label: "Egiptul", group: "lumea" },
  { id: "apus", label: "Europa veche: Creta, Grecia, Asia Mică", group: "lumea" },
  { id: "persia-roma", label: "Persia, Roma, Bizanțul și califatul arab", group: "lumea" },
  { id: "asia", label: "India, China și stepa", group: "lumea" },
  { id: "americi", label: "Americile", group: "lumea" },
  { id: "moderna", label: "Europa și lumea modernă", group: "lumea" },
  { id: "israel", label: "Israelul vechi (după Biblie și istorici)", group: "biblia" },
  { id: "linia", label: "Genealogia lui Isus, după Biblie", group: "biblia" },
  { id: "iuda", label: "Regii lui Iuda (sud)", group: "biblia" },
  { id: "nord", label: "Regii lui Israel (nord)", group: "biblia" },
  { id: "prooroci", label: "Profeții evrei", group: "biblia" },
  { id: "biserica", label: "Creștinismul", group: "biblia" },
  { id: "puteri", label: "Stăpâniri și popoare din jurul nostru", group: "noi" },
  { id: "noi", label: "Pe pământul nostru", group: "noi" },
  { id: "credinta-noi", label: "Creștinismul pe pământul nostru", group: "noi" },
];

export type Span = {
  id: string;
  lane: LaneId;
  label: string;
  from: number;
  to: number;
  /** Anii sunt nesiguri (desenat cu margini estompate). */
  approx?: boolean;
  /** Pentru o legătură spre un arbore din pagina „Genealogii vechi” (id-ul persoanei de acolo). */
  person?: string;
  /** Legătură spre altă pagină din site (de ex. o epocă din „Libertatea de a crede”). */
  href?: string;
  note?: string;
  refs?: string;
};

export type Moment = { id: string; year: number; label: string; note?: string; refs?: string; approx?: boolean; href?: string };

/** Prima și ultima dată de pe axă. */
export const START = -3500;
export const END = 2030;

/** Ce bucată din axă se vede: lumea veche (până la anul 1), de la anul 1 până azi sau toată. */
export const WINDOWS = {
  inainte: { from: -3500, to: 40, label: "Lumea veche", jumps: [["Primele orașe", -3500], ["Piramidele", -2700], ["Hamurabi", -1900], ["Troia", -1300], ["Grecia", -800], ["Perșii", -560], ["Alexandru", -350], ["Roma", -120]] },
  dupa: { from: -60, to: 2030, label: "De la anul 1 până azi", lanes: ["persia-roma", "asia", "americi", "moderna", "biserica", "puteri", "noi", "credinta-noi"], jumps: [["Roma", -40], ["Dacia romană", 90], ["Constantin", 290], ["Islamul", 600], ["Ștefan cel Mare", 1400], ["Tiparul", 1430], ["Revoluțiile", 1750], ["Unirea", 1820], ["Azi", 1880]] },
  tot: { from: -3500, to: 2030, label: "Toată istoria", jumps: [["Sumer", -3500], ["Piramidele", -2700], ["David", -1040], ["Anul 1", -120], ["Dacia romană", 90], ["Tiparul", 1400], ["Azi", 1880]] },
} as const satisfies Record<string, { from: number; to: number; label: string; lanes?: readonly LaneId[]; jumps: readonly (readonly [string, number])[] }>;
export type WindowId = keyof typeof WINDOWS;

const s = (lane: LaneId, id: string, label: string, from: number, to: number, extra: Partial<Span> = {}): Span => ({ id, lane, label, from, to, ...extra });

export const SPANS: Span[] = [
  // Genealogia lui Isus, după Biblie (anii vieții, după socoteala textului ebraic)
  s("linia", "avraam", "Avraam", -2166, -1991, { person: "avraam", refs: "Geneza 12–25", note: "După Geneza, a plecat din Ur al Haldeilor și a trăit ca străin în Canaan. E socotit strămoșul evreilor și al arabilor, iar iudaismul, creștinismul și islamul îl pomenesc toate. Anii vin din socoteala care ia literal cifrele Bibliei; mulți istorici îl pun cu câteva secole mai târziu, iar alții se îndoiesc că se pot data." }),
  s("linia", "isaac", "Isaac", -2066, -1886, { person: "isaac", refs: "Geneza 21–35" }),
  s("linia", "iacov", "Iacov (Israel)", -2006, -1859, { person: "iacov", refs: "Geneza 25–50", note: "După Geneza, a coborât în Egipt la 130 de ani și a murit acolo la 147. Cei doisprezece fii ai lui dau numele celor douăsprezece seminții." }),
  s("linia", "iosif", "Iosif", -1915, -1805, { person: "iosif-eg", refs: "Geneza 37–50", note: "După Geneza, ajunge al doilea om din Egipt după faraon. Dacă socoteala e bună, a trăit în vremea Regatului Mijlociu egiptean; izvoarele egiptene nu-l pomenesc." }),
  s("linia", "moise", "Moise", -1526, -1406, { person: "moise", refs: "Exodul – Deuteronomul", note: "Din seminția lui Levi, nu din linia lui Isus. După Exodul, i-a scos pe evrei din Egipt și le-a dat Legea, cu cele Zece porunci, care au stat apoi la temelia multor legi din lume. 40 de ani la curtea faraonului, 40 în Madian, 40 în pustie." }),
  s("linia", "boaz", "Boaz și Rut", -1150, -1080, { approx: true, person: "boaz", refs: "Rut 1–4", note: "„Pe vremea judecătorilor” (Rut 1:1). Anii lor nu se cunosc; locul de pe axă e doar aproximativ." }),
  s("linia", "david", "David", -1040, -970, { person: "david", refs: "1 Samuel 16 – 1 Împărați 2" }),
  s("linia", "zorobabel", "Zorobabel", -570, -500, { approx: true, person: "zorobabel", refs: "Ezra 2–5; Hagai", note: "A condus întoarcerea din robie și rezidirea Templului." }),
  s("linia", "iosif-maria", "Iosif și Maria", -40, 20, { approx: true, person: "iosif", refs: "Matei 1–2; Luca 1–2" }),
  s("linia", "isus", "Isus din Nazaret", -5, 30, { approx: true, person: "isus", refs: "Evangheliile; Tacit, Anale 15.44; Iosif Flaviu", note: "Născut pe la 6–4 î.Hr., sub Irod cel Mare, și răstignit sub Ponțiu Pilat pe la anul 30 (unii socotesc 33). Istoricii romani și iudei îl pomenesc, iar ucenicii lui au vestit că a înviat. De la nașterea lui numără lumea anii." }),

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
  s("israel", "roma", "Sub romani", -63, 70, { note: "Pompei intră în Ierusalim în 63 î.Hr. Irod cel Mare domnește între 37 și 4 î.Hr. și mărește Templul. În anul 70 romanii distrug Ierusalimul și Templul; din el a rămas doar zidul de apus, „Zidul Plângerii”." }),

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
  s("prooroci", "iona", "Iona", -790, -770, { approx: true, refs: "Iona; 2 Împărați 14:25", note: "După cartea lui, trimis să vestească în Ninive, capitala asirienilor." }),
  s("prooroci", "amos", "Amos", -765, -750, { approx: true }),
  s("prooroci", "osea", "Osea", -755, -715, { approx: true }),
  s("prooroci", "isaia", "Isaia", -740, -681, { approx: true, refs: "Isaia 1:1; 6:1" }),
  s("prooroci", "mica", "Mica", -735, -700, { approx: true, refs: "Mica 5:2", note: "Profet de la țară, care a luat apărarea celor săraci. Tot el a scris că din Betleem va ieși „Stăpânitorul lui Israel”." }),
  s("prooroci", "ieremia", "Ieremia", -627, -580, { approx: true }),
  s("prooroci", "daniel", "Daniel", -605, -536, { approx: true, refs: "Daniel 1:1; 10:1", note: "Dus la Babilon de tânăr, a slujit sub babilonieni și sub perși." }),
  s("prooroci", "ezechiel", "Ezechiel", -593, -571, { approx: true }),
  s("prooroci", "hagai", "Hagai și Zaharia", -520, -518, { refs: "Hagai 1:1; Zaharia 1:1" }),
  s("prooroci", "maleahi", "Maleahi", -440, -420, { approx: true, note: "Ultimul profet al Bibliei ebraice, în ordinea creștină a cărților. Urmează aproape 400 de ani fără profet, până la Ioan Botezătorul." }),
  s("prooroci", "ioan", "Ioan Botezătorul", -5, 29, { approx: true, refs: "Luca 1; 3; Matei 3", note: "Rudă cu Isus, cu șase luni mai mare, după Luca. Îl pomenește și istoricul iudeu Iosif Flaviu, care scrie că Irod Antipa l-a omorât." }),

  // Egiptul
  s("egipt", "eg-mijlociu", "Regatul Mijlociu", -2050, -1650, { approx: true }),
  s("egipt", "hicsosi", "Hicsoșii", -1650, -1550, { approx: true, note: "Stăpânitori veniți din Canaan și Siria, care au domnit în nordul Egiptului." }),
  s("egipt", "eg-nou", "Regatul Nou: Tutmes, Ramses", -1550, -1070, { approx: true, note: "Vremea marilor faraoni. Stela lui Merneptah (c. 1208 î.Hr.) e cea mai veche pomenire a lui Israel în afara Bibliei." }),
  s("egipt", "eg-tarziu", "Egiptul slăbit", -1070, -525, { approx: true, note: "Faraonul Șișac (Șoșenc I) a jefuit Ierusalimul în vremea lui Roboam (1 Împărați 14:25); Neco l-a ucis pe Iosia la Meghido (609)." }),
  s("egipt", "eg-persan", "Sub perși", -525, -332),
  s("egipt", "ptolemei", "Ptolemeii", -305, -30, { note: "Urmașii unui general al lui Alexandru. La Alexandria s-a tradus Vechiul Testament în grecește (Septuaginta). Ultima a fost Cleopatra." }),

  // Mesopotamia
  s("mesopotamia", "ur", "Ur", -2112, -2004, { approx: true, note: "Unul dintre cele mai bogate orașe ale lumii, cu ziggurat și școli de scribi. După Geneza 11:31, de aici a plecat Avraam." }),
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
  s("persia-roma", "roma-imp", "Imperiul roman", -27, 476, { note: "Cel mai mare stat al Antichității, de la Britania la Eufrat, cu drumuri, legi și limba latină. August (27 î.Hr.–14 d.Hr.) e împăratul recensământului din Luca 2:1; sub Tiberiu a început Isus să învețe (Luca 3:1). Jumătatea de apus cade în 476." }),

  // Lumea veche: primele orașe, scrisul, piramidele (anii foarte vechi sunt aproximativi).
  s("mesopotamia", "sumer", "Sumerienii: primele orașe și scrisul", -3500, -2334, { approx: true, note: "Uruk, Ur, Lagaș: cele mai vechi orașe cunoscute. Sumerienii au inventat scrisul cuneiform (c. 3200 î.Hr.), au folosit roata și au împărțit ora în 60 de minute; de la ei avem și Epopeea lui Ghilgameș, cea mai veche poveste scrisă." }),
  s("mesopotamia", "akkad", "Imperiul akkadian: Sargon", -2334, -2154, { approx: true, note: "Sargon din Akkad unește orașele Mesopotamiei: primul imperiu cunoscut din istorie." }),
  s("egipt", "eg-timpuriu", "Egiptul unit: primii faraoni", -3100, -2686, { approx: true, note: "Pe la 3100 î.Hr., Egiptul de Sus și cel de Jos se unesc sub un singur rege. Apar hieroglifele și calendarul de 365 de zile." }),
  s("egipt", "eg-vechi", "Regatul Vechi: piramidele", -2686, -2181, { approx: true, note: "Vremea piramidelor. Marea Piramidă a lui Keops, de la Gizeh (c. 2560 î.Hr.), a rămas aproape 4000 de ani cea mai înaltă construcție din lume." }),
  s("apus", "minoici", "Creta minoică", -2700, -1450, { approx: true, note: "Palatul de la Knossos, cu fresce, apă curentă și o scriere încă nedescifrată (Linear A). Prima mare civilizație a Europei." }),
  s("apus", "micenieni", "Micenienii", -1600, -1100, { approx: true, note: "Grecii epocii bronzului, cu cetăți ca Micene și Pylos: lumea pe care o cântă mai târziu Homer, în Iliada și Odiseea." }),
  s("asia", "indus", "Civilizația Indusului", -2600, -1900, { approx: true, note: "Harappa și Mohenjo-daro, în Pakistanul de azi: orașe cu străzi drepte, canalizare și băi publice, cu o scriere pe care nimeni n-a reușit încă s-o citească." }),
  s("asia", "shang", "China: dinastia Shang", -1600, -1046, { approx: true, note: "Primele scrieri chinezești, pe oase și carapace de broască țestoasă, folosite la ghicit. Scrierea chineză de azi coboară din ele." }),
  s("asia", "zhou", "China: dinastia Zhou", -1046, -256, { note: "Cea mai lungă dinastie a Chinei. În vremea ei au trăit Confucius și Lao Zi." }),
  s("asia", "maurya", "India: Imperiul Maurya", -322, -185, { note: "Primul mare stat al Indiei. Împăratul Așoka, îngrozit de războaiele lui, a scris pe stâlpi de piatră îndemnuri la blândețe și a răspândit budismul." }),
  s("asia", "han", "China unită: Qin și Han", -221, 220, { note: "Qin Shi Huang unește China în 221 î.Hr. și începe Marele Zid; în mormântul lui stă armata de teracotă. Sub Han se deschide Drumul Mătăsii, iar pe la anul 105 se inventează hârtia." }),
  s("asia", "tang", "China: Tang", 618, 907, { note: "Epoca de aur a Chinei: poezie, porțelan, tipar cu plăci de lemn." }),
  s("asia", "song", "China: Song", 960, 1279, { note: "Busola, praful de pușcă și tiparul cu litere mobile apar în China cu secole înaintea Europei." }),
  s("asia", "mongoli", "Imperiul mongol", 1206, 1368, { note: "Ginghis Han și urmașii lui clădesc cel mai mare imperiu de uscat din istorie, din Coreea până în Ungaria. Marea invazie din 1241 a trecut și prin Transilvania și Moldova." }),
  s("asia", "ming", "China: Ming", 1368, 1644, { note: "Orașul Interzis din Beijing și marile călătorii pe mare ale amiralului Zheng He." }),
  s("asia", "moguli", "India: Imperiul Mogul", 1526, 1857, { note: "Taj Mahal, ridicat de Șah Jahan în amintirea soției lui (c. 1632–1653)." }),
  s("asia", "qing", "China: Qing", 1644, 1912, { note: "Ultima dinastie a Chinei; în 1912 China devine republică." }),
  s("americi", "caral", "Caral, în Peru", -2600, -2000, { approx: true, note: "Cel mai vechi oraș cunoscut din Americi, cu piramide de piatră, din aceeași vreme cu piramidele Egiptului." }),
  s("americi", "olmeci", "Olmecii", -1200, -400, { approx: true, note: "Prima mare civilizație a Mexicului, cunoscută pentru capetele uriașe sculptate în piatră." }),
  s("americi", "maya", "Maya", 250, 900, { approx: true, note: "Orașe cu piramide în junglă, un calendar foarte precis și singura scriere deplină din Americile de dinainte de Columb. Au folosit cifra zero." }),
  s("americi", "azteci", "Aztecii", 1325, 1521, { note: "Capitala Tenochtitlan, pe un lac, avea mai mulți locuitori decât orice oraș din Europa. Cucerită de spanioli în 1521." }),
  s("americi", "incasi", "Incașii", 1438, 1533, { note: "Un imperiu în Anzi, cu 40.000 de kilometri de drumuri, fără roată și fără scriere; socoteau cu noduri pe sfori. Machu Picchu e de la ei." }),
  s("americi", "sua", "Statele Unite ale Americii", 1776, END, { note: "Declarația de independență din 1776 și Constituția din 1787, cea mai veche constituție scrisă încă în vigoare." }),
  s("persia-roma", "califat", "Califatul arab", 632, 1258, { note: "După Mahomed, arabii cuceresc din Spania până în India. La Bagdad se traduc cărțile grecilor, iar de la ei avem cifrele „arabe” (venite din India) și algebra." }),
  s("moderna", "carol", "Imperiul lui Carol cel Mare", 768, 888, { note: "Carol cel Mare, încoronat împărat la Roma în anul 800, adună sub o singură stăpânire Franța, Germania și Italia de azi. E socotit „părintele Europei”." }),
  s("moderna", "cruciadele", "Cruciadele", 1096, 1291, { note: "Războaie purtate de cavalerii Apusului pentru Ierusalim. Au adus suferință multă, dar și legături noi între Europa și Orient." }),
  s("moderna", "renasterea", "Renașterea", 1400, 1600, { note: "Leonardo da Vinci, Michelangelo, Rafael: Europa redescoperă arta și știința Antichității și pune omul în centrul atenției." }),
  s("moderna", "descoperiri", "Marile descoperiri geografice", 1450, 1600, { note: "Corăbiile portugheze și spaniole ocolesc Africa, ajung în America și fac înconjurul lumii. Harta lumii se schimbă pentru totdeauna." }),
  s("moderna", "reforma", "Reforma și războaiele religioase", 1517, 1648, { note: "Luther, Calvin și alții cer întoarcerea la textul Bibliei; Europa apuseană se împarte între catolici și protestanți. Pacea din 1648 încheie Războiul de Treizeci de Ani." }),
  s("moderna", "stiinta", "Revoluția științifică", 1543, 1687, { note: "De la Copernic (Pământul se învârte în jurul Soarelui) la Galilei, Kepler și Newton (legile mișcării și gravitația)." }),
  s("moderna", "iluminismul", "Iluminismul", 1685, 1815, { note: "Încrederea în rațiune, drepturile omului și separația puterilor în stat. Din ideile lui pornesc Revoluția americană și cea franceză." }),
  s("moderna", "industriala", "Revoluția industrială", 1760, 1900, { note: "Mașina cu aburi, fabricile, căile ferate, telegraful. Pentru prima dată, cei mai mulți oameni încep să trăiască la oraș." }),
  s("moderna", "ww1", "Primul Război Mondial", 1914, 1918, { note: "Aproape 20 de milioane de morți. La sfârșitul lui cad marile imperii, iar România se unește în 1918." }),
  s("moderna", "ww2", "Al Doilea Război Mondial", 1939, 1945, { note: "Cel mai mare război din istorie, cu peste 60 de milioane de morți, Holocaustul și bombele atomice. După el se înființează ONU." }),
  s("moderna", "razboiul-rece", "Războiul rece", 1947, 1991, { note: "Lumea împărțită între Apus și blocul sovietic, cu Cortina de fier prin mijlocul Europei. România e de partea comunistă până în 1989." }),
  s("moderna", "digitala", "Era digitală", 1970, END, { note: "Calculatorul personal, internetul, telefonul mobil: în câteva decenii, aproape toată lumea se leagă într-o singură rețea." }),
  s("noi", "cucuteni", "Cucuteni (sfârșitul)", -3500, -3000, { approx: true, note: "Una dintre cele mai frumoase culturi neolitice ale Europei, cu vase pictate în spirale și sate mari, în Moldova și Ucraina de azi. Începuse cu peste o mie de ani mai devreme; înainte de ea, în Dobrogea, cultura Hamangia ne-a lăsat „Gânditorul”." }),

  // Pe pământul nostru: întâi ce spune arheologia (culturile, numite după locul unde au fost găsite), apoi oamenii pomeniți în scris.
  s("noi", "bronz", "Epoca bronzului: Monteoru, Wietenberg, Otomani", -2000, -1500, { approx: true, note: "Sate de agricultori și păstori, cu cetăți pe dealuri, unelte și arme de bronz și podoabe din aurul Transilvaniei, ca pumnalele de aur de la Perșinari (Dâmbovița). Nu știm cum se numeau oamenii aceștia; arheologii le dau culturilor numele locului unde le-au găsit." }),
  s("noi", "bronz-tarziu", "Noua și Coslogeni", -1500, -1150, { approx: true, note: "Sfârșitul epocii bronzului, cu așezări de păstori de la Carpați până la Nistru și în Dobrogea." }),
  s("noi", "tracii", "Tracii din nord: epoca fierului", -1150, -650, { approx: true, note: "Odată cu fierul, arheologii văd aici aceeași lume de la Balcani la Carpați: tracii. Din ramura lor de la nordul Dunării se vor desprinde geții și dacii. Grecii vorbeau de traci ca de cel mai numeros neam după indieni (Herodot)." }),
  s("noi", "geto-dacii", "Geții și dacii", -650, 106, { approx: true, note: "Grecii îi numeau geți, romanii daci; Strabon spune că e același neam și aceeași limbă. Se închinau lui Zalmoxis, despre care Herodot povestește că le învățase nemurirea sufletului (Herodot scrie despre el ca despre o tradiție, nu ca despre un fapt pe care l-a văzut)." }),
  s("noi", "colonii", "Histria, Tomis, Callatis", -657, -100, { approx: true, note: "Colonii grecești pe țărmul Dobrogei. Histria, întemeiată pe la 657 î.Hr., e cel mai vechi oraș atestat de pe pământul României." }),
  s("noi", "dromihete", "Dromihete", -300, -280, { approx: true, note: "Rege get din Câmpia Dunării. L-a învins și l-a prins pe Lisimah, unul dintre urmașii lui Alexandru, apoi l-a lăsat liber după un ospăț." }),
  s("noi", "burebista", "Burebista", -82, -44, { note: "A unit triburile geto-dacilor într-un stat mare, de la Dunărea de mijloc până la Marea Neagră, în aceeași vreme cu Iulius Cezar. Strabon scrie că marele preot Deceneu l-a ajutat să-i învețe pe daci ascultarea și cumpătarea, până acolo încât și-au tăiat viile." }),
  s("noi", "sarmizegetusa", "Cetățile din Munții Orăștiei", -100, 106, { approx: true, note: "Sarmizegetusa Regia, Costești, Blidaru, Piatra Roșie: centrul statului dac, cu sanctuarul de la Sarmizegetusa. Aici se va da războiul cu romanii, în anii 101–106." }),

  // ——— De la anul 1 ———
  // Creștinismul: epocile din „Libertatea de a crede”, cu numele de acolo și legătură spre ele.
  ...CHURCH_ERAS.map((e) => s("biserica", `b-${e.id}`, roBiserica.Church.eras[e.id as keyof typeof roBiserica.Church.eras].name, e.from, Math.min(e.to, END), {
    href: `/libertatea-de-a-crede#${e.id}`, note: roBiserica.Church.eras[e.id as keyof typeof roBiserica.Church.eras].intro,
  })),

  s("persia-roma", "bizant", "Imperiul bizantin", 330, 1453, { note: "Jumătatea de răsărit a Imperiului roman, cu capitala la Constantinopol. A ținut Dobrogea până pe la anul 600 și, din nou, în secolele X–XII. De la Bizanț au venit la noi rânduiala Bisericii și multe cuvinte." }),
  s("puteri", "migratii", "Popoarele migratoare", 271, 1241, { approx: true, note: "Goți, huni, gepizi, avari, slavi, bulgari, unguri, pecenegi, cumani și, în 1241, tătarii. Au trecut sau au stăpânit pe rând pe pământul nostru; slavii au lăsat multe cuvinte în limba română." }),
  s("puteri", "ungaria", "Regatul Ungariei", 1000, 1526, { approx: true, note: "Ardealul a intrat treptat în Regatul Ungariei, ca voievodat cu conducere a lui." }),
  s("puteri", "otomani", "Imperiul otoman", 1299, 1922, { note: "Țara Românească și Moldova au plătit tribut turcilor secole la rând, dar și-au păstrat domnii, legile și Biserica." }),
  s("puteri", "habsburgi", "Habsburgii, apoi Austro-Ungaria", 1526, 1918, { note: "Au stăpânit Ardealul din 1699 și Bucovina din 1775; din 1867 Ardealul a fost dat Ungariei, în Austro-Ungaria." }),
  s("puteri", "rusia", "Rusia, apoi Uniunea Sovietică", 1721, 1991, { note: "A luat Basarabia în 1812, iar după 1944 a ținut România sub influența ei până la căderea comunismului." }),

  s("noi", "decebal", "Decebal", 87, 106, { note: "Ultimul rege al dacilor. După două războaie (101–102 și 105–106), împăratul Traian a cucerit Sarmizegetusa; Decebal și-a luat viața ca să nu fie dus prizonier la Roma. Columna lui Traian, la Roma, povestește războaiele în piatră." }),
  s("noi", "dobrogea-romana", "Dobrogea romană și bizantină", 46, 600, { approx: true, note: "Dobrogea a intrat sub Roma înaintea Daciei și a rămas romană, apoi bizantină, până pe la anul 600. Monumentul de la Adamclisi (Tropaeum Traiani, 109) sărbătorea biruința lui Traian." }),
  s("noi", "dacia-romana", "Dacia romană", 106, 271, { note: "Coloniști din tot imperiul, drumuri, orașe ca Ulpia Traiana Sarmizegetusa, Apulum (Alba Iulia), Napoca (Cluj), Porolissum. Latina devine limba vorbită." }),
  s("noi", "etnogeneza", "Se naște poporul român", 106, 800, { approx: true, note: "Din dacii romanizați și din coloniștii romani se naște un popor cu limbă latină, pe ambele maluri ale Dunării. Istoricii încă discută unde anume și cum a decurs, pentru că din aceste secole s-au păstrat puține scrieri." }),
  s("noi", "transilvania", "Voievodatul, apoi Principatul Transilvaniei", 1000, 1699, { approx: true }),
  s("noi", "tara-romaneasca", "Țara Românească", 1330, 1859, { note: "Basarab I câștigă la Posada (1330) independența față de Ungaria. Mircea cel Bătrân, Vlad Țepeș, Neagoe Basarab, Mihai Viteazul, Constantin Brâncoveanu." }),
  s("noi", "moldova", "Moldova", 1359, 1859, { note: "Bogdan I întemeiază Moldova neatârnată (1359). Alexandru cel Bun, Ștefan cel Mare, Petru Rareș, Vasile Lupu, Dimitrie Cantemir." }),
  s("noi", "stefan", "Ștefan cel Mare", 1457, 1504, { note: "47 de ani de domnie în Moldova; a apărat țara de turci și a zidit biserici și mănăstiri, ca Putna și Voroneț." }),
  s("noi", "mihai", "Mihai Viteazul", 1593, 1601),
  s("noi", "romania", "România", 1859, END, { note: "Unirea Principatelor (1859), independența (1877), regatul (1881), Marea Unire (1918), comunismul (1947–1989), Uniunea Europeană (2007)." }),

  s("credinta-noi", "andrei", "Apostolul Andrei (tradiție)", 50, 70, { approx: true, href: "/libertatea-de-a-crede#apostoli", note: "O tradiție veche, păstrată de Eusebiu după Origen, spune că lui Andrei i-a revenit Sciția; mulți o leagă de Dobrogea de azi. E o tradiție, nu un lucru dovedit, dar arată cât de devreme a ajuns creștinismul la gurile Dunării." }),
  s("credinta-noi", "crestini-dacia", "Primii creștini daco-romani", 150, 400, { approx: true, note: "Creștinismul a venit odată cu soldații, negustorii și coloniștii din imperiu. Românii n-au fost botezați la o dată anume, de un rege, ci s-au făcut creștini odată cu nașterea lor ca popor; de aceea cuvintele de bază ale credinței vin din latină: Dumnezeu, cruce, biserică, creștin, a boteza, Paște, rugăciune." }),
  s("credinta-noi", "martirii", "Martirii din Dobrogea", 290, 311, { href: "/libertatea-de-a-crede#roma", note: "Epictet și Astion la Halmyris, lângă Murighiol, și martirii ale căror moaște s-au găsit în cripta de la Niculițel (Tulcea), din vremea marii prigoane." }),
  s("credinta-noi", "tomis", "Episcopia de Tomis", 369, 600, { approx: true, note: "La Tomis (Constanța) sunt pomeniți episcopi din secolul al IV-lea, ca Bretanion și Teotim, cu biserici ale căror ruine se văd și azi în Dobrogea." }),
  s("credinta-noi", "slavona", "Slujba în slavonă", 900, 1650, { approx: true, note: "După creștinarea bulgarilor (864), slujba la românii de la nord de Dunăre s-a ținut secole la rând în slavonă, o limbă pe care poporul n-o înțelegea. Abia din secolul al XVI-lea încep cărțile în românește." }),
  s("credinta-noi", "coresi", "Coresi tipărește în românește", 1559, 1582, { href: "/libertatea-de-a-crede#reforma", note: "Diaconul Coresi, la Brașov, tipărește primele cărți în limba română: Evanghelia, Faptele Apostolilor, Psaltirea. Din graiul lor se va naște româna literară." }),
  s("credinta-noi", "oastea", "Oastea Domnului", 1923, 1948, { href: "/libertatea-de-a-crede#secolul-xx", note: "Mișcare pornită de preotul Iosif Trifa la Sibiu, care a adunat sute de mii de țărani în jurul citirii Bibliei și al unei vieți curate, fără băutură. Comuniștii au interzis-o în 1948." }),
  s("credinta-noi", "prigoana", "Prigoana comunistă", 1948, 1989, { href: "/libertatea-de-a-crede#secolul-xx", note: "Închisori pentru preoți, pastori și credincioși de toate confesiunile: Aiud, Gherla, Pitești, Canalul. Richard Wurmbrand, Traian Dorz, Nicolae Moldoveanu și mulți alții." }),
  s("credinta-noi", "libertatea", "Libertatea credinței", 1990, END, { href: "/libertatea-de-a-crede#azi" }),
];

/** Evenimente din istoria românilor care există deja în „Povestea vremurilor” din arbore: textul lor e cel de acolo. */
const v = (id: keyof typeof roVremuri.Vremuri.events, year: number, label: string): Moment => ({ id: `v-${id}`, year, label, note: roVremuri.Vremuri.events[id] });

export const MOMENTS: Moment[] = [
  { id: "scrisul", year: -3200, label: "Primele scrieri", approx: true, note: "În Sumer și în Egipt, aproape în același timp. Odată cu scrisul începe „istoria” propriu-zisă; ce a fost înainte știm doar din ce se găsește în pământ." },
  { id: "piramida", year: -2560, label: "Marea Piramidă de la Gizeh", approx: true },
  { id: "stonehenge", year: -2500, label: "Stonehenge", approx: true, note: "Cercul de pietre uriașe din Anglia, ridicat în mai multe etape, aliniat cu răsăritul soarelui la solstițiu." },
  { id: "hamurabi", year: -1754, label: "Codul lui Hamurabi", approx: true, note: "282 de legi săpate pe o stelă de piatră, aflată azi la Luvru: „ochi pentru ochi”, prețuri, salarii, căsătorie." },
  { id: "troia", year: -1180, label: "Căderea Troiei (după tradiție)", approx: true, note: "Arheologii au găsit Troia în Turcia de azi, distrusă de mai multe ori; războiul cântat de Homer e o amintire a acestei lumi, nu o cronică." },
  { id: "alfabet", year: -1050, label: "Alfabetul fenician", approx: true, note: "Primul alfabet cu puține semne, câte unul pentru fiecare sunet. Din el vin alfabetul grecesc, cel latin (cu care scriem noi) și cel ebraic." },
  { id: "olimpiada", year: -776, label: "Primele Jocuri Olimpice" },
  { id: "buddha", year: -500, label: "Buddha, Confucius, primii filozofi greci", approx: true, note: "În același veac, în India, China și Grecia, oamenii încep să se întrebe ce e binele, ce e adevărul și cum să trăiască." },
  { id: "democratia", year: -508, label: "Democrația la Atena" },
  { id: "eratostene", year: -240, label: "Eratostene măsoară Pământul", approx: true, note: "Din umbra soarelui în două orașe din Egipt, a socotit circumferința Pământului cu o greșeală mică. Știa, ca toți învățații greci, că Pământul e rotund." },
  { id: "cezar", year: -44, label: "Iulius Cezar e ucis" },
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
  { id: "hanuka", year: -164, label: "Macabeii curăță Templul", note: "De aici vine Hanuka, sărbătoarea luminilor, ținută de evrei și azi." },
  { id: "pompei", year: -63, label: "Pompei intră în Ierusalim" },
  { id: "nasterea", year: -5, label: "Nașterea lui Isus din Nazaret", approx: true, refs: "Matei 2; Luca 2", note: "Pe la 6–4 î.Hr. Numărătoarea anilor pe care o folosește azi toată lumea pornește de la nașterea lui, dar cel care a făcut-o, în secolul al VI-lea, a pus-o cu câțiva ani prea târziu." },
  { id: "crucea", year: 30, label: "Răstignirea lui Isus", approx: true, refs: "Evangheliile; Tacit, Anale 15.44; 1 Corinteni 15:3–8", note: "Pe la anul 30 (unii socotesc 33), sub Ponțiu Pilat. Ucenicii lui au început curând să vestească, la Ierusalim, că a înviat; de aici pornește creștinismul." },

  // ——— De la anul 1 ———
  { id: "rusalii", year: 31, label: "Prima comunitate creștină, la Ierusalim", approx: true, refs: "Faptele Apostolilor 2", note: "După Faptele Apostolilor, la Rusalii se botează la Ierusalim aproape trei mii de oameni. Așa începe prima comunitate creștină." },
  { id: "pavel", year: 46, label: "Pavel pornește în călătoriile lui", approx: true, refs: "Faptele Apostolilor 13–28", note: "În trei călătorii, Pavel duce învățătura creștină în Asia Mică, Macedonia și Grecia, apoi ajunge la Roma. Scrisorile lui sunt printre cele mai vechi texte creștine." },
  { id: "nero", year: 64, label: "Prigoana lui Nero", href: "/libertatea-de-a-crede#apostoli" },
  { id: "templul-70", year: 70, label: "Romanii distrug Templul" },
  { id: "traian", year: 106, label: "Traian cucerește Dacia" },
  { id: "aurelian", year: 271, label: "Romanii părăsesc Dacia", approx: true, note: "Împăratul Aurelian retrage armata și conducerea la sud de Dunăre. Mare parte din populația romanizată rămâne pe loc." },
  { id: "milano", year: 313, label: "Edictul de la Milano", href: "/libertatea-de-a-crede#evul-mediu", note: "Constantin cel Mare și Liciniu dau libertate creștinilor în tot imperiul." },
  { id: "niceea", year: 325, label: "Sinodul de la Niceea", note: "Constantin cel Mare îi adună pe episcopii din tot imperiul. De aici vine Crezul rostit și azi în biserici." },
  { id: "sava", year: 372, label: "Sava Gotul, martir la Buzău", href: "/libertatea-de-a-crede#roma" },
  { id: "biertan", year: 350, label: "Donariul de la Biertan", approx: true, note: "O tăbliță de bronz cu un monogram creștin și cuvintele „Ego Zenovius votum posui” („Eu, Zenovie, am pus darul acesta”), găsită lângă Mediaș: un semn al creștinilor din Transilvania de după romani." },
  { id: "roma-cade", year: 476, label: "Cade Roma de apus" },
  { id: "dionisie", year: 525, label: "Dionisie cel Mic: numărătoarea anilor", note: "Călugăr învățat din Sciția Mică, adică din Dobrogea de azi. El a propus numărătoarea anilor pe care o folosește azi toată lumea, de la nașterea lui Isus, pe care a pus-o cu câțiva ani prea târziu. Un dobrogean a dat lumii calendarul." },
  { id: "bulgari", year: 864, label: "Creștinarea bulgarilor", note: "De la ei a venit la noi slujba în slavonă." },
  { id: "schisma", year: 1054, label: "Marea Schismă: Răsăritul și Apusul se despart" },
  { id: "tatari", year: 1241, label: "Marea invazie a tătarilor" },
  { id: "posada", year: 1330, label: "Basarab I la Posada" },
  { id: "mitropolia", year: 1359, label: "Mitropolia Țării Românești", note: "Recunoscută de Patriarhia de la Constantinopol în același an în care se întemeia Moldova. Biserica a fost, secole la rând, și școala, și cancelaria țării." },
  { id: "constantinopol", year: 1453, label: "Turcii cuceresc Constantinopolul" },
  { id: "luther", year: 1517, label: "Luther și Reforma", href: "/libertatea-de-a-crede#reforma" },
  v("1600-mihai-viteazul", 1600, "Mihai Viteazul unește cele trei țări"),
  { id: "nt-1648", year: 1648, label: "Noul Testament de la Bălgrad", href: "/libertatea-de-a-crede#biblia" },
  { id: "biblia-1688", year: 1688, label: "Biblia de la București", href: "/libertatea-de-a-crede#biblia", note: "Prima Biblie întreagă în limba română, tipărită în vremea lui Șerban Cantacuzino, terminată sub Constantin Brâncoveanu." },
  { id: "brancoveanu", year: 1714, label: "Martiriul Brâncovenilor", href: "/libertatea-de-a-crede#trezire" },
  v("1821-revolutia-tudor", 1821, "Tudor Vladimirescu"),
  v("1848-revolutia-adunarea", 1848, "Revoluția de la 1848"),
  v("1859-unirea-principatelor", 1859, "Unirea Principatelor"),
  v("1877-razboiul-independenta", 1877, "Războiul de Independență"),
  v("1918-unire-basarabia", 1918, "Marea Unire"),
  { id: "cornilescu", year: 1921, label: "Biblia Cornilescu", href: "/libertatea-de-a-crede#biblia" },
  v("1947-regele-mihai", 1947, "Regele Mihai e silit să abdice"),
  v("1989-revolutia-timisoara", 1989, "Revoluția"),
  v("2007-romania-uniunea", 2007, "România în Uniunea Europeană"),
  { id: "hartia", year: 105, label: "Hârtia, în China", approx: true },
  { id: "islamul", year: 622, label: "Hegira: începutul islamului", note: "Mahomed pleacă din Mecca la Medina; de aici numără musulmanii anii." },
  { id: "carol-imparat", year: 800, label: "Carol cel Mare, împărat" },
  { id: "magna-carta", year: 1215, label: "Magna Carta", note: "Regele Angliei acceptă în scris că și el e sub lege. Un început al drepturilor pe care le avem azi." },
  { id: "ciuma", year: 1347, label: "Ciuma neagră", note: "În câțiva ani moare cam o treime din populația Europei." },
  { id: "tiparul", year: 1450, label: "Tiparul lui Gutenberg", approx: true, note: "Cartea nu mai e copiată de mână. În câteva zeci de ani se tipăresc milioane de cărți, iar cititul ajunge la tot mai mulți oameni." },
  { id: "columb", year: 1492, label: "Columb ajunge în America" },
  { id: "magellan", year: 1522, label: "Prima călătorie în jurul lumii", note: "Corabia Victoria, din flota lui Magellan, se întoarce în Spania după trei ani. Din 270 de oameni, s-au întors 18." },
  { id: "copernic", year: 1543, label: "Copernic: Pământul se învârte în jurul Soarelui" },
  { id: "newton", year: 1687, label: "Newton: gravitația", note: "Aceleași legi mișcă mărul care cade și Luna de pe cer." },
  { id: "revolutia-franceza", year: 1789, label: "Revoluția franceză", note: "„Libertate, egalitate, fraternitate” și Declarația drepturilor omului și ale cetățeanului." },
  { id: "vaccin", year: 1796, label: "Primul vaccin (Jenner)", note: "Edward Jenner apără un copil de variolă cu un vaccin. Variola, care omorâse sute de milioane de oameni, a dispărut de pe Pământ în 1980." },
  { id: "becul", year: 1879, label: "Becul electric", note: "Edison face un bec care ține sute de ore. În câteva decenii, electricitatea schimbă casele, fabricile și orașele." },
  { id: "avionul", year: 1903, label: "Primul zbor cu avionul (frații Wright)" },
  { id: "vuia", year: 1906, label: "Traian Vuia zboară la Paris", note: "Inginerul bănățean ridică de la sol un aparat mai greu decât aerul, cu mijloacele lui, fără catapultă." },
  { id: "paulescu", year: 1921, label: "Nicolae Paulescu: hormonul insulinei", note: "Fiziologul român descrie „pancreina”, hormonul care scade zahărul din sânge, cu puțin înaintea echipei din Canada care a primit Nobelul pentru insulină." },
  { id: "penicilina", year: 1928, label: "Penicilina (Fleming)", note: "Primul antibiotic. De atunci, o rană infectată sau o pneumonie nu mai înseamnă de cele mai multe ori moartea." },
  { id: "onu", year: 1945, label: "Se înființează ONU" },
  { id: "adn", year: 1953, label: "Structura ADN-ului", note: "Watson și Crick, cu imaginile Rosalindei Franklin, arată cum arată „cartea” în care stă scrisă moștenirea fiecărui om." },
  { id: "sputnik", year: 1957, label: "Sputnik, primul satelit" },
  { id: "luna", year: 1969, label: "Primii oameni pe Lună", note: "Neil Armstrong și Buzz Aldrin, cu Apollo 11. Din ce au văzut de acolo, Pământul arăta ca o bilă albastră în întuneric." },
  { id: "zidul-berlin", year: 1989, label: "Cade Zidul Berlinului" },
  { id: "web", year: 1991, label: "World Wide Web", note: "Tim Berners-Lee face publice paginile legate între ele: internetul devine al tuturor." },
  { id: "genomul", year: 2003, label: "Genomul uman, citit în întregime" },
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
export function packLane(spans: Span[], gapYears = 0): { row: Map<string, number>; rows: number } {
  const ends: number[] = [];
  const row = new Map<string, number>();
  for (const sp of [...spans].sort((a, b) => a.from - b.from || b.to - a.to)) {
    let r = ends.findIndex((e) => e + gapYears <= sp.from);
    if (r < 0) { r = ends.length; ends.push(sp.to); } else ends[r] = sp.to;
    row.set(sp.id, r);
  }
  return { row, rows: Math.max(1, ends.length) };
}
