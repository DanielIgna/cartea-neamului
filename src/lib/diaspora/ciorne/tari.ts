import type { Country } from "../tipuri";

/**
 * Ciornă (Daniel, 18.11.2026): românii din Ucraina, din regiunea Cernăuți (nordul Bucovinei, ținutul Herța, nordul
 * Basarabiei) și din sudul Basarabiei (regiunea Odesa). Istorie scrisă factual și neutru; ghidurile Bucovina și Basarabia
 * sunt legate de pe paginile regiunilor, nu repetate. Cifrele sunt cele ale recensământului ucrainean din 2001, rotunjite.
 */
export const DRAFT_COUNTRIES: Country[] = [
  {
    slug: "ucraina", code: "UA", flag: "🇺🇦", langs: ["ro", "en"], eu: false, icr: null,
    name: { ro: "Ucraina", en: "Ukraine" },
    where: { ro: "în Ucraina", en: "in Ukraine" },
    size: {
      ro: "în jur de 150.000 de oameni s-au declarat români și în jur de 260.000 moldoveni la recensământul ucrainean din 2001, cei mai mulți în regiunile Cernăuți și Odesa",
      en: "around 150,000 people declared themselves Romanian and around 260,000 Moldovan in the 2001 Ukrainian census, most of them in the Chernivtsi and Odesa regions",
    },
    cities: ["Cernăuți (Chernivtsi)", "Herța (Hertsa)", "Storojineț (Storozhynets)", "Noua Suliță (Novoselytsia)", "Hliboca (Hlyboka)", "Ismail (Izmail)", "Reni", "Chilia (Kiliia)"],
    history: {
      ro: [
        "Românii din Ucraina nu sunt emigranți: cei mai mulți trăiesc de generații în satele lor, pe pământuri care au aparținut, pe rând, Moldovei, Imperiului Habsburgic sau Imperiului Rus, României și apoi Uniunii Sovietice. Granița s-a mutat peste ei, nu ei peste graniță.",
        "Nordul Bucovinei a făcut parte din Moldova până în 1775, când a fost anexat de Imperiul Habsburgic. Bucovina a fost provincie austriacă până în 1918, cu capitala la Cernăuți, unde a funcționat din 1875 o universitate de limbă germană. În noiembrie 1918, Congresul General al Bucovinei a votat unirea cu România. Basarabia a fost anexată de Imperiul Rus în 1812 și s-a unit cu România în 1918.",
        "În iunie 1940, după ultimatumul sovietic din 26 iunie, Uniunea Sovietică a ocupat Basarabia, nordul Bucovinei și ținutul Herța, care ținuse de județul Dorohoi și nu fusese niciodată austriac. Între 1941 și 1944 teritoriile au fost din nou sub administrație românească, apoi au revenit Uniunii Sovietice, iar Tratatul de pace de la Paris din 1947 a confirmat granița. Nordul Bucovinei, Herța și ținutul Hotinului au format regiunea Cernăuți a Ucrainei Sovietice; sudul Basarabiei (Bugeacul) a intrat în regiunea Ismail, unită în 1954 cu regiunea Odesa.",
        "Anii 1940–1941 și cei de după 1944 au adus deportări în Siberia și Kazahstan și fuga multor familii spre România; la Fântâna Albă, la 1 aprilie 1941, grănicerii sovietici au tras asupra unui grup mare de săteni care încercau să treacă granița. Din 1991 regiunile fac parte din Ucraina independentă, iar România și Ucraina au semnat în 1997 tratatul care recunoaște granița și drepturile minorităților de ambele părți.",
        "Azi multe familii au rude de o parte și de alta a graniței: frați rămași în sate diferite după 1940, bunici deportați, copii plecați la studii la Iași, Suceava sau București. Mulți urmași au redobândit cetățenia română, ceea ce cere actele părinților și bunicilor; de aceea arborele familiei e aici și un drum spre acte, nu doar spre amintiri.",
      ],
      en: [
        "Most Romanians in Ukraine are not emigrants: they have lived in their villages for generations, on land that belonged in turn to Moldavia, the Habsburg or Russian Empire, Romania and the Soviet Union. The border moved over them, not they over the border.",
        "Northern Bukovina was part of Moldavia until 1775, when the Habsburg Empire annexed it. Bukovina was an Austrian province until 1918, with its capital at Czernowitz (Cernăuți, Chernivtsi), which had a German-language university from 1875. In November 1918 the General Congress of Bukovina voted for union with Romania. Bessarabia was annexed by the Russian Empire in 1812 and united with Romania in 1918.",
        "In June 1940, after the Soviet ultimatum of 26 June, the Soviet Union occupied Bessarabia, northern Bukovina and the Hertsa area, which had belonged to Dorohoi county and had never been Austrian. From 1941 to 1944 the territories were again under Romanian administration; they then returned to the Soviet Union, and the 1947 Paris Peace Treaty confirmed the border. Northern Bukovina, Hertsa and the Khotyn area became the Chernivtsi region of Soviet Ukraine; southern Bessarabia (the Budjak) became the Izmail region, merged with the Odesa region in 1954.",
        "The years 1940–1941 and those after 1944 brought deportations to Siberia and Kazakhstan, and many families fled to Romania; at Fântâna Albă, on 1 April 1941, Soviet border guards fired on a large group of villagers trying to cross the border. Since 1991 the regions have been part of independent Ukraine, and in 1997 Romania and Ukraine signed the treaty recognising the border and the rights of minorities on both sides.",
        "Today many families have relatives on both sides of the border: siblings who ended up in different countries after 1940, deported grandparents, children who went to study in Iași, Suceava or Bucharest. Many descendants have regained Romanian citizenship, which requires their parents' and grandparents' records, so here a family tree is also a path to documents, not only to memories.",
      ],
    },
    records: [
      { name: "Derzhavna arkhivna sluzhba Ukrainy (State Archival Service of Ukraine)", url: "https://archives.gov.ua", note: { ro: "rețeaua arhivelor de stat ucrainene, inclusiv arhivele regiunilor Cernăuți și Odesa", en: "the Ukrainian state archives network, including the Chernivtsi and Odesa regional archives" } },
      { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "serviciul județean Suceava păstrează o parte din documentele Bucovinei, iar alte servicii au dosarele refugiaților din 1940 și 1944", en: "the Suceava county branch holds part of the Bukovina records; other branches hold files on the 1940 and 1944 refugees" } },
    ],
  },
];
