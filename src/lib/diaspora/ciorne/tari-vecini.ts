import type { Country } from "../tipuri";

/**
 * Țările cerute de Daniel pe 19.11.2026 („la fel articol pentru Serbia… Bulgaria… Luxemburg”, „articole despre Moldova
 * care a fost unită cu România și vorbește aceeași limbă”), plus Turcia, odată cu limba turcă. Aprobare permanentă
 * („rulează fără mine”, 19.11.2026 23:08). Istorie spusă factual și neutru; cifrele doar unde sunt sigure (recensământul
 * sârb din 2022, rotunjit), altfel lipsesc.
 */
export const NEIGHBOUR_COUNTRIES: Country[] = [
  {
    slug: "republica-moldova", code: "MD", flag: "🇲🇩", langs: ["ro", "en"], eu: false, icr: null,
    name: { ro: "Republica Moldova", en: "Moldova" },
    where: { ro: "în Republica Moldova", en: "in Moldova" },
    size: null,
    cities: ["Chișinău", "Bălți", "Cahul", "Ungheni", "Orhei", "Soroca", "Comrat", "Edineț"],
    history: {
      ro: [
        "Pentru o familie din Republica Moldova, arborele genealogic se scrie în aceeași limbă ca în România: limba oficială a statului este româna, iar din 2023 legile folosesc peste tot această denumire. Diferența nu e de limbă, ci de istorie: în două sute de ani, ținutul dintre Prut și Nistru a schimbat de mai multe ori statul, iar actele bunicilor sunt scrise, pe rând, în rusă, în română cu alfabet latin și în română cu alfabet chirilic.",
        "Până în 1812, Basarabia a fost partea de răsărit a Principatului Moldovei. Prin Pacea de la București din 1812 a fost anexată de Imperiul Rus și a rămas gubernie rusească o sută de ani. La 27 martie 1918, Sfatul Țării de la Chișinău a votat unirea Basarabiei cu România, iar ținutul a făcut parte din România până în 1940.",
        "La 28 iunie 1940, după ultimatumul sovietic, Uniunea Sovietică a ocupat Basarabia, iar în august 1940 a fost creată Republica Sovietică Socialistă Moldovenească. Între 1941 și 1944 ținutul a fost din nou sub administrație românească, apoi a revenit Uniunii Sovietice. Au urmat deportările din 1941, 1949 și 1951, când zeci de mii de oameni au fost duși în Siberia și Kazahstan, și foametea din 1946–1947. Multe familii au rămas despărțite: unii au trecut Prutul în 1940 sau în 1944, alții au rămas.",
        "În 1989, româna cu alfabet latin a redevenit limba oficială, iar la 27 august 1991 Republica Moldova și-a proclamat independența. De atunci, sute de mii de oameni au redobândit cetățenia română, pe baza actelor părinților și bunicilor născuți înainte de 1940, și mulți au plecat la muncă în Italia, Spania, Germania, Marea Britanie sau Israel. Azi o familie din Moldova are adesea un frate la Chișinău, o soră la Padova și copii născuți la Londra.",
        "Pentru toți aceștia, arborele familiei e mai mult decât o amintire. E harta care leagă satele bunicilor de actele de care au nevoie copiii și de rudele risipite prin lume, și e locul în care poveștile despre deportare, despre război și despre plecare rămân scrise cu numele oamenilor.",
      ],
      en: [
        "For a family from Moldova, a family tree is written in the same language as in Romania: the official language of the state is Romanian, and since 2023 the laws use that name throughout. The difference is not one of language but of history: in two hundred years, the land between the Prut and the Dniester changed state several times, and the grandparents' records are written in turn in Russian, in Romanian in the Latin alphabet and in Romanian in the Cyrillic alphabet.",
        "Until 1812, Bessarabia was the eastern part of the Principality of Moldavia. Under the 1812 Treaty of Bucharest it was annexed by the Russian Empire and remained a Russian province for a hundred years. On 27 March 1918, the Sfatul Țării assembly in Chișinău voted for the union of Bessarabia with Romania, and the region was part of Romania until 1940.",
        "On 28 June 1940, after a Soviet ultimatum, the Soviet Union occupied Bessarabia, and in August 1940 the Moldavian Soviet Socialist Republic was created. From 1941 to 1944 the region was again under Romanian administration; it then returned to the Soviet Union. The deportations of 1941, 1949 and 1951 followed, when tens of thousands of people were taken to Siberia and Kazakhstan, as did the famine of 1946–1947. Many families were split: some crossed the Prut in 1940 or 1944, others stayed.",
        "In 1989, Romanian in the Latin alphabet became the official language again, and on 27 August 1991 Moldova declared independence. Since then hundreds of thousands of people have regained Romanian citizenship on the basis of their parents' and grandparents' records from before 1940, and many have gone to work in Italy, Spain, Germany, the United Kingdom or Israel. Today a Moldovan family often has a brother in Chișinău, a sister in Padua and children born in London.",
        "For all of them, a family tree is more than a memory. It is the map that links the grandparents' villages to the records the children need and to relatives scattered around the world, and the place where the stories of deportation, war and leaving stay written down with people's names.",
      ],
    },
    records: [
      { name: "Agenția Națională a Arhivelor (Republica Moldova)", url: "https://arhiva.gov.md", note: { ro: "registrele parohiale (metricele) din perioada rusă, actele din anii românești și dosarele din perioada sovietică", en: "parish registers (metrical books) from the Russian period, records from the Romanian years and Soviet-era files" } },
      { name: "Agenția Servicii Publice: starea civilă", url: "https://www.asp.gov.md", note: { ro: "certificate de naștere, căsătorie și deces și extrase din registrele de stare civilă", en: "birth, marriage and death certificates and extracts from the civil registers" } },
      { name: "Autoritatea Națională pentru Cetățenie (România)", url: "https://cetatenie.just.ro", note: { ro: "redobândirea cetățeniei române: actele cerute și stadiul dosarului", en: "regaining Romanian citizenship: required records and file status" } },
      { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "documente din anii 1918–1940 și 1941–1944 și dosarele refugiaților din Basarabia", en: "records from 1918–1940 and 1941–1944 and files on refugees from Bessarabia" } },
    ],
  },
  {
    slug: "serbia", code: "RS", flag: "🇷🇸", langs: ["ro", "en"], eu: false, icr: null,
    name: { ro: "Serbia", en: "Serbia" },
    where: { ro: "în Serbia", en: "in Serbia" },
    size: {
      ro: "în jur de 23.000 de oameni s-au declarat români și în jur de 21.000 vlahi la recensământul sârb din 2022: românii mai ales în Voivodina, vlahii mai ales în estul Serbiei",
      en: "around 23,000 people declared themselves Romanian and around 21,000 Vlach in the 2022 Serbian census: the Romanians mostly in Vojvodina, the Vlachs mostly in eastern Serbia",
    },
    cities: ["Vârșeț (Vršac)", "Panciova (Pančevo)", "Zrenianin (Zrenjanin)", "Alibunar", "Novi Sad", "Zaicear (Zaječar)", "Negotin", "Bor", "Belgrad (Beograd)"],
    history: {
      ro: [
        "Românii din Serbia trăiesc în două ținuturi cu istorii diferite. În Banatul sârbesc, în provincia autonomă Voivodina, sunt sate românești vechi, cu școli, presă și teatru în limba română. În estul Serbiei, în Valea Timocului și de-a lungul Dunării, între Morava, Timoc și Dunăre, trăiesc vlahii, care vorbesc graiuri românești și păstrează obiceiuri vechi.",
        "Banatul a fost sub stăpânire habsburgică din 1718 până în 1918. După Primul Război Mondial, în 1919–1920, a fost împărțit între România, Regatul Sârbilor, Croaților și Slovenilor și, o mică parte, Ungaria. Românii din satele rămase la sud de noua graniță au devenit cetățeni ai Iugoslaviei, iar apoi ai Serbiei. Azi limba română este una dintre limbile oficiale ale Voivodinei, iar la Panciova apare din 1945 săptămânalul în limba română „Libertatea”.",
        "Vlahii din estul Serbiei au o istorie mai veche decât granița de azi: mulți au venit, în secolele XVIII și XIX, din Oltenia și din Banat, alții trăiau acolo de mai demult. La recensămintele sârbe, unii se declară români, alții vlahi; ambele grupuri vorbesc graiuri ale limbii române, iar o familie poate avea în acte ambele denumiri, de la o generație la alta.",
        "În ultimele decenii, mulți tineri din aceste sate au plecat la muncă în Austria, Germania, Elveția sau Franța, iar alții au venit la studii în România, la Timișoara sau la București. Așa se face că un arbore al unei familii din Vârșeț sau din Negotin are azi ramuri în trei sau patru țări și în tot atâtea limbi.",
        "Pentru ei, Cartea Neamului e un loc în care familia își scrie istoria în limba bunicilor, chiar dacă nepoții citesc mai ușor în sârbă sau în germană, și în care fiecare ramură poate adăuga ce știe, de oriunde ar fi.",
      ],
      en: [
        "The Romanians of Serbia live in two areas with different histories. In the Serbian Banat, in the autonomous province of Vojvodina, there are old Romanian villages with schools, newspapers and theatre in Romanian. In eastern Serbia, in the Timok Valley and along the Danube, between the Morava, the Timok and the Danube, live the Vlachs, who speak Romanian dialects and keep old customs.",
        "The Banat was under Habsburg rule from 1718 to 1918. After the First World War, in 1919–1920, it was divided between Romania, the Kingdom of Serbs, Croats and Slovenes and, a small part, Hungary. Romanians in the villages left south of the new border became citizens of Yugoslavia and then of Serbia. Today Romanian is one of the official languages of Vojvodina, and the Romanian-language weekly „Libertatea” has been published in Pančevo since 1945.",
        "The Vlachs of eastern Serbia have a history older than today's border: many came in the 18th and 19th centuries from Oltenia and the Banat, while others had lived there longer. In Serbian censuses some declare themselves Romanian and others Vlach; both groups speak dialects of Romanian, and one family may carry both names in its records from one generation to the next.",
        "In recent decades many young people from these villages have gone to work in Austria, Germany, Switzerland or France, and others have come to study in Romania, in Timișoara or Bucharest. So the tree of a family from Vršac or Negotin today has branches in three or four countries and as many languages.",
        "For them, Cartea Neamului is a place where the family writes its history in the grandparents' language, even if the grandchildren read more easily in Serbian or German, and where every branch can add what it knows, wherever it lives.",
      ],
    },
    records: [
      { name: "Arhiv Vojvodine", url: "https://www.arhivvojvodine.org.rs", note: { ro: "arhiva provinciei Voivodina, de la Novi Sad: documente din perioada habsburgică și de după 1918", en: "the archive of Vojvodina province in Novi Sad: records from the Habsburg period and after 1918" } },
      { name: "Arhiv Srbije", url: "http://www.archives.org.rs", note: { ro: "Arhivele Serbiei, la Belgrad, cu rețeaua arhivelor istorice regionale", en: "the Archives of Serbia in Belgrade, with the network of regional historical archives" } },
      { name: "Ambasada României la Belgrad", url: "https://belgrad.mae.ro", note: { ro: "acte, procuri și transcrieri, cu programare pe econsulat.ro", en: "records, powers of attorney and transcriptions, booked on econsulat.ro" } },
    ],
  },
  {
    slug: "bulgaria", code: "BG", flag: "🇧🇬", langs: ["ro", "en"], eu: true, icr: null,
    name: { ro: "Bulgaria", en: "Bulgaria" },
    where: { ro: "în Bulgaria", en: "in Bulgaria" },
    size: null,
    cities: ["Sofia", "Vidin", "Ruse", "Lom", "Silistra", "Dobrici (Dobrich)", "Varna"],
    history: {
      ro: [
        "Bulgaria și România au în comun Dunărea și o graniță lungă, peste care familiile au trecut de multe ori. În nord-vestul Bulgariei, în jurul Vidinului și de-a lungul Dunării, trăiesc vlahi care vorbesc graiuri românești, înrudiți cu cei din Valea Timocului din Serbia. Mai la răsărit, la Ruse, Silistra și Dobrici, sunt familii cu rădăcini de ambele părți ale fluviului.",
        "Sudul Dobrogei, numit Cadrilater, a făcut parte din România între 1913 și 1940. Prin Tratatul de la Craiova din 7 septembrie 1940 a revenit Bulgariei, iar tratatul a prevăzut un schimb de populație: românii din Cadrilater s-au mutat în nordul Dobrogei, iar bulgarii din nord s-au mutat la sud. Multe familii din județele Constanța și Tulcea au bunici născuți la Bazargic (azi Dobrici), Balcic sau Silistra, cu acte rămase în arhivele bulgare.",
        "După 2007, când ambele țări au intrat în Uniunea Europeană, drumurile s-au deschis din nou: români lucrează și trăiesc la Sofia, la Varna sau pe litoral, iar podurile de la Giurgiu–Ruse și Calafat–Vidin leagă zilnic cele două maluri. În 2025 România a deschis la Ruse un consulat onorific.",
        "Pentru o familie cu rădăcini în Cadrilater, în satele vlahilor de lângă Vidin sau într-o căsătorie româno-bulgară, arborele genealogic adună acte scrise în română și în bulgară, cu alfabet latin și chirilic, și nume care s-au schimbat de la o graniță la alta. Cartea Neamului le ține pe toate la un loc, cu forma din fiecare act.",
        "Fiindcă ambele țări sunt în Uniunea Europeană, actele de stare civilă circulă între ele fără apostilă, cu formularul multilingv european acolo unde există; asta face mai simplu drumul de la arbore la acte.",
      ],
      en: [
        "Bulgaria and Romania share the Danube and a long border, which families have crossed many times. In north-western Bulgaria, around Vidin and along the Danube, live Vlachs who speak Romanian dialects, related to those of the Timok Valley in Serbia. Further east, in Ruse, Silistra and Dobrich, there are families with roots on both sides of the river.",
        "Southern Dobruja, known in Romanian as the Cadrilater, was part of Romania from 1913 to 1940. Under the Treaty of Craiova of 7 September 1940 it returned to Bulgaria, and the treaty provided for a population exchange: Romanians from the Cadrilater moved to northern Dobruja and Bulgarians from the north moved south. Many families in Constanța and Tulcea counties have grandparents born in Bazargic (today Dobrich), Balchik or Silistra, with records still in Bulgarian archives.",
        "After 2007, when both countries joined the European Union, the roads opened again: Romanians live and work in Sofia, in Varna and on the coast, and the bridges at Giurgiu–Ruse and Calafat–Vidin link the two banks every day. In 2025 Romania opened an honorary consulate in Ruse.",
        "For a family with roots in the Cadrilater, in the Vlach villages near Vidin or in a Romanian-Bulgarian marriage, the family tree gathers records written in Romanian and Bulgarian, in the Latin and Cyrillic alphabets, and names that changed from one border to the next. Cartea Neamului keeps them all together, with the form found in each record.",
        "Because both countries are in the European Union, civil-status records move between them without an apostille, with the European multilingual form where one exists, which makes the road from the tree to the records simpler.",
      ],
    },
    records: [
      { name: "Държавна агенция „Архиви” (State Archives Agency)", url: "https://archives.government.bg", note: { ro: "arhivele de stat bulgare, cu arhivele regionale de la Vidin, Ruse, Silistra și Dobrici", en: "the Bulgarian state archives, with the regional archives in Vidin, Ruse, Silistra and Dobrich" } },
      { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "serviciile județene Constanța și Tulcea păstrează documente despre Cadrilater și despre schimbul de populație din 1940", en: "the Constanța and Tulcea county branches hold records on the Cadrilater and the 1940 population exchange" } },
      { name: "Ambasada României la Sofia", url: "https://sofia.mae.ro", note: { ro: "acte, procuri și transcrieri, cu programare pe econsulat.ro", en: "records, powers of attorney and transcriptions, booked on econsulat.ro" } },
    ],
  },
  {
    slug: "turcia", code: "TR", flag: "🇹🇷", langs: ["ro", "en"], eu: false, icr: null,
    name: { ro: "Turcia", en: "Turkey" },
    where: { ro: "în Turcia", en: "in Turkey" },
    size: null,
    cities: ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa", "Eskișehir"],
    history: {
      ro: [
        "Legăturile dintre Turcia și România sunt mai vechi decât orice graniță de azi. Dobrogea a fost sute de ani parte a Imperiului Otoman, iar turcii și tătarii din Dobrogea sunt și azi o comunitate a României, cu asociații, școli și sărbători proprii. Multe familii au rude de ambele părți ale Mării Negre.",
        "După 1878, când Dobrogea de nord a intrat în componența României, și apoi în perioada interbelică, mulți turci și tătari dobrogeni au emigrat în Turcia; o convenție româno-turcă din 1936 a reglementat această emigrare. Urmașii lor trăiesc azi la Istanbul, Bursa, Eskișehir sau Ankara și păstrează amintirea satelor din Dobrogea: Medgidia, Mangalia, Babadag sau Cobadin.",
        "În ultimele decenii au venit în Turcia și români: oameni de afaceri, studenți, soți și soții în familii româno-turce, oameni care lucrează în turism pe coasta de sud. La Istanbul și la Izmir România are consulate generale, iar la Ankara ambasada.",
        "Pentru o familie dobrogeană cu ramuri în Turcia, un arbore genealogic adună acte otomane, românești și turcești, cu nume scrise în alfabet arab, latin și, după 1928, în noul alfabet turc. Numele de familie au apărut în Turcia abia în 1934, prin legea numelui de familie, așa că strămoșii de dinainte apar în acte doar cu prenumele, prenumele tatălui și o poreclă sau locul de baștină.",
        "Cartea Neamului e scrisă și în turcă, așa că bunicii pot povesti în română sau în turcă, iar nepoții din Istanbul sau din Constanța pot citi același arbore în limba lor.",
      ],
      en: [
        "The ties between Turkey and Romania are older than any of today's borders. Dobruja was part of the Ottoman Empire for hundreds of years, and the Turks and Tatars of Dobruja are still a community of Romania today, with their own associations, schools and holidays. Many families have relatives on both shores of the Black Sea.",
        "After 1878, when northern Dobruja became part of Romania, and again between the world wars, many Dobrujan Turks and Tatars emigrated to Turkey; a Romanian-Turkish convention of 1936 regulated this emigration. Their descendants live today in Istanbul, Bursa, Eskișehir or Ankara and keep the memory of villages in Dobruja: Medgidia, Mangalia, Babadag or Cobadin.",
        "In recent decades Romanians have also come to Turkey: business people, students, husbands and wives in Romanian-Turkish families, people working in tourism on the southern coast. Romania has consulates general in Istanbul and Izmir and its embassy in Ankara.",
        "For a Dobrujan family with branches in Turkey, a family tree gathers Ottoman, Romanian and Turkish records, with names written in the Arabic script, the Latin alphabet and, after 1928, the new Turkish alphabet. Surnames only appeared in Turkey in 1934, with the Surname Law, so earlier ancestors appear in records with just a first name, the father's name and a nickname or place of origin.",
        "Cartea Neamului is also written in Turkish, so grandparents can tell their stories in Romanian or Turkish, and grandchildren in Istanbul or Constanța can read the same tree in their own language.",
      ],
    },
    records: [
      { name: "Devlet Arşivleri Başkanlığı (Presidency of State Archives)", url: "https://www.devletarsivleri.gov.tr", note: { ro: "arhivele otomane și ale Republicii Turcia, inclusiv registre despre Dobrogea otomană", en: "the Ottoman and Republican archives, including registers on Ottoman Dobruja" } },
      { name: "Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü", url: "https://www.nvi.gov.tr", note: { ro: "registrul populației din Turcia; prin e-Devlet, cetățenii turci își pot vedea ascendenții înregistrați", en: "Turkey's population register; through e-Devlet, Turkish citizens can see their registered ancestors" } },
      { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "serviciile județene Constanța și Tulcea: actele familiilor dobrogene", en: "the Constanța and Tulcea county branches: records of Dobrujan families" } },
    ],
  },
  {
    slug: "luxemburg", code: "LU", flag: "🇱🇺", langs: ["ro", "en"], eu: true, icr: null,
    name: { ro: "Luxemburg", en: "Luxembourg" },
    where: { ro: "în Luxemburg", en: "in Luxembourg" },
    size: null,
    cities: ["Luxembourg", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck"],
    history: {
      ro: [
        "Luxemburgul e o țară mică, cu trei limbi oficiale (luxemburgheza, franceza și germana) în care aproape jumătate dintre locuitori sunt cetățeni ai altor țări. Românii au ajuns aici mai ales după 2007, când România a intrat în Uniunea Europeană.",
        "Mulți lucrează la instituțiile europene care au sediul în Luxemburg: Curtea de Justiție a Uniunii Europene, Curtea de Conturi Europeană, Banca Europeană de Investiții, Eurostat și o parte din serviciile Comisiei și ale Parlamentului European. Alții lucrează în bănci și în fondurile de investiții, în informatică, în construcții, în îngrijire sau în restaurante. Mulți locuiesc peste graniță, în Franța, Belgia sau Germania, și trec zilnic granița la muncă.",
        "Copiii crescuți aici învață la școală luxemburgheza, germana și franceza, iar acasă româna. Pentru ei, un arbore al familiei cu bunicii din România e o legătură cu o limbă pe care o aud mai ales în vacanțe și o poveste pe care altfel n-ar avea cine să le-o spună în întregime.",
        "Familiile mixte, româno-luxemburgheze, româno-franceze sau româno-portugheze, au două sau trei ramuri de urmărit, în arhive scrise în limbi diferite. Partea luxemburgheză e ușor de început: registrele de stare civilă sunt ținute de fiecare comună, iar Arhivele Naționale ale Luxemburgului păstrează documentele vechi.",
        "Fiindcă Luxemburgul e în Uniunea Europeană, actele de stare civilă românești și luxemburgheze circulă fără apostilă, iar pentru multe dintre ele există formularul multilingv european, care scutește și de traducere.",
        "Comunitatea e tânără, dar are deja povești de spus: primii veniți, care au trăit mutarea în altă țară cu copii mici, părinții rămași în România care vin la nepoți pentru câteva luni pe an, nunțile făcute într-o țară și aniversările copiilor în alta. Toate acestea se pierd repede dacă nu le scrie nimeni. Un arbore al familiei, cu fotografii, cu date și cu vocea bunicilor înregistrată la telefon, le păstrează pentru copiii care vor crește între trei limbi.",
      ],
      en: [
        "Luxembourg is a small country with three official languages (Luxembourgish, French and German), where almost half of the residents are citizens of other countries. Romanians arrived mostly after 2007, when Romania joined the European Union.",
        "Many work at the European institutions based in Luxembourg: the Court of Justice of the European Union, the European Court of Auditors, the European Investment Bank, Eurostat and part of the services of the Commission and the European Parliament. Others work in banks and investment funds, in IT, construction, care or restaurants. Many live across the border in France, Belgium or Germany and cross it every day for work.",
        "Children growing up here learn Luxembourgish, German and French at school and Romanian at home. For them, a family tree with their grandparents in Romania is a link to a language they hear mostly on holiday, and to a story that otherwise nobody would tell them in full.",
        "Mixed families, Romanian-Luxembourgish, Romanian-French or Romanian-Portuguese, have two or three branches to follow, in archives written in different languages. The Luxembourg side is easy to start: civil registers are kept by each commune, and the National Archives of Luxembourg hold the old records.",
        "Because Luxembourg is in the European Union, Romanian and Luxembourg civil-status records move between the two countries without an apostille, and for many of them there is the European multilingual form, which also spares you a translation.",
        "The community is young, but it already has stories to tell: the first arrivals, who moved country with small children, the parents left in Romania who come to stay with their grandchildren for a few months a year, weddings held in one country and children's birthdays in another. All of this is quickly lost if nobody writes it down. A family tree with photos, dates and the grandparents' voices recorded on a phone keeps it for children who will grow up between three languages.",
      ],
    },
    records: [
      { name: "Archives nationales de Luxembourg", url: "https://anlux.public.lu", note: { ro: "arhivele statului luxemburghez, cu registre vechi de stare civilă și documente de familie", en: "the Luxembourg state archives, with old civil registers and family records" } },
      { name: "Guichet.lu: actele de stare civilă", url: "https://guichet.public.lu", note: { ro: "cum se cer actele de naștere, căsătorie și deces de la comuna unde au fost înregistrate", en: "how to request birth, marriage and death records from the commune where they were registered" } },
      { name: "Ambasada României la Luxemburg", url: "https://luxemburg.mae.ro", note: { ro: "acte, procuri și transcrieri, cu programare pe econsulat.ro", en: "records, powers of attorney and transcriptions, booked on econsulat.ro" } },
    ],
  },
];
