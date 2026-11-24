import type { NewLang } from "./tip";

/** Srpski (latinica). */
export const SR: NewLang = {
  ui: {
    hubTitle: "Rumuni širom sveta: porodično stablo, odakle god da ste", diaspora: "Dijaspora", home: "Početna",
    hubLead: "Za Rumune koji žive van Rumunije i za sve koji imaju rumunske korene: istorija zajednice u zemlji u kojoj živite, kako da dobijete dokumenta iz Rumunije bez putovanja, koji arhivi tamo postoje i kako da napravite porodično stablo zajedno sa rođacima u Rumuniji.",
    hubDescription: "Istorija iseljavanja, rumunska dokumenta iz inostranstva i arhivi: vodič za porodice sa rumunskim korenima u Srbiji i u celom svetu.",
    countries: "Evropa i Izrael", america: "Sjedinjene Američke Države", canada: "Kanada", themes: "Posebne stranice", states: "Savezne države", provinces: "Provincije i teritorije", cities: "Veliki gradovi", regions: "Regioni",
    history: "Kako su Rumuni došli ovde", where: "Gde žive", docs: "Rumunska dokumenta, tražena odavde", records: "Arhivi i matične knjige ovde",
    community: "Zajednice i udruženja", steps: "Korak po korak: porodično stablo, na daljinu", related: "Pogledajte i", otherLangs: "Stranica na drugim jezicima",
    titleCountry: (w) => `Rumunski koreni ${w}: dokumenta i stablo | Cartea Neamului`,
    descCountry: (w) => `Kako su Rumuni došli ${w}, kako odavde tražite dokumenta iz Rumunije, koji arhivi postoje i kako da napravite porodično stablo.`,
    titleRegion: (w) => `Rumuni ${w}: koreni, dokumenta i stablo | Cartea Neamului`,
    titleRegionShort: (w) => `Rumuni ${w}: koreni i dokumenta | Cartea Neamului`,
    descRegion: (w, c) => `Rumuni ${w} (${c}): zajednica, konzulat Rumunije, gde tražite dokumenta odavde i iz Rumunije i kako da napravite porodično stablo.`,
    citiesLine: (l) => `Najviše rumunskih porodica živi u mestima: ${l}.`,
    docsSteps: ({ where, eu }) => [
      "Najpre saznajte koji vam dokument treba i gde se čuva: izvode iz matične knjige rođenih, venčanih i umrlih izdaje matična služba (starea civilă) rumunske opštine u kojoj su upisani; knjige starije od 100 godina obično su u Nacionalnim arhivima Rumunije, u okružnom odeljenju (județ).",
      `Ako živite ${where}, imate tri puta: konzulat Rumunije nadležan za vaše područje (zakazivanje na econsulat.ro), rođak u Rumuniji kome date punomoćje (potpisuje se u konzulatu), ili zahtev elektronskom poštom direktno Nacionalnim arhivima za stare knjige.`,
      eu
        ? `Da biste rumunski izvod koristili ${where}, apostil obično više nije potreban: u Evropskoj uniji javne isprave o ličnom stanju važe bez njega (Uredba EU 2016/1191), a na zahtev dobijate i višejezični obrazac koji ih prati.`
        : `Da biste rumunski izvod koristili ${where}, obično vam treba Haški apostil, koji u Rumuniji izdaje prefektura, i overen prevod.`,
      "Kada tražite stari dokument, napišite sve što znate: ime i prezime (i njihov stari ili strani oblik), približnu godinu, selo i opštinu iz tog vremena. Stranica svakog mesta na Cartea Neamului pokazuje kojoj opštini i kojem arhivu selo pripada.",
      "Ako imate rumunsko državljanstvo, dokumenta sačinjena u inostranstvu (rođenje deteta, venčanje) upisuju se u rumunske matične knjige preko konzulata ili u matičnoj službi u Rumuniji.",
    ],
    communityText: ({ where, icr }) => [
      `Rumuni koji žive ${where} okupljaju se pre svega u kulturnim udruženjima, vikend školama i na časovima rumunskog jezika za decu. Registrovana udruženja navodi Departman za Rumune iz celog sveta (dprp.gov.ro), a konzulat obično zna ona u vašem gradu.`,
      ...(icr ? [`Rumunski kulturni institut ima ogranak u mestu ${icr}, sa izložbama, koncertima i bibliotekom.`] : []),
      "Najbolji izvor za istoriju porodice ipak su ljudi: najstariji u zajednici pamte iz kojih sela su došle prve porodice i ko je kome rod.",
    ],
    genealogySteps: [
      "Zapišite ono što već znate: imena, datume i mesta svojih roditelja, baba i deda.",
      "Pitajte starije rođake, i one koji su ostali u Rumuniji: video poziv sa starim fotografijama na ekranu vraća mnoga imena.",
      "Saznajte iz kog sela potiče porodica i potražite ga na Cartea Neamului: opština, arhiv i prezimena odande.",
      "Zatražite dokumenta koja vam trebaju, iz Rumunije i iz zemlje u kojoj živite (vidi gore).",
      "Stavite sve u jedno stablo koje cela porodica može da dopunjuje, gde god da živi.",
    ],
    ctaTitle: "Započnite porodično stablo", ctaText: "Prvih 7 dana je besplatno, bez kartice. Pozovete rođake u Rumuniji i u inostranstvu, i svako dodaje ono što zna.", ctaButton: "Započnite porodično stablo →",
    fallback: "Ova stranica još nije dostupna na vašem jeziku, pa se prikazuje na engleskom.", sources: "Izvori", localities: "Mesta u Rumuniji", names: "Rumunska prezimena", guides: "Vodiči za genealogiju",
    regionThin: "Još prikupljamo podatke o Rumunima ovde. Do tada, koraci ispod važe u celoj zemlji.",
  },
  x: {
    guide: (w) => `Kako da pronađete rumunske pretke kada živite ${w}`, specifics: "Dobro je znati", missions: "Ambasada i konzulati Rumunije", faq: "Česta pitanja",
    kind: { embassy: "Ambasada", consular: "Konzularno odeljenje", cg: "Generalni konzulat", consulate: "Konzulat" },
    missionsNote: (d) => `Provereno u zvaničnim izvorima ${d}. Područje za koje je nadležan svaki konzulat i radno vreme nalaze se na zvaničnoj stranici:`,
    statsNote: "Brojevi o zajednici su zaokruženi; tačne podatke objavljuje",
    price: (lei, local) => `Posle 7 besplatnih dana, plan Basic košta ${local ?? lei} godišnje${local ? ` (${lei})` : ""}.`,
    whatsapp: "Pošaljite babi i dedi u Rumuniji preko WhatsAppa",
    whatsappText: (u) => `Pravim naše porodično stablo i treba mi vaša pomoć: kako su se zvali vaši roditelji, babe i dede i iz kog su sela bili? Hajde da ga zajedno popunimo ovde: ${u}`,
  },
  romania: [
    "matične i crkvene knjige starije od 100 godina, po okruzima",
    "zakazivanje i zahtevi u konzulatima Rumunije",
    "spisak ambasada i konzulata i područje za koje je svaki nadležan",
    "udruženja Rumuna u inostranstvu i programi za dijasporu",
  ],
  names: {
    italia: "Italija", spania: "Španija", germania: "Nemačka", "marea-britanie": "Ujedinjeno Kraljevstvo", franta: "Francuska", austria: "Austrija",
    belgia: "Belgija", irlanda: "Irska", olanda: "Holandija", portugalia: "Portugalija", suedia: "Švedska", danemarca: "Danska",
    elvetia: "Švajcarska", grecia: "Grčka", cipru: "Kipar", israel: "Izrael", "statele-unite": "Sjedinjene Američke Države", canada: "Kanada",
    ucraina: "Ukrajina", norvegia: "Norveška", "republica-moldova": "Moldavija", serbia: "Srbija", bulgaria: "Bugarska", turcia: "Turska", luxemburg: "Luksemburg",
  },
  countries: {
    serbia: {
      where: "u Srbiji",
      size: "oko 23.000 ljudi izjasnilo se kao Rumuni i oko 21.000 kao Vlasi na popisu u Srbiji 2022. godine: Rumuni uglavnom u Vojvodini, Vlasi uglavnom u istočnoj Srbiji",
      history: [
        "Rumuni u Srbiji žive u dva kraja sa različitom istorijom. U srpskom Banatu, u Autonomnoj Pokrajini Vojvodini, postoje stara rumunska sela, sa školama, štampom i pozorištem na rumunskom jeziku. U istočnoj Srbiji, u Timočkoj krajini i duž Dunava, između Morave, Timoka i Dunava, žive Vlasi, koji govore rumunske govore i čuvaju stare običaje.",
        "Banat je bio pod habsburškom vlašću od 1718. do 1918. godine. Posle Prvog svetskog rata, 1919–1920, podeljen je između Rumunije, Kraljevine Srba, Hrvata i Slovenaca i, manjim delom, Mađarske. Rumuni iz sela koja su ostala južno od nove granice postali su građani Jugoslavije, a zatim Srbije. Danas je rumunski jedan od službenih jezika Vojvodine, a u Pančevu od 1945. izlazi nedeljnik na rumunskom jeziku „Libertatea”.",
        "Vlasi u istočnoj Srbiji imaju istoriju stariju od današnje granice: mnogi su u 18. i 19. veku došli iz Oltenije i iz Banata, a drugi su tu živeli i ranije. Na srpskim popisima jedni se izjašnjavaju kao Rumuni, drugi kao Vlasi; obe grupe govore govore rumunskog jezika, a jedna porodica može u dokumentima imati oba naziva, od generacije do generacije.",
        "Poslednjih decenija mnogi mladi iz ovih sela otišli su na rad u Austriju, Nemačku, Švajcarsku ili Francusku, a drugi su došli na studije u Rumuniju, u Temišvar ili Bukurešt. Tako stablo jedne porodice iz Vršca ili Negotina danas ima grane u tri ili četiri zemlje i na isto toliko jezika.",
        "Za njih je Cartea Neamului mesto gde porodica piše svoju istoriju na jeziku baba i deda, čak i kada unuci lakše čitaju na srpskom ili nemačkom, i gde svaka grana može da doda ono što zna, odakle god da je.",
      ],
      records: [
        "arhiv pokrajine Vojvodine u Novom Sadu: dokumenta iz habsburškog perioda i posle 1918.",
        "Arhiv Srbije u Beogradu, sa mrežom regionalnih istorijskih arhiva",
        "dokumenta, punomoćja i upisi u matične knjige, uz zakazivanje na econsulat.ro",
      ],
      guide: [
        "Počnite od baba i deda: puna imena, devojačka prezimena, selo, godine i ko se s kim venčao. U Banatu nazivi sela često imaju rumunski i srpski oblik (Vârșeț i Vršac, Panciova i Pančevo); zapišite oba.",
        "Izvode iz matičnih knjiga tražite od matične službe srpske opštine u kojoj su upisani. Stare knjige su u regionalnim istorijskim arhivima i u Arhivu Vojvodine u Novom Sadu. Za vlaške porodice iz istočne Srbije tražite u regionalnim arhivima u Zaječaru i Negotinu.",
        "Ako je porodica imala veze sa rumunskim Banatom ili sa Oltenijom, deo dokumenata može biti i u Rumuniji, u okružnim odeljenjima Nacionalnih arhiva Timiš, Karaš-Severin ili Mehedinci.",
      ],
      specifics: [
        "Srpska dokumenta pisana su ćirilicom ili latinicom, a rumunska imena se javljaju prilagođena: Ion može biti Jon ili Јон, Popescu može biti Popesku. U stablu sačuvajte oblik iz svakog dokumenta i oblik koji se koristi u porodici.",
        "Srbija nije u Evropskoj uniji: srpska dokumenta koja se koriste u Rumuniji treba da imaju apostil i prevod, a rumunska dokumenta koja se koriste u Srbiji isto tako.",
      ],
      faq: [
        { q: "Koja je razlika između Rumuna i Vlaha u Srbiji?", a: "To su dva naziva koja ljudi biraju na popisu. Rumuni žive uglavnom u Vojvodini, Vlasi uglavnom u istočnoj Srbiji; obe grupe govore govore rumunskog jezika." },
        { q: "Gde da nađem dokumenta dede iz srpskog Banata?", a: "Novija dokumenta u matičnoj službi opštine; starija u regionalnom istorijskom arhivu ili u Arhivu Vojvodine u Novom Sadu." },
        { q: "Mogu li da pišem stablo na rumunskom, a da ga unuci čitaju na srpskom?", a: "Da. Cartea Neamului postoji i na srpskom: svako čita sajt na svom jeziku, a imena i priče ostaju onako kako ste ih napisali." },
        { q: "Gde su konzulati Rumunije u Srbiji?", a: "Rumunija ima ambasadu u Beogradu i generalne konzulate u Vršcu i Zaječaru; zakazuje se na econsulat.ro." },
        { q: "Da li mi treba apostil za srpski dokument koji koristim u Rumuniji?", a: "Po pravilu da, uz overen prevod. Najpre proverite u ustanovi koja traži dokument." },
      ],
    },
  },
};
