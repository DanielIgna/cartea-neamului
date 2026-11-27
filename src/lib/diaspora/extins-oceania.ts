import type { CountryExtra } from "./tipuri";

/**
 * Australia și Noua Zeelandă (Daniel, 27.11.2026): ghid, misiunile României, particularități și întrebări, în română și engleză.
 * Misiunile: lista Comisiei Europene pentru protecția consulară (consulatul general de la Sydney) și lista Ministerului de
 * Externe al Noii Zeelande (ambasada de la Canberra, consulul onorific de la Auckland). Cifrele: ABS 2021, Stats NZ.
 */
export const EXTRA_OCEANIA: Record<string, CountryExtra> = {
  australia: {
    stats: { name: "Australian Bureau of Statistics – QuickStats 2021", url: "https://www.abs.gov.au/census/find-census-data/quickstats/2021/3211_AUS", note: { ro: "oamenii născuți în România, pe orașe, ani de sosire și vârstă", en: "people born in Romania, by city, year of arrival and age" } },
    missions: [
      { kind: "embassy", city: "Canberra", address: "4 Dalman Crescent, O'Malley, ACT 2606", url: "https://canberra.mae.ro" },
      { kind: "cg", city: "Sydney", address: "Ground Floor, 83 York Street, Sydney NSW 2000", url: "https://sydney.mae.ro" },
    ],
    missionsSource: { name: "Comisia Europeană – protecția consulară (Australia)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-australia-au-0_en", note: { ro: "misiunile României în Australia", en: "Romania's missions in Australia" } },
    guide: {
      ro: [
        "Începe cu bunicii, cât sunt încă aici. Mulți au plecat din România în anii '80 și își amintesc satul, numele părinților și ale fraților, dar și drumul până în Australia. Notează numele întregi, numele de fată al bunicii, satul, anii și cine cu cine s-a căsătorit. Cu satul exact, pagina lui de pe Cartea Neamului îți arată comuna, județul și arhiva județeană de care ține azi.",
        "Partea australiană a familiei se găsește ușor: dosarele de imigrare și de naturalizare sunt la National Archives of Australia, iar actele de naștere, căsătorie și deces la registrul statului în care au fost înregistrate (New South Wales, Victoria, Queensland, Western Australia și celelalte au fiecare registrul lor). Dosarul de naturalizare are adesea data și locul nașterii în România, adică exact firul care lipsește.",
        "Pentru actele din România ai trei căi: consulatul general de la Sydney sau ambasada de la Canberra (programare pe econsulat.ro), o rudă din țară căreia îi dai procură semnată la consulat, sau, pentru registrele mai vechi de 100 de ani, serviciul județean al Arhivelor Naționale, căruia îi scrii cu numele, anul aproximativ și satul.",
      ],
      en: [
        "Start with your grandparents while they are still here. Many left Romania in the 1980s and remember the village, their parents' and siblings' names, and the journey to Australia. Write down full names, grandmother's maiden name, the village, the years and who married whom. With the exact village, its page on Cartea Neamului shows you the commune, county and county archive it belongs to today.",
        "The Australian side of the family is easy to find: immigration and naturalisation files are at the National Archives of Australia, and birth, marriage and death records are with the registry of the state where they were registered (New South Wales, Victoria, Queensland, Western Australia and the others each have their own). A naturalisation file often gives the date and place of birth in Romania, which is exactly the missing link.",
        "For records from Romania there are three routes: the Consulate General in Sydney or the Embassy in Canberra (appointments on econsulat.ro), a relative in Romania with a power of attorney signed at the consulate, or, for registers older than 100 years, the county branch of the Romanian National Archives, which you can write to with the name, approximate year and village.",
      ],
    },
    specifics: {
      ro: [
        "Mulți dintre cei sosiți în anii '80 și-au schimbat sau și-au simplificat numele în Australia: Ioan a devenit John, Gheorghe a devenit George, iar diacriticele au dispărut (Ștefănescu a devenit Stefanescu). În arbore păstrează ambele forme, pentru că în actele din România vei căuta numele românesc.",
        "Unii refugiați din anii '80 au trecut întâi prin alte țări, de pildă prin tabere din Austria sau din Iugoslavia, înainte să ajungă în Australia. Dacă un bunic povestește un asemenea drum, notează țara și anul: dosarul australian de imigrare poate pomeni locul de unde a venit.",
        "Copiii născuți în Australia dintr-un părinte cetățean român pot avea și cetățenie română, dar nașterea lor trebuie transcrisă în registrele românești, prin consulat, înainte să poată primi acte românești.",
      ],
      en: [
        "Many of those who arrived in the 1980s changed or simplified their names in Australia: Ioan became John, Gheorghe became George, and the diacritics disappeared (Ștefănescu became Stefanescu). Keep both forms in the tree, because in Romanian records you will search for the Romanian name.",
        "Some refugees of the 1980s first passed through other countries, for example camps in Austria or Yugoslavia, before reaching Australia. If a grandparent tells of such a journey, write down the country and the year: the Australian immigration file may mention where they came from.",
        "Children born in Australia to a Romanian-citizen parent can also hold Romanian citizenship, but their birth has to be transcribed into the Romanian registers through the consulate before Romanian documents can be issued.",
      ],
    },
    faq: {
      ro: [
        { q: "Câți români sunt în Australia?", a: "La recensământul din 2021, 15.268 de oameni s-au născut în România și 28.103 și-au declarat originea română. Cei mai mulți trăiesc în Melbourne, Sydney, Brisbane și Perth." },
        { q: "Unde îmi fac programare pentru acte românești în Australia?", a: "La Consulatul General al României de la Sydney (83 York Street) sau la Ambasada României de la Canberra, cu programare pe econsulat.ro." },
        { q: "Am nevoie de apostilă pentru un act românesc folosit în Australia?", a: "Da, de obicei, plus o traducere autorizată NAATI. Australia nu e în Uniunea Europeană, dar ambele țări folosesc apostila de la Haga." },
        { q: "Unde găsesc dosarul de imigrare al bunicului?", a: "La National Archives of Australia, unde poți căuta gratuit după nume. Dosarele de naturalizare au adesea locul nașterii din România." },
        { q: "Nepoții mei vorbesc doar engleza. Pot citi arborele?", a: "Da. Pe Cartea Neamului fiecare membru al familiei citește arborele în limba lui, iar bunicii îl pot completa în română." },
      ],
      en: [
        { q: "How many Romanians live in Australia?", a: "At the 2021 census, 15,268 people were born in Romania and 28,103 reported Romanian ancestry. Most live in Melbourne, Sydney, Brisbane and Perth." },
        { q: "Where do I book an appointment for Romanian documents in Australia?", a: "At the Consulate General of Romania in Sydney (83 York Street) or the Embassy of Romania in Canberra, with appointments on econsulat.ro." },
        { q: "Do I need an apostille to use a Romanian record in Australia?", a: "Usually yes, plus a certified NAATI translation. Australia is not in the European Union, but both countries use the Hague apostille." },
        { q: "Where can I find my grandfather's immigration file?", a: "At the National Archives of Australia, where you can search by name for free. Naturalisation files often give the place of birth in Romania." },
        { q: "My grandchildren only speak English. Can they read the tree?", a: "Yes. On Cartea Neamului each family member reads the tree in their own language, and the grandparents can fill it in in Romanian." },
      ],
    },
  },
  "noua-zeelanda": {
    stats: { name: "Te Ara – Central and South-Eastern Europeans: facts and figures", url: "https://teara.govt.nz/en/central-and-south-eastern-europeans/page-5", note: { ro: "românii din Noua Zeelandă la recensămintele din 1921–2018", en: "Romanians in New Zealand at the censuses of 1921–2018" } },
    missions: [
      { kind: "embassy", city: "Canberra", address: "4 Dalman Crescent, O'Malley, ACT 2606, Australia", url: "https://canberra.mae.ro" },
    ],
    missionsSource: { name: "New Zealand Ministry of Foreign Affairs and Trade – Embassy of Romania", url: "https://www.mfat.govt.nz/en/countries-and-regions/europe/romania/embassy-of-romania", note: { ro: "misiunile României pentru Noua Zeelandă", en: "Romania's missions for New Zealand" } },
    guide: {
      ro: [
        "Începe cu ce știu părinții și bunicii: numele întregi, numele de fată, satul, anii și cine cu cine s-a căsătorit. Cu satul exact, pagina lui de pe Cartea Neamului îți arată comuna, județul și arhiva județeană de care ține azi.",
        "Pentru actele din România, ambasada de la Canberra se ocupă și de Noua Zeelandă, cu programare pe econsulat.ro; pentru unele formalități te poate ajuta consulul onorific de la Auckland. Mai simplu e adesea prin o rudă din țară, căreia îi dai procură, sau direct la Arhivele Naționale, pentru registrele mai vechi de 100 de ani.",
        "Partea neozeelandeză a familiei o găsești pe site-ul Births, Deaths & Marriages Historical Records, unde actele istorice se caută gratuit, iar dosarele de imigrare și de cetățenie la Archives New Zealand.",
      ],
      en: [
        "Start with what your parents and grandparents know: full names, maiden names, the village, the years and who married whom. With the exact village, its page on Cartea Neamului shows you the commune, county and county archive it belongs to today.",
        "For records from Romania, the Embassy in Canberra also covers New Zealand, with appointments on econsulat.ro; the honorary consul in Auckland can help with some formalities. It is often simpler to go through a relative in Romania with a power of attorney, or directly to the National Archives for registers older than 100 years.",
        "The New Zealand side of the family is on the Births, Deaths & Marriages Historical Records website, where historical records can be searched for free, and immigration and citizenship files are at Archives New Zealand.",
      ],
    },
    specifics: {
      ro: [
        "Pentru că ambasada e în Australia, orice drum la ambasadă înseamnă un zbor. Pregătește dosarul complet înainte și întreabă întâi ce se poate face prin poștă sau prin consulul onorific.",
        "Comunitatea e atât de mică încât multe familii sunt mixte, cu un părinte român și unul neozeelandez, britanic sau din altă țară. Pentru copiii lor, arborele are două jumătăți: partea românească, pornind de la bunicii din România și de la satul lor, și partea cealaltă, pe care o găsești în actele istorice neozeelandeze, în ziarele vechi de pe Papers Past sau în arhivele țării de unde a venit celălalt părinte. Pe Cartea Neamului ambele jumătăți stau în același arbore, iar fiecare rudă îl citește în limba ei.",
        "Copiii născuți în Noua Zeelandă dintr-un părinte cetățean român pot avea și cetățenie română, dar nașterea lor trebuie transcrisă în registrele românești înainte de orice act românesc. Fă-o din timp, nu în anul în care e nevoie de pașaport.",
      ],
      en: [
        "Because the embassy is in Australia, any visit means a flight. Prepare the complete file in advance and ask first what can be done by post or through the honorary consul.",
        "The community is so small that many families are mixed, with one Romanian parent and one from New Zealand, Britain or elsewhere. For their children the tree has two halves: the Romanian side, starting from the grandparents in Romania and their village, and the other side, found in New Zealand historical records, in old newspapers on Papers Past or in the archives of the other parent's country. On Cartea Neamului both halves sit in the same tree, and each relative reads it in their own language.",
        "Children born in New Zealand to a Romanian-citizen parent can also hold Romanian citizenship, but their birth has to be transcribed into the Romanian registers before any Romanian document. Do it early, not in the year a passport is needed.",
      ],
    },
    faq: {
      ro: [
        { q: "Câți români sunt în Noua Zeelandă?", a: "La recensământul din 2018 erau 2.340 de oameni născuți în România, iar 1.485 și-au declarat etnia română. Cei mai mulți trăiesc în regiunile Auckland, Canterbury și Wellington." },
        { q: "Există ambasadă a României în Noua Zeelandă?", a: "Nu. Ambasada României de la Canberra, în Australia, se ocupă și de Noua Zeelandă, iar la Auckland există un consul onorific." },
        { q: "Am nevoie de apostilă pentru un act neozeelandez folosit în România?", a: "Da, de obicei, plus o traducere. Ambele țări folosesc apostila de la Haga." },
        { q: "Unde găsesc actele istorice din Noua Zeelandă?", a: "Pe site-ul Births, Deaths & Marriages Historical Records al Departamentului de Afaceri Interne, unde nașterile, căsătoriile și decesele vechi se caută gratuit. Ziarele vechi sunt pe Papers Past." },
        { q: "Pot face arborele împreună cu rudele din România?", a: "Da. Arborele e comun: bunicii îl completează din România, voi din Noua Zeelandă, și fiecare vede tot ce au adăugat ceilalți." },
      ],
      en: [
        { q: "How many Romanians live in New Zealand?", a: "At the 2018 census there were 2,340 people born in Romania, and 1,485 reported Romanian ethnicity. Most live in the Auckland, Canterbury and Wellington regions." },
        { q: "Is there a Romanian embassy in New Zealand?", a: "No. The Embassy of Romania in Canberra, Australia, also covers New Zealand, and there is an honorary consul in Auckland." },
        { q: "Do I need an apostille to use a New Zealand record in Romania?", a: "Usually yes, plus a translation. Both countries use the Hague apostille." },
        { q: "Where can I find New Zealand historical records?", a: "On the Department of Internal Affairs' Births, Deaths & Marriages Historical Records website, where old births, marriages and deaths can be searched for free. Old newspapers are on Papers Past." },
        { q: "Can I build the tree with relatives in Romania?", a: "Yes. The tree is shared: the grandparents fill it in from Romania, you from New Zealand, and everyone sees what the others have added." },
      ],
    },
  },
};
