import type { Country, Link } from "./tipuri";
import { APPROVED_COUNTRIES } from "./ciorne";
import { withNewCountries, withNewRomania } from "./limbi-noi";

/**
 * Țările cu comunități mari de români (lista lui Daniel, 15.11.2026). Istoria e scrisă de noi, pe scurt, din fapte cunoscute
 * (valurile de emigrare, regiunile, anii); cifrele sunt rotunde și puse doar unde le știm sigur. Fără promovare religioasă:
 * comunitățile sunt cele culturale și civice.
 */

const ROMANIA: Link[] = [
  { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "registrele de stare civilă și parohiale mai vechi de 100 de ani, pe județe", en: "civil and parish registers older than 100 years, by county", it: "registri di stato civile e parrocchiali con più di 100 anni, per provincia", es: "libros de registro civil y parroquiales de más de 100 años, por distrito", de: "Standes- und Kirchenbücher, älter als 100 Jahre, nach Kreisen", fr: "registres d'état civil et paroissiaux de plus de 100 ans, par département", he: "ספרי רישום אזרחיים וקהילתיים בני יותר ממאה שנה, לפי מחוזות", hu: "100 évnél régebbi állami és egyházi anyakönyvek, megyénként" } },
  { name: "econsulat.ro", url: "https://www.econsulat.ro", note: { ro: "programări și cereri la consulatele României", en: "appointments and applications at Romanian consulates", it: "appuntamenti e richieste ai consolati romeni", es: "citas y solicitudes en los consulados rumanos", de: "Termine und Anträge bei rumänischen Konsulaten", fr: "rendez-vous et demandes auprès des consulats roumains", he: "תורים ובקשות בקונסוליות של רומניה", hu: "időpontfoglalás és kérelmek a román konzulátusokon" } },
  { name: "Ministerul Afacerilor Externe", url: "https://www.mae.ro", note: { ro: "lista ambasadelor și consulatelor, cu zona de care răspunde fiecare", en: "list of embassies and consulates and the area each covers", it: "elenco di ambasciate e consolati con la zona di competenza", es: "lista de embajadas y consulados y la zona que cubre cada uno", de: "Liste der Botschaften und Konsulate mit ihren Amtsbezirken", fr: "liste des ambassades et consulats et leur circonscription", he: "רשימת השגרירויות והקונסוליות והאזור שבאחריות כל אחת", hu: "nagykövetségek és konzulátusok listája, illetékességi területtel" } },
  { name: "Departamentul pentru Românii de Pretutindeni", url: "https://dprp.gov.ro", note: { ro: "asociațiile românilor din străinătate și programele pentru diaspora", en: "Romanian associations abroad and programmes for the diaspora", it: "associazioni dei romeni all'estero e programmi per la diaspora", es: "asociaciones de rumanos en el extranjero y programas para la diáspora", de: "rumänische Vereine im Ausland und Programme für die Diaspora", fr: "associations de Roumains à l'étranger et programmes pour la diaspora", he: "עמותות של יוצאי רומניה בעולם ותוכניות לתפוצות", hu: "külföldi román egyesületek és diaszpóraprogramok" } },
];
export const ROMANIA_LINKS = withNewRomania(ROMANIA);

const BASE: Country[] = [
  {
    slug: "italia", code: "IT", flag: "🇮🇹", langs: ["it", "ro", "en"], eu: true, icr: { ro: "Roma și Veneția", en: "Rome and Venice", it: "Roma e Venezia" },
    name: { ro: "Italia", en: "Italy", it: "Italia" },
    where: { ro: "în Italia", en: "in Italy", it: "in Italia" },
    size: { ro: "în jur de un milion de cetățeni români, cea mai mare comunitate străină din Italia", en: "around one million Romanian citizens, the largest foreign community in Italy", it: "circa un milione di cittadini romeni, la più grande comunità straniera in Italia" },
    cities: ["Roma", "Milano", "Torino", "Padova", "Bologna", "Verona"],
    history: {
      ro: [
        "Puțini români trăiau în Italia înainte de 1990, mai ales studenți, artiști și exilați politici. Valul mare a venit după 2002, când românii au putut călători fără viză în spațiul Schengen, și a crescut după aderarea României la Uniunea Europeană, în 2007.",
        "Au plecat mai ales din Moldova (Bacău, Neamț, Suceava, Iași, Vaslui) și din Transilvania, iar mulți bărbați au lucrat în construcții și agricultură, iar multe femei în îngrijirea bătrânilor. Azi o a doua generație s-a născut și a crescut în Italia, iar mulți copii vorbesc mai bine italiana decât româna: arborele familiei e felul în care află de unde vin bunicii lor.",
      ],
      en: [
        "Few Romanians lived in Italy before 1990, mostly students, artists and political exiles. The big wave came after 2002, when Romanians could travel to the Schengen area without a visa, and it grew after Romania joined the European Union in 2007.",
        "Many came from the Moldavia region (Bacău, Neamț, Suceava, Iași, Vaslui) and from Transylvania; men often worked in construction and farming, and many women in elderly care. Today a second generation has been born and raised in Italy, and many children speak Italian better than Romanian: a family tree is how they learn where their grandparents come from.",
      ],
      it: [
        "Prima del 1990 in Italia vivevano pochi romeni, soprattutto studenti, artisti ed esuli politici. La grande ondata è arrivata dopo il 2002, quando i romeni hanno potuto viaggiare senza visto nell'area Schengen, ed è cresciuta dopo l'ingresso della Romania nell'Unione europea, nel 2007.",
        "Molti sono partiti dalla Moldavia romena (Bacău, Neamț, Suceava, Iași, Vaslui) e dalla Transilvania; gli uomini hanno lavorato spesso nell'edilizia e in agricoltura, molte donne nell'assistenza agli anziani. Oggi una seconda generazione è nata e cresciuta in Italia e tanti ragazzi parlano l'italiano meglio del romeno: l'albero di famiglia è il modo in cui scoprono da dove vengono i nonni.",
      ],
    },
    records: [
      { name: "Antenati – Portale degli Archivi di Stato", url: "https://antenati.cultura.gov.it", note: { ro: "registrele de stare civilă italiene, pentru familiile mixte", en: "Italian civil records, for mixed families", it: "registri dello stato civile italiano, per le famiglie miste" } },
    ],
  },
  {
    slug: "spania", code: "ES", flag: "🇪🇸", langs: ["es", "ro", "en"], eu: true, icr: { ro: "Madrid", en: "Madrid", es: "Madrid" },
    name: { ro: "Spania", en: "Spain", es: "España" },
    where: { ro: "în Spania", en: "in Spain", es: "en España" },
    size: { ro: "peste o jumătate de milion de cetățeni români, una dintre cele mai mari comunități străine din Spania", en: "over half a million Romanian citizens, one of the largest foreign communities in Spain", es: "más de medio millón de ciudadanos rumanos, una de las mayores comunidades extranjeras de España" },
    cities: ["Madrid (Coslada, Alcalá de Henares, Arganda del Rey)", "Castellón de la Plana", "Valencia", "Barcelona", "Zaragoza", "Almería"],
    history: {
      ro: [
        "Românii au început să vină în Spania la sfârșitul anilor '90, iar numărul lor a crescut repede după 2002, odată cu ridicarea vizelor Schengen, și în anii de boom al construcțiilor de dinainte de 2008.",
        "În jurul Madridului s-au format orașe cu mulți români, precum Coslada și Alcalá de Henares, iar Castellón a devenit unul dintre cele mai românești orașe din Spania. Mulți au venit din Muntenia și Oltenia (Teleorman, Dâmbovița, Olt, Dolj), dar și din Moldova și Transilvania; mulți au lucrat sezonier în agricultură, la cules de fructe, în Huelva sau Lleida.",
      ],
      en: [
        "Romanians began arriving in Spain in the late 1990s, and their numbers grew fast after 2002, when Schengen visas were lifted, and during the construction boom before 2008.",
        "Around Madrid, towns such as Coslada and Alcalá de Henares became home to many Romanians, and Castellón became one of the most Romanian cities in Spain. Many came from Muntenia and Oltenia (Teleorman, Dâmbovița, Olt, Dolj), as well as from Moldavia and Transylvania; many worked seasonally in farming, picking fruit in Huelva or Lleida.",
      ],
      es: [
        "Los rumanos empezaron a llegar a España a finales de los años noventa, y su número creció deprisa después de 2002, cuando se suprimieron los visados Schengen, y durante el auge de la construcción anterior a 2008.",
        "Alrededor de Madrid, ciudades como Coslada y Alcalá de Henares acogieron a muchos rumanos, y Castellón se convirtió en una de las ciudades más rumanas de España. Muchos llegaron de Muntenia y Oltenia (Teleorman, Dâmbovița, Olt, Dolj), y también de Moldavia y Transilvania; muchos trabajaron como temporeros en el campo, en la fruta de Huelva o Lleida.",
      ],
    },
    records: [
      { name: "Ministerio de Justicia – Registro Civil", url: "https://www.mjusticia.gob.es", note: { ro: "certificatele de stare civilă spaniole", en: "Spanish civil status certificates", es: "certificados del Registro Civil español" } },
    ],
  },
  {
    slug: "germania", code: "DE", flag: "🇩🇪", langs: ["de", "ro", "en"], eu: true, icr: { ro: "Berlin", en: "Berlin", de: "Berlin" },
    name: { ro: "Germania", en: "Germany", de: "Deutschland" },
    where: { ro: "în Germania", en: "in Germany", de: "in Deutschland" },
    size: { ro: "peste 800.000 de cetățeni români, plus sute de mii de sași și șvabi plecați din România înainte", en: "over 800,000 Romanian citizens, plus hundreds of thousands of Saxons and Swabians who left Romania earlier", de: "über 800.000 rumänische Staatsbürger, dazu Hunderttausende Siebenbürger Sachsen und Banater Schwaben, die früher aus Rumänien kamen" },
    cities: ["München", "Nürnberg", "Stuttgart", "Frankfurt am Main", "Berlin", "Köln"],
    history: {
      ro: [
        "Germania are două straturi de emigrare din România. Primul sunt sașii din Transilvania și șvabii din Banat și Satu Mare: în anii '70 și '80 statul vest-german a plătit regimului comunist pentru plecarea lor, iar în 1990 aproape toți cei rămași au plecat. Mulți trăiesc în Bavaria și Baden-Württemberg și și-au păstrat asociațiile pe sate de origine.",
        "Al doilea strat a venit după 2007 și mai ales după 2014, când românii au putut lucra liber în Germania: muncitori, medici, ingineri, informaticieni. Pentru genealogie, asta înseamnă că o familie poate avea acte în germană, maghiară și română, iar numele aceluiași sat apare în trei forme.",
      ],
      en: [
        "Germany has two layers of emigration from Romania. The first are the Transylvanian Saxons and the Banat and Satu Mare Swabians: in the 1970s and 1980s West Germany paid the communist regime to let them leave, and in 1990 nearly all who remained left. Many live in Bavaria and Baden-Württemberg and have kept associations for each home village.",
        "The second layer came after 2007 and especially after 2014, when Romanians could work freely in Germany: workers, doctors, engineers, IT specialists. For genealogy this means one family may have records in German, Hungarian and Romanian, and the same village appears under three names.",
      ],
      de: [
        "Deutschland hat zwei Schichten der Auswanderung aus Rumänien. Die erste sind die Siebenbürger Sachsen sowie die Banater und Sathmarer Schwaben: In den 1970er- und 1980er-Jahren zahlte die Bundesrepublik dem kommunistischen Regime für ihre Ausreise, und 1990 gingen fast alle, die noch geblieben waren. Viele leben in Bayern und Baden-Württemberg und haben ihre Heimatortsgemeinschaften bewahrt.",
        "Die zweite Schicht kam nach 2007 und vor allem nach 2014, als Rumänen in Deutschland frei arbeiten durften: Arbeiter, Ärztinnen, Ingenieure, IT-Fachleute. Für die Familienforschung heißt das: Eine Familie kann Urkunden auf Deutsch, Ungarisch und Rumänisch haben, und dasselbe Dorf erscheint unter drei Namen.",
      ],
    },
    records: [
      { name: "Verband der Siebenbürger Sachsen in Deutschland", url: "https://www.siebenbuerger.de", note: { ro: "asociația sașilor, cu legături spre comunitățile pe sate (HOG)", en: "the Saxons' association, with links to home-village communities (HOG)", de: "Verband mit Verweisen auf die Heimatortsgemeinschaften (HOG)" } },
      { name: "Landsmannschaft der Banater Schwaben", url: "https://www.banater-schwaben.org", note: { ro: "asociația șvabilor bănățeni", en: "the Banat Swabians' association", de: "Verband der Banater Schwaben" } },
    ],
  },
  {
    slug: "marea-britanie", code: "GB", flag: "🇬🇧", langs: ["en", "ro"], eu: false, icr: { ro: "Londra", en: "London" },
    name: { ro: "Marea Britanie", en: "United Kingdom" },
    where: { ro: "în Marea Britanie", en: "in the UK" },
    size: { ro: "sute de mii de români; peste un milion de cereri românești la statutul de rezident după Brexit", en: "hundreds of thousands of Romanians; over a million Romanian applications to the EU Settlement Scheme", },
    cities: ["London (Harrow, Brent, Enfield, Newham)", "Birmingham", "Manchester", "Leicester", "Peterborough", "Glasgow"],
    history: {
      ro: [
        "Până în 2014 românii puteau lucra în Marea Britanie doar cu restricții, așa că veneau mai ales studenți, medici și specialiști. După ridicarea restricțiilor, la 1 ianuarie 2014, comunitatea a crescut foarte repede, iar românii au ajuns una dintre cele mai mari comunități născute în afara țării.",
        "După Brexit, cei care trăiau deja acolo și-au cerut statutul de rezident (EU Settlement Scheme), iar Marea Britanie nu mai face parte din Uniunea Europeană: pentru actele românești folosite acolo îți trebuie apostilă. Copiii născuți în Anglia, Scoția sau Țara Galilor au adesea și cetățenie română, iar transcrierea nașterii se face prin consulat.",
      ],
      en: [
        "Until 2014 Romanians could work in the UK only with restrictions, so most who came were students, doctors and specialists. When the restrictions ended on 1 January 2014 the community grew very fast, and Romanians became one of the largest foreign-born groups in the country.",
        "After Brexit, those already living there applied for settled or pre-settled status, and the UK is no longer in the European Union: Romanian documents used in the UK need an apostille. Children born in England, Scotland or Wales often also hold Romanian citizenship, and their birth is transcribed through the consulate.",
      ],
    },
    records: [
      { name: "GOV.UK – order birth, marriage and death certificates", url: "https://www.gov.uk/order-copy-birth-death-marriage-certificate", note: { ro: "actele de stare civilă din Anglia și Țara Galilor", en: "civil records for England and Wales" } },
    ],
  },
  {
    slug: "franta", code: "FR", flag: "🇫🇷", langs: ["fr", "ro", "en"], eu: true, icr: { ro: "Paris", en: "Paris", fr: "Paris" },
    name: { ro: "Franța", en: "France", fr: "France" },
    where: { ro: "în Franța", en: "in France", fr: "en France" },
    size: null,
    cities: ["Paris / Île-de-France", "Lyon", "Marseille", "Toulouse", "Strasbourg", "Nice"],
    history: {
      ro: [
        "Franța a fost multă vreme țara intelectualilor români: în perioada interbelică și în anii comunismului au trăit la Paris Constantin Brâncuși, George Enescu, Emil Cioran, Eugène Ionesco și Mircea Eliade, iar exilul anticomunist avea acolo ziarele și asociațiile lui.",
        "După 1990 și mai ales după 2007 au venit studenți, medici, muncitori și familii întregi, cele mai multe în regiunea Parisului. Mulți francezi de origine română au doar bunicii născuți în România și caută azi satul de unde au plecat aceștia: numele scrise pe franțuzește (fără ă, ș, ț) sunt primul lucru de verificat.",
      ],
      en: [
        "For a long time France was the country of Romanian intellectuals: between the wars and during communism, Constantin Brâncuși, George Enescu, Emil Cioran, Eugène Ionesco and Mircea Eliade lived in Paris, and the anti-communist exile had its newspapers and associations there.",
        "After 1990, and especially after 2007, students, doctors, workers and whole families arrived, most of them in the Paris region. Many French people of Romanian origin only have grandparents born in Romania and are now looking for their village: names written the French way (without ă, ș, ț) are the first thing to check.",
      ],
      fr: [
        "La France a longtemps été le pays des intellectuels roumains : entre les deux guerres et pendant le communisme, Constantin Brâncuși, George Enescu, Emil Cioran, Eugène Ionesco et Mircea Eliade ont vécu à Paris, et l'exil anticommuniste y avait ses journaux et ses associations.",
        "Après 1990, et surtout après 2007, sont venus des étudiants, des médecins, des ouvriers et des familles entières, surtout en Île-de-France. Beaucoup de Français d'origine roumaine n'ont que leurs grands-parents nés en Roumanie et cherchent aujourd'hui leur village : les noms écrits à la française (sans ă, ș, ț) sont la première chose à vérifier.",
      ],
    },
    records: [
      { name: "Service-Public.fr – actes d'état civil", url: "https://www.service-public.fr", note: { ro: "cum ceri acte de stare civilă franceze", en: "how to request French civil records", fr: "demander un acte d'état civil français" } },
    ],
  },
  {
    slug: "austria", code: "AT", flag: "🇦🇹", langs: ["de", "ro", "en"], eu: true, icr: { ro: "Viena", en: "Vienna", de: "Wien" },
    name: { ro: "Austria", en: "Austria", de: "Österreich" },
    where: { ro: "în Austria", en: "in Austria", de: "in Österreich" },
    size: { ro: "peste 100.000 de cetățeni români, una dintre cele mai mari comunități străine din Austria", en: "over 100,000 Romanian citizens, one of the largest foreign communities in Austria", de: "über 100.000 rumänische Staatsbürger, eine der größten ausländischen Gemeinschaften in Österreich" },
    cities: ["Wien", "Linz", "Graz", "Salzburg", "Innsbruck"],
    history: {
      ro: [
        "Legăturile sunt vechi: Transilvania, Banatul și Bucovina au făcut parte din monarhia habsburgică, iar la Viena au studiat sau au lucrat generații de români din aceste provincii. Multe acte vechi din Bucovina și Banat sunt scrise în germană.",
        "După 1990 și mai ales după 2007, Viena a atras muncitori, personal medical și studenți, iar mulți lucrează în îngrijirea bătrânilor, cu ture de câte câteva săptămâni, între Austria și satul de acasă. Pentru cine caută strămoși din Bucovina sau Banat, arhivele austriece și registrele bisericești digitizate sunt deseori primul pas.",
      ],
      en: [
        "The links are old: Transylvania, Banat and Bukovina were part of the Habsburg monarchy, and generations of Romanians from these provinces studied or worked in Vienna. Many old records from Bukovina and Banat are written in German.",
        "After 1990, and especially after 2007, Vienna attracted workers, medical staff and students, and many work in elderly care in rotations of a few weeks between Austria and their home village. For anyone tracing ancestors from Bukovina or Banat, Austrian archives and digitised church books are often the first step.",
      ],
      de: [
        "Die Verbindungen sind alt: Siebenbürgen, das Banat und die Bukowina gehörten zur Habsburgermonarchie, und Generationen von Rumänen aus diesen Ländern studierten oder arbeiteten in Wien. Viele alte Urkunden aus der Bukowina und dem Banat sind auf Deutsch.",
        "Nach 1990 und vor allem nach 2007 kamen Arbeiter, Pflegekräfte und Studierende nach Wien, und viele arbeiten in der 24-Stunden-Betreuung, im Wechsel von einigen Wochen zwischen Österreich und dem Heimatdorf. Wer Vorfahren aus der Bukowina oder dem Banat sucht, beginnt oft mit österreichischen Archiven und digitalisierten Matriken.",
      ],
    },
    records: [
      { name: "Matricula", url: "https://data.matricula-online.eu", note: { ro: "registre bisericești digitizate din Austria și din alte țări din regiune", en: "digitised church books from Austria and neighbouring countries", de: "digitalisierte Kirchenbücher aus Österreich und Nachbarländern" } },
    ],
  },
  {
    slug: "belgia", code: "BE", flag: "🇧🇪", langs: ["fr", "ro", "en"], eu: true, icr: { ro: "Bruxelles", en: "Brussels", fr: "Bruxelles" },
    name: { ro: "Belgia", en: "Belgium", fr: "Belgique" },
    where: { ro: "în Belgia", en: "in Belgium", fr: "en Belgique" },
    size: { ro: "zeci de mii de cetățeni români, mai ales în regiunea Bruxelles", en: "tens of thousands of Romanian citizens, mostly in the Brussels region", fr: "des dizaines de milliers de citoyens roumains, surtout dans la région bruxelloise" },
    cities: ["Bruxelles / Brussel", "Antwerpen", "Liège", "Gent", "Charleroi"],
    history: {
      ro: [
        "Bruxelles, capitala instituțiilor europene, a atras după 2007 atât funcționari și specialiști, cât și mulți muncitori în construcții și servicii. Comunitatea română e una dintre cele mai mari comunități de cetățeni europeni din Belgia.",
        "Belgia are trei limbi oficiale, așa că actele unei familii pot fi în franceză, neerlandeză sau germană, după comuna în care s-au făcut. Pentru actele românești folosite aici nu e nevoie de apostilă, dar traducerea poate fi cerută de comună.",
      ],
      en: [
        "Brussels, home of the European institutions, has attracted since 2007 both officials and specialists and many workers in construction and services. The Romanian community is one of the largest communities of EU citizens in Belgium.",
        "Belgium has three official languages, so a family's records may be in French, Dutch or German depending on the municipality. Romanian documents used here need no apostille, but the municipality may ask for a translation.",
      ],
      fr: [
        "Bruxelles, siège des institutions européennes, a attiré depuis 2007 des fonctionnaires et des spécialistes, mais aussi beaucoup d'ouvriers du bâtiment et des services. La communauté roumaine est l'une des plus grandes communautés de citoyens européens en Belgique.",
        "La Belgique a trois langues officielles : les actes d'une famille peuvent être en français, en néerlandais ou en allemand, selon la commune. Les actes roumains utilisés ici n'ont pas besoin d'apostille, mais la commune peut demander une traduction.",
      ],
    },
    records: [
      { name: "Archives de l'État en Belgique", url: "https://search.arch.be", note: { ro: "registrele de stare civilă și parohiale belgiene", en: "Belgian civil and parish registers", fr: "registres d'état civil et paroissiaux belges" } },
    ],
  },
  {
    slug: "irlanda", code: "IE", flag: "🇮🇪", langs: ["en", "ro"], eu: true, icr: null,
    name: { ro: "Irlanda", en: "Ireland" },
    where: { ro: "în Irlanda", en: "in Ireland" },
    size: { ro: "zeci de mii de români", en: "tens of thousands of Romanians" },
    cities: ["Dublin", "Cork", "Galway", "Limerick"],
    history: {
      ro: [
        "Românii au venit în Irlanda mai ales după 2007, în anii de creștere economică rapidă, în construcții, sănătate, IT și servicii. Dublin a devenit centrul comunității, cu asociații culturale și școli de weekend pentru copii.",
        "Irlanda e în Uniunea Europeană, deci actele de stare civilă românești se folosesc fără apostilă. Pentru cei cu rude irlandeze, registrele de stare civilă ale Irlandei sunt în mare parte online și gratuite.",
      ],
      en: [
        "Romanians came to Ireland mostly after 2007, during the years of fast economic growth, working in construction, health care, IT and services. Dublin became the centre of the community, with cultural associations and weekend schools for children.",
        "Ireland is in the European Union, so Romanian civil documents are used without an apostille. For families with Irish relatives, Ireland's civil registers are largely online and free.",
      ],
    },
    records: [
      { name: "IrishGenealogy.ie", url: "https://www.irishgenealogy.ie", note: { ro: "registrele de stare civilă irlandeze, gratuite", en: "Irish civil records, free" } },
    ],
  },
  {
    slug: "olanda", code: "NL", flag: "🇳🇱", langs: ["en", "ro"], eu: true, icr: null,
    name: { ro: "Țările de Jos", en: "Netherlands" },
    where: { ro: "în Țările de Jos", en: "in the Netherlands" },
    size: null,
    cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven"],
    history: {
      ro: [
        "Comunitatea română din Țările de Jos e mai nouă și mai mică decât în sudul Europei: după 2007 și mai ales după 2014 au venit specialiști în IT și inginerie, studenți la universitățile olandeze și muncitori în agricultură, sere și logistică.",
        "Mulți tineri români de aici au plecat singuri și țin legătura cu familia prin telefon; un arbore al familiei, completat de la distanță cu părinții și bunicii, e un fel de a păstra poveștile până nu se pierd.",
      ],
      en: [
        "The Romanian community in the Netherlands is newer and smaller than in southern Europe: after 2007, and especially after 2014, came IT and engineering specialists, students at Dutch universities, and workers in farming, greenhouses and logistics.",
        "Many young Romanians here came on their own and keep in touch with family by phone; a family tree filled in remotely with parents and grandparents is a way to keep the stories before they are lost.",
      ],
    },
    records: [
      { name: "WieWasWie", url: "https://www.wiewaswie.nl", note: { ro: "registre olandeze de stare civilă", en: "Dutch civil records" } },
      { name: "Open Archieven", url: "https://www.openarchieven.nl", note: { ro: "arhive olandeze și belgiene, căutare după nume", en: "Dutch and Belgian archives, searchable by name" } },
    ],
  },
  {
    slug: "portugalia", code: "PT", flag: "🇵🇹", langs: ["ro", "en"], eu: true, icr: { ro: "Lisabona", en: "Lisbon" },
    name: { ro: "Portugalia", en: "Portugal" },
    where: { ro: "în Portugalia", en: "in Portugal" },
    size: { ro: "zeci de mii de români", en: "tens of thousands of Romanians" },
    cities: ["Lisboa", "Porto", "Setúbal", "Faro", "Leiria"],
    history: {
      ro: [
        "Românii au venit în Portugalia mai ales în anii 2000, în construcții, agricultură și turism, iar comunitatea s-a stabilit în jurul Lisabonei și în Algarve. Portugalia e una dintre cele mai liniștite țări pentru diaspora, cu mulți români care au deschis afaceri proprii.",
        "Ca și în Spania și Italia, numele românești sunt deseori scrise greșit în actele locale (fără diacritice sau cu altă ordine a numelor), lucru de știut când cauți o rudă în registrele portugheze.",
      ],
      en: [
        "Romanians came to Portugal mostly in the 2000s, working in construction, farming and tourism, and the community settled around Lisbon and in the Algarve. Portugal is one of the calmest countries for the diaspora, and many Romanians there have opened their own businesses.",
        "As in Spain and Italy, Romanian names are often misspelled in local records (without diacritics or with a different name order), which is worth knowing when you look for a relative in Portuguese registers.",
      ],
    },
    records: [
      { name: "Digitarq", url: "https://digitarq.arquivos.pt", note: { ro: "arhivele portugheze digitizate", en: "digitised Portuguese archives" } },
    ],
  },
  {
    slug: "suedia", code: "SE", flag: "🇸🇪", langs: ["en", "ro"], eu: true, icr: { ro: "Stockholm", en: "Stockholm" },
    name: { ro: "Suedia", en: "Sweden" },
    where: { ro: "în Suedia", en: "in Sweden" },
    size: null,
    cities: ["Stockholm", "Göteborg", "Malmö", "Uppsala"],
    history: {
      ro: [
        "În Suedia au ajuns în anii '70 și '80 refugiați politici și familii care au fugit din România comunistă, iar după 1990 și 2007 au venit medici, ingineri și cercetători. Comunitatea e mică, dar foarte răspândită, de la Stockholm până în nord.",
        "Suedia are registre bisericești și de populație păstrate excelent, iar Arhivele Naționale suedeze le oferă online; pentru familiile mixte româno-suedeze, partea suedeză a arborelui se poate face adesea până în secolul al XVIII-lea.",
      ],
      en: [
        "Political refugees and families fleeing communist Romania reached Sweden in the 1970s and 1980s, and after 1990 and 2007 came doctors, engineers and researchers. The community is small but widely spread, from Stockholm to the north.",
        "Sweden has excellently preserved church and population registers, and the Swedish National Archives offer them online; for mixed Romanian-Swedish families the Swedish side of the tree can often be traced back to the 18th century.",
      ],
    },
    records: [
      { name: "Riksarkivet", url: "https://www.riksarkivet.se", note: { ro: "Arhivele Naționale ale Suediei", en: "the Swedish National Archives" } },
    ],
  },
  {
    slug: "danemarca", code: "DK", flag: "🇩🇰", langs: ["en", "ro"], eu: true, icr: null,
    name: { ro: "Danemarca", en: "Denmark" },
    where: { ro: "în Danemarca", en: "in Denmark" },
    size: null,
    cities: ["København", "Aarhus", "Odense", "Aalborg"],
    history: {
      ro: [
        "Românii au venit în Danemarca mai ales după 2007: muncitori în agricultură și ferme, în construcții și curățenie, dar și studenți atrași de universitățile daneze și specialiști în IT. Mulți au venit pentru câțiva ani și au rămas.",
        "Arhivele daneze (Rigsarkivet) au recensămintele și registrele bisericești digitizate, utile pentru familiile mixte. Pentru actele din România, consulatul de la Copenhaga și procura dată unei rude rămân căile cele mai simple.",
      ],
      en: [
        "Romanians came to Denmark mostly after 2007: workers on farms, in construction and cleaning, but also students drawn by Danish universities and IT specialists. Many came for a few years and stayed.",
        "The Danish National Archives (Rigsarkivet) have digitised censuses and church books, useful for mixed families. For records from Romania, the embassy in Copenhagen and a power of attorney given to a relative remain the simplest routes.",
      ],
    },
    records: [
      { name: "Rigsarkivet", url: "https://www.sa.dk", note: { ro: "Arhivele Naționale ale Danemarcei", en: "the Danish National Archives" } },
    ],
  },
  {
    slug: "elvetia", code: "CH", flag: "🇨🇭", langs: ["de", "fr", "ro", "en"], eu: false, icr: null,
    name: { ro: "Elveția", en: "Switzerland", de: "Schweiz", fr: "Suisse" },
    where: { ro: "în Elveția", en: "in Switzerland", de: "in der Schweiz", fr: "en Suisse" },
    size: null,
    cities: ["Zürich", "Genève", "Basel", "Lausanne", "Bern"],
    history: {
      ro: [
        "Elveția a primit după 1948 o parte din exilul românesc, iar Geneva și Zürich au avut asociații ale refugiaților anticomuniști. După 1990 au venit medici, ingineri, cercetători și studenți, iar după extinderea liberei circulații către România au venit și muncitori în construcții, agricultură și îngrijire.",
        "Elveția nu e în Uniunea Europeană, așa că actele românești folosite aici au nevoie de obicei de apostilă. Actele elvețiene sunt ținute de oficiile de stare civilă ale cantoanelor, în germană, franceză sau italiană.",
      ],
      en: [
        "After 1948 Switzerland took in part of the Romanian exile, and Geneva and Zurich had associations of anti-communist refugees. After 1990 came doctors, engineers, researchers and students, and once free movement was extended to Romania, workers in construction, farming and care followed.",
        "Switzerland is not in the European Union, so Romanian documents used here usually need an apostille. Swiss records are kept by the cantonal civil registry offices, in German, French or Italian.",
      ],
      de: [
        "Nach 1948 nahm die Schweiz einen Teil des rumänischen Exils auf, und in Genf und Zürich gab es Vereine antikommunistischer Flüchtlinge. Nach 1990 kamen Ärzte, Ingenieure, Forschende und Studierende, und mit der Personenfreizügigkeit für Rumänien auch Arbeitskräfte im Bau, in der Landwirtschaft und in der Pflege.",
        "Die Schweiz ist nicht in der EU, deshalb brauchen rumänische Urkunden hier meist eine Apostille. Schweizer Urkunden führen die kantonalen Zivilstandsämter, auf Deutsch, Französisch oder Italienisch.",
      ],
      fr: [
        "Après 1948, la Suisse a accueilli une partie de l'exil roumain, et Genève et Zurich ont eu des associations de réfugiés anticommunistes. Après 1990 sont venus des médecins, des ingénieurs, des chercheurs et des étudiants, puis, avec la libre circulation étendue à la Roumanie, des travailleurs du bâtiment, de l'agriculture et des soins.",
        "La Suisse n'est pas dans l'Union européenne : les actes roumains utilisés ici ont en général besoin d'une apostille. Les actes suisses sont tenus par les offices cantonaux de l'état civil, en allemand, en français ou en italien.",
      ],
    },
    records: [],
  },
  {
    slug: "grecia", code: "GR", flag: "🇬🇷", langs: ["en", "ro"], eu: true, icr: null,
    name: { ro: "Grecia", en: "Greece" },
    where: { ro: "în Grecia", en: "in Greece" },
    size: null,
    cities: ["Athens", "Thessaloniki", "Larissa", "Heraklion"],
    history: {
      ro: [
        "Grecia a fost printre primele destinații de după 1990, când mulți români au venit la muncă în construcții, agricultură și turism, adesea sezonier. Legăturile sunt însă mult mai vechi: aromânii trăiesc de secole în nordul Greciei, iar în secolul al XIX-lea negustori greci s-au așezat în Brăila, Galați și București.",
        "Pentru genealogie, asta înseamnă că o familie din Dobrogea sau din porturile Dunării poate avea rude în Grecia, iar o familie de aromâni poate avea acte în greacă, română și uneori bulgară.",
      ],
      en: [
        "Greece was one of the first destinations after 1990, when many Romanians came to work in construction, farming and tourism, often seasonally. The links are much older, though: Aromanians have lived in northern Greece for centuries, and in the 19th century Greek merchants settled in Brăila, Galați and Bucharest.",
        "For genealogy this means a family from Dobruja or the Danube ports may have relatives in Greece, and an Aromanian family may have records in Greek, Romanian and sometimes Bulgarian.",
      ],
    },
    records: [],
  },
  {
    slug: "cipru", code: "CY", flag: "🇨🇾", langs: ["en", "ro"], eu: true, icr: null,
    name: { ro: "Cipru", en: "Cyprus" },
    where: { ro: "în Cipru", en: "in Cyprus" },
    size: null,
    cities: ["Nicosia", "Limassol", "Larnaca", "Paphos"],
    history: {
      ro: [
        "Românii au venit în Cipru mai ales după 2007, în turism, servicii, construcții și îngrijire, iar comunitatea s-a strâns în Nicosia și Limassol. Mulți lucrează în hoteluri și restaurante pe coastă, cu sezoane lungi departe de casă.",
        "Cipru e în Uniunea Europeană, deci actele românești de stare civilă circulă fără apostilă. Pentru actele din România, ambasada de la Nicosia și procura dată unei rude sunt căile cele mai simple.",
      ],
      en: [
        "Romanians came to Cyprus mostly after 2007, working in tourism, services, construction and care, and the community gathered in Nicosia and Limassol. Many work in hotels and restaurants on the coast, spending long seasons far from home.",
        "Cyprus is in the European Union, so Romanian civil documents circulate without an apostille. For records from Romania, the embassy in Nicosia and a power of attorney given to a relative are the simplest routes.",
      ],
    },
    records: [],
  },
  {
    slug: "israel", code: "IL", flag: "🇮🇱", langs: ["he", "ro", "en"], eu: false, icr: { ro: "Tel Aviv", en: "Tel Aviv", he: "תל אביב" },
    name: { ro: "Israel", en: "Israel", he: "ישראל" },
    where: { ro: "în Israel", en: "in Israel", he: "בישראל" },
    size: { ro: "sute de mii de israelieni născuți în România sau cu părinți și bunici de acolo", en: "hundreds of thousands of Israelis born in Romania or with parents and grandparents from there", he: "מאות אלפי ישראלים שנולדו ברומניה או שהוריהם וסביהם באו משם" },
    cities: ["Tel Aviv", "Haifa", "Jerusalem", "Beersheba", "Ashdod", "Netanya"], citiesHe: ["תל אביב", "חיפה", "ירושלים", "באר שבע", "אשדוד", "נתניה"],
    history: {
      ro: [
        "Între 1948 și anii '80, sute de mii de evrei din România au emigrat în Israel, mulți după ani de așteptare a aprobării de plecare; o parte au plecat în urma unor înțelegeri prin care statul român primea bani pentru fiecare emigrant. Au venit din Moldova, Bucovina, Maramureș, Transilvania și București, iar în primele decenii româna era una dintre limbile auzite des pe stradă, cu ziare și teatru în română.",
        "După 1990 au venit și muncitori români, mai ales în construcții. Pentru genealogie, sursele principale sunt registrele comunităților evreiești din România (multe în Arhivele Naționale), registrele de stare civilă de după 1865 și bazele de date ale Yad Vashem. Vezi și pagina noastră despre rădăcinile evreiești din România.",
      ],
      en: [
        "Between 1948 and the 1980s, hundreds of thousands of Jews from Romania emigrated to Israel, many after years of waiting for permission to leave; some left under arrangements in which the Romanian state was paid for each emigrant. They came from Moldavia, Bukovina, Maramureș, Transylvania and Bucharest, and in the early decades Romanian was one of the languages often heard in the street, with Romanian-language newspapers and theatre.",
        "After 1990 Romanian workers also came, mostly in construction. For genealogy the main sources are the records of Jewish communities in Romania (many in the National Archives), civil registers from after 1865 and the Yad Vashem databases. See also our page on Jewish roots in Romania.",
      ],
      he: [
        "בין 1948 לשנות השמונים עלו לישראל מאות אלפי יהודים מרומניה, רבים מהם אחרי שנים של המתנה להיתר יציאה; חלקם יצאו במסגרת הסדרים שבהם המדינה הרומנית קיבלה תשלום עבור כל עולה. הם הגיעו ממולדובה, מבוקובינה, ממרמורש, מטרנסילבניה ומבוקרשט, ובעשורים הראשונים רומנית הייתה אחת השפות שנשמעו ברחוב, עם עיתונים ותיאטרון ברומנית.",
        "אחרי 1990 הגיעו גם עובדים מרומניה, בעיקר בבניין. לחקר המשפחה, המקורות העיקריים הם רשומות הקהילות היהודיות ברומניה (רבות מהן בארכיון הלאומי), ספרי המרשם האזרחי שאחרי 1865 ומאגרי המידע של יד ושם. ראו גם את הדף שלנו על שורשים יהודיים ברומניה.",
      ],
    },
    records: [
      { name: "Yad Vashem – Central Database of Shoah Victims' Names", url: "https://yvng.yadvashem.org", note: { ro: "numele victimelor Holocaustului, cu locul nașterii și al locuirii", en: "names of Holocaust victims, with places of birth and residence", he: "מאגר שמות נרצחי השואה, עם מקום לידה ומגורים" } },
      { name: "Israel State Archives", url: "https://www.archives.gov.il", note: { ro: "Arhivele Statului Israel", en: "the Israel State Archives", he: "ארכיון המדינה" } },
    ],
  },
  {
    slug: "statele-unite", code: "US", flag: "🇺🇸", langs: ["en", "ro"], eu: false, icr: { ro: "New York", en: "New York" },
    name: { ro: "Statele Unite", en: "United States" },
    where: { ro: "în Statele Unite", en: "in the United States" },
    size: { ro: "câteva sute de mii de americani își declară originea română", en: "several hundred thousand Americans report Romanian ancestry" },
    cities: ["New York", "Chicago", "Los Angeles", "Detroit", "Cleveland", "Sacramento"],
    history: {
      ro: [
        "Primul val mare a venit între 1895 și 1920: țărani din Transilvania și Banat, pe atunci în Austro-Ungaria, au lucrat în oțelăriile și fabricile din Ohio, Pennsylvania, Michigan, Indiana și Illinois, iar evrei din Moldova și București s-au așezat mai ales la New York. Mulți voiau să strângă bani și să se întoarcă, și unii chiar s-au întors.",
        "După al Doilea Război Mondial au venit exilați politici, iar în anii comunismului refugiați care treceau prin lagărele din Austria sau Italia. După 1990 au urmat ingineri, medici, informaticieni și câștigători ai loteriei vizelor. Pentru genealogie, listele de pasageri de la Ellis Island și dosarele de naturalizare spun adesea satul exact din care a plecat cineva.",
      ],
      en: [
        "The first big wave came between 1895 and 1920: peasants from Transylvania and Banat, then part of Austria-Hungary, worked in the steel mills and factories of Ohio, Pennsylvania, Michigan, Indiana and Illinois, while Jews from Moldavia and Bucharest settled mostly in New York. Many meant to save money and go home, and some did.",
        "After World War II came political exiles, and during communism refugees who passed through camps in Austria or Italy. After 1990 came engineers, doctors, IT specialists and diversity visa winners. For genealogy, Ellis Island passenger lists and naturalization files often name the exact village someone left.",
      ],
    },
    records: [
      { name: "Statue of Liberty – Ellis Island Foundation", url: "https://www.statueofliberty.org", note: { ro: "listele de pasageri sosiți la New York, gratuite", en: "passenger lists of arrivals in New York, free" } },
      { name: "National Archives (NARA)", url: "https://www.archives.gov", note: { ro: "recensăminte, dosare de naturalizare, liste de pasageri", en: "censuses, naturalization files, passenger lists" } },
      { name: "USCIS Genealogy Program", url: "https://www.uscis.gov/records/genealogy", note: { ro: "dosarele de imigrare și naturalizare de după 1906", en: "immigration and naturalization files after 1906" } },
    ],
  },
  {
    slug: "canada", code: "CA", flag: "🇨🇦", langs: ["en", "fr", "ro"], eu: false, icr: null,
    name: { ro: "Canada", en: "Canada", fr: "Canada" },
    where: { ro: "în Canada", en: "in Canada", fr: "au Canada" },
    size: { ro: "în jur de un sfert de milion de canadieni își declară originea română", en: "around a quarter of a million Canadians report Romanian ancestry", fr: "environ un quart de million de Canadiens déclarent des origines roumaines" },
    cities: ["Toronto", "Montréal", "Vancouver", "Calgary", "Edmonton", "Ottawa"],
    history: {
      ro: [
        "Primii români au venit în Canada la sfârșitul secolului al XIX-lea: țărani din Bucovina și Transilvania au primit pământ în preriile din Saskatchewan și Alberta, unde satul Boian, din Alberta, poartă și azi numele satului bucovinean din care au plecat.",
        "Al doilea val, mult mai mare, a venit după 1990: ingineri, informaticieni și familii tinere, mulți vorbitori de franceză, așezați la Montréal, și mulți în Toronto și în orașele din Ontario. Pentru genealogie, Library and Archives Canada are listele de pasageri și recensămintele, iar muzeul Pier 21 din Halifax păstrează istoria celor sosiți pe mare.",
      ],
      en: [
        "The first Romanians came to Canada in the late 19th century: peasants from Bukovina and Transylvania received land on the prairies of Saskatchewan and Alberta, where the hamlet of Boian, Alberta, still bears the name of the Bukovinian village its settlers came from.",
        "A second, much larger wave came after 1990: engineers, IT specialists and young families, many of them French speakers who settled in Montréal, and many in Toronto and other Ontario cities. For genealogy, Library and Archives Canada holds passenger lists and censuses, and the Pier 21 museum in Halifax keeps the history of those who arrived by sea.",
      ],
      fr: [
        "Les premiers Roumains sont arrivés au Canada à la fin du XIXe siècle : des paysans de Bucovine et de Transylvanie ont reçu des terres dans les prairies de la Saskatchewan et de l'Alberta, où le hameau de Boian, en Alberta, porte encore le nom du village bucovinien d'où venaient ses colons.",
        "Une deuxième vague, bien plus nombreuse, est venue après 1990 : ingénieurs, informaticiens et jeunes familles, souvent francophones, installés à Montréal, et beaucoup à Toronto et dans les villes de l'Ontario. Pour la généalogie, Bibliothèque et Archives Canada conserve les listes de passagers et les recensements, et le musée du Quai 21, à Halifax, garde l'histoire des arrivées par la mer.",
      ],
    },
    records: [
      { name: "Library and Archives Canada", url: "https://library-archives.canada.ca", note: { ro: "liste de pasageri, recensăminte, dosare de naturalizare", en: "passenger lists, censuses, naturalization records", fr: "listes de passagers, recensements, naturalisations" } },
      { name: "Pier 21 – Canadian Museum of Immigration", url: "https://pier21.ca", note: { ro: "istoria imigranților sosiți pe mare la Halifax", en: "the history of immigrants who arrived by sea at Halifax", fr: "l'histoire des immigrants arrivés par la mer à Halifax" } },
    ],
  },
];

/** Țările publicate: cele de bază și ciornele aprobate (src/lib/diaspora/ciorne). */
export const COUNTRIES: Country[] = withNewCountries([...BASE, ...APPROVED_COUNTRIES]);

export const getCountry = (slug: string) => COUNTRIES.find((c) => c.slug === slug) ?? null;
