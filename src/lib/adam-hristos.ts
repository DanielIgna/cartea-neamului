/**
 * „De la Adam la Hristos”: neamul lui Isus Hristos după Biblie, în șase arbori (Geneza 4–5, 10–11, 12–50; Exodul 6; Rut 4;
 * 1 Cronici 3; Matei 1; Luca 3). Scris de mână din textul Bibliei, cu numele din traducerea Dumitru Cornilescu: în Vechiul
 * Testament formele de acolo, iar unde Matei sau Luca scriu altfel, forma lor e în `alt`. Anii de viață sunt cei din Biblie;
 * anii „de la facerea lumii” sunt socotiți din textul ebraic (cel după care e tradus Cornilescu), iar pagina arată unde
 * Septuaginta (traducerea greacă veche) și Pentateuhul samaritean dau alte cifre. Anii „î.Hr.” ai împăraților sunt aproximativi.
 */

export type BNode = {
  id: string;
  name: string;
  /** Cum apare numele în altă carte (de ex. „Fares” în Matei 1). */
  alt?: string;
  /** Soția sau mama copiilor (de ex. „Eva”). */
  wife?: string;
  /** Câți ani a trăit, după Biblie. */
  life?: number;
  /** Cât a domnit (text: „40 de ani”, „3 luni”). */
  reign?: string;
  /** Când a trăit sau a domnit, aproximativ (de ex. „c. 970–931 î.Hr.”). */
  when?: string;
  /** Rândul mic de sub nume, când nu e vorba de ani (de ex. „din Lea”). */
  sub?: string;
  /** Pe linia lui Hristos după Matei (sau, înainte de Avraam, după Geneza și Luca). */
  main?: boolean;
  /** Pe linia lui Hristos după Luca 3 (prin Natan, fiul lui David). */
  luke?: boolean;
  woman?: boolean;
  /** Împărat din linie pe care Matei 1 nu-l numește. */
  omitted?: boolean;
  /** Nod care ține locul mai multor generații sau oameni (desenat punctat). */
  gap?: boolean;
  refs: string;
  note?: string;
  kids?: BNode[];
};

export type Epoch = {
  id: string;
  title: string;
  /** Rândul de sub titlu: perioada. */
  span: string;
  intro: string;
  verse: { text: string; ref: string };
  roots: BNode[];
  /** Legături în plus, punctate, între două noduri (de ex. Eli → Iosif). */
  links?: [string, string][];
};

/** Linia de la Adam la Iosif, cu vârsta tatălui la nașterea următorului și anii de viață, după textul ebraic. */
export const CHAIN: { id: string; name: string; at: number | null; life: number }[] = [
  { id: "adam", name: "Adam", at: 130, life: 930 },
  { id: "set", name: "Set", at: 105, life: 912 },
  { id: "enos", name: "Enos", at: 90, life: 905 },
  { id: "cainan", name: "Cainan", at: 70, life: 910 },
  { id: "mahalaleel", name: "Mahalaleel", at: 65, life: 895 },
  { id: "iared", name: "Iared", at: 162, life: 962 },
  { id: "enoh", name: "Enoh", at: 65, life: 365 },
  { id: "metusala", name: "Metusala", at: 187, life: 969 },
  { id: "lameh", name: "Lameh", at: 182, life: 777 },
  // Sem avea 100 de ani la doi ani după potop (Geneza 11:10), iar potopul a venit când Noe avea 600 (Geneza 7:6).
  { id: "noe", name: "Noe", at: 502, life: 950 },
  { id: "sem", name: "Sem", at: 100, life: 600 },
  { id: "arpacsad", name: "Arpacșad", at: 35, life: 438 },
  { id: "selah", name: "Șelah", at: 30, life: 433 },
  { id: "eber", name: "Eber", at: 34, life: 464 },
  { id: "peleg", name: "Peleg", at: 30, life: 239 },
  { id: "reu", name: "Reu", at: 32, life: 239 },
  { id: "serug", name: "Serug", at: 30, life: 230 },
  { id: "nahor", name: "Nahor", at: 29, life: 148 },
  { id: "terah", name: "Terah", at: 70, life: 205 },
  { id: "avraam", name: "Avraam", at: 100, life: 175 },
  { id: "isaac", name: "Isaac", at: 60, life: 180 },
  // Iacov avea 130 de ani când a venit în Egipt (Geneza 47:9), iar Iosif 39 (30 + 7 ani de belșug + 2 de foamete).
  { id: "iacov", name: "Iacov", at: 91, life: 147 },
  { id: "iosif-eg", name: "Iosif", at: null, life: 110 },
];

/** Anul de la facerea lumii în care s-a născut și în care a murit fiecare om din CHAIN (după textul ebraic). */
export function chainYears(): { id: string; name: string; born: number; died: number; life: number }[] {
  let year = 0;
  return CHAIN.map((c) => {
    const row = { id: c.id, name: c.name, born: year, died: year + c.life, life: c.life };
    year += c.at ?? 0;
    return row;
  });
}

/** Anul potopului de la facerea lumii, după textul ebraic: Noe avea 600 de ani (Geneza 7:6). */
export const FLOOD_AM = 1656;

/**
 * Vârsta tatălui la nașterea fiului din linie, în cele trei texte vechi (Geneza 5 și 11). „—” = numele lipsește.
 * Septuaginta are în plus pe Cainan între Arpacșad și Șelah, ca și Luca 3:36.
 */
export const VERSIONS: { name: string; mt: number | null; lxx: number | null; sp: number | null }[] = [
  { name: "Adam", mt: 130, lxx: 230, sp: 130 },
  { name: "Set", mt: 105, lxx: 205, sp: 105 },
  { name: "Enos", mt: 90, lxx: 190, sp: 90 },
  { name: "Cainan", mt: 70, lxx: 170, sp: 70 },
  { name: "Mahalaleel", mt: 65, lxx: 165, sp: 65 },
  { name: "Iared", mt: 162, lxx: 162, sp: 62 },
  { name: "Enoh", mt: 65, lxx: 165, sp: 65 },
  { name: "Metusala", mt: 187, lxx: 167, sp: 67 },
  { name: "Lameh", mt: 182, lxx: 188, sp: 53 },
  { name: "Noe (la potop)", mt: 600, lxx: 600, sp: 600 },
  { name: "Sem (după potop)", mt: 2, lxx: 2, sp: 2 },
  { name: "Arpacșad", mt: 35, lxx: 135, sp: 135 },
  { name: "Cainan", mt: null, lxx: 130, sp: null },
  { name: "Șelah", mt: 30, lxx: 130, sp: 130 },
  { name: "Eber", mt: 34, lxx: 134, sp: 134 },
  { name: "Peleg", mt: 30, lxx: 130, sp: 130 },
  { name: "Reu", mt: 32, lxx: 132, sp: 132 },
  { name: "Serug", mt: 30, lxx: 130, sp: 130 },
  { name: "Nahor", mt: 29, lxx: 79, sp: 79 },
  { name: "Terah", mt: 70, lxx: 70, sp: 70 },
];

const yrs = (n: number) => `${n} ${n === 1 ? "an" : n % 100 >= 20 || (n % 100 === 0 && n > 0) ? "de ani" : "ani"}`;
export const years = yrs;

/** Rândul mic de sub nume în desen. */
export function subLine(n: BNode): string {
  if (n.sub) return n.sub;
  if (n.reign) return `a domnit ${n.reign}`;
  if (n.life) return yrs(n.life);
  return n.when ?? "";
}

export const EPOCHS: Epoch[] = [
  {
    id: "adam-noe",
    title: "De la Adam la Noe",
    span: "Geneza 4–5 · cele zece generații dinainte de potop",
    intro: "Biblia începe neamul omenesc cu un singur om, Adam. Din fiii lui, Geneza urmărește două ramuri: a lui Cain, care se depărtează de Dumnezeu, și a lui Set, din care vine Noe. Anii de viață sunt foarte mari, iar Biblia îi notează cu grijă: câți ani avea tatăl când i s-a născut fiul și câți a trăit în total.",
    verse: { text: "Iată cartea neamurilor lui Adam. În ziua când a făcut Dumnezeu pe om, l-a făcut după asemănarea lui Dumnezeu.", ref: "Geneza 5:1" },
    roots: [
      {
        id: "adam", name: "Adam", wife: "Eva", life: 930, main: true, refs: "Geneza 1–5; Luca 3:38",
        note: "Primul om, făcut de Dumnezeu din țărâna pământului. Soției lui i-a pus numele Eva, „căci ea a fost mama tuturor celor vii” (Geneza 3:20). Din ei se trag toate neamurile. Luca își încheie lista cu „Adam, fiul lui Dumnezeu”.",
        kids: [
          {
            id: "cain", name: "Cain", sub: "întâiul născut", refs: "Geneza 4:1–17",
            note: "Întâiul născut al lui Adam. După ce l-a ucis pe Abel, a plecat în țara Nod, la răsărit de Eden, și a zidit o cetate pe care a numit-o după fiul său, Enoh. Biblia nu dă anii de viață pentru ramura lui Cain.",
            kids: [{
              id: "enoh-c", name: "Enoh", sub: "fiul lui Cain", refs: "Geneza 4:17", note: "Nu e același cu Enoh din linia lui Set, cel care „a umblat cu Dumnezeu”.",
              kids: [{
                id: "irad", name: "Irad", refs: "Geneza 4:18",
                kids: [{
                  id: "mehuiael", name: "Mehuiael", refs: "Geneza 4:18",
                  kids: [{
                    id: "metusael", name: "Metușael", refs: "Geneza 4:18",
                    kids: [{
                      id: "lameh-c", name: "Lameh", wife: "Ada și Țila", sub: "din neamul lui Cain", refs: "Geneza 4:18–24",
                      note: "Primul om despre care Biblia spune că și-a luat două neveste. Cântecul lui de răzbunare (Geneza 4:23–24) arată cât de departe ajunsese ramura lui Cain.",
                      kids: [
                        { id: "iabal", name: "Iabal", sub: "din Ada", refs: "Geneza 4:20", note: "Părintele celor care locuiesc în corturi și cresc vite." },
                        { id: "iubal", name: "Iubal", sub: "din Ada", refs: "Geneza 4:21", note: "Părintele celor care cântă cu alăuta și cu cavalul: primul muzicant pomenit în Biblie." },
                        { id: "tubal-cain", name: "Tubal-Cain", sub: "din Țila", refs: "Geneza 4:22", note: "Lucra tot felul de unelte de aramă și de fier: primul meșter fierar pomenit în Biblie." },
                        { id: "naama", name: "Naama", sub: "din Țila", woman: true, refs: "Geneza 4:22", note: "Sora lui Tubal-Cain, una dintre puținele femei numite înainte de potop." },
                      ],
                    }],
                  }],
                }],
              }],
            }],
          },
          { id: "abel", name: "Abel", sub: "ucis de Cain", refs: "Geneza 4:2–10; Evrei 11:4", note: "Păstor de oi. Dumnezeu a primit cu plăcere jertfa lui. Fratele lui, Cain, l-a ucis din pizmă. Despre credința lui, Evrei 11:4 spune: „prin ea vorbește el încă, măcar că este mort”." },
          {
            id: "set", name: "Set", life: 912, main: true, refs: "Geneza 4:25–5:8",
            note: "Născut după moartea lui Abel. Eva a spus: „Dumnezeu mi-a dat o altă sămânță în locul lui Abel” (Geneza 4:25). Prin el merge mai departe linia care duce la Noe și, mai târziu, la Hristos.",
            kids: [{
              id: "enos", name: "Enos", life: 905, main: true, refs: "Geneza 4:26; 5:6–11", note: "În zilele lui „au început oamenii să cheme Numele Domnului” (Geneza 4:26).",
              kids: [{
                id: "cainan", name: "Cainan", life: 910, main: true, refs: "Geneza 5:9–14",
                kids: [{
                  id: "mahalaleel", name: "Mahalaleel", alt: "Maleleel (Luca 3:37)", life: 895, main: true, refs: "Geneza 5:12–17",
                  kids: [{
                    id: "iared", name: "Iared", life: 962, main: true, refs: "Geneza 5:15–20",
                    kids: [{
                      id: "enoh", name: "Enoh", life: 365, main: true, refs: "Geneza 5:18–24; Evrei 11:5; Iuda 14",
                      note: "„Enoh a umblat cu Dumnezeu, apoi nu s-a mai văzut, pentru că l-a luat Dumnezeu” (Geneza 5:24). N-a murit ca ceilalți: după 365 de ani a fost luat la Dumnezeu. Epistola lui Iuda îl numește „al șaptelea patriarh de la Adam”.",
                      kids: [{
                        id: "metusala", name: "Metusala", alt: "Matusala (Luca 3:37)", life: 969, main: true, refs: "Geneza 5:21–27",
                        note: "Omul cu cea mai lungă viață din Biblie: 969 de ani. Dacă socotești anii din textul ebraic, a murit chiar în anul potopului.",
                        kids: [{
                          id: "lameh", name: "Lameh", life: 777, main: true, refs: "Geneza 5:25–31",
                          note: "Nu e Lameh din neamul lui Cain. Când i s-a născut Noe, a spus: „Acesta ne va mângâia pentru osteneala și truda mâinilor noastre” (Geneza 5:29).",
                          kids: [{
                            id: "noe", name: "Noe", life: 950, main: true, refs: "Geneza 5:28–9:29",
                            note: "Singurul om neprihănit din vremea lui. A făcut corabia și a scăpat din potop cu soția, cei trei fii și nurorile lui, opt suflete în total. Potopul a venit când el avea 600 de ani, iar după potop a mai trăit 350 de ani (Geneza 9:28–29).",
                            kids: [
                              { id: "sem-0", name: "Sem", life: 600, main: true, refs: "Geneza 5:32; 11:10–11", note: "Linia continuă în arborele următor, „De la Noe la Avraam”." },
                              { id: "ham-0", name: "Ham", refs: "Geneza 5:32; 10:6", note: "Fiii lui sunt în arborele următor." },
                              { id: "iafet-0", name: "Iafet", refs: "Geneza 5:32; 10:2", note: "Fiii lui sunt în arborele următor." },
                            ],
                          }],
                        }],
                      }],
                    }],
                  }],
                }],
              }],
            }],
          },
        ],
      },
    ],
  },
  {
    id: "noe-avraam",
    title: "De la Noe la Avraam",
    span: "Geneza 10–11 · popoarele și linia lui Sem",
    intro: "După potop, tot pământul se umple din cei trei fii ai lui Noe. Geneza 10 este o hartă a popoarelor vechi, numite după strămoșii lor. Apoi Geneza 11 urmează doar linia lui Sem, generație după generație, până la Avram. Anii de viață scad repede: de la 600 de ani la Sem până la 148 la Nahor.",
    verse: { text: "Dar Noe a căpătat milă înaintea Domnului.", ref: "Geneza 6:8" },
    roots: [
      {
        id: "noe-2", name: "Noe", life: 950, main: true, refs: "Geneza 9:18–10:32",
        note: "Din cei trei fii ai lui Noe s-a umplut tot pământul (Geneza 9:19).",
        kids: [
          {
            id: "iafet", name: "Iafet", refs: "Geneza 10:2–5", note: "Din fiii lui, spune Geneza, s-au împărțit popoarele din ostroave. Mulți îi leagă de popoarele de la miazănoapte și de la apus: Iavan e numele vechi al grecilor, iar Madai al mezilor.",
            kids: [
              { id: "gomer", name: "Gomer", refs: "Geneza 10:2–3" }, { id: "magog", name: "Magog", refs: "Geneza 10:2" },
              { id: "madai", name: "Madai", refs: "Geneza 10:2" }, { id: "iavan", name: "Iavan", refs: "Geneza 10:2–4" },
              { id: "tubal", name: "Tubal", refs: "Geneza 10:2" }, { id: "mesec", name: "Meșec", refs: "Geneza 10:2" },
              { id: "tiras", name: "Tiras", refs: "Geneza 10:2" },
            ],
          },
          {
            id: "ham", name: "Ham", refs: "Geneza 9:22–27; 10:6–20", note: "Din fiii lui se trag, după Geneza 10, popoarele din Egipt (Mițraim), din Canaan și de la miazăzi.",
            kids: [
              { id: "cus", name: "Cuș", refs: "Geneza 10:6–8", kids: [{ id: "nimrod", name: "Nimrod", refs: "Geneza 10:8–12", note: "„Un viteaz vânător înaintea Domnului” (Geneza 10:9). Începutul împărăției lui a fost Babel, apoi a zidit Ninive." }] },
              { id: "mitraim", name: "Mițraim", sub: "Egiptul", refs: "Geneza 10:6, 13–14", note: "Mițraim este numele ebraic al Egiptului." },
              { id: "put", name: "Put", refs: "Geneza 10:6" },
              { id: "canaan", name: "Canaan", refs: "Geneza 10:6, 15–19", note: "Strămoșul canaaniților, care locuiau în țara făgăduită lui Avraam." },
            ],
          },
          {
            id: "sem", name: "Sem", life: 600, main: true, refs: "Geneza 10:21–31; 11:10–11",
            note: "Din numele lui vine cuvântul „semit”. A trăit 600 de ani; după numărătoarea textului ebraic, a trăit mai mult decât Avraam, care era urmașul lui în a zecea generație.",
            kids: [
              { id: "elam", name: "Elam", refs: "Geneza 10:22" },
              { id: "asur", name: "Asur", sub: "Asiria", refs: "Geneza 10:22", note: "De numele lui e legată Asiria." },
              {
                id: "arpacsad", name: "Arpacșad", alt: "Arfaxad (Luca 3:36)", life: 438, main: true, refs: "Geneza 11:10–13",
                note: "Născut la doi ani după potop. În Septuaginta și în Luca 3:36, între el și Șelah mai este un om, Cainan.",
                kids: [{
                  id: "selah", name: "Șelah", alt: "Sala (Luca 3:35)", life: 433, main: true, refs: "Geneza 11:12–15",
                  kids: [{
                    id: "eber", name: "Eber", life: 464, main: true, refs: "Geneza 10:21–25; 11:14–17",
                    note: "Mulți leagă de numele lui cuvântul „evreu”. Sem e numit „tatăl tuturor fiilor lui Eber” (Geneza 10:21).",
                    kids: [
                      {
                        id: "peleg", name: "Peleg", alt: "Falec (Luca 3:35)", life: 239, main: true, refs: "Geneza 10:25; 11:16–19",
                        note: "Geneza 10:25 spune că a fost numit așa „pentru că pe vremea lui s-a împărțit pământul”. Numele lui înseamnă „împărțire”.",
                        kids: [{
                          id: "reu", name: "Reu", alt: "Ragau (Luca 3:35)", life: 239, main: true, refs: "Geneza 11:18–21",
                          kids: [{
                            id: "serug", name: "Serug", alt: "Seruh (Luca 3:35)", life: 230, main: true, refs: "Geneza 11:20–23",
                            kids: [{
                              id: "nahor", name: "Nahor", life: 148, main: true, refs: "Geneza 11:22–25",
                              kids: [{
                                id: "terah-2", name: "Terah", alt: "Tara (Luca 3:34)", life: 205, main: true, refs: "Geneza 11:24–32",
                                note: "Tatăl lui Avram. Fiii lui și linia mai departe sunt în arborele „Avraam, Isaac și Iacov”.",
                              }],
                            }],
                          }],
                        }],
                      },
                      { id: "ioctan", name: "Ioctan", refs: "Geneza 10:25–30", note: "Fratele lui Peleg. Din cei 13 fii ai lui se trag mai multe neamuri arabe de la miazăzi." },
                    ],
                  }],
                }],
              },
              { id: "lud", name: "Lud", refs: "Geneza 10:22" },
              { id: "aram", name: "Aram", sub: "arameii", refs: "Geneza 10:22–23", note: "Strămoșul arameilor. Limba aramaică, pe care o vorbea Domnul Isus, poartă numele lor." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "avraam-iacov",
    title: "Avraam, Isaac și Iacov",
    span: "Geneza 11–50 · părinții poporului Israel",
    intro: "Cu Avraam, Biblia trece de la istoria tuturor popoarelor la istoria unei familii. Dumnezeu îl cheamă să-și lase țara și îi promite că prin urmașul lui vor fi binecuvântate toate familiile pământului. Din Avraam vin Isaac, apoi Iacov, numit și Israel, și cei 12 fii ai lui Iacov, părinții celor 12 seminții.",
    verse: { text: "și toate familiile pământului vor fi binecuvântate în tine.", ref: "Geneza 12:3" },
    roots: [
      {
        id: "terah", name: "Terah", life: 205, main: true, refs: "Geneza 11:24–32",
        note: "A plecat cu Avram, Sarai și Lot din Ur al Haldeilor spre țara Canaan, dar s-a oprit în Haran și a murit acolo, la 205 ani. Geneza 11:26 spune că avea 70 de ani când i s-au născut cei trei fii; dar Faptele 7:4 și Geneza 12:4 arată că Avram a plecat din Haran la 75 de ani, după moartea tatălui său, de unde mulți socotesc că Avram s-a născut când Terah avea 130 de ani. Aici rămânem la cifrele scrise, dar sub semnul acesta de întrebare.",
        kids: [
          {
            id: "avraam", name: "Avraam", alt: "Avram, până la Geneza 17:5", wife: "Sara", life: 175, main: true, when: "c. 2166–1991 î.Hr.*", refs: "Geneza 11:26–25:10; Romani 4; Evrei 11:8–19",
            note: "Chemat de Dumnezeu să plece din țara lui spre o țară pe care nu o cunoștea. „Avram a crezut pe Domnul, și Domnul i-a socotit lucrul acesta ca neprihănire” (Geneza 15:6). Numele i-a fost schimbat din Avram în Avraam, „tatăl multor neamuri”. *Anii î.Hr. vin din socoteala care ia literal cifrele din 1 Împărați 6:1 și Exodul 12:40; mulți istorici îl pun mai târziu.",
            kids: [
              { id: "ismael", name: "Ismael", sub: "din Agar · 137 de ani", life: 137, refs: "Geneza 16; 21:9–21; 25:12–18", note: "Fiul lui Avraam cu Agar, roaba egipteancă a Sarei. Dumnezeu a promis că va face și din el un neam mare; a avut 12 fii, căpetenii de seminții." },
              {
                id: "isaac", name: "Isaac", wife: "Rebeca", life: 180, main: true, refs: "Geneza 21–35",
                note: "Fiul făgăduinței, născut când Avraam avea 100 de ani și Sara 90. Avraam a fost gata să-l aducă jertfă pe muntele Moria, iar Dumnezeu a dat un berbec în locul lui (Geneza 22).",
                kids: [
                  { id: "esau", name: "Esau", sub: "Edom", refs: "Geneza 25:25–34; 36", note: "Geamănul mai mare al lui Iacov. Și-a vândut dreptul de întâi născut pentru o mâncare de linte. Din el se trag edomiții (Geneza 36)." },
                  {
                    id: "iacov", name: "Iacov", alt: "Israel (Geneza 32:28)", wife: "Lea și Rahela", life: 147, main: true, refs: "Geneza 25–50",
                    note: "După lupta de la Peniel, Dumnezeu i-a schimbat numele în Israel. Cei 12 fii ai lui sunt părinții celor 12 seminții. La bătrânețe s-a mutat cu toată familia în Egipt, la fiul său Iosif.",
                    kids: [
                      { id: "ruben", name: "Ruben", sub: "din Lea", refs: "Geneza 29:32; 49:3–4", note: "Întâiul născut al lui Iacov." },
                      { id: "simeon", name: "Simeon", sub: "din Lea", refs: "Geneza 29:33" },
                      { id: "levi-3", name: "Levi", sub: "din Lea · 137 de ani", life: 137, refs: "Geneza 29:34; Exodul 6:16", note: "Seminția preoților și a slujitorilor Cortului. Urmașii lui sunt în arborele următor." },
                      { id: "iuda-3", name: "Iuda", sub: "din Lea", main: true, refs: "Geneza 29:35; 49:8–12", note: "Iacov a spus că toiagul de domnie nu se va depărta din Iuda (Geneza 49:10). Din seminția lui au venit David și Domnul Isus. Linia continuă în arborele următor." },
                      { id: "dan", name: "Dan", sub: "din Bilha", refs: "Geneza 30:6" },
                      { id: "neftali", name: "Neftali", sub: "din Bilha", refs: "Geneza 30:8" },
                      { id: "gad", name: "Gad", sub: "din Zilpa", refs: "Geneza 30:11" },
                      { id: "aser", name: "Așer", sub: "din Zilpa", refs: "Geneza 30:13" },
                      { id: "isahar", name: "Isahar", sub: "din Lea", refs: "Geneza 30:18" },
                      { id: "zabulon", name: "Zabulon", sub: "din Lea", refs: "Geneza 30:20" },
                      { id: "dina", name: "Dina", sub: "din Lea", woman: true, refs: "Geneza 30:21; 34", note: "Singura fiică a lui Iacov pomenită pe nume." },
                      {
                        id: "iosif-eg", name: "Iosif", sub: "din Rahela · 110 ani", life: 110, refs: "Geneza 37–50",
                        note: "Vândut de frații lui ca rob în Egipt, a ajuns al doilea om din țară după faraon și și-a scăpat familia de foamete. „Voi, negreșit, v-ați gândit să-mi faceți rău, dar Dumnezeu a schimbat răul în bine” (Geneza 50:20).",
                        kids: [
                          { id: "manase", name: "Manase", refs: "Geneza 41:51; 48:5", note: "Iacov i-a luat pe cei doi fii ai lui Iosif ca pe fiii săi, de aceea Manase și Efraim au devenit seminții." },
                          { id: "efraim", name: "Efraim", refs: "Geneza 41:52; 48:5–20", note: "Deși mai mic, Iacov l-a binecuvântat înaintea lui Manase. Din seminția lui a venit Iosua." },
                        ],
                      },
                      { id: "beniamin", name: "Beniamin", sub: "din Rahela", refs: "Geneza 35:16–18", note: "Mezinul. Rahela a murit când l-a născut. Din seminția lui au venit împăratul Saul și apostolul Pavel (Filipeni 3:5)." },
                    ],
                  },
                ],
              },
            ],
          },
          { id: "nahor-frate", name: "Nahor", wife: "Milca", refs: "Geneza 11:26–29; 22:20–23", note: "Fratele lui Avram. Nepoata lui, Rebeca, a devenit soția lui Isaac.", kids: [{ id: "betuel", name: "Betuel", refs: "Geneza 22:22–23; 24", kids: [
            { id: "rebeca", name: "Rebeca", woman: true, sub: "soția lui Isaac", refs: "Geneza 24; 25:20", note: "A plecat de bunăvoie din casa tatălui ei să devină soția lui Isaac, vărul ei. Mama lui Esau și a lui Iacov." },
            { id: "laban", name: "Laban", refs: "Geneza 24:29; 29", note: "Fratele Rebecăi, tatăl Leei și al Rahelei." },
          ] }] },
          { id: "haran", name: "Haran", refs: "Geneza 11:27–28", note: "A murit în Ur, înaintea tatălui său.", kids: [{ id: "lot", name: "Lot", refs: "Geneza 11:27–19:38", note: "Nepotul lui Avraam, care a mers cu el în Canaan și s-a așezat apoi în Sodoma. A scăpat când cetatea a fost nimicită." }] },
        ],
      },
    ],
  },
  {
    id: "iacov-david",
    title: "De la Iacov la David",
    span: "Exodul · Numeri · Rut · Iuda, Levi și Iosif",
    intro: "Familia lui Iacov crește în Egipt până devine un popor. Arborele acesta urmărește trei dintre fii: Levi, din care vin Moise și Aaron; Iosif, din care vine Iosua; și Iuda, din care, prin Boaz și Rut, se naște împăratul David. E vremea robiei din Egipt, a ieșirii, a Legii date la Sinai și a judecătorilor.",
    verse: { text: "Toiagul de domnie nu se va depărta din Iuda, nici toiagul de cârmuire dintre picioarele lui…", ref: "Geneza 49:10" },
    roots: [
      {
        id: "iacov-4", name: "Iacov", alt: "Israel", life: 147, main: true, refs: "Geneza 49", note: "Toți cei 12 fii sunt în arborele dinainte; aici urmărim trei dintre ei.",
        kids: [
          {
            id: "levi", name: "Levi", life: 137, refs: "Exodul 6:16–25",
            kids: [
              { id: "gherson", name: "Gherșon", refs: "Exodul 6:16–17" },
              {
                id: "chehat", name: "Chehat", life: 133, refs: "Exodul 6:18",
                kids: [{
                  id: "amram", name: "Amram", wife: "Iochebed", life: 137, refs: "Exodul 6:20",
                  kids: [
                    { id: "maria-p", name: "Maria", sub: "prorocița", woman: true, refs: "Exodul 2:4–8; 15:20–21; Numeri 26:59", note: "Sora lui Moise și a lui Aaron. A vegheat coșulețul lui Moise pe Nil și a cântat după trecerea Mării Roșii." },
                    {
                      id: "aaron", name: "Aaron", wife: "Elișeba", life: 123, refs: "Exodul 4–40; Numeri 20; 33:39",
                      note: "Fratele lui Moise și primul mare preot al lui Israel. Soția lui, Elișeba, era sora lui Nahșon din seminția lui Iuda, deci familia preoților și familia din care avea să vină David s-au înrudit de la început.",
                      kids: [
                        { id: "nadab", name: "Nadab", refs: "Levitic 10:1–2", note: "El și fratele lui, Abihu, au adus înaintea Domnului un foc pe care El nu-l poruncise și au murit (Levitic 10:1–2)." },
                        { id: "abihu", name: "Abihu", refs: "Levitic 10:1–2" },
                        { id: "eleazar-p", name: "Eleazar", sub: "mare preot", refs: "Numeri 20:25–28", note: "A urmat ca mare preot după moartea lui Aaron.", kids: [{ id: "fineas", name: "Fineas", refs: "Numeri 25:7–13", note: "Nepotul lui Aaron. Pentru râvna lui, Dumnezeu i-a făgăduit lui și urmașilor lui o preoție veșnică (Numeri 25:13)." }] },
                        { id: "itamar", name: "Itamar", refs: "Exodul 6:23; 38:21" },
                      ],
                    },
                    {
                      id: "moise", name: "Moise", wife: "Sefora", life: 120, refs: "Exodul 2–Deuteronomul 34",
                      note: "Scăpat ca prunc pe Nil și crescut la curtea faraonului. Dumnezeu l-a chemat din rugul aprins să scoată poporul din Egipt. La Sinai a primit Legea. A murit la 120 de ani pe muntele Nebo, „vederea nu-i slăbise și puterea nu-i trecuse” (Deuteronomul 34:7).",
                      kids: [
                        { id: "gersom", name: "Gherșom", refs: "Exodul 2:22; 18:3" },
                        { id: "eliezer-m", name: "Eliezer", refs: "Exodul 18:4" },
                      ],
                    },
                  ],
                }],
              },
              { id: "merari", name: "Merari", refs: "Exodul 6:16, 19" },
            ],
          },
          {
            id: "iuda", name: "Iuda", wife: "Tamar", main: true, refs: "Geneza 38; Matei 1:3",
            note: "Povestea lui cu Tamar, nora lui, e în Geneza 38. Matei o pomenește pe Tamar în neamul lui Hristos, una dintre cele patru femei din lista lui, alături de Rahav, Rut și „văduva lui Urie”.",
            kids: [
              {
                id: "peret", name: "Pereț", alt: "Fares (Matei 1:3)", main: true, refs: "Geneza 38:29; Rut 4:18",
                kids: [{
                  id: "hetron", name: "Hețron", alt: "Esrom (Matei 1:3)", main: true, refs: "Geneza 46:12; Rut 4:18",
                  note: "A coborât în Egipt cu familia lui Iacov (Geneza 46:12). Între el și Nahșon, care era în pustie la ieșire, Biblia numește doar doi oameni, deși Israel a stat mult în Egipt; mulți cred că lista sare, ca alte genealogii, peste câteva generații.",
                  kids: [{
                    id: "ram", name: "Ram", alt: "Aram (Matei 1:3)", main: true, refs: "Rut 4:19",
                    kids: [{
                      id: "aminadab", name: "Aminadab", main: true, refs: "Rut 4:19; Exodul 6:23",
                      kids: [{
                        id: "nahson", name: "Nahșon", alt: "Naason (Matei 1:4)", main: true, refs: "Numeri 1:7; 7:12; Rut 4:20",
                        note: "Căpetenia seminției lui Iuda în pustie, primul care și-a adus darul la sfințirea altarului (Numeri 7:12). Sora lui, Elișeba, era soția lui Aaron.",
                        kids: [{
                          id: "salmon", name: "Salmon", wife: "Rahav", main: true, refs: "Rut 4:20–21; Matei 1:5",
                          note: "Matei spune că Boaz s-a născut „din Rahav”: femeia din Ierihon care i-a ascuns pe iscoadele lui Israel (Iosua 2) și a fost scăpată cu toată casa ei.",
                          kids: [{
                            id: "boaz", name: "Boaz", wife: "Rut", main: true, refs: "Rut 2–4; Matei 1:5",
                            note: "Om cu stare din Betleem, care a răscumpărat moștenirea lui Elimelec și s-a căsătorit cu Rut, moabita. Rut, o străină, a spus Naomei: „Poporul tău va fi poporul meu și Dumnezeul tău va fi Dumnezeul meu” (Rut 1:16).",
                            kids: [{
                              id: "obed", name: "Obed", main: true, refs: "Rut 4:13–22",
                              kids: [{
                                id: "isai", name: "Isai", alt: "Iese (Matei 1:5)", main: true, refs: "Rut 4:22; 1 Samuel 16",
                                note: "Din Betleem. Samuel a venit la el să ungă împărat pe unul dintre fiii lui și l-a ales pe cel mai mic, David.",
                                kids: [{
                                  id: "david-4", name: "David", life: 70, main: true, when: "c. 1040–970 î.Hr.", refs: "1 Samuel 16–1 Împărați 2",
                                  note: "Linia continuă în arborele „De la David la robia Babilonului”.",
                                }],
                              }],
                            }],
                          }],
                        }],
                      }],
                    }],
                  }],
                }],
              },
              { id: "zerah", name: "Zerah", alt: "Zara (Matei 1:3)", sub: "geamănul lui Pereț", refs: "Geneza 38:30" },
            ],
          },
          {
            id: "iosif-4", name: "Iosif", life: 110, refs: "Geneza 37–50",
            kids: [{
              id: "efraim-4", name: "Efraim", refs: "Geneza 48; 1 Cronici 7:20–27",
              kids: [{
                id: "efraim-gap", name: "… câteva generații", gap: true, refs: "1 Cronici 7:20–27", note: "1 Cronici 7 numește mai mulți urmași ai lui Efraim până la Nun, tatăl lui Iosua.",
                kids: [{
                  id: "nun", name: "Nun", refs: "1 Cronici 7:27",
                  kids: [{ id: "iosua", name: "Iosua", life: 110, refs: "Numeri 13:8, 16; Iosua 1–24", note: "Slujitorul lui Moise. După moartea lui Moise a dus poporul peste Iordan, în țara făgăduită. A murit la 110 ani. „Cât despre mine, eu și casa mea vom sluji Domnului” (Iosua 24:15)." }],
                }],
              }],
            }],
          },
        ],
      },
    ],
  },
  {
    id: "david-robie",
    title: "De la David la robia Babilonului",
    span: "Samuel · Împărați · Cronici · Matei 1:6–11 · Luca 3:27–31",
    intro: "Dumnezeu îi promite lui David că din casa lui va veni un împărat a cărui împărăție nu se va sfârși. De aici, Matei și Luca merg pe drumuri diferite: Matei urmează pe împărații lui Iuda, prin Solomon; Luca urmează un alt fiu al lui David, Natan. Împărații pe care Matei nu îi numește sunt desenați punctat.",
    verse: { text: "Apoi, o Odraslă va ieși din tulpina lui Isai și un Vlăstar va da din rădăcinile lui.", ref: "Isaia 11:1" },
    roots: [
      {
        id: "david", name: "David", wife: "Bat-Șeba și altele", life: 70, reign: "40 de ani", when: "c. 1010–970 î.Hr.", main: true, refs: "1 Samuel 16–1 Împărați 2; 1 Cronici 3; Matei 1:6",
        note: "Păstor la Betleem, uns împărat de Samuel, biruitorul lui Goliat, poetul Psalmilor. A domnit 7 ani la Hebron și 33 la Ierusalim (2 Samuel 5:4–5). Dumnezeu i-a făgăduit că scaunul lui de domnie va fi întărit pe vecie (2 Samuel 7:16). De aceea Domnul Isus e numit „Fiul lui David”.",
        kids: [
          { id: "amnon", name: "Amnon", refs: "2 Samuel 3:2; 13", note: "Întâiul născut al lui David, ucis de oamenii lui Absalom." },
          { id: "absalom", name: "Absalom", refs: "2 Samuel 13–18", note: "S-a răsculat împotriva tatălui său și a murit în luptă. David a plâns: „Fiul meu Absalom! … Cum n-am murit eu în locul tău!”" },
          { id: "adonia", name: "Adonia", refs: "1 Împărați 1–2", note: "A încercat să ia domnia înaintea lui Solomon." },
          {
            id: "natan", name: "Natan", luke: true, sub: "linia din Luca", refs: "2 Samuel 5:14; 1 Cronici 3:5; Luca 3:31",
            note: "Fiu al lui David și al lui Bat-Șeba (1 Cronici 3:5), fratele lui Solomon. Luca 3 urcă de la Iosif până la Adam prin el, nu prin Solomon. Numele de aici până la Neri se cunosc doar din Luca.",
            kids: [{ id: "matata", name: "Matata", luke: true, refs: "Luca 3:31", kids: [{ id: "mena", name: "Mena", luke: true, refs: "Luca 3:31", kids: [{ id: "melea", name: "Melea", luke: true, refs: "Luca 3:31", kids: [{ id: "eliachim-l", name: "Eliachim", luke: true, refs: "Luca 3:30", kids: [{ id: "ionam", name: "Ionam", luke: true, refs: "Luca 3:30", kids: [{ id: "iosif-l1", name: "Iosif", luke: true, refs: "Luca 3:30", kids: [{ id: "iuda-l", name: "Iuda", luke: true, refs: "Luca 3:30", kids: [{ id: "simeon-l", name: "Simeon", luke: true, refs: "Luca 3:30", kids: [{ id: "levi-l1", name: "Levi", luke: true, refs: "Luca 3:29", kids: [{ id: "matat-l1", name: "Matat", luke: true, refs: "Luca 3:29", kids: [{ id: "iorim", name: "Iorim", luke: true, refs: "Luca 3:29", kids: [{ id: "eliezer-l", name: "Eliezer", luke: true, refs: "Luca 3:29", kids: [{ id: "isus-l", name: "Isus", luke: true, sub: "alt Isus", refs: "Luca 3:29", note: "Un strămoș din linia lui Luca, cu numele Isus (Iosua), foarte des pe atunci.", kids: [{ id: "er", name: "Er", luke: true, refs: "Luca 3:28", kids: [{ id: "elmadam", name: "Elmadam", luke: true, refs: "Luca 3:28", kids: [{ id: "cosam", name: "Cosam", luke: true, refs: "Luca 3:28", kids: [{ id: "adi", name: "Adi", luke: true, refs: "Luca 3:28", kids: [{ id: "melhi-l1", name: "Melhi", luke: true, refs: "Luca 3:28", kids: [{ id: "neri-5", name: "Neri", luke: true, refs: "Luca 3:27", note: "Luca îl numește tatăl lui Salatiel. Linia continuă în ultimul arbore." }] }] }] }] }] }] }] }] }] }] }] }] }] }] }] }] }] }] }],
          },
          {
            id: "solomon", name: "Solomon", reign: "40 de ani", when: "c. 970–931 î.Hr.", main: true, refs: "1 Împărați 1–11; Matei 1:6",
            note: "Fiul lui David și al lui Bat-Șeba, pe care Matei o numește „văduva lui Urie”. A cerut de la Dumnezeu înțelepciune și a zidit Templul din Ierusalim, în al patrulea an al domniei lui, la 480 de ani după ieșirea din Egipt (1 Împărați 6:1).",
            kids: [{
              id: "roboam", name: "Roboam", reign: "17 ani", when: "c. 931–913 î.Hr.", main: true, refs: "1 Împărați 12; 14:21–31",
              note: "Pentru că n-a ascultat de sfatul bătrânilor, zece seminții s-au rupt și au făcut împărăția lui Israel, la miazănoapte. Lui i-a rămas Iuda, cu Ierusalimul.",
              kids: [{
                id: "abia", name: "Abia", alt: "Abiam (1 Împărați 15)", reign: "3 ani", when: "c. 913–911 î.Hr.", main: true, refs: "1 Împărați 15:1–8; 2 Cronici 13",
                kids: [{
                  id: "asa", name: "Asa", reign: "41 de ani", when: "c. 911–870 î.Hr.", main: true, refs: "1 Împărați 15:9–24", note: "„Asa a făcut ce este plăcut înaintea Domnului, ca David, tatăl său” (1 Împărați 15:11). A scos idolii din țară.",
                  kids: [{
                    id: "iosafat", name: "Iosafat", reign: "25 de ani", when: "c. 873–848 î.Hr.", main: true, refs: "1 Împărați 22:41–50; 2 Cronici 17–20", note: "A trimis oameni prin cetățile lui Iuda să învețe poporul din cartea Legii (2 Cronici 17:9).",
                    kids: [{
                      id: "ioram", name: "Ioram", reign: "8 ani", when: "c. 853–841 î.Hr.", main: true, refs: "2 Împărați 8:16–24", note: "S-a căsătorit cu Atalia, fiica lui Ahab, și a umblat pe căile împăraților lui Israel.",
                      kids: [{
                        id: "ahazia", name: "Ahazia", reign: "1 an", when: "c. 841 î.Hr.", main: true, omitted: true, refs: "2 Împărați 8:25–9:29",
                        note: "Matei nu-l numește: de la Ioram trece direct la Ozia (Matei 1:8). După moartea lui, mama lui, Atalia, a omorât tot neamul împărătesc și a domnit șase ani; doar pruncul Ioas a fost ascuns și scăpat (2 Împărați 11).",
                        kids: [{
                          id: "ioas", name: "Ioas", reign: "40 de ani", when: "c. 835–796 î.Hr.", main: true, omitted: true, refs: "2 Împărați 11–12", note: "Ascuns în Templu ca prunc și pus împărat la 7 ani. Matei nu-l numește.",
                          kids: [{
                            id: "amatia", name: "Amația", reign: "29 de ani", when: "c. 796–767 î.Hr.", main: true, omitted: true, refs: "2 Împărați 14:1–20", note: "Matei nu-l numește. Așa ajunge Matei la trei grupe de câte 14 generații (Matei 1:17).",
                            kids: [{
                              id: "ozia", name: "Ozia", alt: "Azaria (2 Împărați 15)", reign: "52 de ani", when: "c. 792–740 î.Hr.", main: true, refs: "2 Împărați 15:1–7; 2 Cronici 26; Matei 1:8",
                              note: "A domnit mult și cu putere, dar s-a îngâmfat și a intrat să tămâieze în Templu, lucru îngăduit doar preoților; a rămas lepros până la moarte. „În anul morții împăratului Ozia” l-a chemat Dumnezeu pe Isaia (Isaia 6:1).",
                              kids: [{
                                id: "iotam", name: "Iotam", alt: "Ioatam (Matei 1:9)", reign: "16 ani", when: "c. 750–732 î.Hr.", main: true, refs: "2 Împărați 15:32–38",
                                kids: [{
                                  id: "ahaz", name: "Ahaz", reign: "16 ani", when: "c. 735–715 î.Hr.", main: true, refs: "2 Împărați 16; Isaia 7", note: "Lui i-a spus Isaia: „Iată, fecioara va rămâne însărcinată, va naște un fiu și-i va pune numele Emanuel” (Isaia 7:14), cuvânt pe care Matei îl leagă de nașterea Domnului Isus.",
                                  kids: [{
                                    id: "ezechia", name: "Ezechia", reign: "29 de ani", when: "c. 715–686 î.Hr.", main: true, refs: "2 Împărați 18–20; Isaia 36–39",
                                    note: "Unul dintre cei mai credincioși împărați. Când asirienii lui Sanherib au împresurat Ierusalimul, s-a rugat, iar cetatea a fost scăpată. Bolnav de moarte, s-a rugat iar, și Dumnezeu i-a mai adăugat 15 ani de viață.",
                                    kids: [{
                                      id: "manase-r", name: "Manase", reign: "55 de ani", when: "c. 697–642 î.Hr.", main: true, refs: "2 Împărați 21:1–18; 2 Cronici 33",
                                      note: "Cea mai lungă domnie din Iuda și una dintre cele mai rele. Dus legat la Babilon, s-a smerit și s-a rugat, iar Dumnezeu l-a adus înapoi (2 Cronici 33:12–13).",
                                      kids: [{
                                        id: "amon", name: "Amon", reign: "2 ani", when: "c. 642–640 î.Hr.", main: true, refs: "2 Împărați 21:19–26",
                                        kids: [{
                                          id: "iosia", name: "Iosia", reign: "31 de ani", when: "c. 640–609 î.Hr.", main: true, refs: "2 Împărați 22–23",
                                          note: "Împărat de la 8 ani. În vremea lui s-a găsit în Templu cartea Legii; a citit-o înaintea poporului și a curățit țara de idoli. A murit în luptă la Meghido.",
                                          kids: [
                                            { id: "ioahaz", name: "Ioahaz", alt: "Șalum (1 Cronici 3:15)", reign: "3 luni", when: "609 î.Hr.", refs: "2 Împărați 23:31–34", note: "Faraonul Neco l-a dus în Egipt." },
                                            {
                                              id: "ioiachim", name: "Ioiachim", reign: "11 ani", when: "c. 609–598 î.Hr.", main: true, omitted: true, refs: "2 Împărați 23:34–24:6; Ieremia 36",
                                              note: "Matei nu-l numește (scrie „Iosia a născut pe Iehonia și pe frații lui”). A tăiat cu briceagul și a ars în foc sulul cu proorociile lui Ieremia (Ieremia 36).",
                                              kids: [{
                                                id: "iehonia-5", name: "Iehonia", alt: "Ieconia (1 Cronici 3:16)", reign: "3 luni", when: "598–597 î.Hr.", main: true, refs: "2 Împărați 24:8–16; Matei 1:11–12",
                                                note: "Nabucodonosor l-a dus în robie la Babilon, cu mii de oameni din Ierusalim. Linia continuă în ultimul arbore.",
                                              }],
                                            },
                                            { id: "zedechia", name: "Zedechia", reign: "11 ani", when: "597–586 î.Hr.", refs: "2 Împărați 24:17–25:7; Ieremia 52", note: "Ultimul împărat al lui Iuda. După ce s-a răsculat împotriva Babilonului, Ierusalimul și Templul au fost distruse (în 586 î.Hr.; unii socotesc 587)." },
                                          ],
                                        }],
                                      }],
                                    }],
                                  }],
                                }],
                              }],
                            }],
                          }],
                        }],
                      }],
                    }],
                  }],
                }],
              }],
            }],
          },
        ],
      },
    ],
  },
  {
    id: "robie-hristos",
    title: "De la robie la Hristos",
    span: "Ezra · Hagai · Matei 1:12–16 · Luca 3:23–27",
    intro: "După 70 de ani de robie, iudeii se întorc din Babilon și rezidesc Templul, conduși de Zorobabel. Apoi Vechiul Testament tace aproape patru sute de ani. Cele două liste, din Matei și din Luca, coboară separat până la Iosif, bărbatul Mariei, și ajung la Domnul Isus.",
    verse: { text: "Dar când a venit împlinirea vremii, Dumnezeu a trimis pe Fiul Său, născut din femeie, născut sub Lege,", ref: "Galateni 4:4" },
    roots: [
      {
        id: "neri", name: "Neri", luke: true, refs: "Luca 3:27", note: "Linia lui Luca, care vine de la Natan, fiul lui David.",
        kids: [{
          id: "salatiel-l", name: "Salatiel", luke: true, sub: "după Luca", refs: "Luca 3:27", note: "Luca are și el un Salatiel și un Zorobabel. Mulți cred că sunt aceiași oameni ca în Matei; alții, că sunt alți oameni cu aceleași nume.",
          kids: [{
            id: "zorobabel-l", name: "Zorobabel", luke: true, sub: "după Luca", refs: "Luca 3:27",
            kids: [{ id: "resa", name: "Resa", luke: true, refs: "Luca 3:27", kids: [{ id: "ioanan", name: "Ioanan", luke: true, refs: "Luca 3:27", kids: [{ id: "ioda", name: "Ioda", luke: true, refs: "Luca 3:26", kids: [{ id: "ioseh", name: "Ioseh", luke: true, refs: "Luca 3:26", kids: [{ id: "semei", name: "Semei", luke: true, refs: "Luca 3:26", kids: [{ id: "matatia-1", name: "Matatia", luke: true, refs: "Luca 3:26", kids: [{ id: "maat", name: "Maat", luke: true, refs: "Luca 3:26", kids: [{ id: "nagai", name: "Nagai", luke: true, refs: "Luca 3:25", kids: [{ id: "esli", name: "Esli", luke: true, refs: "Luca 3:25", kids: [{ id: "naum", name: "Naum", luke: true, refs: "Luca 3:25", kids: [{ id: "amos", name: "Amos", luke: true, refs: "Luca 3:25", kids: [{ id: "matatia-2", name: "Matatia", luke: true, refs: "Luca 3:25", kids: [{ id: "iosif-l2", name: "Iosif", luke: true, refs: "Luca 3:24", kids: [{ id: "ianai", name: "Ianai", luke: true, refs: "Luca 3:24", kids: [{ id: "melhi-l2", name: "Melhi", luke: true, refs: "Luca 3:24", kids: [{ id: "levi-l2", name: "Levi", luke: true, refs: "Luca 3:24", kids: [{ id: "matat-l2", name: "Matat", luke: true, refs: "Luca 3:24", kids: [{
              id: "eli", name: "Eli", luke: true, refs: "Luca 3:23",
              note: "Luca 3:23 îl numește pe Iosif „fiul lui Eli”, iar Matei 1:16 spune că tatăl lui Iosif era Iacov. Explicațiile vechi sunt două: fie Luca dă de fapt linia Mariei, iar Eli era tatăl ei (Iosif fiind ginerele lui), fie Iosif era fiul unuia prin naștere și al celuilalt după lege, prin căsătoria de levirat. Biblia nu spune care e adevărată.",
            }] }] }] }] }] }] }] }] }] }] }] }] }] }] }] }] }] }],
          }],
        }],
      },
      {
        id: "iehonia", name: "Iehonia", alt: "Ieconia", main: true, when: "dus la Babilon în 597 î.Hr.", refs: "2 Împărați 24–25; Matei 1:12",
        note: "După 37 de ani de temniță în Babilon, împăratul Evil-Merodac l-a scos și l-a ținut la masa lui (2 Împărați 25:27–30).",
        kids: [{
          id: "salatiel", name: "Salatiel", alt: "Șealtiel (1 Cronici 3:17)", main: true, refs: "1 Cronici 3:17; Matei 1:12; Ezra 3:2",
          note: "Atât Matei, cât și Luca îl numesc pe Salatiel tatăl lui Zorobabel; Luca îi dă însă alt tată, pe Neri.",
          kids: [{
            id: "zorobabel", name: "Zorobabel", main: true, when: "c. 538–515 î.Hr.", refs: "Ezra 2–5; Hagai 1–2; Zaharia 4; Matei 1:12–13",
            note: "Dregătorul care a condus întoarcerea din robie și rezidirea Templului, terminat în 515 î.Hr. (Ezra 6:15). 1 Cronici 3:19 îl numește fiul lui Pedaia, fratele lui Salatiel; Ezra, Hagai, Matei și Luca îl numesc „fiul lui Salatiel”, poate ca moștenitor legal.",
            kids: [{
              id: "abiud", name: "Abiud", main: true, refs: "Matei 1:13", note: "De la Abiud până la Iacov, numele sunt cunoscute doar din Matei 1.",
              kids: [{ id: "eliachim", name: "Eliachim", main: true, refs: "Matei 1:13", kids: [{ id: "azor", name: "Azor", main: true, refs: "Matei 1:13", kids: [{ id: "sadoc", name: "Sadoc", main: true, refs: "Matei 1:14", kids: [{ id: "achim", name: "Achim", main: true, refs: "Matei 1:14", kids: [{ id: "eliud", name: "Eliud", main: true, refs: "Matei 1:14", kids: [{ id: "eleazar", name: "Eleazar", main: true, refs: "Matei 1:15", kids: [{ id: "matan", name: "Matan", main: true, refs: "Matei 1:15", kids: [{
                id: "iacov-m", name: "Iacov", main: true, refs: "Matei 1:15–16",
                kids: [{
                  id: "iosif", name: "Iosif", wife: "Maria", main: true, refs: "Matei 1:16–25; Luca 1–2",
                  note: "„Iacov a născut pe Iosif, bărbatul Mariei, din care S-a născut Isus, care Se cheamă Hristos” (Matei 1:16). Om neprihănit, din casa lui David, tâmplar în Nazaret. Prin el, Domnul Isus era moștenitorul legal al lui David.",
                  kids: [{
                    id: "isus", name: "Isus Hristos", main: true, when: "născut c. 6–4 î.Hr.", refs: "Matei 1:18–2:23; Luca 1–3",
                    note: "Născut la Betleem din fecioara Maria. Luca scrie: „Isus avea aproape treizeci de ani când a început să învețe pe norod; și era, cum se credea, fiul lui Iosif, fiul lui Eli” (Luca 3:23). Irod cel Mare, sub care s-a născut, a murit cel mai probabil în anul 4 î.Hr.; numărătoarea anilor de după Hristos, făcută în secolul al VI-lea de călugărul Dionisie cel Mic, a ieșit cu câțiva ani mai târziu decât nașterea.",
                  }],
                }],
              }] }] }] }] }] }] }] }],
            }],
          }],
        }],
      },
    ],
    links: [["eli", "iosif"]],
  },
];

/** Toate persoanele din toți arborii, cu arborele în care stau și părintele lor (pentru căutare și pentru fișă). */
export function indexAll(): Map<string, { node: BNode; epoch: string; parent?: BNode }> {
  const out = new Map<string, { node: BNode; epoch: string; parent?: BNode }>();
  const walk = (n: BNode, epoch: string, parent?: BNode) => {
    out.set(n.id, { node: n, epoch, parent });
    for (const k of n.kids ?? []) walk(k, epoch, n);
  };
  for (const e of EPOCHS) for (const r of e.roots) walk(r, e.id);
  return out;
}

/** Fără diacritice și mici, pentru căutare. */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
