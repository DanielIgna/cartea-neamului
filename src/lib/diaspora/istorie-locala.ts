/**
 * Istoria românilor pe state și provincii (Daniel, 18.11.2026: „scrie pentru toate statele din SUA și din Canada”), în română și
 * engleză, doar din fapte verificate, cu sursele lângă. CIORNĂ: nu apare pe site și nu face nicio pagină indexabilă până nu o
 * aprobă Daniel (ISTORIE_LOCALA_APROBATA = true). Atunci paragrafele se adaugă la textul paginii statului sau provinciei
 * (src/lib/diaspora/america.ts), iar statele care nu aveau text intră în Google.
 *
 * Statele fără nicio istorie românească documentată rămân în afara Google până găsim fapte (pragul paginilor de diaspora).
 * Recenzia: /mnt/project-files/seo-sua-canada/istorie-state-ciorna.md (scripts/istorie-locala-md.ts).
 */
// Aprobată de Daniel la 19.11.2026 („publicale pe cele de pe America și Canada prima dată”).
export const ISTORIE_LOCALA_APROBATA = true;

export type LocalHistory = { ro: string[]; en: string[]; sources: string[] };

const GALE = "Encyclopedia.com (Gale), „Romanian Americans”";
const ACS_COUNTY = "US Census Bureau, American Community Survey 2017–2021, români născuți în România pe comitate (prin Wikipedia, „Romanian Americans”)";
const HATEGAN = "Pr. Vasile Hațegan, „The Macedo-Romanians in America”, retipărit de Societatea Fărșărotul";

export const ISTORIE_LOCALA: Record<string, LocalHistory> = {
  /* ---------- State fără text până acum ---------- */
  "north-dakota": {
    ro: [
      "În Dakota de Nord, în anii 1920 trăiau coloniști români în zona orașului Dickinson, în vestul statului.",
      "În 1926, regina Maria a României a traversat statul cu trenul, cu principesa Ileana și principele Nicolae, și s-a oprit la Fargo, Bismarck, Mandan și Medora. În zona Dickinson, regina și principesa au îmbrăcat costume populare ca să-i salute pe coloniștii români.",
      "Pentru urmașii lor, dosarele de homestead, recensămintele din 1910–1940 și actele de naturalizare ale comitatului Stark sunt cele mai bune surse pentru a afla satul de plecare.",
    ],
    en: [
      "In North Dakota, Romanian settlers were living around Dickinson, in the west of the state, by the 1920s.",
      "In 1926 Queen Marie of Romania crossed the state by train with Princess Ileana and Prince Nicholas, stopping at Fargo, Bismarck, Mandan and Medora. Near Dickinson the queen and the princess wore Romanian folk costume to greet the Romanian settlers.",
      "For their descendants, homestead files, the 1910–1940 censuses and Stark County naturalization records are the best places to find the home village.",
    ],
    sources: ["Prairie Public, Dakota Datebook, „Romanian Royal Visit” (2021)", "US National Archives, homestead land entry files"],
  },
  iowa: {
    ro: [
      "Una dintre primele urme românești din Iowa e a lui George Pomutz, ofițer născut în Gyula, într-o familie de români, care a luptat în Războiul Civil american în Regimentul 15 de voluntari din Iowa, la Shiloh, Corinth și Vicksburg, și a ajuns general de brigadă.",
      "Românii veniți mai târziu în Iowa, după 1990, sunt puțini și răspândiți; pentru cei veniți la început de secol XX, recensămintele și actele de naturalizare ale statului notează țara și limba maternă.",
    ],
    en: [
      "One of the earliest Romanian traces in Iowa is George Pomutz, an officer born in Gyula to a Romanian family, who fought in the Civil War with the 15th Iowa Volunteer Infantry at Shiloh, Corinth and Vicksburg and was promoted to brigadier general.",
      "Romanians who came to Iowa after 1990 are few and scattered; for those who arrived in the early 20th century, state censuses and naturalization records give the country and mother tongue.",
    ],
    sources: [GALE],
  },
  "south-carolina": {
    ro: [
      "Primul român despre care știm că a trăit în America a stat în Carolina de Sud: Samuel Damian, preot din Transilvania, își anunța în 1748 în ziarul South Carolina Gazette demonstrațiile cu electricitate. Benjamin Franklin îl pomenește în scrisori din 1753 și 1755. Damian a plecat apoi în Jamaica.",
      "Familiile românești de azi din Carolina de Sud au venit mai ales după 1990, iar actele și rudele lor sunt de obicei încă în România.",
    ],
    en: [
      "The first Romanian known to have lived in America lived in South Carolina: Samuel Damian, a priest from Transylvania, advertised his electrical demonstrations in the South Carolina Gazette in 1748. Benjamin Franklin mentions him in letters from 1753 and 1755. Damian later left for Jamaica.",
      "Today's Romanian families in South Carolina mostly arrived after 1990, and their records and relatives are usually still in Romania.",
    ],
    sources: [GALE, "Wikipedia, „Romanian Americans” (scrisorile lui Benjamin Franklin)"],
  },
  "rhode-island": {
    ro: [
      "Rhode Island are una dintre cele mai vechi comunități aromâne din America. La începutul secolului XX, aromâni din Balcani au venit să lucreze în fabricile de textile din Woonsocket și Pawtucket, iar la Woonsocket au întemeiat în 1912 o parohie a lor.",
      "Numele aromâne apar în acte adesea în formă grecească sau albaneză. Pentru urmașii lor, listele de sosire de la New York și registrele orașelor textile din Rhode Island sunt sursele de pornire.",
    ],
    en: [
      "Rhode Island has one of the oldest Aromanian communities in America. In the early 20th century Aromanians from the Balkans came to work in the textile mills of Woonsocket and Pawtucket, and in Woonsocket they founded their own parish in 1912.",
      "Aromanian names often appear in records in Greek or Albanian spelling. For their descendants, New York arrival lists and the records of Rhode Island's mill towns are the place to start.",
    ],
    sources: [HATEGAN],
  },
  connecticut: {
    ro: [
      "În Connecticut s-au așezat la începutul secolului XX aromâni din Balcani, mai ales la Bridgeport, unde au întemeiat o parohie în 1924. Societatea aromânilor Fărșărotul, înființată la New York în 1903, și-a mutat mai târziu sediul tot la Bridgeport.",
      "Mulți au lucrat în fabrici și au deschis restaurante. Registrele orașului Bridgeport și listele de sosire de la New York ajută la găsirea satului de plecare din Balcani.",
    ],
    en: [
      "In the early 20th century Aromanians from the Balkans settled in Connecticut, especially in Bridgeport, where they founded a parish in 1924. The Farsarotul Society, founded in New York in 1903, later moved its headquarters to Bridgeport.",
      "Many worked in factories and opened restaurants. Bridgeport city records and New York arrival lists help find the home village in the Balkans.",
    ],
    sources: [HATEGAN],
  },
  massachusetts: {
    ro: [
      "La începutul secolului XX, aromâni din Balcani au venit în Massachusetts să lucreze în industria textilă, la Southbridge și Worcester, unde au avut și o parohie a lor.",
      "Pentru familiile primului val, recensămintele din 1910–1940 și registrele orașelor textile sunt cele mai bune surse.",
    ],
    en: [
      "In the early 20th century Aromanians from the Balkans came to Massachusetts to work in the textile industry, in Southbridge and Worcester, where they also had their own parish.",
      "For families of the first wave, the 1910–1940 censuses and mill-town records are the best sources.",
    ],
    sources: [HATEGAN],
  },
  missouri: {
    ro: [
      "St. Louis a avut la începutul secolului XX o comunitate de aromâni din Balcani, care au întemeiat, împreună cu cei din New York și din alte orașe, propriile parohii și societăți.",
      "Pentru urmașii lor, recensămintele orașului St. Louis și actele de naturalizare notează țara de origine; pentru aromâni ea poate fi un stat balcanic sau Imperiul Otoman, după locul și anul plecării.",
    ],
    en: [
      "In the early 20th century St. Louis had a community of Aromanians from the Balkans, who founded their own parishes and societies together with those in New York and other cities.",
      "For their descendants, St. Louis censuses and naturalization records give the country of origin; for Aromanians it may be a Balkan state or the Ottoman Empire, depending on where and when they left.",
    ],
    sources: [HATEGAN],
  },
  "new-hampshire": {
    ro: [
      "La Nashua, în New Hampshire, s-au așezat la începutul secolului XX familii de aromâni din Balcani; printre ele, familia Tamposi, cu părinți din satul Avdela, din munții Pindului.",
      "Ca și în restul Noii Anglii, mulți au lucrat întâi în fabricile de textile. Registrele orașului și recensămintele din 1910–1940 arată anul sosirii și limba maternă.",
    ],
    en: [
      "In the early 20th century Aromanian families from the Balkans settled in Nashua, New Hampshire, among them the Tamposi family, whose parents came from the village of Avdela in the Pindus Mountains.",
      "As elsewhere in New England, many first worked in the textile mills. City records and the 1910–1940 censuses give the year of arrival and the mother tongue.",
    ],
    sources: [HATEGAN],
  },
  georgia: {
    ro: [
      "Comunitatea românească din Georgia s-a format mai ales după 1990, în zona metropolitană Atlanta. Comitatul Gwinnett, la nord-est de Atlanta, avea în 2017–2021 aproximativ 3.700 de oameni născuți în România, unul dintre cele mai mari grupuri din SUA.",
      "Atlanta și Bucureștiul sunt orașe înfrățite din 1994, iar la Jocurile Olimpice de la Atlanta din 1996 comisia de înfrățire a ajutat la găzduirea echipei de gimnastică a României. Cei mai mulți au părinții și bunicii în România, deci sursele pentru arbore sunt acolo.",
    ],
    en: [
      "Georgia's Romanian community took shape mostly after 1990, in metro Atlanta. Gwinnett County, northeast of Atlanta, had about 3,700 Romania-born residents in 2017–2021, one of the largest groups in the US.",
      "Atlanta and Bucharest have been sister cities since 1994, and during the 1996 Atlanta Olympics the sister-city commission helped host Romania's gymnastics team. Most families have parents and grandparents in Romania, so the records for the tree are there.",
    ],
    sources: [ACS_COUNTY, "Atlanta Sister Cities Commission, Bucharest"],
  },
  arizona: {
    ro: [
      "Arizona are o comunitate românească formată mai ales după 1990, în jurul orașului Phoenix: comitatul Maricopa avea în 2017–2021 aproximativ 5.400 de oameni născuți în România, al patrulea grup ca mărime din SUA după comitatele Cook, Queens și Los Angeles.",
      "România are un consulat onorific la Phoenix. Pentru familiile de aici, cele mai multe acte și amintiri sunt încă în România, la părinți și bunici.",
    ],
    en: [
      "Arizona's Romanian community grew mostly after 1990 around Phoenix: Maricopa County had about 5,400 Romania-born residents in 2017–2021, the fourth-largest group in the US after Cook County, Queens and Los Angeles County.",
      "Romania has an honorary consulate in Phoenix. For families here, most records and memories are still in Romania, with parents and grandparents.",
    ],
    sources: [ACS_COUNTY],
  },

  /* ---------- Completări pentru statele și provinciile care au deja text ---------- */
  ohio: {
    ro: [
      "La Cleveland trăiau la începutul Primului Război Mondial cam 12.000 de români, mulți în vestul orașului, între străzile West 45th și West 65th. Aici s-a organizat în 1904 prima parohie ortodoxă română din SUA, în 1905 una greco-catolică, iar din 1906 apare ziarul America, al Uniunii și Ligii Societăților Românești. După război, aproape jumătate s-au întors acasă; după 1948 au mai venit cam 2.000 de refugiați.",
    ],
    en: [
      "By the start of the First World War about 12,000 Romanians lived in Cleveland, many on the west side between West 45th and West 65th streets. The first Romanian Orthodox parish in the US was organized here in 1904, a Greek-Catholic one in 1905, and the newspaper America of the Union and League of Romanian Societies has appeared since 1906. After the war nearly half went home; from 1948 about 2,000 refugees arrived.",
    ],
    sources: ["Case Western Reserve University, Encyclopedia of Cleveland History, „Romanians”", GALE],
  },
  indiana: {
    ro: [
      "La Indianapolis, românii s-au așezat la început de secol XX în cartierul Haughville și lângă râul White, lucrând în abatoare și în industria auto. În 1908 ziarul Indianapolis News număra cam 1.000 de români. Au avut societăți de ajutor (Steaua Română, 1908), un club înființat în 1909 și o parohie din 1910. În noiembrie 1926, regina Maria a României a vizitat orașul.",
    ],
    en: [
      "In Indianapolis, Romanians settled in the early 20th century in Haughville and near the White River, working in meatpacking and the car industry. In 1908 the Indianapolis News counted about 1,000 Romanians. They had mutual aid societies (the Romanian Star, 1908), a club founded in 1909 and a parish from 1910. In November 1926 Queen Marie of Romania visited the city.",
    ],
    sources: ["Encyclopedia of Indianapolis, „Romanians”"],
  },
  minnesota: {
    ro: [
      "Muncitorii români din abatoarele din South St. Paul și-au ridicat în 1924 o biserică proprie, după planurile arhitectului Emil Neagoe; clădirea e trecută din 2004 în Registrul național al locurilor istorice al SUA.",
    ],
    en: [
      "The Romanian meatpacking workers of South St. Paul built their own church in 1924, designed by architect Emil Neagoe; since 2004 the building has been listed on the US National Register of Historic Places.",
    ],
    sources: ["National Register of Historic Places, St. Stefan's Romanian Orthodox Church (2004)"],
  },
  illinois: {
    ro: [
      "Comitatul Cook, cu orașul Chicago, are cel mai mare grup de oameni născuți în România din SUA: aproximativ 11.600 în 2017–2021. Tot aici își au sediul mai multe ziare, televiziuni și asociații românești din America.",
    ],
    en: [
      "Cook County, home to Chicago, has the largest group of Romania-born residents in the US: about 11,600 in 2017–2021. Several Romanian American newspapers, TV channels and associations are based here.",
    ],
    sources: [ACS_COUNTY, GALE],
  },
  "new-york": {
    ro: [
      "Între 1881 și 1914 au plecat din România cam 75.000 de evrei, cei mai mulți la New York. Azi, Queens are cel mai mare grup de oameni născuți în România din oraș, aproximativ 7.100 în 2017–2021, urmat de Manhattan și Brooklyn.",
    ],
    en: [
      "Between 1881 and 1914 about 75,000 Jews left Romania, most of them for New York. Today Queens has the city's largest group of Romania-born residents, about 7,100 in 2017–2021, followed by Manhattan and Brooklyn.",
    ],
    sources: [ACS_COUNTY, "Wikipedia, „Romanian Americans”"],
  },
  california: {
    ro: [
      "Primii români din California au venit în 1849, în goana după aur; n-au avut noroc și au plecat spre Mexic. Azi, comitatele Los Angeles (aproximativ 6.100), Orange (4.400) și Sacramento (2.300) au cele mai mari grupuri de oameni născuți în România din stat (2017–2021).",
    ],
    en: [
      "The first Romanians in California came in 1849, during the Gold Rush; they had no luck and moved on to Mexico. Today Los Angeles County (about 6,100), Orange County (4,400) and Sacramento County (2,300) have the state's largest groups of Romania-born residents (2017–2021).",
    ],
    sources: [GALE, ACS_COUNTY],
  },
  washington: {
    ro: ["Comitatul King, cu Seattle, avea în 2017–2021 aproximativ 4.100 de oameni născuți în România, unul dintre cele mai mari grupuri din SUA."],
    en: ["King County, home to Seattle, had about 4,100 Romania-born residents in 2017–2021, one of the largest groups in the US."],
    sources: [ACS_COUNTY],
  },
  florida: {
    ro: ["Comitatele Broward (aproximativ 3.600) și Palm Beach (2.400), în sudul statului, au cele mai mari grupuri de oameni născuți în România din Florida (2017–2021)."],
    en: ["Broward County (about 3,600) and Palm Beach County (2,400), in South Florida, have the state's largest groups of Romania-born residents (2017–2021)."],
    sources: [ACS_COUNTY],
  },
  alberta: {
    ro: [
      "Primele două familii din Boian au ajuns în Alberta în 1898; le-au urmat cam o sută de familii bucovinene. Biserica Sfânta Maria din Boian, începută în toamna lui 1903 și terminată în vara lui 1905, a fost centrul satului. Alberta avea în 2016 aproximativ 34.200 de oameni de origine română.",
    ],
    en: [
      "The first two families from Boian reached Alberta in 1898, followed by about a hundred more Bukovinian families. St. Mary's church in Boian, begun in the autumn of 1903 and finished in the summer of 1905, was the centre of the village. In 2016 Alberta had about 34,200 people of Romanian origin.",
    ],
    sources: ["Wikipedia, „Boian, Alberta”", "Wikipedia, „Romanian Canadians”", "The Canadian Encyclopedia, „Romanian Canadians”"],
  },
  saskatchewan: {
    ro: [
      "După 1895, români din Transilvania și Bucovina s-au așezat lângă Dysart, iar din 1905 în jurul satelor Kayville și Dahinda, apoi la Elm Springs, Flintoft și Wood Mountain. Peste 80% au fost fermieri pe loturi de homestead. La Regina, parohia Sfântul Nicolae, întemeiată în 1902, e socotită cea mai veche parohie ortodoxă română din America de Nord, iar clădirea ei e a doua cea mai veche din centrul orașului.",
    ],
    en: [
      "After 1895 Romanians from Transylvania and Bukovina settled near Dysart, from 1905 around Kayville and Dahinda, and later at Elm Springs, Flintoft and Wood Mountain. More than 80% were homesteaders. In Regina, St. Nicholas parish, founded in 1902, is considered the oldest Romanian Orthodox parish in North America, and its building is the second-oldest in downtown Regina.",
    ],
    sources: ["Encyclopedia of Saskatchewan, „Romanian Settlements”"],
  },
  manitoba: {
    ro: ["Pe granița dintre Saskatchewan și Manitoba, în jurul localităților Inglis, Shell Valley, Lennard și MacNutt, existau sate de fermieri români încă din 1906."],
    en: ["Along the Saskatchewan–Manitoba border, around Inglis, Shell Valley, Lennard and MacNutt, Romanian farming settlements existed by 1906."],
    sources: ["Encyclopedia of Saskatchewan, „Romanian Settlements”", "The Canadian Encyclopedia, „Romanian Canadians”"],
  },
  ontario: {
    ro: ["După al Doilea Război Mondial, refugiați români, mulți cu meserii liberale, s-au așezat la Toronto, Hamilton, London și Windsor. În 2016, Ontario avea aproximativ 98.200 de oameni de origine română, dintre care 50.500 la Toronto."],
    en: ["After the Second World War, Romanian refugees, many of them professionals, settled in Toronto, Hamilton, London and Windsor. In 2016 Ontario had about 98,200 people of Romanian origin, 50,500 of them in Toronto."],
    sources: ["The Canadian Encyclopedia, „Romanian Canadians”"],
  },
  quebec: {
    ro: ["Montréalul a atras români încă de la primele valuri, în parte pentru că franceza era a doua limbă învățată în România. În 2016, Québecul avea aproximativ 53.100 de oameni de origine română."],
    en: ["Montreal drew Romanians from the earliest waves, partly because French was traditionally the second language learned in Romania. In 2016 Quebec had about 53,100 people of Romanian origin."],
    sources: ["The Canadian Encyclopedia, „Romanian Canadians”"],
  },
  "british-columbia": {
    ro: ["În 2016, Columbia Britanică avea aproximativ 31.300 de oameni de origine română."],
    en: ["In 2016 British Columbia had about 31,300 people of Romanian origin."],
    sources: ["The Canadian Encyclopedia, „Romanian Canadians”"],
  },
};

/** Paragrafele de adăugat la o pagină de stat sau provincie: nimic cât ciorna nu e aprobată. */
export const localHistory = (slug: string): LocalHistory | null => (ISTORIE_LOCALA_APROBATA ? ISTORIE_LOCALA[slug] ?? null : null);
