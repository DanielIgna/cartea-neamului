import type { CountryExtra } from "./tipuri";

/**
 * Norvegia (Daniel, 19.11.2026: „aprob”): ghid, misiunea României, particularități și întrebări, în română și engleză.
 * Ambasada: lista Comisiei Europene pentru protecția consulară; cifrele: Statistisk sentralbyrå (SSB), 1 ianuarie 2026.
 */
export const EXTRA_NO: Record<string, CountryExtra> = {
  norvegia: {
    stats: { name: "Statistisk sentralbyrå (SSB)", url: "https://www.ssb.no/en/befolkning/innvandrere/statistikk/innvandrere-og-norskfodte-med-innvandrerforeldre", note: { ro: "imigranții și copiii lor născuți în Norvegia, pe țări, la 1 ianuarie 2026", en: "immigrants and their Norwegian-born children, by country, on 1 January 2026" } },
    missions: [{ kind: "embassy", city: "Oslo", address: "Oscars gate 51, 0244 Oslo", url: "https://oslo.mae.ro" }],
    missionsSource: { name: "Comisia Europeană – protecția consulară (Norvegia)", url: "https://consular-protection.ec.europa.eu/representation-offices/romania-ro-representation-norway-no_ro", note: { ro: "misiunea României în Norvegia", en: "Romania's mission in Norway" } },
    guide: {
      ro: [
        "Începe cu ce știu cei vii. Sună-i pe părinți și pe bunici și notează numele întregi, numele de fată al bunicii și al străbunicii, satul, anii și cine cu cine s-a căsătorit. Cu satul exact, pagina lui de pe Cartea Neamului îți arată comuna, județul și arhiva județeană de care ține azi.",
        "Pentru actele din România ai trei căi: ambasada de la Oslo (programare pe econsulat.ro), o rudă din țară cu o procură semnată la ambasadă, sau, pentru registrele mai vechi de 100 de ani, serviciul județean al Arhivelor Naționale, căruia îi scrii cu numele, anul aproximativ și satul.",
        "Pentru actele norvegiene ale familiei, de pildă certificatul de naștere al unui copil născut aici, te adresezi registrului populației (Folkeregisteret), ținut de Skatteetaten. Ca să fie folosit în România, actul norvegian are nevoie de apostilă și de traducere, iar nașterea copilului trebuie transcrisă în registrele românești, prin ambasadă, înainte de acte românești.",
      ],
      en: [
        "Start with what the living know. Call your parents and grandparents and write down full names, your grandmother's and great-grandmother's maiden names, the village, the years and who married whom. With the exact village, its page on Cartea Neamului shows you the commune, county and county archive it belongs to today.",
        "For records from Romania there are three routes: the embassy in Oslo (appointments on econsulat.ro), a relative in Romania with a power of attorney signed at the embassy, or, for registers older than 100 years, the county branch of the Romanian National Archives, which you can write to with the name, approximate year and village.",
        "For the family's Norwegian records, such as the birth certificate of a child born here, contact the population register (Folkeregisteret), kept by the Norwegian Tax Administration (Skatteetaten). To be used in Romania, a Norwegian record needs an apostille and a translation, and the child's birth has to be transcribed into the Romanian registers through the embassy before Romanian documents can be issued.",
      ],
    },
    specifics: {
      ro: [
        "Norvegia nu e în Uniunea Europeană, ci în Spațiul Economic European. De aceea, scutirea de apostilă pentru actele de stare civilă din regulamentul european nu se aplică între România și Norvegia.",
        "În registrele norvegiene vechi, mulți oameni apar cu un patronim (fiul sau fiica tatălui) și cu numele fermei pe care locuiau, nu cu un nume de familie fix. Pentru familiile mixte, notează în arbore toate formele numelui, ca să le găsești în recensămintele de pe Digitalarkivet.",
      ],
      en: [
        "Norway is not in the European Union but in the European Economic Area. That is why the EU regulation's apostille exemption for civil-status records does not apply between Romania and Norway.",
        "In old Norwegian records many people appear with a patronymic (son or daughter of their father) and the name of the farm they lived on, rather than a fixed family name. For mixed families, write every form of the name in the tree, so you can find them in the censuses on Digitalarkivet.",
      ],
    },
    faq: {
      ro: [
        { q: "Unde îmi fac programare pentru acte românești în Norvegia?", a: "La Ambasada României de la Oslo, în Oscars gate 51, cu programare pe econsulat.ro." },
        { q: "Cum transcriu nașterea copilului născut în Norvegia?", a: "Prin ambasada de la Oslo, cu certificatul de naștere norvegian apostilat și tradus. Fă-o din timp, înainte să fie nevoie de un pașaport românesc." },
        { q: "Am nevoie de apostilă pentru un act românesc folosit în Norvegia?", a: "De obicei da, plus o traducere, pentru că Norvegia nu e în Uniunea Europeană. Verifică întâi la instituția norvegiană care îți cere actul." },
        { q: "Unde găsesc registrele vechi norvegiene pentru familia mixtă?", a: "Pe Digitalarkivet, site-ul Arhivelor Naționale ale Norvegiei (Arkivverket), unde recensămintele și registrele parohiale vechi se pot căuta gratuit." },
        { q: "Copiii mei vorbesc mai bine norvegiana. Pot citi arborele?", a: "Da. Pe Cartea Neamului fiecare membru al familiei citește arborele în limba lui, iar bunicii îl pot completa în română." },
      ],
      en: [
        { q: "Where do I book an appointment for Romanian documents in Norway?", a: "At the Embassy of Romania in Oslo, Oscars gate 51, with appointments on econsulat.ro." },
        { q: "How do I transcribe the birth of a child born in Norway?", a: "Through the embassy in Oslo, with the Norwegian birth certificate apostilled and translated. Do it early, before a Romanian passport is needed." },
        { q: "Do I need an apostille for a Romanian record used in Norway?", a: "Usually yes, plus a translation, because Norway is not in the European Union. Check first with the Norwegian institution asking for it." },
        { q: "Where can I find old Norwegian records for a mixed family?", a: "On Digitalarkivet, the website of the National Archives of Norway (Arkivverket), where old censuses and parish registers can be searched for free." },
        { q: "My children speak Norwegian better than Romanian. Can they read the tree?", a: "Yes. On Cartea Neamului each family member reads the tree in their own language, and the grandparents can fill it in in Romanian." },
      ],
    },
  },
};
