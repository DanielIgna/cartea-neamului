import type { Region } from "../tipuri";

/**
 * Ciornele regiunilor din Europa și Ucraina (Daniel, 18.11.2026): istoria locală a românilor, în limba țării și în română.
 * Doar fapte verificate, fără cifre pe care nu le știm sigur. O regiune intră în Google cu cel puțin 300 de cuvinte proprii în
 * română (ca orașele). Ghidurile legate (`guides`) nu se repetă aici.
 */
export const DRAFT_REGIONS: Region[] = [
  // ---------------------------------------------------------------- Ucraina
  {
    slug: "cernauti", country: "ua", kind: "region",
    name: { ro: "Regiunea Cernăuți", en: "Chernivtsi region" },
    where: { ro: "în regiunea Cernăuți", en: "in the Chernivtsi region" },
    langs: ["ro", "en"],
    cities: ["Cernăuți", "Herța", "Storojineț", "Hliboca (Adâncata)", "Noua Suliță", "Hotin"],
    guides: ["bucovina-registre-si-arhive", "basarabia-registrele-parohiale", "redobandirea-cetateniei-acte-stramosi", "deportati-in-baragan-si-siberia"],
    notes: {
      ro: [
        "Regiunea Cernăuți a Ucrainei adună trei ținuturi cu istorii diferite. Nordul Bucovinei, cu orașul Cernăuți, a fost moldovenesc până în 1775 și austriac până în 1918. Ținutul Herța a ținut de județul Dorohoi al Vechiului Regat și n-a fost niciodată austriac. Ținutul Hotinului e partea de nord a Basarabiei, rusească din 1812 până în 1918. Între 1918 și 1940 toate trei au făcut parte din România, iar din 1940, respectiv 1944, din Ucraina Sovietică.",
        "Satele românești sunt mai ales în sudul regiunii, de-a lungul Prutului și Siretului și spre granița cu România: în jurul Herței, al Storojinețului, al Hlibocii (Adâncata) și al Noii Sulițe. La recensământul din 2001, aproape o cincime din locuitorii regiunii s-au declarat români sau moldoveni; în aceleași sate, unii s-au trecut într-un fel și vecinii lor în celălalt, deși vorbesc aceeași limbă.",
        "Cernăuți a fost un oraș cu multe limbi: români, ucraineni, germani, evrei, polonezi. Aici a învățat Mihai Eminescu la gimnaziu, la profesorul Aron Pumnul, iar universitatea înființată în 1875 a format generații de preoți, profesori și juriști din toată Bucovina. Clădirea fostei reședințe a mitropoliților Bucovinei găzduiește azi universitatea și e în patrimoniul mondial UNESCO.",
        "Pentru genealogie, registrele din perioada austriacă sunt bine ținute, scrise în germană, latină sau română, cu alfabet chirilic românesc în prima jumătate a secolului XIX. Multe sunt la arhiva de stat a regiunii, la Cernăuți; o parte din documentele Bucovinei sunt la Suceava, iar pentru ținutul Hotinului se caută și la Chișinău. Dosarele familiilor refugiate în România în 1940 și 1944 sunt la Arhivele Naționale ale României.",
        "Multe familii de aici au cerut redobândirea cetățeniei române, iar pentru asta le trebuie actele părinților și ale bunicilor, uneori din trei țări. Un arbore al familiei, cu satul și anii scriși corect, scurtează mult căutarea. Scrie numele satului în toate formele lui, românească, germană din vremea austriacă, rusă și ucraineană, pentru că fiecare arhivă îl caută altfel.",
      ],
      en: [
        "Ukraine's Chernivtsi region brings together three areas with different histories. Northern Bukovina, with the city of Chernivtsi (Cernăuți, Czernowitz), was Moldavian until 1775 and Austrian until 1918. The Hertsa area belonged to Dorohoi county in the Romanian Old Kingdom and was never Austrian. The Khotyn area is the northern part of Bessarabia, Russian from 1812 to 1918. Between 1918 and 1940 all three were part of Romania, and from 1940, finally from 1944, part of Soviet Ukraine.",
        "Romanian villages lie mainly in the south of the region, along the Prut and Siret rivers and towards the Romanian border: around Hertsa, Storozhynets, Hlyboka (Adâncata) and Novoselytsia (Noua Suliță). In the 2001 census almost a fifth of the region's inhabitants declared themselves Romanian or Moldovan; in the same villages some registered one way and their neighbours the other, although they speak the same language.",
        "Czernowitz was a city of many languages: Romanians, Ukrainians, Germans, Jews and Poles. The poet Mihai Eminescu went to secondary school here, and the university founded in 1875 trained generations of priests, teachers and lawyers from all over Bukovina. The former residence of the metropolitans of Bukovina now houses the university and is a UNESCO World Heritage Site.",
        "For genealogy, Austrian-period registers are well kept, written in German, Latin or Romanian, in the Romanian Cyrillic alphabet in the first half of the 19th century. Many are held by the regional state archive in Chernivtsi; part of the Bukovina records are in Suceava, Romania, and for the Khotyn area it is worth searching in Chișinău as well. Files on families who fled to Romania in 1940 and 1944 are held by the Romanian National Archives.",
        "Many local families have applied to regain Romanian citizenship, which requires their parents' and grandparents' records, sometimes from three countries. A family tree with the village and the years written correctly makes that search much shorter.",
      ],
    },
  },
  {
    slug: "sudul-basarabiei", country: "ua", kind: "region",
    name: { ro: "Sudul Basarabiei (regiunea Odesa)", en: "Southern Bessarabia (Odesa region)" },
    where: { ro: "în sudul Basarabiei", en: "in southern Bessarabia" },
    langs: ["ro", "en"],
    cities: ["Ismail", "Reni", "Chilia", "Cetatea Albă (Bilhorod-Dnistrovskyi)", "Bolgrad", "Sărata"],
    guides: ["basarabia-registrele-parohiale", "redobandirea-cetateniei-acte-stramosi", "scrierea-chirilica-romaneasca", "calendarul-iulian-si-gregorian"],
    notes: {
      ro: [
        "Sudul Basarabiei, numit și Bugeac, e ținutul dintre Prut, Dunăre, Nistru și Marea Neagră. Azi e partea de sud-vest a regiunii Odesa din Ucraina, cu orașele Ismail, Reni, Chilia, Bolgrad și Cetatea Albă.",
        "Istoria lui are o întorsătură aparte. Basarabia a fost anexată de Imperiul Rus în 1812, dar după Războiul Crimeii, prin Tratatul de la Paris din 1856, sudul ei (județele Cahul, Bolgrad și Ismail) a revenit Moldovei, apoi Principatelor Unite, până în 1878, când Congresul de la Berlin l-a dat înapoi Rusiei. Între 1918 și 1940 a fost din nou în România. În 1940 a fost ocupat de Uniunea Sovietică și dat Ucrainei Sovietice, nu Moldovei Sovietice; regiunea Ismail a fost unită cu regiunea Odesa în 1954.",
        "Bugeacul a fost dintotdeauna un ținut amestecat. În secolul XIX, Imperiul Rus a așezat aici bulgari, găgăuzi și coloniști germani, alături de moldoveni, ucraineni, ruși și lipoveni. Coloniștii germani au plecat în 1940, prin strămutarea organizată atunci. Satele românești și moldovenești sunt mai ales spre Dunăre și Prut, în jurul Ismailului și al Reniului; la recensământul din 2001, majoritatea s-au declarat moldoveni, iar puțini români.",
        "Pentru genealogie, registrele parohiale din perioada rusă sunt în rusă, cu date pe stil vechi, iar cele dintre 1856 și 1878 și dintre 1918 și 1940 sunt în română. O parte se păstrează la arhivele din Ucraina, alta la Arhivele Naționale ale Republicii Moldova, la Chișinău, unde a stat consistoriul Basarabiei. Pentru anii românești se caută și în fondurile fostelor prefecturi Cahul, Ismail și Cetatea Albă.",
        "Multe familii din Bugeac au rude în Republica Moldova, în România și în Ucraina. Când cauți un strămoș de aici, scrie numele satului în toate formele lui: românească, rusă și ucraineană, pentru că s-a schimbat de câteva ori. La fel și numele de familie: în actele rusești, sovietice și ucrainene, același nume românesc poate fi transcris în mai multe feluri, de la Popescu la Popesku.",
      ],
      en: [
        "Southern Bessarabia, also called the Budjak, is the land between the Prut, the Danube, the Dniester and the Black Sea. Today it is the south-western part of Ukraine's Odesa region, with the towns of Izmail, Reni, Kiliia, Bolhrad and Bilhorod-Dnistrovskyi (Cetatea Albă, Akkerman).",
        "Its history has a particular twist. Bessarabia was annexed by the Russian Empire in 1812, but after the Crimean War, under the 1856 Treaty of Paris, its southern part (the Cahul, Bolgrad and Izmail districts) returned to Moldavia and belonged to the United Principalities of Romania until 1878, when the Congress of Berlin gave it back to Russia. From 1918 to 1940 it was again part of Romania. In 1940 it was occupied by the Soviet Union and given to Soviet Ukraine, not Soviet Moldavia; the Izmail region was merged with the Odesa region in 1954.",
        "The Budjak has always been mixed. In the 19th century the Russian Empire settled Bulgarians, Gagauz and German colonists here, alongside Moldovans, Ukrainians, Russians and Lipovans. The German colonists left in 1940 through the resettlement organised at the time. Romanian and Moldovan villages lie mostly towards the Danube and the Prut, around Izmail and Reni; in the 2001 census most of their inhabitants declared themselves Moldovan, and few Romanian.",
        "For genealogy, parish registers from the Russian period are in Russian, with Old Style dates, while those from 1856–1878 and 1918–1940 are in Romanian. Some are kept in Ukrainian archives, others in the National Archives of the Republic of Moldova in Chișinău, where the Bessarabian consistory sat. For the Romanian years, it is also worth searching the records of the former Cahul, Izmail and Cetatea Albă prefectures.",
        "Many Budjak families have relatives in the Republic of Moldova, in Romania and in Ukraine. When you look for an ancestor from here, write the village name in all its forms, Romanian, Russian and Ukrainian, because it changed several times.",
      ],
    },
  },
];
