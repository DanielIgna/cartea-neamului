import type { CountryExtra } from "./tipuri";
import { EXTRA_2 } from "./extins-2";
import { EXTRA_UA } from "./extins-ucraina";
import { EXTRA_NO } from "./extins-norvegia";
import { EXTRA_VECINI } from "./extins-vecini";
import { EXTRA_OCEANIA } from "./extins-oceania";
import { withNewExtra } from "./limbi-noi";

/**
 * Pasul 1 al extinderii diaspora (Daniel, 17.11.2026): cele 7 țări mari primesc text propriu mai lung (în română, plus engleza
 * acolo unde engleza e limba țării), ambasada și consulatele României, particularități și întrebări frecvente.
 *
 * Reguli:
 * - Ambasadele și consulatele sunt doar cele găsite în surse oficiale la 17.11.2026: lista Comisiei Europene pentru protecția
 *   consulară (SUA, Marea Britanie, Canada, Israel), lista Ministerului de Externe german (Germania), lista Ministerului de
 *   Externe italian și paginile oficiale mae.ro (Italia, Spania). Adresa stradală apare doar unde sursa oficială o dă; altfel
 *   doar orașul și pagina oficială. Lista completă și zona fiecărui consulat rămân pe pagina oficială (`missionsSource`).
 * - Cifrele despre comunitate rămân cele rotunde din tari.ts; `stats` e institutul oficial de statistică din care se pot verifica.
 * - Fără biserici sau asociații pe care nu le-am verificat; asociațiile trimit la registrul oficial (dprp.gov.ro).
 */
export const VERIFIED_ON = "17.11.2026";

const EXTRA_1: Record<string, CountryExtra> = {
  italia: {
    stats: { name: "ISTAT – Istituto Nazionale di Statistica", url: "https://www.istat.it", note: { ro: "cetățenii străini rezidenți în Italia, pe cetățenii și regiuni", en: "foreign residents in Italy, by citizenship and region", it: "cittadini stranieri residenti, per cittadinanza e regione" } },
    missions: [
      { kind: "embassy", city: "Roma", url: "https://roma.mae.ro" },
      { kind: "cg", city: "Roma", url: "https://cgroma.mae.ro" },
      { kind: "cg", city: "Milano", url: "https://milano.mae.ro" },
      { kind: "cg", city: "Torino", url: "https://torino.mae.ro" },
      { kind: "cg", city: "Bologna" },
      { kind: "cg", city: "Trieste", url: "https://trieste.mae.ro" },
    ],
    missionsSource: { name: "Ambasada României în Italia – competența teritorială a consulatelor", url: "https://roma.mae.ro/it/node/760", note: { ro: "ce regiuni ține fiecare consulat", en: "which regions each consulate covers", it: "le regioni di competenza di ogni consolato" } },
    guide: {
      ro: [
        "Cei mai mulți români din Italia au plecat după 2002, deci au încă părinți sau bunici în viață acasă. Asta e cea mai bună sursă: înainte de orice act, întreabă-i cum îi chema pe părinții și bunicii lor, din ce sat erau și unde s-au căsătorit. Notează și poreclele de familie, foarte folosite în satele din Moldova, pentru că ajută la deosebirea familiilor cu același nume.",
        "Pentru acte, drumul obișnuit e consulatul de care ții după regiunea în care locuiești: Roma, Milano, Torino, Bologna sau Trieste. Programarea se face pe econsulat.ro. De acolo poți cere un certificat de naștere, căsătorie sau deces din România (duplicat), poți da o procură unei rude care să meargă la primărie sau poți transcrie actele italiene în registrele românești.",
        "Pentru generațiile mai vechi, registrele de stare civilă de peste 100 de ani și registrele parohiale sunt la Arhivele Naționale, la serviciul din județul satului. Le poți scrie pe e-mail, cu numele, anul aproximativ și satul. În Vechiul Regat (Moldova și Țara Românească) starea civilă începe în decembrie 1865; înainte, singurele registre sunt cele ale parohiilor.",
      ],
    },
    specifics: {
      ro: [
        "În actele italiene, numele românești apar des fără diacritice (Ştefan devine Stefan, Țurcanu devine Turcanu), iar uneori numele de familie și prenumele sunt inversate. Când cauți o rudă în registrele unui comune italian sau compari acte românești cu cele italiene, încearcă toate formele.",
        "Copiii născuți în Italia din părinți români primesc certificatul italian de la comune; dacă vrei ca ei să aibă și acte românești (certificat, pașaport, cod numeric personal), nașterea se transcrie la consulat. Între cele două țări, actele de stare civilă circulă fără apostilă, iar comune-ul poate elibera la cerere și formularul multilingv (Regulamentul UE 2016/1191).",
        "Pentru familiile mixte, partea italiană a arborelui se poate face adesea până la începutul secolului al XIX-lea: portalul Antenati al arhivelor de stat italiene are online, gratuit, multe registre de stare civilă vechi.",
      ],
    },
    faq: {
      ro: [
        { q: "Pot obține un certificat de naștere din România fără să vin acasă?", a: "Da. Îl ceri la consulatul României de care ții (programare pe econsulat.ro), care îl solicită primăriei din România, sau dai o procură, semnată la consulat, unei rude care îl ridică de la primărie. Durează de obicei câteva săptămâni." },
        { q: "Am nevoie de apostilă ca să folosesc în Italia un act românesc?", a: "De obicei nu. Între țările Uniunii Europene, actele de stare civilă publice circulă fără apostilă (Regulamentul UE 2016/1191), iar la cerere primești și un formular multilingv care le însoțește." },
        { q: "Unde găsesc actele bunicilor sau străbunicilor?", a: "Actele mai noi de 100 de ani sunt la primăria unde au fost înregistrate. Cele mai vechi și registrele parohiale sunt la Arhivele Naționale, la serviciul județean al satului. Pe Cartea Neamului, pagina fiecărei localități îți arată de ce comună și de ce județ ține satul." },
        { q: "Copilul meu s-a născut în Italia. Trebuie transcrisă nașterea?", a: "Dacă vrei ca el să aibă acte românești (certificat românesc, pașaport, CNP), da: nașterea se transcrie în registrele românești, prin consulat sau la starea civilă din România." },
        { q: "Pot face arborele familiei în italiană, pentru copii?", a: "Da. Site-ul are și varianta în italiană, iar fiecare membru al familiei îl vede în limba lui. Bunicii din România pot completa în română același arbore." },
      ],
    },
  },

  spania: {
    stats: { name: "INE – Instituto Nacional de Estadística", url: "https://www.ine.es", note: { ro: "populația străină din Spania, pe cetățenii și provincii", en: "foreign population in Spain, by nationality and province", es: "población extranjera por nacionalidad y provincia" } },
    missions: [
      { kind: "embassy", city: "Madrid", url: "https://madrid.mae.ro" },
      { kind: "cg", city: "Barcelona", url: "https://madrid.mae.ro/node/224" },
      { kind: "cg", city: "Bilbao", url: "https://bilbao.mae.ro" },
      { kind: "cg", city: "Sevilla", url: "https://sevilla.mae.ro" },
      { kind: "cg", city: "Valencia", url: "https://valencia.mae.ro" },
      { kind: "consulate", city: "Castellón de la Plana", url: "https://castellon.mae.ro" },
      { kind: "consulate", city: "Ciudad Real", url: "https://madrid.mae.ro/node/749" },
      { kind: "consulate", city: "Zaragoza", url: "https://madrid.mae.ro/node/748" },
      { kind: "consulate", city: "Almería", url: "https://madrid.mae.ro/node/750" },
    ],
    missionsSource: { name: "Ambasada României în Spania – circumscripțiile consulare", url: "https://madrid.mae.ro/node/756", note: { ro: "ce provincii ține fiecare consulat", en: "which provinces each consulate covers", es: "las provincias de cada consulado" } },
    guide: {
      ro: [
        "Mulți români din Spania au plecat din Muntenia, Oltenia și Moldova la începutul anilor 2000, adesea mai întâi bărbații, apoi familia. Dacă ai crescut în Spania, primul pas e să afli de la părinți satul exact și numele bunicilor și străbunicilor, cu forma lor de acasă: în actele spaniole aceleași nume pot apărea scrise altfel.",
        "Actele din România le ceri prin consulatul de care ții după provincia în care locuiești. Rețeaua e mare: ambasada din Madrid, consulatele generale de la Barcelona, Bilbao, Sevilla și Valencia și consulatele de la Castellón de la Plana, Ciudad Real, Zaragoza și Almería. Programarea se face pe econsulat.ro.",
        "Pentru străbunici și mai departe, registrele de stare civilă mai vechi de 100 de ani și registrele parohiale sunt la Arhivele Naționale, pe județe. Dacă satul a fost în Transilvania sau Banat, registrele de stare civilă încep în octombrie 1895, iar înainte sunt registrele bisericești, unele scrise în maghiară sau latină.",
      ],
    },
    specifics: {
      ro: [
        "În Spania fiecare om are două nume de familie, al tatălui și al mamei. Copiii născuți acolo din părinți români sunt înregistrați des după regula spaniolă, iar la transcrierea nașterii în România numele se poate scrie altfel. Când compari acte din cele două țări, verifică ordinea și forma numelor.",
        "Registro Civil spaniol eliberează la cerere certificate plurilingve, care se folosesc în România fără traducere, iar între cele două țări actele de stare civilă circulă fără apostilă. Copiii cu cetățenie română au nevoie de transcrierea nașterii pentru acte românești, făcută prin consulat.",
        "Cursurile de limba, cultura și civilizația românească, organizate de statul român, au loc în multe școli spaniole: un prilej bun ca un copil să facă, pentru clasă, arborele familiei cu bunicii din România.",
        "Despre anii plecării, cele mai la îndemână documente sunt chiar ale părinților: certificatul de înregistrare ca cetățean al Uniunii (cu NIE), înscrierea în padrón-ul primăriei, primele contracte de muncă și pozele din primii ani. Merită păstrate copii în arbore, lângă poveștile lor: peste o generație, ele vor spune povestea plecării la fel cum listele de pasageri spun azi povestea emigranților de acum o sută de ani.",
      ],
    },
    faq: {
      ro: [
        { q: "De ce consulat țin dacă locuiesc în Castellón?", a: "Consulatele din Spania au fiecare provinciile lor. Lista oficială, cu provinciile fiecărui consulat, e pe site-ul Ambasadei României la Madrid; o găsești mai sus, la ambasadă și consulate." },
        { q: "Cum transcriu în România certificatul spaniol al copilului?", a: "Prin consulatul de care ții, cu programare pe econsulat.ro, sau direct la starea civilă din România. Certificatul plurilingv eliberat de Registro Civil se folosește fără traducere." },
        { q: "Cum aflu satul de unde a plecat bunicul?", a: "Întreabă rudele, caută în actele lui (certificatul de naștere, buletinul vechi, livretul militar) și verifică satul pe Cartea Neamului: pagina localității îți spune de ce comună și de ce arhivă județeană ține." },
        { q: "Pot cere registre vechi fără să merg la arhivă?", a: "Da. Serviciile județene ale Arhivelor Naționale răspund la cereri scrise, pe e-mail sau prin poștă. Scrie numele, anul aproximativ și satul; cercetarea poate fi taxată." },
        { q: "Bunicii din România pot completa arborele de pe telefon?", a: "Da. Le trimiți un link pe WhatsApp, iar ei adaugă nume, date și poze în același arbore, în română." },
      ],
    },
  },

  germania: {
    stats: { name: "Statistisches Bundesamt (Destatis)", url: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Migration-Integration/Tabellen/auslaendische-bevoelkerung-geschlecht.html", note: { ro: "populația străină din Germania, pe cetățenii", en: "foreign population in Germany, by citizenship", de: "ausländische Bevölkerung nach Staatsangehörigkeit" } },
    missions: [
      { kind: "embassy", city: "Berlin", address: "Dorotheenstraße 62–66, 10117 Berlin", url: "https://berlin.mae.ro" },
      { kind: "cg", city: "Bonn", address: "Legionsweg 14, 53117 Bonn", url: "https://bonn.mae.ro" },
      { kind: "cg", city: "München", address: "Richard-Strauss-Straße 149, 81679 München", url: "https://muenchen.mae.ro" },
      { kind: "cg", city: "Stuttgart", address: "Hauptstätter Straße 68–70, 70178 Stuttgart", url: "https://stuttgart.mae.ro" },
    ],
    missionsSource: { name: "Auswärtiges Amt – Vertretungen Rumäniens in Deutschland", url: "https://www.auswaertiges-amt.de/de/service/laender/rumaenien-node/vertretungenrumaenien-210816", note: { ro: "lista oficială germană a ambasadei și consulatelor", en: "the official German list of the embassy and consulates", de: "amtliche Liste der rumänischen Vertretungen" } },
    guide: {
      ro: [
        "În Germania, întrebarea de început e: din ce strat al emigrației vine familia ta? Dacă bunicii sunt sași din Transilvania sau șvabi din Banat sau Satu Mare, au plecat de obicei până în 1990, iar actele familiei pot fi în germană, maghiară și română. Dacă ai venit după 2007, părinții și bunicii sunt probabil încă acasă și pot spune multe.",
        "Actele din România le ceri la ambasada din Berlin sau la consulatele generale din Bonn, München și Stuttgart, după landul în care locuiești, cu programare pe econsulat.ro. Prin consulat poți cere duplicate după certificate, poți da procură unei rude sau poți transcrie actele germane.",
        "Pentru generațiile vechi, registrele de stare civilă mai vechi de 100 de ani și registrele parohiale sunt la Arhivele Naționale, la serviciul județean. În Transilvania și Banat, starea civilă de stat începe în octombrie 1895; înainte sunt registrele fiecărei confesiuni: luterane la sași, romano-catolice la șvabi, ortodoxe și greco-catolice la români.",
      ],
    },
    specifics: {
      ro: [
        "Același sat poate avea trei nume: Hermannstadt, Nagyszeben și Sibiu sunt același oraș, iar multe sate săsești au nume germane foarte diferite de cele românești. Când cauți un loc în acte vechi sau în arhive germane, caută-l în toate formele; pagina localității de pe Cartea Neamului te ajută să afli cum se numește azi.",
        "La fel se schimbă și prenumele: același om poate fi Johann în registrul bisericii, János în actele de stat maghiare de dinainte de 1918 și Ioan în cele românești de după. Și numele de familie germane apar uneori scrise după ortografia maghiară sau română, așa că Schuster poate deveni Suszter sau Șuster. Notează în arbore toate formele găsite.",
        "Pentru familiile săsești, asociațiile pe sate de origine (Heimatortsgemeinschaften) au strâns de-a lungul anilor liste de familii, fotografii și cronici ale satelor. Între Germania și România actele de stare civilă circulă fără apostilă, iar Standesamt-ul poate elibera certificate în format internațional (mehrsprachig).",
        "Familiile venite după 2014 au adesea copii născuți în Germania, cu certificat german. Pentru acte românești, nașterea se transcrie la consulat. Un arbore completat de departe cu bunicii din țară păstrează pentru acești copii numele, satele și poveștile pe care altfel nu le-ar mai afla.",
      ],
    },
    faq: {
      ro: [
        { q: "Ce consulat al României e mai aproape de mine în Germania?", a: "Pe lângă ambasada din Berlin, România are consulate generale la Bonn, München și Stuttgart. Fiecare are landurile lui; lista oficială e pe site-ul Ministerului de Externe german, iar programarea se face pe econsulat.ro." },
        { q: "Bunicii mei sunt sași din Transilvania. Unde găsesc registrele lor?", a: "Registrele de stare civilă de după 1895 și o parte din registrele bisericești sunt la Arhivele Naționale ale României, pe județe. Asociația sașilor din Germania și comunitățile pe sate de origine pot ajuta cu legăturile spre registrele bisericii lor." },
        { q: "Am nevoie de apostilă pentru un certificat românesc în Germania?", a: "De obicei nu: în Uniunea Europeană actele de stare civilă circulă fără apostilă (Regulamentul UE 2016/1191). La cerere primești și un formular multilingv, care poate scuti traducerea." },
        { q: "Cum găsesc un sat după numele lui german?", a: "Caută numele în germană pe internet împreună cu „Siebenbürgen” sau „Banat”, apoi caută numele românesc pe Cartea Neamului, unde vezi comuna, județul și arhiva de care ține." },
        { q: "Pot face arborele în germană?", a: "Da. Site-ul are varianta în germană, iar rudele din România pot completa același arbore în română." },
      ],
    },
  },

  "marea-britanie": {
    stats: { name: "GOV.UK – EU Settlement Scheme statistics", url: "https://www.gov.uk/government/statistics/eu-settlement-scheme-quarterly-statistics-december-2023/eu-settlement-scheme-quarterly-statistics-december-2023", note: { ro: "cererile pentru statutul de rezident, pe cetățenii", en: "applications to the scheme, by nationality" } },
    missions: [
      { kind: "embassy", city: "London", address: "Arundel House, 4 Palace Green, London W8 4QD", url: "https://londra.mae.ro" },
      { kind: "consular", city: "London", address: "M.E.I.C. House, 344 Kensington High Street, London W14 8NS" },
      { kind: "cg", city: "Edinburgh", address: "7–9 North St David Street, Edinburgh EH2 1AW" },
      { kind: "cg", city: "Manchester", address: "9 Cooper Street, Manchester M2 2FW" },
    ],
    missionsSource: { name: "European Commission – consular protection: Romania in the UK", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-united-kingdom-gb_en", note: { ro: "lista oficială a misiunilor României în Marea Britanie", en: "the official list of Romania's missions in the UK" } },
    guide: {
      ro: [
        "Majoritatea românilor din Marea Britanie au venit după 2014, așa că bunicii și străbunicii sunt aproape mereu în România. Începe cu ce știu părinții: numele, satul, anii. Un apel video cu bunicii și albumul de familie deschis aduce de obicei mai multe nume decât orice arhivă.",
        "Actele din România le ceri prin ambasada din Londra (secția consulară), sau prin consulatele generale din Edinburgh și Manchester, cu programare pe econsulat.ro. Poți cere duplicate după certificate, poți da procură unei rude și poți transcrie actele britanice ale copiilor.",
        "Pentru generațiile mai vechi, scrie Arhivelor Naționale ale României, la serviciul județean al satului: au registrele de stare civilă mai vechi de 100 de ani și registrele parohiale. Spune exact numele, anul aproximativ și satul, cu numele comunei de atunci.",
      ],
      en: [
        "Most Romanians in the UK arrived after 2014, so grandparents and great-grandparents are nearly always in Romania. Start with what your parents know: names, the village, the years. A video call with the grandparents and the family album open usually brings more names than any archive.",
        "You can request Romanian documents through the Embassy in London (consular section) or the Consulates General in Edinburgh and Manchester; appointments are booked on econsulat.ro. You can ask for duplicate certificates, give a power of attorney to a relative, and register your children's UK certificates in Romania.",
        "For older generations, write to the county branch of the Romanian National Archives: they hold civil registers older than 100 years and parish registers. Give the exact name, the approximate year and the village, with the name of the commune at the time.",
      ],
    },
    specifics: {
      ro: [
        "Marea Britanie nu mai e în Uniunea Europeană. Un act britanic folosit în România are nevoie de apostilă, pusă de biroul de legalizări al guvernului britanic (FCDO), iar un act românesc folosit în Marea Britanie are nevoie de apostila pusă în România, de obicei la prefectură, plus traducere.",
        "Actele britanice se cer separat pe fiecare țară: Anglia și Țara Galilor la General Register Office, Scoția la National Records of Scotland (ScotlandsPeople), Irlanda de Nord la GRONI. Pentru familiile mixte, registrele britanice sunt printre cele mai complete din lume, iar indexurile vechi se caută online.",
        "Copiii născuți în Marea Britanie din părinți români au nevoie de transcrierea nașterii pentru certificat și pașaport românesc. Se face prin consulat, cu certificatul britanic apostilat și tradus.",
        "Pentru partea britanică a unei familii mixte: înregistrarea civilă începe în Anglia și Țara Galilor la 1 iulie 1837, iar în Scoția în 1855. Indexurile nașterilor, căsătoriilor și deceselor se pot căuta gratuit pe FreeBMD, iar certificatele întregi se comandă de la GRO. Recensămintele, făcute din zece în zece ani din 1841, se deschid publicului după 100 de ani; cel mai nou disponibil e cel din 1921.",
      ],
      en: [
        "The UK is no longer in the European Union. A UK document used in Romania needs an apostille from the FCDO Legalisation Office, and a Romanian document used in the UK needs an apostille issued in Romania, usually by the prefecture, plus a translation.",
        "UK records are requested separately for each nation: England and Wales from the General Register Office, Scotland from National Records of Scotland (ScotlandsPeople), Northern Ireland from GRONI. For mixed families, British registers are among the most complete in the world, and the old indexes are searchable online.",
        "Children born in the UK to Romanian parents need their birth registered in Romania to get a Romanian certificate and passport. This is done through the consulate, with the UK certificate apostilled and translated.",
        "For the British side of a mixed family: civil registration began in England and Wales on 1 July 1837 and in Scotland in 1855. Birth, marriage and death indexes can be searched free on FreeBMD, and full certificates are ordered from the GRO. Censuses, taken every ten years since 1841, open to the public after 100 years; the latest available is the 1921 census.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde sunt consulatele României în Marea Britanie?", a: "Secția consulară a ambasadei e la Londra, iar consulatele generale sunt la Edinburgh și Manchester. Adresele sunt mai sus; programarea se face pe econsulat.ro." },
        { q: "Am nevoie de apostilă pentru actele românești în Marea Britanie?", a: "Da, de după Brexit. Apostila se pune în România, de obicei la prefectură, iar actul se traduce. Pentru actele britanice folosite în România, apostila o pune FCDO." },
        { q: "Cum îi transcriu copilului certificatul britanic în România?", a: "La consulat, cu programare pe econsulat.ro, cu certificatul britanic apostilat și tradus. După transcriere primești certificatul românesc, iar copilul poate avea pașaport românesc." },
        { q: "Pot cere acte vechi din România fără să merg acolo?", a: "Da: prin consulat, printr-o rudă cu procură sau, pentru registrele de peste 100 de ani, scriind direct serviciului județean al Arhivelor Naționale." },
        { q: "Copiii mei vorbesc mai bine engleza. Pot vedea arborele în engleză?", a: "Da. Fiecare membru al familiei vede arborele în limba lui, iar bunicii din România îl completează în română." },
        { q: "Cum găsesc actele britanice ale unei rude care a trăit în Anglia?", a: "Caută întâi în indexurile gratuite FreeBMD (Anglia și Țara Galilor, din 1837), apoi comandă certificatul de la General Register Office. Pentru Scoția caută pe ScotlandsPeople, iar pentru Irlanda de Nord la GRONI." },
      ],
      en: [
        { q: "Where are Romania's consulates in the UK?", a: "The Embassy's consular section is in London, and there are Consulates General in Edinburgh and Manchester. The addresses are above; appointments are booked on econsulat.ro." },
        { q: "Do I need an apostille for Romanian documents in the UK?", a: "Yes, since Brexit. The apostille is issued in Romania, usually by the prefecture, and the document is translated. For UK documents used in Romania, the apostille is issued by the FCDO." },
        { q: "How do I register my child's UK birth in Romania?", a: "At the consulate, by appointment on econsulat.ro, with the UK certificate apostilled and translated. You then receive a Romanian birth certificate, and the child can have a Romanian passport." },
        { q: "Can I get old records from Romania without travelling?", a: "Yes: through the consulate, through a relative with a power of attorney, or, for registers older than 100 years, by writing directly to the county branch of the National Archives." },
        { q: "My children speak English better. Can they see the tree in English?", a: "Yes. Each family member sees the tree in their own language, and the grandparents in Romania fill it in in Romanian." },
        { q: "How do I find UK records of a relative who lived in England?", a: "Start with the free FreeBMD indexes (England and Wales, from 1837), then order the certificate from the General Register Office. For Scotland search ScotlandsPeople, and for Northern Ireland, GRONI." },
      ],
    },
  },

  "statele-unite": {
    stats: { name: "U.S. Census Bureau – American Community Survey", url: "https://www.census.gov/programs-surveys/acs", note: { ro: "originea declarată (ancestry), pe state", en: "reported ancestry, by state" } },
    missions: [
      { kind: "embassy", city: "Washington, D.C.", address: "1607 23rd St. NW, Washington, D.C. 20008", url: "https://washington.mae.ro" },
      { kind: "cg", city: "New York", address: "200 East 38th Street, New York, NY 10016", url: "https://newyork.mae.ro" },
      { kind: "cg", city: "Chicago", address: "737 North Michigan Avenue, Suite 2300, Chicago, IL 60611", url: "https://chicago.mae.ro" },
      { kind: "cg", city: "Los Angeles", address: "11766 Wilshire Boulevard, Suite 560, Los Angeles, CA 90025", url: "https://losangeles.mae.ro" },
      { kind: "cg", city: "Miami", url: "https://washington.mae.ro/en/node/2027" },
    ],
    missionsSource: { name: "European Commission – consular protection: Romania in the United States", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-united-states-us_en", note: { ro: "lista oficială a misiunilor României în SUA", en: "the official list of Romania's missions in the US" } },
    guide: {
      ro: [
        "În America sunt două feluri de familii românești. Unele au venit după 1990 și au rudele apropiate în România: pentru ele, pașii sunt la fel ca oriunde în diaspora. Altele au strămoși sosiți între 1895 și 1920, iar urmașii știu uneori doar numele de familie. Pentru ele, căutarea începe în America și abia apoi trece oceanul.",
        "Pentru strămoșii veniți de mult, ordinea bună e: recensămintele americane (cele din 1910, 1920 și 1930 notează țara nașterii, limba maternă și anul sosirii), dosarul de naturalizare (care numește adesea satul), apoi lista de pasageri a vaporului. Când ai satul, îl cauți pe Cartea Neamului ca să afli comuna și arhiva județeană de azi.",
        "Pentru acte din România, mergi la consulatul de care ții după stat: New York, Chicago, Los Angeles, Miami sau secția consulară a ambasadei din Washington. Programarea se face pe econsulat.ro. Pentru registrele de peste 100 de ani, scrie direct Arhivelor Naționale, la serviciul județean.",
      ],
      en: [
        "There are two kinds of Romanian families in America. Some came after 1990 and have close relatives in Romania: for them the steps are the same as anywhere in the diaspora. Others descend from people who arrived between 1895 and 1920, and sometimes only the surname is left. For them, the search starts in America and only then crosses the ocean.",
        "For early ancestors, a good order is: US censuses (those of 1910, 1920 and 1930 record country of birth, mother tongue and year of arrival), the naturalization file (which often names the village), then the ship's passenger list. Once you have the village, look it up on Cartea Neamului to find today's commune and county archive.",
        "For documents from Romania, go to the consulate for your state: New York, Chicago, Los Angeles, Miami, or the consular section of the embassy in Washington. Appointments are booked on econsulat.ro. For registers older than 100 years, write directly to the county branch of the Romanian National Archives.",
      ],
    },
    specifics: {
      ro: [
        "Mulți români din primul val nu apar în acte ca „români”. Transilvania, Banatul și Bucovina erau atunci în Austro-Ungaria, așa că pe listele de pasageri și în recensăminte apar ca „Hungarian” sau „Austrian”, cu limba maternă „Roumanian”. Caută după limba maternă și după numele satului, nu doar după țară.",
        "Numele de familie se schimbau rar la Ellis Island: listele de pasageri erau făcute în portul de plecare. Mulți și-au americanizat numele mai târziu, singuri, la naturalizare sau la angajare. De aceea dosarul de naturalizare, care trece și numele de la sosire, e documentul-cheie.",
        "Statele Unite folosesc apostila de la Haga: un act american folosit în România se apostilează la statul care l-a emis (Secretary of State), iar un act românesc folosit în America se apostilează în România. Copiii născuți în SUA din părinți români au nevoie de transcrierea nașterii pentru acte românești.",
      ],
      en: [
        "Many early Romanian immigrants do not appear in records as \"Romanian\". Transylvania, Banat and Bukovina were then part of Austria-Hungary, so passenger lists and censuses show them as \"Hungarian\" or \"Austrian\", with \"Roumanian\" as mother tongue. Search by mother tongue and village name, not only by country.",
        "Surnames were rarely changed at Ellis Island: passenger lists were drawn up at the port of departure. Many Americanised their names later, themselves, at naturalization or at work. That is why the naturalization file, which also records the name on arrival, is the key document.",
        "The United States uses the Hague apostille: a US document used in Romania is apostilled by the state that issued it (Secretary of State), and a Romanian document used in the US is apostilled in Romania. Children born in the US to Romanian parents need their birth registered in Romania to get Romanian documents.",
      ],
    },
    faq: {
      ro: [
        { q: "Străbunicul a venit în America pe la 1910. Cum aflu satul lui?", a: "Caută-l în recensămintele americane, apoi cere dosarul de naturalizare (prin USCIS Genealogy Program pentru cele de după 1906 sau la National Archives). Dosarul și lista de pasageri numesc adesea satul." },
        { q: "De ce strămoșul meu apare ca „Hungarian” deși era român?", a: "Pentru că Transilvania și Banatul erau în Ungaria (Austro-Ungaria) până în 1918. Cetățenia din acte era cea a statului; limba maternă, trecută separat, arată de obicei „Roumanian”." },
        { q: "La ce consulat al României mă duc?", a: "Depinde de statul în care locuiești: există consulate generale la New York, Chicago, Los Angeles și Miami, plus secția consulară a ambasadei din Washington. Programarea se face pe econsulat.ro." },
        { q: "Am nevoie de apostilă?", a: "Da. Actele americane folosite în România se apostilează la Secretary of State din statul care le-a emis; actele românești folosite în SUA se apostilează în România și se traduc." },
        { q: "Pot face arborele în engleză, cu rudele din România?", a: "Da. Arborele e același pentru toată familia: tu îl vezi în engleză, rudele din România în română." },
        { q: "Unde găsesc actele americane de naștere, căsătorie sau deces?", a: "Statele Unite nu au un registru național: actele se țin la statul sau la comitatul (county) unde s-a petrecut evenimentul. Cele vechi sunt adesea la arhivele statului, iar multe indexuri se pot căuta online." },
      ],
      en: [
        { q: "My great-grandfather came to America around 1910. How do I find his village?", a: "Find him in the US censuses, then request his naturalization file (through the USCIS Genealogy Program for files after 1906, or from the National Archives). The file and the passenger list often name the village." },
        { q: "Why is my ancestor listed as \"Hungarian\" if he was Romanian?", a: "Because Transylvania and Banat were part of Hungary (Austria-Hungary) until 1918. The citizenship in the records was that of the state; the mother tongue, listed separately, usually says \"Roumanian\"." },
        { q: "Which Romanian consulate should I go to?", a: "It depends on your state: there are Consulates General in New York, Chicago, Los Angeles and Miami, plus the consular section of the embassy in Washington. Appointments are booked on econsulat.ro." },
        { q: "Do I need an apostille?", a: "Yes. US documents used in Romania are apostilled by the Secretary of State of the issuing state; Romanian documents used in the US are apostilled in Romania and translated." },
        { q: "Can I build the tree in English with relatives in Romania?", a: "Yes. The tree is shared by the whole family: you see it in English, your relatives in Romania see it in Romanian." },
        { q: "Where do I find US birth, marriage and death records?", a: "The United States has no national register: records are kept by the state or county where the event happened. Older ones are often at the state archives, and many indexes can be searched online." },
      ],
    },
  },

  canada: {
    stats: { name: "Statistics Canada – Census of Population", url: "https://www.statcan.gc.ca", note: { ro: "originea etnică sau culturală declarată, pe provincii", en: "reported ethnic or cultural origin, by province", fr: "origine ethnique ou culturelle déclarée, par province" } },
    missions: [
      { kind: "embassy", city: "Ottawa", address: "655 Rideau Street, Ottawa, ON K1N 6A3", url: "https://ottawa.mae.ro" },
      { kind: "cg", city: "Montréal", address: "1010 rue Sherbrooke Ouest, bureau 610, Montréal, QC H3A 2R7", url: "https://montreal.mae.ro" },
      { kind: "cg", city: "Toronto", address: "789 Don Mills Road, unit 501, Toronto, ON M3C 1T9", url: "https://toronto.mae.ro" },
      { kind: "cg", city: "Vancouver", address: "555 Burrard Street, Suite 855, Two Bentall Centre, Vancouver, BC V7X 1M8", url: "https://vancouver.mae.ro" },
    ],
    missionsSource: { name: "European Commission – consular protection: Romania in Canada", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-canada-ca_en", note: { ro: "lista oficială a misiunilor României în Canada", en: "the official list of Romania's missions in Canada", fr: "la liste officielle des missions de la Roumanie au Canada" } },
    guide: {
      ro: [
        "Familiile românești din Canada sunt de două feluri: urmașii coloniștilor din Bucovina și Transilvania așezați în prerii la sfârșitul secolului al XIX-lea și cei veniți după 1990, mai ales la Montréal și Toronto. Pentru primii, căutarea începe în arhivele canadiene; pentru ceilalți, la părinții și bunicii rămași acasă.",
        "Pentru actele din România mergi la consulatul de care ții după provincie: Montréal, Toronto, Vancouver sau secția consulară a ambasadei din Ottawa, cu programare pe econsulat.ro. De acolo ceri duplicate după certificate, dai procură unei rude sau transcrii actele canadiene ale copiilor.",
        "Pentru strămoșii veniți în prerii, Library and Archives Canada are recensămintele (1901, 1911, 1921 și cele de mai târziu), listele de pasageri și registrele de terenuri primite de coloniști. Odată aflat satul, registrele lui de dinainte de 1918 sunt, de obicei, la Arhivele Naționale ale României sau, pentru nordul Bucovinei, în arhivele din Ucraina.",
      ],
      en: [
        "Romanian families in Canada are of two kinds: descendants of settlers from Bukovina and Transylvania who came to the prairies in the late 19th century, and people who arrived after 1990, mostly in Montréal and Toronto. For the first, the search starts in Canadian archives; for the second, with the parents and grandparents back home.",
        "For Romanian documents, go to the consulate for your province: Montréal, Toronto, Vancouver, or the consular section of the embassy in Ottawa, by appointment on econsulat.ro. There you can request duplicate certificates, give a power of attorney to a relative or register your children's Canadian certificates in Romania.",
        "For ancestors who settled on the prairies, Library and Archives Canada holds the censuses (1901, 1911, 1921 and later), passenger lists and homestead records. Once you know the village, its pre-1918 registers are usually at the Romanian National Archives or, for northern Bukovina, in archives in Ukraine.",
      ],
    },
    specifics: {
      ro: [
        "Coloniștii din Bucovina apar în actele canadiene de atunci ca „Austrian” sau „Galician”, nu ca români, pentru că Bucovina era provincie austriacă până în 1918. Satele lor de origine sunt azi fie în România (județul Suceava), fie în Ucraina (regiunea Cernăuți), așa că registrele pot fi în două țări diferite.",
        "Din ianuarie 2024 Canada face parte din Convenția de la Haga privind apostila: actele canadiene folosite în România se apostilează în Canada, iar cele românești folosite în Canada se apostilează în România. În Québec, actele de stare civilă se cer de la Directeur de l'état civil, iar în celelalte provincii de la registrul provinciei.",
        "Copiii născuți în Canada din părinți români au nevoie de transcrierea nașterii în registrele românești pentru certificat și pașaport românesc, prin consulat.",
        "Pentru preriile din Manitoba, Saskatchewan și Alberta există și recensăminte speciale, din 1906, 1916 și 1926, utile pentru familiile de coloniști. Recensămintele canadiene devin publice după 92 de ani; cel mai nou deschis e cel din 1931. Library and Archives Canada le are online, gratuit, cu căutare după nume.",
      ],
      en: [
        "Settlers from Bukovina appear in Canadian records of the time as \"Austrian\" or \"Galician\", not as Romanian, because Bukovina was an Austrian province until 1918. Their home villages are today either in Romania (Suceava County) or in Ukraine (Chernivtsi Oblast), so the registers may be in two different countries.",
        "Since January 2024 Canada has been part of the Hague Apostille Convention: Canadian documents used in Romania are apostilled in Canada, and Romanian documents used in Canada are apostilled in Romania. In Québec, civil records come from the Directeur de l'état civil; in other provinces, from the provincial vital statistics registry.",
        "Children born in Canada to Romanian parents need their birth registered in Romania, through the consulate, to get a Romanian certificate and passport.",
        "For the prairies of Manitoba, Saskatchewan and Alberta there are also special censuses from 1906, 1916 and 1926, useful for settler families. Canadian censuses become public after 92 years; the latest open one is the 1931 census. Library and Archives Canada has them online, free and searchable by name.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde sunt consulatele României în Canada?", a: "Ambasada e la Ottawa, iar consulatele generale sunt la Montréal, Toronto și Vancouver. Adresele sunt mai sus; programarea se face pe econsulat.ro." },
        { q: "Strămoșii mei au venit din Bucovina pe la 1900. Unde caut?", a: "Întâi în recensămintele canadiene și în registrele de terenuri ale coloniștilor (Library and Archives Canada). Apoi, după sat: la Arhivele Naționale ale României (Suceava) sau în arhivele din Cernăuți, pentru satele din Ucraina de azi." },
        { q: "Am nevoie de apostilă pentru actele canadiene?", a: "Da, din ianuarie 2024 Canada folosește apostila. Actul canadian se apostilează în Canada, apoi se traduce pentru România." },
        { q: "Cum transcriu nașterea copilului în România?", a: "La consulat, cu programare pe econsulat.ro, cu certificatul canadian apostilat și tradus." },
        { q: "Pot face arborele în franceză sau engleză?", a: "Da, site-ul are ambele variante, iar rudele din România completează același arbore în română." },
        { q: "Unde caut actele canadiene ale unei rude?", a: "Nașterile, căsătoriile și decesele se țin pe provincii: în Québec la Directeur de l'état civil, în Ontario la ServiceOntario, iar în celelalte provincii la registrul de stare civilă al provinciei. Actele foarte vechi ajung de obicei la arhivele provinciale, unde se pot cerceta." },
        { q: "Satul Boian din Alberta are legătură cu Boianul din Bucovina?", a: "Da. A fost întemeiat la sfârșitul secolului al XIX-lea de coloniști veniți din satul Boian, din Bucovina, al cărui nume îl poartă. Satul bucovinean se află azi în Ucraina, aproape de granița cu România." },
      ],
      en: [
        { q: "Where are Romania's consulates in Canada?", a: "The embassy is in Ottawa, and there are Consulates General in Montréal, Toronto and Vancouver. The addresses are above; appointments are booked on econsulat.ro." },
        { q: "My ancestors came from Bukovina around 1900. Where do I look?", a: "First in the Canadian censuses and homestead records (Library and Archives Canada). Then, depending on the village: the Romanian National Archives (Suceava) or the archives in Chernivtsi for villages now in Ukraine." },
        { q: "Do I need an apostille for Canadian documents?", a: "Yes, since January 2024 Canada uses the apostille. The Canadian document is apostilled in Canada and then translated for Romania." },
        { q: "How do I register my child's birth in Romania?", a: "At the consulate, by appointment on econsulat.ro, with the Canadian certificate apostilled and translated." },
        { q: "Can I build the tree in French or English?", a: "Yes, the site has both, and relatives in Romania fill in the same tree in Romanian." },
        { q: "Where do I look for a relative's Canadian records?", a: "Births, marriages and deaths are kept by each province: in Québec by the Directeur de l'état civil, in Ontario by ServiceOntario, and elsewhere by the provincial vital statistics registry. Very old records usually end up in the provincial archives." },
        { q: "Is Boian in Alberta linked to Boian in Bukovina?", a: "Yes. It was founded in the late 19th century by settlers from the village of Boian in Bukovina, whose name it bears. The Bukovinian village is today in Ukraine, close to the Romanian border." },
      ],
    },
  },

  israel: {
    stats: { name: "Central Bureau of Statistics (Israel)", url: "https://www.cbs.gov.il", note: { ro: "populația Israelului după țara nașterii", en: "Israel's population by country of birth", he: "האוכלוסייה לפי ארץ לידה" } },
    missions: [
      { kind: "embassy", city: "Tel Aviv", url: "https://telaviv.mae.ro" },
      { kind: "consular", city: "Ramat Gan", address: "Paz Tower 2, Str. Shoham 2, et. 8, Ramat Gan" },
    ],
    missionsSource: { name: "European Commission – consular protection: Romania in Israel", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-israel-il_en", note: { ro: "lista oficială a misiunii României în Israel", en: "the official list of Romania's mission in Israel", he: "הרשימה הרשמית של נציגות רומניה בישראל" } },
    guide: {
      ro: [
        "Cele mai multe familii din Israel cu rădăcini în România au plecat între 1948 și anii '80, deci primii emigranți au murit în mare parte, iar nepoții lor nu mai vorbesc româna. Începe cu ce se mai știe în familie: orașul sau târgul de origine (Iași, Botoșani, Dorohoi, Bacău, Focșani, Sighet, Cluj, București), numele dinainte de ebraizare și certificatele românești păstrate în sertare.",
        "Actele din România le ceri la secția consulară a ambasadei, la Ramat Gan, cu programare pe econsulat.ro, sau printr-o rudă ori un avocat din România, cu procură. Registrele de stare civilă de după 1865 îi cuprind și pe evreii din Vechiul Regat; cele mai vechi de 100 de ani sunt la Arhivele Naționale, la serviciul județean.",
        "Pentru perioada Holocaustului, bazele de date ale Yad Vashem păstrează numele victimelor din Transilvania de nord, Bucovina, Basarabia și Moldova, adesea cu locul nașterii și al locuirii. Mărturiile completate de rude (Pages of Testimony) dau uneori numele părinților și ale fraților.",
      ],
    },
    specifics: {
      ro: [
        "Mulți emigranți și-au ebraizat numele după sosire, iar copiii și nepoții lor știu adesea doar numele nou. Ca să găsești o familie în actele românești, îți trebuie numele dinainte, așa cum era scris în România, uneori cu ortografia germană sau maghiară.",
        "Evreii din Transilvania de nord și din Maramureș au trăit, între 1940 și 1944, sub administrație maghiară, iar actele din acei ani sunt în maghiară. Comunitățile din nordul Bucovinei și din Basarabia sunt azi în Ucraina și Republica Moldova, unde se află și o mare parte din registrele lor.",
        "Foștii cetățeni români care și-au pierdut cetățenia, și urmașii lor, o pot cere înapoi în condițiile legii cetățeniei române (Legea nr. 21/1991). Israelul folosește apostila de la Haga, așa că actele israeliene folosite în România trebuie apostilate și traduse.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi cer actele românești în Israel?", a: "La secția consulară a Ambasadei României, la Ramat Gan (Paz Tower 2, Str. Shoham 2, et. 8), cu programare pe econsulat.ro." },
        { q: "Bunicii au plecat din Iași în 1950. Există încă actele lor?", a: "Da, de obicei. Actele de stare civilă sunt la primăria Iași, iar cele mai vechi de 100 de ani la Arhivele Naționale, Serviciul Județean Iași. Îți trebuie numele lor românesc, nu cel ebraizat." },
        { q: "Unde găsesc rudele pierdute în Holocaust?", a: "În baza de date a numelor victimelor de la Yad Vashem, care are și mărturiile completate de supraviețuitori și de rude. Vezi și pagina noastră despre rădăcinile evreiești din România." },
        { q: "Pot redobândi cetățenia română?", a: "Foștii cetățeni români care au pierdut-o, precum și urmașii lor, o pot cere înapoi în condițiile Legii nr. 21/1991. Cererea se depune la consulat; detaliile sunt la Autoritatea Națională pentru Cetățenie." },
        { q: "Pot face arborele în ebraică?", a: "Da. Site-ul are varianta în ebraică, iar rudele din România sau de oriunde completează același arbore în limba lor." },
        { q: "Unde caut familia în registrele din România?", a: "Registrele de stare civilă de după 1865 sunt la primării și, cele de peste 100 de ani, la Arhivele Naționale, pe județe; o parte din registrele comunităților evreiești sunt păstrate în aceleași arhive. Proiectul JewishGen are indexuri căutabile pentru multe localități din România." },
      ],
    },
  },
};

/** Toate țările cu ghid propriu: cele 7 mari (pasul 1) și celelalte 11 (pasul 4, extins-2.ts). */
export const EXTRA: Record<string, CountryExtra> = withNewExtra({ ...EXTRA_1, ...EXTRA_2, ...EXTRA_UA, ...EXTRA_NO, ...EXTRA_VECINI, ...EXTRA_OCEANIA });

/** Cuvintele proprii (românești) ale unei țări: istoria, ghidul, particularitățile și întrebările (pentru prag și teste). */
export function ownWords(parts: (string | undefined)[]): number {
  return parts.filter(Boolean).join(" ").split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
}
