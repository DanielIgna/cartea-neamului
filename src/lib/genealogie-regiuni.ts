import type { RegionKey } from "@/lib/continut/regiuni";

/**
 * Paginile regionale /genealogie/regiune/<slug> (Etapa 3, Daniel, 17.11.2026): cum îți cauți strămoșii într-o regiune istorică,
 * după istoria ei administrativă, confesiuni, limbi și arhive. Text scris de mână, fără date inventate; ce nu e sigur e spus
 * cu prudență („de obicei”, „întreabă arhiva”). Legăturile spre județe, orașe, nume și ghiduri se fac din datele existente.
 */
export type GenRegion = {
  slug: string; name: string; title: string; description: string; h1: string; lead: string;
  /** Județele din România care țin (în tot sau în parte) de regiune; Basarabia nu are niciunul. */
  counties: string[];
  /** Regiunea din paginile de nume (pentru „nume des întâlnite”); Basarabia folosește Moldova. */
  nameRegion: RegionKey | null;
  oldNames: string[];
  body: { h: string; p: string[] }[];
  faq: { q: string; a: string }[];
  guides: string[];
};

export const REGION_HUB = "/genealogie";
export const genRegionPath = (r: Pick<GenRegion, "slug">) => `/genealogie/regiune/${r.slug}`;
export const REGIONS_UPDATED = new Date("2026-11-17T00:00:00Z");

export const GEN_REGIONS: GenRegion[] = [
  {
    slug: "transilvania", name: "Transilvania",
    title: "Genealogie în Transilvania: registre, confesiuni, arhive",
    description: "Cum îți cauți strămoșii din Transilvania: registrele fiecărei confesiuni, actele în maghiară după 1895, conscripțiile și arhivele județelor.",
    h1: "Genealogie în Transilvania: cum îți cauți strămoșii",
    lead: "În Transilvania, aproape fiecare sat avea mai multe biserici și fiecare își ținea registrele ei. Cine știe confesiunea familiei și formele vechi ale numelor găsește repede drumul prin arhive.",
    counties: ["alba", "bistrita-nasaud", "brasov", "cluj", "covasna", "harghita", "hunedoara", "mures", "salaj", "sibiu"],
    nameRegion: "transilvania", oldNames: ["Erdély (maghiară)", "Siebenbürgen (germană)", "Transilvania / Ardeal"],
    body: [
      { h: "Un ținut cu multe neamuri și biserici", p: [
        "Transilvania a fost până în 1918 sub coroana maghiară și sub Habsburgi, iar satele și orașele ei au fost locuite de români, maghiari, secui, sași, evrei, armeni și romi. Fiecare comunitate avea biserica ei: ortodoxă, greco-catolică (după unirea de la 1700), romano-catolică, reformată, luterană sau unitariană. Înainte de 1895, singurele registre de botez, cununie și înmormântare sunt cele ale parohiilor.",
        "De aceea, primul lucru de aflat despre un strămoș din Ardeal e confesiunea lui. O familie de greco-catolici dintr-un sat cu două biserici apare doar în registrele bisericii ei, iar o căsătorie mixtă poate fi trecută în registrul uneia singure.",
      ] },
      { h: "Registrele parohiale și cele de stare civilă", p: [
        "Starea civilă de stat a început la 1 octombrie 1895. Registrele dintre 1895 și 1918 sunt scrise în maghiară, cu numele de botez traduse: Ioan devine János, Gheorghe devine György, Maria rămâne Mária. Registrele parohiale mai vechi pot fi în română (cu litere chirilice sau latine), maghiară, latină sau germană, după biserică și epocă.",
        "Biserica greco-catolică a fost desființată în 1948, iar registrele ei au ajuns la alte instituții; multe sunt azi în fondurile serviciilor județene ale Arhivelor Naționale. Registrele mai vechi de aproximativ 100 de ani sunt la arhiva județului, iar actele mai noi se cer de la primărie.",
      ] },
      { h: "Conscripții, urbarii și cartea funciară", p: [
        "Pentru vremea de dinainte de registre, Transilvania are surse fiscale și administrative bogate: conscripțiile (recensămintele de oameni și bunuri ale Imperiului), urbariile moșiilor, care arată iobagii fiecărui sat, și conscripția din 1850, păstrată pe localități în multe arhive.",
        "Din a doua jumătate a secolului al XIX-lea există cartea funciară, cu proprietarii fiecărei parcele. Ea poate arăta cum a trecut pământul de la părinți la copii și cine erau frații între care s-a împărțit o moștenire.",
      ] },
      { h: "Graniță militară, sași și secui", p: [
        "În secolul al XVIII-lea și până la 1851, o parte din satele din zona Năsăudului și a Orlatului au ținut de regimentele de graniță. Pentru aceste familii pot exista registre militare și liste de grăniceri, pe lângă cele ale parohiilor.",
        "Sașii au registre luterane foarte vechi, iar în Ținutul Secuiesc numele și actele sunt de obicei în maghiară. Dacă un strămoș român trăia într-un sat mixt, caută-l și în registrele scrise în limba vecinilor.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Pornește de la actele din casă și de la ce știu bunicii, apoi cere copii după actele de stare civilă din ultimii 100 de ani. Cu satul și confesiunea aflate, scrie serviciului județean al Arhivelor Naționale și întreabă ce registre are pentru acea parohie. Notează în arbore toate formele unui nume, în română și în maghiară.",
      ] },
    ],
    faq: [
      { q: "De ce actele bunicilor mei din Ardeal sunt în maghiară?", a: "Între 1895 și 1918 starea civilă din Transilvania se ținea în limba maghiară, cu numele traduse. Actele sunt valabile; caută aceeași persoană și sub forma românească a numelui." },
      { q: "Unde sunt registrele greco-catolice?", a: "După 1948 au trecut la alte instituții; multe sunt azi la serviciul județean al Arhivelor Naționale. Întreabă arhiva județului de care ține satul ce are pentru parohia respectivă." },
      { q: "Ce fac dacă nu știu confesiunea familiei?", a: "Caută în actele de stare civilă de după 1895: multe trec religia. Pietrele de mormânt și biserica unde s-au cununat bunicii sunt și ele indicii bune." },
    ],
    guides: ["registrele-greco-catolice", "documente-in-maghiara-si-germana", "conscriptiile-din-transilvania", "urbariile-si-documentele-mosiilor", "cartea-funciara-si-cadastrul-vechi", "registrele-catolice-si-protestante"],
  },
  {
    slug: "banat", name: "Banat",
    title: "Genealogie în Banat: registre, șvabi, graniță militară",
    description: "Cum îți cauți strămoșii din Banat: registrele în germană, maghiară, sârbă și română, coloniștii șvabi, granița militară și arhivele din Timiș și Caraș.",
    h1: "Genealogie în Banat: cum îți cauți strămoșii",
    lead: "Banatul a fost, timp de două secole, unul dintre cele mai amestecate ținuturi ale Europei. Pentru genealogie asta înseamnă registre în mai multe limbi, dar și surse foarte bine păstrate.",
    counties: ["timis", "caras-severin", "arad"],
    nameRegion: "banat", oldNames: ["Bánság (maghiară)", "Banat (germană)", "Banat (sârbă)"],
    body: [
      { h: "De la stăpânirea otomană la împărțirea din 1920", p: [
        "Banatul a intrat sub Habsburgi după 1718. În secolul al XVIII-lea, autoritățile au adus coloniști din ținuturile germane, cunoscuți ca șvabi bănățeni, dar și italieni, francezi, slovaci și bulgari. Românii și sârbii erau deja aici, iar orașele aveau și comunități maghiare și evreiești.",
        "După Primul Război Mondial, Banatul a fost împărțit între România, Serbia și, pentru o mică parte, Ungaria. Unele familii au deci rude și acte și de cealaltă parte a graniței.",
      ] },
      { h: "Registre în multe limbi", p: [
        "Registrele parohiale pot fi în română, sârbă (cu litere chirilice), germană, latină sau maghiară. Parohiile ortodoxe românești și sârbești au avut multă vreme aceeași ierarhie, așa că unele registre românești vechi sunt scrise în limba slavonă sau sârbă. Romano-catolicii, majoritatea șvabilor, au registre în latină și germană.",
        "Starea civilă de stat începe și aici la 1 octombrie 1895, cu registre în maghiară până în 1918. Registrele mai vechi de aproximativ 100 de ani sunt la serviciile județene Timiș și Caraș-Severin ale Arhivelor Naționale.",
      ] },
      { h: "Granița militară", p: [
        "O mare parte din satele din sudul și estul Banatului, cu centrul la Caransebeș, au ținut, din a doua jumătate a secolului al XVIII-lea și până în 1872, de granița militară, cu un regiment de graniță româno-bănățean. Grănicerii erau și țărani, și soldați, iar despre ei s-au ținut liste și registre militare pe lângă cele ale parohiilor.",
        "Dacă familia ta e din Valea Almăjului, de pe Valea Timișului sau din jurul Caransebeșului, merită întrebat la arhivă de fondurile regimentului și ale comunităților de avere care au urmat după desființarea graniței.",
      ] },
      { h: "Familiile șvabe și cărțile lor de familie", p: [
        "Pentru multe sate șvăbești, asociațiile germanilor plecați din Banat au publicat cărți de familie pe localități, care adună toate botezurile, căsătoriile și decesele dintr-un sat. Sunt surse secundare, dar foarte utile ca punct de pornire.",
        "Istoria secolului XX a lăsat urme și în acte: deportarea germanilor în Uniunea Sovietică în 1945, deportările în Bărăgan din 1951, care au atins și sate românești și sârbești de lângă graniță, apoi plecările în Germania. Le poți nota în arbore ca evenimente de viață.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Află satul și confesiunea, apoi limba în care sunt registrele parohiei. Pentru anii de după 1895 cere actele de stare civilă; pentru cei de dinainte, scrie arhivei județului. Ține o listă cu formele numelui în fiecare limbă: Ion, Johann, János și Jovan pot fi același om.",
      ] },
    ],
    faq: [
      { q: "Strămoșii mei erau șvabi. De unde încep?", a: "De la satul din Banat și de la registrele romano-catolice ale parohiei, la arhiva județului. Cărțile de familie publicate pe localități te pot ajuta să urci repede câteva generații." },
      { q: "Ce era granița militară?", a: "O zonă a Imperiului în care familiile erau și țărani, și grăniceri. În Banat a existat din secolul al XVIII-lea până în 1872, cu centrul la Caransebeș, și a lăsat registre militare proprii." },
      { q: "De ce un act românesc vechi e scris cu litere sârbești?", a: "Parohiile ortodoxe românești și sârbești din Banat au avut multă vreme aceeași ierarhie, iar unele registre au fost ținute în sârbă sau slavonă, cu alfabetul chirilic." },
    ],
    guides: ["documente-in-maghiara-si-germana", "registrele-catolice-si-protestante", "registrele-militare", "scrierea-chirilica-romaneasca", "registrele-ortodoxe"],
  },
  {
    slug: "bucovina", name: "Bucovina",
    title: "Genealogie în Bucovina: registre austriece și arhive",
    description: "Cum îți cauți strămoșii din Bucovina: registrele din vremea austriacă, actele în germană, ucraineană și polonă, arhivele din Suceava și Cernăuți.",
    h1: "Genealogie în Bucovina: cum îți cauți strămoșii",
    lead: "Bucovina a fost 143 de ani provincie austriacă. Registrele ei sunt ordonate, dar împărțite azi între două țări: partea de sud e în România, partea de nord în Ucraina.",
    counties: ["suceava"],
    nameRegion: "bucovina", oldNames: ["Bukowina (germană)", "Буковина (ucraineană)", "Cernăuți / Czernowitz"],
    body: [
      { h: "O provincie austriacă între 1775 și 1918", p: [
        "Bucovina a fost luată de Austria din Moldova în 1775 și a rămas austriacă până în 1918. Capitala era Cernăuți (Czernowitz). În ea au trăit români, ucraineni (ruteni), germani, evrei, polonezi, lipoveni, armeni și maghiari, fiecare cu biserica și registrele lui.",
        "În 1940, nordul Bucovinei a fost luat de Uniunea Sovietică și e azi în Ucraina, cu orașul Cernăuți. Sudul, cu Suceava, Rădăuți, Câmpulung Moldovenesc și Gura Humorului, e în România.",
      ] },
      { h: "Registrele bisericești țineau loc de stare civilă", p: [
        "În vremea austriacă, registrele de botez, cununie și înmormântare ale parohiilor erau și registre oficiale. Ele urmau formulare tipărite, cu rubrici clare pentru părinți, nași și casă, ceea ce le face ușor de citit după ce te obișnuiești cu limba.",
        "Limba diferă după comunitate și epocă: română, germană, latină, ucraineană sau polonă. Numele românești pot apărea în ortografie germană, de pildă cu sch pentru ș sau cu tz pentru ț.",
      ] },
      { h: "Unde sunt actele azi", p: [
        "Pentru satele din sudul Bucovinei, registrele vechi sunt de obicei la Serviciul Județean Suceava al Arhivelor Naționale, iar actele mai noi la primării. Pentru satele din nord, registrele sunt în Ucraina, la arhiva regională din Cernăuți.",
        "Multe familii s-au mutat dintr-o parte în alta în 1940 sau după război. Dacă bunicii au venit în România din nordul Bucovinei, actele lor de naștere sunt, cel mai probabil, la Cernăuți, nu la Suceava.",
      ] },
      { h: "Recensăminte și alte surse", p: [
        "Austria a făcut recensăminte în 1869, 1880, 1890, 1900 și 1910; din unele s-au păstrat fișe pe gospodării. Mai există registre militare, liste de școlari și cărți funciare. Pentru germanii din Bucovina, mutați în 1940 în Germania, există și registre ale acestei relocări.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Află dacă satul e azi în România sau în Ucraina, apoi confesiunea familiei. Cere actele mai noi de la primărie și întreabă arhiva județului Suceava ce registre are pentru parohie. Notează numele așa cum apar în fiecare act, în fiecare limbă.",
      ] },
    ],
    faq: [
      { q: "Bunicul s-a născut lângă Cernăuți. Unde îi caut actele?", a: "Registrele satelor din nordul Bucovinei sunt în Ucraina, la arhiva regională din Cernăuți. Actele făcute după mutarea în România sunt la primăriile și arhivele de aici." },
      { q: "În ce limbă sunt registrele din Bucovina?", a: "În română, germană, latină, ucraineană sau polonă, după comunitate și epocă. Rubricile tipărite te ajută să găsești numele chiar dacă nu știi bine limba." },
      { q: "Ce înseamnă numele scris „Schtefan”?", a: "E grafia germană a lui Ștefan. În actele austriece, ș se scrie adesea sch, iar ț se scrie tz sau z." },
    ],
    guides: ["documente-in-maghiara-si-germana", "registrele-ortodoxe", "cum-ceri-copii-de-la-arhive", "recensamintele-vechi", "nume-schimbate-si-variante"],
  },
  {
    slug: "basarabia", name: "Basarabia",
    title: "Genealogie în Basarabia: acte rusești și arhive",
    description: "Cum îți cauți strămoșii din Basarabia: registrele metrice în rusă, recensămintele, deportările și arhiva de la Chișinău, pentru Moldova și Ucraina.",
    h1: "Genealogie în Basarabia: cum îți cauți strămoșii",
    lead: "Între Prut și Nistru, istoria a schimbat granițele de mai multe ori în ultimii două sute de ani. Actele strămoșilor sunt în rusă, română și, uneori, în limbile coloniștilor, iar cele mai multe sunt azi la Chișinău.",
    counties: [],
    nameRegion: "moldova", oldNames: ["Бессарабия (rusă)", "Bessarabien (germană)", "Republica Moldova (azi, în cea mai mare parte)"],
    body: [
      { h: "Granițe care s-au mutat", p: [
        "Basarabia a fost partea de est a Moldovei. În 1812 a fost anexată de Imperiul Rus, între 1918 și 1940 a făcut parte din România, în 1940 a fost ocupată de Uniunea Sovietică, între 1941 și 1944 a revenit la România, apoi a fost din nou sovietică. Azi, cea mai mare parte e Republica Moldova, iar nordul (Hotin) și sudul (Bugeacul) sunt în Ucraina.",
        "Fiecare schimbare a lăsat alte registre, în altă limbă. Pentru același sat poți avea acte în rusă înainte de 1918, în română între războaie și din nou în rusă după 1944.",
      ] },
      { h: "Registrele metrice și recensămintele rusești", p: [
        "În vremea rusă, parohiile țineau registre metrice, cu nașteri și botezuri, căsătorii și decese, de obicei în rusă, cu date după calendarul vechi (iulian). Pentru oamenii de rând există și recensămintele fiscale din secolul al XIX-lea (reviziile), unde familia apare pe gospodării, și recensământul Imperiului Rus din 1897.",
        "Numele românești sunt scrise cu litere rusești și adesea adaptate: Gheorghe poate fi Георгий (Gheorghii), iar numele de familie pot primi terminații rusești. Caută toate formele.",
      ] },
      { h: "Unde sunt actele azi", p: [
        "Cele mai multe registre vechi ale Basarabiei sunt la Arhiva Națională a Republicii Moldova, la Chișinău. Pentru satele care sunt azi în Ucraina, actele sunt la arhivele regionale de la Cernăuți (pentru Hotin) și Odesa (pentru Bugeac). Actele din perioada românească se pot găsi și în arhivele din România.",
        "Mulți urmași ai basarabenilor caută actele strămoșilor și pentru dobândirea cetățeniei române, care cere dovada că un părinte, bunic sau străbunic a fost cetățean român. Pentru asta contează actele din perioada 1918–1940.",
      ] },
      { h: "Deportări, refugiu și coloniști", p: [
        "În 1940–1941 și apoi în 1949 și 1951, zeci de mii de basarabeni au fost deportați în Siberia și Kazahstan; în 1940 și 1944 mulți s-au refugiat în România. Despre deportați există dosare în arhivele de la Chișinău, iar despre refugiați, în arhivele românești.",
        "În sudul Basarabiei au trăit și coloniști germani, bulgari și găgăuzi, cu registrele lor. Germanii basarabeni au fost mutați în Germania în 1940.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Află satul, în ce țară e azi și cum se numea în rusă. Cere actele noi de la starea civilă, apoi caută registrele metrice ale parohiei la arhiva care are județul de atunci. Transcrie numele exact cum apare și notează calendarul fiecărei date.",
      ] },
    ],
    faq: [
      { q: "Unde sunt registrele de botez din Basarabia?", a: "Cele mai multe sunt la Arhiva Națională a Republicii Moldova, la Chișinău. Pentru satele din Ucraina de azi, la arhivele regionale de la Cernăuți și Odesa." },
      { q: "De ce datele din actele vechi nu se potrivesc cu ce știu?", a: "Înainte de 1918, actele rusești foloseau calendarul iulian: 12 zile în urmă în secolul al XIX-lea și 13 după 1900. Notează data așa cum e scrisă și precizează calendarul." },
      { q: "Ce acte îmi trebuie pentru cetățenia română?", a: "Acte care arată legătura dintre tine și un strămoș care a fost cetățean român, de obicei din perioada 1918–1940. Întreabă autoritatea care se ocupă de cetățenie ce documente cere exact." },
    ],
    guides: ["calendarul-iulian-si-gregorian", "registrele-ortodoxe", "recensamintele-vechi", "nume-schimbate-si-variante", "cum-ceri-copii-de-la-arhive"],
  },
  {
    slug: "moldova", name: "Moldova",
    title: "Genealogie în Moldova: mitrici, catagrafii și arhive",
    description: "Cum îți cauți strămoșii din Moldova: mitricile din anii 1830, catagrafiile, actele cu litere chirilice, calendarul vechi și arhivele din Iași și județe.",
    h1: "Genealogie în Moldova: cum îți cauți strămoșii",
    lead: "Moldova dintre Carpați și Prut are registre de stare civilă încă din anii 1830 și liste fiscale și mai vechi. Greutatea e alta: scrisul, alfabetul și calendarul.",
    counties: ["bacau", "botosani", "galati", "iasi", "neamt", "suceava", "vaslui", "vrancea"],
    nameRegion: "moldova", oldNames: ["Țara Moldovei", "Moldau (germană)"],
    body: [
      { h: "Mitricile: registre de la 1832", p: [
        "După Regulamentul Organic, din anii 1830 preoții din Moldova au ținut registre de stare civilă pe parohii, numite mitrici, cu nașteri, cununii și morți. Din decembrie 1865, odată cu Codul civil, registrele au trecut la primării. Așa că pentru multe familii poți urca prin acte oficiale până în prima jumătate a secolului al XIX-lea.",
        "Registrele de dinainte de 1860 sunt scrise de obicei cu litere chirilice românești, iar cele din anii 1860 pot folosi alfabetul de tranziție, cu litere chirilice și latine amestecate. Cu un tabel al literelor alături, se citesc mai ușor decât par.",
      ] },
      { h: "Catagrafiile", p: [
        "Înainte de mitrici, sursa cea mai bună sunt catagrafiile: recensăminte fiscale ale Moldovei, pe sate și pe gospodării. Cele mai cunoscute sunt cele din 1772–1774, 1803, 1820, 1831, 1838 și 1845. Ele trec capul familiei, uneori soția și copiii, starea socială și ce bir plătea.",
        "Catagrafiile sunt la Arhivele Naționale, mai ales la Iași, iar unele au fost publicate. Cu ele poți afla dacă familia era de răzeși, de țărani pe moșia unui boier sau de alt fel.",
      ] },
      { h: "Calendarul vechi și numele", p: [
        "Până în 1919, actele din Moldova folosesc calendarul iulian. O naștere trecută pe 1 ianuarie 1890 e, după calendarul de azi, pe 13 ianuarie. Notează data din act și precizează calendarul.",
        "Multe nume de familie s-au fixat abia în secolul al XIX-lea, din numele tatălui, din poreclă sau din meserie. Același om poate apărea ca Ion sin Vasile, Ion Vasiliu sau Ion Vasilescu.",
      ] },
      { h: "Comunități diferite", p: [
        "În orașele Moldovei au trăit comunități evreiești mari, cu registrele lor, iar în județele Bacău și Neamț trăiesc ceangăii, catolici, cu registre în latină și maghiară. Pentru răzeși există și documente de proprietate care urmăresc spița neamului pe mai multe generații.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Cere actele din ultimii 100 de ani de la primărie, apoi caută mitricile parohiei la serviciul județean al Arhivelor Naționale. Pentru generațiile de dinainte de 1832, caută satul în catagrafii. Nu te speria de chirilice: câteva litere învățate te duc departe.",
      ] },
    ],
    faq: [
      { q: "Ce sunt mitricile?", a: "Registrele de stare civilă ținute de preoți în Moldova și Țara Românească din anii 1830 până în 1865. Sunt la serviciile județene ale Arhivelor Naționale." },
      { q: "Cum citesc un act cu litere chirilice?", a: "Alfabetul chirilic românesc are câteva zeci de litere, multe asemănătoare cu cele latine. Un tabel al literelor și câteva nume cunoscute din același registru te ajută să-l citești." },
      { q: "Ce erau răzeșii?", a: "Țărani liberi din Moldova, stăpâni pe pământ în devălmășie, de obicei urmașii aceluiași strămoș. Documentele lor de proprietate pot păstra spița neamului pe multe generații." },
    ],
    guides: ["catagrafiile-din-moldova-si-tara-romaneasca", "scrierea-chirilica-romaneasca", "calendarul-iulian-si-gregorian", "registrele-de-stare-civila", "registrele-evreiesti"],
  },
  {
    slug: "dobrogea", name: "Dobrogea",
    title: "Genealogie în Dobrogea: coloniști, schimbul din 1940, arhive",
    description: "Cum îți cauți strămoșii din Dobrogea: registrele de după 1878, familiile venite din alte regiuni, aromânii, schimbul de populație din 1940 și arhivele.",
    h1: "Genealogie în Dobrogea: cum îți cauți strămoșii",
    lead: "Dobrogea e o regiune în care multe familii au venit din altă parte. Pentru genealogie, asta înseamnă că arborele pornește aici, dar continuă adesea în Transilvania, în Muntenia, în Cadrilater sau în Balcani.",
    counties: ["constanta", "tulcea"],
    nameRegion: "dobrogea", oldNames: ["Dobrudža (bulgară)", "Dobruca (turcă)"],
    body: [
      { h: "De la stăpânirea otomană la România", p: [
        "Dobrogea a fost secole la rând parte a Imperiului Otoman și a intrat în România în 1878. Din acel moment se aplică aici registrele de stare civilă românești. Pentru perioada otomană, sursele sunt puține și greu de găsit.",
        "După 1878, statul a împărțit pământ coloniștilor, iar în Dobrogea au venit familii din toate regiunile românești, mai ales din Transilvania (mocanii, ciobanii din jurul Sibiului și Săcelelor) și din Muntenia. Dacă familia ta e dobrogeană de câteva generații, întreabă de unde au venit străbunicii.",
      ] },
      { h: "Multe neamuri, multe registre", p: [
        "În Dobrogea au trăit turci, tătari, bulgari, greci, armeni, lipoveni, germani și italieni, alături de români și aromâni. Fiecare comunitate avea biserica sau geamia ei. Lipovenii, foarte numeroși în Delta Dunării, au registre ale bisericii lor de rit vechi, iar germanii dobrogeni au fost mutați în Germania în 1940.",
      ] },
      { h: "Cadrilaterul și schimbul de populație din 1940", p: [
        "Între 1913 și 1940, sudul Dobrogei (Cadrilaterul, cu Durostor și Caliacra) a fost românesc. Aici au fost așezați, în anii 1920–1930, mulți aromâni veniți din Grecia, Albania și Macedonia, dar și coloniști din alte regiuni. Prin tratatul de la Craiova din 1940, Cadrilaterul a trecut la Bulgaria, iar românii de acolo au fost mutați în nordul Dobrogei, în timp ce bulgarii din nord au plecat în sud.",
        "Pentru familiile cu strămoși în Cadrilater, actele dintre 1913 și 1940 pot fi parțial în arhivele românești, iar cele mai vechi, în Bulgaria. Mutarea din 1940 a lăsat și ea liste și dosare de împroprietărire.",
      ] },
      { h: "Unde sunt actele azi", p: [
        "Registrele vechi sunt la serviciile județene Constanța și Tulcea ale Arhivelor Naționale, iar actele mai noi la primării. Pentru satul de origine al unui colonist, caută și în arhiva județului de unde a plecat familia.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Află când a venit familia în Dobrogea și de unde. Cere actele de la primărie pentru ultimii 100 de ani, apoi caută registrele mai vechi în Dobrogea și în locul de origine. Pentru aromâni, notează și numele în forma lor, care poate diferi de cel din actele românești.",
      ] },
    ],
    faq: [
      { q: "Familia mea a venit în Dobrogea din Cadrilater. Unde caut actele?", a: "Actele din 1913–1940 pot fi în arhivele românești, iar cele mai vechi în Bulgaria. Dosarele mutării din 1940 și ale împroprietăririi din nordul Dobrogei sunt și ele surse bune." },
      { q: "De unde au venit coloniștii din Dobrogea?", a: "Din toate regiunile românești, mai ales din Transilvania și Muntenia, dar și aromâni din Balcani. Caută satul de origine: acolo sunt registrele generațiilor de dinainte." },
      { q: "Există registre din perioada otomană?", a: "Puține și greu accesibile. Pentru cele mai multe familii, cercetarea începe cu actele românești de după 1878 și continuă în locul de unde au venit." },
    ],
    guides: ["registrele-de-stare-civila", "cum-ceri-copii-de-la-arhive", "cum-sunt-organizate-arhivele", "nume-schimbate-si-variante", "recensamintele-vechi"],
  },
  {
    slug: "maramures", name: "Maramureș",
    title: "Genealogie în Maramureș: registre, nemeși și arhive",
    description: "Cum îți cauți strămoșii din Maramureș: registrele greco-catolice, actele în latină și maghiară, familiile de nemeși și arhivele din Baia Mare și Sighet.",
    h1: "Genealogie în Maramureș: cum îți cauți strămoșii",
    lead: "Maramureșul istoric e un ținut de sate vechi, cu biserici de lemn și familii care își știu neamul de sute de ani. Multe acte sunt în latină și maghiară, iar o parte din ținut e azi în Ucraina.",
    counties: ["maramures", "satu-mare"],
    nameRegion: "maramures", oldNames: ["Máramaros (maghiară)", "Marmarosch (germană)"],
    body: [
      { h: "Un ținut împărțit de Tisa", p: [
        "Maramureșul istoric a fost un comitat al Regatului Ungariei, pe ambele maluri ale Tisei. Din 1920, partea de la sud de Tisa, cu văile Izei, Marei, Cosăului și Vișeului, e în România, iar partea de nord e în Ucraina. Județul Maramureș de azi cuprinde și alte ținuturi: Chioarul, Lăpușul și zona Băii Mari.",
        "Familiile de pe valea Tisei au adesea rude de ambele părți ale râului. Pentru satele din nord, actele sunt în arhivele din Ucraina.",
      ] },
      { h: "Registre greco-catolice, în latină și maghiară", p: [
        "Cei mai mulți români din Maramureș au fost greco-catolici până în 1948. Registrele parohiilor lor sunt adesea în latină, uneori în maghiară sau în română cu litere chirilice. Starea civilă de stat începe la 1 octombrie 1895, cu registre în maghiară până în 1918.",
        "Registrele vechi sunt la Serviciul Județean Maramureș al Arhivelor Naționale, la Baia Mare, iar unele fonduri privesc Sighetu Marmației și satele din jur. Actele mai noi se cer de la primării.",
      ] },
      { h: "Nemeșii maramureșeni", p: [
        "Maramureșul are multe familii de mica nobilime românească, nemeși, cu diplome primite de la regii Ungariei încă din secolele XIV–XV. Unele familii cunoscute sunt înrudite cu voievozii care au trecut în Moldova. Diplomele și listele de nobili ale comitatului pot arăta genealogii pe multe generații.",
        "Multe nume de familie din Maramureș au și un predicat nobiliar, de felul „de Ieud” sau „de Apșa”, după satul de origine. În actele în maghiară, numele poate fi scris altfel: Pop devine Papp, Ilieș devine Illés.",
      ] },
      { h: "Comunitatea evreiască", p: [
        "Până în 1944, Sighetul și multe sate maramureșene aveau comunități evreiești numeroase, deportate în mai 1944. Pentru urmașii lor, registrele de stare civilă de după 1895 și listele comunităților sunt sursele principale, alături de bazele de date ale institutelor de memorie.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Află satul și dacă e azi în România sau în Ucraina. Cere actele de la primărie, apoi întreabă arhiva de la Baia Mare ce registre are pentru parohie. Notează numele în toate formele, în română, latină și maghiară, și caută familia și în listele de nemeși.",
      ] },
    ],
    faq: [
      { q: "Ce sunt nemeșii din Maramureș?", a: "Familii de mica nobilime românească, cu diplome primite de la regii Ungariei. Diplomele și conscripțiile nobiliare ale comitatului pot păstra genealogia lor pe multe generații." },
      { q: "De ce registrele parohiale sunt în latină?", a: "Biserica greco-catolică, majoritară în Maramureș până în 1948, își ținea adesea registrele în latină. Formulele se repetă, așa că se citesc ușor după câteva pagini." },
      { q: "Satul bunicilor e pe malul drept al Tisei. Unde sunt actele?", a: "Partea de nord a Maramureșului istoric e în Ucraina din 1920, iar registrele acelor sate sunt în arhivele ucrainene." },
    ],
    guides: ["registrele-greco-catolice", "documente-in-latina", "documente-in-maghiara-si-germana", "registrele-evreiesti", "porecle-si-nume-in-sat"],
  },
  {
    slug: "crisana", name: "Crișana",
    title: "Genealogie în Crișana: registre, confesiuni și arhive",
    description: "Cum îți cauți strămoșii din Crișana: registrele greco-catolice, reformate și ortodoxe, actele în maghiară după 1895 și arhivele din Oradea, Arad și Zalău.",
    h1: "Genealogie în Crișana: cum îți cauți strămoșii",
    lead: "Crișana, țara Crișurilor, a fost veacuri la rând parte a Regatului Ungariei, cu sate românești, maghiare și slovace amestecate. Pentru genealogie, asta înseamnă registre în mai multe limbi și o graniță care, din 1920, a tăiat unele familii în două.",
    counties: ["bihor", "arad", "salaj", "satu-mare"],
    nameRegion: "crisana", oldNames: ["Körösvidék (maghiară)", "Partium (latină)", "Kreischgebiet (germană)"],
    body: [
      { h: "Un ținut de graniță", p: [
        "Crișana cuprinde câmpia și dealurile dintre Mureș și Someș: Bihorul, partea de nord a județului Arad, o parte din Sălaj și sudul județului Satu Mare. Oradea a fost sub stăpânire otomană între 1660 și 1692, apoi ținutul a intrat sub Habsburgi, în cadrul Regatului Ungariei. În izvoare apare uneori ca parte din „Partium”, ținuturile de la vest de Transilvania.",
        "După 1920, granița cu Ungaria a trecut prin vechile comitate Bihor și Arad, așa că unele sate ale acestor comitate sunt azi în Ungaria. Dacă satul strămoșilor e aproape de graniță, verifică de ce parte a rămas.",
      ] },
      { h: "Registrele fiecărei confesiuni", p: [
        "Românii din Crișana au fost ortodocși sau greco-catolici; Episcopia greco-catolică de la Oradea a fost înființată în 1777. Maghiarii au fost mai ales reformați (calvini) și romano-catolici, slovacii din satele bihorene catolici sau luterani, iar Oradea și Aradul au avut comunități evreiești mari. Fiecare confesiune își ținea registrele ei, în română, maghiară, latină sau germană.",
        "Starea civilă de stat începe la 1 octombrie 1895, cu registre în maghiară până în 1918 și numele de botez traduse: Ioan apare ca János, Floarea ca Flóra. Registrele mai vechi de aproximativ 100 de ani sunt la serviciile județene ale Arhivelor Naționale.",
      ] },
      { h: "Conscripții și acte de moșie", p: [
        "Pentru vremea de dinainte de registre, Crișana are aceleași surse ca restul Ungariei: conscripțiile fiscale ale comitatelor, conscripția națională din 1828, cu capii de familie pe sate, și urbariile din vremea Mariei Tereza, care arată iobagii fiecărei moșii.",
        "Multe dintre aceste acte au fost scrise în latină și maghiară și sunt păstrate în arhivele județene sau în cele din Ungaria; o parte se pot răsfoi online, pe platformele arhivelor maghiare.",
      ] },
      { h: "Unde sunt actele azi", p: [
        "Registrele vechi sunt la serviciile județene Bihor (Oradea), Arad, Sălaj (Zalău) și Satu Mare ale Arhivelor Naționale. Pentru satele rămase în Ungaria după 1920, întreabă arhivele comitatelor de acolo. Actele de stare civilă mai noi de 100 de ani se cer de la primărie.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Află satul și confesiunea familiei. Cere actele de la primărie, apoi întreabă arhiva județului ce registre are pentru parohia ta. Notează numele în română și în maghiară și caută familia, pentru anii de dinainte de 1850, în conscripții și urbarii.",
      ] },
    ],
    faq: [
      { q: "Ce județe țin de Crișana?", a: "Bihorul, partea de nord a județului Arad, o parte din Sălaj și sudul județului Satu Mare. Granițele regiunilor istorice nu se potrivesc exact cu cele ale județelor de azi." },
      { q: "De ce numele bunicilor sunt scrise ungurește în acte?", a: "Între 1895 și 1918 starea civilă se ținea în maghiară, cu numele de botez traduse. Caută aceeași persoană și sub forma românească a numelui." },
      { q: "Satul străbunicilor a rămas în Ungaria. Unde caut?", a: "La arhivele comitatelor din Ungaria. Registrele parohiale ale satelor românești de acolo pot fi și la bisericile lor sau la episcopii." },
    ],
    guides: ["registrele-greco-catolice", "registrele-catolice-si-protestante", "documente-in-maghiara-si-germana", "urbariile-si-documentele-mosiilor", "registrele-evreiesti"],
  },
  {
    slug: "muntenia", name: "Muntenia",
    title: "Genealogie în Muntenia: condici, catagrafii și arhive",
    description: "Cum îți cauți strămoșii din Muntenia: registrele de la Regulamentul Organic, catagrafiile din 1831 și 1838, moșnenii, împroprietăririle și arhivele.",
    h1: "Genealogie în Muntenia: cum îți cauți strămoșii",
    lead: "Muntenia, partea Țării Românești de la est de Olt, are registre de stare civilă din anii 1830 și liste de gospodării și mai vechi. Greutatea e scrisul cu litere chirilice și calendarul vechi.",
    counties: ["arges", "braila", "bucuresti", "buzau", "calarasi", "dambovita", "giurgiu", "ialomita", "ilfov", "olt", "prahova", "teleorman"],
    nameRegion: "muntenia", oldNames: ["Țara Românească", "Valahia", "Walachei (germană)"],
    body: [
      { h: "Registrele de după Regulamentul Organic", p: [
        "După Regulamentul Organic, din anii 1830 preoții din Țara Românească au ținut, pe parohii, registre de stare civilă cu nașteri, cununii și morți. Din decembrie 1865, odată cu Codul civil, registrele au trecut la primării. Pentru multe familii din Muntenia se poate urca prin acte oficiale până în prima jumătate a secolului al XIX-lea.",
        "Registrele de până în anii 1860 sunt scrise de obicei cu litere chirilice românești, iar cele din anii 1860 cu alfabetul de tranziție. Până în 1919 datele sunt după calendarul iulian, cu 12 zile în urmă în secolul al XIX-lea și 13 după 1900.",
      ] },
      { h: "Catagrafiile", p: [
        "Pentru generațiile de dinainte de registre, sursa principală sunt catagrafiile, recensămintele fiscale pe sate și gospodării. Cele mai folosite în Muntenia sunt cele din 1831 și 1838; există și liste mai vechi, din vremea ocupațiilor rusești. Ele trec capul familiei, uneori soția, copiii și vârstele, starea socială și ce bir plătea.",
        "Catagrafiile Țării Românești sunt păstrate în cea mai mare parte la Arhivele Naționale Istorice Centrale, la București, iar unele au fost publicate pe județe.",
      ] },
      { h: "Moșneni, clăcași și împroprietăriri", p: [
        "În satele de deal și de munte trăiau moșnenii, țărani liberi care stăpâneau pământul în devălmășie, ca urmași ai unui strămoș comun; actele lor de hotărnicie pot păstra spița neamului pe multe generații. La câmpie, cei mai mulți țărani erau clăcași pe moșiile boierilor și ale mănăstirilor.",
        "Legea rurală din 1864 și reforma agrară din 1921 au lăsat liste și dosare de împroprietărire, pe sate, cu numele capilor de familie. Sunt surse foarte bune pentru a lega între ele generațiile din a doua jumătate a secolului al XIX-lea și de la începutul secolului XX.",
      ] },
      { h: "București și comunitățile", p: [
        "Bucureștiul a atras oameni din toată țara. Registrele lui sunt la Serviciul Municipiului București al Arhivelor Naționale, iar pentru o familie venită din provincie merită căutat satul de origine. În Muntenia au trăit și comunități de bulgari, greci, evrei, armeni și catolici, cu registrele bisericilor și sinagogilor lor.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Cere actele din ultimii 100 de ani de la primărie, apoi caută registrele parohiei la serviciul județean al Arhivelor Naționale. Pentru anii de dinainte de 1830, caută satul în catagrafii. Notează datele așa cum sunt scrise și precizează calendarul.",
      ] },
    ],
    faq: [
      { q: "Ce sunt catagrafiile din 1838?", a: "Recensăminte fiscale ale Țării Românești, pe sate și gospodării, cu capul familiei și adesea membrii ei. Sunt în cea mai mare parte la Arhivele Naționale Istorice Centrale." },
      { q: "Ce erau moșnenii?", a: "Țărani liberi din Țara Românească, care stăpâneau pământul în devălmășie ca urmași ai aceluiași strămoș. Hotărniciile moșiilor lor pot păstra genealogii lungi." },
      { q: "Unde găsesc listele de împroprietărire?", a: "Tabelele din 1864 și dosarele reformei agrare din 1921 sunt de obicei la serviciile județene ale Arhivelor Naționale; întreabă arhiva județului de care ținea satul." },
    ],
    guides: ["catagrafiile-din-moldova-si-tara-romaneasca", "registrele-de-stare-civila", "scrierea-chirilica-romaneasca", "calendarul-iulian-si-gregorian", "registrele-ortodoxe", "testamente-si-acte-de-mostenire"],
  },
  {
    slug: "oltenia", name: "Oltenia",
    title: "Genealogie în Oltenia: moșneni, catagrafii și arhive",
    description: "Cum îți cauți strămoșii din Oltenia: registrele din anii 1830, catagrafiile, moșnenii din Gorj și Vâlcea, anii austrieci 1718–1739 și arhiva de la Craiova.",
    h1: "Genealogie în Oltenia: cum îți cauți strămoșii",
    lead: "Oltenia, partea Țării Românești de la vest de Olt, e ținutul moșnenilor, al satelor de deal cu neamuri vechi și al Craiovei. Are aceleași registre ca Muntenia, plus câteva surse numai ale ei.",
    counties: ["dolj", "gorj", "mehedinti", "olt", "valcea"],
    nameRegion: "oltenia", oldNames: ["Valahia Mică", "Kleine Walachei (germană)", "Banatul Craiovei"],
    body: [
      { h: "Anii austrieci și Banatul Craiovei", p: [
        "Între 1718 și 1739, după pacea de la Passarowitz, Oltenia a fost sub administrația Habsburgilor, ca „Valahia Mică”. Administrația austriacă a făcut atunci liste ale satelor și ale locuitorilor, unele publicate de istorici, care pot arăta satele și capii de familie cu mai bine de un secol înainte de registrele de stare civilă.",
        "Înainte și după acești ani, Oltenia a fost condusă de banii Craiovei, iar actele vechi ale ținutului vorbesc despre „Banatul Craiovei”.",
      ] },
      { h: "Registre și catagrafii", p: [
        "Ca în toată Țara Românească, din anii 1830 preoții au ținut registre de stare civilă pe parohii, iar din decembrie 1865 primăriile. Registrele vechi sunt scrise cu litere chirilice sau cu alfabetul de tranziție, cu datele după calendarul iulian până în 1919.",
        "Pentru generațiile de dinainte, catagrafiile din 1831 și 1838 trec gospodăriile pe sate. Ele sunt în cea mai mare parte la Arhivele Naționale Istorice Centrale, la București.",
      ] },
      { h: "Moșnenii din Gorj, Vâlcea și Mehedinți", p: [
        "În satele de sub munte ale Olteniei, o mare parte din țărani au fost moșneni: stăpâni pe pământ în devălmășie, împărțit pe „bătrâni”, adică pe urmașii câte unui strămoș. Hotărniciile și actele de împărțeală ale acestor moșii arată adesea cine din cine se trage, pe multe generații.",
        "Dacă familia ta vine dintr-un sat de moșneni, întreabă de actele moșiei: uneori au rămas la familii, alteori au ajuns la arhivă sau la judecătorie.",
      ] },
      { h: "Unde sunt actele azi", p: [
        "Registrele vechi sunt la serviciile județene Dolj (Craiova), Gorj, Mehedinți, Olt și Vâlcea ale Arhivelor Naționale. Județul Olt de azi cuprinde și sate de la est de Olt, care țineau de Muntenia. Actele mai noi de 100 de ani se cer de la primărie.",
      ] },
      { h: "Cum lucrezi pas cu pas", p: [
        "Cere actele de la primărie, apoi registrele parohiei de la arhiva județului. Cu satul aflat, caută familia în catagrafiile din 1831 și 1838, iar dacă e un sat de moșneni, în actele moșiei. Notează datele cu calendarul lor.",
      ] },
    ],
    faq: [
      { q: "Ce sunt „bătrânii” din actele de moșneni?", a: "Părțile în care se împărțea o moșie de moșneni, fiecare a urmașilor unui strămoș. Numele bătrânului e adesea și numele de neam al familiilor de azi." },
      { q: "Există acte din vremea stăpânirii austriece?", a: "Da, administrația austriacă din 1718–1739 a făcut liste ale satelor și ale locuitorilor; unele au fost publicate de istorici. Întreabă și arhiva județului." },
      { q: "Județul Olt ține de Oltenia?", a: "În mare parte, da, dar județul de azi cuprinde și sate de la est de râul Olt, care istoric țineau de Muntenia." },
    ],
    guides: ["catagrafiile-din-moldova-si-tara-romaneasca", "registrele-de-stare-civila", "scrierea-chirilica-romaneasca", "testamente-si-acte-de-mostenire", "calendarul-iulian-si-gregorian"],
  },
];

export const getGenRegion = (slug: string) => GEN_REGIONS.find((r) => r.slug === slug) ?? null;

/** Cuvintele scrise anume pentru regiune (fără listele făcute din date). */
export const regionWords = (r: GenRegion) => [r.lead, ...r.body.flatMap((b) => [b.h, ...b.p]), ...r.faq.flatMap((f) => [f.q, f.a])].join(" ").split(/\s+/).filter(Boolean).length;
