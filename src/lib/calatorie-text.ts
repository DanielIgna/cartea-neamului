/**
 * Textele călătoriei care nu vin din arbore: popasul despre anii comunismului și capătul drumului.
 * Sunt scrise aici, la un loc, ca să le poată îndrepta ușor cine ține site-ul. Versetele sunt din traducerea Cornilescu.
 */
const bible = (book: string, chapter: number) => `https://www.bible.com/ro/bible/126/${book}.${chapter}.NTR`;

export const REGIME_TEXT = {
  title: "Anii minciunii și ai fricii",
  years: "1947–1989",
  paragraphs: [
    "Aici nava trece prin anii comunismului. Oamenilor li s-a luat pământul la colectivizare, iar cine se împotrivea ajungea la Sighet, la Aiud sau la Canal. Securitatea asculta, iar vecinii erau puși să se pârască între ei.",
    "Ziarele și școala spuneau ce hotăra partidul. Biserica greco-catolică a fost desființată în 1948, preoți și credincioși au fost închiși, iar cei care se adunau să citească Biblia erau urmăriți. Un sistem care se ține prin minciună, frică și manipulare are nevoie de oameni care nu mai pun întrebări.",
    "Sistemele cad, dar ispita rămâne: și azi, ideologii de tot felul promit o lume nouă și cer în schimb să nu mai întrebi ce e adevărat.",
  ],
  question: "Ce a însemnat asta pentru ai tăi? Și pe ce adevăr te sprijini tu, când ți se spune ce să crezi?",
  verse: "Veți cunoaște adevărul, și adevărul vă va face slobozi.",
  verseRef: "Ioan 8:32",
};

export const END_TEXT = {
  kicker: "Mai înapoi decât arată fișele",
  title: "Toate spițele duc la Adam",
  intro: "Oricât de departe ar merge o spiță, la capăt e același om. Geneza 5 scrie „Cartea neamurilor lui Adam”: fiecare s-a născut fără să fie întrebat, a trăit, și apoi a murit.",
  lines: [
    { name: "Spița lui Adam", ref: "Geneza 5", href: bible("GEN", 5), text: "În ea intrăm toți prin naștere. Așa ai ajuns și tu în arborele acesta." },
    { name: "Spița lui Isus Hristos", ref: "Matei 1", href: bible("MAT", 1), text: "În ea se intră prin credință: o chemare pentru fiecare om, oricare i-ar fi neamul." },
  ],
  paragraphs: [
    "Adevărul de care aveau nevoie și ai tăi, și tu, nu e o idee. E Isus Hristos, care a luat chip de om și a locuit printre noi, plin de har și de adevăr. A fost Mielul de jertfă al lui Dumnezeu: a murit pe cruce în locul meu și al tău, omule, oricine ai fi.",
    "Cine Îl primește ca Mântuitor personal se naște din nou și primește o chemare cerească: să trăiască în lume sfânt și fără prihană, adică pus deoparte pentru Dumnezeu, să facă voia Lui și, la urmă, să moștenească nemurirea.",
  ],
  verses: [
    { text: "Dar tuturor celor ce L-au primit, adică celor ce cred în Numele Lui, le-a dat dreptul să se facă copii ai lui Dumnezeu.", ref: "Ioan 1:12" },
    { text: "Eu sunt calea, adevărul și viața.", ref: "Ioan 14:6" },
  ],
  question: "Numele tău e în arborele acesta. Dar e scris și în Cartea Vieții?",
  questionRef: "Apocalipsa 20:12",
  invite: "Dumnezeu ți-a lăsat o scrisoare de dragoste: Cuvântul Lui. Începe cu Evanghelia după Ioan și citește-o singur.",
  read: { label: "Citește Evanghelia după Ioan", href: bible("JHN", 1) },
};
