import { loadNames } from "@/lib/continut/nume";
import { nameGate } from "@/lib/continut/prag";
import { countyPath, isCapital, loadCounties } from "@/lib/continut/localitati";
import { GEN_CITIES, genCityPath } from "@/lib/genealogie-orase";
import { GEN_REGIONS, genRegionPath } from "@/lib/genealogie-regiuni";
import { GIFT_PAGES, giftPath } from "@/lib/cadouri";
import { KIN_PAGES, kinPagePath } from "@/lib/unelte/rudenie-pagini";
import type { SeasonKey } from "@/lib/seo/sezon";

/**
 * Lista de cuvinte cheie din planul SEO (18.11.2026, secțiunea 5). ESTE O CIORNĂ: Daniel o aprobă înainte să fie folosită
 * (KEYWORDS_APPROVED). Până atunci nu apare pe site și nu schimbă nicio pagină; Admin → SEO → Cuvinte cheie folosește în
 * continuare lista scurtă din src/lib/seo-cuvinte.ts.
 *
 * Fiecare rând: cuvântul, grupa (clusterul), intenția, sezonul, prioritatea (1 = tranzacțional sau sezon apropiat, 2 = școală
 * și how-to, 3 = informațional lung), pagina țintă și starea ei. Fără volume de căutare inventate.
 * Regula: o singură pagină pe intenție. Testul tests/seo-keywords.test.ts pică dacă o pagină țintă are cuvinte principale
 * din grupe diferite sau dacă o pagină „exista” nu există. CSV-ul (src/data/seo-keywords.csv) se face cu
 * `npx tsx scripts/seo-keywords-csv.ts`.
 */
export const KEYWORDS_APPROVED = false;

export type KwIntent = "informational" | "comercial" | "tranzactional" | "navigational";
export type KwStatus = "exista" | "de-creat" | "de-imbunatatit";
export type KwCluster = "cadouri" | "familie" | "scoala" | "unelte" | "produs" | "diaspora" | "nume" | "local" | "rudenie" | "acte";
export type Keyword = { keyword: string; cluster: KwCluster; intent: KwIntent; sezon?: SeasonKey; prioritate: 1 | 2 | 3; targetUrl: string; status: KwStatus };

const row = (keyword: string, cluster: KwCluster, intent: KwIntent, prioritate: 1 | 2 | 3, targetUrl: string, status: KwStatus = "exista", sezon?: SeasonKey): Keyword =>
  ({ keyword, cluster, intent, prioritate, targetUrl, status, ...(sezon ? { sezon } : {}) });

/** Articolele noi din plan (secțiunea 11): adresa pe care o vor avea; până sunt scrise și aprobate, rândurile lor sunt „de-creat”. */
export const PLANNED_GUIDES: { slug: string; title: string; order: number }[] = [
  { slug: "cadou-pentru-bunicii-care-au-tot", title: "Ce cadou dai bunicilor care „au tot”", order: 1 },
  { slug: "arbore-genealogic-gratuit-online-pas-cu-pas", title: "Cum faci un arbore genealogic gratuit online, pas cu pas", order: 2 },
  { slug: "certificatul-de-nastere-al-bunicului", title: "Cum găsești certificatul de naștere al bunicului", order: 3 },
  { slug: "registre-parohiale-online", title: "Registre parohiale online: unde le găsești gratuit", order: 4 },
  { slug: "hpdt-registrele-din-transilvania", title: "HPDT: cum cauți strămoși din Transilvania, 1850–1914", order: 5 },
  { slug: "stramosi-in-armata-austro-ungara", title: "Strămoși în armata austro-ungară: listele de pierderi și matricolele", order: 6 },
  { slug: "descopera-arhivele-nationale", title: "Descoperă (Arhivele Naționale): cum cauți registrele scanate", order: 7 },
  { slug: "genealogica-ro-indexul", title: "Genealogica.ro: cum folosești indexul", order: 8 },
  { slug: "cum-afli-satul-de-origine", title: "Cum afli satul de origine al familiei", order: 9 },
  { slug: "deportati-in-baragan-si-siberia", title: "Strămoși deportați în Bărăgan sau în Siberia: unde cauți", order: 10 },
  { slug: "basarabia-registrele-parohiale", title: "Basarabia: registrele parohiale 1812–1923 și arhiva de la Chișinău", order: 11 },
  { slug: "soldat-roman-cazut-in-razboi", title: "Cum găsești un soldat român căzut în război", order: 12 },
  { slug: "cate-generatii-poti-afla", title: "Câte generații poți afla realist în România", order: 13 },
  { slug: "stramosi-evrei-din-romania", title: "Strămoși evrei din România: de unde începi", order: 14 },
  { slug: "svabii-banateni-genealogie", title: "Șvabii bănățeni: genealogie pas cu pas", order: 15 },
  { slug: "sasii-din-transilvania-registre", title: "Sașii din Transilvania: registre și surse", order: 16 },
  { slug: "harti-vechi-ridicarile-austriece", title: "Hărți vechi: satul pe ridicările topografice austriece", order: 17 },
  { slug: "cum-cauti-un-mormant-vechi-online", title: "Cum cauți un mormânt vechi online", order: 18 },
  { slug: "razesi-mosneni-clacasi-iobagi", title: "Răzeși, moșneni, clăcași, iobagi: ce statut aveau strămoșii", order: 19 },
  { slug: "confesiunea-stramosilor", title: "Cum afli confesiunea strămoșilor și de ce contează", order: 20 },
  { slug: "redobandirea-cetateniei-acte-stramosi", title: "Redobândirea cetățeniei române: ce acte ale strămoșilor îți trebuie", order: 21 },
  { slug: "de-unde-vine-numele-tau-de-familie", title: "De unde vine numele tău de familie: cum afli singur", order: 22 },
  { slug: "bucovina-registre-si-arhive", title: "Bucovina: registre și arhive de o parte și de alta a graniței", order: 23 },
  { slug: "dobrogea-genealogie", title: "Dobrogea: aromâni, tătari, turci, coloniști", order: 24 },
  { slug: "rude-in-viata-si-viata-privata", title: "Cum găsești rude în viață fără să le încalci viața privată", order: 25 },
  { slug: "greseli-frecvente-arbore-genealogic", title: "Greșeli frecvente la arborele genealogic", order: 26 },
  { slug: "muti-arborele-de-pe-myheritage-sau-familysearch", title: "Cum muți arborele de pe MyHeritage sau FamilySearch (GEDCOM)", order: 27 },
  { slug: "reuniune-de-familie", title: "Cum organizezi o reuniune de familie, cu arborele ca temă", order: 28 },
  { slug: "catagrafia-cum-o-citesti", title: "Cum citești o catagrafie", order: 29 },
  { slug: "oltenia-si-muntenia-condici-catagrafii", title: "Oltenia și Muntenia: condici, catagrafii, registre", order: 30 },
  // A doua serie (Daniel, 18.11.2026: „da scrie ghiduri noi”), subiecte care nu repetă ghidurile și paginile de regiune existente.
  { slug: "romanii-din-banatul-sarbesc", title: "Românii din Banatul sârbesc: cum îți cauți strămoșii", order: 31 },
  { slug: "romanii-din-ungaria-registre", title: "Românii din Ungaria: Jula, Micherechi, Chitighaz, Bătania", order: 32 },
  { slug: "nemesi-si-boieri-din-transilvania", title: "Nemeși și boieri: strămoși din mica nobilime românească", order: 33 },
  { slug: "ardealul-de-nord-1940-1944", title: "Ardealul de Nord, 1940–1944: acte, refugiați și urme ale familiei", order: 34 },
  { slug: "dosarul-de-la-securitate-al-bunicului", title: "Dosarul de la Securitate al bunicului: cum ceri acces la CNSAS", order: 35 },
  // SUA și Canada (Daniel, 18.11.2026): diaspora din America de Nord, în engleză (lang: en) și în română. Ciorne până le aprobă Daniel.
  { slug: "trace-romanian-ancestors-from-us-canada", title: "How to Trace Your Romanian Ancestors from the US and Canada", order: 36 },
  { slug: "preserve-immigrant-parents-stories", title: "How to Preserve Your Immigrant Parents' Stories Before They Fade", order: 37 },
  { slug: "arbore-genealogic-familie-romania-sua-canada", title: "Arborele genealogic când familia e în România, SUA și Canada", order: 38 },
  { slug: "romanian-surnames-changed-in-america", title: "Romanian Surnames in America and Canada: How Names Changed", order: 39 },
  { slug: "romanian-immigration-waves-us-canada", title: "Romanian Immigration to the US and Canada: Every Wave", order: 40 },
  { slug: "valurile-de-emigrare-in-america-de-nord", title: "Românii în SUA și Canada: valurile de emigrare", order: 41 },
];
const planned = (slug: string) => `/ghid/${slug}`;
/** Ghidurile plănuite deja publicate (aprobate de Daniel la 18.11.2026, în trei tranșe): rândurile lor devin „exista”. */
export const PUBLISHED_GUIDES = new Set([
  "arbore-genealogic-gratuit-online-pas-cu-pas", "cadou-pentru-bunicii-care-au-tot", "cate-generatii-poti-afla", "certificatul-de-nastere-al-bunicului",
  "confesiunea-stramosilor", "cum-afli-satul-de-origine", "cum-cauti-un-mormant-vechi-online", "de-unde-vine-numele-tau-de-familie",
  "greseli-frecvente-arbore-genealogic", "registre-parohiale-online", "reuniune-de-familie", "rude-in-viata-si-viata-privata",
  "harti-vechi-ridicarile-austriece", "razesi-mosneni-clacasi-iobagi", "svabii-banateni-genealogie",
  "sasii-din-transilvania-registre", "stramosi-evrei-din-romania", "bucovina-registre-si-arhive", "deportati-in-baragan-si-siberia",
  "basarabia-registrele-parohiale", "dobrogea-genealogie", "oltenia-si-muntenia-condici-catagrafii", "stramosi-in-armata-austro-ungara",
  "hpdt-registrele-din-transilvania", "redobandirea-cetateniei-acte-stramosi",
  "romanii-din-banatul-sarbesc", "romanii-din-ungaria-registre", "nemesi-si-boieri-din-transilvania", "ardealul-de-nord-1940-1944",
  "dosarul-de-la-securitate-al-bunicului",
]);

/** Rândurile scrise de mână, pentru intențiile principale. */
const MANUAL: Keyword[] = [
  // Produs: pagina principală e ținta pentru „arbore genealogic online”.
  row("arbore genealogic online", "produs", "tranzactional", 1, "/"),
  row("arbore genealogic online gratuit", "produs", "tranzactional", 1, "/"),
  row("arbore genealogic gratuit", "produs", "tranzactional", 1, "/"),
  row("program arbore genealogic", "produs", "comercial", 1, "/"),
  row("aplicație arbore genealogic", "produs", "comercial", 1, "/"),
  row("arbore genealogic în română", "produs", "comercial", 1, "/"),
  row("site arbore genealogic", "produs", "comercial", 1, "/"),
  row("cartea neamului", "produs", "navigational", 1, "/"),
  row("cum fac un arbore genealogic online", "produs", "informational", 2, planned("arbore-genealogic-gratuit-online-pas-cu-pas"), "de-creat"),
  row("arbore genealogic pas cu pas", "produs", "informational", 2, planned("arbore-genealogic-gratuit-online-pas-cu-pas"), "de-creat"),
  row("cum mut arborele de pe myheritage", "produs", "informational", 2, planned("muti-arborele-de-pe-myheritage-sau-familysearch"), "de-creat"),
  row("export arbore familysearch gedcom", "produs", "informational", 2, planned("muti-arborele-de-pe-myheritage-sau-familysearch"), "de-creat"),
  row("fișier gedcom", "produs", "informational", 3, "/ghid/cum-faci-un-fisier-gedcom"),
  row("greșeli arbore genealogic", "produs", "informational", 2, planned("greseli-frecvente-arbore-genealogic"), "de-creat"),
  // Cadouri (pe lângă paginile generate mai jos).
  row("cadou de crăciun pentru părinți", "cadouri", "comercial", 1, "/cadou-de-sarbatori", "exista", "craciun"),
  row("cadou de crăciun pentru bunici", "cadouri", "comercial", 1, "/cadou-de-sarbatori", "exista", "craciun"),
  row("cadou de crăciun original", "cadouri", "comercial", 1, "/cadou-de-sarbatori", "exista", "craciun"),
  row("cadou de crăciun pentru familie", "cadouri", "comercial", 1, "/cadou-de-sarbatori", "exista", "craciun"),
  row("idei cadouri", "cadouri", "comercial", 1, "/cadouri"),
  row("cadou personalizat familie", "cadouri", "comercial", 1, "/cadouri/pentru-familie"),
  row("cadou emoțional pentru mama", "cadouri", "comercial", 1, "/cadouri/pentru-mama"),
  row("cadou inspirat pentru socri", "cadouri", "comercial", 1, "/cadouri/pentru-socri"),
  row("cadou de pensionare original", "cadouri", "comercial", 1, "/cadouri/pensionare"),
  row("cadou de ultim moment digital", "cadouri", "tranzactional", 1, "/cadouri/cadou-de-ultim-moment"),
  row("cadou 8 martie pentru mama", "cadouri", "comercial", 1, "/cadouri/8-martie", "exista", "martie"),
  row("cadou ziua bunicilor", "cadouri", "comercial", 1, "/cadouri/ziua-bunicilor", "exista", "ziua-bunicilor"),
  row("cadou botez original", "cadouri", "comercial", 1, "/cadouri/botez"),
  row("cadou nuntă de aur", "cadouri", "comercial", 1, "/cadouri/nunta-de-aur"),
  row("cadou bunici care au tot", "cadouri", "comercial", 1, planned("cadou-pentru-bunicii-care-au-tot"), "de-creat", "craciun"),
  // Familie și amintiri.
  row("întrebări pentru bunici", "familie", "informational", 2, "/ghid/intrebari-pentru-bunici"),
  row("interviu cu bunicii", "familie", "informational", 2, "/ghid/cum-intervievezi-bunicii"),
  row("cum păstrezi glasul bunicilor", "familie", "informational", 2, "/ghid/cum-inregistrezi-glasul-bunicilor"),
  row("povestea familiei", "familie", "informational", 2, "/ghid/cum-scrii-povestea-familiei"),
  row("istoria familiei", "familie", "informational", 2, "/ghid/cum-scrii-povestea-familiei"),
  row("amintiri de familie", "familie", "informational", 2, "/ghid/cum-scrii-povestea-familiei"),
  row("cum scanezi pozele vechi", "familie", "informational", 2, "/ghid/cum-scanezi-poze-si-documente"),
  row("cum păstrezi pozele vechi", "familie", "informational", 3, "/ghid/cum-pastrezi-pozele-vechi"),
  row("cum datezi o fotografie veche", "familie", "informational", 3, "/ghid/cum-datezi-o-fotografie-veche"),
  row("documente vechi de familie", "familie", "informational", 3, "/ghid/documente-de-familie-din-casa"),
  row("reuniune de familie", "familie", "informational", 2, planned("reuniune-de-familie"), "de-creat"),
  row("cum organizezi o reuniune de familie", "familie", "informational", 2, planned("reuniune-de-familie"), "de-creat"),
  row("rude în viață cum le găsești", "familie", "informational", 3, planned("rude-in-viata-si-viata-privata"), "de-creat"),
  row("protecția datelor arbore genealogic", "familie", "informational", 3, "/ghid/protectia-datelor-in-arbore"),
  // Școală.
  row("proiect arbore genealogic clasa a 4-a", "scoala", "informational", 2, "/scoala/clasa-4", "exista", "scoala"),
  row("arbore genealogic clasa a 4-a", "scoala", "informational", 2, "/scoala/clasa-4", "exista", "scoala"),
  row("arbore genealogic clasa a 3-a", "scoala", "informational", 2, "/scoala/clasa-3", "exista", "scoala"),
  row("arbore genealogic istorie gimnaziu", "scoala", "informational", 2, "/scoala/gimnaziu-istorie", "exista", "scoala"),
  row("arbore genealogic pentru școală", "scoala", "informational", 2, "/scoala", "exista", "scoala"),
  row("fișă arbore genealogic", "scoala", "informational", 2, "/scoala", "exista", "scoala"),
  // Unelte.
  row("arbore genealogic de completat", "unelte", "tranzactional", 1, "/unelte/arbore-printabil"),
  row("model arbore genealogic de completat", "unelte", "tranzactional", 1, "/unelte/arbore-printabil"),
  row("șablon arbore genealogic gratuit", "unelte", "tranzactional", 1, "/unelte/arbore-printabil"),
  row("arbore genealogic de printat", "unelte", "tranzactional", 1, "/unelte/arbore-printabil"),
  row("arbore genealogic pdf", "unelte", "tranzactional", 1, "/unelte/arbore-printabil"),
  row("arbore genealogic de desenat", "unelte", "tranzactional", 2, "/unelte/arbore-printabil"),
  row("calculator grad de rudenie", "unelte", "tranzactional", 1, "/unelte/calculator-grad-de-rudenie"),
  row("calculator rudenie", "unelte", "tranzactional", 1, "/unelte/calculator-grad-de-rudenie"),
  row("ce rudă îmi este", "unelte", "informational", 1, "/unelte/calculator-grad-de-rudenie"),
  row("întrebări pentru bunici pdf", "unelte", "tranzactional", 1, "/unelte/intrebari-pentru-bunici-pdf"),
  row("chestionar pentru bunici", "unelte", "tranzactional", 2, "/unelte/intrebari-pentru-bunici-pdf"),
  row("în ce an s-a născut străbunicul", "unelte", "informational", 2, "/unelte/calculator-generatii"),
  row("câți ani are o generație", "unelte", "informational", 2, "/unelte/calculator-generatii"),
  row("câte generații poți afla", "unelte", "informational", 3, planned("cate-generatii-poti-afla"), "de-creat"),
  row("unelte genealogie gratuite", "unelte", "navigational", 2, "/unelte"),
  // Rudenie (pe lângă paginile generate mai jos).
  row("grade de rudenie", "rudenie", "informational", 2, "/ghid/grade-de-rudenie"),
  row("grade de rudenie cod civil", "rudenie", "informational", 2, "/ghid/grade-de-rudenie"),
  row("cum se numesc rudele", "rudenie", "informational", 2, "/ghid/grade-de-rudenie"),
  row("nași rudenie spirituală", "rudenie", "informational", 3, "/ghid/nasii-si-rudenia-spirituala"),
  row("spița neamului", "rudenie", "informational", 2, "/ghid/ce-este-spita-neamului"),
  // Acte, arhive, registre (ghiduri existente și plănuite).
  row("certificat de naștere bunic", "acte", "informational", 1, planned("certificatul-de-nastere-al-bunicului"), "de-creat"),
  row("certificat de naștere vechi", "acte", "informational", 1, "/ghid/cum-ceri-un-act-de-stare-civila"),
  row("cum ceri un act de stare civilă", "acte", "informational", 2, "/ghid/cum-ceri-un-act-de-stare-civila"),
  row("cerere arhivele naționale", "acte", "informational", 2, "/ghid/cum-ceri-copii-de-la-arhive"),
  row("cum cercetezi la arhive", "acte", "informational", 3, "/ghid/cum-cercetezi-la-arhive"),
  row("cum sunt organizate arhivele", "acte", "informational", 3, "/ghid/cum-sunt-organizate-arhivele"),
  row("registre parohiale online", "acte", "informational", 1, planned("registre-parohiale-online"), "de-creat"),
  row("registre parohiale gratuite", "acte", "informational", 1, planned("registre-parohiale-online"), "de-creat"),
  row("cum citești un registru parohial", "acte", "informational", 2, "/ghid/cum-citesti-un-registru-parohial"),
  row("registre de stare civilă", "acte", "informational", 2, "/ghid/registrele-de-stare-civila"),
  row("registre greco-catolice", "acte", "informational", 3, "/ghid/registrele-greco-catolice"),
  row("registre ortodoxe", "acte", "informational", 3, "/ghid/registrele-ortodoxe"),
  row("registre catolice și protestante", "acte", "informational", 3, "/ghid/registrele-catolice-si-protestante"),
  row("registre evreiești românia", "acte", "informational", 3, "/ghid/registrele-evreiesti"),
  row("registre militare", "acte", "informational", 3, "/ghid/registrele-militare"),
  row("familysearch românia", "acte", "informational", 2, "/ghid/familysearch-pentru-romania"),
  row("hpdt transilvania", "acte", "informational", 2, planned("hpdt-registrele-din-transilvania"), "de-creat"),
  row("armata austro-ungară liste de pierderi", "acte", "informational", 2, planned("stramosi-in-armata-austro-ungara"), "de-creat"),
  row("descoperă arhivele naționale", "acte", "informational", 2, planned("descopera-arhivele-nationale"), "de-creat"),
  row("genealogica.ro", "acte", "navigational", 3, planned("genealogica-ro-indexul"), "de-creat"),
  row("satul de origine al familiei", "acte", "informational", 2, planned("cum-afli-satul-de-origine"), "de-creat"),
  row("deportați bărăgan", "acte", "informational", 2, planned("deportati-in-baragan-si-siberia"), "de-creat"),
  row("deportați siberia români", "acte", "informational", 2, planned("deportati-in-baragan-si-siberia"), "de-creat"),
  row("soldat român căzut în război", "acte", "informational", 2, planned("soldat-roman-cazut-in-razboi"), "de-creat"),
  row("eroi români listă", "acte", "informational", 3, "/ghid/listele-eroilor-si-monumentele"),
  row("strămoși evrei românia", "acte", "informational", 3, planned("stramosi-evrei-din-romania"), "de-creat"),
  row("șvabi bănățeni genealogie", "acte", "informational", 3, planned("svabii-banateni-genealogie"), "de-creat"),
  row("sași transilvania registre", "acte", "informational", 3, planned("sasii-din-transilvania-registre"), "de-creat"),
  row("hărți vechi ridicarea iosefină", "acte", "informational", 3, planned("harti-vechi-ridicarile-austriece"), "de-creat"),
  row("mormânt vechi online", "acte", "informational", 3, planned("cum-cauti-un-mormant-vechi-online"), "de-creat"),
  row("pietre funerare genealogie", "acte", "informational", 3, "/ghid/cum-folosesti-pietrele-funerare"),
  row("răzeși moșneni clăcași", "acte", "informational", 3, planned("razesi-mosneni-clacasi-iobagi"), "de-creat"),
  row("confesiunea strămoșilor", "acte", "informational", 3, planned("confesiunea-stramosilor"), "de-creat"),
  row("catagrafii", "acte", "informational", 3, "/ghid/catagrafiile-din-moldova-si-tara-romaneasca"),
  row("cum citești o catagrafie", "acte", "informational", 3, planned("catagrafia-cum-o-citesti"), "de-creat"),
  row("românii din banatul sârbesc strămoși", "acte", "informational", 3, planned("romanii-din-banatul-sarbesc"), "de-creat"),
  row("românii din ungaria registre", "acte", "informational", 3, planned("romanii-din-ungaria-registre"), "de-creat"),
  row("nemeși maramureșeni strămoși", "acte", "informational", 3, planned("nemesi-si-boieri-din-transilvania"), "de-creat"),
  row("ardealul de nord 1940 acte", "acte", "informational", 3, planned("ardealul-de-nord-1940-1944"), "de-creat"),
  row("dosar cnsas bunic", "acte", "informational", 2, planned("dosarul-de-la-securitate-al-bunicului"), "de-creat"),
  row("conscripții transilvania", "acte", "informational", 3, "/ghid/conscriptiile-din-transilvania"),
  row("urbarii", "acte", "informational", 3, "/ghid/urbariile-si-documentele-mosiilor"),
  row("carte funciară veche", "acte", "informational", 3, "/ghid/cartea-funciara-si-cadastrul-vechi"),
  row("recensământ 1941", "acte", "informational", 3, "/ghid/recensamintele-vechi"),
  row("colectivizare registre agricole", "acte", "informational", 3, "/ghid/colectivizarea-si-registrele-agricole"),
  row("testament vechi moștenire", "acte", "informational", 3, "/ghid/testamente-si-acte-de-mostenire"),
  row("scriere chirilică românească", "acte", "informational", 3, "/ghid/scrierea-chirilica-romaneasca"),
  row("calendarul iulian gregorian", "acte", "informational", 3, "/ghid/calendarul-iulian-si-gregorian"),
  row("documente în latină", "acte", "informational", 3, "/ghid/documente-in-latina"),
  row("documente în maghiară", "acte", "informational", 3, "/ghid/documente-in-maghiara-si-germana"),
  row("scris de mână vechi", "acte", "informational", 3, "/ghid/cum-citesti-scrisul-de-mana-vechi"),
  row("ziare vechi online", "acte", "informational", 3, "/ghid/biblioteci-si-ziare-vechi"),
  row("test adn genealogie", "acte", "informational", 3, "/ghid/testele-adn-in-genealogie"),
  row("numele de fată al bunicii", "acte", "informational", 3, "/ghid/cum-gasesti-numele-de-fata-al-bunicii"),
  row("surse publice genealogie", "acte", "navigational", 2, "/surse-publice"),
  row("resurse genealogie gratuite", "acte", "navigational", 3, "/resurse-genealogie"),
  // Nume (hubul și articolul plănuit).
  row("originea numelui de familie", "nume", "informational", 3, "/nume"),
  row("ce înseamnă numele meu de familie", "nume", "informational", 3, "/nume"),
  row("nume de familie românești", "nume", "informational", 3, "/nume"),
  row("de unde vine numele meu", "nume", "informational", 3, planned("de-unde-vine-numele-tau-de-familie"), "de-creat"),
  row("nume schimbate variante", "nume", "informational", 3, "/ghid/nume-schimbate-si-variante"),
  row("porecle în sat", "nume", "informational", 3, "/ghid/porecle-si-nume-in-sat"),
  // Diaspora.
  row("redobândirea cetățeniei române acte strămoși", "diaspora", "informational", 2, planned("redobandirea-cetateniei-acte-stramosi"), "de-creat"),
  row("români din străinătate rude", "diaspora", "informational", 3, "/diaspora"),
  row("emigrarea în america români", "diaspora", "informational", 3, "/ghid/emigrarea-in-america"),
  // Local: regiunile plănuite.
  row("genealogie bucovina arhive", "local", "informational", 3, planned("bucovina-registre-si-arhive"), "de-creat"),
  row("dobrogea genealogie aromâni", "local", "informational", 3, planned("dobrogea-genealogie"), "de-creat"),
  row("basarabia registre parohiale", "local", "informational", 3, planned("basarabia-registrele-parohiale"), "de-creat"),
  row("condici catagrafii oltenia", "local", "informational", 3, planned("oltenia-si-muntenia-condici-catagrafii"), "de-creat"),
  row("genealogie pe regiuni", "local", "navigational", 3, "/genealogie"),
];

/** Rândurile făcute din date (nume, județe, orașe, regiuni, cadouri, rude). */
function generated(): Keyword[] {
  const out: Keyword[] = [];
  for (const n of loadNames()) {
    const status: KwStatus = nameGate(n) ? "de-imbunatatit" : "exista";
    const x = n.name.toLowerCase();
    for (const k of [`ce înseamnă numele ${x}`, `originea numelui ${x}`, `numele ${x} de unde vine`]) out.push(row(k, "nume", "informational", 3, `/nume/${n.slug}`, status));
  }
  for (const c of loadCounties()) {
    const where = isCapital(c) ? "bucurești" : c.name.toLowerCase();
    for (const k of [`arhive ${where}`, `acte vechi ${where}`, `registre parohiale ${where}`, `unde găsesc actele bunicilor în ${where}`]) out.push(row(k, "local", "informational", 3, countyPath(c)));
  }
  for (const c of GEN_CITIES) for (const k of [`genealogie ${c.name.toLowerCase()}`, `strămoși din ${c.name.toLowerCase()}`]) out.push(row(k, "local", "informational", 3, genCityPath(c)));
  for (const r of GEN_REGIONS) for (const k of [`genealogie ${r.name.toLowerCase()}`, `registre vechi ${r.name.toLowerCase()}`]) out.push(row(k, "local", "informational", 3, genRegionPath(r)));
  for (const g of GIFT_PAGES) {
    const base = g.slug === "cadou-de-ultim-moment" ? "cadou de ultim moment" : `cadou ${g.name.toLowerCase()}`;
    for (const k of [base, `${base} original`, `idei ${base}`, `${base} personalizat`]) out.push(row(k, "cadouri", "comercial", 1, giftPath(g), "exista", g.season));
  }
  for (const p of KIN_PAGES) {
    const x = p.name.toLowerCase();
    for (const k of [`ce este ${x}`, `${x} grad de rudenie`]) out.push(row(k, "rudenie", "informational", 2, kinPagePath(p)));
  }
  return out;
}

let cache: Keyword[] | null = null;
/** Toate rândurile, fără dubluri (rândul scris de mână câștigă). */
export function seoKeywords(): Keyword[] {
  if (cache) return cache;
  const seen = new Set<string>();
  cache = [...MANUAL, ...generated()].filter((k) => { const key = k.keyword.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; })
    .map((k) => (k.status === "de-creat" && PUBLISHED_GUIDES.has(k.targetUrl.replace("/ghid/", "")) ? { ...k, status: "exista" as const } : k));
  return cache;
}

export const CSV_HEADER = "keyword,cluster,intent,sezon,prioritate,targetUrl,status";
export const toCsv = (rows: Keyword[]) => [CSV_HEADER, ...rows.map((k) => [k.keyword, k.cluster, k.intent, k.sezon ?? "", k.prioritate, k.targetUrl, k.status].map((v) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(","))].join("\n") + "\n";
