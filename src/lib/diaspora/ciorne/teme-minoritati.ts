import type { Theme } from "../tipuri";

const ANR = { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "registrele mai vechi de 100 de ani, la serviciul județean de care ține satul", en: "registers older than 100 years, at the county branch the village belongs to" } };

/**
 * Minoritățile din România (Daniel, 19.11.2026: „mai sunt aromâni… turcii și alte minorități care cred că ar trebui să
 * aibă articole dedicate”). Câte un articol de genealogie pentru fiecare comunitate, în română și engleză: de unde vine,
 * unde trăiește, în ce limbă și scriere sunt actele și ce greutăți are căutarea. Ton neutru; registrele parohiale sunt
 * pomenite doar ca sursă de acte. Maghiarii, sașii și șvabii au deja articolele lor.
 */
export const MINORITY_THEMES: Theme[] = [
  {
    slug: "aromani", langs: ["ro", "en"], guides: ["dobrogea-genealogie"], related: ["grecia", "bulgaria"],
    name: { ro: "Aromânii: genealogia familiilor armâne", en: "Aromanians: tracing Aromanian families" },
    description: {
      ro: "Pentru familiile aromâne din Dobrogea și din București: drumul din Balcani prin Cadrilater, numele, actele în greacă și bulgară, arhivele.",
      en: "For Aromanian families in Dobruja and Bucharest: the road from the Balkans through the Cadrilater, names, Greek and Bulgarian records, archives.",
    },
    body: {
      ro: [
        { h: "De unde vin aromânii", p: [
          "Aromânii, care își spun armâni, vorbesc o limbă romanică foarte apropiată de română și au trăit secole întregi în Balcani: în munții Pindului, în Epir, Tesalia și Macedonia, în Albania, în Macedonia de Nord și în Bulgaria. Erau păstori, negustori, meșteșugari și cărăuși, iar unele familii au ajuns încă din secolele XVIII și XIX negustori bogați la București, Brașov, Viena sau Budapesta.",
          "Familiile își păstrează adesea numele ramurii din care se trag: fărșeroți, grămosteni, pindeni, moscopoleni, gopeșeni. Acestea spun de unde a pornit familia și sunt un prim indiciu prețios pentru arbore.",
        ] },
        { h: "Drumul spre Dobrogea", p: [
          "Între 1925 și 1940, multe familii aromâne au venit din Grecia, Albania și Bulgaria și s-au așezat în Cadrilater, sudul Dobrogei, care era atunci parte a României. După Tratatul de la Craiova din 1940, Cadrilaterul a revenit Bulgariei, iar familiile s-au mutat în nordul Dobrogei, în județele Tulcea și Constanța, unde trăiesc și azi multe dintre ele. Altele s-au stabilit la București și în alte orașe.",
          "Așa se face că trei generații ale aceleiași familii au acte în trei state: bunicul născut într-un sat din Pind, cu act grecesc, tatăl născut în Cadrilater, cu act românesc păstrat azi în arhive bulgare sau românești, și copiii născuți la Constanța.",
        ] },
        { h: "Cum faci arborele", p: [
          "Începe cu bunicii: numele, ramura, satul din Balcani, satul din Cadrilater și anul mutării în Dobrogea. Actele din anii 1925–1940 se caută la serviciile județene Constanța și Tulcea ale Arhivelor Naționale și la arhivele regionale bulgare de la Dobrici și Silistra. Pentru generațiile din Grecia sau Albania, numele satului e cheia: aproape fiecare sat aromân are un nume aromân și unul oficial, grecesc sau albanez.",
          "Numele de familie apar în acte scrise diferit, în greacă, bulgară, română și aromână. Păstrează în arbore toate formele, iar poveștile bunicilor înregistrează-le în aromână, cu vocea lor: în Cartea Neamului rămân lângă numele lor, pentru nepoți.",
        ] },
      ],
      en: [
        { h: "Where Aromanians come from", p: [
          "Aromanians, who call themselves armâni, speak a Romance language very close to Romanian and lived for centuries in the Balkans: in the Pindus mountains, in Epirus, Thessaly and Macedonia, in Albania, North Macedonia and Bulgaria. They were shepherds, traders, craftsmen and carriers, and some families became wealthy merchants in Bucharest, Brașov, Vienna or Budapest as early as the 18th and 19th centuries.",
          "Families often keep the name of the branch they descend from: Fărșeroți, Grămosteni, Pindeni, Moscopoleni, Gopeșeni. These names say where the family started and are a valuable first clue for the tree.",
        ] },
        { h: "The road to Dobruja", p: [
          "Between 1925 and 1940, many Aromanian families came from Greece, Albania and Bulgaria and settled in the Cadrilater, southern Dobruja, then part of Romania. After the 1940 Treaty of Craiova returned the Cadrilater to Bulgaria, the families moved to northern Dobruja, to Tulcea and Constanța counties, where many still live. Others settled in Bucharest and other cities.",
          "So three generations of one family have records in three states: a grandfather born in a Pindus village, with a Greek record, a father born in the Cadrilater, with a Romanian record now kept in Bulgarian or Romanian archives, and children born in Constanța.",
        ] },
        { h: "How to build the tree", p: [
          "Start with your grandparents: their names, their branch, the Balkan village, the Cadrilater village and the year they moved to Dobruja. Records from 1925–1940 are in the Constanța and Tulcea county branches of the Romanian National Archives and the Bulgarian regional archives in Dobrich and Silistra. For the generations in Greece or Albania the village name is the key: almost every Aromanian village has an Aromanian name and an official Greek or Albanian one.",
          "Surnames are spelled differently in Greek, Bulgarian, Romanian and Aromanian records. Keep every form in the tree, and record your grandparents' stories in Aromanian, in their own voices: in Cartea Neamului they stay next to their names, for the grandchildren.",
        ] },
      ],
    },
    records: [ANR, { name: "Държавна агенция „Архиви” (Bulgaria)", url: "https://archives.government.bg", note: { ro: "arhivele regionale de la Dobrici și Silistra, pentru anii din Cadrilater", en: "the regional archives in Dobrich and Silistra, for the Cadrilater years" } }],
  },
  {
    slug: "turci-si-tatari-din-dobrogea", langs: ["ro", "en"], guides: ["dobrogea-genealogie"], related: ["turcia", "bulgaria"],
    name: { ro: "Turcii și tătarii din Dobrogea: genealogie", en: "Turks and Tatars of Dobruja: genealogy" },
    description: {
      ro: "Pentru familiile turce și tătare din Dobrogea: istoria comunității, numele fără nume de familie, actele otomane și românești, rudele din Turcia.",
      en: "For Turkish and Tatar families of Dobruja: the community's history, names without surnames, Ottoman and Romanian records, relatives in Turkey.",
    },
    body: {
      ro: [
        { h: "O comunitate veche a Dobrogei", p: [
          "Dobrogea a fost parte a Imperiului Otoman timp de aproape cinci sute de ani, până în 1878. Turcii s-au așezat aici în acești ani, iar tătarii au venit în mai multe valuri, mai ales din Crimeea, cel mai mare după Războiul Crimeii, în anii 1850 și 1860. Medgidia a fost întemeiată atunci, în 1856, pentru familiile tătare venite din Crimeea.",
          "Azi turcii și tătarii trăiesc mai ales în județul Constanța, la Medgidia, Constanța, Mangalia, Cobadin, Techirghiol și în satele din jur, și în județul Tulcea, la Babadag și Isaccea. Au asociații, școli cu predare în limba lor și sărbători proprii, iar multe familii vorbesc acasă turca sau tătara crimeeană.",
        ] },
        { h: "Plecările spre Turcia", p: [
          "După 1878, când nordul Dobrogei a intrat în componența României, și apoi în perioada interbelică, multe familii au emigrat în Turcia; o convenție româno-turcă din 1936 a reglementat această emigrare. Așa se face că aproape fiecare familie dobrogeană are rude la Istanbul, Bursa, Eskișehir sau Ankara, pe care uneori nu le-a mai văzut de trei generații.",
          "Un arbore comun, pe care îl pot citi în turcă rudele din Turcia și în română cele din Dobrogea, e cel mai simplu mod de a reface legătura dintre ramuri.",
        ] },
        { h: "Nume și acte", p: [
          "Înainte de 1878 actele sunt otomane, scrise cu alfabet arab. După 1878 sunt acte românești de stare civilă, în care numele turcești și tătărești sunt scrise după ureche: Mehmet poate fi Memet sau Mehmed, Abdulkerim poate fi Abdulchiarim. Multe familii nu aveau nume de familie fix, iar copiii luau ca nume prenumele tatălui; în Turcia numele de familie au devenit obligatorii abia în 1934.",
          "Notează în arbore toate formele unui nume și prenumele tatălui la fiecare persoană. Actele mai vechi de 100 de ani sunt la serviciile județene Constanța și Tulcea ale Arhivelor Naționale, iar cele otomane la Arhivele Statului din Turcia.",
        ] },
      ],
      en: [
        { h: "An old community of Dobruja", p: [
          "Dobruja was part of the Ottoman Empire for almost five hundred years, until 1878. Turks settled here in those years, and Tatars came in several waves, mostly from Crimea, the largest after the Crimean War, in the 1850s and 1860s. Medgidia was founded then, in 1856, for Tatar families arriving from Crimea.",
          "Today Turks and Tatars live mostly in Constanța county, in Medgidia, Constanța, Mangalia, Cobadin, Techirghiol and the surrounding villages, and in Tulcea county, in Babadag and Isaccea. They have associations, schools teaching in their language and their own holidays, and many families speak Turkish or Crimean Tatar at home.",
        ] },
        { h: "Emigration to Turkey", p: [
          "After 1878, when northern Dobruja became part of Romania, and again between the world wars, many families emigrated to Turkey; a Romanian-Turkish convention of 1936 regulated this emigration. So almost every Dobrujan family has relatives in Istanbul, Bursa, Eskișehir or Ankara, sometimes not seen for three generations.",
          "A shared tree, which relatives in Turkey can read in Turkish and those in Dobruja in Romanian, is the simplest way to reconnect the branches.",
        ] },
        { h: "Names and records", p: [
          "Before 1878 the records are Ottoman, written in the Arabic script. After 1878 they are Romanian civil records, in which Turkish and Tatar names are spelled by ear: Mehmet may be Memet or Mehmed, Abdulkerim may be Abdulchiarim. Many families had no fixed surname, and children took their father's first name as a surname; in Turkey surnames only became compulsory in 1934.",
          "Write down every form of a name in the tree, and the father's first name for each person. Records older than 100 years are in the Constanța and Tulcea county branches of the Romanian National Archives, and Ottoman ones in Turkey's State Archives.",
        ] },
      ],
    },
    records: [ANR, { name: "Devlet Arşivleri Başkanlığı", url: "https://www.devletarsivleri.gov.tr", note: { ro: "arhivele otomane, inclusiv registre despre Dobrogea", en: "the Ottoman archives, including registers on Dobruja" } }],
  },
  {
    slug: "romi", langs: ["ro", "en"], related: ["spania", "italia", "marea-britanie"],
    name: { ro: "Romii din România: genealogia familiei", en: "Roma families from Romania: genealogy" },
    description: {
      ro: "Pentru familiile de romi: istoria robiei și a dezrobirii, deportările din 1942, numele de familie, unde se găsesc actele și cum păstrezi poveștile.",
      en: "For Roma families: the history of slavery and emancipation, the 1942 deportations, surnames, where the records are and how to keep the stories.",
    },
    body: {
      ro: [
        { h: "O istorie lungă și puțin scrisă", p: [
          "Romii sunt atestați în Țara Românească și în Moldova încă din secolul al XIV-lea. Timp de aproape cinci sute de ani, cei mai mulți au trăit în robie: aparțineau statului, boierilor sau mănăstirilor și puteau fi vânduți, dăruiți sau moșteniți. Robia a fost desființată în Moldova în 1855 și în Țara Românească în 1856. În Transilvania și în Banat istoria a fost alta, sub stăpânire habsburgică.",
          "Comunitățile își păstrează adesea numele meșteșugului vechi: căldărari, ursari, rudari, lăutari, fierari, spoitori. Pentru un arbore, ele sunt un indiciu despre locul și ocupația strămoșilor.",
        ] },
        { h: "Deportările și anii de după", p: [
          "În 1942, aproximativ 25.000 de romi din România au fost deportați în Transnistria, unde mulți au murit de foame, de frig și de boli. Supraviețuitorii s-au întors în 1944. Dosarele deportărilor se păstrează în arhive, iar mărturiile celor care au trăit atunci sunt de neprețuit pentru o familie. Ziua de 2 august este ziua de comemorare a romilor uciși în Holocaust.",
          "După 1990 multe familii au plecat la muncă în Spania, Italia, Franța sau Marea Britanie. Copiii crescuți acolo întreabă adesea de unde vin bunicii, iar răspunsul e rareori scris undeva.",
        ] },
        { h: "Cum faci arborele", p: [
          "Pentru multe familii de romi, actele vechi sunt puține, iar numele de familie s-au fixat târziu, uneori abia în secolul XX. De aceea, cea mai bună sursă sunt oamenii: bunicii, mătușile, unchii, care își amintesc nume, porecle, sate și meserii. Înregistrează-i cu telefonul și pune poveștile lor în arbore, lângă numele lor.",
          "Apoi caută actele: cele recente la starea civilă a primăriei, cele mai vechi de 100 de ani la serviciul județean al Arhivelor Naționale. Pentru anii robiei, unele familii apar în listele de robi ale statului, ale boierilor și ale mănăstirilor, păstrate la Arhivele Naționale.",
        ] },
      ],
      en: [
        { h: "A long history, little written down", p: [
          "Roma are recorded in Wallachia and Moldavia as early as the 14th century. For almost five hundred years most of them lived in slavery: they belonged to the state, to boyars or to monasteries and could be sold, given away or inherited. Slavery was abolished in Moldavia in 1855 and in Wallachia in 1856. In Transylvania and the Banat the history was different, under Habsburg rule.",
          "Communities often keep the name of an old trade: Căldărari (coppersmiths), Ursari (bear trainers), Rudari (woodworkers), Lăutari (musicians), Fierari (blacksmiths), Spoitori (tinsmiths). For a tree, they are a clue to the ancestors' place and occupation.",
        ] },
        { h: "The deportations and the years after", p: [
          "In 1942 about 25,000 Roma from Romania were deported to Transnistria, where many died of hunger, cold and disease. The survivors returned in 1944. The deportation files are kept in the archives, and the testimony of those who lived through it is priceless for a family. 2 August is the day of remembrance for the Roma killed in the Holocaust.",
          "After 1990 many families went to work in Spain, Italy, France or the United Kingdom. Children growing up there often ask where their grandparents come from, and the answer is rarely written down anywhere.",
        ] },
        { h: "How to build the tree", p: [
          "For many Roma families old records are few, and surnames became fixed late, sometimes only in the 20th century. So the best source is people: grandparents, aunts and uncles who remember names, nicknames, villages and trades. Record them on your phone and put their stories in the tree, next to their names.",
          "Then look for the records: recent ones at the town hall's civil registry, those older than 100 years at the county branch of the National Archives. For the years of slavery, some families appear in the lists of enslaved people kept by the state, boyars and monasteries, held by the National Archives.",
        ] },
      ],
    },
    records: [ANR, { name: "Institutul Național pentru Studierea Holocaustului din România „Elie Wiesel”", url: "https://www.inshr-ew.ro", note: { ro: "istoria deportărilor romilor în Transnistria și mărturii", en: "the history of the deportation of Roma to Transnistria, and testimonies" } }],
  },
  {
    slug: "rusi-lipoveni", langs: ["ro", "en"], guides: ["dobrogea-genealogie"], related: ["ucraina"],
    name: { ro: "Rușii lipoveni: genealogia familiilor din Deltă", en: "Lipovan Russians: tracing families of the Delta" },
    description: {
      ro: "Pentru familiile de ruși lipoveni din Delta Dunării, Dobrogea și Bucovina: de unde au venit, numele cu patronimic, actele în rusă și arhivele.",
      en: "For Lipovan Russian families of the Danube Delta, Dobruja and Bukovina: where they came from, patronymic names, Russian records and archives.",
    },
    body: {
      ro: [
        { h: "De unde vin lipovenii", p: [
          "Rușii lipoveni se trag din comunitățile de rit vechi care au refuzat reformele bisericii ruse din anii 1650 și au fost prigonite în Rusia. În secolele XVII și XVIII mulți au fugit spre sud și s-au așezat în Delta Dunării, în Dobrogea, în Moldova și în Bucovina, unde au putut trăi după obiceiurile lor.",
          "Azi trăiesc mai ales în județul Tulcea, la Tulcea, Sulina, Jurilovca, Sarichioi, Mila 23, Periprava și Carcaliu, în Brăila, în Constanța, la Iași și în județul Suceava, la Climăuți și în satele din jur. Sunt cunoscuți ca pescari, grădinari și meșteri, iar multe familii vorbesc acasă un grai rusesc vechi.",
        ] },
        { h: "Nume și acte", p: [
          "Familiile lipovenești folosesc, ca în Rusia, prenumele, patronimicul (numele tatălui cu terminația -ovici sau -evici, -ovna sau -evna) și numele de familie. În actele românești patronimicul lipsește adesea, iar numele rusești sunt scrise în mai multe feluri: Ivanov poate fi Ivanof sau Ivanoff, Fedot poate fi Fedut. Notează în arbore toate formele și patronimicul fiecăruia: el îți spune numele tatălui chiar acolo unde actul lipsește.",
          "Registrele comunităților de rit vechi sunt scrise în rusă sau în slavonă, cu alfabet chirilic. Cele mai vechi de 100 de ani sunt la serviciile județene ale Arhivelor Naționale, mai ales la Tulcea, Brăila și Suceava; cele noi, la starea civilă a primăriilor.",
        ] },
        { h: "Familia de azi", p: [
          "Mulți tineri din Deltă au plecat în ultimii ani la muncă în Europa de Vest sau la studii în Rusia, Ucraina sau România. Bunicii rămân cu poveștile despre pescuit, despre sărbătorile satului și despre drumurile pe apă. Înregistrează-i cu telefonul în graiul lor: în Cartea Neamului vocea lor rămâne lângă nume, pentru nepoții care vor crește departe de Deltă.",
          "Familiile cu rude în Ucraina sau în Republica Moldova pot face același arbore împreună, de oriunde ar trăi.",
        ] },
      ],
      en: [
        { h: "Where Lipovans come from", p: [
          "Lipovan Russians descend from the Old Rite communities that rejected the reforms of the Russian church in the 1650s and were persecuted in Russia. In the 17th and 18th centuries many fled south and settled in the Danube Delta, Dobruja, Moldavia and Bukovina, where they could live by their own customs.",
          "Today they live mostly in Tulcea county, in Tulcea, Sulina, Jurilovca, Sarichioi, Mila 23, Periprava and Carcaliu, in Brăila, Constanța and Iași, and in Suceava county, in Climăuți and the surrounding villages. They are known as fishermen, gardeners and craftsmen, and many families speak an old Russian dialect at home.",
        ] },
        { h: "Names and records", p: [
          "Lipovan families use, as in Russia, a given name, a patronymic (the father's name with the ending -ovich or -evich, -ovna or -evna) and a surname. Romanian records often leave out the patronymic, and Russian names are spelled in several ways: Ivanov may be Ivanof or Ivanoff, Fedot may be Fedut. Write down every form in the tree and each person's patronymic: it tells you the father's name even where the record is missing.",
          "The registers of the Old Rite communities are written in Russian or Church Slavonic, in Cyrillic. Those older than 100 years are in the county branches of the National Archives, especially Tulcea, Brăila and Suceava; newer ones at the town halls' civil registries.",
        ] },
        { h: "The family today", p: [
          "In recent years many young people from the Delta have gone to work in Western Europe or to study in Russia, Ukraine or Romania. The grandparents are left with the stories of fishing, village holidays and journeys on the water. Record them on your phone in their dialect: in Cartea Neamului their voices stay next to their names, for grandchildren who will grow up far from the Delta.",
          "Families with relatives in Ukraine or Moldova can build the same tree together, wherever they live.",
        ] },
      ],
    },
    records: [ANR],
  },
  {
    slug: "ucraineni-din-romania", langs: ["ro", "en"], guides: ["bucovina-registre-si-arhive"], related: ["ucraina"],
    name: { ro: "Ucrainenii din România: genealogie", en: "Ukrainians in Romania: genealogy" },
    description: {
      ro: "Pentru familiile ucrainene din Maramureș, Bucovina, Banat și Delta Dunării: istoria fiecărei zone, actele în maghiară, germană și ucraineană, numele.",
      en: "For Ukrainian families of Maramureș, Bukovina, the Banat and the Danube Delta: each area's history, records in Hungarian, German and Ukrainian, names.",
    },
    body: {
      ro: [
        { h: "Patru zone, patru istorii", p: [
          "Ucrainenii din România trăiesc în patru zone, fiecare cu istoria ei. În Maramureș, în Valea Vișeului și a Ruscovei, la Poienile de sub Munte, Repedea, Ruscova, Bistra sau Remeți, sunt sate vechi, care au ținut până în 1918 de Ungaria. În Bucovina, în județul Suceava, sunt sate care au ținut până în 1918 de Austria. În Banat, în județele Timiș, Caraș-Severin și Arad, s-au așezat familii venite la sfârșitul secolului al XIX-lea și începutul secolului XX. În Delta Dunării, la Dunavățu și în satele din jur, trăiesc urmașii cazacilor zaporojeni așezați aici la sfârșitul secolului al XVIII-lea.",
          "Multe familii au rude în Ucraina, peste graniță, mai ales în regiunile Transcarpatia și Cernăuți, despărțite de granița trasă după 1918 și apoi după 1940.",
        ] },
        { h: "Actele, în limba fiecărui stat", p: [
          "Actele urmează istoria fiecărei zone. În Maramureș, registrele de stare civilă din 1895 până în 1918 sunt în maghiară, iar registrele parohiale mai vechi în latină, maghiară sau ucraineană veche. În Bucovina, până în 1918 actele sunt în germană sau în latină, apoi în română. În Banat și în Deltă, după sosire, actele sunt în maghiară sau în română.",
          "Numele ucrainene apar scrise în feluri diferite: Ivan poate fi Ioan sau János, iar un nume ca Petriuc poate apărea și ca Petruk sau Petrjuk. Notează în arbore toate formele găsite. Registrele mai vechi de 100 de ani sunt la serviciile județene ale Arhivelor Naționale (Maramureș, Suceava, Timiș, Caraș-Severin, Tulcea), iar cele noi la primării.",
        ] },
        { h: "Familia de azi", p: [
          "Din satele ucrainene din Maramureș și Bucovina au plecat mulți oameni la muncă în Europa de Vest, iar alții au rude în Ucraina. Un arbore comun, pe care fiecare îl citește în limba lui, ucraineană, română sau alta, adună ramurile și păstrează poveștile bunicilor, spuse cu vocea lor, în graiul satului.",
          "Pentru familiile din Bucovina, ghidul despre Bucovina de pe Cartea Neamului arată în detaliu ce acte există și unde se găsesc.",
        ] },
      ],
      en: [
        { h: "Four areas, four histories", p: [
          "Ukrainians in Romania live in four areas, each with its own history. In Maramureș, in the Vișeu and Ruscova valleys, in Poienile de sub Munte, Repedea, Ruscova, Bistra or Remeți, there are old villages that belonged to Hungary until 1918. In Bukovina, in Suceava county, there are villages that belonged to Austria until 1918. In the Banat, in Timiș, Caraș-Severin and Arad counties, families settled at the end of the 19th and the start of the 20th century. In the Danube Delta, in Dunavățu and the nearby villages, live the descendants of the Zaporozhian Cossacks who settled there at the end of the 18th century.",
          "Many families have relatives across the border in Ukraine, especially in the Zakarpattia and Chernivtsi regions, separated by the borders drawn after 1918 and again after 1940.",
        ] },
        { h: "Records in each state's language", p: [
          "Records follow each area's history. In Maramureș, civil registers from 1895 to 1918 are in Hungarian, and older parish registers in Latin, Hungarian or old Ukrainian. In Bukovina, records until 1918 are in German or Latin, then in Romanian. In the Banat and the Delta, after settlement, records are in Hungarian or Romanian.",
          "Ukrainian names are spelled in different ways: Ivan may be Ioan or János, and a name like Petriuc may also appear as Petruk or Petrjuk. Write down every form you find in the tree. Registers older than 100 years are in the county branches of the National Archives (Maramureș, Suceava, Timiș, Caraș-Severin, Tulcea), newer ones at the town halls.",
        ] },
        { h: "The family today", p: [
          "Many people from the Ukrainian villages of Maramureș and Bukovina have gone to work in Western Europe, and others have relatives in Ukraine. A shared tree, which everyone reads in their own language, Ukrainian, Romanian or another, brings the branches together and keeps the grandparents' stories, told in their own voices, in the village dialect.",
          "For families from Bukovina, the Bukovina guide on Cartea Neamului shows in detail which records exist and where to find them.",
        ] },
      ],
    },
    records: [ANR],
  },
  {
    slug: "sarbi-din-romania", langs: ["ro", "en"], guides: ["romanii-din-banatul-sarbesc"], related: ["serbia"],
    name: { ro: "Sârbii din Banat: genealogia familiilor", en: "Serbs of the Romanian Banat: genealogy" },
    description: {
      ro: "Pentru familiile sârbe din Banatul românesc și din Clisura Dunării: istoria așezării, actele în chirilică, numele și arhivele din România și Serbia.",
      en: "For Serbian families of the Romanian Banat and the Danube Gorge: settlement history, Cyrillic records, names and archives in Romania and Serbia.",
    },
    body: {
      ro: [
        { h: "Sârbii din Banat", p: [
          "Sârbii trăiesc în Banat de sute de ani. Un val mare a venit în 1690, când zeci de mii de familii din Serbia otomană au trecut, în ceea ce istoricii numesc Marea Migrație, în ținuturile Imperiului Habsburgic; altele au venit înainte și după. După împărțirea Banatului în 1919–1920, o parte a satelor sârbe a rămas în România.",
          "Azi trăiesc mai ales în județul Timiș, la Timișoara, Sânmartinu Sârbesc, Cenei, Variaș și Sânnicolau Mare, în Caraș-Severin, în Clisura Dunării, la Svinița, Pojejena, Socol și Moldova Veche, și în județele Arad și Mehedinți. Au școli și presă în limba sârbă, iar multe familii au rude în Serbia, la câțiva kilometri, peste graniță.",
        ] },
        { h: "Actele și numele", p: [
          "Registrele parohiale ale comunităților sârbe sunt scrise în slavonă sau în sârbă, cu alfabet chirilic. Între 1895 și 1918, când Banatul ținea de Ungaria, actele de stare civilă sunt în maghiară, iar numele sârbești apar scrise după regulile maghiare: Jovanović poate fi Jovanovics, Đorđe poate fi György. După 1918 actele sunt în română, cu încă o formă a numelui, Iovanovici.",
          "Notează în arbore toate formele: cea chirilică, cea maghiară și cea românească. Registrele mai vechi de 100 de ani sunt la serviciile județene Timiș, Caraș-Severin, Arad și Mehedinți ale Arhivelor Naționale, iar pentru ramurile rămase în Serbia la Arhiva Voivodinei, de la Novi Sad.",
        ] },
        { h: "O familie de o parte și de alta a graniței", p: [
          "Granița din 1919–1920 a despărțit frați și veri: unii au rămas în satele din Banatul românesc, alții în Banatul sârbesc. Mulți tineri au plecat apoi la muncă în Germania, Austria sau Elveția. Un arbore comun, pe care fiecare îl citește în sârbă sau în română, adună ramurile și le arată nepoților de unde vin.",
          "Cartea Neamului are și limba sârbă, așa că rudele din Serbia pot completa arborele în limba lor.",
        ] },
      ],
      en: [
        { h: "Serbs of the Banat", p: [
          "Serbs have lived in the Banat for hundreds of years. A large wave came in 1690, when tens of thousands of families from Ottoman Serbia moved, in what historians call the Great Migration, into the lands of the Habsburg Empire; others came before and after. When the Banat was divided in 1919–1920, part of the Serbian villages remained in Romania.",
          "Today they live mostly in Timiș county, in Timișoara, Sânmartinu Sârbesc, Cenei, Variaș and Sânnicolau Mare, in Caraș-Severin, in the Danube Gorge villages of Svinița, Pojejena, Socol and Moldova Veche, and in Arad and Mehedinți counties. They have schools and newspapers in Serbian, and many families have relatives in Serbia, a few kilometres across the border.",
        ] },
        { h: "Records and names", p: [
          "The parish registers of Serbian communities are written in Church Slavonic or Serbian, in Cyrillic. Between 1895 and 1918, when the Banat belonged to Hungary, civil records are in Hungarian, and Serbian names are spelled by Hungarian rules: Jovanović may be Jovanovics, Đorđe may be György. After 1918 records are in Romanian, with yet another form of the name, Iovanovici.",
          "Write down every form in the tree: Cyrillic, Hungarian and Romanian. Registers older than 100 years are in the Timiș, Caraș-Severin, Arad and Mehedinți county branches of the Romanian National Archives, and for branches that stayed in Serbia at the Archives of Vojvodina in Novi Sad.",
        ] },
        { h: "One family on both sides of the border", p: [
          "The 1919–1920 border separated brothers and cousins: some stayed in villages of the Romanian Banat, others in the Serbian Banat. Many young people later went to work in Germany, Austria or Switzerland. A shared tree, which everyone reads in Serbian or Romanian, brings the branches together and shows the grandchildren where they come from.",
          "Cartea Neamului is also in Serbian, so relatives in Serbia can fill in the tree in their own language.",
        ] },
      ],
    },
    records: [ANR, { name: "Arhiv Vojvodine", url: "https://www.arhivvojvodine.org.rs", note: { ro: "pentru ramurile din Banatul sârbesc", en: "for branches in the Serbian Banat" } }],
  },
  {
    slug: "slovaci-din-romania", langs: ["ro", "en"], related: ["austria"],
    name: { ro: "Slovacii din România: genealogie", en: "Slovaks in Romania: genealogy" },
    description: {
      ro: "Pentru familiile slovace din Nădlac, Bihor și Sălaj: când au venit, satele sticlarilor și tăietorilor de lemne, actele în latină, maghiară și slovacă.",
      en: "For Slovak families of Nădlac, Bihor and Sălaj: when they came, the glassmaking and woodcutting villages, records in Latin, Hungarian and Slovak.",
    },
    body: {
      ro: [
        { h: "Când au venit slovacii", p: [
          "Slovacii din România au venit în secolele XVIII și XIX, ca o parte a colonizărilor din Imperiul Habsburgic. Cea mai mare comunitate e la Nădlac, în județul Arad, unde familiile slovace s-au așezat la începutul secolului al XIX-lea, venind mai ales din câmpia Ungariei. Alte comunități trăiesc în munții Pădurea Craiului, în județele Bihor și Sălaj, în sate întemeiate de tăietori de lemne și de lucrători la fabricile de sticlă: Șinteu, Budoi, Valea Târnei, Făgetu, Huta Voivozi.",
          "Numele unor sate amintesc de această istorie: „huta” înseamnă fabrică de sticlă. Comunitățile au școli și asociații în limba slovacă, iar la Nădlac funcționează un liceu cu predare în slovacă.",
        ] },
        { h: "Actele și numele", p: [
          "Familiile de la Nădlac au fost mai ales luterane, cele din Bihor și Sălaj mai ales romano-catolice, așa că registrele parohiale sunt la parohii diferite și scrise în latină, slovacă sau maghiară. Între 1895 și 1918, actele de stare civilă sunt în maghiară, iar numele slovace sunt scrise după regulile maghiare: Novák poate fi Novac sau Nowak, Jozef poate fi József.",
          "Notează în arbore toate formele unui nume. Registrele mai vechi de 100 de ani sunt la serviciile județene Arad, Bihor și Sălaj ale Arhivelor Naționale, iar cele noi la primării. Multe familii au rude în Slovacia, unde s-au mutat după 1945 sau după 1990.",
        ] },
        { h: "Familia de azi", p: [
          "Mulți tineri slovaci din România au plecat la studii sau la muncă în Slovacia, în Cehia sau în Europa de Vest. Bunicii rămân cu poveștile despre pădure, despre sticlărie și despre sărbătorile satului. Înregistrează-i cu telefonul, în slovaca lor de acasă: în Cartea Neamului vocea lor rămâne lângă nume.",
          "Un arbore comun, pe care îl completează și ramurile din Slovacia, arată nepoților cum s-a ajuns de la câmpia Ungariei la Nădlac sau la satele din Pădurea Craiului.",
        ] },
      ],
      en: [
        { h: "When the Slovaks came", p: [
          "The Slovaks of Romania came in the 18th and 19th centuries, as part of the settlement policies of the Habsburg Empire. The largest community is in Nădlac, Arad county, where Slovak families settled at the start of the 19th century, coming mostly from the Hungarian plain. Other communities live in the Pădurea Craiului mountains, in Bihor and Sălaj counties, in villages founded by woodcutters and glassworks labourers: Șinteu, Budoi, Valea Târnei, Făgetu, Huta Voivozi.",
          "Some village names recall this history: „huta” means glassworks. The communities have Slovak schools and associations, and Nădlac has a high school teaching in Slovak.",
        ] },
        { h: "Records and names", p: [
          "Families in Nădlac were mostly Lutheran and those in Bihor and Sălaj mostly Roman Catholic, so the parish registers are in different parishes and written in Latin, Slovak or Hungarian. Between 1895 and 1918 civil records are in Hungarian, and Slovak names are spelled by Hungarian rules: Novák may be Novac or Nowak, Jozef may be József.",
          "Write down every form of a name in the tree. Registers older than 100 years are in the Arad, Bihor and Sălaj county branches of the Romanian National Archives, and newer ones at the town halls. Many families have relatives in Slovakia, where they moved after 1945 or after 1990.",
        ] },
        { h: "The family today", p: [
          "Many young Slovaks from Romania have gone to study or work in Slovakia, the Czech Republic or Western Europe. The grandparents are left with the stories of the forest, the glassworks and the village holidays. Record them on your phone, in their home Slovak: in Cartea Neamului their voices stay next to their names.",
          "A shared tree, filled in by the branches in Slovakia too, shows the grandchildren how the family got from the Hungarian plain to Nădlac or the villages of Pădurea Craiului.",
        ] },
      ],
    },
    records: [ANR],
  },
  {
    slug: "bulgari-din-romania", langs: ["ro", "en"], related: ["bulgaria"],
    name: { ro: "Bulgarii din România: genealogie", en: "Bulgarians in Romania: genealogy" },
    description: {
      ro: "Pentru familiile bulgare din Banat și din jurul Bucureștiului: bulgarii bănățeni, grădinarii din Muntenia, actele în latină, chirilică și română.",
      en: "For Bulgarian families of the Banat and around Bucharest: the Banat Bulgarians, the gardeners of Wallachia, records in Latin, Cyrillic and Romanian.",
    },
    body: {
      ro: [
        { h: "Două comunități diferite", p: [
          "Bulgarii din România formează două comunități cu istorii diferite. Bulgarii bănățeni, catolici, se trag din familiile care au părăsit nord-vestul Bulgariei după răscoala de la Chiprovți din 1688 și s-au așezat în Banat în secolul al XVIII-lea, mai ales la Dudeștii Vechi și la Vinga, în județele Timiș și Arad. Vorbesc un grai bulgar propriu, scris cu alfabet latin.",
          "A doua comunitate trăiește în Muntenia, în satele din jurul Bucureștiului, ca Brănești, Popești-Leordeni sau Dobroești, și în alte localități de lângă Dunăre. Familiile au venit în secolul al XIX-lea, mai ales în timpul și după războaiele ruso-turce, și s-au făcut cunoscute ca grădinari: legumele lor au hrănit Bucureștiul vreme de un secol.",
        ] },
        { h: "Actele și numele", p: [
          "Familiile bănățene au registre parohiale catolice în latină, apoi, între 1895 și 1918, acte de stare civilă în maghiară. Familiile din Muntenia au registre parohiale în slavonă sau în română și acte de stare civilă românești. Numele bulgare apar românizate sau maghiarizate: Petrov poate fi Petrovici sau Petrof, iar în Banat numele apar adesea în forma lor latină.",
          "Notează în arbore toate formele unui nume. Registrele mai vechi de 100 de ani sunt la serviciile județene Timiș și Arad ale Arhivelor Naționale pentru Banat și la serviciul municipiului București și cel al județului Ilfov pentru Muntenia. Pentru familiile din Dobrogea, ține minte schimbul de populație din 1940, când bulgarii din nordul Dobrogei s-au mutat în Bulgaria.",
        ] },
        { h: "Familia de azi", p: [
          "Mulți tineri bulgari bănățeni au plecat la muncă în Europa de Vest sau la studii în Bulgaria, iar unele familii din Muntenia au rude în Bulgaria. Un arbore comun, pe care fiecare îl citește în bulgară sau în română, adună ramurile și păstrează poveștile bunicilor despre grădini, despre sat și despre drumurile de demult.",
          "Cartea Neamului are și limba bulgară, așa că rudele din Bulgaria pot completa arborele în limba lor.",
        ] },
      ],
      en: [
        { h: "Two different communities", p: [
          "Bulgarians in Romania form two communities with different histories. The Banat Bulgarians, who are Catholic, descend from families who left north-western Bulgaria after the Chiprovtsi uprising of 1688 and settled in the Banat in the 18th century, mostly in Dudeștii Vechi and Vinga, in Timiș and Arad counties. They speak their own Bulgarian dialect, written in the Latin alphabet.",
          "The second community lives in Wallachia, in the villages around Bucharest such as Brănești, Popești-Leordeni or Dobroești, and in other places near the Danube. The families came in the 19th century, mostly during and after the Russo-Turkish wars, and became known as gardeners: their vegetables fed Bucharest for a century.",
        ] },
        { h: "Records and names", p: [
          "Banat families have Catholic parish registers in Latin, then, between 1895 and 1918, civil records in Hungarian. Families in Wallachia have parish registers in Church Slavonic or Romanian and Romanian civil records. Bulgarian names appear Romanianised or Magyarised: Petrov may be Petrovici or Petrof, and in the Banat names often appear in their Latin form.",
          "Write down every form of a name in the tree. Registers older than 100 years are in the Timiș and Arad county branches of the National Archives for the Banat, and in the Bucharest and Ilfov branches for Wallachia. For families from Dobruja, remember the 1940 population exchange, when the Bulgarians of northern Dobruja moved to Bulgaria.",
        ] },
        { h: "The family today", p: [
          "Many young Banat Bulgarians have gone to work in Western Europe or to study in Bulgaria, and some families in Wallachia have relatives in Bulgaria. A shared tree, which everyone reads in Bulgarian or Romanian, brings the branches together and keeps the grandparents' stories about the gardens, the village and the journeys of long ago.",
          "Cartea Neamului is also in Bulgarian, so relatives in Bulgaria can fill in the tree in their own language.",
        ] },
      ],
    },
    records: [ANR, { name: "Държавна агенция „Архиви” (Bulgaria)", url: "https://archives.government.bg", note: { ro: "pentru ramurile din Bulgaria", en: "for branches in Bulgaria" } }],
  },
];
