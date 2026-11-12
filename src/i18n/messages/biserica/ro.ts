/**
 * „Libertatea de a crede” (/libertatea-de-a-crede, fosta „Istoria Bisericii prigonite”): epocile cu martorii lor, oamenii din închisorile comuniste și
 * drumul Bibliei în limba română. Scrisă de mână, fără inteligență artificială; în română versetele sunt din Cornilescu, în
 * celelalte limbi din Biblia clasică a limbii (memoria „biblii-clasice”). Unde un lucru e doar tradiție, textul o spune.
 * Martorii fiecărei epoci sunt w1, w2… în ordinea din src/lib/istoria-bisericii.ts, unde stau anii și semnul „la noi”.
 */
import type { Widen } from "../types";

export const roBiserica = {
  Church: {
    meta: {
      title: "Libertatea de a crede",
      description: "Două mii de ani de istorie a creștinismului: martirii Romei, Reforma, primele cărți în limba română și oamenii închiși pentru credința lor în închisorile comuniste.",
    },
    label: "Libertatea de a crede",
    title: "Două mii de ani de creștinism și oamenii care au plătit pentru credința lor",
    toc: "Cuprins",
    heroesChip: "Închisorile comuniste",
    bibleChip: "Primele cărți în românește",
    filterLabel: "Ce arată",
    all: "Toată lumea",
    onlyRo: "Doar la noi, pe pământ românesc",
    today: "azi",
    ourLand: "la noi",
    quoted: "„{text}”",
    heroesLabel: "Povești adevărate",
    heroesTitle: "Trei oameni din închisorile comuniste",
    bibleLabel: "Cartea și limba română",
    bibleTitle: "Cum a ajutat Biblia la nașterea limbii române scrise",
    influenceTitle: "Ce au schimbat aceste cărți în viața românilor",
    endTitle: "Și noi suntem o filă din istoria aceasta",
    endText: "Bunicii multora dintre noi s-au rugat în ascuns, au ascuns cărți și au tăcut ca să nu-și piardă slujba. Libertatea de a crede, ca și libertatea de a nu crede, a fost câștigată greu. Azi, cam unul din șapte creștini din lume trăiește încă într-o țară unde credința îl poate costa. Fiecare om e liber să caute singur răspunsurile.",
    note: "Scris de mână, din izvoare istorice. Citatele biblice sunt din traducerea Dumitru Cornilescu. Unde un lucru e doar tradiție, textul o spune.",
    humanity: "Istoria umanității",
    genealogies: "Genealogii vechi",
    intro: "Libertatea de a crede ce vrei, de a te aduna cu alții și de a citi ce vrei pare azi un lucru de la sine înțeles. N-a fost așa. De la Ierusalimul primului secol până la închisorile comuniste, mulți oameni au plătit pentru credința lor cu libertatea sau cu viața, iar istoria lor e, în bună parte, și istoria libertăților noastre de azi. Aici sunt câțiva dintre ei, epocă după epocă, și câteva dintre clipele în care cărțile lor au ajuns în limba poporului.",
    promise: {
      text: "Și Eu îți spun: tu ești Petru, și pe această piatră voi zidi Biserica Mea, și porțile Locuinței morților nu o vor birui.",
      ref: "Matei 16:18",
    },
    eras: {
      apostoli: {
        name: "Primii creștini",
        intro: "După răstignirea lui Isus, câțiva pescari și oameni simpli din Galileea au început să vestească la Ierusalim că a înviat, apoi au dus învățătura lui în toată lumea romană. Prigoana a început aproape imediat: întâi din partea conducătorilor iudei, apoi din partea Romei. Dar prigoana i-a risipit, iar cei risipiți au dus credința mai departe.",
        verse: {
          text: "Cei ce se împrăștiaseră mergeau din loc în loc și propovăduiau Cuvântul.",
          ref: "Faptele Apostolilor 8:4",
        },
        w: {
          w1: {
            name: "Ștefan, primul martir",
            years: "c. 34",
            place: "Ierusalim",
            text: "Unul dintre cei șapte diaconi ai Bisericii din Ierusalim. După ce a mărturisit pe Hristos înaintea Sinedriului, a fost scos din cetate și ucis cu pietre. La moartea lui era de față un tânăr pe nume Saul, care avea să devină apostolul Pavel.",
            quote: "Doamne, nu le ține în seamă păcatul acesta! (Faptele Apostolilor 7:60)",
          },
          w2: {
            name: "Iacov, fiul lui Zebedei",
            years: "c. 44",
            place: "Ierusalim",
            text: "Fratele apostolului Ioan, primul dintre cei doisprezece apostoli care a murit pentru Hristos: regele Irod Agripa l-a omorât cu sabia (Faptele Apostolilor 12:2).",
          },
          w3: {
            name: "Creștinii Romei sub Nero",
            years: "64",
            place: "Roma",
            text: "După marele incendiu al Romei, împăratul Nero a dat vina pe creștini. Istoricul roman Tacit scrie că unii au fost dați la fiare, alții răstigniți sau arși ca făclii în grădinile împăratului. După tradiția veche a Bisericii, tot atunci, sub Nero, au murit la Roma apostolii Petru (răstignit) și Pavel (tăiat cu sabia).",
          },
          w4: {
            name: "Apostolul Andrei",
            years: "secolul I",
            place: "Sciția Mică (Dobrogea de azi)",
            text: "O tradiție veche, pomenită de Origen și de Eusebiu, spune că Andrei, fratele lui Petru, a primit să vestească Evanghelia în Sciția. De aceea românii îl socotesc apostolul lor. Nu știm sigur pe unde a umblat, dar știm că în Dobrogea au fost creștini foarte devreme.",
          },
          w5: {
            name: "Ioan, exilat în Patmos",
            years: "c. 95",
            place: "Insula Patmos",
            text: "Ultimul apostol rămas în viață a fost trimis în exil pe o insulă „din pricina Cuvântului lui Dumnezeu și din pricina mărturiei lui Isus Hristos” (Apocalipsa 1:9). Acolo a primit descoperirea scrisă în Apocalipsa.",
          },
        },
      },
      roma: {
        name: "Martirii sub împărații Romei",
        intro: "Timp de două sute cincizeci de ani, a fi creștin putea însemna moartea. Creștinii nu voiau să aducă jertfă zeilor și împăratului, așa că erau socotiți dușmani ai statului. Prigoana venea în valuri: uneori locală, alteori în tot imperiul. Cea mai grea a fost ultima, sub Dioclețian.",
        verse: {
          text: "Fii credincios până la moarte și-ți voi da cununa vieții.",
          ref: "Apocalipsa 2:10",
        },
        w: {
          w1: {
            name: "Ignatie al Antiohiei",
            years: "c. 110",
            place: "Antiohia → Roma",
            text: "Episcop al Antiohiei, dus în lanțuri la Roma ca să fie dat la fiare. Pe drum a scris șapte scrisori către biserici, care s-au păstrat: le cere să rămână uniți și să nu încerce să-l scape de moarte.",
          },
          w2: {
            name: "Policarp al Smirnei",
            years: "c. 155",
            place: "Smirna (Turcia de azi)",
            text: "Ucenic al apostolului Ioan și episcop bătrân. Când i s-a cerut să se lepede de Hristos ca să scape, a răspuns cu vorbele care s-au păstrat în relatarea martiriului lui. A fost ars pe rug.",
            quote: "Optzeci și șase de ani L-am slujit și nu mi-a făcut niciun rău. Cum aș putea să-L hulesc pe Împăratul meu, care m-a mântuit?",
          },
          w3: {
            name: "Iustin Martirul",
            years: "c. 165",
            place: "Roma",
            text: "Filozof care L-a găsit pe Hristos după ce a căutat adevărul în toate școlile vremii. A scris apărări ale credinței către împărați și a fost tăiat cu sabia împreună cu ucenicii lui.",
          },
          w4: {
            name: "Perpetua și Felicitas",
            years: "203",
            place: "Cartagina (Tunisia de azi)",
            text: "O tânără mamă de neam bun și sclava ei, care tocmai născuse. Au refuzat să jertfească zeilor și au murit împreună în arenă. Perpetua și-a scris singură, în închisoare, zilele dinaintea morții.",
          },
          w5: {
            name: "Prigoana lui Decius",
            years: "250",
            place: "Tot imperiul",
            text: "Împăratul a cerut fiecărui om să aducă jertfă zeilor și să primească o adeverință. Mulți creștini au murit, mulți s-au ascuns, iar unii au cedat. Biserica a trebuit apoi să învețe cum să-i primească înapoi pe cei căzuți.",
          },
          w6: {
            name: "Epictet și Astion",
            years: "c. 290",
            place: "Halmyris, lângă Murighiol (Tulcea)",
            text: "Un preot și un tânăr ucenic, uciși pentru credință în cetatea romană Halmyris, la gurile Dunării. Moaștele lor au fost găsite de arheologi în cripta bazilicii de acolo, în 2001.",
          },
          w7: {
            name: "Marea Prigoană și martirii de la Niculițel",
            years: "303–311",
            place: "Tot imperiul; Niculițel (Tulcea)",
            text: "Dioclețian a poruncit să fie dărâmate bisericile, arse Scripturile și închiși slujitorii. În Dobrogea au murit atunci mulți creștini. În 1971, la Niculițel, s-a găsit sub o bazilică veche o criptă cu oasele a patru martiri, cu numele lor scrise pe perete: Zotic, Atal, Camasie și Filip.",
          },
        },
      },
      "evul-mediu": {
        name: "Creștinismul la putere",
        intro: "În 313, prin Edictul de la Milano, creștinii au primit voie să se închine liber, iar curând creștinismul a devenit religia imperiului. A scăpat de sabia Romei, dar a dat de o altă ispită: puterea. Cu vremea, mulți au ajuns creștini doar cu numele, iar Scriptura a rămas într-o limbă pe care poporul n-o mai înțelegea. Cei care au cerut întoarcerea la textul ei au fost prigoniți, de data aceasta chiar de cei care conduceau Biserica.",
        verse: {
          text: "Cerul și pământul vor trece, dar cuvintele Mele nu vor trece.",
          ref: "Matei 24:35",
        },
        w: {
          w1: {
            name: "Sava Gotul",
            years: "372",
            place: "Râul Buzău",
            text: "Un creștin got care a refuzat să mănânce din carnea jertfită idolilor. Căpetenia gotă l-a înecat în râul Mousaios, Buzăul de azi, la 12 aprilie 372. Atunci și acolo, în ținutul de la nord de Dunăre, Ulfila tradusese Biblia în limba goților.",
          },
          w2: {
            name: "Petru Valdo și valdenzii",
            years: "c. 1170",
            place: "Lyon, apoi Alpi",
            text: "Un negustor bogat din Lyon care și-a împărțit averea și a pus să fie tradusă Scriptura în limba poporului. Ucenicii lui predicau din Biblie pe la sate. Au fost declarați eretici și vânați secole la rând, dar s-au ascuns în văile Alpilor și au rezistat până azi.",
          },
          w3: {
            name: "John Wycliffe",
            years: "c. 1330–1384",
            place: "Oxford, Anglia",
            text: "Profesor la Oxford care a învățat că Scriptura stă mai presus de papă și a îndemnat la traducerea Bibliei în engleză. A murit în pat, dar în 1428 Biserica i-a dezgropat oasele, le-a ars și a aruncat cenușa într-un râu.",
          },
          w4: {
            name: "Jan Hus",
            years: "1415",
            place: "Praga → Konstanz",
            text: "Preot și profesor la Praga, care predica în limba cehă și cerea ca Biserica să se întoarcă la Scriptură. A fost chemat la Conciliul de la Konstanz cu promisiunea că va fi lăsat să plece liber; a fost arestat și ars pe rug la 6 iulie 1415, pentru că nu s-a lepădat de ce învățase din Biblie.",
          },
        },
      },
      reforma: {
        name: "Reforma: Scriptura în limba poporului",
        intro: "La o sută de ani după Hus, un călugăr german, Martin Luther, a citit în Epistola către Romani că omul e iertat prin credință, ca un dar, nu prin fapte sau prin bani. Tiparul abia apăruse, așa că Biblia a putut ajunge, în sfârșit, în casele oamenilor, în limba lor. A urmat o sută de ani de lupte și de prigoane, în care, din păcate, și creștinii s-au prigonit unii pe alții.",
        verse: {
          text: "Cel neprihănit va trăi prin credință.",
          ref: "Romani 1:17",
        },
        w: {
          w1: {
            name: "Martin Luther",
            years: "1483–1546",
            place: "Wittenberg, Germania",
            text: "Călugăr și profesor de teologie. La 31 octombrie 1517 a scris cele 95 de teze împotriva vânzării iertării de păcate pe bani. În 1521, la Dieta de la Worms, în fața împăratului, a refuzat să-și retragă scrierile, fiindcă era legat de Cuvântul lui Dumnezeu. A fost declarat în afara legii; prietenii l-au ascuns în castelul Wartburg, unde a tradus Noul Testament în germană (1522). Învățătura lui se rezumă în trei cuvinte: numai Scriptura, numai harul, numai credința. N-a fost fără greșeli: la bătrânețe a scris cuvinte aspre și nedrepte împotriva evreilor, pe care nu le putem lua drept bune.",
            quote: "Conștiința mea e prinsă de Cuvântul lui Dumnezeu. Nu pot și nu vreau să retrag nimic. (Worms, 1521)",
          },
          w2: {
            name: "Felix Manz",
            years: "1527",
            place: "Zürich, Elveția",
            text: "Unul dintre primii „anabaptiști”, care credeau că botezul e pentru cei care cred și se pocăiesc. Autoritățile protestante din Zürich l-au înecat în râul Limmat. Mii de anabaptiști au fost uciși atunci, și de catolici, și de protestanți.",
          },
          w3: {
            name: "William Tyndale",
            years: "1536",
            place: "Vilvoorde, lângă Bruxelles",
            text: "A tradus Noul Testament din greacă în engleză, deși era interzis, și l-a tipărit în străinătate; exemplarele erau trecute ascuns în Anglia. A fost trădat, închis și apoi sugrumat și ars. Traducerea lui stă la baza Bibliei englezești de mai târziu.",
            quote: "Doamne, deschide ochii regelui Angliei!",
          },
          w4: {
            name: "Diaconul Coresi și primele cărți românești",
            years: "1559–1582",
            place: "Brașov, Orăștie",
            text: "La Brașov, în vremea Reformei, diaconul Coresi a tipărit primele cărți în limba română, între care Evanghelia (Tetraevanghelul, 1561). La Orăștie s-a tipărit în 1582 Palia, primele cărți ale Vechiului Testament în românește. Pentru prima dată, românii puteau auzi Cuvântul în limba lor.",
          },
          w5: {
            name: "Dieta de la Turda",
            years: "1568",
            place: "Turda, Transilvania",
            text: "Dieta Transilvaniei a hotărât ca fiecare comunitate să-și poată alege predicatorul, „fiindcă credința e un dar al lui Dumnezeu”. A fost una dintre primele legi de libertate religioasă din Europa. Românii ortodocși, însă, au rămas doar „tolerați”, fără aceleași drepturi.",
          },
          w6: {
            name: "Latimer și Ridley",
            years: "1555",
            place: "Oxford, Anglia",
            text: "Doi episcopi englezi arși pe același rug în timpul reginei Maria I, care a omorât aproape trei sute de protestanți. Latimer i-a spus prietenului său să fie curajos, fiindcă vor aprinde în ziua aceea o lumină care nu se va mai stinge.",
          },
          w7: {
            name: "Noaptea Sfântului Bartolomeu",
            years: "1572",
            place: "Paris și Franța",
            text: "În noaptea de 24 august, mii de protestanți francezi (hughenoți) au fost măcelăriți la Paris, apoi în alte orașe. Mulți dintre cei rămași au fugit din țară.",
          },
          w8: {
            name: "Biblia pe românește",
            years: "1648–1688",
            place: "Bălgrad (Alba Iulia), București",
            text: "În 1648 apare la Bălgrad Noul Testament în română, iar în 1688, la București, prima Biblie întreagă în limba română, cu sprijinul domnitorului Șerban Cantacuzino.",
          },
        },
      },
      trezire: {
        name: "Trezire și misiune",
        intro: "Veacurile acestea au adus mișcări de înnoire în multe țări și pe primii misionari plecați până la capătul pământului, dar și noi martiri, sub turci, în colonii și în țările unde creștinismul ajungea pentru prima dată.",
        verse: {
          text: "Isus Hristos este același ieri și azi și în veci!",
          ref: "Evrei 13:8",
        },
        w: {
          w1: {
            name: "Constantin Brâncoveanu și fiii lui",
            years: "1714",
            place: "Constantinopol",
            text: "Domnitorul Țării Românești a fost mazilit și dus la Constantinopol cu cei patru fii și cu sfetnicul Ienache. La 15 august 1714 li s-a cerut să se lepede de credință ca să scape. Au refuzat și au fost decapitați, întâi fiii, sub ochii tatălui, apoi el.",
          },
          w2: {
            name: "Frații moravi de la Herrnhut",
            years: "1727",
            place: "Saxonia",
            text: "Urmașii husiților, refugiați pe moșia contelui Zinzendorf, au început o rugăciune neîntreruptă care a ținut o sută de ani și au trimis misionari printre sclavii din Caraibe, în Groenlanda și în Africa.",
          },
          w3: {
            name: "Martirii din China (Răscoala Boxerilor)",
            years: "1900",
            place: "Nordul Chinei",
            text: "În răscoala împotriva străinilor au fost uciși câteva sute de misionari și peste treizeci de mii de creștini chinezi. Biserica din China, în loc să dispară, a crescut în secolul următor până la zeci de milioane.",
          },
        },
      },
      "secolul-xx": {
        name: "Secolul martirilor",
        intro: "Secolul al XX-lea a adus cele mai mari prigoane de până atunci: genocidul armenilor, teroarea sovietică, nazismul și, după al Doilea Război Mondial, comunismul impus și în România. Statul ateu a vrut să scoată credința din inima oamenilor. N-a reușit. În închisori, oamenii învățau versete pe de rost și le dădeau mai departe prin ziduri.",
        verse: {
          text: "Suntem încolțiți în toate chipurile, dar nu la strâmtoare; în grea cumpănă, dar nu deznădăjduiți; prigoniți, dar nu părăsiți; trântiți jos, dar nu omorâți.",
          ref: "2 Corinteni 4:8–9",
        },
        w: {
          w1: {
            name: "Genocidul armenilor",
            years: "1915–1923",
            place: "Imperiul Otoman",
            text: "Aproximativ un milion și jumătate de armeni, cel mai vechi popor creștin, au fost uciși sau au murit în deportări. Au pierit atunci și sute de mii de creștini asirieni și greci.",
          },
          w2: {
            name: "Iosif Trifa și Oastea Domnului",
            years: "1923–1948",
            place: "Sibiu, apoi toată țara",
            text: "Preotul Iosif Trifa a pornit în 1923 o mișcare de trezire printre ortodocși, cu Biblia, cântări și lepădarea de băutură și înjurături. Comuniștii au interzis-o în 1948; frații ei s-au adunat ascuns zeci de ani. Poetul Traian Dorz și compozitorul Nicolae Moldoveanu, doi dintre frații ei, au trecut prin închisori (vezi poveștile lor mai jos).",
          },
          w3: {
            name: "Dumitru Cornilescu",
            years: "1921–1923",
            place: "Stânca-Ștefănești, București",
            text: "Tânăr diacon ortodox care a tradus Biblia într-o română vie și limpede (1921, revizuită în 1924). Citind-o, a ajuns la o credință personală în Hristos. A fost silit să plece din țară în 1923 și n-a mai revenit; a murit în Elveția în 1975. Traducerea lui e citită și azi de milioane de români.",
          },
          w4: {
            name: "Dietrich Bonhoeffer",
            years: "1945",
            place: "Flossenbürg, Germania",
            text: "Pastor german care s-a opus lui Hitler și a ajutat evrei să scape. A fost închis doi ani și spânzurat la 9 aprilie 1945, cu câteva săptămâni înainte de sfârșitul războiului.",
          },
          w5: {
            name: "Episcopii greco-catolici",
            years: "1948–1970",
            place: "Sighet, Căldărușani, Blaj",
            text: "În 1948, comuniștii au desființat Biserica Greco-Catolică, i-au luat bisericile și i-au arestat toți episcopii. Cinci dintre ei au murit în închisoare sau în domiciliu forțat; episcopul Iuliu Hossu, care citise la Alba Iulia, la 1 Decembrie 1918, Declarația de Unire, a murit în 1970 fără să fie eliberat.",
          },
          w6: {
            name: "Richard și Sabina Wurmbrand",
            years: "1948–1964",
            place: "Văcărești, Jilava, Gherla",
            text: "Pastor luteran din București, evreu întors la Hristos. A fost arestat în 1948 și a stat în total paisprezece ani în închisori, trei dintre ei într-o celulă singur, sub pământ; și soția lui, Sabina, a trecut prin lagăr. Eliberat în 1964 și răscumpărat din țară, a scris „Torturat pentru Hristos” și a întemeiat o misiune care ajută și azi creștinii prigoniți.",
          },
          w7: {
            name: "Preoți, pastori și credincioși de toate confesiunile",
            years: "1948–1989",
            place: "Aiud, Gherla, Pitești, Canal",
            text: "Mii de preoți ortodocși și greco-catolici, pastori baptiști, penticostali, adventiști și creștini după Evanghelie au trecut prin închisori și lagăre. Teologul Dumitru Stăniloae a fost închis cinci ani. Preotul Gheorghe Calciu a stat douăzeci și unu de ani în închisoare, ultima dată pentru predicile ținute tinerilor în 1978. Bibliile erau aduse pe ascuns, peste graniță, de creștini din Occident.",
          },
          w8: {
            name: "Timișoara, decembrie 1989",
            years: "1989",
            place: "Timișoara",
            text: "Revoluția a pornit de la un lanț de oameni de toate confesiunile care au stat în fața casei pastorului reformat László Tőkés, ca să nu fie evacuat. În piață, mulțimea a strigat „Există Dumnezeu!”.",
          },
        },
      },
      azi: {
        name: "Prigoana de azi",
        intro: "Prigoana nu s-a oprit. După Open Doors, care urmărește în fiecare an situația, peste 380 de milioane de creștini, cam unul din șapte, trăiesc azi într-o țară unde credința îi poate costa slujba, libertatea sau viața: în Coreea de Nord, în părți din Africa, în Orientul Mijlociu, în Asia. Și azi, Biserica crește tocmai acolo unde e cel mai greu.",
        verse: {
          text: "De altfel, toți cei ce voiesc să trăiască cu evlavie în Hristos Isus vor fi prigoniți.",
          ref: "2 Timotei 3:12",
        },
        w: {
          w1: {
            name: "Cei 21 de pe țărmul Libiei",
            years: "2015",
            place: "Sirte, Libia",
            text: "Douăzeci de muncitori creștini copți din Egipt și un tânăr din Ghana au fost uciși de gruparea Stat Islamic. Înregistrarea arată că mulți dintre ei rosteau numele lui Isus în ultima clipă.",
          },
          w2: {
            name: "Creștinii din Nigeria",
            years: "azi",
            place: "Nordul și centrul Nigeriei",
            text: "Sate întregi sunt atacate și biserici arse aproape în fiecare săptămână. Nigeria e țara în care sunt uciși cei mai mulți creștini pentru credința lor.",
          },
          w3: {
            name: "Biserica din Coreea de Nord",
            years: "azi",
            place: "Coreea de Nord",
            text: "A avea o Biblie poate duce o familie întreagă în lagăr. Și totuși, zeci de mii de credincioși se roagă în ascuns.",
          },
          w4: {
            name: "Libertatea de la noi",
            years: "1990–azi",
            place: "România",
            text: "După 1989, Biblia se tipărește și se citește liber în România. E un dar plătit cu suferința celor dinaintea noastră și o datorie: să ne rugăm pentru cei care azi trec prin ce au trecut ei.",
          },
        },
      },
    },
    heroesIntro: "Istoria aceasta nu e doar o listă de suferințe. E și istoria unor oameni obișnuiți, din satele și orașele noastre, care au rămas întregi acolo unde regimul voia să-i frângă. Au ieșit din închisoare fără ură și au lăsat în urmă cărți, cântece și poezii pe care oamenii le știu și azi.",
    heroes: {
      wurmbrand: {
        name: "Richard Wurmbrand",
        years: "1909–2001",
        who: "Pastor luteran din București, născut într-o familie de evrei. Paisprezece ani în închisorile comuniste.",
        story: {
          p1: "În 1945, comuniștii au strâns la București un „Congres al cultelor”, unde preoți și pastori, unul după altul, lăudau noua stăpânire. Sabina, soția lui, i-a spus: „Richard, ridică-te și spală rușinea aceasta de pe fața lui Hristos!” El i-a răspuns că, dacă vorbește, ea își pierde soțul. Sabina a zis că nu vrea un laș de bărbat. Richard s-a ridicat și a spus în fața tuturor că datoria Bisericii e să-L vestească pe Hristos, nu să laude puterea.",
          p2: "În 1948 a fost luat de pe stradă și a dispărut ani de zile; familia nici nu știa dacă mai trăiește. Trei ani a stat singur într-o celulă sub pământ, fără carte, fără lumină de zi, fără să vadă om în afară de paznici. Ca să nu-și piardă mințile, în fiecare noapte își alcătuia o predică și o rostea în gând, ca și cum ar fi vorbit unei biserici întregi. Cu deținuții din celulele vecine vorbea bătând în perete, literă cu literă; așa a ajuns să-i vestească Evanghelia unui om pe care nu l-a văzut niciodată la față.",
          p3: "Mai târziu povestea că, citindu-și în minte cuvintele Domnului „Bucurați-vă în ziua aceea și săltați de veselie”, s-a ridicat în celulă și a dansat de bucurie. Paznicii au crezut că a înnebunit și i-au adus mâncare mai multă.",
          p4: "Eliberat în 1964 și răscumpărat din țară de creștini din Norvegia, s-a dezbrăcat în fața Senatului american ca să arate urmele torturii. A scris „Torturat pentru Hristos” și a întemeiat o misiune care ajută și azi creștinii prigoniți. Ce spunea cel mai des: că i-a iubit pe cei care l-au chinuit și că s-a rugat pentru ei.",
        },
        lesson: "Wurmbrand a pierdut aproape tot: libertatea, sănătatea, paisprezece ani din viață. A ieșit fără ură față de cei care l-au chinuit și și-a petrecut restul vieții vorbind lumii despre cei rămași în închisori.",
        verse: {
          text: "Bucurați-vă în ziua aceea și săltați de veselie, pentru că răsplata voastră este mare în cer",
          ref: "Luca 6:23",
        },
      },
      moldoveanu: {
        name: "Nicolae Moldoveanu",
        years: "1922–2007",
        who: "Compozitor din Oastea Domnului, „David al cântării românești”. Cinci ani de închisoare pentru că a scris cântări.",
        story: {
          p1: "S-a născut la Movileni, în județul Tecuci (azi Galați), și a rămas orfan de tată de mic. Crescut într-o fanfară militară pentru copii săraci, își vindea jumătate din porția de pâine și tot laptele ca să-și cumpere o Biblie și revista Oastei Domnului.",
          p2: "În 1959 a fost arestat pentru „compunere de cântări religioase și propagandă religioasă” și condamnat la doisprezece ani; a făcut cinci. În închisoare n-avea nici creion, nici hârtie, nici portativ. Și totuși a compus acolo trei sute cincizeci de cântări, pe care le-a ținut minte, notă cu notă, și le-a scris abia după ce a ieșit.",
          p3: "Richard Wurmbrand, care i-a fost coleg de celulă la Gherla, povestea o noapte de iarnă: n-aveau haine groase, dormeau pe ciment gol, iar paznicii îi tot sculau și-i culcau la comandă. Ceilalți înjurau. Moldoveanu lăuda pe Dumnezeu și, întins pe ciment, i-a cântat o cântare nouă, plină de bucurie și nădejde, care se cântă azi în multe țări.",
          p4: "A scris în viața lui peste șapte mii de cântări, multe pe versurile lui Traian Dorz, care se cântă și acum în bisericile din toată țara. Când Wurmbrand s-a întors în România, în 1990, primul om pe care l-a văzut a fost el.",
        },
        lesson: "Poți fi închis, dar nu poți fi oprit să cânți. Ce a fost semănat în întuneric cântă azi în biserici pline.",
        verse: {
          text: "Suntem încolțiți în toate chipurile, dar nu la strâmtoare; în grea cumpănă, dar nu deznădăjduiți;",
          ref: "2 Corinteni 4:8",
        },
      },
      dorz: {
        name: "Traian Dorz",
        years: "1914–1989",
        who: "Poet țăran din Livada Beiușului (Bihor), din Oastea Domnului. Aproape optsprezece ani în închisori și colonii de muncă.",
        story: {
          p1: "Copil de țărani săraci, a primit la școală, ca premiu, o carte a preotului Iosif Trifa. A citit-o, s-a predat lui Hristos la cincisprezece ani și a început chiar atunci să scrie versuri.",
          p2: "A fost arestat prima dată în decembrie 1947, apoi iar și iar: Oradea, Gherla, Deva, Periprava, Bărăganul. În 1959 a fost condamnat la șaisprezece ani de muncă silnică; a fost eliberat în 1964. Într-un interogatoriu l-au pus la zid cu pistolul la tâmplă, ca să-l înfricoșeze; spunea mai târziu că a trecut atunci prin propria moarte și n-a mai avut de ce să se teamă.",
          p3: "Celula era atât de mică încât nu putea sta drept în picioare. Nu avea voie să scrie, așa că a compus poeziile în minte și a ținut minte mai mult de trei sute, pe care le-a scris după eliberare. Fiica lui îi aducea pachete pe care gardienii le dădeau câinilor; atunci ea a găsit o gaură în gard, știută doar de ei doi, și îi lăsa mâncarea acolo.",
          p4: "Și după închisoare, Securitatea îl urmărea; când vedeau lampa aprinsă noaptea, îi strigau că n-are voie să scrie. El scria mai departe. A murit în iunie 1989, cu jumătate de an înainte de căderea comunismului; deși autoritățile au încercat să oprească lumea, la înmormântarea lui au venit peste zece mii de oameni.",
        },
        lesson: "Ce ține minte inima nu poate fi confiscat. Poeziile scrise pe ascuns, la lampă, se cântă azi în toată țara.",
        verse: {
          text: "Fii credincios până la moarte și-ți voi da cununa vieții.",
          ref: "Apocalipsa 2:10",
        },
      },
    },
    bibleIntro: "Multă vreme, românii au ascultat slujba în slavonă, o limbă pe care preotul abia o înțelegea, iar poporul deloc. Textul biblic a ajuns la ei în limba mamei încet, carte cu carte, în trei sute de ani, iar odată cu el s-a născut româna scrisă.",
    steps: {
      b1: {
        year: "sec. XV–XVI",
        title: "Primele texte scrise de mână",
        who: "Traducători necunoscuți, în Maramureș și nordul Ardealului",
        text: "Cele mai vechi bucăți din Biblie în românește sunt manuscrise: Psaltirea Scheiană, Psaltirea Voronețeană, Codicele Voronețean (Faptele Apostolilor și epistolele). Ni s-au păstrat în copii din secolul al XVI-lea și sunt scrise în graiul din nord. Nu știm sigur cine le-a tradus; unii istorici cred că au fost îndemnați de ecourile husiților sau ale Reformei.",
      },
      b2: {
        year: "1561",
        title: "Tetraevanghelul lui Coresi",
        who: "Diaconul Coresi, la Brașov, cu sprijinul judelui sas Hans Benkner",
        text: "Prima carte tipărită cu cele patru Evanghelii în limba română. Au urmat Apostolul (1563) și Psaltirea (1570). Prefețele cărților de atunci spun de ce: toate popoarele aveau Cuvântul lui Dumnezeu în limba lor, numai românii nu. Cărțile lui au ajuns în bisericile din toate cele trei țări românești și au așezat graiul din Muntenia și din sudul Ardealului la temelia limbii literare de azi.",
      },
      b3: {
        year: "1582",
        title: "Palia de la Orăștie",
        who: "Episcopul Mihail Tordaș și alți patru preoți, cu sprijinul lui Francisc Geszti",
        text: "Prima traducere în română a primelor cărți din Vechiul Testament: Geneza și Exodul. Prefața le spune cititorilor că au tradus-o ca să aibă și românii Scriptura, așa cum o au celelalte neamuri.",
      },
      b4: {
        year: "1648",
        title: "Noul Testament de la Bălgrad",
        who: "Mitropolitul Simion Ștefan al Ardealului, la Alba Iulia",
        text: "Primul Noul Testament întreg în românește, tradus din greacă și latină. În prefață, mitropolitul a scris că a ales cuvintele pe care le înțeleg românii din toate țările, fiindcă vorbeau diferit de la un ținut la altul. A fost, pe față, un gând de unitate a limbii.",
        quote: "Cuvintele trebuie să fie ca banii, că banii aceia sunt buni carii îmblă în toate țările; așa și cuvintele acelea sunt bune carele le înțeleg toți.",
      },
      b5: {
        year: "1688",
        title: "Biblia de la București",
        who: "Pornită de Șerban Cantacuzino, terminată sub Constantin Brâncoveanu; traducători: Nicolae Milescu, frații Radu și Șerban Greceanu",
        text: "Prima Biblie întreagă în limba română. Vechiul Testament a pornit de la traducerea făcută de cărturarul moldovean Nicolae Milescu, revizuită la București de frații Greceanu. Pentru prima dată, Moldova, Muntenia și Ardealul aveau aceeași Biblie, în aceeași limbă; ea a fost limba de carte a românilor timp de peste o sută de ani.",
      },
      b6: {
        year: "1795",
        title: "Biblia de la Blaj",
        who: "Samuil Micu, din Școala Ardeleană",
        text: "Tradusă din nou, după Septuaginta, de un cărturar greco-catolic. A trecut prin mâinile multor generații de preoți și dascăli din Ardeal.",
      },
      b7: {
        year: "1856–1858",
        title: "Biblia lui Șaguna",
        who: "Mitropolitul Andrei Șaguna, la Sibiu",
        text: "O ediție îngrijită pentru credincioșii ortodocși din Ardeal, cu o limbă mai apropiată de cea vorbită.",
      },
      b8: {
        year: "1921–1924",
        title: "Biblia Cornilescu",
        who: "Dumitru Cornilescu, ajutat de prințesa Ralu Callimachi",
        text: "Un tânăr diacon ortodox a tradus Biblia într-o română vie și limpede, pe care o înțelege oricine. Citind-o, a ajuns el însuși la o credință vie în Hristos. Societatea Biblică Britanică a primit-o în 1924 și a răspândit-o în sute de mii de exemplare. A fost silit să plece din țară în 1923, dar traducerea lui a rămas Biblia de căpătâi a milioane de români.",
      },
      b9: {
        year: "1914–1988",
        title: "Bibliile Sinodale",
        who: "Biserica Ortodoxă Română (traduceri de Gala Galaction, Vasile Radu și alții)",
        text: "Ediții oficiale ale Bisericii Ortodoxe, revizuite de mai multe ori. Cea din 1988, tipărită sub comuniști, a ajuns în puține case; Bibliile erau atunci greu de găsit.",
      },
    },
    influence: {
      i1: "Limba română scrisă s-a născut, în mare parte, din cărțile bisericii. Bibliile și cărțile de slujbă au fost primele lucruri citite în toate ținuturile, așa că au ajutat la o limbă comună pentru toți românii, cu mult înainte de Unirea din 1918. Eminescu spunea că Biserica și cărțile ei au dat românilor unitatea limbii.",
      i2: "Cine voia să citească Scriptura trebuia să învețe carte. Pe lângă biserici s-au deschis școli, iar la Blaj, în 1754, școlile au fost numite „izvoarele darurilor”. Dascălii satelor au fost multă vreme cântăreții de la strană.",
      i3: "Când oamenii simpli au putut citi singuri, s-au născut mișcări pornite din popor: Oastea Domnului, bisericile neoprotestante, cercurile de citire din sate. Credința a încetat să fie doar a preotului și a devenit a fiecărui om.",
      i4: "De aceea regimul comunist s-a temut de cărțile acestea: un om care citește și gândește singur nu mai poate fi mințit ușor.",
    },
    bibleVerse: {
      text: "Descoperirea cuvintelor Tale dă lumină, dă pricepere celor fără răutate.",
      ref: "Psalmul 119:130",
    },
    endVerses: {
      v1: {
        text: "Dacă M-au prigonit pe Mine, și pe voi vă vor prigoni; dacă au păzit cuvântul Meu, și pe al vostru îl vor păzi.",
        ref: "Ioan 15:20",
      },
      v2: {
        text: "Ferice de cei prigoniți din pricina neprihănirii, căci a lor este Împărăția cerurilor!",
        ref: "Matei 5:10",
      },
      v3: {
        text: "V-am spus aceste lucruri ca să aveți pace în Mine. În lume veți avea necazuri, dar îndrăzniți, Eu am biruit lumea.",
        ref: "Ioan 16:33",
      },
    },
  },
};

export type BisericaCatalog = Widen<typeof roBiserica>;
