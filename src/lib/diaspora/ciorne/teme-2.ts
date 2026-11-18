import type { Theme } from "../tipuri";

/**
 * Ciorne (Daniel, 18.11.2026): istoria emigrării românești pe valuri, în limba țării și în română. Marea Britanie, Franța,
 * Țările de Jos, Belgia, Irlanda. Doar fapte cunoscute sigur; cifrele sunt rotunde și aceleași ca pe paginile țărilor.
 */
export const THEMES_2: Theme[] = [
  // ---------------------------------------------------------------- Marea Britanie
  {
    slug: "istoria-romanilor-din-marea-britanie", langs: ["en", "ro"], related: ["marea-britanie"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila", "cum-intervievezi-bunicii"],
    name: { ro: "Românii din Marea Britanie: istoria valurilor de emigrare", en: "Romanians in the UK: a history of migration" },
    description: {
      ro: "De la exilații din Londra și emisiunile BBC în limba română la valul de după 2014 și statutul de rezident de după Brexit, plus actele pentru arborele familiei.",
      en: "From the exiles in London and the BBC Romanian broadcasts to the arrivals after 2014 and settled status after Brexit, plus the records you need for your family tree.",
    },
    body: {
      en: [
        { h: "Before 1990: a small community of exiles", p: [
          "Until 1990 the Romanian community in Britain was small: diplomats, students and, after the Second World War, political exiles who could not or would not go home. One of the best known was Ion Rațiu, who stayed in London from 1940, built a business there and returned to Romanian politics after 1989.",
          "From 1939 to 2008 the BBC broadcast in Romanian. During the communist years its programmes were among the few sources of independent news that people in Romania could hear, and many families still remember listening to them in secret.",
        ] },
        { h: "1990–2013: students and the first workers", p: [
          "After 1990 young Romanians came to study and work, and after Romania joined the European Union in 2007 the community grew, although until the end of 2013 access to the British labour market was still restricted for Romanian citizens.",
        ] },
        { h: "After 2014: the big wave", p: [
          "From 1 January 2014, when the last restrictions were lifted, the number of Romanians in Britain grew fast. They worked in construction, warehouses, hospitals and care homes, hospitality and IT. London became home to the largest community, with others in the Midlands, the North of England and Scotland.",
          "After Brexit, EU citizens had to apply to the EU Settlement Scheme to stay. Romanian citizens made over a million applications, one of the highest numbers of any nationality. Applications are not the same as people, since some applied more than once or later left, but the figure shows how large the community has become.",
        ] },
        { h: "Which records to look for", p: [
          "Births, marriages and deaths in England and Wales are registered with the General Register Office, in Scotland with National Records of Scotland (searchable on ScotlandsPeople) and in Northern Ireland with GRONI. Romanian citizens can have them transcribed into the Romanian registers through the consulate. For ancestors in Romania, start with the home village: it tells you which town hall holds the records and which county archive keeps the older registers.",
        ] },
      ],
      ro: [
        { h: "Înainte de 1990: o comunitate mică de exilați", p: [
          "Până în 1990, comunitatea românească din Marea Britanie a fost mică: diplomați, studenți și, după al Doilea Război Mondial, exilați politici care nu puteau sau nu voiau să se întoarcă. Unul dintre cei mai cunoscuți a fost Ion Rațiu, care a rămas la Londra din 1940, și-a făcut acolo o afacere și s-a întors în politica românească după 1989.",
          "Între 1939 și 2008, BBC a avut emisiuni în limba română. În anii comunismului, ele erau printre puținele surse de știri libere pe care oamenii din România le puteau asculta, iar multe familii își amintesc și azi că le ascultau pe ascuns.",
        ] },
        { h: "1990–2013: studenți și primii muncitori", p: [
          "După 1990 au venit tineri la studii și la muncă, iar după aderarea României la Uniunea Europeană, în 2007, comunitatea a crescut, deși până la sfârșitul lui 2013 accesul cetățenilor români pe piața muncii britanice a fost încă restrâns.",
        ] },
        { h: "După 2014: valul mare", p: [
          "De la 1 ianuarie 2014, când s-au ridicat ultimele restricții, numărul românilor din Marea Britanie a crescut repede. Au lucrat în construcții, depozite, spitale și cămine de bătrâni, în hoteluri și restaurante și în IT. Londra are cea mai mare comunitate, iar altele sunt în Midlands, în nordul Angliei și în Scoția.",
          "După Brexit, cetățenii Uniunii Europene au trebuit să ceară statutul de rezident prin EU Settlement Scheme. Cetățenii români au depus peste un milion de cereri, unul dintre cele mai mari numere dintre toate naționalitățile. Cererile nu sunt totuna cu oamenii, pentru că unii au aplicat de mai multe ori sau au plecat între timp, dar cifra arată cât de mare a ajuns comunitatea.",
        ] },
        { h: "Ce acte cauți", p: [
          "Nașterile, căsătoriile și decesele se înregistrează în Anglia și Țara Galilor la General Register Office, în Scoția la National Records of Scotland (cu căutare pe ScotlandsPeople), iar în Irlanda de Nord la GRONI. Cetățenii români le pot transcrie în registrele românești prin consulat. Pentru strămoșii din România, începe cu satul de origine: el îți spune ce primărie are actele și ce arhivă județeană păstrează registrele vechi.",
        ] },
      ],
    },
    records: [
      { name: "GOV.UK – EU Settlement Scheme statistics", url: "https://www.gov.uk/government/collections/eu-settlement-scheme-statistics", note: { ro: "cererile pentru statutul de rezident, pe naționalități", en: "Settlement Scheme applications by nationality" } },
      { name: "The National Archives (UK)", url: "https://www.nationalarchives.gov.uk", note: { ro: "Arhivele Naționale britanice, inclusiv dosarele de naturalizare", en: "UK National Archives, including naturalisation records" } },
    ],
  },
  // ---------------------------------------------------------------- Franța
  {
    slug: "istoria-romanilor-din-franta", langs: ["fr", "ro"], related: ["franta"],
    guides: ["cum-afli-satul-de-origine", "cum-scrii-povestea-familiei", "dosarul-de-la-securitate-al-bunicului"],
    name: { ro: "Românii din Franța: studenți, artiști, exilați și noua emigrare", fr: "Les Roumains en France : étudiants, artistes, exilés et nouvelle émigration" },
    description: {
      ro: "Cum s-a legat România de Franța: studenții din secolul XIX, artiștii de la Paris, exilul de după 1947 și plecările de după 1990 și 2007, plus actele pentru arborele familiei.",
      fr: "Comment la Roumanie s'est liée à la France : les étudiants du XIXe siècle, les artistes à Paris, l'exil après 1947 et les départs après 1990 et 2007, avec les archives utiles pour l'arbre familial.",
    },
    body: {
      ro: [
        { h: "Secolul XIX: Parisul studenților", p: [
          "Încă din prima jumătate a secolului XIX, fiii de boieri și de negustori din Țara Românească și Moldova au mers la studii la Paris. Mulți dintre cei care au făcut revoluția de la 1848 și Unirea din 1859 au studiat sau au trăit acolo, iar franceza a devenit limba de cultură a elitei românești pentru aproape un secol.",
        ] },
        { h: "Artiștii de la Paris", p: [
          "La începutul secolului XX, Parisul a atras artiști români care au rămas acolo pentru totdeauna. Constantin Brâncuși a ajuns la Paris în 1904 și și-a lăsat atelierul statului francez. George Enescu a studiat la Conservatorul din Paris și a murit acolo, în 1955.",
        ] },
        { h: "Exilul de după 1947", p: [
          "După instaurarea comunismului, Parisul a devenit capitala exilului românesc. Aici au trăit Emil Cioran, Eugen Ionescu (Eugène Ionesco), Paul Celan, născut la Cernăuți, și, între 1945 și 1956, Mircea Eliade. Monica Lovinescu și Virgil Ierunca au realizat de la Paris, timp de decenii, emisiuni pentru Radio Europa Liberă. Familiile multor exilați au aflat de soarta lor doar din aceste emisiuni.",
        ] },
        { h: "După 1990 și 2007", p: [
          "După 1990 au venit studenți, medici și ingineri, iar după 2007 și mai ales după 1 ianuarie 2014, când Franța a ridicat ultimele restricții pe piața muncii pentru români, comunitatea a crescut. Cei mai mulți trăiesc în regiunea Parisului, dar comunități mari sunt și la Lyon, Marsilia și Strasbourg.",
        ] },
        { h: "Numele în actele franceze", p: [
          "Mulți exilați și-au scris numele în formă franceză: Ionescu a devenit Ionesco, iar diacriticele au dispărut din aproape toate actele. În Franța, femeile căsătorite își păstrează legal numele de naștere și îl pot folosi pe al soțului ca „nume de uz”, deci o bunică poate apărea în acte cu oricare dintre ele.",
        ] },
        { h: "Ce acte cauți", p: [
          "Actele de stare civilă franceze sunt la primăria (mairie) unde s-au înregistrat; registrele vechi sunt la arhivele departamentale. Dosarele de naturalizare ale exilaților se pot afla la Arhivele Naționale ale Franței. Pentru familia din România, satul de origine îți arată primăria și arhiva județeană; iar dacă un bunic a fost urmărit pentru că avea rude în exil, dosarul lui poate fi la CNSAS.",
        ] },
      ],
      fr: [
        { h: "XIXe siècle : le Paris des étudiants", p: [
          "Dès la première moitié du XIXe siècle, des fils de boyards et de marchands de Valachie et de Moldavie sont venus étudier à Paris. Beaucoup de ceux qui ont fait la révolution de 1848 et l'Union de 1859 y ont étudié ou vécu, et le français est devenu la langue de culture de l'élite roumaine pendant près d'un siècle.",
        ] },
        { h: "Les artistes à Paris", p: [
          "Au début du XXe siècle, Paris a attiré des artistes roumains qui y sont restés pour toujours. Constantin Brâncuși est arrivé à Paris en 1904 et a légué son atelier à l'État français. George Enescu a étudié au Conservatoire de Paris et y est mort en 1955.",
        ] },
        { h: "L'exil après 1947", p: [
          "Après l'instauration du communisme, Paris est devenu la capitale de l'exil roumain. Y ont vécu Emil Cioran, Eugène Ionesco, Paul Celan, né à Czernowitz, et, de 1945 à 1956, Mircea Eliade. Monica Lovinescu et Virgil Ierunca ont réalisé depuis Paris, pendant des décennies, des émissions pour Radio Free Europe. Bien des familles n'ont eu des nouvelles de leurs exilés que par ces émissions.",
        ] },
        { h: "Après 1990 et 2007", p: [
          "Après 1990 sont arrivés des étudiants, des médecins et des ingénieurs, et après 2007, surtout depuis le 1er janvier 2014, quand la France a levé les dernières restrictions d'accès au marché du travail pour les Roumains, la communauté a grandi. La plupart vivent en Île-de-France, mais il y a aussi de grandes communautés à Lyon, Marseille et Strasbourg.",
        ] },
        { h: "Les noms dans les actes français", p: [
          "Beaucoup d'exilés ont écrit leur nom à la française : Ionescu est devenu Ionesco, et les signes diacritiques ont disparu de presque tous les actes. En France, les femmes mariées conservent légalement leur nom de naissance et peuvent utiliser celui de leur mari comme nom d'usage ; une grand-mère peut donc apparaître sous l'un ou l'autre dans les actes.",
        ] },
        { h: "Quelles archives chercher", p: [
          "Les actes d'état civil français sont à la mairie où ils ont été enregistrés ; les registres anciens sont aux archives départementales. Les dossiers de naturalisation des exilés peuvent se trouver aux Archives nationales. Pour la famille en Roumanie, le village d'origine indique la mairie et les archives du département roumain ; et si un grand-parent a été surveillé parce qu'il avait des proches en exil, son dossier peut se trouver au CNSAS, les archives de l'ancienne police politique.",
        ] },
      ],
    },
    records: [
      { name: "Archives nationales (France)", url: "https://www.archives-nationales.culture.gouv.fr", note: { ro: "Arhivele Naționale ale Franței, inclusiv dosarele de naturalizare", fr: "Archives nationales, y compris les dossiers de naturalisation" } },
      { name: "INSEE – Institut national de la statistique", url: "https://www.insee.fr", note: { ro: "străinii și imigranții din Franța, pe țări de naștere", fr: "étrangers et immigrés en France par pays de naissance" } },
    ],
  },
  // ---------------------------------------------------------------- Țările de Jos
  {
    slug: "istoria-romanilor-din-olanda", langs: ["nl", "ro"], related: ["olanda"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila", "cum-implici-familia"],
    name: { ro: "Românii din Țările de Jos: o comunitate tânără", nl: "Roemenen in Nederland: een jonge gemeenschap" },
    description: {
      ro: "Cum s-au legat românii de Țările de Jos: solidaritatea din 1989, studenții și specialiștii, valul de după 2014 și actele pentru arborele familiei.",
      nl: "Hoe Roemenen en Nederland met elkaar verbonden raakten: de solidariteit van 1989, studenten en specialisten, de groei na 2014 en welke akten je nodig hebt voor je stamboom.",
    },
    body: {
      ro: [
        { h: "Înainte de 1990", p: [
          "Până la căderea comunismului, în Țările de Jos trăiau puțini români, mai ales refugiați politici și familii mixte. Legătura dintre cele două țări a devenit vizibilă în anii 1988–1989, când comune din Belgia, Țările de Jos, Franța și Elveția au „adoptat” sate românești amenințate de planul de sistematizare, în acțiunea numită Opération Villages Roumains. După 1989, multe dintre aceste legături s-au transformat în înfrățiri, ajutoare și prietenii care durează și azi.",
        ] },
        { h: "1990–2013: studenți și specialiști", p: [
          "După 1990 au venit studenți la universitățile olandeze și specialiști, mai ales în IT, inginerie și cercetare. După aderarea României la Uniunea Europeană, în 2007, au venit și mai mulți, deși accesul liber pe piața muncii a fost restrâns până la sfârșitul lui 2013.",
        ] },
        { h: "După 2014", p: [
          "De la 1 ianuarie 2014, comunitatea a crescut și a ajuns la câteva zeci de mii de oameni. Mulți lucrează în sere și agricultură, în logistică și în depozite, dar și în spitale, universități și firme de tehnologie. Cei mai mulți trăiesc în Randstad, în jurul Amsterdamului, Rotterdamului, Haga și Utrechtului, iar mulți sezonieri lucrează în Westland și în Brabantul de Nord.",
        ] },
        { h: "Numele în actele olandeze", p: [
          "În Țările de Jos, femeile căsătorite își păstrează oficial numele de naștere și îl pot folosi pe al partenerului doar ca nume de uz, deci în registrul populației o bunică apare cu numele de fată. Diacriticele românești lipsesc adesea în acte: Răzvan devine Razvan. Un copil născut aici e înregistrat întâi la gemeente, iar actul se transcrie apoi în registrele românești; verifică atunci că numele e scris la fel în ambele, ca să nu ai două forme pentru același om.",
          "Pentru o familie cu rude în ambele țări, cel mai util e un arbore în care fiecare persoană are scrise ambele forme ale numelui, plus satul din România de unde se trage familia.",
        ] },
        { h: "Ce acte cauți", p: [
          "Actele de stare civilă olandeze sunt la primăria (gemeente) unde s-au înregistrat; registrele vechi sunt la arhivele regionale și se pot căuta pe WieWasWie. Cetățenii români transcriu actele copiilor născuți aici prin consulat. Pentru strămoșii din România, satul de origine îți arată primăria și arhiva județeană.",
        ] },
      ],
      nl: [
        { h: "Voor 1990", p: [
          "Tot de val van het communisme woonden er weinig Roemenen in Nederland, vooral politieke vluchtelingen en gemengde gezinnen. De band tussen beide landen werd zichtbaar in 1988–1989, toen gemeenten in België, Nederland, Frankrijk en Zwitserland Roemeense dorpen „adopteerden” die bedreigd werden door het systematiseringsplan, in de actie Opération Villages Roumains. Na 1989 groeiden veel van die banden uit tot stedenbanden, hulpprojecten en vriendschappen die nog steeds bestaan.",
        ] },
        { h: "1990–2013: studenten en specialisten", p: [
          "Na 1990 kwamen studenten naar Nederlandse universiteiten en kwamen specialisten, vooral in IT, techniek en onderzoek. Na de toetreding van Roemenië tot de Europese Unie in 2007 kwamen er meer, al was de toegang tot de arbeidsmarkt tot eind 2013 nog beperkt.",
        ] },
        { h: "Na 2014", p: [
          "Sinds 1 januari 2014 is de gemeenschap gegroeid tot enkele tienduizenden mensen. Velen werken in de kassen en de landbouw, in de logistiek en in distributiecentra, maar ook in ziekenhuizen, universiteiten en techbedrijven. De meesten wonen in de Randstad, rond Amsterdam, Rotterdam, Den Haag en Utrecht, en veel seizoenswerkers werken in het Westland en in Noord-Brabant.",
        ] },
        { h: "Namen in Nederlandse akten", p: [
          "In Nederland houden getrouwde vrouwen officieel hun geboortenaam en kunnen ze de naam van hun partner alleen als gebruiksnaam voeren; in de basisregistratie personen staat een grootmoeder dus onder haar meisjesnaam. Roemeense diakritische tekens ontbreken vaak in akten: Răzvan wordt Razvan. Een kind dat hier geboren wordt, wordt eerst bij de gemeente ingeschreven en de akte wordt daarna in de Roemeense registers overgeschreven; controleer dan dat de naam in beide hetzelfde is geschreven, zodat dezelfde persoon niet twee namen krijgt.",
          "Voor een familie met verwanten in beide landen is een stamboom het nuttigst waarin bij iedereen beide vormen van de naam staan, plus het Roemeense dorp waar de familie vandaan komt.",
        ] },
        { h: "Welke akten je zoekt", p: [
          "Nederlandse akten van de burgerlijke stand liggen bij de gemeente waar ze zijn opgemaakt; oude registers liggen bij de regionale archieven en zijn te doorzoeken via WieWasWie. Roemeense staatsburgers laten de akten van hier geboren kinderen via het consulaat overschrijven. Voor voorouders in Roemenië wijst het dorp van herkomst je naar het gemeentehuis en het provinciale archief.",
        ] },
      ],
    },
    records: [
      { name: "WieWasWie", url: "https://www.wiewaswie.nl", note: { ro: "registrele de stare civilă și ale populației din Țările de Jos, digitalizate", nl: "gedigitaliseerde akten van de burgerlijke stand en bevolkingsregisters" } },
      { name: "CBS – Centraal Bureau voor de Statistiek", url: "https://www.cbs.nl", note: { ro: "populația Țărilor de Jos, pe țări de origine", nl: "bevolking van Nederland naar herkomstland" } },
    ],
  },
  // ---------------------------------------------------------------- Belgia
  {
    slug: "istoria-romanilor-din-belgia", langs: ["fr", "ro"], related: ["belgia"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila", "cum-implici-familia"],
    name: { ro: "Românii din Belgia: de la satele adoptate la Bruxelles-ul european", fr: "Les Roumains en Belgique : des villages adoptés à la Bruxelles européenne" },
    description: {
      ro: "Cum s-au legat românii de Belgia: acțiunea Opération Villages Roumains din 1988–1989, valul de după 2007, Bruxelles-ul instituțiilor europene și actele pentru arborele familiei.",
      fr: "Comment les Roumains se sont liés à la Belgique : l'Opération Villages Roumains de 1988–1989, l'arrivée après 2007, la Bruxelles des institutions européennes et les archives pour l'arbre familial.",
    },
    body: {
      ro: [
        { h: "1988–1989: satele adoptate", p: [
          "În 1988, când regimul comunist anunța planul de sistematizare care urma să desființeze mii de sate, în Belgia a pornit acțiunea Opération Villages Roumains: comune belgiene au „adoptat” sate românești și au trimis scrisori de protest autorităților de la București. Acțiunea s-a răspândit apoi în Țările de Jos, Franța și Elveția, iar după 1989 multe dintre legături au devenit înfrățiri, ajutoare și prietenii între familii.",
        ] },
        { h: "După 1990 și 2007", p: [
          "După 1990 au venit studenți și primii muncitori. După aderarea României la Uniunea Europeană, în 2007, și mai ales după 1 ianuarie 2014, comunitatea a crescut la câteva zeci de mii de oameni, mulți în construcții, transport și servicii. Cei mai mulți trăiesc în regiunea Bruxelles, dar și în Flandra și Valonia.",
          "Bruxelles-ul are și o comunitate aparte: românii care lucrează la instituțiile Uniunii Europene, la reprezentanța României și în organizațiile din jurul lor. Pentru mulți copii născuți aici, limbile casei sunt româna și franceza sau neerlandeza deodată.",
        ] },
        { h: "Numele în actele belgiene", p: [
          "În Belgia, femeile căsătorite își păstrează legal numele de naștere, deci o bunică apare adesea în actele belgiene cu numele de fată. Diacriticele românești lipsesc adesea în acte: Ștefan devine Stefan. Pentru ca același om să nu aibă două nume diferite, verifică la transcrierea în actele românești că numele e scris la fel.",
          "Familiile de români din Belgia au adesea rude și în alte țări: un frate în Italia, unul în Spania, părinții acasă. Un arbore comun, completat de fiecare, adună toate aceste ramuri într-un singur loc.",
        ] },
        { h: "Ce acte cauți", p: [
          "Actele de stare civilă belgiene sunt la comuna (commune, gemeente) unde s-au înregistrat; registrele vechi sunt la Arhivele Statului din Belgia. Cetățenii români transcriu prin consulat actele copiilor născuți aici. Pentru strămoșii din România, primul pas e satul de origine: iar dacă satul tău a fost adoptat în 1989 de o comună belgiană, povestea lui se poate afla și de acolo.",
        ] },
      ],
      fr: [
        { h: "1988–1989 : les villages adoptés", p: [
          "En 1988, quand le régime communiste annonçait le plan de « systématisation » qui devait raser des milliers de villages, la Belgique a lancé l'Opération Villages Roumains : des communes belges ont « adopté » des villages roumains et envoyé des lettres de protestation aux autorités de Bucarest. L'action s'est ensuite étendue aux Pays-Bas, à la France et à la Suisse, et après 1989 beaucoup de ces liens sont devenus des jumelages, des projets d'aide et des amitiés entre familles.",
        ] },
        { h: "Après 1990 et 2007", p: [
          "Après 1990 sont arrivés des étudiants et les premiers travailleurs. Après l'adhésion de la Roumanie à l'Union européenne en 2007, et surtout depuis le 1er janvier 2014, la communauté a atteint plusieurs dizaines de milliers de personnes, nombreuses dans la construction, le transport et les services. La plupart vivent dans la région bruxelloise, mais aussi en Flandre et en Wallonie.",
          "Bruxelles compte aussi une communauté particulière : les Roumains qui travaillent dans les institutions de l'Union européenne, à la représentation de la Roumanie et dans les organisations qui les entourent. Pour beaucoup d'enfants nés ici, les langues de la maison sont à la fois le roumain et le français ou le néerlandais.",
        ] },
        { h: "Les noms dans les actes belges", p: [
          "En Belgique, les femmes mariées conservent légalement leur nom de naissance ; une grand-mère apparaît donc souvent dans les actes belges sous son nom de jeune fille. Les signes diacritiques roumains manquent souvent dans les actes : Ștefan devient Stefan. Pour que la même personne n'ait pas deux noms différents, vérifiez lors de la transcription dans les registres roumains que le nom est écrit de la même façon.",
          "Les familles roumaines de Belgique ont souvent des proches dans d'autres pays : un frère en Italie, un autre en Espagne, les parents au pays. Un arbre commun, complété par chacun, réunit toutes ces branches au même endroit.",
        ] },
        { h: "Quelles archives chercher", p: [
          "Les actes d'état civil belges sont à la commune où ils ont été enregistrés ; les registres anciens sont aux Archives de l'État en Belgique. Les citoyens roumains font transcrire par le consulat les actes des enfants nés ici. Pour les ancêtres en Roumanie, la première étape est le village d'origine : et si votre village a été adopté en 1989 par une commune belge, son histoire peut aussi se retrouver de ce côté-ci.",
        ] },
      ],
    },
    records: [
      { name: "Archives de l'État en Belgique", url: "https://search.arch.be", note: { ro: "Arhivele Statului din Belgia, cu registrele de stare civilă vechi", fr: "Archives de l'État, avec les registres d'état civil anciens" } },
      { name: "Statbel", url: "https://statbel.fgov.be", note: { ro: "populația din Belgia, pe cetățenii", fr: "population de la Belgique par nationalité" } },
    ],
  },
  // ---------------------------------------------------------------- Irlanda
  {
    slug: "istoria-romanilor-din-irlanda", langs: ["en", "ro"], related: ["irlanda"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila", "cum-implici-familia"],
    name: { ro: "Românii din Irlanda: o comunitate formată după 2007", en: "Romanians in Ireland: a community built after 2007" },
    description: {
      ro: "Cum s-a format comunitatea românească din Irlanda: primii veniți, permisele de muncă până în 2012, creșterea de după și actele pentru arborele familiei.",
      en: "How the Romanian community in Ireland took shape: the first arrivals, work permits until 2012, the growth that followed and the records you need for your family tree.",
    },
    body: {
      en: [
        { h: "The first arrivals", p: [
          "Before 2000 very few Romanians lived in Ireland. The first came around the turn of the century, during the years of fast economic growth, many to work in construction, hospitality and food processing.",
        ] },
        { h: "2007–2012: work permits", p: [
          "When Romania joined the European Union in 2007, Ireland, unlike for the countries that joined in 2004, kept work permit requirements for Romanian and Bulgarian citizens. They were lifted in 2012, and from then on the community grew steadily.",
        ] },
        { h: "Today", p: [
          "Today tens of thousands of Romanians live in Ireland. Many work in healthcare, technology, construction, transport and services. Dublin has the largest community, and a second generation is now growing up between the two countries.",
        ] },
        { h: "Names in Irish records", p: [
          "Romanian diacritics are often missing from Irish records, so Ștefan may appear as Stefan and Țurcanu as Turcanu. Married women may keep their birth surname or use their husband's, so a grandmother may appear under either. When you transcribe an Irish certificate into the Romanian registers, check that each name is written the same way, so one person does not end up with two names.",
          "Many Romanian families in Ireland also have relatives in Italy, Spain, the UK or Germany. A shared family tree, which each relative fills in from wherever they live, brings all those branches together in one place, and the grandparents back home can add the names and villages that only they remember.",
          "For children born in Ireland, the best moment to start is while the grandparents are still there to answer: a video call with old photographs on screen, recorded with their permission, often brings back three or four generations of names.",
        ] },
        { h: "Which records to look for", p: [
          "Irish births, marriages and deaths are registered with the General Register Office, and historical civil records are searchable on irishgenealogy.ie. Romanian citizens can have their children's Irish certificates transcribed into the Romanian registers through the embassy in Dublin. For ancestors in Romania, the home village tells you which town hall and which county archive hold the records.",
        ] },
      ],
      ro: [
        { h: "Primii veniți", p: [
          "Înainte de 2000, în Irlanda trăiau foarte puțini români. Primii au venit în jurul anului 2000, în anii de creștere economică rapidă, mulți la muncă în construcții, în hoteluri și restaurante și în industria alimentară.",
        ] },
        { h: "2007–2012: permisele de muncă", p: [
          "Când România a intrat în Uniunea Europeană, în 2007, Irlanda a păstrat, spre deosebire de țările intrate în 2004, obligația permisului de muncă pentru cetățenii români și bulgari. Ea a fost ridicată în 2012, iar de atunci comunitatea a crescut constant.",
        ] },
        { h: "Azi", p: [
          "Azi trăiesc în Irlanda câteva zeci de mii de români. Mulți lucrează în sănătate, în tehnologie, în construcții, transport și servicii. Dublinul are cea mai mare comunitate, iar o a doua generație crește acum între cele două țări.",
        ] },
        { h: "Numele în actele irlandeze", p: [
          "Diacriticele românești lipsesc adesea în actele irlandeze, deci Ștefan poate apărea ca Stefan, iar Țurcanu ca Turcanu. Femeile căsătorite își pot păstra numele de naștere sau îl pot folosi pe al soțului, deci o bunică poate apărea cu oricare dintre ele. Când transcrii un certificat irlandez în registrele românești, verifică dacă fiecare nume e scris la fel, ca același om să nu aibă două nume.",
          "Multe familii de români din Irlanda au rude și în Italia, Spania, Marea Britanie sau Germania. Un arbore comun, pe care fiecare îl completează de unde trăiește, adună toate aceste ramuri într-un loc, iar bunicii de acasă pot adăuga numele și satele pe care doar ei le mai știu.",
          "Pentru copiii născuți în Irlanda, cel mai bun moment să începi e cât bunicii sunt încă aici să răspundă: un apel video cu pozele vechi pe ecran, înregistrat cu acordul lor, aduce adesea înapoi numele a trei sau patru generații.",
        ] },
        { h: "Ce acte cauți", p: [
          "Nașterile, căsătoriile și decesele din Irlanda se înregistrează la General Register Office, iar actele istorice se pot căuta pe irishgenealogy.ie. Cetățenii români pot transcrie certificatele irlandeze ale copiilor în registrele românești prin ambasada de la Dublin. Pentru strămoșii din România, satul de origine îți arată primăria și arhiva județeană care au actele.",
        ] },
      ],
    },
    records: [
      { name: "irishgenealogy.ie", url: "https://www.irishgenealogy.ie", note: { ro: "registrele de stare civilă istorice ale Irlandei", en: "Ireland's historical civil records" } },
      { name: "CSO – Central Statistics Office", url: "https://www.cso.ie", note: { ro: "recensământul Irlandei, pe cetățenii", en: "Census of Ireland by nationality" } },
    ],
  },
];
