import type { NewLang } from "./tip";

/** Norsk (bokmål). */
export const NB: NewLang = {
  ui: {
    hubTitle: "Rumenere i verden: slektstreet, uansett hvor du bor", diaspora: "Diaspora", home: "Hjem",
    hubLead: "For rumenere som bor utenfor Romania, og for alle med rumenske røtter: historien om fellesskapet der du bor, hvordan du får rumenske dokumenter uten å reise, hvilke arkiver som finnes der, og hvordan du lager slektstreet sammen med familien i Romania.",
    hubDescription: "Utvandringens historie, rumenske dokumenter fra utlandet og arkiver: en guide for familier med rumenske røtter i Norge og resten av verden.",
    countries: "Europa og Israel", america: "USA", canada: "Canada", themes: "Spesielle sider", states: "Delstater", provinces: "Provinser og territorier", cities: "Storbyer", regions: "Regioner",
    history: "Slik kom rumenerne hit", where: "Hvor de bor", docs: "Rumenske dokumenter, bestilt herfra", records: "Arkiver og registre her",
    community: "Fellesskap og foreninger", steps: "Steg for steg: slektstreet, på avstand", related: "Se også", otherLangs: "Siden på andre språk",
    titleCountry: (w) => `Rumenske røtter ${w}: dokumenter og slektstre | Cartea Neamului`,
    descCountry: (w) => `Hvordan rumenerne kom ${w}, hvordan du bestiller rumenske dokumenter herfra, hvilke arkiver som finnes og hvordan du lager slektstreet.`,
    titleRegion: (w) => `Rumenere ${w}: røtter, dokumenter og slektstre | Cartea Neamului`,
    titleRegionShort: (w) => `Rumenere ${w}: røtter og dokumenter | Cartea Neamului`,
    descRegion: (w, c) => `Rumenere ${w} (${c}): fellesskapet, Romanias konsulat, hvor du bestiller dokumenter herfra og fra Romania, og hvordan du lager slektstreet.`,
    citiesLine: (l) => `De fleste rumenske familiene bor i ${l}.`,
    docsSteps: ({ where, eu }) => [
      "Finn først ut hvilket dokument du trenger og hvor det ligger: fødsels-, vigsels- og dødsattester utstedes av folkeregisteret (starea civilă) i den rumenske kommunen der hendelsen ble registrert; bøker eldre enn 100 år ligger som regel hos Romanias riksarkiv, i fylkesavdelingen (județ).",
      `Bor du ${where}, finnes det tre veier: Romanias konsulat for ditt område (timebestilling på econsulat.ro), en slektning i Romania som du gir fullmakt (signeres på konsulatet), eller en henvendelse direkte til riksarkivet på e-post for de gamle bøkene.`,
      eu
        ? `For å bruke en rumensk attest ${where} trenger du som regel ikke lenger apostille: i EU gjelder dokumenter om sivilstand uten apostille (EU-forordning 2016/1191), og du kan be om et flerspråklig standardskjema som følger med.`
        : `For å bruke en rumensk attest ${where} trenger du som regel apostille etter Haagkonvensjonen, utstedt i Romania av prefekturen, og en autorisert oversettelse.`,
      "Når du ber om et gammelt dokument, skriv alt du vet: navnet (også i gammel eller utenlandsk skrivemåte), omtrentlig år og bygda og kommunen den gangen. Hver stedsside på Cartea Neamului viser hvilken kommune og hvilket arkiv bygda hører til.",
      "Har du rumensk statsborgerskap, blir dokumenter utstedt i utlandet (et barns fødsel, et ekteskap) ført inn i de rumenske registrene via konsulatet eller hos folkeregisteret i Romania.",
    ],
    communityText: ({ where, icr }) => [
      `Rumenere som bor ${where}, møtes særlig gjennom kulturforeninger, helgeskoler og rumenskundervisning for barn. Registrerte foreninger står på nettsiden til Romanias departement for rumenere i utlandet (dprp.gov.ro), og konsulatet kjenner som regel dem i din by.`,
      ...(icr ? [`Det rumenske kulturinstituttet har en avdeling i ${icr}, med utstillinger, konserter og et bibliotek.`] : []),
      "De beste kildene til familiens historie er likevel menneskene: de eldste i fellesskapet husker hvilke bygder de første familiene kom fra, og hvem som er i slekt med hvem.",
    ],
    genealogySteps: [
      "Skriv ned det du allerede vet: navn, datoer og steder for foreldrene og besteforeldrene dine.",
      "Spør de eldre i familien, også dem som ble igjen i Romania: en videosamtale med gamle bilder på skjermen henter fram mange navn.",
      "Finn bygda familien kommer fra, og slå den opp på Cartea Neamului: kommunen, arkivet og slektsnavnene derfra.",
      "Bestill dokumentene du trenger, fra Romania og fra landet der du bor (se over).",
      "Samle alt i ett slektstre som hele familien kan fylle ut, uansett hvor de bor.",
    ],
    ctaTitle: "Begynn slektstreet", ctaText: "De første 7 dagene er gratis, uten kort. Du inviterer familien i Romania og i utlandet, og hver legger til det de vet.", ctaButton: "Begynn slektstreet →",
    fallback: "Siden finnes ennå ikke på ditt språk, så den vises på engelsk.", sources: "Kilder", localities: "Steder i Romania", names: "Rumenske slektsnavn", guides: "Guider til slektsforskning",
    regionThin: "Vi samler fortsatt opplysninger om rumenerne her. Inntil videre gjelder stegene nedenfor i hele landet.",
  },
  x: {
    guide: (w) => `Slik finner du dine rumenske forfedre når du bor ${w}`, specifics: "Godt å vite", missions: "Romanias ambassade og konsulater", faq: "Ofte stilte spørsmål",
    kind: { embassy: "Ambassade", consular: "Konsulær avdeling", cg: "Generalkonsulat", consulate: "Konsulat" },
    missionsNote: (d) => `Kontrollert mot offisielle kilder ${d}. Området hvert konsulat dekker og åpningstidene står på den offisielle siden:`,
    statsNote: "Tallene om fellesskapet er avrundet; de nøyaktige tallene publiseres av",
    price: (lei, local) => `Etter de 7 gratisdagene koster Basic-planen ${local ?? lei} i året${local ? ` (${lei})` : ""}.`,
    whatsapp: "Send det til besteforeldrene i Romania på WhatsApp",
    whatsappText: (u) => `Jeg lager slektstreet vårt og trenger hjelpen deres: hva het foreldrene og besteforeldrene deres, og hvilken bygd kom de fra? La oss fylle det ut sammen her: ${u}`,
  },
  romania: [
    "kirkebøker og sivilregistre eldre enn 100 år, etter fylke",
    "timebestilling og søknader hos Romanias konsulater",
    "liste over ambassader og konsulater og området hver dekker",
    "rumenske foreninger i utlandet og programmer for diasporaen",
  ],
  names: {
    italia: "Italia", spania: "Spania", germania: "Tyskland", "marea-britanie": "Storbritannia", franta: "Frankrike", austria: "Østerrike",
    belgia: "Belgia", irlanda: "Irland", olanda: "Nederland", portugalia: "Portugal", suedia: "Sverige", danemarca: "Danmark",
    elvetia: "Sveits", grecia: "Hellas", cipru: "Kypros", israel: "Israel", "statele-unite": "USA", canada: "Canada",
    ucraina: "Ukraina", norvegia: "Norge", "republica-moldova": "Moldova", serbia: "Serbia", bulgaria: "Bulgaria", turcia: "Tyrkia", luxemburg: "Luxembourg",
  },
  countries: {
    norvegia: {
      where: "i Norge",
      size: "18 893 innvandrere fra Romania og 3 347 norskfødte barn med innvandrerforeldre fra Romania per 1. januar 2026, ifølge Statistisk sentralbyrå (SSB)",
      history: [
        "De fleste rumenere i Norge kom etter 2007, da Romania ble medlem av EU, og veien til det norske arbeidsmarkedet åpnet seg gjennom EØS. Det kom arbeidere til bygg og anlegg, fiske og fiskeindustri, landbruk og renhold, men også leger, sykepleiere og ingeniører.",
        "Fellesskapet har allerede en andre generasjon: i begynnelsen av 2026 telte norsk statistikk over 3 300 barn født i Norge av foreldre fra Romania. Mange av dem snakker bedre norsk enn rumensk, og besteforeldrene kjenner de mest fra ferier og fra telefonen. For dem er et slektstre laget sammen med besteforeldrene den enkleste måten å finne ut hvor de kommer fra.",
        "Norge er ikke med i EU, så den europeiske forordningen som fritar dokumenter om sivilstand fra apostille, gjelder ikke her: rumenske dokumenter som brukes i Norge, trenger apostille og oversettelse, og norske dokumenter som brukes i Romania, trenger apostille. Norske attester (for eksempel fødselsattest) bestilles fra Folkeregisteret, som føres av Skatteetaten.",
        "For rumensk-norske familier er den norske delen av slektstreet lett å lage: Arkivverket har folketellingene og de gamle kirkebøkene gratis på Digitalarkivet. Den rumenske delen begynner med besteforeldrene: fulle navn, bygda, årstallene, og så fylkesarkivet som bygda hører til.",
        "Romanias ambassade ligger i Oscars gate 51, 0244 Oslo, ifølge EU-kommisjonens offisielle liste. Der bestiller du dokumenter fra Romania, gir fullmakter og får fødselen til barn født i Norge ført inn i de rumenske registrene, med timebestilling på econsulat.ro.",
      ],
      records: [
        "folketellinger og kirkebøker fra Norge, gratis på nett",
        "folkeregisteret: fødselsattester og attester om sivilstand",
        "hvor mange innvandrere fra hvert land som bor i Norge",
        "dokumenter, fullmakter og innføring i registrene, med timebestilling på econsulat.ro",
      ],
      guide: [
        "Begynn med det de levende vet. Ring foreldrene og besteforeldrene og skriv ned fulle navn, pikenavnet til bestemoren og oldemoren, bygda, årstallene og hvem som giftet seg med hvem. Med den nøyaktige bygda viser siden dens på Cartea Neamului kommunen, fylket og fylkesarkivet den hører til i dag.",
        "For dokumenter fra Romania har du tre veier: ambassaden i Oslo (timebestilling på econsulat.ro), en slektning i Romania med fullmakt signert på ambassaden, eller, for bøker eldre enn 100 år, fylkesavdelingen til Romanias riksarkiv, som du skriver til med navnet, omtrentlig år og bygda.",
        "For familiens norske dokumenter, for eksempel fødselsattesten til et barn født her, går du til Folkeregisteret, som føres av Skatteetaten. For å brukes i Romania trenger det norske dokumentet apostille og oversettelse, og barnets fødsel må føres inn i de rumenske registrene via ambassaden før det kan få rumenske dokumenter.",
      ],
      specifics: [
        "Norge er ikke med i EU, men i EØS. Derfor gjelder ikke fritaket for apostille på dokumenter om sivilstand i den europeiske forordningen mellom Romania og Norge.",
        "I gamle norske kilder står mange med et farsnavn (sønn eller datter av faren) og navnet på gården de bodde på, ikke med et fast slektsnavn. For blandede familier lønner det seg å skrive alle navneformene inn i slektstreet, slik at du finner dem i folketellingene på Digitalarkivet.",
      ],
      faq: [
        { q: "Hvor bestiller jeg time for rumenske dokumenter i Norge?", a: "Hos Romanias ambassade i Oslo, Oscars gate 51, med timebestilling på econsulat.ro." },
        { q: "Hvordan får jeg fødselen til et barn født i Norge ført inn i de rumenske registrene?", a: "Via ambassaden i Oslo, med den norske fødselsattesten apostillert og oversatt. Gjør det i god tid, før barnet trenger rumensk pass." },
        { q: "Trenger et rumensk dokument som skal brukes i Norge, apostille?", a: "Som regel ja, og i tillegg oversettelse, fordi Norge ikke er med i EU. Sjekk først med den norske institusjonen som ber om dokumentet." },
        { q: "Hvor finner jeg gamle norske kilder for en blandet familie?", a: "På Digitalarkivet, nettstedet til Arkivverket, der folketellingene og de gamle kirkebøkene kan søkes i gratis." },
        { q: "Barna mine snakker bedre norsk. Kan de lese slektstreet?", a: "Ja. På Cartea Neamului leser hvert familiemedlem slektstreet på sitt eget språk, også norsk, og besteforeldrene kan fylle det ut på rumensk." },
      ],
    },
  },
};
