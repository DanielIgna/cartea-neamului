/**
 * Călătoria în timp (/arbore/[id]/calatorie): nava, opririle, jocul, popasul din anii comunismului și cuvântul de la final.
 * Aceleași reguli ca în ../ro.ts. Cuvântul de la final nu e aici: e un text lung, cu versete, în src/lib/cuvant-final-limbi.ts.
 * Versetul popasului e din Biblia clasică a fiecărei limbi (Cornilescu, King James, Segond 1910…), vezi memoria „biblii-clasice”.
 */
import type { Widen } from "../types";

export const roCalatorie = {
  Journey: {
    roadKeyApprox: "„{example}” = an aproximativ, socotit după rudele apropiate",
    roadKeyStop: "„{word}” = oprire în anii comunismului ({years})",
    title: "Călătoria în timp",
    titleTree: "Călătoria în timp · {tree}",
    pagesHint: "Răspunsurile bune de la opriri",
    pages: "File de istorie: {got} din {total}",
    back: "Înapoi la arbore",
    cockpit: {
      from: "Pornim din",
      dest: "Destinația",
      moving: "Coborâm prin ani…",
      landed: "Am aterizat în",
      beginning: "la începutul tuturor neamurilor",
      present: "prezentul",
    },
    ago: "{n, plural, =0 {anul acesta} one {acum un an} few {acum # ani} other {acum # de ani}}",
    today: "Azi",
    todayYear: "Azi, {year}",
    beyond: "Dincolo de timp",
    roadLabel: "Opririle călătoriei",
    approxYear: "cca. {year}",
    stopShort: "popas",
    line: "{kind, select, father {Spița tatălui} mother {Spița mamei} other {Spița {surname}}}",
    lineInText: "{kind, select, father {spița tatălui} mother {spița mamei} other {spița {surname}}}",
    nav: {
      back: "◀ Spre prezent",
      start: "Pornește motoarele ▶",
      beyond: "Dincolo de timp ▶",
      next: "Mai departe în trecut ▶",
    },
    start: {
      title: "Nava timpului e gata de plecare",
      lead: "Pornim din {now}, de la {name}, și coborâm prin ani pe {lines}, până la {oldest}, {sex, select, F {născută} other {născut}} {approx, select, yes {pe la} other {în}} {year}. La fiecare oprire afli cine era, cum se trăia atunci în ținutul lui, ce a trăit și cine mai era în viață din familie.",
      twoLines: "{a} și pe {b}",
      single: "Deocamdată nava are o singură oprire. Trece părinții și bunicii lui {name} în arbore, cu anul și locul nașterii, și călătoria va coborî pe urmele lor.",
      help: "Spițele merg din tată în tată, la tată și la mamă (prin tatăl ei), sau de unde le-ai ales tu în Copac. Folosește săgețile ◀ ▶ sau apasă pe anii de mai sus.",
    },
    stop: {
      gens: "{n, plural, one {o generație în urmă} few {# generații în urmă} other {# de generații în urmă}}",
      ancestor: "strămoș",
      bornApprox: "{sex, select, F {născută} other {născut}} pe la {year}",
      estimated: "Anul nașterii nu e trecut; l-am socotit cam cu o generație înaintea copilului: pe la {year}",
      guess: "Locul nu e trecut în fișă; l-am luat după {name}.",
      before: "Cu puțin înainte să vină pe lume",
      lived: "Cum i-a atins viața istoria",
      alive: "În {year} mai trăiau din familie",
      age: "{n, plural, =0 {nou-născut} one {un an} few {# ani} other {# de ani}}",
      nobody: "Nu știm încă pe nimeni altcineva din familie care să fi trăit atunci. Frații, bunicii și verii trecuți în arbore, cu anul nașterii, apar aici.",
      open: "Deschide fișa lui {name}",
    },
    quiz: {
      title: "Jocul opririi",
      question: "Pe care dintre acestea a apucat-o {name}?",
      right: "Corect: ai câștigat o filă de istorie.",
      wrong: "Nu chiar.",
      when: "S-a întâmplat în {year}.",
    },
    // Popasul din anii comunismului: istorie, fără judecăți de partid.
    regime: {
      chip: "Popas · {years}",
      title: "Anii minciunii și ai fricii",
      dest: "Popas: anii minciunii și ai fricii",
      p1: "Aici nava trece prin anii comunismului. Oamenilor li s-a luat pământul la colectivizare, iar cine se împotrivea ajungea la Sighet, la Aiud sau la Canal. Securitatea asculta, iar vecinii erau puși să se pârască între ei.",
      p2: "Ziarele și școala spuneau ce hotăra partidul. Biserica greco-catolică a fost desființată în 1948, preoți și credincioși au fost închiși, iar cei care se adunau să citească Biblia erau urmăriți. Un sistem care se ține prin minciună, frică și manipulare are nevoie de oameni care nu mai pun întrebări.",
      p3: "Sistemele cad, dar ispita rămâne: și azi, ideologii de tot felul promit o lume nouă și cer în schimb să nu mai întrebi ce e adevărat.",
      question: "Ce a însemnat asta pentru ai tăi? Și pe ce adevăr te sprijini tu, când ți se spune ce să crezi?",
      verse: "Veți cunoaște adevărul, și adevărul vă va face slobozi.",
      ref: "Ioan 8:32",
    },
    noWord: "Aici se oprește ce știm despre neam. Fiecare strămoș trecut în arbore duce nava mai departe în trecut.",
    word: {
      pages: "Ai adunat {got} din {total} file de istorie pe drum.",
      readJohn: "Citește Evanghelia după Ioan",
      church: "Istoria Bisericii prigonite",
      bible: "Versetele sunt din Biblia tradusă de Dumitru Cornilescu.",
    },
    editor: {
      title: "Cuvântul de la final",
      state: "acum: {state, select, base {textul de bază} own {textul scris de tine} other {ascuns}}",
      open: "Schimbă",
      close: "Închide",
      help: "Doar tu, ca proprietar, îl poți schimba; îl văd toți cei din arbore. Un rând care începe cu „## ” e titlu, unul care începe cu „> ” e verset (cu trimiterea după „ — ”), iar un rând gol începe un paragraf nou.",
      save: "Salvează textul",
      reset: "Pune textul de bază",
      hide: "Ascunde pentru toți",
      hidden: "Cuvântul de la final e ascuns pentru toți.",
      restored: "Am pus înapoi textul de bază.",
      saved: "Am salvat textul tău.",
    },
    errors: {
      tooLong: "Textul poate avea cel mult {max} de caractere.",
      notOwner: "Doar proprietarul arborelui schimbă cuvântul de la final.",
      demo: "În contul de probă cuvântul de la final rămâne cel de bază.",
      empty: "Scrie textul sau alege „Ascunde pentru toți”.",
    },
  },
};

export type CalatorieCatalog = Widen<typeof roCalatorie>;
