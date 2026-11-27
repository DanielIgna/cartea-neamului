import type { Theme } from "../tipuri";

const ANR = { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "registrele mai vechi de 100 de ani, la serviciul județean de care ține satul", en: "registers older than 100 years, at the county branch the village belongs to", pt: "registros com mais de 100 anos, na filial do distrito ao qual pertence a aldeia", es: "registros de más de 100 años, en la filial del distrito al que pertenece el pueblo" } };
const ECONSULAT = { name: "econsulat.ro", url: "https://www.econsulat.ro", note: { ro: "programări la ambasadele și consulatele României", en: "appointments at Romania's embassies and consulates", pt: "agendamentos nas embaixadas e consulados da Romênia", es: "citas en las embajadas y consulados de Rumanía" } };

/**
 * Comunitățile mici și cele vechi din afara Europei și a Americii de Nord (Daniel, 27.11.2026: „da” la o pagină „Români în
 * Asia” și „da adauga le” la Brazilia, Argentina, Emiratele Arabe Unite și Qatar; Israel, Cipru și Grecia au deja pagini).
 * Cifre doar unde au sursă: Japonia, ambasada României după evidențele japoneze (financiarul.ro, 17.03.2026); Brazilia, MAE
 * citat de Wikipedia. Misiunile: lista Comisiei Europene pentru protecția consulară. Ton neutru.
 */
export const WORLD_THEMES: Theme[] = [
  {
    slug: "romani-in-asia", langs: ["ro", "en"], related: [],
    guides: ["acte-romanesti-din-strainatate", "copiii-din-diaspora-si-bunicii-din-romania"],
    name: { ro: "Români în Asia: Japonia, China, Coreea de Sud", en: "Romanians in Asia: Japan, China, South Korea" },
    description: {
      ro: "Pentru românii din Japonia, China și Coreea de Sud: comunități mici, acte românești de departe, nașterea copiilor și arborele făcut cu bunicii.",
      en: "For Romanians in Japan, China and South Korea: small communities, Romanian records from far away, children's births and a tree built with grandparents.",
    },
    body: {
      ro: [
        { h: "Comunități mici, departe de casă", p: [
          "În Asia trăiesc puțini români, comparat cu Italia, Spania sau Germania. În Japonia sunt în jur de 2.500, după evidențele autorităților japoneze citate de ambasada României în martie 2026, cei mai mulți în regiunea Kanto, cu Tokyo, apoi în Kansai, cu Osaka. În China și în Coreea de Sud comunitățile sunt și mai mici și se schimbă des: mulți vin pentru câțiva ani, cu serviciul, la studii sau cu familia.",
          "Pentru o familie atât de departe, legătura cu România se ține aproape numai prin rude. Copiii cresc vorbind japoneza, chineza, coreeana sau engleza, iar bunicii îi văd mai ales de sărbători și la telefon. Un arbore al familiei făcut împreună cu bunicii e felul cel mai simplu de a le arăta copiilor de unde vin.",
        ] },
        { h: "Misiunile României", p: [
          "România are ambasadă la Tokyo (3-16-19 Nishi Azabu, Minato-ku), la Seul (50 Jangmun-ro, Yongsan-gu) și la Beijing, iar la Hong Kong un consulat general (148 Electric Road, North Point). Programările se fac pe econsulat.ro. Prin misiuni se cer actele din România, se dau procuri și se transcrie nașterea copiilor născuți acolo.",
          "Japonia, Coreea de Sud și China fac parte din Convenția de la Haga privind apostila (China din noiembrie 2023). Actele românești folosite acolo au nevoie de apostilă și de traducere, iar cele locale folosite în România de apostilă dată de autoritatea țării.",
        ] },
        { h: "Copiii născuți acolo", p: [
          "Un copil născut în Japonia se declară la primăria locală în 14 zile de la naștere; în China și în Coreea de Sud nașterea se înregistrează după regulile locale, iar spitalul dă primul document. Ca să primească acte românești, nașterea trebuie apoi transcrisă în registrele românești, prin ambasadă sau consulat. Fă-o din timp, nu în anul în care e nevoie de pașaport.",
        ] },
        { h: "Cum faci arborele de departe", p: [
          "Începe cu bunicii, la telefon: numele întregi, numele de fată, satul, anii și cine cu cine s-a căsătorit. Cu satul exact, pagina lui de pe Cartea Neamului îți arată comuna, județul și arhiva județeană. Pentru actele din România ai trei căi: misiunea României, o rudă din țară cu procură sau, pentru registrele mai vechi de 100 de ani, serviciul județean al Arhivelor Naționale, prin e-mail.",
          "Pe Cartea Neamului arborele e comun și privat: bunicii îl completează din România, voi din Tokyo, Shanghai sau Seul, iar fiecare citește site-ul în limba lui.",
        ] },
      ],
      en: [
        { h: "Small communities, far from home", p: [
          "Few Romanians live in Asia compared with Italy, Spain or Germany. In Japan there are about 2,500, according to Japanese records cited by the Romanian embassy in March 2026, most of them in the Kanto region around Tokyo, then in Kansai around Osaka. In China and South Korea the communities are smaller still and change often: many come for a few years, for work, to study or with their family.",
          "For a family so far away, the link with Romania is kept almost entirely through relatives. Children grow up speaking Japanese, Chinese, Korean or English, and see their grandparents mostly on holidays and on the phone. A family tree built together with the grandparents is the simplest way to show the children where they come from.",
        ] },
        { h: "Romania's missions", p: [
          "Romania has embassies in Tokyo (3-16-19 Nishi Azabu, Minato-ku), Seoul (50 Jangmun-ro, Yongsan-gu) and Beijing, and a consulate general in Hong Kong (148 Electric Road, North Point). Appointments are booked on econsulat.ro. The missions handle requests for records from Romania, powers of attorney and the transcription of births of children born there.",
          "Japan, South Korea and China are parties to the Hague Apostille Convention (China since November 2023). Romanian documents used there need an apostille and a translation, and local documents used in Romania need an apostille from the local authority.",
        ] },
        { h: "Children born there", p: [
          "A child born in Japan is registered at the local municipal office within 14 days of birth; in China and South Korea the birth is registered under local rules, and the hospital issues the first document. To receive Romanian documents, the birth must then be transcribed into the Romanian registers through the embassy or consulate. Do it early, not in the year a passport is needed.",
        ] },
        { h: "Building the tree from far away", p: [
          "Start with your grandparents, on the phone: full names, maiden names, the village, the years and who married whom. With the exact village, its page on Cartea Neamului shows the commune, county and county archive. For records from Romania there are three routes: Romania's mission, a relative in Romania with a power of attorney or, for registers older than 100 years, the county branch of the National Archives, by email.",
          "On Cartea Neamului the tree is shared and private: grandparents fill it in from Romania, you from Tokyo, Shanghai or Seoul, and everyone reads the site in their own language.",
        ] },
      ],
    },
    records: [
      ECONSULAT,
      { name: "Comisia Europeană – protecția consulară (Japonia)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-japan-jp_en", note: { ro: "Ambasada României la Tokyo", en: "Embassy of Romania in Tokyo" } },
      { name: "Comisia Europeană – protecția consulară (Coreea de Sud)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-south-korea-kr_en", note: { ro: "Ambasada României la Seul", en: "Embassy of Romania in Seoul" } },
      { name: "Comisia Europeană – protecția consulară (China)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-china-cn_en", note: { ro: "Consulatul General al României la Hong Kong", en: "Consulate General of Romania in Hong Kong" } },
      ANR,
    ],
  },
  {
    slug: "romani-in-brazilia", langs: ["pt", "ro", "en"], related: [],
    guides: ["romanian-birth-records", "find-ancestors-in-romania", "redobandirea-cetateniei-acte-stramosi"],
    name: { pt: "Romenos no Brasil: raízes e documentos", ro: "Români în Brazilia: rădăcini și acte", en: "Romanians in Brazil: roots and records" },
    description: {
      pt: "Para brasileiros com raízes na Romênia: os imigrantes da Bessarábia, as colônias de Santa Catarina, documentos romenos e a árvore da família.",
      ro: "Pentru brazilienii cu rădăcini în România: emigranții din Basarabia, coloniile din Santa Catarina, actele românești și arborele familiei.",
      en: "For Brazilians with roots in Romania: emigrants from Bessarabia, the Santa Catarina settlements, Romanian records and the family tree.",
    },
    body: {
      pt: [
        { h: "Quem veio da Romênia", p: [
          "No começo do século XX chegaram ao Brasil emigrantes da Bessarábia, região que pertenceu à Romênia entre 1918 e 1940 e que hoje é, em grande parte, a República da Moldávia. Muitos deles eram alemães, judeus ou poloneses que viviam no território romeno da época. Por isso, muitas famílias brasileiras com raízes \"romenas\" têm sobrenomes alemães, judaicos ou poloneses, e não romenos.",
          "Várias comunidades se formaram no extremo oeste de Santa Catarina, principalmente em Mondaí e Itapiranga; na Linha Santo Antônio, em Itapiranga, há uma réplica da cruz da aldeia de Krasna, na Bessarábia. Segundo o Ministério das Relações Exteriores da Romênia, citado pela Wikipédia, havia 7.393 cidadãos romenos no Brasil e até 40.000 brasileiros com alguma ascendência romena.",
        ] },
        { h: "Documentos romenos e moldavos", p: [
          "Para quem nasceu na Bessarábia antes de 1918, os registros paroquiais do período russo estão na Agência Nacional de Arquivos da República da Moldávia, em Chișinău. Para 1918–1940, procure também nos Arquivos Nacionais da Romênia. Para o resto da Romênia, os registros de mais de 100 anos estão na filial distrital dos Arquivos Nacionais, e os mais recentes na prefeitura do lugar de nascimento.",
          "A Romênia tem um consulado-geral no Rio de Janeiro (Rua Cosme Velho, 526, Laranjeiras) e uma embaixada em Brasília; os agendamentos são feitos em econsulat.ro. Brasil e Romênia fazem parte da Convenção da Apostila de Haia: os documentos usados de um país para o outro precisam de apostila e tradução juramentada.",
        ] },
        { h: "Como começar a árvore", p: [
          "Comece pelos mais velhos da família: nomes completos, sobrenomes de solteira, a aldeia de origem, o navio ou o ano de chegada. Documentos de imigração, certidões de casamento e túmulos muitas vezes dão o nome da aldeia. Lembre que as aldeias da Bessarábia tinham nomes russos, romenos e às vezes alemães.",
          "No Cartea Neamului a árvore é privada e compartilhada: cada parente a lê na sua língua, e o site está em português.",
        ] },
      ],
      ro: [
        { h: "Cine a venit din România", p: [
          "La începutul secolului XX au ajuns în Brazilia emigranți din Basarabia, ținut care a fost parte a României între 1918 și 1940 și care e azi, în mare parte, Republica Moldova. Mulți erau germani, evrei sau polonezi care trăiau pe teritoriul românesc de atunci. De aceea, multe familii braziliene cu rădăcini „românești” au nume de familie germane, evreiești sau poloneze, nu românești.",
          "Câteva comunități s-au format în extremul vestic al statului Santa Catarina, mai ales la Mondaí și Itapiranga; la Linha Santo Antônio, în Itapiranga, există o copie a crucii satului Krasna din Basarabia. După Ministerul Afacerilor Externe al României, citat de Wikipedia, în Brazilia erau 7.393 de cetățeni români și până la 40.000 de brazilieni cu origine română.",
        ] },
        { h: "Acte românești și moldovenești", p: [
          "Pentru cei născuți în Basarabia înainte de 1918, registrele parohiale din perioada rusă sunt la Agenția Națională a Arhivelor de la Chișinău. Pentru 1918–1940 caută și la Arhivele Naționale ale României. Pentru restul României, registrele mai vechi de 100 de ani sunt la serviciul județean al Arhivelor Naționale, iar cele mai noi la primăria locului de naștere.",
          "România are un consulat general la Rio de Janeiro (Rua Cosme Velho 526, Laranjeiras) și o ambasadă la Brasília; programările se fac pe econsulat.ro. Brazilia și România fac parte din Convenția de la Haga privind apostila: actele folosite dintr-o țară în alta au nevoie de apostilă și traducere autorizată.",
        ] },
        { h: "Cum începi arborele", p: [
          "Începe cu cei mai vârstnici din familie: numele întregi, numele de fată, satul de origine, vaporul sau anul sosirii. Actele de imigrare, certificatele de căsătorie și mormintele dau adesea numele satului. Ține minte că satele din Basarabia aveau nume rusești, românești și uneori germane.",
          "Pe Cartea Neamului arborele e privat și comun: fiecare rudă îl citește în limba ei, iar site-ul are și portugheza.",
        ] },
      ],
      en: [
        { h: "Who came from Romania", p: [
          "In the early 20th century, emigrants from Bessarabia reached Brazil. Bessarabia was part of Romania from 1918 to 1940 and is today largely the Republic of Moldova. Many were Germans, Jews or Poles living on what was then Romanian territory, which is why many Brazilian families with \"Romanian\" roots have German, Jewish or Polish surnames rather than Romanian ones.",
          "Several communities formed in the far west of Santa Catarina, mainly in Mondaí and Itapiranga; at Linha Santo Antônio in Itapiranga there is a replica of the cross of the village of Krasna in Bessarabia. According to Romania's Ministry of Foreign Affairs, as cited by Wikipedia, there were 7,393 Romanian citizens in Brazil and up to 40,000 Brazilians with some Romanian ancestry.",
        ] },
        { h: "Romanian and Moldovan records", p: [
          "For those born in Bessarabia before 1918, the parish registers of the Russian period are at the National Archives Agency of Moldova in Chișinău. For 1918–1940, also search the Romanian National Archives. For the rest of Romania, registers older than 100 years are at the county branch of the National Archives, and newer ones at the town hall of the place of birth.",
          "Romania has a consulate general in Rio de Janeiro (Rua Cosme Velho 526, Laranjeiras) and an embassy in Brasília; appointments are booked on econsulat.ro. Brazil and Romania are both parties to the Hague Apostille Convention: documents used from one country in the other need an apostille and a sworn translation.",
        ] },
        { h: "How to start the tree", p: [
          "Start with the oldest relatives: full names, maiden names, the home village, the ship or year of arrival. Immigration papers, marriage certificates and gravestones often name the village. Remember that Bessarabian villages had Russian, Romanian and sometimes German names.",
          "On Cartea Neamului the tree is private and shared: each relative reads it in their own language, and the site is also in Portuguese.",
        ] },
      ],
    },
    records: [
      ECONSULAT,
      { name: "Comisia Europeană – protecția consulară (Brazilia)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-brazil-br_en", note: { ro: "Consulatul General al României la Rio de Janeiro", en: "Consulate General of Romania in Rio de Janeiro", pt: "Consulado-Geral da Romênia no Rio de Janeiro" } },
      { name: "Agenția Națională a Arhivelor (Republica Moldova)", url: "https://arhiva.gov.md", note: { ro: "registrele parohiale din Basarabia", en: "parish registers from Bessarabia", pt: "registros paroquiais da Bessarábia" } },
      ANR,
    ],
  },
  {
    slug: "romani-in-argentina", langs: ["es", "ro", "en"], related: [],
    guides: ["romanian-birth-records", "find-ancestors-in-romania", "stramosi-evrei-din-romania"],
    name: { es: "Rumanos en Argentina: raíces y documentos", ro: "Români în Argentina: rădăcini și acte", en: "Romanians in Argentina: roots and records" },
    description: {
      es: "Para argentinos con raíces en Rumanía: las tres olas de inmigración, las colonias de Santa Fe y Entre Ríos, los documentos rumanos y el árbol familiar.",
      ro: "Pentru argentinienii cu rădăcini în România: cele trei valuri de emigrare, coloniile din Santa Fe și Entre Ríos, actele românești și arborele familiei.",
      en: "For Argentines with roots in Romania: three waves of immigration, the Santa Fe and Entre Ríos settlements, Romanian records and the family tree.",
    },
    body: {
      es: [
        { h: "Tres olas de inmigración", p: [
          "La inmigración desde las tierras rumanas a Argentina empezó a fines del siglo XIX y llegó en tres olas. La primera duró hasta después de la Segunda Guerra Mundial y trajo gente de Austria-Hungría (Transilvania, Bucovina) y del Imperio ruso (Besarabia), muchos de ellos judíos. La segunda llegó justo después de la guerra, y la tercera en los años noventa, tras el fin del comunismo en Rumanía.",
          "Familias venidas de Rumanía se asentaron también en las colonias agrícolas judías de Santa Fe y Entre Ríos. Por eso, muchos argentinos con raíces \"rumanas\" llevan apellidos judíos, alemanes o húngaros, y sus antepasados aparecen en registros escritos en varios idiomas.",
        ] },
        { h: "Documentos de Rumanía", p: [
          "Los registros de más de 100 años están en la filial del distrito de los Archivos Nacionales de Rumanía; los más recientes, en el ayuntamiento del lugar de nacimiento. En Transilvania y el Banato, los registros civiles de 1895 a 1918 están en húngaro; en Besarabia, los anteriores a 1918 están en ruso y se guardan en Chișinău, en la República de Moldavia.",
          "Rumanía tiene embajada en Buenos Aires (Calle Arroyo 962-970); las citas se piden en econsulat.ro. Argentina y Rumanía forman parte del Convenio de la Apostilla de La Haya: los documentos que pasan de un país a otro necesitan apostilla y traducción.",
        ] },
        { h: "Cómo empezar el árbol", p: [
          "Empezá por los mayores de la familia: nombres completos, apellidos de soltera, el pueblo de origen, el barco o el año de llegada. Los papeles de inmigración, las actas de casamiento y las lápidas muchas veces nombran el pueblo. Tené en cuenta que los pueblos de Transilvania y Besarabia tenían también nombres húngaros, alemanes o rusos.",
          "En Cartea Neamului el árbol es privado y compartido: cada pariente lo lee en su idioma, y el sitio está en español.",
        ] },
      ],
      ro: [
        { h: "Trei valuri de emigrare", p: [
          "Emigrarea din ținuturile românești spre Argentina a început la sfârșitul secolului al XIX-lea și a venit în trei valuri. Primul a ținut până după al Doilea Război Mondial și a adus oameni din Austro-Ungaria (Transilvania, Bucovina) și din Imperiul Rus (Basarabia), mulți dintre ei evrei. Al doilea a venit imediat după război, iar al treilea în anii '90, după căderea comunismului în România.",
          "Familii venite din România s-au așezat și în coloniile agricole evreiești din provinciile Santa Fe și Entre Ríos. De aceea, mulți argentinieni cu rădăcini „românești” au nume evreiești, germane sau maghiare, iar strămoșii lor apar în acte scrise în mai multe limbi.",
        ] },
        { h: "Acte din România", p: [
          "Registrele mai vechi de 100 de ani sunt la serviciul județean al Arhivelor Naționale ale României, iar cele mai noi la primăria locului de naștere. În Transilvania și Banat, registrele de stare civilă din 1895–1918 sunt în maghiară; în Basarabia, cele de dinainte de 1918 sunt în rusă și se păstrează la Chișinău, în Republica Moldova.",
          "România are ambasadă la Buenos Aires (Calle Arroyo 962-970); programările se fac pe econsulat.ro. Argentina și România fac parte din Convenția de la Haga privind apostila: actele folosite dintr-o țară în alta au nevoie de apostilă și traducere.",
        ] },
        { h: "Cum începi arborele", p: [
          "Începe cu cei mai vârstnici din familie: numele întregi, numele de fată, satul de origine, vaporul sau anul sosirii. Actele de imigrare, certificatele de căsătorie și mormintele dau adesea numele satului. Ține minte că satele din Transilvania și Basarabia aveau și nume maghiare, germane sau rusești.",
          "Pe Cartea Neamului arborele e privat și comun: fiecare rudă îl citește în limba ei, iar site-ul are și spaniola.",
        ] },
      ],
      en: [
        { h: "Three waves of immigration", p: [
          "Immigration from the Romanian lands to Argentina began in the late 19th century and came in three waves. The first lasted until after the Second World War and brought people from Austria-Hungary (Transylvania, Bukovina) and the Russian Empire (Bessarabia), many of them Jewish. The second came right after the war, and the third in the 1990s, after the end of communism in Romania.",
          "Families from Romania also settled in the Jewish agricultural colonies of Santa Fe and Entre Ríos. That is why many Argentines with \"Romanian\" roots carry Jewish, German or Hungarian surnames, and their ancestors appear in records written in several languages.",
        ] },
        { h: "Records from Romania", p: [
          "Registers older than 100 years are at the county branch of the Romanian National Archives; newer ones are at the town hall of the place of birth. In Transylvania and Banat, civil records from 1895 to 1918 are in Hungarian; in Bessarabia, those before 1918 are in Russian and are kept in Chișinău, in Moldova.",
          "Romania has an embassy in Buenos Aires (Calle Arroyo 962-970); appointments are booked on econsulat.ro. Argentina and Romania are both parties to the Hague Apostille Convention: documents used from one country in the other need an apostille and a translation.",
        ] },
        { h: "How to start the tree", p: [
          "Start with the oldest relatives: full names, maiden names, the home village, the ship or year of arrival. Immigration papers, marriage certificates and gravestones often name the village. Remember that villages in Transylvania and Bessarabia also had Hungarian, German or Russian names.",
          "On Cartea Neamului the tree is private and shared: each relative reads it in their own language, and the site is also in Spanish.",
        ] },
      ],
    },
    records: [
      ECONSULAT,
      { name: "Comisia Europeană – protecția consulară (Argentina)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-argentina-ar_en", note: { ro: "Ambasada României la Buenos Aires", en: "Embassy of Romania in Buenos Aires", es: "Embajada de Rumanía en Buenos Aires" } },
      ANR,
    ],
  },
  {
    slug: "romani-in-emirate-si-qatar", langs: ["ro", "en"], related: [],
    guides: ["acte-romanesti-din-strainatate", "copiii-din-diaspora-si-bunicii-din-romania"],
    name: { ro: "Români în Emiratele Arabe Unite și Qatar", en: "Romanians in the UAE and Qatar" },
    description: {
      ro: "Pentru românii din Dubai, Abu Dhabi și Doha: misiunile României, actele din țară, nașterea copiilor și arborele familiei făcut de departe.",
      en: "For Romanians in Dubai, Abu Dhabi and Doha: Romania's missions, records from home, children's births and a family tree built from far away.",
    },
    body: {
      ro: [
        { h: "O comunitate venită la muncă", p: [
          "Românii din Emiratele Arabe Unite și din Qatar au venit mai ales la muncă, pe contracte, în domenii foarte diferite. Mulți stau câțiva ani, iar copiii lor cresc adesea vorbind engleza mai bine decât româna.",
          "Pentru acești copii, România e locul bunicilor și al vacanțelor de vară. Un arbore al familiei făcut împreună cu bunicii le arată cine sunt rudele de acasă, din ce sat vine familia și ce s-a întâmplat înainte ca părinții să plece.",
        ] },
        { h: "Misiunile României", p: [
          "România are ambasadă la Abu Dhabi, în zona Al Rodha, și consulat general la Dubai, în Jumeirah 1. În Qatar, ambasada României se află la Doha, în zona Dafna. Programările se fac pe econsulat.ro. Prin misiuni se cer actele din România, se dau procuri și se transcrie nașterea copiilor născuți acolo.",
          "Regulile pentru actele locale folosite în România (legalizare sau apostilă, traducere) diferă de la un document la altul; întreabă la consulat înainte să depui un dosar.",
        ] },
        { h: "Copiii născuți acolo", p: [
          "Un copil născut în Emirate sau în Qatar primește certificatul de naștere de la autoritățile locale. Ca să aibă acte românești, nașterea lui trebuie transcrisă în registrele românești, prin ambasadă sau consulat. Pentru că multe familii se mută după câțiva ani, e bine s-o faci cât sunteți încă acolo.",
        ] },
        { h: "Cum faci arborele de departe", p: [
          "Începe cu părinții și bunicii: numele întregi, numele de fată, satul, anii și cine cu cine s-a căsătorit. Cu satul exact, pagina lui de pe Cartea Neamului îți arată comuna, județul și arhiva județeană. Pentru actele vechi scrie serviciului județean al Arhivelor Naționale, iar pentru cele recente cere ajutorul unei rude din țară, cu procură.",
          "Pe Cartea Neamului arborele e comun și privat: bunicii îl completează din România, voi din Dubai sau Doha, iar fiecare citește site-ul în limba lui.",
        ] },
      ],
      en: [
        { h: "A community that came to work", p: [
          "Romanians in the United Arab Emirates and Qatar came mostly to work, on contracts, in very different fields. Many stay a few years, and their children often grow up speaking English better than Romanian.",
          "For these children, Romania is the place of their grandparents and summer holidays. A family tree built together with the grandparents shows them who the relatives back home are, which village the family comes from and what happened before their parents left.",
        ] },
        { h: "Romania's missions", p: [
          "Romania has an embassy in Abu Dhabi, in the Al Rodha area, and a consulate general in Dubai, in Jumeirah 1. In Qatar, the Embassy of Romania is in Doha, in the Dafna area. Appointments are booked on econsulat.ro. The missions handle requests for records from Romania, powers of attorney and the transcription of births of children born there.",
          "The rules for local documents used in Romania (legalisation or apostille, translation) differ from one document to another; ask at the consulate before you file anything.",
        ] },
        { h: "Children born there", p: [
          "A child born in the UAE or Qatar receives a birth certificate from the local authorities. To have Romanian documents, the birth must be transcribed into the Romanian registers through the embassy or consulate. Because many families move on after a few years, it is best to do it while you are still there.",
        ] },
        { h: "Building the tree from far away", p: [
          "Start with your parents and grandparents: full names, maiden names, the village, the years and who married whom. With the exact village, its page on Cartea Neamului shows the commune, county and county archive. For old records write to the county branch of the National Archives; for recent ones, ask a relative in Romania to help, with a power of attorney.",
          "On Cartea Neamului the tree is shared and private: grandparents fill it in from Romania, you from Dubai or Doha, and everyone reads the site in their own language.",
        ] },
      ],
    },
    records: [
      ECONSULAT,
      { name: "Comisia Europeană – protecția consulară (Emiratele Arabe Unite)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-united-arab-emirates-ae_en", note: { ro: "Ambasada României la Abu Dhabi și Consulatul General la Dubai", en: "Embassy of Romania in Abu Dhabi and Consulate General in Dubai" } },
      { name: "Comisia Europeană – protecția consulară (Qatar)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-qatar-qa_en", note: { ro: "Ambasada României la Doha", en: "Embassy of Romania in Doha" } },
      ANR,
    ],
  },
];
