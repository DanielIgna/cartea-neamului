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
export const TOOLS_UPDATED = new Date("2026-11-25T00:00:00Z");

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
    title: "Cumnat: ce înseamnă și ce rudă îți este cumnatul",
    description: "Cumnatul e fratele soțului sau al soției tale, ori soțul surorii tale. Nu e rudă de sânge, ci afin de gradul II. Explicat simplu, cu exemple.",
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
  // Aprobate de Daniel la 19.11.2026 (erau ciorne în KIN_DRAFTS).
  {
    slug: "strabunic", name: "Străbunic",
    title: "Străbunicul: ce rudă e și ce grad de rudenie are",
    description: "Străbunicul e părintele bunicului sau al bunicii tale. E rudă de gradul III în linie dreaptă. Câți străbunici ai și cum le afli numele.",
    h1: "Străbunicul și străbunica: cine sunt și ce grad au",
    lead: "Străbunicii sunt părinții bunicilor tăi. Fiecare om are opt străbunici, iar legea îi socotește rude de gradul al treilea, în linie dreaptă.",
    path: ["tata", "tata", "tata"], degree: "gradul III, linie dreaptă",
    body: [
      { h: "Cum se numără", p: [
        "În linie dreaptă, gradul e numărul nașterilor dintre două persoane. De la străbunic la tine sunt trei: străbunicul l-a născut pe bunic (1), bunicul pe părintele tău (2), părintele pe tine (3). Gradul III.",
        "Părinții străbunicilor sunt stră-străbunicii, rude de gradul IV. În vorbire li se mai spune „răstrăbunici”.",
      ] },
      { h: "Câți străbunici ai", p: [
        "Doi părinți, patru bunici, opt străbunici, șaisprezece stră-străbunici: numărul se dublează la fiecare generație. Cei opt străbunici s-au născut de obicei cu 75–100 de ani înaintea ta, deci mulți dintre ei au trăit războaiele mondiale, colectivizarea sau emigrarea.",
        "Calculatorul de generații arată, pentru anul tău de naștere, în ce ani s-au născut aproximativ străbunicii.",
      ] },
      { h: "Cum le afli numele", p: [
        "Cei mai buni martori sunt bunicii și frații lor: își amintesc numele părinților și, adesea, porecla familiei din sat. Mai departe, actele de naștere ale bunicilor, păstrate la primăria locului, au numele părinților, adică ale străbunicilor tăi.",
        "Scrie la fiecare străbunică numele de fată: el duce mai departe, la părinții ei.",
        "Dacă nu mai trăiește nimeni care să-i fi cunoscut, caută la cimitirul satului: pe crucile vechi apar adesea numele și anii străbunicilor, iar uneori și ai părinților lor.",
      ] },
    ],
    faq: [
      { q: "Străbunicul e rudă de gradul 3?", a: "Da, în linie dreaptă: trei nașteri despart străbunicul de strănepot." },
      { q: "Câți străbunici are un om?", a: "Opt: patru pe linia tatălui, patru pe linia mamei." },
      { q: "Cum se numesc părinții străbunicilor?", a: "Stră-străbunici; în unele zone, răstrăbunici. Sunt rude de gradul IV, în linie dreaptă." },
    ],
    related: ["unchi-mare", "var-de-al-doilea", "var-primar"],
  },
  {
    slug: "stranepot", name: "Strănepot",
    title: "Strănepotul: cine e și ce grad de rudenie are",
    description: "Strănepotul e nepotul copilului tău, adică copilul nepotului tău. E rudă de gradul III în linie dreaptă. Cu deosebirea față de nepotul de frate.",
    h1: "Strănepotul și strănepoata: cine sunt și ce grad au",
    lead: "Strănepoții sunt copiii nepoților tăi de fiu sau de fiică. Pentru ei, tu ești străbunicul sau străbunica, iar legea vă socotește rude de gradul al treilea.",
    path: ["fiu", "fiu", "fiu"], degree: "gradul III, linie dreaptă",
    body: [
      { h: "Cum se numără", p: [
        "Între tine și strănepot sunt trei nașteri: copilul tău (1), nepotul (2), strănepotul (3). Gradul III, în linie dreaptă, ca între străbunic și strănepot văzut din partea cealaltă.",
      ] },
      { h: "Strănepot sau nepot de frate?", p: [
        "În vorbire, „strănepot” se folosește uneori și pentru copilul nepotului de frate. Acela însă e rudă colaterală, de gradul IV: urci la părintele tău comun cu fratele (1), cobori la frate (2), la nepotul de frate (3) și la copilul lui (4).",
        "Strănepotul adevărat e urmașul tău direct, pe linie dreaptă.",
        "Ca să eviți confuzia în arbore, scrie relația întreagă: „strănepot de fiu” sau „copilul nepotului de frate”. Așa, oricine citește arborele peste ani înțelege pe ce ramură se află fiecare copil.",
      ] },
      { h: "De ce contează pentru arbore", p: [
        "Strănepoții sunt cei care vor citi arborele peste ani. Cei mai mulți oameni își cunosc strănepoții doar câțiva ani, cât sunt mici, așa că amintirile scrise sau înregistrate sunt singurul fel în care strănepotul mai poate afla, mai târziu, cine a fost străbunicul lui. Mulți bunici și străbunici încep să scrie amintiri sau să înregistreze povești tocmai pentru ei: vocea unui străbunic, păstrată în arbore, e un dar pe care strănepotul îl înțelege abia când crește.",
      ] },
    ],
    faq: [
      { q: "Strănepotul e rudă de gradul 3?", a: "Da, în linie dreaptă: copil, nepot, strănepot." },
      { q: "Ce e copilul nepotului de frate?", a: "Rudă colaterală de gradul IV. În vorbire i se spune uneori tot strănepot." },
      { q: "Cum îi spune strănepotul străbunicii?", a: "Străbunică. În multe familii, simplu „bunica mare” sau „buna”." },
    ],
    related: ["nepot-de-var", "unchi-mare", "var-primar"],
  },
  {
    slug: "nepot", name: "Nepot",
    title: "Nepotul: de fiu sau de frate, ce grad de rudenie are",
    description: "În română, „nepot” înseamnă două rude diferite: copilul copilului tău (gradul II) și copilul fratelui tău (gradul III). Cum le deosebești.",
    h1: "Nepotul: de bunic sau de unchi, ce grad are",
    lead: "Româna folosește același cuvânt pentru două rude: nepotul de fiu (copilul copilului tău) și nepotul de frate (copilul fratelui sau al surorii tale). Gradele lor diferă.",
    path: ["fiu", "fiu"], degree: "gradul II, linie dreaptă (nepot de fiu); gradul III, linie colaterală (nepot de frate)",
    body: [
      { h: "Nepotul de fiu sau de fiică", p: [
        "E copilul copilului tău, iar tu ești bunicul sau bunica lui. Între voi sunt două nașteri, deci rudenie de gradul II, în linie dreaptă.",
        "În alte limbi sunt cuvinte diferite: în engleză „grandson”, în italiană tot „nipote”, ca în română.",
      ] },
      { h: "Nepotul de frate sau de soră", p: [
        "E copilul fratelui sau al surorii tale, iar tu ești unchiul sau mătușa lui. Urci la părintele comun (1), cobori la frate (2) și la nepot (3): gradul III, în linie colaterală. În engleză, „nephew” sau „niece”.",
      ] },
      { h: "În arbore și în acte", p: [
        "În multe familii, nepoții de frate și nepoții de fiu cresc împreună și își spun veri, ceea ce e corect doar pentru unii dintre ei: copiii a doi frați sunt veri primari, dar copilul tău și nepotul tău de frate nu sunt veri, ci veri primari doar între copiii fraților. Un arbore desenat lămurește repede cine cu cine e văr.",
        "Ca să nu încurci cele două sensuri, în arbore scrie mereu legătura exactă: „nepot de fiu”, „nepot de soră”. În registrele vechi, cuvântul „nepot” poate însemna oricare dintre ele, iar uneori chiar un văr mai tânăr; verifică după numele părinților.",
      ] },
    ],
    faq: [
      { q: "Nepotul de frate e rudă de gradul 3?", a: "Da, în linie colaterală." },
      { q: "Nepotul de fiu e rudă de gradul 2?", a: "Da, în linie dreaptă: copilul tău și copilul lui." },
      { q: "Copilul vărului meu e nepotul meu?", a: "În vorbire, da: „nepot de văr”, rudă de gradul V." },
    ],
    related: ["nepot-de-var", "var-primar", "unchi-mare"],
  },
  {
    slug: "var-de-al-treilea", name: "Văr de-al treilea",
    title: "Vărul de-al treilea: cine e și ce grad de rudenie are",
    description: "Vărul de-al treilea e copilul vărului de-al doilea al părintelui tău. Aveți aceiași stră-străbunici și sunteți rude de gradul VIII.",
    h1: "Vărul de-al treilea: cine e și ce grad are",
    lead: "Vărul de-al treilea e pe aceeași generație cu tine, iar strămoșii voștri comuni sunt stră-străbunicii. Legea vă socotește rude de gradul al optulea.",
    path: ["tata", "tata", "tata", "frate", "fiu", "fiu", "fiu"], degree: "gradul VIII, linie colaterală",
    body: [
      { h: "Cum se numără", p: [
        "Urci patru trepte până la stră-străbunicii comuni (părinte, bunic, străbunic, stră-străbunic) și cobori patru pe cealaltă ramură. 4 + 4 = gradul VIII.",
        "Regula simplă: vărul primar are bunicii în comun cu tine, vărul de-al doilea străbunicii, vărul de-al treilea stră-străbunicii.",
      ] },
      { h: "De ce îi găsești rar fără arbore", p: [
        "Stră-străbunicii s-au născut de obicei cu peste o sută de ani înaintea ta. Urmașii lor au acum zeci de nume de familie diferite și trăiesc adesea în alte orașe sau țări. Fără un arbore care urmărește toți copiii stră-străbunicilor, verii de-al treilea nu se mai cunosc între ei.",
        "Testele ADN de genealogie găsesc des veri de-al treilea, dar nu spun pe ce ramură; arborele face legătura.",
        "Un arbore care adună toți copiii stră-străbunicilor are de obicei sute de oameni. Fiecare familie scrie ramura ei, iar întâlnirile de familie le leagă pe toate.",
      ] },
      { h: "Ce mai e după gradul VIII", p: [
        "Pentru căsătorie, Codul civil interzice căsătoria între rudele în linie colaterală până la gradul IV inclusiv; verii de-al treilea nu intră în această interdicție. Pentru moștenire, rudele colaterale moștenesc doar până la gradul IV.",
      ] },
    ],
    faq: [
      { q: "Vărul de-al treilea e rudă de sânge?", a: "Da, aveți stră-străbunici comuni. Sunteți rude de gradul VIII, în linie colaterală." },
      { q: "Verii de-al treilea moștenesc unul de la altul?", a: "Nu din lege: rudele colaterale moștenesc doar până la gradul IV." },
      { q: "Copiii verilor de-al doilea ce sunt între ei?", a: "Veri de-al treilea." },
    ],
    related: ["var-de-al-doilea", "var-primar", "nepot-de-var"],
  },
  {
    slug: "frate-vitreg", name: "Frate vitreg",
    title: "Fratele vitreg: e rudă sau nu? Gradul de rudenie",
    description: "Fratele care are un singur părinte comun cu tine e rudă de gradul II. Copilul soțului mamei, fără părinți comuni, nu e rudă după lege.",
    h1: "Fratele vitreg: când e rudă și când nu",
    lead: "„Frate vitreg” înseamnă în vorbire două lucruri diferite: un frate cu un singur părinte comun, care e rudă de sânge, și copilul soțului sau al soției părintelui tău, care nu e rudă după lege.",
    path: ["tata", "fiu"], degree: "gradul II, linie colaterală (cu un părinte comun); fără grad (fără părinți comuni)",
    body: [
      { h: "Frații cu un singur părinte comun", p: [
        "Doi copii cu același tată și mame diferite (sau invers) sunt rude de sânge de gradul II, în linie colaterală, la fel ca frații buni: urci la părintele comun (1) și cobori la frate (2). În limbajul juridic vechi li se spunea „frați consângeni” (același tată) sau „frați uterini” (aceeași mamă).",
      ] },
      { h: "Copiii celor doi soți, fără părinți comuni", p: [
        "Când mama ta se căsătorește cu un bărbat care are copii dintr-o altă căsătorie, copiii lui nu au niciun părinte comun cu tine. Nu sunteți rude de sânge și nici afini după lege, deși cresc adesea împreună și își spun frați.",
        "Tatăl vitreg e însă afinul tău de gradul I: e soțul mamei tale, rudă cu tine prin căsătorie.",
      ] },
      { h: "În arbore", p: [
        "Într-un arbore bun, fiecare copil e legat de părinții lui adevărați, iar căsătoriile sunt trecute separat. Așa se vede limpede cine e frate după un părinte și cine e copilul celuilalt soț. Familiile reîntregite au loc în arbore exact așa cum sunt.",
      ] },
    ],
    faq: [
      { q: "Frații după tată sunt rude de gradul 2?", a: "Da. Un singur părinte comun ajunge pentru rudenia de sânge de gradul II." },
      { q: "Copilul soțului mamei mele e rudă cu mine?", a: "Nu după lege, dacă nu aveți niciun părinte comun." },
      { q: "Tatăl vitreg e rudă cu mine?", a: "E afin de gradul I: rudă prin căsătoria cu mama ta, nu de sânge." },
    ],
    related: ["cumnat", "socru", "var-primar"],
  },
  // Adăugate la 25.11.2026 (planul săptămânal: mai mulți termeni de rudenie, ca „cumnat”).
  {
    slug: "bunic", name: "Bunic",
    title: "Bunicul și bunica: ce grad de rudenie au",
    description: "Bunicii sunt părinții părinților tăi: rude de sânge de gradul II, în linie dreaptă. Câți bunici ai, cum se numără și ce întrebi la ei.",
    h1: "Bunicul și bunica: cine sunt și ce grad au",
    lead: "Bunicii sunt părinții tatălui și ai mamei tale. Fiecare om are patru bunici, iar legea îi socotește rude de sânge de gradul al doilea, în linie dreaptă.",
    path: ["tata", "tata"], degree: "gradul II, linie dreaptă",
    body: [
      { h: "Cum se numără", p: [
        "În linie dreaptă, gradul e numărul nașterilor dintre două persoane. Bunicul l-a născut pe tatăl tău (1), tatăl tău te-a născut pe tine (2). Gradul II.",
        "Pentru bunici, tu ești nepotul sau nepoata lor, adică „nepot de bunic”, tot de gradul II. Limba română folosește același cuvânt și pentru copilul fratelui, de aceea în acte se scrie uneori „nepot de fiu” sau „nepot de fiică”.",
      ] },
      { h: "Bunicii dinspre tată și dinspre mamă", p: [
        "Ai doi bunici pe linia tatălui și doi pe linia mamei. În multe familii li se spune după sat sau după casă („bunicii de la țară”, „mamaie de la deal”), iar numele acestea ajută mai târziu, când cauți în registre.",
        "Bunica are de obicei în acte două nume: cel de fată, pe care l-a avut până la cununie, și cel al bunicului. Numele de fată e cheia spre părinții ei, adică spre străbunicii tăi.",
      ] },
      { h: "Ce să-i întrebi pe bunici", p: [
        "Bunicii sunt cel mai bun izvor pentru arbore: își amintesc numele părinților și ale bunicilor lor, satele, nașii, frații plecați departe și poveștile pe care nu le-a scris nimeni.",
        "Întreabă-i pe rând: cum îi chema pe părinții lor, câți frați au avut, unde s-au cununat, cine le-au fost nașii. Notează răspunsurile chiar atunci, cu data și locul, și pune-le în arbore lângă fiecare om.",
        "Fotografiile vechi din casa bunicilor au adesea pe spate nume și ani. Fotografiază-le și pe spate, nu doar fața.",
      ] },
    ],
    faq: [
      { q: "Bunicul e rudă de gradul 2?", a: "Da. Două nașteri îl despart de tine: a părintelui tău și a ta." },
      { q: "Câți bunici are un om?", a: "Patru: doi pe linia tatălui, doi pe linia mamei." },
      { q: "Cum se numesc părinții bunicilor?", a: "Străbunici. Sunt rude de gradul III, în linie dreaptă." },
      { q: "Soțul a doua al bunicii e bunicul meu?", a: "Nu de sânge. E soțul bunicii tale; în familie i se spune adesea bunic, dar legea nu-l socotește rudă cu tine." },
    ],
    related: ["strabunic", "nepot", "unchi"],
  },
  {
    slug: "unchi", name: "Unchi",
    title: "Unchiul și mătușa: ce grad de rudenie au",
    description: "Unchiul e fratele tatălui sau al mamei, iar mătușa e sora lor. Sunt rude de sânge de gradul III. Soțul mătușii e unchi doar prin alianță.",
    h1: "Unchiul și mătușa: cine sunt și ce grad au",
    lead: "Unchiul e fratele tatălui sau al mamei tale, iar mătușa e sora lor. Sunt rude de sânge de gradul al treilea, în linie colaterală.",
    path: ["tata", "frate"], degree: "gradul III, linie colaterală",
    body: [
      { h: "Cum se numără", p: [
        "La rudele colaterale numeri treptele până la strămoșul comun și apoi în jos. Strămoșii comuni ai tăi și ai unchiului sunt bunicii tăi. Urci la tatăl tău (1), la bunic (2), apoi cobori la fratele tatălui (3). Gradul III.",
        "Pentru unchi și mătușă, tu ești nepotul sau nepoata de frate ori de soră, tot rudă de gradul III.",
      ] },
      { h: "Unchi de sânge și unchi prin alianță", p: [
        "Soțul mătușii și soția unchiului nu sunt rude de sânge cu tine. În familie li se spune tot unchi și mătușă, dar legea îi socotește doar afini, rude prin căsătorie. Copiii lor cu mătușa sau cu unchiul tău sunt însă verii tăi primari, rude de sânge de gradul IV.",
        "În unele zone mătușa se cheamă „tușă” sau „lele”, iar unchiul „bade” sau „nene”. Cuvintele diferă, relația e aceeași.",
      ] },
      { h: "Unchii în arbore și în acte", p: [
        "Unchii și mătușile completează ramura bunicilor: cu cât știi mai mulți frați ai părinților, cu atât arborele arată mai limpede cum s-a împărțit familia, cine a rămas în sat și cine a plecat.",
        "În actele de botez apar des ca nași ai nepoților, iar la cununii ca martori. Mătușile apar cu numele soțului după căsătorie, deci caută-le și după numele de fată.",
        "Căsătoria dintre unchi și nepoată sau dintre mătușă și nepot e interzisă de lege, pentru că sunt rude de gradul III.",
      ] },
    ],
    faq: [
      { q: "Unchiul e rudă de gradul 3?", a: "Da, în linie colaterală: două trepte până la bunici și una în jos, la fratele părintelui." },
      { q: "Soțul mătușii e unchiul meu?", a: "În vorbire da, dar după lege e doar rudă prin alianță, nu de sânge." },
      { q: "Ce sunt copiii unchiului pentru mine?", a: "Verii tăi primari, rude de gradul IV." },
    ],
    related: ["var-primar", "unchi-mare", "nepot"],
  },
  {
    slug: "rasstrabunic", name: "Răsstrăbunic",
    title: "Răsstrăbunicul: cine e și ce grad de rudenie are",
    description: "Răsstrăbunicul (stră-străbunicul) e părintele unui străbunic: rudă de gradul IV, în linie dreaptă. Ai 16 răsstrăbunici. Cum le afli numele.",
    h1: "Răsstrăbunicul: cine e și ce grad are",
    lead: "Răsstrăbunicii, numiți și stră-străbunici, sunt părinții străbunicilor tăi. Fiecare om are șaisprezece, iar legea îi socotește rude de gradul al patrulea, în linie dreaptă.",
    path: ["tata", "tata", "tata", "tata"], degree: "gradul IV, linie dreaptă",
    body: [
      { h: "Cum se numără", p: [
        "Patru nașteri te despart de un răsstrăbunic: a fiului lui (străbunicul tău), a bunicului, a părintelui tău și a ta. Gradul IV, în linie dreaptă.",
        "Mai departe nu mai există cuvinte obișnuite. Se spune „al cincilea bunic” sau, simplu, „strămoș”, cu numărul de generații.",
      ] },
      { h: "Când au trăit", p: [
        "Cu o generație de aproximativ 25–30 de ani, răsstrăbunicii unui om născut pe la 1990 s-au născut de obicei în a doua jumătate a secolului al XIX-lea. Mulți au trăit încă sub vechile stăpâniri: în Transilvania, Banat și Bucovina sub Austro-Ungaria, în Basarabia sub Rusia.",
        "Calculatorul de generații arată intervalul probabil pentru anul tău de naștere.",
      ] },
      { h: "Unde le găsești numele", p: [
        "Aproape nimeni nu-și mai amintește numele tuturor celor șaisprezece. Pornește de la actele de cununie ale străbunicilor: ele au de obicei numele părinților mirilor, adică ale răsstrăbunicilor.",
        "Pentru anii aceia, registrele parohiale și cele de stare civilă se păstrează de obicei la Arhivele Naționale, la serviciul județean. Uneori sunt scrise în maghiară, germană, latină sau cu litere chirilice, iar ghidurile noastre te ajută să le citești.",
        "Trece în arbore fiecare nume găsit, chiar dacă știi doar prenumele și satul. O ramură cu un singur nume e un început bun.",
      ] },
    ],
    faq: [
      { q: "Ce e un răsstrăbunic?", a: "Părintele unui străbunic, adică bunicul bunicului tău. I se spune și stră-străbunic." },
      { q: "Câți răsstrăbunici are un om?", a: "Șaisprezece: numărul strămoșilor se dublează la fiecare generație." },
      { q: "Ce grad de rudenie are răsstrăbunicul?", a: "Gradul IV, în linie dreaptă." },
    ],
    related: ["strabunic", "bunic", "stranepot"],
  },
  {
    slug: "tata-vitreg", name: "Tată vitreg",
    title: "Tatăl vitreg și mama vitregă: sunt rude cu tine?",
    description: "Tatăl vitreg e soțul mamei tale, fără să-ți fie tată. Nu e rudă de sânge, ci afin de gradul I. Ce înseamnă asta și cum apare în arbore.",
    h1: "Tatăl vitreg și mama vitregă: ce fel de rudenie sunt",
    lead: "Tatăl vitreg e soțul mamei tale, iar mama vitregă e soția tatălui tău, atunci când nu sunt părinții tăi. Nu sunt rude de sânge, ci rude prin alianță de gradul întâi.",
    path: ["mama", "sot"], degree: "afinitate, gradul I, linie dreaptă",
    body: [
      { h: "De ce e afin de gradul I", p: [
        "Afinitatea leagă un soț de rudele celuilalt soț, în același grad. Tu ești rudă de gradul I cu mama ta, așa că soțul ei e afinul tău de gradul I. La fel, soția tatălui tău e afina ta de gradul I.",
        "Pentru ei, tu ești fiul vitreg sau fiica vitregă. Legătura vine din căsătorie, nu din naștere.",
      ] },
      { h: "Ce schimbă și ce nu", p: [
        "Afinii nu sunt moștenitori legali. Un copil vitreg moștenește de la părintele vitreg doar dacă acesta îl trece în testament sau dacă l-a adoptat. După adopție, copilul devine rudă cu părintele adoptiv ca un copil născut în familie.",
        "Dacă mama vitregă are copii din altă căsătorie, ei nu sunt frații tăi după lege, chiar dacă ați crescut împreună. Frații cu care ai un părinte comun sunt însă rude de sânge de gradul II.",
      ] },
      { h: "În arbore", p: [
        "Într-un arbore bun, fiecare copil e legat de părinții lui adevărați, iar căsătoriile sunt trecute separat. Tatăl vitreg apare ca al doilea soț al mamei, cu anii căsătoriei, iar copilul rămâne legat de tatăl lui.",
        "Mulți oameni au fost crescuți de un tată vitreg sau de o mamă vitregă și au povești frumoase despre ei. Scrie-le la profilul lor: arborele arată și legăturile de inimă, nu doar pe cele de sânge.",
      ] },
    ],
    faq: [
      { q: "Tatăl vitreg e rudă cu mine?", a: "E afin de gradul I: rudă prin căsătoria cu mama ta, nu de sânge." },
      { q: "Moștenesc de la tatăl vitreg?", a: "Nu prin lege. Doar dacă te trece în testament sau dacă te-a adoptat." },
      { q: "Copiii mamei vitrege sunt frații mei?", a: "Nu după lege, dacă nu aveți niciun părinte comun." },
    ],
    related: ["frate-vitreg", "fiu-vitreg", "socru"],
  },
  {
    slug: "fiu-vitreg", name: "Fiu vitreg",
    title: "Fiul vitreg și fiica vitregă: ce rudă îți sunt",
    description: "Fiul vitreg e copilul soției sau al soțului tău dintr-o altă relație. E afinul tău de gradul I, nu rudă de sânge. Ce înseamnă și ce schimbă.",
    h1: "Fiul vitreg și fiica vitregă: ce fel de rudenie sunt",
    lead: "Fiul vitreg sau fiica vitregă e copilul soțului sau al soției tale, născut dintr-o altă relație. Legea îl socotește rudă prin alianță de gradul întâi, nu rudă de sânge.",
    path: ["sotie", "fiu"], degree: "afinitate, gradul I, linie dreaptă",
    body: [
      { h: "De ce e afin de gradul I", p: [
        "Soția ta e rudă de gradul I cu copilul ei. După lege, rudele unui soț sunt afinii celuilalt în același grad, așa că fiul ei e afinul tău de gradul I, în linie dreaptă.",
        "Dacă copilul e și al tău, e pur și simplu fiul tău, rudă de sânge de gradul I. Calculatorul nu poate ști asta din drum, de aceea scrie „dacă nu e și fiul tău”.",
      ] },
      { h: "Familiile reîntregite", p: [
        "Familiile cu copii din căsătorii diferite au existat mereu. În satele de altădată, mulți rămâneau văduvi tineri, iar a doua căsătorie aducea în aceeași casă copii din ambele părți. În registre se văd ca frați cu nume de familie diferite.",
        "Copiii născuți apoi din noua căsătorie sunt frați după un părinte cu fiecare dintre ei, adică rude de sânge de gradul II.",
      ] },
      { h: "Adopție, moștenire și arbore", p: [
        "Un fiu vitreg nu moștenește prin lege de la părintele vitreg. Dacă vrei să-i lași ceva, ai nevoie de testament. Prin adopție, copilul devine rudă cu tine ca un copil născut în familie.",
        "În arbore, copilul rămâne legat de părinții lui adevărați, iar tu apari ca soțul sau soția mamei ori tatălui lui. Așa se vede limpede cine e rudă cu cine, fără să se piardă nimic din povestea familiei.",
      ] },
    ],
    faq: [
      { q: "Fiul vitreg e rudă de gradul 1?", a: "E afin de gradul I: rudă prin căsătoria cu părintele lui, nu de sânge." },
      { q: "Fiul vitreg moștenește?", a: "Nu prin lege. Doar prin testament sau dacă a fost adoptat." },
      { q: "Ce e fiul vitreg pentru copiii mei?", a: "Dacă are un părinte comun cu ei, e fratele lor după acel părinte. Dacă nu, nu sunt rude după lege." },
    ],
    related: ["tata-vitreg", "frate-vitreg", "ginere-si-nora"],
  },
  {
    slug: "var-al-parintelui", name: "Văr al părintelui",
    title: "Vărul tatălui sau al mamei: ce rudă îți este",
    description: "Vărul primar al tatălui sau al mamei e rudă de gradul V cu tine. În vorbire i se spune unchi sau văr de-al doilea. Explicat simplu.",
    h1: "Vărul tatălui sau al mamei: ce rudă îți este",
    lead: "Vărul primar al tatălui sau al mamei tale e rudă de sânge de gradul al cincilea cu tine. În familie i se spune adesea „unchi” sau „văr”, dar nu e nici unchiul tău, nici vărul tău de-al doilea.",
    path: ["tata", "tata", "frate", "fiu"], degree: "gradul V, linie colaterală",
    body: [
      { h: "Cum se numără", p: [
        "Strămoșii comuni sunt părinții bunicului tău, adică străbunicii tăi. Urci la tatăl tău (1), la bunic (2), la străbunic (3), apoi cobori la fratele bunicului (4) și la fiul lui (5). Gradul V.",
        "Pentru el, tu ești „nepot de văr”, copilul vărului său primar. E aceeași legătură, privită din partea cealaltă.",
      ] },
      { h: "Cum i se spune în familie", p: [
        "Pentru că e cu o generație mai mare, mulți îi spun „unchi” sau „mătușă”, din respect. În engleză i se spune „first cousin once removed”, adică văr primar cu o generație diferență.",
        "Copiii lui sunt însă verii tăi de-al doilea: aveți aceiași străbunici și sunteți pe aceeași generație.",
      ] },
      { h: "De ce contează în arbore", p: [
        "Verii părinților sunt o punte spre ramura străbunicilor. Ei au crescut adesea cu bunicii tăi, și-au cunoscut unchii mari și pot avea fotografii sau acte pe care familia ta nu le mai are.",
        "Dacă vrei să afli cine erau frații bunicului, cel mai repede ajungi prin copiii lor, adică prin verii tatălui sau ai mamei. Adaugă-i în arbore sub fratele bunicului și invită-i să completeze ce știu.",
      ] },
    ],
    faq: [
      { q: "Vărul tatălui e vărul meu de-al doilea?", a: "Nu. Vărul de-al doilea e copilul lui, de aceeași generație cu tine. El e rudă de gradul V." },
      { q: "Ce grad de rudenie are vărul mamei?", a: "Gradul V, în linie colaterală, la fel ca vărul tatălui." },
      { q: "Ce sunt eu pentru vărul tatălui meu?", a: "Nepot de văr: copilul vărului său primar." },
    ],
    related: ["var-primar", "var-de-al-doilea", "nepot-de-var"],
  },
];

export const getKinPage = (slug: string) => KIN_PAGES.find((p) => p.slug === slug) ?? null;
export const kinWords = (p: KinPage) => [p.lead, ...p.body.flatMap((b) => [b.h, ...b.p]), ...p.faq.flatMap((f) => [f.q, f.a])].join(" ").split(/\s+/).filter(Boolean).length;

/**
 * Ciorne de pagini de rudenie (Daniel, 19.11.2026): NU au pagină, nu intră în sitemap, în căutare sau în liste până nu le aprobă
 * Daniel; atunci se mută în KIN_PAGES. Se citesc în /mnt/project-files/rudenie/ciorne-rudenie.md (scripts/rudenie-ciorne-md.ts).
 */
export const KIN_DRAFTS: KinPage[] = [
];
