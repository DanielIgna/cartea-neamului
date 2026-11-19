import type { CountryKey, Lang, Region } from "../tipuri";

/**
 * Ciorne (Daniel, 19.11.2026: „echilibru între indexarea în română pentru români și în limbile țărilor, pentru copiii lor
 * care nu mai sunt familiarizați cu limba română”). Paginile de oraș erau doar în română; aici primesc textul în limba țării,
 * scris pentru a doua generație (copiii născuți sau crescuți acolo), nu tradus cuvânt cu cuvânt. Faptele sunt aceleași ca în
 * textul românesc verificat din orase.ts și orase-mai-mult.ts; nimic nou, nicio cifră în plus.
 *
 * O limbă apare pe site doar după ce cheia ei („limba:<țară>/<oraș>/<limbă>”) e în aprobate.ts.
 */
export type CityLang = { country: CountryKey; slug: string; lang: Lang; name: string; where: string; notes: string[] };

export const cityLangKey = (c: Pick<CityLang, "country" | "slug" | "lang">) => `limba:${c.country}/${c.slug}/${c.lang}`;

export const CITY_LANG_DRAFTS: CityLang[] = [
  // ================================================================ Marea Britanie, în engleză
  {
    country: "gb", slug: "londra", lang: "en", name: "London", where: "in London",
    notes: [
      "London has the largest Romanian community in the United Kingdom, and it grew very quickly after 2014. Many Romanian families live in the north and east of the city, in boroughs such as Harrow, Brent, Enfield, Haringey, Barking and Newham, and work in construction, transport, healthcare, finance and IT. If you grew up here with Romanian parents, you are part of one of the youngest family stories in the city: most of it began only a decade or two ago.",
      "That is exactly why it is worth writing it down now. Your parents probably came on their own, in their twenties or thirties, and your grandparents stayed in a village or a small town in Romania. The names, dates and places they carry in their heads are the start of your family tree, and nobody else holds them. Ask for full names (including your grandmother's maiden name), years of birth, the village, and who married whom. An hour a week on a video call is enough to have three generations written down within a month.",
      "Schools in London sometimes set a project about family and origins. It is a good excuse to call your grandparents together with your parents: you get your homework done, and the family ends up with a real tree. If your Romanian is not perfect, that is fine. On Cartea Neamului you can read the tree in English while your grandparents fill it in in Romanian.",
      "For British records, birth, marriage and death certificates come from the General Register Office for England and Wales or from the register office of the borough where the event was registered. London Metropolitan Archives keeps parish registers and older city records, and The National Archives at Kew holds the national ones.",
      "For the Romanian side, the Embassy of Romania is at Arundel House, 4 Palace Green, London W8 4QD, and its consular section is at M.E.I.C. House, 344 Kensington High Street, London W14 8NS, according to the European Commission's official list. Appointments are made on econsulat.ro. Children born in the UK to Romanian parents need their birth transcribed into the Romanian registers before they can get Romanian documents; it is done at the consular section with the British certificate apostilled and translated.",
      "Because the UK is no longer in the European Union, Romanian documents used here need an apostille and a translation, and British documents used in Romania need an FCDO apostille. Keep scanned copies in the family tree: they save a lot of trips.",
    ],
  },
  {
    country: "gb", slug: "manchester", lang: "en", name: "Manchester", where: "in Manchester",
    notes: [
      "Manchester and the towns of North West England have a growing Romanian community, formed mostly after 2014: workers, students at the city's universities, and doctors and nurses in the region's hospitals. Many came on their own and started their families here, so a lot of children in Greater Manchester have grandparents they know mainly as a voice on the phone.",
      "A family tree built together brings them closer. Sit down with your parents and call your grandparents on video: ask for their full names, the village they come from, when they were born and how they met. Add the old photos with the names of the people in them, while someone still remembers. You will see the faces and the villages your family comes from, and your grandparents will be glad to be asked.",
      "If you are a Romanian student in Manchester, living far from your family for a few years, this is also a good time to start. The names, dates and villages you write down today will be hard to find out in twenty years.",
      "For British records, certificates come from the General Register Office or from the local register office. Manchester Central Library houses Archives+, with the archives of the city and the region, and the birth, marriage and death indexes for England can be searched for free on FreeBMD.",
      "For the Romanian side, the Consulate General of Romania in Manchester is at 9 Cooper Street, Manchester M2 2FW, according to the European Commission's official list. Certificates from Romania, powers of attorney and birth transcriptions are booked on econsulat.ro. A child born in England to Romanian parents needs the birth transcribed, with the British certificate apostilled and translated, before getting Romanian documents; it is best done early, before a passport is urgently needed.",
      "For older Romanian records, a power of attorney given to a relative back home is often the simplest route: you sign it at the consulate, and your relative collects the document from the town hall or the archive. Registers older than 100 years are held by the county branch of the Romanian National Archives, which you can write to with the name, the approximate year and the village. The village page on Cartea Neamului tells you which commune and county it belongs to today.",
    ],
  },
  {
    country: "gb", slug: "birmingham", lang: "en", name: "Birmingham", where: "in Birmingham",
    notes: [
      "Birmingham and the West Midlands have one of the large Romanian communities in England, formed mostly after 2014: workers in construction, logistics and factories, drivers, nurses and doctors, and many people who have started their own small businesses. If you grew up here with Romanian parents, your family probably also has relatives in other English cities, in Spain or in Italy.",
      "A shared family tree, which everyone fills in from their phone, brings together what each branch knows and shows everyone how they are connected. For families who work shifts and have little free time, doing it a little at a time works best: a name added in the evening, a photo sent by a cousin, a date found out from your grandmother. Within a few weeks the family has three generations in one place.",
      "Start with what only the living know: your grandparents' full names, your grandmother's maiden name, the village, nicknames, and who married whom. Then add the documents. If your Romanian is not strong, you can read the tree in English on Cartea Neamului, while your parents and grandparents write in Romanian.",
      "For British records, certificates come from the General Register Office or from the Birmingham register office. The Library of Birmingham houses the city archives, with parish registers and local records, and the civil registration indexes for England and Wales can be searched for free on FreeBMD.",
      "Birmingham has no Romanian consulate. Documents are requested at the consular section of the embassy in London or at the Consulate General in Manchester, depending on the area each one covers on the official page; appointments are made on econsulat.ro. Children born in England need their birth transcribed into the Romanian registers, with the British certificate apostilled and translated. It is worth doing early, before a Romanian passport is needed.",
      "Romanian documents used in England need an apostille and a translation, and British documents used in Romania need the FCDO apostille. Keep copies of the family's important certificates in the tree: your parents' and grandparents' birth and marriage certificates will always be useful. For Romanian registers older than 100 years, write to the county branch of the National Archives with the name and the village.",
    ],
  },
  {
    country: "gb", slug: "edinburgh", lang: "en", name: "Edinburgh", where: "in Edinburgh",
    notes: [
      "Edinburgh and Scotland have a smaller Romanian community than England, but one that has become more visible since 2014: students and researchers at Scottish universities, doctors, engineers, and workers in tourism, construction and farming. Many families here are mixed, Romanian and Scottish, and their children grow up with two very different family stories.",
      "The Scottish side is usually easy to trace. Scotland has its own civil registration system, separate from England's: it starts in 1855, and certificates come from National Records of Scotland. Old parish registers, censuses and Scottish wills can be searched on ScotlandsPeople, one of the best genealogy sources online, so the Scottish half of a tree can often reach back to the 18th century.",
      "The Romanian side works differently: the best source is usually your grandparents. Start with a simple list made on the phone with your parents: names, dates, villages. Ask your grandparents about their parents and grandparents too, and write down the nicknames and stories, because the records will not keep them. Then look up the village on Cartea Neamului to find out which commune, county and archive it belongs to.",
      "On Cartea Neamului both halves sit in the same tree, and every relative reads it in their own language: you in English, your grandparents in Romanian. Over the years it becomes an inheritance that no archive can rebuild.",
      "For the Romanian paperwork, the Consulate General of Romania in Edinburgh is at 7–9 North St David Street, Edinburgh EH2 1AW, according to the European Commission's official list, and appointments are made on econsulat.ro. Romanian documents used in Scotland need an apostille and a translation. Children born here to Romanian parents need their birth transcribed into the Romanian registers, which is done at the Edinburgh consulate.",
      "For Romanian records older than 100 years, write directly to the county branch of the Romanian National Archives with the name, the approximate year and the village. The village page on Cartea Neamului shows the commune and county it belongs to today.",
    ],
  },

  // ================================================================ Spania, în spaniolă
  {
    country: "es", slug: "madrid", lang: "es", name: "Madrid", where: "en Madrid",
    notes: [
      "La Comunidad de Madrid tiene la mayor comunidad rumana de España, y las ciudades de alrededor de la capital se han convertido en verdaderos centros rumanos: Coslada, San Fernando de Henares, Alcalá de Henares, Arganda del Rey, Torrejón de Ardoz y Getafe. Los primeros llegaron a finales de los años 90, y la mayoría después de 2002, en los años del auge de la construcción. Si has crecido aquí con padres rumanos, formas parte de una segunda generación que habla español en el colegio y rumano en casa, o un poco de cada.",
      "Para ti, el árbol familiar es un puente hacia el pueblo de tus abuelos. Muchas familias de Coslada o de Alcalá vienen de Teleorman, Dâmbovița, Olt y Dolj, pero también de Moldavia. Una videollamada con los abuelos, con las fotos antiguas en la pantalla, es el mejor comienzo: pregúntales sus nombres completos, el apellido de soltera de la abuela, el pueblo y los años.",
      "Si ya no recuerdas bien el pueblo de tus abuelos, búscalo en los documentos de tus padres: el certificado de nacimiento rumano, el carné antiguo o la cartilla de trabajo indican el lugar de nacimiento. A partir de ahí, Cartea Neamului te dice el municipio, el distrito (județ) y el archivo al que pertenece el pueblo. Puedes leer el árbol en español mientras tus abuelos lo completan en rumano.",
      "Muchos rumanos de Madrid tienen también parientes en otras ciudades españolas, en Italia o en Alemania. Un árbol común, que cada uno completa desde el móvil, reúne en un solo lugar lo que sabe cada rama de la familia.",
      "Los documentos españoles se piden en el Registro Civil, donde también se pueden obtener certificados plurilingües, que se usan en Rumanía sin traducción. Para las familias mixtas, el Archivo Histórico Nacional y los archivos históricos de la Comunidad de Madrid guardan documentos antiguos, y cada provincia tiene su propio Archivo Histórico Provincial.",
      "En Madrid está la Embajada de Rumanía, cuya sección consular atiende a la comunidad de la capital y de las provincias vecinas. La cita se pide en econsulat.ro. Para un documento de Rumanía, el consulado no es la única vía: si tienes un familiar allí, un poder firmado en la sección consular le permite pedir el certificado por ti. Los registros de más de 100 años están en el Archivo Nacional rumano, en el servicio de cada distrito.",
    ],
  },
  {
    country: "es", slug: "castellon", lang: "es", name: "Castellón de la Plana", where: "en Castellón de la Plana",
    notes: [
      "Castellón de la Plana es una de las ciudades más rumanas de España: desde hace muchos años los rumanos son aquí la mayor comunidad extranjera, y en muchos barrios se oye el rumano por la calle. Llegaron sobre todo después de 2000, muchos de Muntenia y Oltenia, y trabajaron en la industria cerámica, en la construcción y en el cultivo de cítricos de la provincia.",
      "La comunidad de Castellón tiene ya una segunda generación de jóvenes nacidos y criados en España. Para ellos, el árbol familiar es un puente hacia el pueblo de sus padres: pueden ver en el mapa dónde nacieron sus abuelos y bisabuelos y preguntar, mientras hay tiempo, por sus historias.",
      "Como tantas familias de Castellón vienen de los mismos distritos, aquí es fácil encontrar a gente del pueblo de tus abuelos. Pregúntales qué saben de tu familia: una historia contada por un vecino del pueblo puede completar un árbol mejor que un documento. Apunta en el árbol de quién supiste cada cosa, para saber más tarde qué es seguro y qué hay que comprobar.",
      "Castellón tiene también una vida cultural rumana visible: festivales, clases de lengua rumana para niños y tiendas rumanas. Si tu rumano no es perfecto, no pasa nada: en Cartea Neamului puedes leer el árbol en español, mientras tus padres y abuelos lo completan en rumano.",
      "Los documentos españoles se piden en el Registro Civil de Castellón. El Archivo Histórico Provincial de Castellón guarda documentos antiguos de la provincia, útiles para las familias mixtas rumano-españolas, y los registros parroquiales españoles suelen estar en los archivos diocesanos.",
      "La ciudad tiene su propio consulado de Rumanía, que atiende la provincia de Castellón. Allí se piden los documentos de Rumanía, se firman poderes y se transcribe el nacimiento de los niños nacidos en España, con cita en econsulat.ro. Para los documentos de Rumanía, el poder dado a un familiar que se quedó allí suele ser lo más sencillo: lo firmas en el consulado y tu familiar recoge el certificado en el ayuntamiento del pueblo.",
    ],
  },
  {
    country: "es", slug: "valencia", lang: "es", name: "Valencia", where: "en Valencia",
    notes: [
      "Valencia y la Comunitat Valenciana tienen, además de Castellón, una gran comunidad rumana en la ciudad de Valencia y en los municipios de alrededor, donde muchos trabajan en la construcción, los servicios, el puerto y la agricultura. Muchos llegaron después de 2002, y una segunda generación ha nacido y crecido aquí.",
      "Para los niños que crecen en la Comunitat Valenciana, que hablan rumano en casa, castellano en el colegio y valenciano en la calle, el árbol familiar es una historia en varios idiomas. En Cartea Neamului cada miembro de la familia lo ve en su idioma: tú en español, tus abuelos en rumano, así que nada se pierde en la traducción.",
      "Muchos rumanos de Valencia tienen parientes también en Castellón o en Alicante, llegados de los mismos pueblos. Vale la pena reunirlos en un solo árbol: cada rama sabe otros nombres, otros apodos y otras historias, y juntas reconstruyen la familia como era en el pueblo.",
      "Un consejo para el árbol: en los documentos españoles los hijos llevan dos apellidos, el del padre y el de la madre. Al apuntarlos en el árbol, escribe el nombre tal como aparece en el documento rumano y anota la forma española, para que no se confundan los parientes que buscan.",
      "Para los documentos españoles, el Registro Civil de Valencia expide certificados, también en formato plurilingüe. El Archivo del Reino de Valencia y el Archivo Histórico Provincial guardan documentos antiguos, útiles para las familias con raíces valencianas.",
      "Valencia tiene un consulado general de Rumanía; las provincias que atiende figuran en la página oficial de la embajada. A través de él puedes pedir certificados rumanos, firmar poderes y transcribir nacimientos, con cita en econsulat.ro. Para los bisabuelos, los registros civiles de más de 100 años están en el Archivo Nacional rumano, en el servicio de cada distrito: puedes escribirles por correo electrónico desde España con el nombre, el año aproximado y el pueblo. La búsqueda puede tener un coste, y la respuesta suele llegar en unas semanas.",
    ],
  },
  {
    country: "es", slug: "barcelona", lang: "es", name: "Barcelona", where: "en Barcelona",
    notes: [
      "Barcelona y Cataluña tienen una gran comunidad rumana, repartida por la ciudad y las ciudades de alrededor, y también por las provincias de Girona, Lleida y Tarragona. En Lleida y en las zonas agrícolas, muchos rumanos trabajaron como temporeros en la recogida de fruta antes de quedarse definitivamente.",
      "Si has crecido en Cataluña con padres rumanos, tu familia probablemente está repartida entre varias ciudades, y quizá entre dos o tres países. Un árbol común, completado desde el móvil, mantiene unidas todas las ramas. Si tienes parientes que trabajaron de temporeros en Lleida o en Girona y volvieron a Rumanía, pregúntales también a ellos: los que se fueron y volvieron suelen saber mejor quién se quedó dónde y cómo se unen las ramas de la familia.",
      "Barcelona tiene también muchos jóvenes rumanos que vinieron a estudiar o a trabajar en las empresas tecnológicas de la ciudad y viven lejos de su familia. Para ellos, un árbol hecho a distancia, con los padres y los abuelos, es una manera de reunir los nombres y las historias antes de que se pierdan. En Cartea Neamului puedes leerlo en español mientras tus abuelos escriben en rumano.",
      "En Cataluña los documentos pueden estar en catalán o en castellano, y los nombres de pila a veces se escriben en su forma catalana. Para un niño nacido aquí de padres rumanos, comprueba en la transcripción la forma del nombre, para que sea la misma en los documentos de ambos países.",
      "Los documentos españoles se piden en el Registro Civil. El Arxiu Nacional de Catalunya y los archivos comarcales guardan documentos antiguos de las familias catalanas, y muchos registros parroquiales están en los archivos diocesanos.",
      "Barcelona tiene un consulado general de Rumanía, que atiende Cataluña; su zona exacta figura en la página oficial de la embajada. Para documentos de Rumanía, poderes y transcripción de nacimientos, la cita se pide en econsulat.ro. Para los documentos antiguos de Rumanía, empieza por el pueblo exacto de los abuelos: con él puedes pedir los registros al archivo del distrito.",
    ],
  },
  // ================================================================ Lotul 2 (19.11.2026): Italia, Germania, Austria, Franța
  {
    country: "it", slug: "roma", lang: "it", name: "Roma", where: "a Roma",
    notes: [
      "Roma ha più romeni di qualsiasi altra città italiana, e i quartieri e i comuni intorno, da Tor Bella Monaca e Torre Angela fino a Guidonia, Tivoli o Ladispoli, hanno famiglie romene arrivate soprattutto dopo il 2002. Molti all'inizio hanno lavorato nell'edilizia e nell'assistenza agli anziani, poi hanno aperto attività proprie, e i loro figli oggi frequentano i licei e le università romane. Se sei cresciuto qui con genitori romeni, fai parte di questa seconda generazione.",
      "Roma è anche la città con la presenza culturale romena più antica in Italia: l'Accademia di Romania, fondata nel 1922 a Valle Giulia, ha ospitato generazioni di artisti e studiosi romeni. È una storia da raccontare ai figli, insieme a quella, più vicina, dei nonni rimasti in Romania.",
      "Nelle scuole italiane i bambini ricevono spesso come compito „l'albero genealogico”. Per un ragazzo con genitori romeni è l'occasione giusta per chiamare i nonni e scoprire come si chiamavano i bisnonni, da quale paese venivano e che mestiere facevano. Un albero fatto insieme resta poi di tutta la famiglia, non solo del compito. Su Cartea Neamului puoi leggerlo in italiano mentre i nonni lo completano in romeno.",
      "Un buon albero ha tre fonti: quello che sanno i vivi, gli atti chiesti dalla Romania e gli atti italiani dei figli e dei nipoti. Comincia dalla prima, perché è quella che si perde più in fretta: i nonni che ricordano il paese, i soprannomi e chi ha sposato chi non ci saranno sempre a raccontarlo. Metti le foto vecchie nell'albero, con i nomi delle persone, finché qualcuno li ricorda.",
      "Per gli atti italiani della famiglia (nascite, matrimoni, certificati di residenza) ci si rivolge all'anagrafe e allo stato civile di Roma Capitale, per municipio. Per i parenti italiani di vecchia data, l'Archivio di Stato di Roma conserva registri e atti notarili, e il portale Antenati ha molti registri di stato civile online.",
      "Per la parte romena, a Roma ci sono l'Ambasciata di Romania e un consolato generale che serve il Lazio e le regioni vicine; l'appuntamento si prende su econsulat.ro. Trovato il paese esatto dei nonni, cercalo su Cartea Neamului per sapere a quale comune e a quale archivio di distretto appartiene.",
    ],
  },
  {
    country: "it", slug: "milano", lang: "it", name: "Milano", where: "a Milano",
    notes: [
      "Milano e la Lombardia hanno una delle comunità romene più grandi del Nord Italia. Qui sono arrivati molti giovani con studi, attirati dalle aziende, dagli ospedali e dalle università della città, ma anche famiglie che lavorano nell'edilizia, nei trasporti e nel commercio nei comuni dell'hinterland milanese. Molti romeni di Milano sono ormai la seconda generazione che vive in città.",
      "Per i ragazzi cresciuti qui, un albero di famiglia completato con i nonni della Moldavia, della Transilvania o della Muntenia è il modo più semplice per scoprire da dove vengono: ognuno può aggiungere quello che sa, dal telefono, nella propria lingua. Su Cartea Neamului tu lo leggi in italiano, i nonni lo scrivono in romeno.",
      "La Lombardia ha anche molte famiglie miste, romeno-italiane. Per loro l'albero ha due metà che si costruiscono in modo diverso: la parte italiana si cerca nei registri dei comuni e su Antenati, la parte romena parte dai nonni e arriva ai registri parrocchiali negli archivi di distretto. Su Cartea Neamului le due metà stanno nello stesso albero.",
      "Molti romeni lavorano a Milano ma abitano nei comuni intorno, da Sesto San Giovanni a Monza o Rho. Gli atti italiani della famiglia si chiedono al comune di residenza, non a Milano, quindi annota nell'albero anche il comune italiano in cui è nato ogni figlio: servirà per ogni trascrizione.",
      "Gli atti italiani si chiedono al Comune di Milano (anagrafe e stato civile). Per le famiglie con radici lombarde, l'Archivio di Stato di Milano conserva registri antichi, atti notarili e fondi delle istituzioni austriache della Lombardia di prima dell'unità d'Italia.",
      "Il Consolato generale di Romania a Milano serve la Lombardia e parte delle regioni vicine; la zona esatta è sulla pagina ufficiale dell'ambasciata. Lì si chiedono certificati dalla Romania, si firmano procure e si trascrive la nascita dei figli nati in Italia, con appuntamento su econsulat.ro. Se serve un atto romeno in fretta, la procura data a un parente in Romania è di solito la via più veloce: la firmi al consolato e il parente ritira l'atto in comune.",
    ],
  },
  {
    country: "it", slug: "torino", lang: "it", name: "Torino", where: "a Torino",
    notes: [
      "Torino è una delle città con la quota più alta di romeni in tutta Italia: i romeni sono la comunità straniera più numerosa della città e della provincia. Sono arrivati in gran numero dopo il 2002, molti dalla Moldavia romena (Bacău, Neamț, Vaslui) e dalle zone di Cluj e del Maramureș, e hanno lavorato nell'edilizia, nell'industria dell'auto e nell'assistenza.",
      "In Piemonte molti ragazzi nati da genitori romeni sono cresciuti parlando italiano con i fratelli e romeno solo con i nonni. Per loro l'albero di famiglia è anche una lezione di lingua: i nomi dei paesi, i soprannomi e i mestieri di una volta raccontano una storia che altrimenti non sentirebbero più. Su Cartea Neamului puoi leggere l'albero in italiano mentre i nonni lo completano in romeno.",
      "Poiché molti sono arrivati dagli stessi paesi, a Torino si incontrano spesso persone dello stesso comune. Vale la pena chiedere anche a loro: gli anziani di un paese sanno spesso chi è parente di chi e come si chiamavano i bisnonni che non hai conosciuto. Per le famiglie venute dagli stessi paesi della Moldavia, l'albero può diventare un progetto comune: i cugini di Torino, gli zii in Spagna e i nonni a casa aggiungono ognuno quello che sa.",
      "Per gli atti locali, il Comune di Torino rilascia i certificati di stato civile e di residenza, compresi i moduli multilingue che accompagnano gli atti in Romania. L'Archivio di Stato di Torino, uno dei più antichi d'Italia, conserva i registri dell'antico Regno di Sardegna, utili per le famiglie miste con radici piemontesi.",
      "Il Consolato generale di Romania a Torino serve il Piemonte e la Valle d'Aosta, secondo l'elenco ufficiale dell'ambasciata. L'appuntamento per certificati, procure, passaporti e trascrizione delle nascite si prende su econsulat.ro.",
      "Quando chiedi un atto vecchio dalla Romania, dai più dettagli possibile: nome completo, anno approssimativo, paese e comune di allora. Gli archivi di distretto rispondono più in fretta quando sanno esattamente cosa cercare, e la pagina di ogni località su Cartea Neamului ti dice a quale comune appartiene oggi il paese.",
    ],
  },
  {
    country: "de", slug: "munchen", lang: "de", name: "München", where: "in München",
    notes: [
      "München und Bayern haben die größte rumänische Gemeinschaft in Deutschland: Siebenbürger Sachsen und Banater Schwaben, die Rumänien vor 1990 verlassen haben, und Rumänen, die nach 2007 und vor allem ab 2014 kamen, als sie in Deutschland frei arbeiten durften. Viele arbeiten in der Autoindustrie, im Ingenieurwesen, im Gesundheitswesen und auf dem Bau. Wenn du hier mit rumänischen Eltern aufgewachsen bist, gehörst du zur zweiten Generation dieser Geschichte.",
      "Für junge Rumänen, die nach 2014 gekommen sind, leben Eltern und Großeltern fast immer noch in Rumänien. Der beste Anfang ist eine Liste, die man gemeinsam mit ihnen schreibt: vollständige Namen, Jahre, Dörfer und Berufe. Danach kommen die alten Fotos und die Geschichten dazu, und der Stammbaum wächst mit der Familie. Auf Cartea Neamului kannst du ihn auf Deutsch lesen, während deine Großeltern ihn auf Rumänisch ergänzen.",
      "In Bayern leben auch viele Rumänen aus dem Banat und dem Westen Siebenbürgens, die Verwandte unter den vor 1990 ausgewanderten Schwaben haben. Dasselbe Dorf hat oft einen deutschen, einen ungarischen und einen rumänischen Namen. Auf Cartea Neamului suchst du es mit dem heutigen rumänischen Namen; im Stammbaum kannst du alle Formen notieren, damit es auch die Verwandten in Deutschland finden.",
      "Deutsche Personenstandsurkunden stellt das Standesamt München aus, auf Wunsch auch als internationale (mehrsprachige) Urkunden. Das Stadtarchiv München und das Bayerische Hauptstaatsarchiv bewahren alte Dokumente auf, nützlich für gemischte Familien mit bayerischen Wurzeln. Zwischen Deutschland und Rumänien brauchen Personenstandsurkunden keine Apostille.",
      "Das Generalkonsulat von Rumänien in München befindet sich in der Richard-Strauss-Straße 149, 81679 München, laut der offiziellen Liste des Auswärtigen Amtes. Termine für Urkunden, Vollmachten, Pässe und die Eintragung von in Deutschland geborenen Kindern in die rumänischen Register werden über econsulat.ro gebucht.",
      "Für alte rumänische Register, die älter als 100 Jahre sind, schreibst du an die Kreisdirektion des Rumänischen Nationalarchivs, mit Namen, ungefährem Jahr und Dorf. Die Seite des Dorfes auf Cartea Neamului zeigt dir, zu welcher Gemeinde und welchem Kreis es heute gehört.",
    ],
  },
  {
    country: "de", slug: "berlin", lang: "de", name: "Berlin", where: "in Berlin",
    notes: [
      "Berlin hat eine junge und vielfältige rumänische Gemeinschaft: Studierende, Forschende, Künstler, Informatiker, Ärzte und Arbeiter, die vor allem nach 2007 gekommen sind. Viele sind allein gekommen und halten den Kontakt zur Familie in Rumänien über das Telefon. Ihre Kinder wachsen mit Deutsch auf und kennen Rumänisch oft nur aus den Gesprächen mit den Großeltern.",
      "Für Familien, deren Mitglieder in internationalen Firmen oder an Universitäten arbeiten, ist die Verwandtschaft oft weit verstreut: die Eltern in Rumänien, die Geschwister in anderen Ländern, die Kinder in Berlin. Ein gemeinsamer Stammbaum, den jeder in seiner Sprache liest, hält alle Zweige zusammen. Auf Cartea Neamului liest du ihn auf Deutsch, deine Großeltern schreiben auf Rumänisch.",
      "Berlin hat auch eine alte Verbindung zu Rumänien: Seit dem Ende des 19. Jahrhunderts haben viele rumänische Studenten an deutschen Universitäten studiert, und einige sind geblieben. Heute ist die Gemeinschaft vor allem jung, und für sie beginnt der Stammbaum fast immer mit einem Anruf zu Hause. In Berlin hat auch das Rumänische Kulturinstitut seinen Sitz, mit Veranstaltungen und einer Bibliothek.",
      "Deutsche Urkunden stellt das Standesamt des Bezirks aus, in dem das Ereignis stattfand. Das Landesarchiv Berlin bewahrt alte Personenstandsregister auf, und das Bundesarchiv, ebenfalls in Berlin, hat nationale Dokumente, nützlich für alle, die Spuren von Verwandten im Deutschland des 20. Jahrhunderts suchen.",
      "Die Botschaft von Rumänien befindet sich in der Dorotheenstraße 62–66, laut der offiziellen Liste des Auswärtigen Amtes. Ihre Konsularabteilung ist für Berlin und die umliegenden Länder zuständig; Termine gibt es über econsulat.ro. Zwischen Deutschland und Rumänien brauchen Personenstandsurkunden keine Apostille. In Berlin geborene Kinder rumänischer Eltern brauchen die Eintragung der Geburt in die rumänischen Register, bevor sie einen rumänischen Pass bekommen.",
      "Für alte Urkunden aus Rumänien schreibst du an die Kreisdirektion des Rumänischen Nationalarchivs, mit Namen, ungefährem Jahr und Dorf; die Seite des Dorfes auf Cartea Neamului zeigt dir, zu welcher Gemeinde es heute gehört.",
    ],
  },
  {
    country: "at", slug: "viena", lang: "de", name: "Wien", where: "in Wien",
    notes: [
      "Wien war bis 1918 die Hauptstadt, in die Studenten, Offiziere und Kaufleute aus Siebenbürgen, dem Banat und der Bukowina gingen. Hier studierte Mihai Eminescu zwischen 1869 und 1872, und viele rumänische Intellektuelle aus Siebenbürgen und der Bukowina wurden an der Wiener Universität ausgebildet. Heute hat Wien die größte rumänische Gemeinschaft Österreichs, mit Arbeitern, medizinischem Personal, Studierenden und Familien.",
      "Für Kinder, die in Wien aufwachsen, ist die gemeinsame Geschichte Österreichs und Siebenbürgens eine gute Geschichte zum Erzählen: dieselben Kaiser in den Schulbüchern beider Länder, dieselben Gebäude in Wien und in Sibiu oder Timișoara. Der Stammbaum zeigt ihnen, wo sich die beiden Geschichten in ihrer eigenen Familie treffen. Auf Cartea Neamului können sie ihn auf Deutsch lesen, während die Großeltern auf Rumänisch schreiben.",
      "Für Familien aus dem Westen Rumäniens ist Wien oft ein Teil des Stammbaums: ein Urgroßvater, der dort gearbeitet hat, eine Hochzeit, die dort geschlossen wurde, ein Kind, das dort geboren wurde. Notiere im Stammbaum den Ort jedes Ereignisses, denn davon hängt ab, wo du die Urkunde suchst. Wenn in der Familie von einem Urgroßvater erzählt wird, der in Wien gearbeitet hat, such ihn in den Meldeunterlagen der Stadt, wo Ankunftsdatum und Geburtsort stehen.",
      "Für österreichische Urkunden gibt es staatliche Standesämter seit 1938–1939; davor sind die Pfarrmatriken die Quelle. Das Wiener Stadt- und Landesarchiv bewahrt die alten Meldezettel auf, nützlich für Verwandte, die in der Stadt gelebt haben, und die Wiener Friedhöfe haben eine Online-Suche nach Namen der Verstorbenen.",
      "Das Österreichische Staatsarchiv in Wien bewahrt auch die Grundbuchblätter der Soldaten der österreichisch-ungarischen Armee aus allen Provinzen des Reiches auf. Für einen Urgroßvater aus Siebenbürgen, dem Banat oder der Bukowina, der Soldat war, kann ein solches Blatt Geburtsjahr und Geburtsort, Konfession und Beruf nennen.",
      "Rumänische Urkunden bekommst du über die Konsularabteilung der Botschaft in Wien, mit Termin über econsulat.ro: Bescheinigungen, Vollmachten, die Eintragung von Geburten und Ehen, Pässe.",
    ],
  },
  {
    country: "fr", slug: "paris", lang: "fr", name: "Paris", where: "à Paris",
    notes: [
      "Paris et l'Île-de-France accueillent la plus grande communauté roumaine de France. C'est ici qu'ont vécu, entre les deux guerres et pendant les années du communisme, beaucoup de grands artistes et écrivains roumains : Constantin Brâncuși, George Enescu, Emil Cioran, Eugène Ionesco. L'atelier de Brâncuși, reconstitué près du Centre Pompidou, et les tombes de Brâncuși, Cioran et Ionesco au cimetière du Montparnasse sont aujourd'hui encore des lieux que les Roumains de Paris montrent à leurs enfants.",
      "Après 1990, et surtout après 2007, sont arrivés des étudiants, des médecins, des ingénieurs, des ouvriers et des familles entières, qui vivent aujourd'hui à Paris comme dans les villes alentour. Leurs enfants grandissent en français et apprennent souvent à l'école qui étaient Brâncuși ou Ionesco. Pour eux, l'arbre de famille peut relier les grands noms des manuels à leurs propres grands-parents : des gens des mêmes villages et des mêmes villes, avec des histoires tout aussi intéressantes, que seule la famille connaît encore.",
      "Beaucoup de familles de l'exil d'après 1947 ont gardé chez elles des lettres, des photos et des actes rapportés du pays. Pour leurs descendants, c'est souvent le seul lien avec le village d'origine : scannez-les, notez le nom des personnes sur les photos tant que quelqu'un peut encore les reconnaître, et mettez-les dans l'arbre. La presse de l'exil roumain à Paris, conservée dans les grandes bibliothèques, peut aussi contenir des annonces de mariage ou de décès et des articles sur des personnes que la famille a oubliées.",
      "Les actes français se demandent à la mairie d'arrondissement ou à la mairie de la commune où l'événement a eu lieu. Les Archives de Paris ont mis en ligne les anciens registres d'état civil de la ville ; pour les années d'avant 1860, les registres originaux ont brûlé en 1871, et les archives conservent à leur place une partie des actes reconstitués après l'incendie.",
      "Pour les actes roumains, il faut passer par la section consulaire de l'ambassade à Paris, avec rendez-vous sur econsulat.ro : certificats, procurations, transcription des naissances et des mariages. Les actes d'état civil circulent entre la France et la Roumanie sans apostille.",
      "Avec le nom exact du village, la page de la localité sur Cartea Neamului vous indique la commune et les archives départementales roumaines (județ) dont il dépend aujourd'hui. Vous pouvez lire l'arbre en français pendant que vos grands-parents le complètent en roumain.",
    ],
  },
];

/** Adaugă la orașe limbile aprobate (limba țării pusă prima, ca la celelalte pagini). */
export function withCityLangs(regions: Region[], approved: Set<string>): Region[] {
  return regions.map((r) => {
    const extra = CITY_LANG_DRAFTS.filter((c) => c.country === r.country && c.slug === r.slug && approved.has(cityLangKey(c)) && !r.langs.includes(c.lang));
    if (!extra.length) return r;
    return {
      ...r,
      langs: [...extra.map((c) => c.lang), ...r.langs],
      name: { ...r.name, ...Object.fromEntries(extra.map((c) => [c.lang, c.name])) },
      where: { ...r.where, ...Object.fromEntries(extra.map((c) => [c.lang, c.where])) },
      notes: { ...r.notes, ...Object.fromEntries(extra.map((c) => [c.lang, c.notes])) },
    };
  });
}
