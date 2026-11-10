/**
 * Cartea neamului de tipărit. `Book` e cartea însăși (pe server, în limba cărții, aleasă cu `?limba=`, de la sine limba
 * cititorului) și pagina din jurul ei; `BookUi` sunt alegerile, textele și butoanele din browser, în limba cititorului.
 * Aceleași reguli ca în ../ro.ts. Ce a scris familia (numele, poveștile, titlul și cuvântul înainte) rămâne cum a fost scris.
 * Un `{sex, select, …}` cu aceleași ramuri le lasă celorlalte limbi loc pentru „née” / „né”, „épouse” / „époux”.
 */
import type { Widen } from "../types";

export const roCarte = {
  Book: {
    page: {
      audioOut: "{count, plural, one {O amintire spusă cu glasul nu e în carte, deci nici codul ei QR:} few {# amintiri spuse cu glasul nu sunt în carte, deci nici codurile lor QR:} other {# de amintiri spuse cu glasul nu sunt în carte, deci nici codurile lor QR:}}",
      audioNotTicked: "{count, plural, one {una nu e bifată „Poate intra în Cartea neamului” (o bifează cine a scris-o, din ladă);} other {# nu sunt bifate „Poate intra în Cartea neamului” (le bifează cine le-a scris, din ladă);}}",
      audioCloseOnly: "{count, plural, one {una e doar pentru familia apropiată și intră numai în ediția cu toate datele;} other {# sunt doar pentru familia apropiată și intră numai în ediția cu toate datele;}}",
      audioLivingHidden: "{count, plural, one {una e a unui om în viață, ascuns în această ediție.} other {# sunt ale unor oameni în viață, ascunși în această ediție.}}",
      title: "Cartea neamului",
      back: "Înapoi la arbore",
      lead: "Coperta, cuprinsul, strămoșii în evantai, copacul neamului și câte o fișă pentru fiecare om, cu poze și povești. Se face din ce e acum în arbore: când familia mai adaugă ceva, deschide pagina din nou și cartea are și noutățile.",
      empty: "Nu e încă nimeni de pus în carte. Adaugă oameni în arbore, apoi revino aici.",
    },
    errors: {
      noTree: "Arborele nu există.",
      notEditor: "Doar proprietarul și editorii arborelui pot schimba textele cărții.",
    },
    // Ce calculează src/lib/book.ts: titlurile generațiilor, „din altă relație”, numele de fată din index.
    model: {
      generationTitle: "{first, select, yes {Generația I} other {Generația a {roman}-a}}",
      generationSelf: "Generația lui {who}",
      generationUp: "{n, plural, =1 {Generația părinților lui {who}} =2 {Generația bunicilor lui {who}} =3 {Generația străbunicilor lui {who}} =4 {Generația răstrăbunicilor lui {who}} few {Cu # generații înaintea lui {who}} other {Cu # de generații înaintea lui {who}}}",
      generationDown: "{n, plural, =1 {Generația copiilor lui {who}} =2 {Generația nepoților lui {who}} =3 {Generația strănepoților lui {who}} =4 {Generația răstrănepoților lui {who}} few {Cu # generații după {who}} other {Cu # de generații după {who}}}",
      others: "Alte persoane din arbore",
      othersSub: "Încă fără o legătură trecută cu restul neamului",
      fromOtherRelation: "din altă relație",
      fromMarriage: "din căsătoria cu {name}",
      maiden: "{sex, select, F {(n. {name})} M {(n. {name})} other {(n. {name})}}",
      marriedAs: "{sex, select, F {(căs. {name})} M {(căs. {name})} other {(căs. {name})}}",
    },
    /** Trimiterea la pagina unei fișe; {n} e numărul paginii. */
    pageRef: "(p. {n})",
    cover: {
      kicker: "Cartea neamului",
      by: "Alcătuită de {author}",
    },
    toc: "Cuprins",
    about: {
      ofTree: "În carte {count, plural, one {este o persoană} few {sunt # persoane} other {sunt # de persoane}} din cele {all, number} ale arborelui",
      livingHidden: "{count, plural, one {o persoană în viață ascunsă} few {# persoane în viață ascunse} other {# de persoane în viață ascunse}} în această ediție",
      otherLeftOut: "{count, plural, one {o persoană discretă, fără nume sau fără legătură cu cei din carte} few {# persoane discrete, fără nume sau fără legătură cu cei din carte} other {# de persoane discrete, fără nume sau fără legătură cu cei din carte}}",
      title: "Despre această carte",
      people: "Cartea adună {count, plural, one {un om} few {# oameni} other {# de oameni}}.",
      peopleGenerations: "Cartea adună {count, plural, one {un om} few {# oameni} other {# de oameni}}, pe {generations, plural, one {o generație} few {# generații} other {# de generații}}.",
      oldest: "{sex, select, F {Cea mai veche este} M {Cel mai vechi este} other {Cel mai vechi este}} <ref>{name}</ref>.",
      oldestDated: "{sex, select, F {Cea mai veche este} M {Cel mai vechi este} other {Cel mai vechi este}} <ref>{name}</ref>, {dates}.",
      span: "Primul s-a născut în {from}, cel mai tânăr în {to}.",
      surnames: "Numele de familie",
      places: "Locurile unde s-au născut",
      howTitle: "Cum se citește",
      how: "Oamenii sunt așezați pe generații, de la cei mai vechi la cei mai tineri; în fiecare generație, fiecare om are alături soțul sau soția, iar frații vin în ordinea nașterii. Numărul de lângă un nume, de pildă {example}, arată pagina pe care e fișa acelui om. La final găsești indexul cu toate numele, și cu numele de fată.",
      voices: "Înainte de index, în „{chapter}”, {count, plural, one {este o amintire povestită} few {sunt # amintiri povestite} other {sunt # de amintiri povestite}} chiar de {tellers}{audio, select, yes {{count, plural, one {; dacă e spusă cu glasul, o asculți scanând codul de lângă ea} other {; pe cele spuse cu glasul le asculți scanând codul de lângă ele}}} other {}}.",
      tellers: "{count, plural, one {un om din neam} few {# oameni din neam} other {# de oameni din neam}}",
      privacyNames: "Cei în viață apar doar cu numele, fără date, locuri și poze, ca să poată fi dată cartea și altora.",
      privacyHidden: "Cei în viață nu apar în această ediție a cărții.",
      privacyAll: "Cei în viață apar cu toate datele: cartea e doar pentru familie.",
    },
    preface: "Cuvânt înainte",
    fan: {
      title: "Evantaiul strămoșilor",
      titleOf: "Strămoșii lui {name}",
      sub: "{count, plural, one {O generație} few {# generații} other {# de generații}}: linia tatălui în stânga, a mamei în dreapta.",
      father: "Linia tatălui",
      mother: "Linia mamei",
      unknown: "Nu se știe încă",
      living: "în viață",
    },
    tree: {
      title: "Copacul neamului",
      sub: "{title}: {count, plural, one {un om} few {# oameni} other {# de oameni}}.",
      subTrunk: "{title}: {count, plural, one {un om} few {# oameni} other {# de oameni}}. Trunchiul duce până la {name}.",
      zoom: "În PDF, mărește desenul ca să citești toate numele.",
    },
    descendants: {
      title: "Urmașii lui {name}",
      sub: "Pe rând, cu numere: 1.2 e al doilea copil al primului, 1.2.1 primul lui copil; ⚭ înseamnă căsătorit cu.",
      hidden: "și {count, plural, one {un copil în viață} few {# copii în viață} other {# de copii în viață}}",
    },
    /** Câți oameni are o generație, lângă numele ei. */
    people: "{count, plural, one {un om} few {# oameni} other {# de oameni}}",
    person: {
      born: "{sex, select, F {Născută} M {Născut} other {Născut(ă)}}",
      died: "{sex, select, F {Decedată} M {Decedat} other {Decedat(ă)}}",
      lives: "Locuiește",
      occupation: "Ocupația",
      parents: "Părinți",
      /** Eticheta celuilalt soț, după sexul celui din fișă: la un bărbat, „Soție”. */
      spouse: "{sex, select, M {Soție} F {Soț} other {Soț / soție}}",
      children: "Copii",
      childrenOther: "Copii din altă relație",
      nthMarriage: "{n, plural, =1 {Prima căsătorie} =2 {A doua căsătorie} =3 {A treia căsătorie} =4 {A patra căsătorie} =5 {A cincea căsătorie} other {A #-a căsătorie}}",
      marriage: "cu <ref>{name}</ref>{married}{kids, select, yes {; copii: <list></list>} other {}}",
      married: "{kind, select, date {, căsătoriți la {when}} year {, căsătoriți în {when}} other {, căsătoriți {when}}}",
      livingChildren: "{count, plural, one {un copil în viață} few {# copii în viață} other {# de copii în viață}}",
      raisedBy: "{sex, select, F {Crescută de} M {Crescut de} other {Crescut(ă) de}}",
      raised: "A crescut",
      memories: "Amintiri",
      memoriesLink: "{count, plural, one {o amintire} few {# amintiri} other {# de amintiri}}, cu vorbele {sex, select, F {ei} M {lui} other {lui}}",
    },
    voices: {
      title: "Cu vorbele lor",
      sub: "{count, plural, one {O amintire din lada cu amintiri, povestită chiar de cel care a trăit-o și lăsată de el pentru carte.} few {# amintiri din lada cu amintiri, povestite chiar de ei și lăsate de ei pentru carte.} other {# de amintiri din lada cu amintiri, povestite chiar de ei și lăsate de ei pentru carte.}}",
      audio: "{count, plural, one {Lângă ea e un cod: scanează-l cu camera telefonului și o asculți.} other {Lângă cele spuse cu glasul e un cod: scanează-l cu camera telefonului și le asculți.}}",
      private: "Cele lăsate doar pentru familia apropiată nu intră în această ediție.",
      question: "„{question}”",
      askedBy: "a întrebat {name}",
      toldAloud: "Povestea e spusă cu glasul.",
      listen: "<b>Ascult-o cu glasul {sex, select, F {ei} M {lui} other {lui}}</b>{time}: scanează codul cu telefonul.",
      recorded: "{audio, select, yes {Înregistrată} other {Scrisă}} la bunici de {name}.",
    },
    index: "Index de nume",
    colophon: {
      made: "Alcătuită de {author} pe Cartea Neamului, în {when}, din arborele „{tree}”: {count, plural, one {un om} few {# oameni} other {# de oameni}}.",
      redo: "Cartea se poate reface oricând de pe site, cu tot ce a mai adăugat familia între timp.",
    },
    /** Subtitlul de pe copertă, când nu s-a scris altul. */
    defaults: {
      subtitle: "{count, plural, one {Un om} few {# oameni} other {# de oameni}}",
      subtitleGenerations: "{count, plural, one {Un om} few {# oameni} other {# de oameni}}, {generations, plural, one {o generație} few {# generații} other {# de generații}}",
    },
  },
  BookUi: {
    options: {
      startFrom: "Pornește de la",
      language: "Limba cărții",
      living: "Cei în viață apar",
      livingNames: "doar cu numele",
      livingAll: "cu toate datele",
      livingHidden: "deloc",
      page: "Pagina",
      photos: "cu poze",
    },
    text: {
      summary: "Scrie titlul și cuvântul înainte",
      title: "Titlul de pe copertă",
      subtitle: "Subtitlu",
      author: "Alcătuită de",
      preface: "Cuvânt înainte",
      prefaceHint: "De pildă: de ce ați făcut cartea, cine a adunat poveștile, cui îi e dedicată. Un rând gol începe un paragraf nou.",
      save: "Păstrează textele",
      saving: "Se păstrează…",
      saved: "Am păstrat textele. Cartea se reface cu ele…",
    },
    view: {
      working: "Se așază paginile cărții…",
      workingPages: "Se așază paginile cărții… {count, plural, one {o pagină} few {# pagini} other {# de pagini}}",
      error: "Nu am putut așeza cartea. Reîncarcă pagina; dacă tot nu merge, scrie-ne.",
      download: "Descarcă PDF",
      ready: "{count, plural, one {O pagină} few {# pagini} other {# de pagini}}. Se deschide fereastra de tipărire: alege „Salvează ca PDF” (pe iPhone: Partajează, apoi Salvează în Fișiere).",
    },
  },
} as const;

export type CarteCatalog = Widen<typeof roCarte>;
