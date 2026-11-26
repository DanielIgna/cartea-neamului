/**
 * Planul de cuvinte cheie (Daniel, 14.11.2026: „dezvoltă cuvintele SEO”): ce căutări vrem să aducă oameni și ce pagină răspunde
 * la fiecare. Admin → SEO → Cuvinte cheie arată, pentru fiecare, dacă pagina există și (cu Search Console legat) pe ce loc suntem.
 * Fără cifre de volum inventate: „cerere” e doar o estimare relativă (mare / medie / nișă), după cât de general e cuvântul.
 * Când adaugi o pagină nouă pentru un cuvânt, trece-o aici.
 */
export type Intent = "informativ" | "unealtă" | "local" | "diaspora" | "comercial";
export type TargetKeyword = { keyword: string; path: string; intent: Intent; demand: "mare" | "medie" | "nișă" };

export const TARGET_KEYWORDS: TargetKeyword[] = [
  // Unealta în sine
  { keyword: "arbore genealogic online", path: "/", intent: "unealtă", demand: "mare" },
  { keyword: "carte arbore genealogic", path: "/ghid/carte-cu-arborele-genealogic", intent: "comercial", demand: "medie" },
  { keyword: "arbore genealogic gratuit", path: "/", intent: "unealtă", demand: "mare" },
  { keyword: "cum faci un arbore genealogic", path: "/ghid/cum-incepi-arborele-genealogic", intent: "informativ", demand: "mare" },
  { keyword: "arbore genealogic", path: "/", intent: "unealtă", demand: "mare" },
  { keyword: "spița neamului", path: "/ghid/ce-este-spita-neamului", intent: "informativ", demand: "medie" },
  { keyword: "grade de rudenie", path: "/ghid/grade-de-rudenie", intent: "informativ", demand: "mare" },
  { keyword: "cadou pentru bunici", path: "/cadou-de-sarbatori", intent: "comercial", demand: "medie" },
  { keyword: "test adn genealogie", path: "/ghid/testele-adn-in-genealogie", intent: "informativ", demand: "medie" },
  { keyword: "gedcom", path: "/ghid/cum-faci-un-fisier-gedcom", intent: "informativ", demand: "nișă" },
  // Acte și arhive
  { keyword: "certificat de naștere vechi", path: "/ghid/cum-ceri-un-act-de-stare-civila", intent: "informativ", demand: "medie" },
  { keyword: "arhivele naționale cerere", path: "/ghid/cum-ceri-copii-de-la-arhive", intent: "informativ", demand: "medie" },
  { keyword: "registre parohiale", path: "/ghid/cum-citesti-un-registru-parohial", intent: "informativ", demand: "nișă" },
  { keyword: "registre de stare civilă", path: "/ghid/registrele-de-stare-civila", intent: "informativ", demand: "medie" },
  { keyword: "familysearch românia", path: "/ghid/familysearch-pentru-romania", intent: "informativ", demand: "medie" },
  { keyword: "recensământ 1941", path: "/ghid/recensamintele-vechi", intent: "informativ", demand: "nișă" },
  { keyword: "carte funciară veche", path: "/ghid/cartea-funciara-si-cadastrul-vechi", intent: "informativ", demand: "medie" },
  { keyword: "scriere chirilică românească", path: "/ghid/scrierea-chirilica-romaneasca", intent: "informativ", demand: "nișă" },
  { keyword: "conscripții transilvania", path: "/ghid/conscriptiile-din-transilvania", intent: "informativ", demand: "nișă" },
  { keyword: "catagrafii", path: "/ghid/catagrafiile-din-moldova-si-tara-romaneasca", intent: "informativ", demand: "nișă" },
  // Nume
  { keyword: "originea numelui de familie", path: "/nume", intent: "informativ", demand: "mare" },
  { keyword: "ce înseamnă numele meu de familie", path: "/nume", intent: "informativ", demand: "medie" },
  { keyword: "numele popescu origine", path: "/nume/popescu", intent: "informativ", demand: "medie" },
  // Regiuni istorice
  { keyword: "genealogie transilvania", path: "/genealogie/regiune/transilvania", intent: "local", demand: "nișă" },
  { keyword: "genealogie banat", path: "/genealogie/regiune/banat", intent: "local", demand: "nișă" },
  { keyword: "genealogie bucovina", path: "/genealogie/regiune/bucovina", intent: "local", demand: "nișă" },
  { keyword: "genealogie basarabia", path: "/genealogie/regiune/basarabia", intent: "local", demand: "nișă" },
  { keyword: "genealogie moldova", path: "/genealogie/regiune/moldova", intent: "local", demand: "nișă" },
  { keyword: "genealogie dobrogea", path: "/genealogie/regiune/dobrogea", intent: "local", demand: "nișă" },
  { keyword: "genealogie maramureș", path: "/genealogie/regiune/maramures", intent: "local", demand: "nișă" },
  { keyword: "arhive cluj", path: "/localitati/cluj", intent: "local", demand: "nișă" },
  { keyword: "arhive iași", path: "/localitati/iasi", intent: "local", demand: "nișă" },
  // Diaspora
  { keyword: "transcriere certificat naștere", path: "/ghid/transcrierea-actelor-din-strainatate", intent: "diaspora", demand: "mare" },
  { keyword: "români în italia", path: "/diaspora/italia", intent: "diaspora", demand: "medie" },
  { keyword: "români în spania", path: "/diaspora/spania", intent: "diaspora", demand: "medie" },
  { keyword: "români în germania", path: "/diaspora/germania", intent: "diaspora", demand: "medie" },
  { keyword: "români în anglia", path: "/diaspora/marea-britanie", intent: "diaspora", demand: "medie" },
  { keyword: "români în franța", path: "/diaspora/franta", intent: "diaspora", demand: "nișă" },
  { keyword: "români din serbia", path: "/ghid/romanii-din-banatul-sarbesc", intent: "diaspora", demand: "nișă" },
  { keyword: "români din ucraina", path: "/diaspora/ucraina", intent: "diaspora", demand: "nișă" },
  { keyword: "români din ungaria", path: "/ghid/romanii-din-ungaria-registre", intent: "diaspora", demand: "nișă" },
  { keyword: "arhiva națională a moldovei", path: "/ghid/basarabia-registrele-parohiale", intent: "diaspora", demand: "nișă" },
  { keyword: "emigrare în america", path: "/ghid/emigrarea-in-america", intent: "diaspora", demand: "nișă" },
  { keyword: "arbore genealogic din străinătate", path: "/diaspora", intent: "diaspora", demand: "nișă" },
  // Etapa 5 (17.11.2026): cuvintele noilor pagini și ale ghidurilor lungi.
  { keyword: "arbore genealogic pentru școală", path: "/scoala", intent: "informativ", demand: "mare" },
  { keyword: "arbore genealogic pentru copii", path: "/scoala", intent: "informativ", demand: "medie" },
  { keyword: "fișă arbore genealogic", path: "/scoala", intent: "unealtă", demand: "medie" },
  { keyword: "genealogie", path: "/genealogie", intent: "local", demand: "mare" },
  { keyword: "registre parohiale greco-catolice", path: "/ghid/registrele-greco-catolice", intent: "informativ", demand: "nișă" },
  { keyword: "registre parohiale ortodoxe", path: "/ghid/registrele-ortodoxe", intent: "informativ", demand: "nișă" },
  { keyword: "matricole parohiale", path: "/ghid/cum-citesti-un-registru-parohial", intent: "informativ", demand: "nișă" },
  { keyword: "cum citești scrisul vechi", path: "/ghid/cum-citesti-scrisul-de-mana-vechi", intent: "informativ", demand: "nișă" },
  { keyword: "stil vechi stil nou", path: "/ghid/calendarul-iulian-si-gregorian", intent: "informativ", demand: "medie" },
  { keyword: "cum datezi o fotografie veche", path: "/ghid/cum-datezi-o-fotografie-veche", intent: "informativ", demand: "nișă" },
  { keyword: "scanare poze vechi", path: "/ghid/cum-scanezi-poze-si-documente", intent: "informativ", demand: "medie" },
  { keyword: "numele de fată al bunicii", path: "/ghid/cum-gasesti-numele-de-fata-al-bunicii", intent: "informativ", demand: "nișă" },
  { keyword: "registrul agricol vechi", path: "/ghid/colectivizarea-si-registrele-agricole", intent: "informativ", demand: "nișă" },
  { keyword: "eroi primul război mondial listă", path: "/ghid/listele-eroilor-si-monumentele", intent: "informativ", demand: "medie" },
  { keyword: "arhive militare pitești", path: "/ghid/registrele-militare", intent: "informativ", demand: "nișă" },
  { keyword: "întrebări pentru bunici", path: "/ghid/intrebari-pentru-bunici", intent: "informativ", demand: "medie" },
  { keyword: "urbarii transilvania", path: "/ghid/urbariile-si-documentele-mosiilor", intent: "informativ", demand: "nișă" },
  { keyword: "registre evreiești românia", path: "/ghid/registrele-evreiesti", intent: "informativ", demand: "nișă" },
  { keyword: "widget arbore genealogic", path: "/arborele-meu", intent: "unealtă", demand: "nișă" },
  { keyword: "cartea neamului presă", path: "/presa", intent: "comercial", demand: "nișă" },
];

/** Cuvintele găsite în căutările din Search Console: potrivire exactă sau cea mai bună căutare care conține cuvântul. */
export function matchTarget<T extends { query: string; position: number; impressions: number; clicks: number }>(k: TargetKeyword, rows: T[]) {
  const w = k.keyword.toLocaleLowerCase("ro-RO");
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const fw = fold(w);
  const exact = rows.find((r) => fold(r.query) === fw) ?? null;
  const related = rows.filter((r) => r !== exact && fold(r.query).includes(fw)).sort((a, b) => b.impressions - a.impressions);
  return { exact, best: exact ?? related[0] ?? null, related: related.length };
}
