import type { CountryExtra } from "./tipuri";

/**
 * Republica Moldova, Serbia, Bulgaria, Turcia și Luxemburg (Daniel, 19.11.2026; aprobare permanentă): ghid, misiunile
 * României, particularități și întrebări, în română și engleză. Misiunile: Moldova și Turcia din lista Comisiei Europene
 * pentru protecția consulară, celelalte de pe site-urile misiunilor (mae.ro); doar orașul, fără adresă, ca să nu
 * învechească pagina.
 */
const MAE = (city: string, url: string) => ({ name: `Ministerul Afacerilor Externe – misiunea de la ${city}`, url, note: { ro: "misiunile României în țară", en: "Romania's missions in the country" } });

export const EXTRA_VECINI: Record<string, CountryExtra> = {
  "republica-moldova": {
    missions: [
      { kind: "embassy", city: "Chișinău", url: "https://chisinau.mae.ro" },
      { kind: "cg", city: "Bălți" },
      { kind: "cg", city: "Cahul" },
    ],
    missionsSource: { name: "Comisia Europeană – protecția consulară (Republica Moldova)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-moldova-md-1_en", note: { ro: "misiunile României în Republica Moldova", en: "Romania's missions in Moldova" } },
    guide: {
      ro: [
        "Începe de la cei vii: notează numele întregi ale părinților și bunicilor, numele de fată, satul și raionul, anii și cine cu cine s-a căsătorit. Întreabă și de rudele care au trecut Prutul în 1940 sau în 1944 și de cele deportate: numele lor deschid adesea dosare întregi.",
        "Pentru actele recente te adresezi Agenției Servicii Publice, care ține starea civilă. Registrele parohiale din perioada rusă (metricele, până în 1918) și actele din anii românești sunt la Agenția Națională a Arhivelor de la Chișinău. Pentru anii 1918–1940 caută și la Arhivele Naționale ale României, mai ales dacă familia a plecat în România.",
        "Dacă vrei să redobândești cetățenia română, dosarul se depune la Autoritatea Națională pentru Cetățenie, direct sau prin misiunile României din Republica Moldova, și cere actele care arată că un părinte, bunic sau străbunic a fost cetățean român. Un arbore cu nume, sate și ani corecți te ajută să știi ce acte să ceri și unde.",
      ],
      en: [
        "Start with the living: write down the full names of your parents and grandparents, maiden names, the village and district, the years and who married whom. Ask too about relatives who crossed the Prut in 1940 or 1944 and those who were deported: their names often open whole files.",
        "For recent records, go to the Public Services Agency, which keeps civil status. Parish registers from the Russian period (metrical books, up to 1918) and records from the Romanian years are at the National Archives Agency in Chișinău. For 1918–1940, also search the Romanian National Archives, especially if the family moved to Romania.",
        "If you want to regain Romanian citizenship, the application goes to Romania's National Citizenship Authority, directly or through Romania's missions in Moldova, and needs records showing that a parent, grandparent or great-grandparent was a Romanian citizen. A tree with correct names, villages and years helps you know which records to request and where.",
      ],
    },
    specifics: {
      ro: [
        "Același nume apare diferit de la un act la altul: în rusă în metricele de dinainte de 1918 și în actele sovietice, cu alfabet latin în anii românești, cu alfabet chirilic în română între 1940 și 1989. Un Vasile poate fi Василий într-un act și Vasilii în altul. Notează toate formele; în Cartea Neamului le poți păstra la fiecare persoană.",
        "Multe sate și-au schimbat numele în perioada sovietică și l-au recăpătat după 1991. Caută satul în ambele forme, iar pentru actele de dinainte de 1940 ține minte și județul românesc de atunci (de pildă Lăpușna, Orhei, Soroca, Bălți, Tighina, Cahul sau Hotin).",
      ],
      en: [
        "The same name appears differently from one record to another: in Russian in the metrical books before 1918 and in Soviet records, in the Latin alphabet in the Romanian years, in the Cyrillic alphabet for Romanian between 1940 and 1989. A Vasile may be Василий in one record and Vasilii in another. Write down every form; in Cartea Neamului you can keep them on each person.",
        "Many villages changed their names in the Soviet period and got them back after 1991. Search for the village under both forms, and for records before 1940 remember the Romanian county of that time (for example Lăpușna, Orhei, Soroca, Bălți, Tighina, Cahul or Hotin).",
      ],
    },
    faq: {
      ro: [
        { q: "Unde găsesc actul de naștere al unui străbunic născut în Basarabia înainte de 1918?", a: "În metricele parohiale din perioada rusă, păstrate la Agenția Națională a Arhivelor de la Chișinău. Ai nevoie de sat, de anul aproximativ și de numele părinților." },
        { q: "Ce acte îmi trebuie pentru redobândirea cetățeniei române?", a: "Actele care arată legătura ta cu un părinte, bunic sau străbunic care a fost cetățean român: certificate de naștere și de căsătorie pentru fiecare generație. Lista exactă o dă Autoritatea Națională pentru Cetățenie." },
        { q: "Cum aflu dacă un bunic a fost deportat?", a: "Dosarele deportărilor din 1941, 1949 și 1951 sunt la Agenția Națională a Arhivelor; poți cere o căutare după nume și sat. Notează în arbore și ce povestesc cei care își amintesc." },
        { q: "Pot face arborele împreună cu rudele din România, din Italia sau din Ucraina?", a: "Da. Arborele e comun: fiecare rudă îl completează de unde trăiește și vede tot ce au adăugat ceilalți." },
        { q: "Am nevoie de apostilă pentru un act moldovenesc folosit în România?", a: "Între Republica Moldova și România există un tratat de asistență juridică, iar pentru multe acte de stare civilă nu se cere apostilă. Verifică totuși la instituția care îți cere actul." },
      ],
      en: [
        { q: "Where can I find the birth record of a great-grandparent born in Bessarabia before 1918?", a: "In the parish metrical books from the Russian period, held by the National Archives Agency in Chișinău. You need the village, the approximate year and the parents' names." },
        { q: "Which records do I need to regain Romanian citizenship?", a: "Records showing your link to a parent, grandparent or great-grandparent who was a Romanian citizen: birth and marriage certificates for each generation. The National Citizenship Authority gives the exact list." },
        { q: "How do I find out whether a grandparent was deported?", a: "The files on the 1941, 1949 and 1951 deportations are at the National Archives Agency; you can request a search by name and village. Also write down in the tree what those who remember tell you." },
        { q: "Can I build the tree with relatives in Romania, Italy or Ukraine?", a: "Yes. The tree is shared: each relative fills it in from wherever they live and sees everything the others have added." },
        { q: "Do I need an apostille to use a Moldovan record in Romania?", a: "Moldova and Romania have a legal assistance treaty, and for many civil-status records no apostille is required. Still, check with the institution asking for the record." },
      ],
    },
  },
  serbia: {
    missions: [
      { kind: "embassy", city: "Belgrad", url: "https://belgrad.mae.ro" },
      { kind: "cg", city: "Vârșeț" },
      { kind: "cg", city: "Zaicear" },
    ],
    missionsSource: MAE("Belgrad", "https://belgrad.mae.ro"),
    guide: {
      ro: [
        "Începe cu bunicii: numele întregi, numele de fată, satul, anii și cine cu cine s-a căsătorit. În Banat, numele satelor au adesea o formă românească și una sârbească (Vârșeț și Vršac, Panciova și Pančevo); notează-le pe amândouă.",
        "Actele de stare civilă se cer de la oficiul de stare civilă al comunei sârbe unde au fost înregistrate. Registrele vechi sunt la arhivele istorice regionale și la Arhiva Voivodinei, de la Novi Sad. Pentru familiile vlahilor din estul Serbiei, caută la arhivele regionale de la Zaicear și Negotin.",
        "Dacă familia a avut legături cu Banatul românesc sau cu Oltenia, o parte din acte poate fi și în România, la serviciile județene Timiș, Caraș-Severin sau Mehedinți ale Arhivelor Naționale.",
      ],
      en: [
        "Start with your grandparents: full names, maiden names, the village, the years and who married whom. In the Banat, village names often have a Romanian and a Serbian form (Vârșeț and Vršac, Panciova and Pančevo); write down both.",
        "Civil-status records are requested from the civil registry office of the Serbian municipality where they were registered. Old registers are in the regional historical archives and at the Archives of Vojvodina in Novi Sad. For Vlach families in eastern Serbia, search the regional archives in Zaječar and Negotin.",
        "If the family had links to the Romanian Banat or to Oltenia, some records may also be in Romania, in the Timiș, Caraș-Severin or Mehedinți county branches of the National Archives.",
      ],
    },
    specifics: {
      ro: [
        "Actele sârbe sunt scrise în alfabet chirilic sau latin, iar numele românești apar adaptate: Ion poate fi Jon sau Јон, Popescu poate fi Popesku. Păstrează în arbore forma din fiecare act și forma folosită în familie.",
        "Serbia nu e în Uniunea Europeană: actele sârbe folosite în România au nevoie de apostilă și de traducere, iar actele românești folosite în Serbia la fel.",
      ],
      en: [
        "Serbian records are written in Cyrillic or Latin script, and Romanian names appear adapted: Ion may be Jon or Јон, Popescu may be Popesku. Keep in the tree the form in each record and the form used in the family.",
        "Serbia is not in the European Union: Serbian records used in Romania need an apostille and a translation, and so do Romanian records used in Serbia.",
      ],
    },
    faq: {
      ro: [
        { q: "Care e diferența dintre români și vlahi în Serbia?", a: "Sunt două denumiri pe care oamenii le aleg la recensământ. Românii trăiesc mai ales în Voivodina, vlahii mai ales în estul Serbiei; ambele grupuri vorbesc graiuri ale limbii române." },
        { q: "Unde găsesc actele unui bunic din Banatul sârbesc?", a: "Actele recente, la oficiul de stare civilă al comunei; cele vechi, la arhiva istorică regională sau la Arhiva Voivodinei, de la Novi Sad." },
        { q: "Pot scrie arborele în română și să-l citească nepoții în sârbă?", a: "Da. Cartea Neamului are și limba sârbă: fiecare citește site-ul în limba lui, iar numele și poveștile rămân cum le-ați scris." },
        { q: "Unde sunt consulatele României în Serbia?", a: "România are ambasadă la Belgrad și consulate generale la Vârșeț și la Zaicear; programările se fac pe econsulat.ro." },
        { q: "Am nevoie de apostilă pentru un act sârbesc folosit în România?", a: "Da, de regulă, plus o traducere autorizată. Verifică întâi la instituția care îți cere actul." },
      ],
      en: [
        { q: "What is the difference between Romanians and Vlachs in Serbia?", a: "They are two names people choose in the census. Romanians live mostly in Vojvodina, Vlachs mostly in eastern Serbia; both groups speak dialects of Romanian." },
        { q: "Where can I find the records of a grandparent from the Serbian Banat?", a: "Recent records at the municipal civil registry office; older ones at the regional historical archive or the Archives of Vojvodina in Novi Sad." },
        { q: "Can I write the tree in Romanian and have my grandchildren read it in Serbian?", a: "Yes. Cartea Neamului is also in Serbian: everyone reads the site in their own language, and names and stories stay as you wrote them." },
        { q: "Where are Romania's consulates in Serbia?", a: "Romania has an embassy in Belgrade and consulates general in Vršac and Zaječar; appointments are booked on econsulat.ro." },
        { q: "Do I need an apostille to use a Serbian record in Romania?", a: "Usually yes, plus a certified translation. Check first with the institution asking for it." },
      ],
    },
  },
  bulgaria: {
    missions: [{ kind: "embassy", city: "Sofia", url: "https://sofia.mae.ro" }],
    missionsSource: MAE("Sofia", "https://sofia.mae.ro"),
    guide: {
      ro: [
        "Începe cu bunicii și cu locul lor de naștere. Dacă s-au născut în Cadrilater înainte de 1940, ține minte și numele românesc al localității din acei ani (Bazargic pentru Dobrici, Balcic, Silistra, Turtucaia), pentru că așa apare în actele românești.",
        "Pentru actele din perioada românească a Cadrilaterului caută la serviciile județene Constanța și Tulcea ale Arhivelor Naționale și la arhivele regionale bulgare de la Dobrici și Silistra. Pentru familiile vlahilor de lângă Vidin, la arhiva regională de la Vidin. Scrie-le cu numele complet, satul și anul aproximativ; o rudă care citește bulgara te poate ajuta mult la corespondență.",
        "Actele de stare civilă bulgărești recente se cer de la primăria (obștina) unde au fost înregistrate. Fiindcă ambele țări sunt în Uniunea Europeană, poți cere și formularul multilingv european, care scutește de traducere.",
      ],
      en: [
        "Start with your grandparents and their place of birth. If they were born in the Cadrilater before 1940, also remember the Romanian name of the place in those years (Bazargic for Dobrich, Balcic, Silistra, Turtucaia), because that is how it appears in Romanian records.",
        "For records from the Romanian period of the Cadrilater, search the Constanța and Tulcea county branches of the Romanian National Archives and the Bulgarian regional archives in Dobrich and Silistra. For Vlach families near Vidin, the regional archive in Vidin. Write to them with the full name, the village and the approximate year; a relative who reads Bulgarian can help a lot with the correspondence.",
        "Recent Bulgarian civil-status records are requested from the municipality (obshtina) where they were registered. Because both countries are in the European Union, you can also ask for the European multilingual form, which spares you a translation.",
      ],
    },
    specifics: {
      ro: [
        "Actele bulgărești sunt scrise în alfabet chirilic, iar numele românești apar adaptate, uneori cu terminații bulgărești. Păstrează în arbore forma din fiecare act și forma folosită în familie.",
        "În 2025 România a deschis un consulat onorific la Ruse, oraș legat de Giurgiu prin Podul Prieteniei; pentru acte, procuri și pașapoarte te adresezi însă ambasadei de la Sofia, cu programare pe econsulat.ro.",
      ],
      en: [
        "Bulgarian records are written in Cyrillic, and Romanian names appear adapted, sometimes with Bulgarian endings. Keep in the tree the form in each record and the form used in the family.",
        "In 2025 Romania opened an honorary consulate in Ruse, the city linked to Giurgiu by the Friendship Bridge; for records, powers of attorney and passports, however, go to the embassy in Sofia, booked on econsulat.ro.",
      ],
    },
    faq: {
      ro: [
        { q: "Bunicii mei s-au născut în Cadrilater. Unde le caut actele?", a: "La serviciile județene Constanța și Tulcea ale Arhivelor Naționale și la arhivele regionale bulgare de la Dobrici și Silistra. Caută localitatea cu numele ei din anii românești." },
        { q: "Ce a fost schimbul de populație din 1940?", a: "Prin Tratatul de la Craiova, românii din Cadrilater s-au mutat în nordul Dobrogei, iar bulgarii din nordul Dobrogei s-au mutat în sud. Multe familii din Constanța și Tulcea au plecat atunci din Cadrilater." },
        { q: "Am nevoie de apostilă pentru un act bulgăresc folosit în România?", a: "Nu. Ambele țări sunt în Uniunea Europeană, iar actele de stare civilă circulă fără apostilă; cu formularul multilingv european nu ai nevoie nici de traducere." },
        { q: "Pot scrie arborele în română și să-l citească rudele în bulgară?", a: "Da. Cartea Neamului are și limba bulgară: fiecare citește site-ul în limba lui." },
        { q: "Cine sunt vlahii din Bulgaria?", a: "Sunt familii din nord-vestul Bulgariei, mai ales din jurul Vidinului, care vorbesc graiuri românești, înrudite cu cele din Valea Timocului din Serbia." },
      ],
      en: [
        { q: "My grandparents were born in the Cadrilater. Where do I look for their records?", a: "In the Constanța and Tulcea county branches of the Romanian National Archives and the Bulgarian regional archives in Dobrich and Silistra. Search for the place under its name from the Romanian years." },
        { q: "What was the 1940 population exchange?", a: "Under the Treaty of Craiova, Romanians from the Cadrilater moved to northern Dobruja and Bulgarians from northern Dobruja moved south. Many families in Constanța and Tulcea left the Cadrilater then." },
        { q: "Do I need an apostille to use a Bulgarian record in Romania?", a: "No. Both countries are in the European Union and civil-status records move without an apostille; with the European multilingual form you do not even need a translation." },
        { q: "Can I write the tree in Romanian and have relatives read it in Bulgarian?", a: "Yes. Cartea Neamului is also in Bulgarian: everyone reads the site in their own language." },
        { q: "Who are the Vlachs of Bulgaria?", a: "Families from north-western Bulgaria, mostly around Vidin, who speak Romanian dialects related to those of the Timok Valley in Serbia." },
      ],
    },
  },
  turcia: {
    missions: [
      { kind: "embassy", city: "Ankara" },
      { kind: "cg", city: "Istanbul" },
      { kind: "cg", city: "Izmir" },
    ],
    missionsSource: { name: "Comisia Europeană – protecția consulară (Turcia)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-turkey-tr-0_en", note: { ro: "misiunile României în Turcia", en: "Romania's missions in Turkey" } },
    guide: {
      ro: [
        "Începe cu ce își amintesc bunicii: numele, porecla familiei, satul din Dobrogea și anul plecării. Pentru familiile emigrate în Turcia, anul și satul de plecare sunt cheia: de ele depinde unde e actul, în România sau în Turcia.",
        "Actele românești ale familiilor dobrogene sunt la serviciile județene Constanța și Tulcea ale Arhivelor Naționale. Cele turcești sunt în registrul populației (Nüfus); cetățenii turci își pot vedea ascendenții înregistrați prin e-Devlet. Registrele otomane mai vechi sunt la Arhivele Statului, la Istanbul și Ankara.",
        "Pentru o familie româno-turcă de azi, drumul e cel obișnuit: actele românești se cer prin consulatele de la Istanbul și Izmir sau prin ambasada de la Ankara, cu programare pe econsulat.ro, iar actele turcești au nevoie de apostilă și de traducere ca să fie folosite în România.",
      ],
      en: [
        "Start with what your grandparents remember: names, the family nickname, the village in Dobruja and the year they left. For families who emigrated to Turkey, the year and village of departure are the key: they decide where the record is, in Romania or in Turkey.",
        "Romanian records of Dobrujan families are in the Constanța and Tulcea county branches of the National Archives. Turkish ones are in the population register (Nüfus); Turkish citizens can see their registered ancestors through e-Devlet. Older Ottoman registers are in the State Archives in Istanbul and Ankara.",
        "For a Romanian-Turkish family today, the road is the usual one: Romanian records are requested through the consulates in Istanbul and Izmir or the embassy in Ankara, booked on econsulat.ro, and Turkish records need an apostille and a translation to be used in Romania.",
      ],
    },
    specifics: {
      ro: [
        "Numele de familie au apărut în Turcia abia în 1934. Strămoșii de dinainte apar doar cu prenumele, prenumele tatălui și o poreclă, o meserie sau locul de baștină; același om poate avea alt nume în actele românești și în cele turcești.",
        "Până în 1928, turca s-a scris cu alfabet arab, așa că actele otomane vechi au nevoie de cineva care să le citească. În arbore poți păstra și forma veche, și cea de azi a numelui, ca nepoții să recunoască omul în orice act l-ar găsi.",
      ],
      en: [
        "Surnames only appeared in Turkey in 1934. Earlier ancestors appear with just a first name, the father's name and a nickname, a trade or a place of origin; the same person may have a different name in Romanian and Turkish records.",
        "Until 1928 Turkish was written in the Arabic script, so old Ottoman records need someone who can read them. In the tree you can keep both the old and the modern form of a name, so that grandchildren recognise the person in whatever record they find.",
      ],
    },
    faq: {
      ro: [
        { q: "Strămoșii mei au plecat din Dobrogea în Turcia. Unde le găsesc actele?", a: "Actele de dinainte de plecare, la serviciile județene Constanța și Tulcea ale Arhivelor Naționale; cele de după, în registrul populației din Turcia (Nüfus)." },
        { q: "De ce străbunicul nu are nume de familie în acte?", a: "Pentru că în Turcia numele de familie au devenit obligatorii abia în 1934. Înainte, oamenii erau cunoscuți după prenume, după tată și după o poreclă sau locul de baștină." },
        { q: "Unde sunt consulatele României în Turcia?", a: "România are ambasadă la Ankara și consulate generale la Istanbul și Izmir; programările se fac pe econsulat.ro." },
        { q: "Pot scrie arborele în română, iar rudele din Turcia să-l citească în turcă?", a: "Da. Cartea Neamului are și limba turcă: fiecare citește site-ul în limba lui." },
        { q: "Am nevoie de apostilă pentru un act turcesc folosit în România?", a: "Da, de regulă, plus o traducere autorizată. Verifică întâi la instituția care îți cere actul." },
      ],
      en: [
        { q: "My ancestors left Dobruja for Turkey. Where do I find their records?", a: "Records from before they left are in the Constanța and Tulcea county branches of the Romanian National Archives; later ones are in Turkey's population register (Nüfus)." },
        { q: "Why does my great-grandfather have no surname in the records?", a: "Because surnames only became compulsory in Turkey in 1934. Before then people were known by their first name, their father's name and a nickname or place of origin." },
        { q: "Where are Romania's consulates in Turkey?", a: "Romania has an embassy in Ankara and consulates general in Istanbul and Izmir; appointments are booked on econsulat.ro." },
        { q: "Can I write the tree in Romanian and have relatives in Turkey read it in Turkish?", a: "Yes. Cartea Neamului is also in Turkish: everyone reads the site in their own language." },
        { q: "Do I need an apostille to use a Turkish record in Romania?", a: "Usually yes, plus a certified translation. Check first with the institution asking for it." },
      ],
    },
  },
  luxemburg: {
    missions: [{ kind: "embassy", city: "Luxemburg", url: "https://luxemburg.mae.ro" }],
    missionsSource: MAE("Luxemburg", "https://luxemburg.mae.ro"),
    guide: {
      ro: [
        "Începe cu ce știu părinții și bunicii din România: numele întregi, numele de fată, satul, anii și cine cu cine s-a căsătorit. Cu satul exact, pagina lui de pe Cartea Neamului îți arată comuna, județul și arhiva județeană de care ține azi.",
        "Pentru actele din România ai trei căi: ambasada de la Luxemburg (programare pe econsulat.ro), o rudă din țară cu o procură semnată la ambasadă, sau, pentru registrele mai vechi de 100 de ani, serviciul județean al Arhivelor Naționale.",
        "Pentru actele luxemburgheze ale familiei, de pildă certificatul de naștere al unui copil născut aici, te adresezi comunei unde a fost înregistrat; Guichet.lu explică pașii. Nașterea copilului trebuie apoi transcrisă în registrele românești, prin ambasadă.",
      ],
      en: [
        "Start with what your parents and grandparents in Romania know: full names, maiden names, the village, the years and who married whom. With the exact village, its page on Cartea Neamului shows you the commune, county and county archive it belongs to today.",
        "For records from Romania you have three ways: the embassy in Luxembourg (booked on econsulat.ro), a relative in Romania with a power of attorney signed at the embassy, or, for registers older than 100 years, the county branch of the National Archives.",
        "For your family's Luxembourg records, such as the birth certificate of a child born here, go to the commune where it was registered; Guichet.lu explains the steps. The child's birth must then be transcribed into the Romanian registers through the embassy.",
      ],
    },
    specifics: {
      ro: [
        "Mulți români care lucrează în Luxemburg locuiesc în Franța, Belgia sau Germania. Actele copiilor născuți acolo se cer în țara de reședință, nu în Luxemburg, chiar dacă părinții lucrează aici.",
        "Fiindcă Luxemburgul e în Uniunea Europeană, actele de stare civilă circulă fără apostilă, iar formularul multilingv european scutește de traducere.",
      ],
      en: [
        "Many Romanians who work in Luxembourg live in France, Belgium or Germany. Records for children born there are requested in the country of residence, not in Luxembourg, even if the parents work here.",
        "Because Luxembourg is in the European Union, civil-status records move without an apostille, and the European multilingual form spares you a translation.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde transcriu nașterea unui copil născut în Luxemburg?", a: "La ambasada României de la Luxemburg, cu programare pe econsulat.ro. Ai nevoie de certificatul de naștere luxemburghez, de preferat cu formularul multilingv european." },
        { q: "Am nevoie de apostilă pentru un act luxemburghez folosit în România?", a: "Nu. Ambele țări sunt în Uniunea Europeană, iar actele de stare civilă circulă fără apostilă." },
        { q: "Unde găsesc registrele vechi ale unei familii luxemburgheze?", a: "La comuna unde au fost înregistrate actele și la Arhivele Naționale ale Luxemburgului." },
        { q: "Copiii mei vorbesc mai bine franceza sau germana. Pot citi arborele în limba lor?", a: "Da. Cartea Neamului are și franceza, și germana: fiecare citește site-ul în limba lui, iar numele și poveștile rămân cum le-ați scris." },
        { q: "Pot face arborele împreună cu bunicii din România?", a: "Da. Arborele e comun: bunicii îl completează din România, voi din Luxemburg, și fiecare vede tot ce au adăugat ceilalți." },
      ],
      en: [
        { q: "Where do I transcribe the birth of a child born in Luxembourg?", a: "At the Embassy of Romania in Luxembourg, booked on econsulat.ro. You need the Luxembourg birth certificate, ideally with the European multilingual form." },
        { q: "Do I need an apostille to use a Luxembourg record in Romania?", a: "No. Both countries are in the European Union and civil-status records move without an apostille." },
        { q: "Where can I find the old records of a Luxembourg family?", a: "At the commune where the records were registered and at the National Archives of Luxembourg." },
        { q: "My children speak French or German better. Can they read the tree in their language?", a: "Yes. Cartea Neamului is also in French and German: everyone reads the site in their own language, and names and stories stay as you wrote them." },
        { q: "Can I build the tree together with grandparents in Romania?", a: "Yes. The tree is shared: the grandparents fill it in from Romania, you from Luxembourg, and everyone sees what the others have added." },
      ],
    },
  },
};
