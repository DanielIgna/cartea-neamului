import type { NewLang } from "./tip";

/** Dansk. */
export const DA: NewLang = {
  ui: {
    hubTitle: "Rumænere i verden: slægtstræet, uanset hvor du bor", diaspora: "Diaspora", home: "Forside",
    hubLead: "For rumænere, der bor uden for Rumænien, og for alle med rumænske rødder: historien om fællesskabet, hvor du bor, hvordan du får rumænske dokumenter uden at rejse, hvilke arkiver der findes, og hvordan du laver slægtstræet sammen med familien i Rumænien.",
    hubDescription: "Udvandringens historie, rumænske dokumenter fra udlandet og arkiver: en guide til familier med rumænske rødder i Danmark og resten af verden.",
    countries: "Europa og Israel", america: "USA", canada: "Canada", themes: "Særlige sider", states: "Delstater", provinces: "Provinser og territorier", cities: "Storbyer", regions: "Regioner",
    history: "Sådan kom rumænerne hertil", where: "Hvor de bor", docs: "Rumænske dokumenter, bestilt herfra", records: "Arkiver og registre her",
    community: "Fællesskaber og foreninger", steps: "Trin for trin: slægtstræet, på afstand", related: "Se også", otherLangs: "Siden på andre sprog",
    titleCountry: (w) => `Rumænske rødder ${w}: dokumenter og slægtstræ | Cartea Neamului`,
    descCountry: (w) => `Hvordan rumænerne kom ${w}, hvordan du bestiller rumænske dokumenter herfra, hvilke arkiver der findes, og hvordan du laver slægtstræet.`,
    titleRegion: (w) => `Rumænere ${w}: rødder, dokumenter og slægtstræ | Cartea Neamului`,
    titleRegionShort: (w) => `Rumænere ${w}: rødder og dokumenter | Cartea Neamului`,
    descRegion: (w, c) => `Rumænere ${w} (${c}): fællesskabet, Rumæniens konsulat, hvor du bestiller dokumenter herfra og fra Rumænien, og hvordan du laver slægtstræet.`,
    citiesLine: (l) => `De fleste rumænske familier bor i ${l}.`,
    docsSteps: ({ where, eu }) => [
      "Find først ud af, hvilket dokument du har brug for, og hvor det ligger: fødsels-, vielses- og dødsattester udstedes af personregistret (starea civilă) i den rumænske kommune, hvor de blev registreret; bøger ældre end 100 år ligger som regel hos Rumæniens Nationalarkiv, i amtsafdelingen (județ).",
      `Bor du ${where}, er der tre veje: Rumæniens konsulat for dit område (tidsbestilling på econsulat.ro), en slægtning i Rumænien, som du giver fuldmagt (underskrives på konsulatet), eller en ansøgning direkte til Nationalarkivet pr. e-mail for de gamle bøger.`,
      eu
        ? `For at bruge en rumænsk attest ${where} skal du som regel ikke længere have apostille: i EU gælder dokumenter om civilstand uden apostille (EU-forordning 2016/1191), og du kan bede om en flersproget standardformular, der følger med.`
        : `For at bruge en rumænsk attest ${where} skal du som regel have en apostille efter Haagerkonventionen, udstedt i Rumænien af præfekturet, og en autoriseret oversættelse.`,
      "Når du beder om et gammelt dokument, så skriv alt, hvad du ved: navnet (også i gammel eller udenlandsk stavemåde), det omtrentlige år samt landsbyen og kommunen dengang. Hver stedside på Cartea Neamului viser, hvilken kommune og hvilket arkiv landsbyen hører under.",
      "Har du rumænsk statsborgerskab, bliver dokumenter udstedt i udlandet (et barns fødsel, et ægteskab) indført i de rumænske registre via konsulatet eller hos personregistret i Rumænien.",
    ],
    communityText: ({ where, icr }) => [
      `Rumænere, der bor ${where}, mødes især gennem kulturforeninger, weekendskoler og rumænskundervisning for børn. Registrerede foreninger står på hjemmesiden for Rumæniens departement for rumænere i udlandet (dprp.gov.ro), og konsulatet kender som regel dem i din by.`,
      ...(icr ? [`Det Rumænske Kulturinstitut har en afdeling i ${icr}, med udstillinger, koncerter og et bibliotek.`] : []),
      "De bedste kilder til familiens historie er stadig menneskene: fællesskabets ældste husker, hvilke landsbyer de første familier kom fra, og hvem der er i familie med hvem.",
    ],
    genealogySteps: [
      "Skriv ned, hvad du allerede ved: navne, datoer og steder for dine forældre og bedsteforældre.",
      "Spørg de ældre i familien, også dem, der blev i Rumænien: et videoopkald med gamle billeder på skærmen bringer mange navne frem.",
      "Find landsbyen, familien kommer fra, og slå den op på Cartea Neamului: kommunen, arkivet og slægtsnavnene derfra.",
      "Bestil de dokumenter, du har brug for, fra Rumænien og fra landet, hvor du bor (se ovenfor).",
      "Saml det hele i ét slægtstræ, som hele familien kan udfylde, uanset hvor de bor.",
    ],
    ctaTitle: "Begynd slægtstræet", ctaText: "De første 7 dage er gratis, uden kort. Du inviterer familien i Rumænien og i udlandet, og hver tilføjer det, de ved.", ctaButton: "Begynd slægtstræet →",
    fallback: "Siden findes endnu ikke på dit sprog, så den vises på engelsk.", sources: "Kilder", localities: "Steder i Rumænien", names: "Rumænske slægtsnavne", guides: "Slægtsforskningsguider",
    regionThin: "Vi samler stadig oplysninger om rumænerne her. Indtil da gælder trinene nedenfor i hele landet.",
  },
  x: {
    guide: (w) => `Sådan finder du dine rumænske forfædre, når du bor ${w}`, specifics: "Godt at vide", missions: "Rumæniens ambassade og konsulater", faq: "Ofte stillede spørgsmål",
    kind: { embassy: "Ambassade", consular: "Konsulær afdeling", cg: "Generalkonsulat", consulate: "Konsulat" },
    missionsNote: (d) => `Kontrolleret i officielle kilder den ${d}. Det område, hvert konsulat dækker, og åbningstiderne står på den officielle side:`,
    statsNote: "Tallene om fællesskabet er afrundede; de præcise data offentliggøres af",
    price: (lei, local) => `Efter de 7 gratis dage koster Basic-planen ${local ?? lei} om året${local ? ` (${lei})` : ""}.`,
    whatsapp: "Send det til bedsteforældrene i Rumænien på WhatsApp",
    whatsappText: (u) => `Jeg laver vores slægtstræ og har brug for jeres hjælp: hvad hed jeres forældre og bedsteforældre, og hvilken landsby kom de fra? Lad os udfylde det sammen her: ${u}`,
  },
  romania: [
    "kirkebøger og civilregistre ældre end 100 år, efter amt",
    "tidsbestilling og ansøgninger hos Rumæniens konsulater",
    "liste over ambassader og konsulater og det område, hver dækker",
    "rumænske foreninger i udlandet og programmer for diasporaen",
  ],
  names: {
    italia: "Italien", spania: "Spanien", germania: "Tyskland", "marea-britanie": "Storbritannien", franta: "Frankrig", austria: "Østrig",
    belgia: "Belgien", irlanda: "Irland", olanda: "Nederlandene", portugalia: "Portugal", suedia: "Sverige", danemarca: "Danmark",
    elvetia: "Schweiz", grecia: "Grækenland", cipru: "Cypern", israel: "Israel", "statele-unite": "USA", canada: "Canada",
    ucraina: "Ukraine", norvegia: "Norge", "republica-moldova": "Moldova", serbia: "Serbien", bulgaria: "Bulgarien", turcia: "Tyrkiet", luxemburg: "Luxembourg",
  },
  countries: {
    danemarca: {
      where: "i Danmark",
      history: [
        "Rumænerne kom til Danmark især efter 2007: arbejdere i landbruget og på gårde, i byggeriet og i rengøring, men også studerende, der søgte til de danske universiteter, og it-specialister. Mange kom for nogle år og blev.",
        "Rigsarkivet har folketællingerne og kirkebøgerne digitaliseret, hvilket er nyttigt for blandede familier. For dokumenter fra Rumænien er ambassaden i København og en fuldmagt til en slægtning stadig de enkleste veje.",
      ],
      records: ["Danmarks Nationalarkiv"],
      guide: [
        "Rumænerne i Danmark kom især efter 2007, for at arbejde i landbruget, byggeriet, sundhedssektoren og teknologien eller for at studere. Mange er unge, med forældre og bedsteforældre derhjemme, som let kan udfylde slægtstræets første generationer.",
        "Rumænske dokumenter bestilles via den konsulære afdeling på ambassaden i København, med tidsbestilling på econsulat.ro. For de ældre generationer ligger bøger over 100 år hos Rumæniens Nationalarkiv, efter amt.",
        "For den danske del af familien har Rigsarkivet kirkebøgerne og de gamle folketællinger gratis på nettet. For mange sogne er de danske kirkebøger bevaret helt tilbage fra 1600-tallet.",
        "Mange rumænere i Danmark er unge, der rejste for at studere eller arbejde, og deres børn vokser op med dansk. For disse børn er slægtstræet en indgang til bedsteforældrenes sprog og steder: billeder fra landsbyen, oldeforældrenes navne og deres historier, samlet ét sted, som de altid kan se.",
        "For gamle dokumenter fra Rumænien, husk reglen om regionerne: i Transsylvanien, Banatet og Crișana begynder civilregistreringen i 1895, i Moldavien og Valakiet i 1865. Før disse år findes kun sognenes bøger, som ligger hos Nationalarkivet eller nogle gange stadig i sognet. Arkiverne svarer også på forespørgsler pr. e-mail.",
      ],
      specifics: [
        "I Danmark blev fødsler, vielser og dødsfald i lang tid registreret af Folkekirkens sogne, ikke af kommunerne. Derfor er kirkebøgerne hovedkilden for danske forfædre.",
        "Som i Sverige var mange gamle danske navne patronymer: Hans’ søn hed Hansen, og hans datter Hansdatter. Navnene blev først faste i 1800-tallet, så forbind generationerne gennem forældre og steder, ikke kun gennem navnet.",
        "Alle, der bor i Danmark, har et CPR-nummer, som står i alle dokumenter. For en slægtning, der har boet her, finder du lettere hans eller hendes dokumenter med dette nummer.",
        "De danske folketællinger fra 1800-tallet, taget med nogle års mellemrum, opfører hver husstand med folks alder og fødested. Sammen med kirkebøgerne kan du følge en familie fra folketælling til folketælling.",
        "Københavns Politi førte fra slutningen af 1800-tallet registre over udvandrere til Amerika og andre lande. Har din partner slægtninge, der rejste dengang, kan disse registre vise afrejsedato, alder og hjemsted.",
      ],
      faq: [
        { q: "Hvor bestiller jeg rumænske dokumenter i Danmark?", a: "Hos den konsulære afdeling på ambassaden i København, med tidsbestilling på econsulat.ro." },
        { q: "Skal et rumænsk dokument have apostille i Danmark?", a: "Ikke offentlige dokumenter om civilstand mellem EU-lande; du kan også bede om den flersprogede formular." },
        { q: "Hvor finder jeg min partners danske familie?", a: "I kirkebøgerne og folketællingerne, som Rigsarkivet har lagt på nettet." },
        { q: "Mit barn er født i Danmark. Hvad gør jeg?", a: "Vil du have, at barnet får rumænske dokumenter, indføres fødslen i de rumænske registre via ambassaden eller hos personregistret i Rumænien." },
        { q: "Kan jeg lave slægtstræet på dansk?", a: "Ja. Siden findes på dansk, engelsk og flere andre sprog, og familien i Rumænien udfylder det samme slægtstræ på rumænsk." },
        { q: "Hvor lang tid tager en rumænsk attest bestilt fra Danmark?", a: "Som regel nogle uger, fordi ansøgningen går via ambassaden til kommunen i Rumænien. En fuldmagt til en slægtning der kan gøre vejen kortere." },
        { q: "Hvor finder jeg mine oldeforældres dokumenter fra Rumænien?", a: "Dokumenter yngre end 100 år ligger i den kommune, hvor de blev registreret, og de ældre samt kirkebøgerne hos Nationalarkivet, i amtsafdelingen for landsbyen." },
      ],
    },
  },
};
