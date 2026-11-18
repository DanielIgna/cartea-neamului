import type { Step } from "./rudenie";

/**
 * Paginile /unelte/rudenie/<relație> (planul SEO, 18.11.2026): o pagină scurtă, scrisă de mână, pentru fiecare relație
 * căutată des („ce este cuscrul”, „văr de-al doilea”). Gradele urmează Codul civil (art. 406–407), ca în calculator.
 * Fișier fără importuri de pe server.
 */
export type KinPage = {
  slug: string; name: string; title: string; description: string; h1: string; lead: string;
  /** Drumul din calculator care duce la relația asta (pentru butonul „Vezi în calculator”). */
  path: Step[];
  degree: string;
  body: { h: string; p: string[] }[];
  faq: { q: string; a: string }[];
  related: string[];
};

export const TOOLS_HUB = "/unelte";
export const KIN_CALC = "/unelte/calculator-grad-de-rudenie";
export const kinPagePath = (p: Pick<KinPage, "slug">) => `/unelte/rudenie/${p.slug}`;
export const TOOLS_UPDATED = new Date("2026-11-18T00:00:00Z");

export const KIN_PAGES: KinPage[] = [
  {
    slug: "var-primar", name: "Văr primar",
    title: "Vărul primar: ce rudă e și ce grad de rudenie are",
    description: "Cine e vărul primar, de ce e rudă de gradul IV în linie colaterală și cum îl deosebești de vărul de-al doilea. Cu exemplu pas cu pas.",
    h1: "Vărul primar: ce rudă e și ce grad are",
    lead: "Vărul primar e copilul unchiului sau al mătușii tale. Aveți în comun bunicii, iar legea vă socotește rude de gradul al patrulea.",
    path: ["tata", "frate", "fiu"], degree: "gradul IV, linie colaterală",
    body: [
      { h: "Cum se numără gradul", p: [
        "Gradul de rudenie colaterală se numără urcând de la tine până la strămoșul comun și coborând apoi până la cealaltă rudă. Cu vărul primar, strămoșii comuni sunt bunicii: urci la părinte (1), la bunic (2), cobori la unchi (3) și la văr (4). Rezultă gradul IV.",
        "În vorbire, „văr primar” și „văr de gradul întâi” înseamnă același lucru. Legea nu folosește însă „gradul întâi” pentru veri: în Codul civil, verii primari sunt rude de gradul IV.",
      ] },
      { h: "Văr primar, văr de-al doilea", p: [
        "Vărul de-al doilea e copilul unui văr primar al părintelui tău. Strămoșii comuni sunt străbunicii, așa că urci trei trepte și cobori trei: gradul VI. Copilul vărului tău primar nu e văr de-al doilea pentru tine, ci „nepot de văr”, rudă de gradul V.",
      ] },
      { h: "Vărul primar în arbore și în acte", p: [
        "În arborele genealogic, verii primari apar pe același rând, sub doi frați diferiți. În registrele vechi îi recunoști după bunicii comuni: în actele de botez din satele unde se țineau evidențe bune apar adesea numele bunicilor, iar verii pot fi și nași unii altora.",
        "Mulți oameni își descoperă verii primari abia când fac arborele. Pornește de la frații părinților tăi și scrie copiii fiecăruia: în câteva minute ai toată generația ta.",
      ] },
    ],
    faq: [
      { q: "Vărul primar e rudă de gradul 4?", a: "Da. În linie colaterală se numără treptele până la bunicii comuni și înapoi: 2 + 2 = gradul IV." },
      { q: "Ce e vara primară?", a: "Fiica unchiului sau a mătușii tale. Relația și gradul sunt aceleași ca la vărul primar." },
      { q: "Copiii verilor primari sunt veri de-al doilea între ei?", a: "Da. Copiii a doi veri primari au în comun străbunicii și sunt veri de-al doilea, rude de gradul VI." },
    ],
    related: ["var-de-al-doilea", "nepot-de-var", "unchi-mare"],
  },
  {
    slug: "var-de-al-doilea", name: "Văr de-al doilea",
    title: "Vărul de-al doilea: cine e și ce grad de rudenie are",
    description: "Vărul de-al doilea e copilul vărului primar al părintelui tău. Aveți aceiași străbunici și sunteți rude de gradul VI. Cu exemplu și diferențe.",
    h1: "Vărul de-al doilea: cine e și ce grad are",
    lead: "Vărul de-al doilea e copilul unui văr primar al mamei sau al tatălui tău. Strămoșii comuni sunt străbunicii, iar gradul de rudenie e al șaselea.",
    path: ["tata", "tata", "frate", "fiu", "fiu"], degree: "gradul VI, linie colaterală",
    body: [
      { h: "Cum se numără", p: [
        "Urci de la tine la părinte (1), la bunic (2), la străbunic (3), apoi cobori pe ramura celuilalt: fratele bunicului (4), copilul lui (5), nepotul lui, adică vărul tău de-al doilea (6). Gradul VI, în linie colaterală.",
        "Uneori i se spune „văr de gradul doi”. E o expresie din vorbire: juridic, vărul de-al doilea e rudă de gradul VI, nu II.",
      ] },
      { h: "Cu cine se confundă", p: [
        "Vărul de-al doilea nu e copilul vărului tău primar. Acela e „nepot de văr”, cu o generație mai jos decât tine, rudă de gradul V. Vărul de-al doilea e pe aceeași generație cu tine.",
        "Nici vărul părintelui tău nu e văr de-al doilea pentru tine: e o generație mai sus, rudă de gradul V.",
      ] },
      { h: "De ce contează în arbore", p: [
        "La verii de-al doilea, multe familii pierd firul: oamenii nu se mai cunosc, iar numele de familie pot fi diferite. Un arbore cu toți descendenții străbunicilor îi aduce din nou laolaltă, de pildă la o reuniune de familie.",
      ] },
    ],
    faq: [
      { q: "Verii de-al doilea sunt rude de sânge?", a: "Da, au aceiași străbunici. Sunt rude de gradul VI, în linie colaterală." },
      { q: "Vărul de-al doilea e același lucru cu vărul de gradul 2?", a: "În vorbire, da. Juridic însă gradul se numără altfel, iar vărul de-al doilea e rudă de gradul VI." },
      { q: "Ce e vărul de-al treilea?", a: "Copilul unui văr de-al doilea al părintelui tău. Aveți în comun stră-străbunicii și sunteți rude de gradul VIII." },
    ],
    related: ["var-primar", "nepot-de-var", "unchi-mare"],
  },
  {
    slug: "nepot-de-var", name: "Nepot de văr",
    title: "Nepotul de văr: copilul vărului primar, ce grad are",
    description: "Copilul vărului tău primar e nepot de văr, cu o generație sub tine, și rudă de gradul V. Cum se numără și de ce nu e văr de-al doilea.",
    h1: "Nepotul de văr: cine e și ce grad are",
    lead: "Copilul vărului sau al verei tale primare e „nepot de văr”. E cu o generație mai tânăr decât tine și e rudă de gradul al cincilea.",
    path: ["tata", "frate", "fiu", "fiu"], degree: "gradul V, linie colaterală",
    body: [
      { h: "Cum se numără", p: [
        "Strămoșii comuni sunt bunicii tăi. Urci la părinte (1) și la bunic (2), apoi cobori la unchi (3), la vărul primar (4) și la copilul lui (5). Gradul V.",
        "Din partea lui, tu ești „unchi” sau „mătușă” de-al doilea, adică vărul sau vara părintelui său. În multe sate li se spune simplu „unchi” și „mătușă”.",
      ] },
      { h: "De ce nu e văr de-al doilea", p: [
        "Vărul de-al doilea e pe aceeași generație cu tine și are în comun cu tine străbunicii. Nepotul de văr e cu o generație mai jos și are în comun cu tine bunicii. Cele două relații se confundă des, mai ales când vârstele sunt apropiate.",
        "Copiii tăi și copiii vărului tău primar sunt între ei veri de-al doilea.",
      ] },
      { h: "În arbore", p: [
        "Când adaugi copiii verilor primari, arborele începe să se lățească repede. Merită să ceri ajutorul verilor: fiecare își cunoaște cel mai bine ramura și o poate completa singur. Așa nu se pierd nici numele copiilor născuți departe, în alte orașe sau în alte țări.",
      ] },
    ],
    faq: [
      { q: "Copilul vărului primar e văr de-al doilea?", a: "Nu pentru tine. E nepot de văr, rudă de gradul V. Vărul de-al doilea e copilul vărului primar al părintelui tău." },
      { q: "Ce sunt între ei copiii a doi veri primari?", a: "Veri de-al doilea, rude de gradul VI." },
      { q: "Cum îmi spune copilul vărului meu?", a: "În vorbire, de obicei „unchi” sau „mătușă”. Exact ar fi „vărul (vara) părintelui”." },
    ],
    related: ["var-primar", "var-de-al-doilea", "unchi-mare"],
  },
  {
    slug: "unchi-mare", name: "Unchi mare",
    title: "Unchiul mare: fratele bunicului, ce grad de rudenie are",
    description: "Unchiul mare e fratele bunicului sau al bunicii, iar mătușa mare e sora lor. Sunt rude de gradul IV. Cum se numără și cum apar în arbore.",
    h1: "Unchiul mare și mătușa mare: cine sunt și ce grad au",
    lead: "Unchiul mare e fratele bunicului sau al bunicii tale, iar mătușa mare e sora lor. Sunt rude de gradul al patrulea, la fel ca verii primari.",
    path: ["tata", "tata", "frate"], degree: "gradul IV, linie colaterală",
    body: [
      { h: "Cum se numără", p: [
        "Strămoșii comuni sunt străbunicii tăi, părinții bunicului. Urci la părinte (1), la bunic (2), la străbunic (3), apoi cobori la fratele bunicului (4). Gradul IV, în linie colaterală.",
        "În unele zone li se spune „unchiul bătrân”, „moșul” sau „tușa mare”. Cuvintele diferă de la o regiune la alta, dar relația e aceeași.",
      ] },
      { h: "De ce sunt importanți pentru arbore", p: [
        "Frații bunicilor sunt adesea ultimii care mai știu numele străbunicilor, satele din care veneau și poveștile neamului. Dacă mai trăiesc, merită întrebați cât mai curând.",
        "Copiii lor sunt verii primari ai părinților tăi, iar nepoții lor sunt verii tăi de-al doilea. Întreabă-i și de pozele vechi: de multe ori, fotografiile de familie au rămas la frații bunicilor, nu la bunici, și pe spatele lor sunt scrise nume și ani.",
      ] },
      { h: "În acte", p: [
        "În registrele de botez și de cununie, unchii mari apar des ca nași sau martori. Un nume care revine mereu pe lângă familia ta poate fi un frate al bunicului, cu alt nume de familie dacă e vorba de partea bunicii.",
      ] },
    ],
    faq: [
      { q: "Fratele bunicului e rudă de gradul 4?", a: "Da. Se urcă trei trepte până la străbunicii comuni și se coboară una: gradul IV." },
      { q: "Cum se numește soția unchiului mare?", a: "Mătușă mare prin alianță. Nu e rudă de sânge cu tine, ci prin căsătoria cu fratele bunicului." },
      { q: "Ce sunt pentru mine copiii unchiului mare?", a: "Verii primari ai părinților tăi, rude de gradul V cu tine." },
    ],
    related: ["var-primar", "var-de-al-doilea", "nepot-de-var"],
  },
  {
    slug: "cumnat", name: "Cumnat",
    title: "Cumnatul: cine e și ce fel de rudenie e",
    description: "Cumnatul e fratele soțului sau al soției, ori soțul surorii tale. E rudenie prin alianță (afinitate), de gradul II. Explicat pe înțeles.",
    h1: "Cumnatul: cine e și ce fel de rudenie e",
    lead: "Cumnat îi spui fratelui soțului sau al soției tale, dar și soțului surorii tale. Nu e rudă de sânge, ci rudă prin alianță, de gradul al doilea.",
    path: ["sotie", "frate"], degree: "afinitate, gradul II",
    body: [
      { h: "Rudenie prin alianță", p: [
        "Codul civil numește afinitate legătura dintre un soț și rudele celuilalt soț. Afinii sunt în aceeași linie și în același grad ca rudenia cu soțul: fratele soției e rudă de gradul II cu ea, deci afin de gradul II cu tine.",
        "Soțul surorii tale e, la rândul lui, afinul tău: tu ești rudă de gradul II cu soția lui.",
      ] },
      { h: "Câte feluri de cumnați există", p: [
        "Fratele soției sau al soțului, soțul surorii tale și, în vorbire, uneori și soțul surorii soției. Cei doi bărbați căsătoriți cu două surori își spun „cumnați”, deși legea nu-i socotește afini între ei, pentru că afinitatea nu trece de la un afin la altul.",
      ] },
      { h: "În arbore", p: [
        "În arbore, cumnații apar prin căsătorii: fratele soției pe ramura ei, soțul surorii lângă sora ta. Nu le crea o legătură separată, ci adaugă căsătoria potrivită, iar relația reiese singură.",
        "Copiii cumnatului sunt nepoții soției tale de frate. Pentru tine sunt nepoți prin alianță, dar copiii tăi și ai lor sunt veri primari, rude de sânge de gradul IV.",
      ] },
    ],
    faq: [
      { q: "Cumnatul e rudă de sânge?", a: "Nu. E rudă prin alianță (afin), legătură creată prin căsătorie." },
      { q: "Ce grad de afinitate are cumnatul?", a: "Gradul II, același grad pe care îl are fratele cu soțul sau soția ta." },
      { q: "Afinitatea se pierde la divorț?", a: "După lege, afinitatea încetează prin desfacerea căsătoriei. În multe familii, oamenii își spun însă cumnați și după aceea." },
    ],
    related: ["cumnata", "socru", "cuscru"],
  },
  {
    slug: "cumnata", name: "Cumnată",
    title: "Cumnata: cine e și ce grad de afinitate are",
    description: "Cumnata e sora soțului sau a soției, ori soția fratelui tău. E rudă prin alianță de gradul II, nu rudă de sânge. Cu exemple simple.",
    h1: "Cumnata: cine e și ce fel de rudenie e",
    lead: "Cumnată îi spui surorii soțului sau a soției tale și soției fratelui tău. Legătura vine din căsătorie și se numește afinitate, de gradul al doilea.",
    path: ["frate", "sotie"], degree: "afinitate, gradul II",
    body: [
      { h: "De unde vine gradul", p: [
        "Sora soției e rudă de gradul II cu soția ta; după lege, rudele unui soț sunt afinii celuilalt în același grad. De aceea cumnata e afină de gradul II cu tine. Soția fratelui e afină de gradul II pentru că tu ești rudă de gradul II cu soțul ei.",
      ] },
      { h: "Cumnata în casele de altădată", p: [
        "În satul tradițional, nora venea de obicei să trăiască în casa socrilor, așa că soțiile fraților ajungeau să locuiască sub același acoperiș. Multe povești de familie despre „cumnate” vin din anii aceia, iar numele lor de fată se găsesc în actele de cununie.",
        "Când cauți în registre, ține minte că o cumnată apare cu numele de familie al soțului după căsătorie și cu numele tatălui ei înainte.",
      ] },
      { h: "În arbore", p: [
        "Adaugă cumnata ca soție a fratelui tău sau ca soră pe ramura soțului. Copiii ei și ai fratelui tău sunt nepoții tăi de frate, rude de sânge cu tine, chiar dacă ea e doar afină.",
      ] },
    ],
    faq: [
      { q: "Soția fratelui meu e cumnata mea?", a: "Da. E afina ta de gradul II." },
      { q: "Copiii cumnatei sunt rudele mele?", a: "Copiii ei cu fratele tău sunt nepoții tăi de frate, rude de sânge de gradul III. Copiii ei dintr-o altă căsătorie nu sunt rudele tale." },
      { q: "Cumnatele sunt rude între ele?", a: "Două femei căsătorite cu doi frați nu sunt afine între ele după lege, deși în vorbire își spun cumnate." },
    ],
    related: ["cumnat", "socru", "cuscru"],
  },
  {
    slug: "cuscru", name: "Cuscru",
    title: "Cuscrul și cuscra: cine sunt și dacă sunt rude",
    description: "Cuscrii sunt părinții celor doi soți, unii față de alții. Nu sunt rude după lege, dar cuscria lega două neamuri. Cum îi găsești în acte.",
    h1: "Cuscrul și cuscra: cine sunt și dacă sunt rude",
    lead: "Cuscrii sunt părinții mirelui și părinții miresei, unii față de ceilalți. Legea nu-i socotește rude, dar în familie cuscria a contat mereu mult.",
    path: ["fiu", "sotie", "mama"], degree: "fără grad (nu e rudenie după lege)",
    body: [
      { h: "De ce cuscrii nu au grad", p: [
        "Afinitatea leagă un soț de rudele celuilalt soț. Părinții mirelui sunt afinii miresei (socrii ei), iar părinții miresei sunt afinii mirelui. Între cele două perechi de părinți nu există însă nici rudenie de sânge, nici afinitate, așa că legea nu le dă un grad.",
      ] },
      { h: "Cuscria în satul vechi", p: [
        "O nuntă lega două neamuri, iar cuscrii își dădeau ajutor la muncile câmpului, la botezuri și la necazuri. Între familiile încuscrite se făceau des și alte căsătorii sau înrudiri prin nași, așa că aceleași nume revin în registrele satului, de la o generație la alta.",
        "Dacă vezi în actele de botez nași cu numele familiei unei bunici, poate fi vorba de cuscri sau de urmașii lor.",
      ] },
      { h: "În arbore", p: [
        "Cuscrii apar în arbore ca părinți ai ginerelui sau ai nurorii. Nu au nevoie de o legătură separată: căsătoria copiilor îi pune față în față.",
        "Nepoții comuni îi leagă însă pe cuscri pentru totdeauna: un copil născut din cei doi soți are de o parte bunicii dinspre tată, de cealaltă bunicii dinspre mamă. Într-un arbore al familiei, ambele perechi apar pe același rând, iar copilul le poate cunoaște poveștile.",
      ] },
    ],
    faq: [
      { q: "Cuscrii sunt rude?", a: "Nu după lege. Sunt părinții celor doi soți, legați prin căsătoria copiilor." },
      { q: "Ce e cuscra?", a: "Mama soțului sau a soției copilului tău." },
      { q: "Ce e cuscria?", a: "Legătura dintre două familii prin căsătoria copiilor lor." },
    ],
    related: ["socru", "ginere-si-nora", "cumnat"],
  },
  {
    slug: "socru", name: "Socru",
    title: "Socrul și soacra: ce grad de afinitate au",
    description: "Socrul și soacra sunt părinții soțului sau ai soției. Sunt afini de gradul I, în linie dreaptă. Ce înseamnă asta și cum apar în acte.",
    h1: "Socrul și soacra: ce fel de rudenie sunt",
    lead: "Socrii sunt părinții soțului sau ai soției tale. Sunt rude prin alianță (afini) de gradul întâi, în linie dreaptă.",
    path: ["sotie", "tata"], degree: "afinitate, gradul I, linie dreaptă",
    body: [
      { h: "Gradul socrilor", p: [
        "Soția ta e rudă de gradul I cu părinții ei. După lege, rudele unui soț sunt afinii celuilalt soț în aceeași linie și în același grad, așa că socrii sunt afinii tăi de gradul I, în linie dreaptă.",
        "Pentru socri, tu ești ginerele sau nora lor: aceeași legătură, privită din partea cealaltă.",
      ] },
      { h: "Socrii în actele vechi", p: [
        "În actele de cununie apar de obicei părinții ambilor miri. De aceea un singur act de căsătorie îți dă două perechi de strămoși: părinții mirelui și părinții miresei, adică socrii unuia dintre ei.",
        "În satele unde mirele se muta în casa miresei, i se spunea „ginere în casă”, iar în acte poate apărea lângă socri.",
      ] },
      { h: "În arbore", p: [
        "Socrii apar ca părinții soțului sau ai soției. Dacă adaugi și ramura lor, copiii voștri își văd ambele neamuri în același arbore.",
        "Socrii sunt adesea cei care știu cel mai bine istoria celeilalte jumătăți a familiei: satele, nașii, numele de fată ale bunicilor. O seară la masă cu ei, cu un arbore deschis, aduce de obicei zeci de nume noi.",
      ] },
    ],
    faq: [
      { q: "Socrul e rudă de gradul 1?", a: "E afin de gradul I, în linie dreaptă: rudenie prin alianță, nu de sânge." },
      { q: "Socrii rămân afini după divorț?", a: "După lege, afinitatea încetează prin desfacerea căsătoriei." },
      { q: "Cum se numesc părinții soției pentru părinții mei?", a: "Cuscri. Ei nu sunt rude între ei după lege." },
      { q: "Frații soției sunt rudele mele?", a: "Sunt cumnații tăi, afini de gradul II: rude prin alianță, nu de sânge." },
    ],
    related: ["ginere-si-nora", "cuscru", "cumnat"],
  },
  {
    slug: "ginere-si-nora", name: "Ginere și noră",
    title: "Ginerele și nora: ce grad de afinitate au",
    description: "Ginerele e soțul fiicei, iar nora e soția fiului. Sunt afini de gradul I, în linie dreaptă. Cum se numără și cum apar în acte și în arbore.",
    h1: "Ginerele și nora: ce fel de rudenie sunt",
    lead: "Ginerele e soțul fiicei tale, iar nora e soția fiului tău. Sunt rude prin alianță de gradul întâi, în linie dreaptă.",
    path: ["fiu", "sotie"], degree: "afinitate, gradul I, linie dreaptă",
    body: [
      { h: "Gradul", p: [
        "Fiul tău e rudă de gradul I cu tine; soția lui e deci afina ta de gradul I, în linie dreaptă. La fel ginerele, prin fiica ta. Pentru ei, tu ești socrul sau soacra.",
      ] },
      { h: "Nora în casa socrilor", p: [
        "În multe sate românești, nora se muta în casa părinților soțului, iar ginerele mergea „în casă” la socri doar când familia miresei nu avea fii. De aici vin multe schimbări de nume și de gospodărie pe care le vezi în acte: o familie poate apărea pe o casă care a fost a socrilor.",
        "Ca să găsești numele de fată al unei nurori, caută actul ei de cununie: acolo apare cu numele tatălui ei.",
      ] },
      { h: "În arbore", p: [
        "Ginerele și nora intră în arbore prin căsătorie, lângă fiica sau fiul tău. Părinții lor sunt cuscrii tăi, iar copiii lor sunt nepoții tăi de sânge.",
        "Invită-i și pe ei să scrie în arbore: ginerele și nora aduc cu ei un neam întreg, iar nepoții voștri vor vrea să știe mai târziu de unde vin ambele familii.",
      ] },
    ],
    faq: [
      { q: "Nora e rudă de gradul 1?", a: "E afină de gradul I, în linie dreaptă, nu rudă de sânge." },
      { q: "Cum se numește soțul nepoatei mele?", a: "În vorbire, „ginerele nepoatei” sau „soțul nepoatei”; legea îl socotește afin în gradul în care e nepoata rudă cu tine." },
      { q: "Ce sunt părinții nurorii pentru mine?", a: "Cuscri: părinții nurorii și ai tăi nu sunt rude între ei după lege." },
      { q: "Ginerele moștenește de la socri?", a: "Afinii nu sunt moștenitori legali. Moștenesc copiii și, prin ei, nepoții; ginerele și nora pot primi doar prin testament." },
    ],
    related: ["socru", "cuscru", "cumnata"],
  },
];

export const getKinPage = (slug: string) => KIN_PAGES.find((p) => p.slug === slug) ?? null;
export const kinWords = (p: KinPage) => [p.lead, ...p.body.flatMap((b) => [b.h, ...b.p]), ...p.faq.flatMap((f) => [f.q, f.a])].join(" ").split(/\s+/).filter(Boolean).length;
