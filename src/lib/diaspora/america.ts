import type { CountryKey, Region } from "./tipuri";
import { AMERICA_CITIES, EUROPE_CITIES } from "./orase";
import { EUROPE_CITIES_2 } from "./orase-2";
import { MORE } from "./orase-mai-mult";
import { ownWords } from "./extins";
import { APPROVED_REGIONS } from "./ciorne";
import { APROBATE } from "./ciorne/aprobate";
import { withCityLangs } from "./ciorne/limbi-orase";
import { localHistory } from "./istorie-locala";

/**
 * Statele SUA, provinciile Canadei și câteva orașe mari. Toate au pagină (Daniel: „toate statele, toate provinciile”), dar
 * intră în Google doar cele despre care avem ce spune sigur (`notes`); celelalte rămân „noindex” până le completăm, ca să nu
 * avem zeci de pagini aproape la fel.
 */
const US_STATES: [string, string, string?][] = [
  ["alabama", "Alabama"], ["alaska", "Alaska"], ["arizona", "Arizona"], ["arkansas", "Arkansas"], ["california", "California"],
  ["colorado", "Colorado"], ["connecticut", "Connecticut"], ["delaware", "Delaware"], ["florida", "Florida"], ["georgia", "Georgia"],
  ["hawaii", "Hawaii"], ["idaho", "Idaho"], ["illinois", "Illinois"], ["indiana", "Indiana"], ["iowa", "Iowa"],
  ["kansas", "Kansas"], ["kentucky", "Kentucky"], ["louisiana", "Louisiana"], ["maine", "Maine"], ["maryland", "Maryland"],
  ["massachusetts", "Massachusetts"], ["michigan", "Michigan"], ["minnesota", "Minnesota"], ["mississippi", "Mississippi"], ["missouri", "Missouri"],
  ["montana", "Montana"], ["nebraska", "Nebraska"], ["nevada", "Nevada"], ["new-hampshire", "New Hampshire"], ["new-jersey", "New Jersey"],
  ["new-mexico", "New Mexico"], ["new-york", "New York"], ["north-carolina", "North Carolina", "Carolina de Nord"], ["north-dakota", "North Dakota", "Dakota de Nord"], ["ohio", "Ohio"],
  ["oklahoma", "Oklahoma"], ["oregon", "Oregon"], ["pennsylvania", "Pennsylvania"], ["rhode-island", "Rhode Island"], ["south-carolina", "South Carolina", "Carolina de Sud"],
  ["south-dakota", "South Dakota", "Dakota de Sud"], ["tennessee", "Tennessee"], ["texas", "Texas"], ["utah", "Utah"], ["vermont", "Vermont"],
  ["virginia", "Virginia"], ["washington", "Washington"], ["west-virginia", "West Virginia", "Virginia de Vest"], ["wisconsin", "Wisconsin"], ["wyoming", "Wyoming"],
];

const CA_PROVINCES: [string, string, string, string][] = [
  // slug, engleză, franceză, română
  ["ontario", "Ontario", "Ontario", "Ontario"], ["quebec", "Quebec", "Québec", "Québec"], ["alberta", "Alberta", "Alberta", "Alberta"],
  ["british-columbia", "British Columbia", "Colombie-Britannique", "Columbia Britanică"], ["manitoba", "Manitoba", "Manitoba", "Manitoba"],
  ["saskatchewan", "Saskatchewan", "Saskatchewan", "Saskatchewan"], ["nova-scotia", "Nova Scotia", "Nouvelle-Écosse", "Noua Scoție"],
  ["new-brunswick", "New Brunswick", "Nouveau-Brunswick", "New Brunswick"], ["newfoundland-and-labrador", "Newfoundland and Labrador", "Terre-Neuve-et-Labrador", "Newfoundland și Labrador"],
  ["prince-edward-island", "Prince Edward Island", "Île-du-Prince-Édouard", "Insula Prințului Eduard"], ["yukon", "Yukon", "Yukon", "Yukon"],
  ["northwest-territories", "Northwest Territories", "Territoires du Nord-Ouest", "Teritoriile de Nord-Vest"], ["nunavut", "Nunavut", "Nunavut", "Nunavut"],
];
const FR_WHERE: Record<string, string> = {
  quebec: "au Québec", "nova-scotia": "en Nouvelle-Écosse", "british-columbia": "en Colombie-Britannique", "prince-edward-island": "à l'Île-du-Prince-Édouard",
  "northwest-territories": "dans les Territoires du Nord-Ouest", "newfoundland-and-labrador": "à Terre-Neuve-et-Labrador", nunavut: "au Nunavut", yukon: "au Yukon",
  manitoba: "au Manitoba", "new-brunswick": "au Nouveau-Brunswick",
};

/** Ce știm despre românii din fiecare stat sau provincie (în română și engleză; Québecul și Montréalul și în franceză). */
const NOTES: Record<string, Region["notes"] & { cities?: string[] }> = {
  ohio: {
    cities: ["Cleveland", "Youngstown", "Akron", "Columbus"],
    ro: [
      "Ohio are una dintre cele mai vechi comunități românești din America. La începutul secolului XX, mii de țărani din Transilvania și Banat au venit să lucreze în oțelăriile din Cleveland și Youngstown și în fabricile de anvelope din Akron.",
      "Și-au făcut case naționale, societăți de ajutor reciproc și ziare în română; multe familii de aici au strămoși plecați din satele din jurul Sibiului, Făgărașului, Albei și din Banat. Listele de pasageri din acei ani și registrele societăților de ajutor arată des satul de origine.",
    ],
    en: [
      "Ohio has one of the oldest Romanian communities in America. In the early 20th century thousands of peasants from Transylvania and Banat came to work in the steel mills of Cleveland and Youngstown and the tyre factories of Akron.",
      "They built national halls, mutual aid societies and Romanian-language newspapers; many local families have ancestors from the villages around Sibiu, Făgăraș and Alba and from Banat. Passenger lists from those years and the records of the aid societies often name the home village.",
    ],
  },
  pennsylvania: {
    cities: ["Pittsburgh", "Philadelphia", "Sharon", "Farrell"],
    ro: [
      "Oțelăriile din vestul Pennsylvaniei, în jurul Pittsburghului și în orașele de pe râul Shenango, precum Sharon și Farrell, au atras la începutul secolului XX mulți muncitori români din Transilvania și Banat.",
      "Philadelphia a primit mai târziu familii venite după 1990. Pentru cine caută un strămoș venit în acei ani, recensămintele americane din 1910–1940 notează limba maternă și anul sosirii, iar dosarele de naturalizare numesc adesea satul.",
    ],
    en: [
      "The steel mills of western Pennsylvania, around Pittsburgh and in the Shenango Valley towns such as Sharon and Farrell, drew many Romanian workers from Transylvania and Banat in the early 20th century.",
      "Philadelphia later welcomed families who arrived after 1990. If you are tracing an ancestor from those early years, the US censuses of 1910–1940 record mother tongue and year of arrival, and naturalization files often name the village.",
    ],
  },
  michigan: {
    cities: ["Detroit", "Dearborn", "Warren", "Grand Rapids"],
    ro: [
      "Industria auto a adus la Detroit, în primele decenii ale secolului XX, muncitori din toată Europa de Est, printre ei mulți români din Transilvania și Banat. Comunitatea a avut cluburi, societăți și o presă proprie.",
      "După 1990 au venit ingineri și familii noi, așezate mai ales în suburbiile Detroitului. Mulți urmași ai primului val au doar numele de familie, schimbat uneori la sosire: o formă americanizată (ca Popa → Pope) e un indiciu de verificat în actele de imigrare.",
    ],
    en: [
      "The car industry brought workers from all over Eastern Europe to Detroit in the early 20th century, among them many Romanians from Transylvania and Banat. The community had its own clubs, societies and press.",
      "After 1990 came engineers and new families, mostly in the Detroit suburbs. Many descendants of the first wave only have the family name, sometimes changed on arrival: an Americanised form (such as Popa becoming Pope) is a clue to check in immigration records.",
    ],
  },
  illinois: {
    cities: ["Chicago", "Aurora", "Naperville", "Skokie"],
    ro: [
      "Chicago are azi una dintre cele mai mari comunități românești din Statele Unite, formată mai ales după 1990, când au venit familii întregi, mulți prin loteria vizelor. Comunitatea are școli de weekend, festivaluri și magazine românești.",
      "Primii români au venit însă încă de la 1900, în fabricile și abatoarele orașului. Arhivele comitatului Cook păstrează actele de naștere, căsătorie și deces, iar listele de pasageri ale celor sosiți la New York și apoi plecați spre Chicago sunt la Ellis Island.",
    ],
    en: [
      "Chicago today has one of the largest Romanian communities in the United States, formed mostly after 1990, when whole families came, many through the diversity visa lottery. The community has weekend schools, festivals and Romanian shops.",
      "The first Romanians arrived as early as 1900, in the city's factories and stockyards. Cook County keeps birth, marriage and death records, and the passenger lists of those who landed in New York and moved on to Chicago are at Ellis Island.",
    ],
  },
  indiana: {
    cities: ["Gary", "East Chicago", "Indianapolis", "Fort Wayne"],
    ro: [
      "Oțelăriile de pe malul lacului Michigan, la Gary și East Chicago (Indiana Harbor), au avut la începutul secolului XX colonii de muncitori români din Transilvania și Banat, care au întemeiat societăți și case naționale.",
      "Azi urmașii lor sunt americani de a treia sau a patra generație. Pentru ei, recensămintele din 1910–1930 și registrele de înmormântare ale vremii sunt cele mai bune surse pentru a afla satul din care a plecat bunicul.",
    ],
    en: [
      "The steel mills on the shore of Lake Michigan, at Gary and East Chicago (Indiana Harbor), had colonies of Romanian workers from Transylvania and Banat in the early 20th century, who founded societies and national halls.",
      "Today their descendants are third- or fourth-generation Americans. For them the censuses of 1910–1930 and the burial records of the time are the best sources for finding the village a grandfather left.",
    ],
  },
  minnesota: {
    cities: ["South St. Paul", "Minneapolis", "St. Paul"],
    ro: [
      "La începutul secolului XX, abatoarele și fabricile de conserve din South St. Paul au atras o colonie de muncitori români, mulți din Transilvania, care au avut aici propriile societăți și case de cultură.",
      "Comunitatea e azi mică, dar istoria ei e bine păstrată în arhivele locale și în registrele societății istorice a statului, utile pentru cine caută urmașii acelor familii.",
    ],
    en: [
      "In the early 20th century the stockyards and packing plants of South St. Paul attracted a colony of Romanian workers, many from Transylvania, who had their own societies and cultural halls there.",
      "The community is small today, but its history is well kept in local archives and in the records of the state historical society, useful for anyone tracing the descendants of those families.",
    ],
  },
  "new-york": {
    cities: ["New York City", "Queens", "Long Island", "Rochester"],
    ro: [
      "Statul New York a fost poarta de intrare pentru aproape toți românii veniți înainte de 1924: prin Ellis Island au trecut zeci de mii de oameni din Transilvania, Banat, Bucovina și Moldova.",
      "În jurul anului 1900, evreii din România au format un cartier al lor în Lower East Side din Manhattan, iar după 1990 noii veniți s-au așezat mai ales în Queens. Listele de pasageri de la Ellis Island sunt gratuite și au, de obicei, localitatea de plecare și ruda la care mergea fiecare.",
    ],
    en: [
      "New York State was the gateway for almost all Romanians who came before 1924: tens of thousands of people from Transylvania, Banat, Bukovina and Moldavia passed through Ellis Island.",
      "Around 1900, Romanian Jews formed their own neighbourhood on Manhattan's Lower East Side, and after 1990 newcomers settled mostly in Queens. The Ellis Island passenger lists are free and usually give each passenger's place of departure and the relative they were joining.",
    ],
  },
  california: {
    cities: ["Los Angeles", "Sacramento", "San Francisco Bay Area", "San Diego"],
    ro: [
      "California a atras românii mai ales după 1970 și 1990: refugiați, artiști și oameni de film la Los Angeles, informaticieni și ingineri în zona San Francisco, iar zona Sacramento a primit una dintre cele mai mari comunități de români noi din vestul Statelor Unite.",
      "Multe familii de aici au plecat din România în anii '80 și '90, cu rude rămase acasă care încă știu poveștile. E generația pentru care un arbore făcut împreună, cu bunicii de acasă la telefon, contează cel mai mult.",
    ],
    en: [
      "California drew Romanians mostly after 1970 and 1990: refugees, artists and film people in Los Angeles, IT specialists and engineers in the San Francisco Bay Area, while the Sacramento area became home to one of the largest new Romanian communities in the western United States.",
      "Many families here left Romania in the 1980s and 1990s and still have relatives back home who know the stories. This is the generation for whom a tree built together, with grandparents on the phone, matters most.",
    ],
  },
  washington: {
    cities: ["Seattle", "Bellevue", "Redmond", "Spokane"],
    ro: [
      "Zona Seattle a atras după 1990 mulți ingineri și informaticieni români, la companiile mari de tehnologie din Redmond și Bellevue și la industria aeronautică.",
      "E o comunitate tânără, cu copii născuți în America și bunici în România; poveștile familiei se pierd cel mai repede tocmai aici, unde nu mai e nimeni din generația bătrână în preajmă.",
    ],
    en: [
      "After 1990 the Seattle area drew many Romanian engineers and IT specialists, to the big technology companies in Redmond and Bellevue and to the aerospace industry.",
      "It is a young community, with children born in America and grandparents in Romania; family stories are lost fastest exactly here, where no one from the older generation is close by.",
    ],
  },
  oregon: {
    cities: ["Portland", "Salem", "Eugene"],
    ro: [
      "Portland are una dintre cele mai mari comunități românești din vestul Statelor Unite, formată mai ales din refugiați veniți în anii '80 și din familii sosite după 1990, multe din vestul și nordul României.",
      "Familiile sunt adesea mari, cu frați și veri împrăștiați între Oregon, California și România: un arbore comun ajută la ținerea evidenței, de la nașteri la nunți.",
    ],
    en: [
      "Portland has one of the largest Romanian communities in the western United States, formed mostly by refugees who came in the 1980s and families who arrived after 1990, many from western and northern Romania.",
      "Families are often large, with siblings and cousins spread between Oregon, California and Romania: a shared tree helps keep track, from births to weddings.",
    ],
  },
  texas: {
    cities: ["Houston", "Dallas", "Austin", "San Antonio"],
    ro: [
      "În Texas, românii au venit mai ales după 1990, ca ingineri în industria petrolului la Houston și în tehnologie la Austin și Dallas, dar și ca medici și cercetători.",
      "Comunitatea e răspândită și tânără. Cei mai mulți au părinți și bunici în România, așa că sursele pentru arbore sunt aproape toate acolo: actele de la primărie, registrele vechi de la arhive și amintirile celor de acasă.",
    ],
    en: [
      "Romanians came to Texas mostly after 1990, as engineers in the oil industry in Houston and in technology in Austin and Dallas, as well as doctors and researchers.",
      "The community is spread out and young. Most have parents and grandparents in Romania, so nearly all the sources for the tree are there: town hall records, old registers in the archives and the memories of those back home.",
    ],
  },
  "new-jersey": {
    cities: ["Newark", "Jersey City", "Paterson"],
    ro: [
      "New Jersey, lângă New York, a primit români încă din primul val, în fabricile din Newark și Paterson, iar după 1990 mulți dintre cei care lucrau în New York s-au mutat aici cu familia.",
      "Pentru primul val, registrele de stare civilă ale statului și recensămintele federale arată limba maternă și anul sosirii; pentru noii veniți, sursele sunt în România.",
    ],
    en: [
      "New Jersey, next to New York, received Romanians from the very first wave, in the factories of Newark and Paterson, and after 1990 many who worked in New York moved here with their families.",
      "For the first wave, the state's vital records and the federal censuses show mother tongue and year of arrival; for newcomers, the sources are in Romania.",
    ],
  },
  florida: {
    cities: ["Miami", "Fort Lauderdale", "Orlando", "Tampa"],
    ro: [
      "Florida a devenit după 1990 o destinație pentru familii românești venite din alte state, dar și direct din România, mai ales în sudul statului și în jurul Orlandoului.",
      "Mulți pensionari americani de origine română s-au mutat aici din nord, din Ohio, Michigan sau New York, cu albume de familie care merită scanate cât mai sunt cei care știu cine e în poze.",
    ],
    en: [
      "After 1990 Florida became a destination for Romanian families coming from other states as well as directly from Romania, especially in the south of the state and around Orlando.",
      "Many retired Americans of Romanian descent moved here from the north, from Ohio, Michigan or New York, with family albums worth scanning while there are still people who know who is in the photos.",
    ],
  },
  ontario: {
    cities: ["Toronto", "Mississauga", "Kitchener", "Hamilton", "Ottawa"],
    ro: [
      "Ontario are cea mai mare comunitate românească din Canada, formată mai ales după 1990 în Toronto și în orașele din jur, precum Mississauga, Kitchener și Hamilton, și la Ottawa.",
      "Mulți au venit ca imigranți calificați, cu familia, și au rude în toată România. Arhivele Ontario păstrează actele de stare civilă ale provinciei, utile pentru cei născuți aici.",
    ],
    en: [
      "Ontario has the largest Romanian community in Canada, formed mostly after 1990 in Toronto and the surrounding cities such as Mississauga, Kitchener and Hamilton, and in Ottawa.",
      "Many came as skilled immigrants with their families and have relatives all over Romania. The Archives of Ontario keep the province's vital records, useful for those born here.",
    ],
  },
  quebec: {
    cities: ["Montréal", "Laval", "Québec", "Gatineau"],
    ro: [
      "Québecul a atras după 1990 mulți români vorbitori de franceză, iar Montréalul a devenit unul dintre marile centre ale diasporei românești din America de Nord.",
      "Actele de stare civilă din Québec sunt ținute de Directeur de l'état civil, iar registrele vechi sunt la arhivele naționale ale Québecului (BAnQ). Copiii născuți aici au adesea și cetățenie română, cu nașterea transcrisă prin consulatul de la Montréal.",
    ],
    en: [
      "After 1990 Quebec drew many French-speaking Romanians, and Montréal became one of the main centres of the Romanian diaspora in North America.",
      "Quebec civil records are kept by the Directeur de l'état civil, and older registers are at the Quebec national archives (BAnQ). Children born here often also hold Romanian citizenship, with their birth transcribed through the consulate in Montréal.",
    ],
    fr: [
      "Après 1990, le Québec a attiré de nombreux Roumains francophones, et Montréal est devenue l'un des grands centres de la diaspora roumaine en Amérique du Nord.",
      "Les actes d'état civil du Québec sont tenus par le Directeur de l'état civil, et les registres anciens sont à Bibliothèque et Archives nationales du Québec (BAnQ). Les enfants nés ici ont souvent aussi la nationalité roumaine, la naissance étant transcrite par le consulat de Montréal.",
    ],
  },
  alberta: {
    cities: ["Calgary", "Edmonton", "Boian"],
    ro: [
      "Alberta are cea mai veche așezare românească din Canada: la sfârșitul anilor 1890, familii din satul Boian, din Bucovina, au primit pământ la nord-est de Edmonton și au dat noii așezări numele satului lor.",
      "După 1990 au venit ingineri și specialiști în industria petrolului la Calgary și Edmonton. Pentru urmașii primilor coloniști, listele de pasageri și registrele de pământ (homestead) din arhivele canadiene arată adesea satul bucovinean de origine.",
    ],
    en: [
      "Alberta has the oldest Romanian settlement in Canada: in the late 1890s, families from the village of Boian in Bukovina received land north-east of Edmonton and named the new settlement after their village.",
      "After 1990 engineers and oil industry specialists came to Calgary and Edmonton. For descendants of the first settlers, passenger lists and homestead records in the Canadian archives often name the Bukovinian home village.",
    ],
  },
  saskatchewan: {
    cities: ["Regina", "Saskatoon"],
    ro: [
      "La începutul secolului XX, țărani români din Bucovina și Transilvania s-au așezat în preriile din Saskatchewan, mai ales în jurul Reginei, unde au întemeiat mici sate de fermieri.",
      "Urmașii lor sunt canadieni de a patra sau a cincea generație. Registrele de homestead și recensămintele canadiene din 1906–1926 sunt cele mai bune surse pentru a afla de unde au venit primii coloniști.",
    ],
    en: [
      "In the early 20th century Romanian peasants from Bukovina and Transylvania settled on the prairies of Saskatchewan, especially around Regina, where they founded small farming communities.",
      "Their descendants are fourth- or fifth-generation Canadians. Homestead records and the Canadian censuses of 1906–1926 are the best sources for finding where the first settlers came from.",
    ],
  },
  manitoba: {
    cities: ["Winnipeg"],
    ro: [
      "Winnipeg, poarta spre prerii, a fost locul prin care au trecut și unde s-au oprit mulți dintre primii imigranți români din vestul Canadei, la începutul secolului XX.",
      "Arhivele provinciei Manitoba și registrele de homestead ajută la urmărirea familiilor care au plecat apoi mai departe, spre Saskatchewan și Alberta.",
    ],
    en: [
      "Winnipeg, the gateway to the prairies, was where many of the first Romanian immigrants to western Canada passed through or settled in the early 20th century.",
      "The Archives of Manitoba and homestead records help trace families who then moved further west to Saskatchewan and Alberta.",
    ],
  },
  "british-columbia": {
    cities: ["Vancouver", "Surrey", "Victoria"],
    ro: [
      "Columbia Britanică a primit românii mai ales după 1990, la Vancouver și în orașele din jur, ingineri, informaticieni și familii atrase de clima mai blândă a coastei.",
      "E o comunitate tânără, cu rude în România și în restul Canadei; arhivele provinciei au actele de stare civilă istorice online, iar pentru strămoși sursele sunt în România.",
    ],
    en: [
      "British Columbia received Romanians mostly after 1990, in Vancouver and the surrounding cities: engineers, IT specialists and families drawn by the milder coastal climate.",
      "It is a young community with relatives in Romania and across Canada; the province's historical vital records are online, while for ancestors the sources are in Romania.",
    ],
  },
  "nova-scotia": {
    cities: ["Halifax"],
    ro: [
      "Prin portul Halifax, la Pier 21, au intrat în Canada între 1928 și 1971 aproape un milion de imigranți, printre ei refugiați și familii din România venite după al Doilea Război Mondial.",
      "Muzeul canadian al imigrației de la Pier 21 ajută la căutarea înregistrărilor de sosire, adesea cu numele vaporului și cu data exactă la care a pus piciorul în Canada un strămoș.",
    ],
    en: [
      "Through the port of Halifax, at Pier 21, nearly a million immigrants entered Canada between 1928 and 1971, among them refugees and families from Romania who came after World War II.",
      "The Canadian Museum of Immigration at Pier 21 helps find arrival records, often with the ship's name and the exact date an ancestor set foot in Canada.",
    ],
  },
};

const CITY_NOTES: Region[] = [
  {
    slug: "new-york-city", country: "us", kind: "city", parent: "new-york", langs: ["en", "ro"],
    name: { ro: "New York City", en: "New York City" }, where: { ro: "în New York City", en: "in New York City" },
    notes: {
      ro: [
        "Pentru mulți români, America a început la New York: între 1892 și 1924, prin Ellis Island au trecut emigranți din aproape fiecare județ al Transilvaniei și Banatului. Pe lângă ei, evreii din România au avut în jurul anului 1900 cartierul lor în Lower East Side, cu restaurante, teatre și asociații pe orașe de origine.",
        "Azi comunitatea e mai ales în Queens, în cartiere ca Ridgewood, Sunnyside și Astoria, iar orașul are consulatul general al României și o filială a Institutului Cultural Român. Listele de pasageri de la Ellis Island, căutabile gratuit, sunt primul loc unde să cauți un strămoș.",
      ],
      en: [
        "For many Romanians, America began in New York: between 1892 and 1924, emigrants from almost every county of Transylvania and Banat passed through Ellis Island. Alongside them, Romanian Jews had their own neighbourhood on the Lower East Side around 1900, with restaurants, theatres and associations for each home town.",
        "Today the community is mostly in Queens, in neighbourhoods such as Ridgewood, Sunnyside and Astoria, and the city has a Romanian consulate general and a branch of the Romanian Cultural Institute. The free Ellis Island passenger lists are the first place to look for an ancestor.",
      ],
    },
  },
  {
    slug: "chicago", country: "us", kind: "city", parent: "illinois", langs: ["en", "ro"],
    name: { ro: "Chicago", en: "Chicago" }, where: { ro: "în Chicago", en: "in Chicago" },
    notes: {
      ro: [
        "Chicago e unul dintre marile orașe ale diasporei românești: are consulatul general al României pentru Midwest, școli de weekend, festivaluri și zeci de afaceri românești, mai ales în nordul orașului și în suburbii.",
        "Cei mai mulți au venit după 1990, cu familia, dar orașul a avut români și în primul val, în fabricile de la 1900. Registrele comitatului Cook și listele de pasageri arată adesea și satul de origine al bunicilor.",
      ],
      en: [
        "Chicago is one of the great cities of the Romanian diaspora: it has the Romanian consulate general for the Midwest, weekend schools, festivals and dozens of Romanian businesses, mostly on the north side and in the suburbs.",
        "Most came after 1990 with their families, but the city also had Romanians in the first wave, in the factories around 1900. Cook County records and passenger lists often show the grandparents' home village.",
      ],
    },
  },
  {
    slug: "los-angeles", country: "us", kind: "city", parent: "california", langs: ["en", "ro"],
    name: { ro: "Los Angeles", en: "Los Angeles" }, where: { ro: "în Los Angeles", en: "in Los Angeles" },
    notes: {
      ro: [
        "Los Angeles a primit în anii '70 și '80 refugiați din România comunistă, printre ei artiști, actori și oameni de film, iar orașul are consulatul general al României pentru vestul Statelor Unite.",
        "Comunitatea e împrăștiată pe o suprafață uriașă, din Hollywood și San Fernando Valley până în Orange County. Mulți au plecat singuri și au rude doar în România, așa că arborele familiei se face aproape în întregime de la distanță.",
      ],
      en: [
        "In the 1970s and 1980s Los Angeles welcomed refugees from communist Romania, among them artists, actors and film people, and the city has the Romanian consulate general for the western United States.",
        "The community is spread over a huge area, from Hollywood and the San Fernando Valley to Orange County. Many came alone and have relatives only in Romania, so the family tree is built almost entirely from a distance.",
      ],
    },
  },
  {
    slug: "toronto", country: "ca", kind: "city", parent: "ontario", langs: ["en", "ro"],
    name: { ro: "Toronto", en: "Toronto" }, where: { ro: "în Toronto", en: "in Toronto" },
    notes: {
      ro: [
        "Toronto și orașele din jur au cea mai mare comunitate de români din Canada, crescută mult după 1990, când Canada a primit mulți imigranți calificați din România: ingineri, informaticieni, medici, contabili.",
        "Orașul are consulatul general al României, școli de weekend și asociații culturale. Copiii născuți aici pot primi și cetățenia română, prin transcrierea nașterii la consulat.",
      ],
      en: [
        "Toronto and the surrounding cities have the largest Romanian community in Canada, which grew sharply after 1990 when Canada welcomed many skilled immigrants from Romania: engineers, IT specialists, doctors and accountants.",
        "The city has a Romanian consulate general, weekend schools and cultural associations. Children born here can also obtain Romanian citizenship by having their birth transcribed at the consulate.",
      ],
    },
  },
  {
    slug: "montreal", country: "ca", kind: "city", parent: "quebec", langs: ["fr", "en", "ro"],
    name: { ro: "Montréal", en: "Montreal", fr: "Montréal" }, where: { ro: "în Montréal", en: "in Montreal", fr: "à Montréal" },
    notes: {
      ro: [
        "Montréal e orașul francofon al diasporei românești: după 1990 au venit aici zeci de mii de români, atrași de limba franceză, pe care mulți o învățaseră la școală, și de universitățile orașului.",
        "Comunitatea are consulatul general al României, asociații și școli de weekend. Actele de stare civilă din Québec sunt în franceză, ceea ce face mai ușoară transcrierea lor în registrele românești.",
      ],
      en: [
        "Montréal is the French-speaking city of the Romanian diaspora: after 1990 tens of thousands of Romanians came here, drawn by the French language, which many had learned at school, and by the city's universities.",
        "The community has a Romanian consulate general, associations and weekend schools. Quebec civil records are in French, which makes it easier to transcribe them into the Romanian registers.",
      ],
      fr: [
        "Montréal est la ville francophone de la diaspora roumaine : après 1990, des dizaines de milliers de Roumains y sont arrivés, attirés par le français, que beaucoup avaient appris à l'école, et par les universités de la ville.",
        "La communauté a un consulat général de Roumanie, des associations et des écoles du week-end. Les actes d'état civil du Québec sont en français, ce qui facilite leur transcription dans les registres roumains.",
      ],
    },
  },
];

/** Textul paginii plus istoria locală (src/lib/diaspora/istorie-locala.ts), doar după ce Daniel o aprobă. */
function withHistory(slug: string, n: (typeof NOTES)[string] | undefined): (typeof NOTES)[string] | undefined {
  const h = localHistory(slug);
  if (!h) return n;
  return { ...(n ?? {}), ro: [...(n?.ro ?? []), ...h.ro], en: [...(n?.en ?? []), ...h.en] };
}

export const REGIONS: Region[] = withCityLangs([
  ...US_STATES.map(([slug, en, ro]): Region => {
    const n = withHistory(slug, NOTES[slug]);
    return { slug, country: "us", kind: "state", name: { ro: ro ?? en, en }, where: { ro: slug === "new-york" ? "în statul New York" : `în ${ro ?? en}`, en: slug === "new-york" ? "in New York State" : slug === "washington" ? "in Washington State" : `in ${en}` }, langs: ["en", "ro"], notes: n ? { ro: n.ro, en: n.en } : {}, cities: n?.cities };
  }),
  ...CA_PROVINCES.map(([slug, en, fr, ro]): Region => {
    const n = withHistory(slug, NOTES[slug]);
    const langs: Region["langs"] = slug === "quebec" ? ["fr", "en", "ro"] : ["en", "ro"];
    return { slug, country: "ca", kind: "province", name: { ro, en, fr }, where: { ro: `în ${ro}`, en: `in ${en}`, fr: FR_WHERE[slug] ?? `en ${fr}` }, langs, notes: n ? { ro: n.ro, en: n.en, fr: n.fr } : {}, cities: n?.cities };
  }),
  ...CITY_NOTES.map((r) => ({ ...r, notes: { ...r.notes, ro: [...(r.notes.ro ?? []), ...(MORE[r.slug] ?? [])] } })),
  ...AMERICA_CITIES,
  ...EUROPE_CITIES,
  ...EUROPE_CITIES_2,
  ...APPROVED_REGIONS,
], APROBATE);

export const regionsOf = (country: CountryKey, kind?: Region["kind"]) => REGIONS.filter((r) => r.country === country && (!kind || r.kind === kind));
export const getRegion = (country: CountryKey, slug: string) => REGIONS.find((r) => r.country === country && r.slug === slug) ?? null;
/** O pagină de stat sau provincie intră în Google doar dacă are text propriu. */
/** Pragul unei pagini de oraș (Daniel, 17.11.2026: „300–600 de cuvinte pe oraș”); sub el, pagina rămâne în afara Google. */
export const CITY_MIN_WORDS = 300;
/** Pragul unei regiuni europene (land, regiune, comunitate autonomă): ca la statele SUA e nevoie de text propriu, dar cerem minimum 200 de cuvinte. */
export const REGION_MIN_WORDS = 200;
export const regionIndexable = (r: Region) =>
  r.kind === "city" ? ownWords(r.notes.ro ?? []) >= CITY_MIN_WORDS
  : r.kind === "region" ? ownWords(r.notes.ro ?? []) >= REGION_MIN_WORDS
  : (r.notes.ro?.length ?? 0) > 0;
