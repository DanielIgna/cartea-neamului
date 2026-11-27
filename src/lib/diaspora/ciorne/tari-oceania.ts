import type { Country } from "../tipuri";

/**
 * Australia și Noua Zeelandă (Daniel, 27.11.2026: „indexare și pe Australia și Noua Zeelandă”). Aprobare permanentă pentru
 * paginile SEO (20.11.2026). Cifrele: Australian Bureau of Statistics, recensământul din 2021 (QuickStats, „born in Romania”);
 * Noua Zeelandă: Stats NZ prin Te Ara (recensămintele 1921–2018) și Figure.NZ (2023). Misiunile: lista Comisiei Europene și
 * lista oficială a Ministerului de Externe al Noii Zeelande (MFAT).
 */
export const OCEANIA_COUNTRIES: Country[] = [
  {
    slug: "australia", code: "AU", flag: "🇦🇺", langs: ["en", "ro"], eu: false, icr: null,
    name: { ro: "Australia", en: "Australia" },
    where: { ro: "în Australia", en: "in Australia" },
    size: {
      ro: "peste 28.000 de australieni cu origine română, dintre care peste 15.000 născuți în România (recensământul din 2021)",
      en: "over 28,000 Australians of Romanian ancestry, over 15,000 of them born in Romania (2021 census)",
    },
    cities: ["Melbourne", "Sydney", "Brisbane", "Perth", "Canberra"],
    history: {
      ro: [
        "La recensământul australian din 2021, 15.268 de oameni au spus că s-au născut în România, iar 28.103 și-au declarat originea română. Diferența dintre cele două cifre e a doua și a treia generație: copii și nepoți născuți în Australia, care vorbesc engleza acasă și știu de România mai ales din poveștile părinților.",
        "Primul val a venit după al Doilea Război Mondial, când în jur de 2.000 de oameni din România s-au așezat în preajma orașelor Sydney, Melbourne și Brisbane. Cel mai mare val a venit însă în anii '80: aproape o treime dintre cei născuți în România care trăiesc azi în Australia au sosit între 1981 și 1990, mulți plecați din România comunistă ca refugiați. După 1989 i-au urmat rudele, iar după 2011 a sosit încă un val, de aproape 17% din comunitate, mulți veniți la studii sau la muncă.",
        "Comunitatea e mai vârstnică decât media țării: vârsta mediană a celor născuți în România era de 51 de ani în 2021, față de 38 pentru toată Australia. Asta înseamnă că mulți bunici care au trăit plecarea din România sunt încă aici și pot povesti. Pentru nepoții lor, care vor să știe din ce sat vin, acum e momentul să întrebe.",
        "Melbourne are cea mai mare comunitate (5.221 de oameni născuți în România în 2021), urmat de Sydney (3.128), Brisbane (1.921) și Perth (1.828). În fiecare dintre aceste orașe, parohiile și asociațiile românești strâng familii venite din toate regiunile României.",
        "Australia nu e în Uniunea Europeană, dar și Australia, și România fac parte din Convenția de la Haga privind apostila. De aceea, actele românești folosite în Australia au nevoie de apostilă și de o traducere autorizată (NAATI), iar cele australiene folosite în România de apostilă dată de Departamentul australian de Externe (DFAT).",
      ],
      en: [
        "At the 2021 Australian census, 15,268 people said they were born in Romania, and 28,103 reported Romanian ancestry. The gap between those two numbers is the second and third generation: children and grandchildren born in Australia, who speak English at home and know Romania mostly from their parents' stories.",
        "The first wave came after the Second World War, when around 2,000 people from Romania settled around Sydney, Melbourne and Brisbane. The largest wave came in the 1980s: almost a third of the Romania-born people living in Australia today arrived between 1981 and 1990, many of them refugees from communist Romania. After 1989 their relatives followed, and after 2011 came another wave, close to 17% of the community, many of them arriving to study or work.",
        "The community is older than the national average: the median age of the Romania-born was 51 in 2021, against 38 for Australia as a whole. That means many grandparents who lived through leaving Romania are still here and can tell the story. For grandchildren who want to know which village they come from, now is the time to ask.",
        "Melbourne has the largest community (5,221 Romania-born people in 2021), followed by Sydney (3,128), Brisbane (1,921) and Perth (1,828). In each of these cities, Romanian parishes and associations bring together families from every region of Romania.",
        "Australia is not in the European Union, but both Australia and Romania are parties to the Hague Apostille Convention. So Romanian documents used in Australia need an apostille and a certified (NAATI) translation, and Australian documents used in Romania need an apostille from the Department of Foreign Affairs and Trade (DFAT).",
      ],
    },
    records: [
      { name: "National Archives of Australia", url: "https://www.naa.gov.au", note: { ro: "dosarele de imigrare și de naturalizare ale celor sosiți după război și în anii '80", en: "immigration and naturalisation files of those who arrived after the war and in the 1980s" } },
      { name: "Trove (National Library of Australia)", url: "https://trove.nla.gov.au", note: { ro: "ziarele australiene vechi, digitizate și gratuite, unde apar sosiri, căsătorii și necrologuri", en: "old Australian newspapers, digitised and free, with arrivals, marriages and obituaries" } },
      { name: "NSW Registry of Births, Deaths and Marriages", url: "https://www.nsw.gov.au/family-and-relationships/births-deaths-marriages", note: { ro: "actele de stare civilă din New South Wales (Sydney); fiecare stat are registrul lui", en: "civil records for New South Wales (Sydney); each state has its own registry" } },
      { name: "Births, Deaths and Marriages Victoria", url: "https://www.bdm.vic.gov.au", note: { ro: "actele de stare civilă din Victoria (Melbourne)", en: "civil records for Victoria (Melbourne)" } },
      { name: "Australian Bureau of Statistics – born in Romania (2021)", url: "https://www.abs.gov.au/census/find-census-data/quickstats/2021/3211_AUS", note: { ro: "cifrele recensământului din 2021 pentru cei născuți în România", en: "2021 census figures for people born in Romania" } },
    ],
  },
  {
    slug: "noua-zeelanda", code: "NZ", flag: "🇳🇿", langs: ["en", "ro"], eu: false, icr: null,
    name: { ro: "Noua Zeelandă", en: "New Zealand" },
    where: { ro: "în Noua Zeelandă", en: "in New Zealand" },
    size: {
      ro: "în jur de 2.300 de oameni născuți în România (recensământul din 2018)",
      en: "around 2,300 people born in Romania (2018 census)",
    },
    cities: ["Auckland", "Christchurch", "Wellington"],
    history: {
      ro: [
        "Comunitatea românească din Noua Zeelandă e mică, dar veche. Recensămintele numără 24 de oameni născuți în România în 1921, 58 în 1951 și 647 în 1976. Cea mai mare creștere a venit la începutul anilor 2000: de la 918 în 2001 la 2.280 în 2006. La recensământul din 2018 erau 2.340 de oameni născuți în România, iar 1.485 și-au declarat etnia română.",
        "Cei mai mulți trăiesc în regiunile Auckland și Canterbury (Christchurch) și în jurul capitalei, Wellington: la recensământul din 2023, acestea sunt regiunile cu cea mai mare parte de oameni născuți în România. Mulți au venit cu copii mici, care au crescut vorbind engleza și cunosc România mai ales din vacanțe și din poveștile părinților.",
        "Pentru o comunitate atât de mică, legătura cu rudele din România se ține mai ales prin familie, iar arborele familiei e felul cel mai simplu de a le-o arăta copiilor: cine au fost bunicii, din ce sat veneau și ce rude mai sunt acasă.",
        "Noua Zeelandă nu are ambasadă a României. Ambasada României de la Canberra, în Australia, se ocupă și de Noua Zeelandă, iar la Auckland există un consul onorific. Ca și Australia, Noua Zeelandă face parte din Convenția de la Haga privind apostila: actele folosite dintr-o țară în alta au nevoie de apostilă și de traducere.",
      ],
      en: [
        "The Romanian community in New Zealand is small but old. The censuses counted 24 people born in Romania in 1921, 58 in 1951 and 647 in 1976. The biggest growth came in the early 2000s: from 918 in 2001 to 2,280 in 2006. At the 2018 census there were 2,340 people born in Romania, and 1,485 reported Romanian ethnicity.",
        "Most live in the Auckland and Canterbury (Christchurch) regions and around the capital, Wellington: at the 2023 census these are the regions with the highest share of people born in Romania. Many came with young children, who grew up speaking English and know Romania mostly from holidays and their parents' stories.",
        "For such a small community, the link with relatives in Romania is kept mostly through the family, and a family tree is the simplest way to show it to the children: who the grandparents were, which village they came from and which relatives are still back home.",
        "Romania has no embassy in New Zealand. The Embassy of Romania in Canberra, Australia, also covers New Zealand, and there is an honorary consul in Auckland. Like Australia, New Zealand is a party to the Hague Apostille Convention: documents used from one country in the other need an apostille and a translation.",
      ],
    },
    records: [
      { name: "Births, Deaths & Marriages Historical Records (DIA)", url: "https://www.bdmhistoricalrecords.dia.govt.nz", note: { ro: "căutare gratuită în actele istorice de naștere, căsătorie și deces din Noua Zeelandă", en: "free search of New Zealand historical birth, marriage and death records" } },
      { name: "Archives New Zealand", url: "https://www.archives.govt.nz", note: { ro: "dosarele de imigrare și de cetățenie", en: "immigration and citizenship files" } },
      { name: "Papers Past (National Library of New Zealand)", url: "https://paperspast.natlib.govt.nz", note: { ro: "ziarele vechi ale Noii Zeelande, digitizate și gratuite", en: "New Zealand's old newspapers, digitised and free" } },
      { name: "Te Ara – Central and South-Eastern Europeans: facts and figures", url: "https://teara.govt.nz/en/central-and-south-eastern-europeans/page-5", note: { ro: "cifrele recensămintelor pentru românii din Noua Zeelandă, 1921–2018", en: "census figures for Romanians in New Zealand, 1921–2018" } },
    ],
  },
];
