import { parseBlocks, type Block } from "@/lib/continut/markdown";

/**
 * „Crizele care au schimbat lumea” (/istoria-umanitatii/crize, Daniel, 2026-11-26): marile crize economice și sociale, de la
 * 1929 până azi, văzute prin ochii familiilor din România: ce au trăit bunicii și cum s-au descurcat. Text public, scris de mână,
 * cu surse la final. Marcajul [[fila]] arată locul unde, pentru cine e intrat în cont, se adaugă fila din src/lib/istorie/crize-fila.ts
 * (care NU se importă în pagina publică și nu intră în sitemap).
 */
export const CRIZE = {
  path: "/istoria-umanitatii/crize",
  h1: "Crizele care au schimbat lumea și cum au trecut prin ele familiile noastre",
  title: "Crizele care au schimbat lumea: 1929, 2008 și azi | Cartea Neamului",
  description: "Marea Criză din 1929, foametea din 1946–1947, anii '80, inflația din anii '90, criza din 2008 și scumpirile de azi: ce au trăit bunicii și cum s-au descurcat.",
  updated: "2026-11-26",
};

const TEXT = `
Fiecare familie are o poveste despre „anii grei”. Bunicul care și-a pierdut economiile, bunica ce a crescut copiii din grădină și din câteva găini, unchiul plecat la muncă departe. Crizele nu sunt doar cifre din cărțile de istorie: ele au hotărât unde s-au mutat strămoșii noștri, cu cine s-au căsătorit, câți copii au avut și ce meserii au ales.

Pagina aceasta trece prin marile crize ale ultimului secol, cu ochii pe România și pe oamenii obișnuiți: ce s-a întâmplat, cum au trăit familiile și ce soluții au găsit ca să treacă mai departe. La final găsești întrebări bune de pus bătrânilor din familie, ca poveștile lor să rămână în arbore.

## 1918–1919: după război, gripa

Primul Război Mondial s-a încheiat cu Unirea din 1918, dar și cu o țară săracă, cu sate rămase fără bărbați și cu o boală nouă: gripa numită „spaniolă”. În toată lumea a ucis zeci de milioane de oameni, mai mulți decât războiul. În satele românești, familiile s-au strâns una lângă alta: copiii rămași orfani au fost crescuți de bunici, de mătuși sau de nași. De aceea, în multe arbori, un copil apare crescut de alți oameni decât părinții lui.

## 1929–1933: Marea Criză, o criză fără precedent

Pe 24 octombrie 1929, în „joia neagră”, bursa de la New York a început să se prăbușească, iar pe 29 octombrie a venit „marțea neagră”. Criza a pornit din America și a ajuns, în câțiva ani, în toată lumea: fabrici închise, bănci falimentate, milioane de șomeri. În Statele Unite, aproape unul din patru oameni ajunsese fără lucru în 1933.

**Ce a însemnat pentru România.** Țara trăia atunci mai ales din agricultură, iar prețurile produselor agricole au scăzut cu 60–70% față de 1928–1929. Un chintal de grâu ajunsese să se vândă mai ieftin decât costa recoltarea lui. Țăranii, mulți împroprietăriți după reforma agrară din 1921, se împrumutaseră la bănci ca să-și lucreze pământul: în 1932, aproximativ 2,5 milioane de agricultori aveau datorii pe care nu le mai puteau plăti. Producția industrială a scăzut cam la jumătate, iar venitul național din 1933 era doar 62% din cel din 1929.

Băncile au fost lovite și ele: oamenii și-au retras în grabă banii, iar în 1931 a căzut banca Marmorosch Blank, una dintre cele mai mari din țară. Statul nu-și mai putea plăti salariile întregi, așa că a tăiat din ele, în mai multe rânduri, prin așa-numitele „curbe de sacrificiu”. În ianuarie–februarie 1933, ceferiștii de la Atelierele Grivița din București au intrat în grevă.

**Cum s-au descurcat oamenii.**

- **S-au întors la sat și la pământ.** Cine avea o bucată de pământ și o grădină avea măcar ce pune pe masă. Familiile de la oraș se sprijineau pe rudele de la țară.
- **Au trăit din ce făceau cu mâna lor.** Hainele se țeseau în casă, se cârpeau și se purtau din frate în frate. Se făcea schimb: ouă pe sare, muncă pe grâu.
- **Și-au cerut datoriile iertate.** Între 1932 și 1934, statul a dat legi de „conversiune” a datoriilor agricole, prin care o mare parte din datoriile țăranilor au fost reduse și eșalonate.
- **S-au ținut împreună.** Mai multe generații în aceeași casă, frații care se ajutau la munci, clăcile din sat: nimeni nu putea trece singur prin asemenea ani.

## 1946–1947: foametea de după război

După al Doilea Război Mondial, România a avut de plătit despăgubiri de război către Uniunea Sovietică, iar trupele sovietice rămase în țară trebuiau hrănite. În 1946 a venit o secetă cumplită. În Moldova, mai ales, recolta s-a pierdut aproape în întregime, iar oamenii au ajuns să mănânce orice găseau. Peste Prut, în Basarabia ocupată de sovietici, rechizițiile au luat țăranilor chiar și grâul de sămânță, iar foametea a ucis, după estimări, în jur de 300.000 de oameni în doi ani.

**Cum s-au descurcat oamenii.** Mulți moldoveni au plecat cu trenul în Ardeal și în Banat, unde recolta fusese mai bună, și au schimbat haine, covoare sau unelte pe porumb și grâu. Mulți copii din Moldova au fost primiți, pentru o vreme, în familii din Ardeal și Banat, iar unii au rămas acolo pentru totdeauna. Dacă în arborele tău apare un copil „crescut la Banat” în acești ani, aceasta poate fi povestea lui.

Tot atunci, pe 15 august 1947, o reformă monetară a schimbat 20.000 de lei vechi pe un leu nou, iar fiecare om putea schimba doar o sumă mică. Economiile strânse o viață au dispărut peste noapte. A urmat o a doua reformă, în ianuarie 1952. De aceea bunicii au păstrat multă vreme mai multă încredere în pământ, în aur și în lucruri decât în banii din bancă.

## 1949–1962: colectivizarea

Nu a fost o criză venită de pe bursă, ci una adusă de stat: pământul, animalele și uneltele au fost luate în gospodăriile colective (CAP). Familiile au primit cote obligatorii de predat, iar cei care s-au împotrivit au fost numiți „chiaburi”, închiși sau deportați. Mulți tineri au plecat atunci de la sat la oraș, la fabrică sau pe șantier, și așa s-au despărțit familii întregi. Despre actele rămase din acești ani găsești un ghid separat: [Colectivizarea și registrele agricole](/ghid/colectivizarea-si-registrele-agricole).

## Anii '80: cozile, cartelele și frigul

La începutul anilor '80, România avea datorii externe mari, iar conducerea comunistă a hotărât să le plătească pe toate, cât mai repede, din ce se putea exporta. Datoriile au fost plătite până în primăvara lui 1989, dar cu un preț greu pentru oameni: alimentele de bază s-au dat pe cartelă, la cozi lungi, căldura și lumina se opreau ore în șir, iar televizorul avea doar câteva ore de program pe zi.

**Cum s-au descurcat oamenii.**

- **Pachetele de la țară.** Cine avea părinți la sat primea cartofi, brânză, carne și ouă. Legătura dintre oraș și sat a ținut în viață multe familii.
- **„Pilele” și schimbul.** Se făcea rost de lucruri prin cunoscuți, iar cafeaua, țigările străine sau săpunul bun deveniseră un fel de monedă.
- **Grădina, cămara și borcanele.** Murăturile, gemurile și zacusca de toamnă erau rezerva familiei pentru iarnă.
- **Răbdarea și umorul.** Bancurile spuse în șoaptă erau și ele o formă de a rezista.

## Anii '90: libertate, dar și inflație

După 1989, oamenii au primit libertatea, dar și o economie care se schimba de la o zi la alta. Prețurile au crescut foarte repede: în 1993, inflația a trecut de 250% într-un singur an, iar o leafă ajungea tot mai greu până la sfârșitul lunii. Multe fabrici s-au închis, iar sute de mii de oameni au rămas fără loc de muncă.

În această nesiguranță au apărut „jocurile” care promiteau îmbogățire rapidă. Cel mai cunoscut a fost Caritas, pornit în 1992 la Brașov și mutat apoi la Cluj, care promitea de opt ori banii depuși. S-a prăbușit în 1994, iar milioane de români și-au pierdut banii. În anul 2000 a căzut și Fondul Național de Investiții (FNI), unde își puseseră economiile sute de mii de oameni.

**Cum s-au descurcat oamenii.** Unii s-au întors la pământul primit înapoi după 1991, alții și-au deschis o mică afacere, o tarabă sau un atelier. Mulți au plecat la muncă în străinătate, iar după ianuarie 2002, când românii au putut călători fără viză în spațiul Schengen, au plecat sute de mii, mai ales în Italia și Spania. Atunci s-a născut diaspora de azi: familii împărțite între două țări, copii crescuți de bunici, bani trimiși acasă pentru o casă nouă în sat.

## 2007–2010: criza financiară mondială

Criza a început în America, de la creditele pentru case date unor oameni care nu le puteau plăti. Pe 15 septembrie 2008 a dat faliment banca Lehman Brothers, iar panica s-a întins în toată lumea. În România, după câțiva ani în care se cumpărau ușor apartamente și mașini pe credit, economia a scăzut brusc în 2009, iar țara a primit de la Fondul Monetar Internațional, Uniunea Europeană și alte instituții un împrumut de aproape 20 de miliarde de euro.

Pentru familii, cel mai greu a fost anul 2010: din iulie, salariile bugetarilor au fost tăiate cu 25%, iar TVA a crescut de la 19% la 24%. Cei cu credite în franci elvețieni au văzut cum rata le crește an de an, pe măsură ce francul se scumpea.

**Cum s-au descurcat oamenii.** Unii au renegociat creditele sau s-au mutat înapoi la părinți, alții au plecat, într-un nou val, la muncă în Germania, Anglia sau Italia. S-au redescoperit grădina bunicilor, borcanele și ajutorul dintre rude. Multe familii tinere au învățat atunci că o datorie mică e mai sigură decât un credit mare.

## 2020–2022: pandemia și scumpirea energiei

Pandemia de COVID-19 a închis granițe, școli și locuri de muncă. Mulți români din diaspora s-au întors acasă, iar bunicii au fost despărțiți luni întregi de nepoți. Imediat după aceea, războiul din Ucraina, început în februarie 2022, a scumpit energia, gazele și alimentele în toată Europa. Familiile au învățat din nou să facă economie și să-și sune mai des bătrânii.

## Criza de acum

Trăim și noi o perioadă grea. După anii pandemiei, statul român a ajuns cu cel mai mare deficit bugetar din Uniunea Europeană și a trebuit să crească taxele: TVA a urcat din august 2025 de la 19% la 21%, iar plafonarea prețului la energie s-a încheiat. În 2026, războiul din Orientul Mijlociu a scumpit petrolul, iar motorina a depășit 10 lei pe litru în vara aceasta. România are de mai multe luni cea mai mare inflație din Uniunea Europeană: în octombrie 2026, prețurile erau cu aproape 7% mai mari decât cu un an înainte, chiriile cu peste 38%, iar carburanții cu 33–43%.

Nimeni nu știe cât va dura. Dar poveștile bunicilor ne arată că familiile care au trecut prin crize au avut câteva lucruri în comun.

[[fila]]

## Ce i-a ajutat pe oameni să treacă prin anii grei

Dacă pui una lângă alta toate aceste crize, aceleași soluții apar mereu:

1. **Familia unită.** Generațiile care se ajută, copiii crescuți de bunici, frații care împart ce au. În fiecare criză, rudele au fost prima „bancă” și prima „asigurare”.
2. **Pământul și mâinile proprii.** O grădină, câteva animale, o meserie învățată de la tată: lucruri pe care nicio criză nu le poate lua peste noapte.
3. **Datorii puține.** Cei fără datorii mari au trecut mai ușor prin 1929, prin 1947 și prin 2010.
4. **Prudența față de promisiunile de îmbogățire rapidă.** Caritas și FNI au arătat că un câștig prea frumos ascunde de obicei o capcană.
5. **Plecarea la nevoie, dar cu legătura păstrată.** Mulți au plecat departe, dar cei care au păstrat legătura cu satul și cu ai lor au avut mereu un loc unde să se întoarcă.
6. **Speranța.** Oamenii care au trecut prin foamete și război spun mereu același lucru: ce te ține în picioare este să ai pentru cine trăi și în ce să crezi.

## Ce înseamnă toate acestea pentru arborele tău

Crizele lasă urme în arborele oricărei familii: o mutare dintr-un sat în altul, un copil crescut de bunici, o căsătorie târzie, un frate plecat în străinătate. Când găsești asemenea „goluri” sau schimbări, uită-te la anii lor: poate s-au întâmplat într-una dintre crizele de mai sus.

Întrebări bune pentru cei mai în vârstă din familie:

- Ce vă povesteau părinții despre anii 1930 sau despre foametea din 1946–1947?
- Ați pierdut bani la reforma din 1947, la Caritas sau la FNI?
- Ce mâncați iarna în anii '80 și de unde făceați rost de alimente?
- Cine din familie a plecat la muncă în străinătate și de ce?
- Care a fost cel mai greu an din viața dumneavoastră și cum ați trecut prin el?

Notează răspunsurile la persoana potrivită din arbore, ca povestea să rămână pentru nepoți. Te ajută ghidul [Cum îi intervievezi pe bunici](/ghid/cum-intervievezi-bunicii), iar pentru hârtiile vechi din casă, ghidul [Documentele de familie din casă](/ghid/documente-de-familie-din-casa). Pentru cei plecați, vezi și [Valurile de emigrare în America de Nord](/ghid/valurile-de-emigrare-in-america-de-nord).

## Surse

- [Great Depression in Romania](https://en.wikipedia.org/wiki/Great_Depression_in_Romania), Wikipedia: prețurile agricole, datoriile țăranilor, băncile, Grivița.
- [Foametea din Basarabia, 1946–1947](https://www.digi24.ro/fara-categorie/1946-1947-marea-foamete-din-basarabia-care-a-ucis-10-din-populatie-783033), Digi24.
- [Caritas (Ponzi scheme)](https://en.wikipedia.org/wiki/Caritas_(Ponzi_scheme)), Wikipedia.
- [Pachetul de sprijin pentru România din 2009](https://www.imf.org/en/News/Articles/2015/09/14/01/49/pr09148), Fondul Monetar Internațional.
- [Inflația din octombrie 2026](https://financialintelligence.ro/inflatia-anuala-a-crescut-pentru-a-doua-luna-consecutiv-ajungand-la-69-in-octombrie-motorina-s-a-scumpit-cu-4345-iar-chiriile-cu-3846/), Financial Intelligence, după datele INS.
- [Scumpirea carburanților în 2026](https://romania.europalibera.org/a/motorina-peste-9-lei-litru-in-unele-benzinarii-scumpirea-combustibililor-continua-in-romania-pe-fondul-razboiului-din-orientul-mijlociu/33704506.html), Europa Liberă.
`;

const [BEFORE, AFTER] = TEXT.split("\n[[fila]]\n");

/** Textul, în două părți: înainte și după locul filei pentru cei cu cont. */
export const CRIZE_BLOCKS: { before: Block[]; after: Block[] } = { before: parseBlocks(BEFORE), after: parseBlocks(AFTER ?? "") };
