import type { Theme } from "../tipuri";

/**
 * Ciorne (Daniel, 18.11.2026): istoria emigrării românești pe țări, pe valuri, în limba țării și în română. Italia, Spania,
 * Germania, Austria. Doar fapte cunoscute sigur; cifrele sunt rotunde și aceleași ca pe paginile țărilor.
 */
export const THEMES_1: Theme[] = [
  // ---------------------------------------------------------------- Italia
  {
    slug: "istoria-romanilor-din-italia", langs: ["it", "ro"], related: ["italia"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila", "cum-implici-familia"],
    name: {ro: "Românii din Italia: valurile de emigrare", it: "I romeni in Italia: le ondate migratorie" },
    description: {
      ro: "Cum au ajuns românii în Italia, de la exilații de dinainte de 1990 la valul de după 2002, de unde au plecat și ce acte cauți.",
      it: "Come sono arrivati i romeni in Italia, dagli esuli di prima del 1990 all'ondata dopo il 2002, da dove sono partiti e quali atti cercare.",
    },
    body: {
      ro: [
        { h: "Înainte de 1990: legături de cultură", p: [
          "Legătura românilor cu Italia e veche, dar până în 1990 a fost mai ales una de cultură. La Roma funcționează din 1922 Academia di Romania, unde au studiat bursieri români, arheologi, istorici și artiști. La Veneția, Nicolae Iorga a înființat în 1930 Institutul Român de Cultură și Cercetare Umanistică. După 1947 au ajuns în Italia și câțiva exilați politici, dar comunitatea era mică.",
        ] },
        { h: "Anii '90: primii plecați", p: [
          "După căderea comunismului, primii români care au venit la muncă în Italia au fost bărbați tineri, mulți în construcții și în agricultură, și femei care au îngrijit bătrâni în familii italiene. Pentru că până în 2002 era nevoie de viză, mulți au venit cu greu și au trăit ani de zile fără acte de ședere, până la regularizările făcute de statul italian.",
        ] },
        { h: "După 2002 și 2007: valul mare", p: [
          "De la 1 ianuarie 2002 românii au putut călători fără viză în spațiul Schengen, iar din 2007 România e în Uniunea Europeană. În acești ani comunitatea a crescut repede și a ajuns la aproape un milion de cetățeni români, cea mai mare comunitate străină din Italia, potrivit ISTAT.",
          "Au plecat mulți din Moldova (Bacău, Neamț, Suceava, Iași, Vaslui), dar și din Transilvania, Muntenia și Oltenia. Adesea a plecat întâi un membru al familiei, apoi au venit ceilalți, iar sate întregi și-au găsit locul în același oraș italian. Cele mai mari comunități sunt în Lazio, mai ales la Roma, în Piemont, la Torino, în Lombardia și în Veneto.",
        ] },
        { h: "A doua generație", p: [
          "Azi sute de mii de copii de români s-au născut sau au crescut în Italia. Mulți vorbesc mai bine italiana decât româna și își cunosc bunicii mai ales din vacanțele de vară. Pentru ei, arborele familiei e felul în care află din ce sat vin părinții, cum se numeau străbunicii și de ce familia a ajuns acolo unde e.",
        ] },
        { h: "Numele în actele italiene", p: [
          "În actele italiene, diacriticele românești se pierd adesea: Știrbu devine Stirbu, Țăranu devine Taranu, iar Ioan apare uneori ca Giovanni în documentele mai vechi. Femeile căsătorite își păstrează legal numele de naștere în Italia, deci o bunică poate apărea cu numele de fată în actele italiene și cu numele soțului în cele românești. Când cauți pe cineva, încearcă toate formele.",
          "Copiii născuți în Italia din părinți români sunt cetățeni români prin părinții lor, iar actul de naștere italian se transcrie în registrele românești; cetățenia italiană o pot cere abia mai târziu, după regulile statului italian. De aceea multe familii au acte în ambele țări pentru aceeași persoană.",
        ] },
        { h: "Ce acte cauți", p: [
          "Pentru familia din Italia: certificatele de naștere și căsătorie italiene sunt la ufficio di stato civile al comunei; dacă ai cetățenie română, ele se transcriu în registrele românești prin consulat. Pentru familia din România: actele de stare civilă sunt la primăria unde s-au înregistrat, iar registrele mai vechi de 100 de ani la Arhivele Naționale. Cel mai important e satul de origine, scris corect: de el depind toate celelalte căutări.",
        ] },
      ],
      it: [
        { h: "Prima del 1990: legami culturali", p: [
          "Il legame dei romeni con l'Italia è antico, ma fino al 1990 è stato soprattutto culturale. A Roma è attiva dal 1922 l'Accademia di Romania, dove hanno studiato borsisti romeni, archeologi, storici e artisti. A Venezia lo storico Nicolae Iorga fondò nel 1930 l'Istituto Romeno di Cultura e Ricerca Umanistica. Dopo il 1947 arrivarono in Italia anche alcuni esuli politici, ma la comunità era piccola.",
        ] },
        { h: "Gli anni Novanta: i primi arrivi", p: [
          "Dopo la caduta del comunismo, i primi romeni venuti a lavorare in Italia furono giovani uomini, molti nell'edilizia e in agricoltura, e donne che assistevano gli anziani nelle famiglie italiane. Poiché fino al 2002 serviva il visto, molti arrivarono con difficoltà e vissero per anni senza permesso di soggiorno, fino alle regolarizzazioni decise dallo Stato italiano.",
        ] },
        { h: "Dopo il 2002 e il 2007: la grande ondata", p: [
          "Dal 1° gennaio 2002 i romeni hanno potuto viaggiare senza visto nell'area Schengen e dal 2007 la Romania è nell'Unione europea. In quegli anni la comunità è cresciuta rapidamente fino a quasi un milione di cittadini romeni, la più grande comunità straniera in Italia secondo l'ISTAT.",
          "Molti sono partiti dalla Moldavia romena (Bacău, Neamț, Suceava, Iași, Vaslui), ma anche dalla Transilvania, dalla Muntenia e dall'Oltenia. Spesso partiva prima un membro della famiglia e poi arrivavano gli altri, e interi paesi si sono ritrovati nella stessa città italiana. Le comunità più grandi sono nel Lazio, soprattutto a Roma, in Piemonte, a Torino, in Lombardia e in Veneto.",
        ] },
        { h: "La seconda generazione", p: [
          "Oggi centinaia di migliaia di figli di romeni sono nati o cresciuti in Italia. Molti parlano l'italiano meglio del romeno e conoscono i nonni soprattutto dalle vacanze estive. Per loro l'albero di famiglia è il modo per scoprire da quale paese vengono i genitori, come si chiamavano i bisnonni e perché la famiglia è arrivata dove si trova.",
        ] },
        { h: "I nomi nei documenti italiani", p: [
          "Nei documenti italiani i segni diacritici romeni si perdono spesso: Știrbu diventa Stirbu, Țăranu diventa Taranu, e nei documenti più vecchi Ioan compare talvolta come Giovanni. In Italia le donne sposate conservano per legge il cognome di nascita, quindi una nonna può comparire con il cognome da nubile nei documenti italiani e con quello del marito in quelli romeni. Quando cercate qualcuno, provate tutte le forme.",
          "I figli nati in Italia da genitori romeni sono cittadini romeni attraverso i genitori, e l'atto di nascita italiano viene trascritto nei registri romeni; la cittadinanza italiana possono chiederla solo più tardi, secondo le regole dello Stato italiano. Per questo molte famiglie hanno documenti in entrambi i paesi per la stessa persona.",
        ] },
        { h: "Quali documenti cercare", p: [
          "Per la famiglia in Italia: gli atti di nascita e di matrimonio italiani si trovano all'ufficio di stato civile del comune; chi ha la cittadinanza romena li trascrive nei registri romeni tramite il consolato. Per la famiglia in Romania: gli atti di stato civile sono al comune dove sono stati registrati, mentre i registri con più di 100 anni sono agli Archivi nazionali romeni. La cosa più importante è il paese d'origine scritto correttamente: da lì partono tutte le altre ricerche.",
        ] },
      ],
    },
    records: [
      { name: "ISTAT – Istituto Nazionale di Statistica", url: "https://www.istat.it", note: { ro: "cetățenii străini rezidenți în Italia, pe regiuni", it: "cittadini stranieri residenti in Italia, per regione" } },
      { name: "Antenati – Portale degli Archivi di Stato", url: "https://antenati.cultura.gov.it", note: { ro: "registrele de stare civilă italiene, pentru familiile mixte", it: "registri dello stato civile italiano, per le famiglie miste" } },
    ],
  },
  // ---------------------------------------------------------------- Spania
  {
    slug: "istoria-romanilor-din-spania", langs: ["es", "ro"], related: ["spania"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila", "cum-implici-familia"],
    name: {ro: "Românii din Spania: valurile de emigrare", es: "Los rumanos en España: las oleadas migratorias" },
    description: {
      ro: "Cum au ajuns românii în Spania: primii veniți în anii '90, valul de după 2002, criza din 2008 și actele pentru arborele familiei.",
      es: "Cómo llegaron los rumanos a España: los primeros en los noventa, la oleada tras 2002, la crisis de 2008 y los documentos para el árbol.",
    },
    body: {
      ro: [
        { h: "Sfârșitul anilor '90: primii veniți", p: [
          "Până în anii '90, în Spania trăiau foarte puțini români. Primii au venit la sfârșitul deceniului, mai ales bărbați care au lucrat în construcții și în agricultură. Mulți s-au oprit în jurul Madridului, în orașe ca Coslada, Alcalá de Henares și Arganda del Rey, unde chiriile erau mai mici și unde se găsea de lucru.",
        ] },
        { h: "După 2002: valul mare și anii de boom", p: [
          "Ridicarea vizelor Schengen de la 1 ianuarie 2002 și anii de creștere a construcțiilor de dinainte de 2008 au adus sute de mii de români. După aderarea României la Uniunea Europeană, în 2007, comunitatea a trecut de o jumătate de milion de oameni și a devenit una dintre cele mai mari comunități străine din Spania.",
          "Mulți au venit din Muntenia și Oltenia (Teleorman, Dâmbovița, Olt, Dolj), dar și din Moldova și Transilvania. În Castellón s-a format una dintre cele mai mari comunități, iar sezonierii au lucrat la culesul căpșunilor în Huelva, la fructe în Lleida și în serele din Almería.",
        ] },
        { h: "Criza din 2008 și după", p: [
          "Criza din 2008 a lovit tocmai construcțiile, unde lucrau mulți români. O parte s-au întors acasă, alții au plecat mai departe, în Germania sau Marea Britanie, iar cei rămași și-au schimbat meseria. Între 2011 și 2013, Spania a reintrodus temporar restricții pentru angajarea românilor nou veniți. Comunitatea a rămas totuși mare și stabilă, cu familii care au cumpărat case și copii care au terminat școala aici.",
        ] },
        { h: "Numele în actele spaniole", p: [
          "În Spania, oamenii poartă de obicei două nume de familie, al tatălui și al mamei, iar femeile nu iau numele soțului. De aceea, în actele spaniole ale unei familii românești, numele pot apărea în altă ordine sau în altă combinație decât în cele românești. Diacriticele se pierd adesea: Șerban devine Serban. Când cauți o rudă, încearcă toate formele numelui.",
        ] },
        { h: "Ce acte cauți", p: [
          "Actele de stare civilă spaniole sunt la Registro Civil; cetățenii români le transcriu în registrele românești prin consulat. Pentru strămoșii din România, primul pas e satul de origine: de acolo afli primăria care are actele și arhiva județeană care păstrează registrele vechi. Bunicii rămași acasă sunt cea mai bună sursă pentru nume și porecle.",
        ] },
      ],
      es: [
        { h: "Finales de los noventa: los primeros", p: [
          "Hasta los años noventa vivían muy pocos rumanos en España. Los primeros llegaron a finales de la década, sobre todo hombres que trabajaron en la construcción y en el campo. Muchos se quedaron alrededor de Madrid, en ciudades como Coslada, Alcalá de Henares y Arganda del Rey, donde los alquileres eran más baratos y había trabajo.",
        ] },
        { h: "Después de 2002: la gran oleada y los años del auge", p: [
          "La supresión de los visados Schengen el 1 de enero de 2002 y los años de auge de la construcción anteriores a 2008 trajeron a cientos de miles de rumanos. Tras la entrada de Rumanía en la Unión Europea, en 2007, la comunidad superó el medio millón de personas y se convirtió en una de las mayores comunidades extranjeras de España.",
          "Muchos llegaron de Muntenia y Oltenia (Teleorman, Dâmbovița, Olt, Dolj), y también de Moldavia y Transilvania. En Castellón se formó una de las mayores comunidades, y los temporeros trabajaron en la fresa de Huelva, en la fruta de Lleida y en los invernaderos de Almería.",
        ] },
        { h: "La crisis de 2008 y después", p: [
          "La crisis de 2008 golpeó precisamente a la construcción, donde trabajaban muchos rumanos. Algunos volvieron a casa, otros siguieron hacia Alemania o el Reino Unido, y los que se quedaron cambiaron de oficio. Entre 2011 y 2013 España volvió a aplicar temporalmente restricciones a la contratación de rumanos recién llegados. Aun así, la comunidad siguió siendo grande y estable, con familias que compraron casa e hijos que terminaron aquí la escuela.",
        ] },
        { h: "Los nombres en los documentos españoles", p: [
          "En España se suelen llevar dos apellidos, el del padre y el de la madre, y las mujeres no adoptan el apellido del marido. Por eso, en los documentos españoles de una familia rumana, los apellidos pueden aparecer en otro orden o en otra combinación que en los rumanos. Los signos diacríticos se pierden a menudo: Șerban se convierte en Serban. Cuando busque a un familiar, pruebe todas las formas del apellido.",
        ] },
        { h: "Qué documentos buscar", p: [
          "Las actas de estado civil españolas están en el Registro Civil; los ciudadanos rumanos las transcriben en los registros rumanos a través del consulado. Para los antepasados en Rumanía, el primer paso es el pueblo de origen: con él se sabe qué ayuntamiento tiene las actas y qué archivo provincial guarda los registros antiguos. Los abuelos que se quedaron allí son la mejor fuente de nombres y apodos.",
        ] },
      ],
    },
    records: [
      { name: "INE – Instituto Nacional de Estadística", url: "https://www.ine.es", note: { ro: "populația străină din Spania, pe cetățenii și provincii", es: "población extranjera en España por nacionalidad y provincia" } },
      { name: "PARES – Portal de Archivos Españoles", url: "https://pares.cultura.gob.es", note: { ro: "arhivele statului spaniol, pentru familiile mixte", es: "archivos estatales españoles, para familias mixtas" } },
    ],
  },
  // ---------------------------------------------------------------- Germania
  {
    slug: "istoria-romanilor-din-germania", langs: ["de", "ro"], related: ["germania"],
    guides: ["sasii-din-transilvania-registre", "svabii-banateni-genealogie", "documente-in-maghiara-si-germana", "deportati-in-baragan-si-siberia"],
    name: {ro: "Românii și germanii din România în Germania", de: "Rumänen und Rumäniendeutsche in Deutschland" },
    description: {
      ro: "Trei drumuri spre Germania: sașii și șvabii, exilul de după 1947 și valul de după 2007, cu actele de căutat pentru fiecare.",
      de: "Drei Wege nach Deutschland: Sachsen und Schwaben, das Exil nach 1947 und die Zuwanderung nach 2007, mit Quellen für die Familienforschung.",
    },
    body: {
      ro: [
        { h: "Germanii din România", p: [
          "Prima și cea mai veche legătură e cea a germanilor din România. Sașii s-au așezat în Transilvania încă din secolul XII, șvabii bănățeni au venit în Banat în secolul XVIII, iar în Bucovina și Basarabia au trăit și ei comunități germane. La recensământul din 1930, în România trăiau peste 700.000 de germani.",
          "Germanii din Bucovina, din Basarabia și din nordul Dobrogei au fost strămutați în 1940. În ianuarie 1945, mii de germani din Transilvania și Banat au fost deportați la muncă în Uniunea Sovietică. După război, o parte au ajuns în Germania prin reîntregirea familiei, iar din anii '70 plecările au crescut, pe baza unor înțelegeri între cele două state prin care Germania de Vest plătea pentru fiecare om lăsat să plece. Valul cel mare a venit în 1990, după căderea comunismului: în câțiva ani, cei mai mulți sași și șvabi au plecat.",
        ] },
        { h: "Exilul de după 1947", p: [
          "Germania de Vest a fost și o țară a exilului românesc. La München a funcționat, din anii '50 până în anii '90, secția română a postului Radio Europa Liberă, pe care o ascultau pe ascuns milioane de oameni din România. În jurul ei s-a format o comunitate de jurnaliști, scriitori și refugiați politici.",
        ] },
        { h: "După 2007: valul de muncă", p: [
          "După aderarea României la Uniunea Europeană, mulți români au venit la muncă în Germania, iar de la 1 ianuarie 2014, când s-au ridicat ultimele restricții pe piața muncii, numărul lor a crescut repede. Azi trăiesc în Germania peste 800.000 de cetățeni români, de la medici și ingineri la muncitori în construcții, logistică și îngrijire. Cele mai mari comunități sunt în Bavaria, Baden-Württemberg, Renania de Nord-Westfalia și Hessa.",
        ] },
        { h: "Numele în actele germane", p: [
          "Numele sașilor și șvabilor apar în forme diferite în acte: în germană, în maghiară în actele de stare civilă de după 1895 din Transilvania și Banat, iar în română după 1918. Satele au și ele două sau trei nume: Hermannstadt e Sibiu, Großscheuern e Șura Mare. Pentru familiile venite recent, diacriticele românești dispar adesea în actele germane, iar la căsătorie soții își pot alege un nume de familie comun (Ehename) sau își pot păstra numele.",
        ] },
        { h: "Ce acte cauți", p: [
          "Pentru sași și șvabi există multe surse: registrele parohiale și de stare civilă (în germană, latină sau maghiară), cărțile de familie ale satelor (Ortssippenbücher) și arhivele asociațiilor lor din Germania. Pentru familiile venite după 1990 sau după 2007, actele sunt la primăriile din România și la Standesamt-ul orașului german. Pagina despre sași și șvabi și ghidurile legate mai jos arată unde se află fiecare.",
        ] },
      ],
      de: [
        { h: "Die Rumäniendeutschen", p: [
          "Die älteste Verbindung ist die der Deutschen aus Rumänien. Die Siebenbürger Sachsen siedelten seit dem 12. Jahrhundert in Siebenbürgen, die Banater Schwaben kamen im 18. Jahrhundert ins Banat, und auch in der Bukowina und in Bessarabien lebten deutsche Gemeinschaften. Bei der Volkszählung von 1930 lebten in Rumänien über 700.000 Deutsche.",
          "Die Deutschen aus der Bukowina, Bessarabien und der Norddobrudscha wurden 1940 umgesiedelt. Im Januar 1945 wurden Tausende Deutsche aus Siebenbürgen und dem Banat zur Zwangsarbeit in die Sowjetunion deportiert. Nach dem Krieg kamen einige über die Familienzusammenführung nach Deutschland, ab den 1970er-Jahren stieg die Zahl der Ausreisen auf Grundlage von Vereinbarungen, nach denen die Bundesrepublik für jede Ausreise zahlte. Die große Welle kam 1990, nach dem Ende des Kommunismus: Innerhalb weniger Jahre verließen die meisten Sachsen und Schwaben das Land.",
        ] },
        { h: "Das Exil nach 1947", p: [
          "Westdeutschland war auch ein Land des rumänischen Exils. In München sendete von den 1950er- bis in die 1990er-Jahre die rumänische Redaktion von Radio Freies Europa, die Millionen Menschen in Rumänien heimlich hörten. Um sie herum entstand eine Gemeinschaft von Journalisten, Schriftstellern und politischen Flüchtlingen.",
        ] },
        { h: "Nach 2007: Arbeitsmigration", p: [
          "Nach dem EU-Beitritt Rumäniens kamen viele Rumänen zum Arbeiten nach Deutschland, und seit dem 1. Januar 2014, als die letzten Beschränkungen auf dem Arbeitsmarkt fielen, ist ihre Zahl rasch gestiegen. Heute leben über 800.000 rumänische Staatsbürger in Deutschland, von Ärztinnen und Ingenieuren bis zu Beschäftigten in Bau, Logistik und Pflege. Die größten Gemeinschaften gibt es in Bayern, Baden-Württemberg, Nordrhein-Westfalen und Hessen.",
        ] },
        { h: "Namen in deutschen Urkunden", p: [
          "Die Namen der Sachsen und Schwaben erscheinen in den Urkunden in verschiedenen Formen: deutsch, nach 1895 in den staatlichen Standesbüchern Siebenbürgens und des Banats ungarisch, nach 1918 rumänisch. Auch die Orte haben zwei oder drei Namen: Hermannstadt ist Sibiu, Großscheuern ist Șura Mare. Bei Familien, die erst kürzlich gekommen sind, fehlen in deutschen Urkunden oft die rumänischen Sonderzeichen, und bei der Heirat können die Ehepartner einen gemeinsamen Ehenamen wählen oder ihre Namen behalten.",
        ] },
        { h: "Welche Quellen es gibt", p: [
          "Für Sachsen und Schwaben gibt es viele Quellen: Kirchen- und Standesbücher (auf Deutsch, Latein oder Ungarisch), Ortssippenbücher und die Archive ihrer Verbände in Deutschland. Für Familien, die nach 1990 oder nach 2007 gekommen sind, liegen die Urkunden bei den Rathäusern in Rumänien und beim Standesamt der deutschen Stadt. Die Seite über Sachsen und Schwaben und die Ratgeber unten zeigen, wo was zu finden ist.",
        ] },
      ],
    },
    records: [
      { name: "Statistisches Bundesamt (Destatis)", url: "https://www.destatis.de", note: { ro: "străinii din Germania, pe cetățenii și landuri", de: "Ausländische Bevölkerung nach Staatsangehörigkeit und Bundesland" } },
      { name: "Siebenbürgen-Institut", url: "https://www.siebenbuergen-institut.de", note: { ro: "biblioteca și arhiva sașilor transilvăneni, la Gundelsheim", de: "Bibliothek und Archiv der Siebenbürger Sachsen in Gundelsheim" } },
    ],
  },
  // ---------------------------------------------------------------- Austria
  {
    slug: "istoria-romanilor-din-austria", langs: ["de", "ro"], related: ["austria"],
    guides: ["bucovina-registre-si-arhive", "sasii-din-transilvania-registre", "stramosi-in-armata-austro-ungara", "documente-in-maghiara-si-germana"],
    name: {ro: "Românii din Austria: de la Imperiu până azi", de: "Rumänen in Österreich: vom Kaiserreich bis heute" },
    description: {
      ro: "Românii și Austria: provinciile habsburgice, studenții de la Viena, refugiații din 1944, exilul și noul val de după 2007.",
      de: "Rumänen und Österreich: habsburgische Kronländer, Studenten in Wien, die Flüchtlinge von 1944, das Exil und die Zuwanderung nach 2007.",
    },
    body: {
      ro: [
        { h: "Vremea Imperiului", p: [
          "Transilvania, Banatul și Bucovina au făcut parte, timp de generații, din Monarhia Habsburgică. Mulți strămoși de acolo au fost soldați în armata austriacă și, după 1867, austro-ungară, au avut acte scrise în germană sau maghiară și au trecut prin Viena ca studenți, soldați sau negustori.",
          "Viena a fost multă vreme orașul în care studiau tinerii români din Imperiu. Mihai Eminescu a fost student acolo între 1869 și 1872, iar în 1871 studenții români au înființat societatea România Jună. Arhivele vieneze păstrează și azi documente despre multe familii din Transilvania și Bucovina.",
        ] },
        { h: "Refugiații din 1944–1945", p: [
          "În toamna lui 1944, sașii din nordul Transilvaniei, din zona Bistriței, au fost evacuați spre vest. Mulți au rămas în Austria, mai ales în Austria Superioară, unde și-au refăcut viața. Tot atunci au ajuns în Austria și mulți șvabi dunăreni din Banat și din regiunile vecine.",
        ] },
        { h: "Exilul și anii comunismului", p: [
          "După 1947, Viena a fost pentru mulți români primul oraș din Occident: aici ajungeau cei care fugeau peste graniță sau care primeau, rar, voie să plece. Unii au rămas, alții au plecat mai departe, în Germania, Franța sau America.",
        ] },
        { h: "După 1990 și 2007", p: [
          "După 1990 au venit studenți și muncitori, iar după aderarea României la Uniunea Europeană și mai ales după 1 ianuarie 2014, când Austria și-a deschis complet piața muncii, comunitatea a crescut repede. Azi trăiesc în Austria peste 100.000 de cetățeni români, una dintre cele mai mari comunități străine din țară, cei mai mulți la Viena, în Austria Inferioară și în Austria Superioară.",
        ] },
        { h: "Numele în actele austriece", p: [
          "În actele din vremea Imperiului, același om poate apărea cu numele scris în germană, maghiară sau română, iar satele cu numele lor german: Czernowitz pentru Cernăuți, Bistritz pentru Bistrița. În actele austriece de azi, diacriticele românești lipsesc adesea, deci Ștefănescu poate deveni Stefanescu. Când cauți, scrie toate formele numelui și ale satului.",
        ] },
        { h: "Ce acte cauți", p: [
          "Pentru strămoșii din perioada habsburgică sunt utile registrele militare, registrele parohiale și documentele din arhivele austriece. Pentru familia de azi, actele austriece sunt la Standesamt, iar cele românești la primăria din România sau prin consulat.",
        ] },
      ],
      de: [
        { h: "Die Zeit des Reiches", p: [
          "Siebenbürgen, das Banat und die Bukowina gehörten über Generationen zur Habsburgermonarchie. Viele Vorfahren von dort dienten in der österreichischen, nach 1867 in der k. u. k. Armee, hatten Urkunden auf Deutsch oder Ungarisch und kamen als Studenten, Soldaten oder Händler nach Wien.",
          "Wien war lange die Stadt, in der junge Rumänen aus dem Reich studierten. Der Dichter Mihai Eminescu studierte dort von 1869 bis 1872, und 1871 gründeten rumänische Studenten den Verein România Jună. Wiener Archive bewahren bis heute Unterlagen über viele Familien aus Siebenbürgen und der Bukowina.",
        ] },
        { h: "Die Flüchtlinge von 1944–1945", p: [
          "Im Herbst 1944 wurden die Sachsen aus Nordsiebenbürgen, aus der Gegend um Bistritz, nach Westen evakuiert. Viele blieben in Österreich, vor allem in Oberösterreich, und bauten sich dort ein neues Leben auf. Zur selben Zeit kamen auch viele Donauschwaben aus dem Banat und den Nachbarregionen nach Österreich.",
        ] },
        { h: "Exil und kommunistische Jahre", p: [
          "Nach 1947 war Wien für viele Rumänen die erste Stadt im Westen: Hierher kamen jene, die über die Grenze flohen oder selten ausreisen durften. Manche blieben, andere zogen weiter nach Deutschland, Frankreich oder Amerika.",
        ] },
        { h: "Nach 1990 und 2007", p: [
          "Nach 1990 kamen Studierende und Arbeitskräfte, und nach dem EU-Beitritt Rumäniens, vor allem seit dem 1. Januar 2014, als Österreich den Arbeitsmarkt vollständig öffnete, wuchs die Gemeinschaft schnell. Heute leben über 100.000 rumänische Staatsbürger in Österreich, eine der größten ausländischen Gemeinschaften des Landes, die meisten in Wien, Niederösterreich und Oberösterreich.",
        ] },
        { h: "Namen in österreichischen Urkunden", p: [
          "In Urkunden aus der Zeit der Monarchie kann derselbe Mensch mit einem deutsch, ungarisch oder rumänisch geschriebenen Namen erscheinen, und die Dörfer mit ihrem deutschen Namen: Czernowitz für Cernăuți, Bistritz für Bistrița. In heutigen österreichischen Urkunden fehlen die rumänischen Sonderzeichen oft, sodass aus Ștefănescu Stefanescu werden kann. Notieren Sie bei der Suche alle Formen des Namens und des Ortes.",
        ] },
        { h: "Welche Quellen es gibt", p: [
          "Für Vorfahren aus der Habsburgerzeit sind Militärunterlagen, Kirchenbücher und österreichische Archive hilfreich. Für die heutige Familie liegen österreichische Urkunden beim Standesamt, rumänische beim Rathaus in Rumänien oder beim Konsulat.",
        ] },
      ],
    },
    records: [
      { name: "Österreichisches Staatsarchiv", url: "https://www.oesta.gv.at", note: { ro: "Arhivele de Stat ale Austriei, inclusiv arhiva de război", de: "Österreichisches Staatsarchiv, einschließlich Kriegsarchiv" } },
      { name: "Statistik Austria", url: "https://www.statistik.at", note: { ro: "populația din Austria, pe cetățenii și landuri", de: "Bevölkerung nach Staatsangehörigkeit und Bundesland" } },
    ],
  },
];
