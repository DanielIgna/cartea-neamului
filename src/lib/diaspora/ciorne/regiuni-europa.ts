import type { Region } from "../tipuri";

/**
 * Ciorne (Daniel, 18.11.2026): istoria locală a românilor pe regiuni din Italia, Spania, Germania și Austria, în limba
 * țării și în română. Orașele mari au deja pagini proprii (orase*.ts); aici e regiunea întreagă, cu provinciile din jur,
 * arhiva regională și legăturile istorice. Fără cifre pe care nu le știm sigur.
 */
export const EUROPE_REGIONS: Region[] = [
  // ================================================================ Italia
  {
    slug: "lazio", country: "it", kind: "region", mission: ["Roma"],
    name: { ro: "Lazio", it: "Lazio" }, where: { ro: "în Lazio", it: "nel Lazio" }, langs: ["it", "ro"],
    cities: ["Roma", "Guidonia Montecelio", "Tivoli", "Ladispoli", "Latina", "Viterbo"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "Lazio e regiunea Italiei cu cei mai mulți români. Cei mai mulți trăiesc la Roma și în comunele din jurul ei, de la Guidonia și Tivoli spre răsărit până la Ladispoli și Cerveteri pe malul mării, dar familii românești sunt și în provinciile Latina, Frosinone, Viterbo și Rieti, unde au lucrat în agricultură, în construcții și în îngrijirea vârstnicilor.",
        "Valul mare a venit după 2002, când românii au putut călători fără viză, și a crescut după 2007. Mulți au plecat din Moldova și din Muntenia, adesea câte un sat întreg în același cartier: cine venea primul găsea casă și lucru pentru rude și vecini. Așa se explică de ce în aceeași comună din Lazio se întâlnesc des oameni din același județ românesc.",
        "Roma are și cea mai veche prezență românească din Italia. Accademia di Romania, înființată în 1922, a găzduit generații de bursieri, arheologi, istorici și artiști, iar mulți dintre ei au studiat în arhivele romane documente despre istoria țărilor române. Tot la Roma sunt Ambasada României și consulatul general, care servește regiunea.",
        "Pentru genealogie, actele copiilor născuți în Lazio sunt la ufficio di stato civile al comunei, iar registrele italiene vechi sunt la Archivio di Stato al fiecărei provincii. Pentru ramura din România, primul pas e satul de origine: de acolo afli primăria și arhiva județeană. Dacă familia ta a venit în Lazio împreună cu alte familii din același sat, bătrânii comunității pot ști mai mult decât orice registru.",
        "Mulți copii crescuți la Roma vorbesc italiana mai bine decât româna. Un arbore al familiei, cu pozele și poveștile bunicilor, e un fel simplu de a le arăta de unde vin.",
      ],
      it: [
        "Il Lazio è la regione italiana con il maggior numero di romeni. La maggior parte vive a Roma e nei comuni intorno, da Guidonia e Tivoli a est fino a Ladispoli e Cerveteri sul mare, ma famiglie romene vivono anche nelle province di Latina, Frosinone, Viterbo e Rieti, dove hanno lavorato in agricoltura, nell'edilizia e nell'assistenza agli anziani.",
        "La grande ondata è arrivata dopo il 2002, quando i romeni hanno potuto viaggiare senza visto, ed è cresciuta dopo il 2007. Molti sono partiti dalla Moldavia romena e dalla Muntenia, spesso un intero paese nello stesso quartiere: chi arrivava per primo trovava casa e lavoro a parenti e vicini. Per questo nello stesso comune del Lazio si incontrano spesso persone della stessa provincia romena.",
        "Roma ha anche la presenza romena più antica d'Italia. L'Accademia di Romania, fondata nel 1922, ha ospitato generazioni di borsisti, archeologi, storici e artisti, e molti di loro hanno studiato negli archivi romani documenti sulla storia dei paesi romeni. A Roma si trovano anche l'Ambasciata di Romania e il consolato generale che serve la regione.",
        "Per la genealogia, gli atti dei figli nati nel Lazio sono all'ufficio di stato civile del comune, mentre i registri italiani antichi sono all'Archivio di Stato di ogni provincia. Per il ramo in Romania, il primo passo è il paese d'origine: da lì si risale al comune e all'archivio della provincia romena. Se la vostra famiglia è arrivata nel Lazio insieme ad altre dello stesso paese, gli anziani della comunità possono sapere più di qualsiasi registro.",
      ],
    },
  },
  {
    slug: "piemonte", country: "it", kind: "region", mission: ["Torino"],
    name: { ro: "Piemont", it: "Piemonte" }, where: { ro: "în Piemont", it: "in Piemonte" }, langs: ["it", "ro"],
    cities: ["Torino", "Alessandria", "Asti", "Cuneo", "Novara"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "Piemontul e una dintre regiunile Italiei în care românii au cea mai mare pondere în populație, iar în multe comune sunt cea mai numeroasă comunitate străină. Cei mai mulți trăiesc la Torino și în comunele din jur, dar și în provinciile Alessandria, Asti, Cuneo și Novara.",
        "Au venit mai ales după 2002, mulți din Moldova (Bacău, Neamț, Vaslui) și din nordul Transilvaniei. Bărbații au lucrat în construcții și în fabricile legate de industria auto din jurul Torinoului, iar în provinciile agricole, ca Asti și Cuneo, mulți au lucrat la vii și la livezi, inclusiv la culesul strugurilor. Femeile au lucrat adesea în îngrijirea vârstnicilor.",
        "Ca în tot nordul Italiei, comunitatea s-a așezat repede: familii care au cumpărat case, copii care au terminat școala aici, firme românești de construcții și transport. A doua generație de piemontezi cu părinți români crește acum cu două limbi și cu bunici în două țări.",
        "Consulatul general al României de la Torino servește Piemontul și Valle d'Aosta. Actele italiene sunt la stato civile al comunei, iar registrele vechi la Archivio di Stato al provinciei; la Torino, arhivele de stat păstrează și documentele fostului Regat al Sardiniei, utile pentru familiile mixte cu rădăcini piemonteze vechi.",
        "Pentru ramura din România, scrie întâi satul și comuna de origine, cu numele vechi și nou: multe sate au fost comasate sau și-au schimbat numele, iar pagina fiecărei localități de pe Cartea Neamului arată primăria și arhiva care țin actele.",
      ],
      it: [
        "Il Piemonte è una delle regioni italiane in cui i romeni hanno il peso maggiore sulla popolazione, e in molti comuni sono la comunità straniera più numerosa. La maggior parte vive a Torino e nei comuni della cintura, ma anche nelle province di Alessandria, Asti, Cuneo e Novara.",
        "Sono arrivati soprattutto dopo il 2002, molti dalla Moldavia romena (Bacău, Neamț, Vaslui) e dal nord della Transilvania. Gli uomini hanno lavorato nell'edilizia e nelle fabbriche legate all'industria automobilistica intorno a Torino, e nelle province agricole come Asti e Cuneo molti hanno lavorato nei vigneti e nei frutteti, anche per la vendemmia. Le donne hanno lavorato spesso nell'assistenza agli anziani.",
        "Come in tutto il nord Italia, la comunità si è stabilizzata presto: famiglie che hanno comprato casa, figli che hanno finito qui la scuola, imprese romene di edilizia e trasporti. Una seconda generazione di piemontesi con genitori romeni cresce ora con due lingue e con i nonni in due paesi.",
        "Il consolato generale di Romania a Torino serve il Piemonte e la Valle d'Aosta. Gli atti italiani sono allo stato civile del comune e i registri antichi all'Archivio di Stato della provincia; a Torino l'Archivio di Stato conserva anche i documenti dell'antico Regno di Sardegna, utili per le famiglie miste con radici piemontesi antiche. Per il ramo romeno, scrivete prima il paese e il comune d'origine, con il nome vecchio e quello nuovo.",
      ],
    },
  },
  {
    slug: "lombardia", country: "it", kind: "region", mission: ["Milano"],
    name: { ro: "Lombardia", it: "Lombardia" }, where: { ro: "în Lombardia", it: "in Lombardia" }, langs: ["it", "ro"],
    cities: ["Milano", "Brescia", "Bergamo", "Monza", "Varese"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "Lombardia e cea mai populată regiune a Italiei și una dintre cele cu cei mai mulți români. Cei mai mulți trăiesc la Milano și în comunele din jur, dar comunități mari sunt și în provinciile Brescia, Bergamo, Monza și Brianza și Varese, unde se găsea de lucru în fabrici, construcții și logistică.",
        "Primii au venit în anii '90, iar valul mare după 2002 și după 2007. Spre deosebire de alte regiuni, în Lombardia au ajuns de la început și mulți specialiști: ingineri, medici, asistente, informaticieni și studenți la universitățile milaneze. Comunitatea are astfel oameni din aproape toate județele României și din toate meseriile.",
        "Milano are un consulat general al României, care servește Lombardia, și o viață asociativă bogată: școli de weekend, cursuri de limba română pentru copii și întâlniri culturale. Pentru mulți, Milano e și locul de trecere spre Elveția, unde lucrează rude sau prieteni.",
        "Pentru genealogie, actele de stare civilă italiene sunt la comune, iar registrele vechi la Archivio di Stato al provinciei. Familiile mixte cu rădăcini lombarde vechi găsesc multe registre digitalizate pe portalul Antenati. Pentru partea românească, satul de origine e cheia: de el depind primăria care are actele și arhiva județeană care păstrează registrele mai vechi de 100 de ani.",
        "Copiii născuți aici se transcriu în registrele românești prin consulat. Cu un arbore al familiei, ei pot ține legătura cu bunicii și cu satul chiar dacă îl văd doar vara.",
      ],
      it: [
        "La Lombardia è la regione più popolosa d'Italia e una di quelle con più romeni. La maggior parte vive a Milano e nei comuni intorno, ma comunità numerose ci sono anche nelle province di Brescia, Bergamo, Monza e Brianza e Varese, dove si trovava lavoro nelle fabbriche, nell'edilizia e nella logistica.",
        "I primi sono arrivati negli anni Novanta, la grande ondata dopo il 2002 e il 2007. A differenza di altre regioni, in Lombardia sono arrivati fin dall'inizio anche molti specialisti: ingegneri, medici, infermiere, informatici e studenti delle università milanesi. La comunità ha così persone di quasi tutte le province romene e di tutti i mestieri.",
        "Milano ha un consolato generale di Romania, che serve la Lombardia, e una vita associativa ricca: scuole del fine settimana, corsi di lingua romena per bambini e incontri culturali. Per molti Milano è anche la porta verso la Svizzera, dove lavorano parenti o amici.",
        "Per la genealogia, gli atti di stato civile italiani sono al comune e i registri antichi all'Archivio di Stato della provincia; le famiglie miste con radici lombarde antiche trovano molti registri digitalizzati sul portale Antenati. Per il ramo romeno la chiave è il paese d'origine: da esso dipendono il comune che conserva gli atti e l'archivio provinciale con i registri di oltre 100 anni.",
      ],
    },
  },
  {
    slug: "veneto", country: "it", kind: "region",
    name: { ro: "Veneto", it: "Veneto" }, where: { ro: "în Veneto", it: "in Veneto" }, langs: ["it", "ro"],
    cities: ["Padova", "Verona", "Treviso", "Venezia", "Vicenza"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "Veneto are una dintre cele mai mari comunități românești din nordul Italiei, răspândită în mai multe orașe, nu adunată într-unul singur: Padova, Verona, Treviso, Vicenza și Veneția, plus multe comune mici din jurul lor, unde sunt fabrici mici și mijlocii, ferme și podgorii.",
        "Românii au venit mai ales după 2002 și 2007. Mulți au lucrat în industria mică a regiunii, în construcții, în agricultură și la vii, iar femeile adesea în îngrijirea vârstnicilor. Pentru că firmele erau răspândite în toată regiunea, și familiile s-au răspândit, iar comunitatea s-a format în jurul asociațiilor și al școlilor de weekend din fiecare oraș.",
        "Legătura Veneției cu România e veche. În 1930, istoricul Nicolae Iorga a înființat aici Institutul Român de Cultură și Cercetare Umanistică, care funcționează și azi, iar arhivele venețiene păstrează documente despre negustorii și călătorii din țările române de acum câteva secole. Pentru cei care iubesc istoria, Veneția e unul dintre locurile din Italia unde trecutul românesc se poate atinge.",
        "Pentru genealogie, actele italiene sunt la stato civile al comunei, iar registrele vechi la Archivio di Stato al fiecărei provincii; Archivio di Stato di Venezia e una dintre cele mai bogate arhive din Europa. Pentru ramura din România, începe cu satul de origine, scris corect, cu numele vechi și nou al comunei.",
        "Fiindcă familiile din Veneto sunt răspândite, un arbore comun, pe care îl completează fiecare din orașul lui, adună toate ramurile la un loc.",
      ],
      it: [
        "Il Veneto ha una delle più grandi comunità romene del nord Italia, distribuita in più città invece che concentrata in una sola: Padova, Verona, Treviso, Vicenza e Venezia, oltre a molti piccoli comuni intorno, dove ci sono piccole e medie imprese, aziende agricole e vigneti.",
        "I romeni sono arrivati soprattutto dopo il 2002 e il 2007. Molti hanno lavorato nella piccola industria della regione, nell'edilizia, in agricoltura e nei vigneti, e le donne spesso nell'assistenza agli anziani. Poiché le imprese erano diffuse su tutta la regione, anche le famiglie si sono distribuite, e la comunità si è formata intorno alle associazioni e alle scuole del fine settimana di ogni città.",
        "Il legame di Venezia con la Romania è antico. Nel 1930 lo storico Nicolae Iorga vi fondò l'Istituto Romeno di Cultura e Ricerca Umanistica, attivo ancora oggi, e gli archivi veneziani conservano documenti su mercanti e viaggiatori dei paesi romeni di alcuni secoli fa.",
        "Per la genealogia, gli atti italiani sono allo stato civile del comune e i registri antichi all'Archivio di Stato di ogni provincia; l'Archivio di Stato di Venezia è uno dei più ricchi d'Europa. Per il ramo romeno, cominciate dal paese d'origine scritto correttamente, con il nome vecchio e nuovo del comune. Poiché le famiglie in Veneto sono sparse, un albero comune, completato da ognuno dalla propria città, riunisce tutti i rami.",
      ],
    },
  },
  // ================================================================ Spania
  {
    slug: "castilla-la-mancha", country: "es", kind: "region", mission: ["Ciudad Real"],
    name: { ro: "Castilia-La Mancha", es: "Castilla-La Mancha" }, where: { ro: "în Castilia-La Mancha", es: "en Castilla-La Mancha" }, langs: ["es", "ro"],
    cities: ["Guadalajara", "Azuqueca de Henares", "Toledo", "Ciudad Real", "Tomelloso", "Talavera de la Reina"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "Castilia-La Mancha e una dintre regiunile Spaniei în care românii sunt cea mai numeroasă comunitate străină. Mulți trăiesc în provincia Guadalajara, pe coridorul de orașe dintre Madrid și Guadalajara, ca Azuqueca de Henares, unde chiriile erau mai mici decât în capitală și se găsea de lucru în construcții și logistică.",
        "În sudul regiunii, în provincia Ciudad Real, munca a fost legată de pământ: viile din La Mancha, culesul strugurilor din toamnă în jurul orașelor Tomelloso și Valdepeñas, livezile și culturile de câmp. Mulți au venit întâi ca sezonieri și au rămas apoi cu familiile. În provincia Toledo, comunități mari sunt la Toledo și la Talavera de la Reina.",
        "Ca în toată Spania, valul mare a venit după 2002 și în anii de boom al construcțiilor de dinainte de 2008. Criza a lovit tare regiunea, iar unii s-au întors acasă sau au plecat mai departe, dar mulți au rămas, și-au cumpărat case și au copii care au terminat școala aici.",
        "România are un consulat la Ciudad Real, pe lângă ambasada de la Madrid. Actele spaniole sunt la Registro Civil, iar registrele vechi la Archivo Histórico Provincial al fiecărei provincii. Pentru ramura din România, primul pas e satul de origine; în multe comune din La Mancha trăiesc oameni din același județ românesc, iar bătrânii comunității își amintesc cine a venit primul și de unde.",
        "Pentru copiii crescuți aici, un arbore al familiei leagă cele două țări: numele bunicilor, satul lor și drumul părinților până în La Mancha.",
      ],
      es: [
        "Castilla-La Mancha es una de las regiones de España donde los rumanos son la comunidad extranjera más numerosa. Muchos viven en la provincia de Guadalajara, en el corredor de ciudades entre Madrid y Guadalajara, como Azuqueca de Henares, donde los alquileres eran más baratos que en la capital y había trabajo en la construcción y la logística.",
        "En el sur de la región, en la provincia de Ciudad Real, el trabajo estuvo ligado a la tierra: los viñedos de La Mancha, la vendimia de otoño en torno a Tomelloso y Valdepeñas, los frutales y los cultivos de campo. Muchos llegaron primero como temporeros y se quedaron después con sus familias. En la provincia de Toledo hay comunidades grandes en Toledo y en Talavera de la Reina.",
        "Como en toda España, la gran oleada llegó después de 2002 y en los años del auge de la construcción anteriores a 2008. La crisis golpeó con fuerza a la región, y algunos volvieron a casa o siguieron hacia otros países, pero muchos se quedaron, compraron casa y tienen hijos que terminaron aquí la escuela.",
        "Rumanía tiene un consulado en Ciudad Real, además de la embajada en Madrid. Las actas españolas están en el Registro Civil y los registros antiguos en el Archivo Histórico Provincial de cada provincia. Para la rama rumana, el primer paso es el pueblo de origen; en muchos municipios de La Mancha viven personas del mismo distrito rumano, y los mayores de la comunidad recuerdan quién llegó primero y de dónde.",
      ],
    },
  },
  {
    slug: "andalucia", country: "es", kind: "region", mission: ["Sevilla", "Almería"],
    name: { ro: "Andaluzia", es: "Andalucía" }, where: { ro: "în Andaluzia", es: "en Andalucía" }, langs: ["es", "ro"],
    cities: ["Almería", "El Ejido", "Huelva", "Sevilla", "Jaén", "Málaga"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "În Andaluzia, povestea românilor e legată mai ales de agricultură. În provincia Almería, serele din jurul orașelor El Ejido și Níjar au atras mii de muncitori, iar în provincia Huelva, culesul căpșunilor a adus în fiecare primăvară sezonieri din România, mulți dintre ei femei, angajați direct din țară prin contracte de muncă sezonieră.",
        "Mulți sezonieri au venit ani la rând și s-au întors acasă după recoltă; alții au rămas și și-au adus familiile. În provincia Jaén, culesul măslinelor din iarnă a fost și el un loc de muncă pentru mulți români, iar pe Costa del Sol, în jurul Málagăi, au lucrat în construcții, hoteluri și restaurante.",
        "Valul mare a venit după 2002 și după 2007. Spre deosebire de Madrid sau Castellón, în Andaluzia comunitatea e răspândită în multe orașe și sate agricole, iar viața ei urmează adesea calendarul recoltelor.",
        "România are un consulat general la Sevilla și un consulat la Almería. Actele spaniole sunt la Registro Civil, iar registrele vechi la Archivo Histórico Provincial; Sevilla are și Archivo General de Indias, celebru pentru istoria Spaniei. Pentru ramura din România, satul de origine e punctul de plecare: de acolo afli primăria care are actele și arhiva județeană cu registrele vechi.",
        "Pentru familiile care au lucrat ani la rând între două țări, un arbore comun păstrează la un loc numele, satele și drumurile tuturor, inclusiv ale celor care au venit doar pentru câteva luni pe an.",
      ],
      es: [
        "En Andalucía, la historia de los rumanos está ligada sobre todo a la agricultura. En la provincia de Almería, los invernaderos de El Ejido y Níjar atrajeron a miles de trabajadores, y en la provincia de Huelva la campaña de la fresa trajo cada primavera temporeros de Rumanía, muchos de ellos mujeres, contratados directamente en origen.",
        "Muchos temporeros vinieron año tras año y volvían a casa después de la cosecha; otros se quedaron y trajeron a sus familias. En la provincia de Jaén, la aceituna de invierno también dio trabajo a muchos rumanos, y en la Costa del Sol, alrededor de Málaga, trabajaron en la construcción, la hostelería y los servicios.",
        "La gran oleada llegó después de 2002 y de 2007. A diferencia de Madrid o Castellón, en Andalucía la comunidad está repartida en muchas ciudades y pueblos agrícolas, y su vida sigue a menudo el calendario de las cosechas.",
        "Rumanía tiene un consulado general en Sevilla y un consulado en Almería. Las actas españolas están en el Registro Civil y los registros antiguos en el Archivo Histórico Provincial; Sevilla alberga además el Archivo General de Indias. Para la rama rumana, el pueblo de origen es el punto de partida: con él se sabe qué ayuntamiento tiene las actas y qué archivo provincial guarda los registros antiguos. Para las familias que trabajaron años entre dos países, un árbol común reúne nombres, pueblos y caminos de todos.",
      ],
    },
  },
  {
    slug: "comunitat-valenciana", country: "es", kind: "region", mission: ["Valencia", "Castellón de la Plana"],
    name: { ro: "Comunitatea Valenciană", es: "Comunitat Valenciana" }, where: { ro: "în Comunitatea Valenciană", es: "en la Comunitat Valenciana" }, langs: ["es", "ro"],
    cities: ["Castellón de la Plana", "Vila-real", "Valencia", "Alicante", "Benidorm"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "Comunitatea Valenciană are una dintre cele mai mari comunități românești din Spania. Centrul ei e provincia Castellón: în orașul Castellón de la Plana și în Vila-real, românii au ajuns o parte importantă a populației, iar școlile, magazinele și asociațiile românești se văd pe stradă.",
        "Primii au venit la sfârșitul anilor '90, iar valul mare după 2002. Mulți au lucrat în fabricile de faianță și ceramică din jurul Castellónului, în construcții și la culesul portocalelor și al mandarinelor, care a dat de lucru în fiecare iarnă. Mulți au venit din Muntenia și Oltenia, iar cine venea primul aducea apoi rudele și vecinii.",
        "Mai la sud, în orașul Valencia și în provincia Alicante, comunitatea e mai răspândită, cu oameni în construcții, transport, turism și servicii, mai ales pe coastă, în jurul Benidormului.",
        "România are un consulat general la Valencia și un consulat la Castellón de la Plana. Actele spaniole sunt la Registro Civil, iar registrele vechi la Archivo Histórico Provincial al fiecărei provincii. Pentru partea din România, primul pas e satul de origine: în Castellón trăiesc des oameni din aceleași sate, iar o discuție cu vecinii de aici poate aduce numele și poreclele pe care registrele nu le păstrează.",
        "Pentru copiii crescuți în Castellón, care vorbesc spaniola și valenciana la școală și româna acasă, un arbore al familiei e o punte simplă spre bunici.",
      ],
      es: [
        "La Comunitat Valenciana tiene una de las mayores comunidades rumanas de España. Su centro es la provincia de Castellón: en Castellón de la Plana y en Vila-real los rumanos son una parte importante de la población, y escuelas, tiendas y asociaciones rumanas se ven en la calle.",
        "Los primeros llegaron a finales de los noventa y la gran oleada después de 2002. Muchos trabajaron en las fábricas de azulejos y cerámica de los alrededores de Castellón, en la construcción y en la recogida de naranjas y mandarinas, que daba trabajo cada invierno. Muchos vinieron de Muntenia y Oltenia, y quien llegaba primero traía después a parientes y vecinos.",
        "Más al sur, en la ciudad de Valencia y en la provincia de Alicante, la comunidad está más repartida, con gente en la construcción, el transporte, el turismo y los servicios, sobre todo en la costa, alrededor de Benidorm.",
        "Rumanía tiene un consulado general en Valencia y un consulado en Castellón de la Plana. Las actas españolas están en el Registro Civil y los registros antiguos en el Archivo Histórico Provincial de cada provincia. Para la rama rumana, el primer paso es el pueblo de origen: en Castellón viven a menudo personas de los mismos pueblos, y una charla con los vecinos puede aportar nombres y apodos que los registros no guardan. Para los niños que crecen aquí, un árbol familiar es un puente sencillo hacia los abuelos.",
      ],
    },
  },
  {
    slug: "cataluna", country: "es", kind: "region", mission: ["Barcelona"],
    name: { ro: "Catalonia", es: "Cataluña" }, where: { ro: "în Catalonia", es: "en Cataluña" }, langs: ["es", "ro"],
    cities: ["Barcelona", "Lleida", "Tarragona", "Girona"],
    guides: ["cum-afli-satul-de-origine", "cum-ceri-un-act-de-stare-civila"],
    notes: {
      ro: [
        "În Catalonia, românii s-au așezat în două feluri diferite. În zona metropolitană a Barcelonei au venit mai ales pentru construcții, servicii, transport și, mai nou, pentru firmele de tehnologie și universități. În provincia Lleida, la vest, munca a fost legată de livezi: culesul piersicilor, nectarinelor, perelor și merelor a adus vara mii de sezonieri, iar mulți români au venit an de an și s-au stabilit apoi în orașele din jur.",
        "Valul mare a venit după 2002 și după 2007. Ca în toată Spania, criza din 2008 a dus la plecări, dar comunitatea a rămas mare, cu familii stabilite și copii care cresc cu catalana și spaniola la școală și româna acasă.",
        "Comunități românești sunt și în provinciile Tarragona și Girona, unde au lucrat în agricultură, turism și industrie. Barcelona are un consulat general al României, care servește Catalonia.",
        "Pentru genealogie, actele spaniole sunt la Registro Civil, iar registrele vechi la arhivele provinciale și la Arxiu Nacional de Catalunya. Pentru ramura din România, satul de origine e punctul de plecare. Dacă familia ta a lucrat ani la rând ca sezonieri în Lleida, contractele și adeverințele de muncă păstrate acasă pot ajuta să refaci drumul fiecăruia.",
        "Un arbore al familiei, completat de toți cei plecați și de cei rămași acasă, păstrează numele și poveștile care altfel se pierd între două țări și trei limbi.",
      ],
      es: [
        "En Cataluña los rumanos se asentaron de dos maneras distintas. En el área metropolitana de Barcelona llegaron sobre todo para la construcción, los servicios, el transporte y, más recientemente, para empresas tecnológicas y universidades. En la provincia de Lleida, al oeste, el trabajo estuvo ligado a la fruta: la recogida de melocotones, nectarinas, peras y manzanas atraía cada verano a miles de temporeros, y muchos rumanos vinieron año tras año y luego se establecieron en los pueblos y ciudades de la zona.",
        "La gran oleada llegó después de 2002 y de 2007. Como en toda España, la crisis de 2008 provocó salidas, pero la comunidad siguió siendo grande, con familias asentadas e hijos que crecen con el catalán y el castellano en la escuela y el rumano en casa.",
        "También hay comunidades rumanas en las provincias de Tarragona y Girona, que trabajaron en la agricultura, el turismo y la industria. Barcelona tiene un consulado general de Rumanía, que atiende Cataluña.",
        "Para la genealogía, las actas españolas están en el Registro Civil y los registros antiguos en los archivos provinciales y en el Arxiu Nacional de Catalunya. Para la rama rumana, el pueblo de origen es el punto de partida. Si su familia trabajó años como temporera en Lleida, los contratos y certificados de trabajo guardados en casa pueden ayudar a reconstruir el camino de cada uno.",
      ],
    },
  },
  // ================================================================ Germania
  {
    slug: "bayern", country: "de", kind: "region", mission: ["München"],
    name: { ro: "Bavaria", de: "Bayern" }, where: { ro: "în Bavaria", de: "in Bayern" }, langs: ["de", "ro"],
    cities: ["München", "Nürnberg", "Augsburg", "Ingolstadt", "Dinkelsbühl"],
    guides: ["sasii-din-transilvania-registre", "svabii-banateni-genealogie", "documente-in-maghiara-si-germana"],
    notes: {
      ro: [
        "Bavaria e unul dintre locurile cu cea mai lungă istorie românească din Germania. După război și mai ales din anii '70, mulți sași din Transilvania și șvabi din Banat s-au stabilit aici, iar asociațiile lor centrale au sediul la München. În fiecare an, de Rusalii, sașii transilvăneni se adună la Dinkelsbühl, în Franconia, la întâlnirea lor tradițională, cu port popular și muzică din satele de acasă.",
        "München a fost și un oraș al exilului românesc: aici a funcționat, din anii '50 până în anii '90, secția română a postului Radio Europa Liberă, pe care o ascultau pe ascuns milioane de oameni din România. Mulți jurnaliști și scriitori exilați au trăit și au murit aici.",
        "După 2007 și mai ales după 2014, Bavaria a atras mulți români veniți la muncă: în industria auto și în fabricile din jurul Münchenului, Ingolstadtului și Nürnbergului, în construcții, logistică, spitale și firme de tehnologie. Azi e unul dintre landurile cu cei mai mulți cetățeni români.",
        "România are un consulat general la München. Pentru sași și șvabi, sursele sunt multe: registrele parohiale și de stare civilă din satele de acasă, cărțile de familie ale satelor (Ortssippenbücher) și arhivele asociațiilor lor. Pentru familiile venite recent, actele germane sunt la Standesamt, iar cele românești la primăria din România.",
        "În multe familii bavareze de azi se întâlnesc ambele povești: bunici sași sau șvabi plecați înainte de 1990 și nepoți români veniți după 2007. Un arbore al familiei le pune pe amândouă la un loc.",
      ],
      de: [
        "Bayern hat eine der längsten rumänischen Geschichten in Deutschland. Nach dem Krieg und vor allem seit den 1970er-Jahren ließen sich hier viele Siebenbürger Sachsen und Banater Schwaben nieder, und ihre Landsmannschaften haben ihren Sitz in München. Jedes Jahr zu Pfingsten treffen sich die Siebenbürger Sachsen im fränkischen Dinkelsbühl zum Heimattag, mit Trachten und Musik aus den Dörfern der alten Heimat.",
        "München war auch eine Stadt des rumänischen Exils: Von den 1950er- bis in die 1990er-Jahre sendete hier die rumänische Redaktion von Radio Freies Europa, die Millionen Menschen in Rumänien heimlich hörten. Viele Journalisten und Schriftsteller im Exil lebten und starben hier.",
        "Nach 2007 und vor allem nach 2014 zog Bayern viele rumänische Arbeitskräfte an: in die Autoindustrie und die Werke rund um München, Ingolstadt und Nürnberg, auf den Bau, in die Logistik, in Krankenhäuser und Technologiefirmen. Heute ist es eines der Bundesländer mit den meisten rumänischen Staatsbürgern.",
        "Rumänien hat ein Generalkonsulat in München. Für Sachsen und Schwaben gibt es viele Quellen: Kirchen- und Standesbücher der Heimatdörfer, Ortssippenbücher und die Archive der Landsmannschaften. Für Familien, die erst kürzlich gekommen sind, liegen die deutschen Urkunden beim Standesamt und die rumänischen beim Rathaus in Rumänien. In vielen bayerischen Familien treffen sich heute beide Geschichten: sächsische oder schwäbische Großeltern, die vor 1990 kamen, und rumänische Enkel, die nach 2007 kamen.",
      ],
    },
  },
  {
    slug: "baden-wuerttemberg", country: "de", kind: "region", mission: ["Stuttgart"],
    name: { ro: "Baden-Württemberg", de: "Baden-Württemberg" }, where: { ro: "în Baden-Württemberg", de: "in Baden-Württemberg" }, langs: ["de", "ro"],
    cities: ["Stuttgart", "Ulm", "Mannheim", "Karlsruhe", "Gundelsheim"],
    guides: ["svabii-banateni-genealogie", "sasii-din-transilvania-registre", "documente-in-maghiara-si-germana"],
    notes: {
      ro: [
        "Baden-Württemberg are o legătură veche cu Banatul. În secolul XVIII, mulți coloniști germani care au plecat spre Banat și spre alte ținuturi de pe Dunăre au pornit din Ulm, pe râu, cu bărcile numite „Ulmer Schachteln”. De aceea, la Ulm se află azi Muzeul Central al Șvabilor Dunăreni, care spune povestea lor de la plecare până la întoarcerea urmașilor în Germania.",
        "La Gundelsheim, pe Neckar, funcționează Institutul Transilvaniei (Siebenbürgen-Institut), cu biblioteca și arhiva sașilor transilvăneni, unul dintre cele mai importante locuri pentru cine își caută strămoșii sași. După 1970 și mai ales după 1990, mulți sași și șvabi s-au stabilit în acest land.",
        "Din 2007 și mai ales după 2014, au venit și mulți români la muncă, atrași de industria auto și de fabricile din jurul Stuttgartului, Mannheimului și Karlsruhe, de construcții, spitale și firme de tehnologie. Comunitatea are asociații, școli de weekend și cursuri de limba română pentru copii.",
        "România are un consulat general la Stuttgart. Pentru sași și șvabi, arhiva de la Gundelsheim și muzeul de la Ulm sunt locuri bune de început, alături de registrele din satele de acasă. Pentru familiile venite recent, actele germane sunt la Standesamt-ul orașului, iar cele românești la primăria din România.",
        "Pentru o familie cu rădăcini în Banat, drumul complet poate începe la Ulm, acum aproape trei secole, și se poate întoarce tot aici: un arbore al familiei arată cum se leagă cele două capete.",
      ],
      de: [
        "Baden-Württemberg ist seit Langem mit dem Banat verbunden. Im 18. Jahrhundert brachen viele deutsche Siedler, die ins Banat und in andere Gebiete an der Donau zogen, in Ulm auf, auf dem Fluss, in den sogenannten Ulmer Schachteln. Deshalb steht heute in Ulm das Donauschwäbische Zentralmuseum, das ihre Geschichte vom Aufbruch bis zur Rückkehr der Nachkommen nach Deutschland erzählt.",
        "In Gundelsheim am Neckar arbeitet das Siebenbürgen-Institut mit Bibliothek und Archiv der Siebenbürger Sachsen, einer der wichtigsten Orte für alle, die sächsische Vorfahren suchen. Nach 1970 und vor allem nach 1990 ließen sich viele Sachsen und Schwaben in diesem Land nieder.",
        "Seit 2007 und vor allem seit 2014 kamen auch viele Rumänen zum Arbeiten, angezogen von der Autoindustrie und den Werken rund um Stuttgart, Mannheim und Karlsruhe, vom Bau, von Krankenhäusern und Technologiefirmen. Die Gemeinschaft hat Vereine, Wochenendschulen und Rumänischkurse für Kinder.",
        "Rumänien hat ein Generalkonsulat in Stuttgart. Für Sachsen und Schwaben sind das Archiv in Gundelsheim und das Museum in Ulm gute Ausgangspunkte, zusammen mit den Kirchenbüchern der Heimatdörfer. Für Familien, die erst kürzlich gekommen sind, liegen die deutschen Urkunden beim Standesamt der Stadt, die rumänischen beim Rathaus in Rumänien. Für eine Familie mit Wurzeln im Banat kann der ganze Weg vor fast drei Jahrhunderten in Ulm beginnen und hier wieder enden.",
      ],
    },
  },
  {
    slug: "nordrhein-westfalen", country: "de", kind: "region", mission: ["Bonn"],
    name: { ro: "Renania de Nord-Westfalia", de: "Nordrhein-Westfalen" }, where: { ro: "în Renania de Nord-Westfalia", de: "in Nordrhein-Westfalen" }, langs: ["de", "ro"],
    cities: ["Köln", "Düsseldorf", "Dortmund", "Bonn", "Wiehl-Drabenderhöhe"],
    guides: ["sasii-din-transilvania-registre", "svabii-banateni-genealogie", "documente-in-maghiara-si-germana"],
    notes: {
      ro: [
        "Renania de Nord-Westfalia e cel mai populat land al Germaniei și unul dintre cele cu cei mai mulți români. Comunitatea e răspândită în marile orașe de pe Rin și din Ruhr: Köln, Düsseldorf, Bonn, Dortmund, Duisburg și Essen.",
        "Aici se află și una dintre cele mai cunoscute așezări ale sașilor transilvăneni din Germania: Drabenderhöhe, azi parte a orașului Wiehl, unde din anii '60 s-a construit un cartier nou pentru familiile venite din Transilvania. Mulți sași au adus cu ei obiceiuri, port popular și amintirea satelor de acasă, iar pentru urmașii lor Drabenderhöhe e un loc al memoriei.",
        "Bonn a fost până în 1990 capitala Germaniei de Vest, iar România are și azi aici un consulat general. Exilații români din anii comunismului au trecut adesea prin Bonn și prin orașele din jur.",
        "După 2007 și mai ales după 2014, au venit mulți români la muncă, în logistică, construcții, industrie, spitale și cămine de bătrâni. Mulți medici și asistente din România lucrează azi în spitalele din land.",
        "Pentru sași și șvabi, sursele sunt registrele din satele de acasă și arhivele asociațiilor lor din Germania. Pentru familiile venite recent, actele germane sunt la Standesamt, iar cele românești la primăria din România sau prin consulat. Un arbore comun ține la un loc ramurile de pe Rin și pe cele din satele de acasă.",
      ],
      de: [
        "Nordrhein-Westfalen ist das bevölkerungsreichste Bundesland Deutschlands und eines mit den meisten Rumänen. Die Gemeinschaft verteilt sich auf die großen Städte am Rhein und im Ruhrgebiet: Köln, Düsseldorf, Bonn, Dortmund, Duisburg und Essen.",
        "Hier liegt auch eine der bekanntesten Siedlungen der Siebenbürger Sachsen in Deutschland: Drabenderhöhe, heute ein Ortsteil von Wiehl, wo seit den 1960er-Jahren ein neues Viertel für Familien aus Siebenbürgen entstand. Viele Sachsen brachten Bräuche, Trachten und die Erinnerung an die Heimatdörfer mit, und für ihre Nachkommen ist Drabenderhöhe ein Ort der Erinnerung.",
        "Bonn war bis 1990 die Hauptstadt der Bundesrepublik, und Rumänien hat hier bis heute ein Generalkonsulat. Rumänische Exilanten der kommunistischen Jahre kamen oft über Bonn und die Städte der Umgebung.",
        "Nach 2007 und vor allem nach 2014 kamen viele Rumänen zum Arbeiten, in Logistik, Bau, Industrie, Krankenhäuser und Pflegeheime. Viele Ärztinnen, Ärzte und Pflegekräfte aus Rumänien arbeiten heute in den Kliniken des Landes. Für Sachsen und Schwaben sind die Kirchenbücher der Heimatdörfer und die Archive der Landsmannschaften die Quellen; für Familien, die erst kürzlich gekommen sind, liegen die deutschen Urkunden beim Standesamt und die rumänischen beim Rathaus in Rumänien oder beim Konsulat.",
      ],
    },
  },
  // ================================================================ Austria
  {
    slug: "oberoesterreich", country: "at", kind: "region",
    name: { ro: "Austria Superioară", de: "Oberösterreich" }, where: { ro: "în Austria Superioară", de: "in Oberösterreich" }, langs: ["de", "ro"],
    cities: ["Linz", "Wels", "Steyr"],
    guides: ["sasii-din-transilvania-registre", "svabii-banateni-genealogie", "stramosi-in-armata-austro-ungara"],
    notes: {
      ro: [
        "Austria Superioară are o legătură aparte cu Transilvania. În toamna lui 1944, sașii din nordul Transilvaniei, din zona Bistriței (Nösnerland), au fost evacuați spre vest în coloane de căruțe și trenuri. După război, mulți nu s-au mai putut întoarce și au rămas în Austria, iar o mare parte s-au stabilit în Austria Superioară, unde și-au construit case și și-au refăcut comunitățile.",
        "Tot după război au ajuns aici și mulți șvabi dunăreni din Banat și din regiunile vecine, refugiați sau strămutați. Ani de zile au trăit în tabere de refugiați, apoi în cartiere și sate noi. Urmașii lor păstrează și azi asociații, muzee și întâlniri anuale.",
        "Românii de după 1990 și mai ales de după 2014, când Austria și-a deschis complet piața muncii, au venit la Linz, Wels și Steyr, în oțelăriile de la Linz și în fabricile regiunii, în construcții, logistică și îngrijire. Astfel, în aceeași regiune trăiesc urmași ai sașilor plecați în 1944 și români veniți în ultimii ani, uneori din aceleași sate.",
        "Pentru genealogie, merită întrebată și Arhiva Landului Austria Superioară (Oberösterreichisches Landesarchiv) de la Linz, pentru anii de după război. Registrele de stare civilă și parohiale ale satelor sașilor din Nösnerland sunt la arhivele din România, la Bistrița, sau în colecțiile asociațiilor săsești. Pentru familiile venite recent, actele austriece sunt la Standesamt, iar cele românești la primăria din România sau prin ambasada de la Viena.",
        "Un arbore al familiei poate arăta cum se întâlnesc aici două drumuri plecate din același loc, la 70 de ani distanță.",
      ],
      de: [
        "Oberösterreich ist auf besondere Weise mit Siebenbürgen verbunden. Im Herbst 1944 wurden die Sachsen aus Nordsiebenbürgen, aus der Gegend um Bistritz (Nösnerland), in Trecks und Zügen nach Westen evakuiert. Nach dem Krieg konnten viele nicht mehr zurück und blieben in Österreich, ein großer Teil in Oberösterreich, wo sie Häuser bauten und ihre Gemeinschaften neu aufbauten.",
        "Ebenfalls nach dem Krieg kamen viele Donauschwaben aus dem Banat und den Nachbarregionen hierher, als Flüchtlinge oder Vertriebene. Jahrelang lebten sie in Flüchtlingslagern, dann in neuen Siedlungen und Ortsteilen. Ihre Nachkommen pflegen bis heute Vereine, Museen und jährliche Treffen.",
        "Rumänen kamen nach 1990 und vor allem nach 2014, als Österreich den Arbeitsmarkt vollständig öffnete, nach Linz, Wels und Steyr, in die Stahlwerke von Linz und die Betriebe der Region, auf den Bau, in die Logistik und die Pflege. So leben in derselben Region Nachkommen der Sachsen von 1944 und Rumänen der letzten Jahre, manchmal aus denselben Dörfern.",
        "Für die Familienforschung lohnt sich für die Nachkriegsjahre auch eine Anfrage beim Oberösterreichischen Landesarchiv in Linz. Die Kirchen- und Standesbücher der sächsischen Dörfer des Nösnerlandes liegen in rumänischen Archiven, in Bistritz, oder in den Sammlungen der sächsischen Verbände. Für Familien, die erst kürzlich gekommen sind, liegen die österreichischen Urkunden beim Standesamt und die rumänischen beim Rathaus in Rumänien oder bei der Botschaft in Wien.",
      ],
    },
  },
];
