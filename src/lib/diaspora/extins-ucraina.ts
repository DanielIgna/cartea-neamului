import type { CountryExtra } from "./tipuri";

/**
 * Ucraina (Daniel, 19.11.2026: „aprob și restul ciornelor”): ghid, misiunile României, particularități și întrebări, în
 * română și engleză. Misiunile sunt din lista Comisiei Europene pentru protecția consulară; consulatul de la Odesa și-a
 * redus activitatea în timpul războiului și o reia treptat (MAE, 2025–2026), deci îndemnăm la verificare înainte de drum.
 */
export const EXTRA_UA: Record<string, CountryExtra> = {
  ucraina: {
    missions: [
      { kind: "embassy", city: "Kiev" },
      { kind: "cg", city: "Cernăuți" },
      { kind: "cg", city: "Odesa" },
    ],
    missionsSource: { name: "Comisia Europeană – protecția consulară (Ucraina)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-ukraine-ua-0_en", note: { ro: "lista misiunilor României în Ucraina", en: "list of Romanian missions in Ukraine" } },
    guide: {
      ro: [
        "Primul pas e să afli în ce stat și sub ce administrație s-a născut fiecare strămoș, pentru că de asta depinde unde e actul. Până în 1918, în nordul Bucovinei registrele parohiale țineau loc de stare civilă, după regulile austriece; în Basarabia, sub Imperiul Rus, la fel, dar în rusă și pe stil vechi. Între 1918 și 1940, nașterile, căsătoriile și decesele s-au trecut la primăriile românești. După 1940 și 1944, actele au fost întocmite de oficiile sovietice de stare civilă, iar azi de cele ucrainene.",
        "Pentru un act recent ai nevoie de oficiul ucrainean de stare civilă din raionul unde s-a înregistrat. Registrele vechi ajung, cu timpul, la arhiva de stat a regiunii, la Cernăuți sau la Odesa. Pentru anii românești, caută și la Arhivele Naționale ale României, mai ales la Suceava și la serviciile județene ale fostelor județe ale Bucovinei și Basarabiei, iar pentru Basarabia și la Chișinău.",
        "Dacă vrei să redobândești cetățenia română, cererea se depune la Autoritatea Națională pentru Cetățenie, direct sau prin consulat, și cere acte care arată că părintele, bunicul sau străbunicul a fost cetățean român. De aceea, un arbore cu nume, sate și ani corecți te ajută să știi exact ce acte să ceri și de unde.",
      ],
      en: [
        "The first step is to find out in which state, and under which administration, each ancestor was born, because that decides where the record is. Until 1918 parish registers served as civil records in northern Bukovina, under Austrian rules; in Bessarabia, under the Russian Empire, too, but in Russian and in Old Style dates. From 1918 to 1940 births, marriages and deaths were recorded by Romanian town halls. After 1940 and 1944 records were made by Soviet registry offices, and today by Ukrainian ones.",
        "For a recent record, contact the Ukrainian civil registry office of the district where it was registered. Older registers are eventually transferred to the regional state archive in Chernivtsi or Odesa. For the Romanian years, also search the Romanian National Archives, especially in Suceava, and for Bessarabia the archives in Chișinău.",
        "If you want to regain Romanian citizenship, the application goes to Romania's National Citizenship Authority, directly or through a consulate, and needs records showing that a parent, grandparent or great-grandparent was a Romanian citizen. A family tree with correct names, villages and years helps you know exactly which records to ask for and where.",
      ],
    },
    specifics: {
      ro: [
        "Numele satelor s-au schimbat de mai multe ori: au o formă românească, una germană din vremea austriacă, una rusă și una ucraineană. Numele de familie apar în actele sovietice și ucrainene în alfabet chirilic, cu transcrieri diferite de la un act la altul. Notează toate formele pe care le găsești.",
        "Consulatul general de la Odesa și-a redus activitatea în timpul războiului și o reia treptat; înainte de drum, verifică pe site-ul Ministerului Afacerilor Externe ce servicii are și cum se fac programările.",
      ],
      en: [
        "Village names changed several times: they have a Romanian form, a German one from Austrian times, a Russian one and a Ukrainian one. Family names appear in Soviet and Ukrainian records in Cyrillic, transliterated differently from one record to another. Write down every form you find.",
        "The Consulate General in Odesa reduced its activity during the war and is resuming it gradually; before you travel, check on the Romanian Foreign Ministry's website which services it offers and how to book.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde găsesc actul de naștere al unui bunic născut în Bucovina înainte de 1918?", a: "În registrele parohiale din perioada austriacă, păstrate mai ales la arhiva de stat a regiunii Cernăuți; o parte din documentele Bucovinei sunt și la Arhivele Naționale, la Suceava." },
        { q: "Ce acte îmi trebuie pentru redobândirea cetățeniei române?", a: "Actele care arată legătura ta cu un părinte, bunic sau străbunic care a fost cetățean român: certificate de naștere și căsătorie pentru fiecare generație. Lista exactă o dă Autoritatea Națională pentru Cetățenie." },
        { q: "De ce numele satului bunicilor nu apare pe hartă?", a: "Pentru că s-a schimbat, uneori de mai multe ori, după 1940. Caută-l în toate formele: românească, germană, rusă și ucraineană." },
        { q: "Pot face arborele împreună cu rudele din România și din Republica Moldova?", a: "Da. Arborele e comun: fiecare rudă îl completează de unde trăiește și vede tot ce au adăugat ceilalți." },
        { q: "E nevoie de apostilă pentru un act ucrainean folosit în România?", a: "De obicei da, plus o traducere autorizată. Verifică întâi la instituția din România care îți cere actul, pentru că regulile diferă după tipul actului." },
      ],
      en: [
        { q: "Where can I find the birth record of a grandparent born in Bukovina before 1918?", a: "In the Austrian-period parish registers, held mostly by the Chernivtsi regional state archive; part of the Bukovina records are also in the Romanian National Archives in Suceava." },
        { q: "Which records do I need to regain Romanian citizenship?", a: "Records showing your link to a parent, grandparent or great-grandparent who was a Romanian citizen: birth and marriage certificates for each generation. The National Citizenship Authority gives the exact list." },
        { q: "Why can't I find my grandparents' village on the map?", a: "Because its name changed, sometimes several times, after 1940. Search for it in every form: Romanian, German, Russian and Ukrainian." },
        { q: "Can I build the tree together with relatives in Romania and Moldova?", a: "Yes. The tree is shared: each relative fills it in from wherever they live and sees everything the others have added." },
        { q: "Do I need an apostille to use a Ukrainian record in Romania?", a: "Usually yes, plus a certified translation. Check first with the Romanian institution asking for it, because the rules depend on the type of record." },
      ],
    },
  },
};
