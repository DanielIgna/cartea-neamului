import type { NewLang } from "./tip";

/** Svenska. */
export const SV: NewLang = {
  ui: {
    hubTitle: "Rumäner i världen: släktträdet, var du än bor", diaspora: "Diaspora", home: "Hem",
    hubLead: "För rumäner som bor utanför Rumänien och för alla med rumänska rötter: historien om gemenskapen där du bor, hur du får rumänska handlingar utan att resa, vilka arkiv som finns där och hur du bygger släktträdet tillsammans med släkten i Rumänien.",
    hubDescription: "Emigrationens historia, rumänska handlingar från utlandet och arkiv: en guide för familjer med rumänska rötter i Sverige och resten av världen.",
    countries: "Europa och Israel", america: "USA", canada: "Kanada", themes: "Särskilda sidor", states: "Delstater", provinces: "Provinser och territorier", cities: "Storstäder", regions: "Regioner",
    history: "Hur rumänerna kom hit", where: "Var de bor", docs: "Rumänska handlingar, beställda härifrån", records: "Arkiv och register här",
    community: "Gemenskaper och föreningar", steps: "Steg för steg: släktträdet, på avstånd", related: "Se även", otherLangs: "Sidan på andra språk",
    titleCountry: (w) => `Rumänska rötter ${w}: handlingar och släktträd | Cartea Neamului`,
    descCountry: (w) => `Hur rumänerna kom ${w}, hur du beställer rumänska handlingar härifrån, vilka arkiv som finns och hur du bygger släktträdet med släkten.`,
    titleRegion: (w) => `Rumäner ${w}: rötter, handlingar och släktträd | Cartea Neamului`,
    titleRegionShort: (w) => `Rumäner ${w}: rötter och handlingar | Cartea Neamului`,
    descRegion: (w, c) => `Rumäner ${w} (${c}): gemenskapen, Rumäniens konsulat, var du beställer handlingar härifrån och från Rumänien och hur du bygger släktträdet.`,
    citiesLine: (l) => `De flesta rumänska familjerna bor i ${l}.`,
    docsSteps: ({ where, eu }) => [
      "Ta först reda på vilken handling du behöver och var den finns: födelse-, vigsel- och dödsbevis utfärdas av folkbokföringen (starea civilă) i den rumänska kommun där händelsen registrerades; böcker äldre än 100 år finns oftast hos Rumäniens riksarkiv, på länsavdelningen (județ).",
      `Bor du ${where} finns tre vägar: Rumäniens konsulat för ditt område (tidsbokning på econsulat.ro), en släkting i Rumänien som du ger fullmakt (undertecknas på konsulatet), eller en ansökan direkt till riksarkivet via e-post för gamla böcker.`,
      eu
        ? `För att använda ett rumänskt intyg ${where} behövs oftast ingen apostille längre: inom EU gäller handlingar om civilstånd utan apostille (EU-förordning 2016/1191), och du kan begära ett flerspråkigt standardformulär som följer med.`
        : `För att använda ett rumänskt intyg ${where} behöver du oftast en apostille enligt Haagkonventionen, utfärdad i Rumänien av prefekturen, och en auktoriserad översättning.`,
      "När du begär en gammal handling, skriv allt du vet: namnet (även i gammal eller utländsk stavning), ungefärligt år samt byn och kommunen på den tiden. Varje ortssida på Cartea Neamului visar vilken kommun och vilket arkiv byn hör till.",
      "Har du rumänskt medborgarskap förs handlingar som upprättats utomlands (ett barns födelse, ett äktenskap) in i de rumänska registren via konsulatet eller hos folkbokföringen i Rumänien.",
    ],
    communityText: ({ where, icr }) => [
      `Rumäner som bor ${where} träffas främst genom kulturföreningar, helgskolor och rumänskundervisning för barn. Registrerade föreningar finns på webbplatsen för Rumäniens departement för rumäner i utlandet (dprp.gov.ro), och konsulatet känner oftast till dem i din stad.`,
      ...(icr ? [`Rumänska kulturinstitutet har en filial i ${icr}, med utställningar, konserter och ett bibliotek.`] : []),
      "De bästa källorna till släktens historia är ändå människorna: gemenskapens äldre minns från vilka byar de första familjerna kom och vem som är släkt med vem.",
    ],
    genealogySteps: [
      "Skriv ner det du redan vet: namn, datum och platser för dina föräldrar och mor- och farföräldrar.",
      "Fråga äldre släktingar, även dem som stannade i Rumänien: ett videosamtal med gamla foton på skärmen väcker många namn till liv.",
      "Ta reda på vilken by släkten kommer från och sök upp den på Cartea Neamului: kommunen, arkivet och släktnamnen därifrån.",
      "Beställ de handlingar du behöver, från Rumänien och från landet där du bor (se ovan).",
      "Samla allt i ett släktträd som hela familjen kan fylla i, var de än bor.",
    ],
    ctaTitle: "Börja släktträdet", ctaText: "De första 7 dagarna är gratis, utan kort. Bjud in släkten i Rumänien och utomlands, så fyller var och en i det de vet.", ctaButton: "Börja släktträdet →",
    fallback: "Sidan finns ännu inte på ditt språk, så den visas på engelska.", sources: "Källor", localities: "Orter i Rumänien", names: "Rumänska släktnamn", guides: "Släktforskningsguider",
    regionThin: "Vi samlar fortfarande in uppgifter om rumänerna här. Under tiden gäller stegen nedan i hela landet.",
  },
  x: {
    guide: (w) => `Så hittar du dina rumänska förfäder när du bor ${w}`, specifics: "Bra att veta", missions: "Rumäniens ambassad och konsulat", faq: "Vanliga frågor",
    kind: { embassy: "Ambassad", consular: "Konsulär avdelning", cg: "Generalkonsulat", consulate: "Konsulat" },
    missionsNote: (d) => `Kontrollerat mot officiella källor den ${d}. Varje konsulats område och öppettider finns på den officiella sidan:`,
    statsNote: "Siffrorna om gemenskapen är avrundade; exakta uppgifter publiceras av",
    price: (lei, local) => `Efter de 7 gratisdagarna kostar Basic-planen ${local ?? lei} per år${local ? ` (${lei})` : ""}.`,
    whatsapp: "Skicka till mor- och farföräldrarna i Rumänien på WhatsApp",
    whatsappText: (u) => `Jag bygger vårt släktträd och behöver er hjälp: vad hette era föräldrar och far- och morföräldrar, och vilken by kom de från? Vi fyller i det tillsammans här: ${u}`,
  },
  romania: [
    "kyrkoböcker och civilregister äldre än 100 år, per län",
    "tidsbokning och ansökningar hos Rumäniens konsulat",
    "lista över ambassader och konsulat och vilket område var och en täcker",
    "rumänska föreningar i utlandet och program för diasporan",
  ],
  names: {
    italia: "Italien", spania: "Spanien", germania: "Tyskland", "marea-britanie": "Storbritannien", franta: "Frankrike", austria: "Österrike",
    belgia: "Belgien", irlanda: "Irland", olanda: "Nederländerna", portugalia: "Portugal", suedia: "Sverige", danemarca: "Danmark",
    elvetia: "Schweiz", grecia: "Grekland", cipru: "Cypern", israel: "Israel", "statele-unite": "USA", canada: "Kanada",
    ucraina: "Ukraina", norvegia: "Norge", "republica-moldova": "Moldavien", serbia: "Serbien", bulgaria: "Bulgarien", turcia: "Turkiet", luxemburg: "Luxemburg",
  },
  countries: {
    suedia: {
      where: "i Sverige", icr: "Stockholm",
      history: [
        "Till Sverige kom på 1970- och 1980-talen politiska flyktingar och familjer som flytt från det kommunistiska Rumänien, och efter 1990 och 2007 kom läkare, ingenjörer och forskare. Gemenskapen är liten men spridd över hela landet, från Stockholm till Norrland.",
        "Sverige har utmärkt bevarade kyrkoböcker och folkbokföringsregister, och Riksarkivet erbjuder dem på nätet; för rumänsk-svenska familjer går den svenska delen av släktträdet ofta att följa tillbaka till 1700-talet.",
      ],
      records: ["Sveriges riksarkiv"],
      guide: [
        "Rumäner har kommit till Sverige i flera vågor: politiska flyktingar före 1989, och efter 1990 och särskilt efter 2007 läkare, ingenjörer, studenter och familjer. Deras barn växer upp med svenska, och släktträdet blir en bra väg till far- och morföräldrarnas språk och byar.",
        "Rumänska handlingar beställs via den konsulära avdelningen vid ambassaden i Stockholm, med tidsbokning på econsulat.ro. För gamla rumänska böcker skriver du till Rumäniens riksarkiv, länsavdelningen för byn, med namnet och ungefärligt år.",
        "För den svenska delen av släkten har Riksarkivet de gamla kyrkoböckerna gratis på nätet, även husförhörslängderna, där prästen år för år förde in varje hushåll med födslar, flyttningar och dödsfall.",
        "För flyktingarna före 1989 bröts kontakten med släkten i Rumänien ofta i många år. De brev, foton och handlingar de sparat är en skatt för efterkommande: skanna dem och lägg in dem i släktträdet, med namnen på personerna i bilderna, medan det ännu finns människor som känner igen dem.",
        "För gamla handlingar från Rumänien, kom ihåg regeln om regionerna: i Transsylvanien, Banatet och Crișana börjar civilregistreringen 1895, i Moldavien och Valakiet 1865. Före dess finns bara församlingarnas böcker, hos riksarkivet eller i församlingarna. Ett väl gjort släktträd knyter varje person till den handling uppgifterna kommer från.",
      ],
      specifics: [
        "Fram till 1991 sköttes folkbokföringen i Sverige av Svenska kyrkans församlingar, därefter av Skatteverket. Därför är kyrkoböckerna huvudkällan för svenska förfäder, även för 1900-talet.",
        "Många gamla svenska namn var patronymika, efter faderns namn: Anders son hette Andersson och hans dotter Andersdotter. Fasta släktnamn blev allmänna först i början av 1900-talet, så i gamla böcker byts namnet i varje generation.",
        "I Sverige har varje person ett personnummer som står i alla handlingar. För en släkting som bott här hittar du lättare hens handlingar hos myndigheterna med personnumret.",
        "De svenska flyttlängderna visar när och vart varje person flyttade från en församling till en annan. Med dem kan du följa en familj från församling till församling, även om namnet har ändrats, och se var du ska leta efter nästa generation.",
      ],
      faq: [
        { q: "Var beställer jag rumänska handlingar i Sverige?", a: "Hos den konsulära avdelningen vid ambassaden i Stockholm, med tidsbokning på econsulat.ro." },
        { q: "Behöver jag apostille i Sverige?", a: "Inte för offentliga handlingar om civilstånd från ett annat EU-land; du kan också begära det flerspråkiga formuläret som följer med." },
        { q: "Var hittar jag min partners svenska förfäder?", a: "I kyrkoböckerna som Riksarkivet har lagt ut på nätet, framför allt i husförhörslängderna." },
        { q: "Mitt barn är fött i Sverige. Kan det få rumänska handlingar?", a: "Ja. Födelsen förs in i de rumänska registren via ambassaden eller hos folkbokföringen i Rumänien." },
        { q: "Kan jag göra släktträdet på svenska?", a: "Ja. Webbplatsen finns på svenska, engelska och flera andra språk, och släkten i Rumänien fyller i samma släktträd på rumänska." },
        { q: "Hur lång tid tar ett rumänskt intyg som beställs från Sverige?", a: "Oftast några veckor, eftersom ansökan går via ambassaden till kommunen i Rumänien. En fullmakt till en släkting där kan korta vägen." },
        { q: "Farfar lämnade Rumänien före 1989. Går hans handlingar att hitta?", a: "Ja, oftast. Hans födelse- och vigselhandlingar finns i den kommun där de registrerades, och de som är äldre än 100 år hos riksarkivet, per län." },
      ],
    },
  },
};
