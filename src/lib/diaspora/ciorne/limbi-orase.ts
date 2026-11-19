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
