import type { BisericaCatalog } from "./ro";

/** Español. Versículos de la Reina-Valera 1909. */
export const esBiserica: BisericaCatalog = {
  Church: {
    meta: {
      title: "La historia de la Iglesia perseguida",
      description: "La Iglesia de Cristo desde los apóstoles hasta hoy: mártires, reformadores, la Biblia en rumano y héroes de la fe de las cárceles comunistas.",
    },
    label: "Historia de la Iglesia",
    title: "La Iglesia de Cristo, perseguida desde el principio hasta hoy",
    toc: "Contenido",
    heroesChip: "Héroes de la fe",
    bibleChip: "La Biblia en rumano",
    filterLabel: "Qué mostrar",
    all: "Todo el mundo",
    onlyRo: "Solo en Rumanía",
    today: "hoy",
    ourLand: "en Rumanía",
    quoted: "«{text}»",
    heroesLabel: "Historias que dan fuerza",
    heroesTitle: "Héroes de la fe de las cárceles comunistas",
    bibleLabel: "La Palabra en nuestra lengua",
    bibleTitle: "Cómo llegó la Biblia a la lengua rumana",
    influenceTitle: "Lo que la Biblia cambió en la vida de los rumanos",
    endTitle: "También nosotros somos una página de esta historia",
    endText: "La Iglesia no es un edificio ni una institución, sino todos los que han recibido a Cristo, desde Esteban hasta los abuelos que oraban a escondidas, y hasta nosotros. La luz ha pasado de mano en mano durante dos mil años, muchas veces a costa de la vida. Ahora está en nuestras manos: mantenerla encendida, leer la Palabra y orar por los que hoy son perseguidos.",
    readJohn: "Leer el Evangelio de Juan",
    note: "Los versículos son de la Biblia Reina-Valera de 1909. Donde algo es solo tradición, el texto lo dice.",
    intro: "El Señor Jesús no prometió a sus discípulos una vida fácil, sino que su Iglesia no sería vencida. Desde Jerusalén hasta hoy, cada vez que alguien quiso apagar la luz del Evangelio, se volvió a encender en otro lugar. Aquí están algunos de los que pagaron su fe con la libertad o con la vida, y algunos de los momentos en que la Palabra volvió a las manos de la gente sencilla.",
    promise: {
      text: "Mas yo también te digo, que tú eres Pedro, y sobre esta piedra edificaré mi iglesia; y las puertas del infierno no prevalecerán contra ella.",
      ref: "Mateo 16:18",
    },
    eras: {
      apostoli: {
        name: "La Iglesia de los apóstoles",
        intro: "Después de la resurrección del Señor, unos pocos pescadores y gente sencilla de Galilea llevaron la buena noticia a Jerusalén y luego a todo el mundo romano. La persecución empezó casi enseguida: primero por parte de los líderes judíos, después por parte de Roma. Pero la persecución los dispersó, y los dispersos llevaron la Palabra más lejos.",
        verse: {
          text: "Mas los que fueron esparcidos, iban por todas partes anunciando la palabra.",
          ref: "Hechos 8:4",
        },
        w: {
          w1: {
            name: "Esteban, el primer mártir",
            years: "hacia el 34",
            place: "Jerusalén",
            text: "Uno de los siete diáconos de la Iglesia de Jerusalén. Después de dar testimonio de Cristo ante el sanedrín, lo sacaron de la ciudad y lo apedrearon. Un joven llamado Saulo, que llegaría a ser el apóstol Pablo, estaba presente cuando murió.",
            quote: "Señor, no les imputes este pecado. (Hechos 7:60)",
          },
          w2: {
            name: "Jacobo, hijo de Zebedeo",
            years: "hacia el 44",
            place: "Jerusalén",
            text: "El hermano del apóstol Juan, el primero de los doce apóstoles que murió por Cristo: el rey Herodes Agripa lo mató a espada (Hechos 12:2).",
          },
          w3: {
            name: "Los cristianos de Roma bajo Nerón",
            years: "64",
            place: "Roma",
            text: "Después del gran incendio de Roma, el emperador Nerón culpó a los cristianos. El historiador romano Tácito escribe que algunos fueron echados a las fieras y otros crucificados o quemados como antorchas en los jardines del emperador. Según la antigua tradición de la Iglesia, los apóstoles Pedro (crucificado) y Pablo (decapitado) murieron también en Roma en aquel tiempo, bajo Nerón.",
          },
          w4: {
            name: "El apóstol Andrés",
            years: "siglo I",
            place: "Escitia Menor (la actual Dobruja)",
            text: "Una antigua tradición, recogida por Orígenes y Eusebio, dice que Andrés, el hermano de Pedro, fue enviado a predicar el Evangelio en Escitia. Por eso los rumanos lo consideran su apóstol. No sabemos con certeza por dónde pasó, pero sí sabemos que hubo cristianos en Dobruja muy pronto.",
          },
          w5: {
            name: "Juan, desterrado en Patmos",
            years: "hacia el 95",
            place: "La isla de Patmos",
            text: "El último apóstol que seguía vivo fue desterrado a una isla «por la palabra de Dios y el testimonio de Jesucristo» (Apocalipsis 1:9). Allí recibió la revelación escrita en el libro del Apocalipsis.",
          },
        },
      },
      roma: {
        name: "Mártires bajo los emperadores de Roma",
        intro: "Durante doscientos cincuenta años, ser cristiano podía significar la muerte. Los cristianos no querían ofrecer sacrificios a los dioses y al emperador, por eso se los veía como enemigos del Estado. La persecución llegaba en oleadas: a veces local, a veces en todo el imperio. La más dura fue la última, bajo Diocleciano.",
        verse: {
          text: "Sé fiel hasta la muerte, y yo te daré la corona de la vida.",
          ref: "Apocalipsis 2:10",
        },
        w: {
          w1: {
            name: "Ignacio de Antioquía",
            years: "hacia el 110",
            place: "Antioquía → Roma",
            text: "Obispo de Antioquía, llevado encadenado a Roma para ser echado a las fieras. Por el camino escribió siete cartas a las iglesias, que se han conservado: les pide que permanezcan unidas y que no intenten salvarlo de la muerte.",
          },
          w2: {
            name: "Policarpo de Esmirna",
            years: "hacia el 155",
            place: "Esmirna (en la actual Turquía)",
            text: "Discípulo del apóstol Juan y obispo anciano. Cuando le pidieron que negara a Cristo para salvarse, respondió con las palabras que se conservan en el relato de su martirio. Fue quemado en la hoguera.",
            quote: "Ochenta y seis años le he servido, y ningún mal me ha hecho. ¿Cómo puedo blasfemar de mi Rey, que me ha salvado?",
          },
          w3: {
            name: "Justino Mártir",
            years: "hacia el 165",
            place: "Roma",
            text: "Un filósofo que encontró a Cristo después de buscar la verdad en todas las escuelas de su tiempo. Escribió defensas de la fe dirigidas a los emperadores y fue decapitado junto con sus discípulos.",
          },
          w4: {
            name: "Perpetua y Felicidad",
            years: "203",
            place: "Cartago (en la actual Túnez)",
            text: "Una joven madre de buena familia y su esclava, que acababa de dar a luz. Se negaron a sacrificar a los dioses y murieron juntas en la arena. La propia Perpetua escribió en la cárcel los días anteriores a su muerte.",
          },
          w5: {
            name: "La persecución de Decio",
            years: "250",
            place: "Todo el imperio",
            text: "El emperador ordenó que cada persona ofreciera un sacrificio a los dioses y recibiera un certificado. Muchos cristianos murieron, muchos se escondieron y algunos cedieron. Después, la Iglesia tuvo que aprender a recibir de nuevo a los que habían caído.",
          },
          w6: {
            name: "Epicteto y Astión",
            years: "hacia el 290",
            place: "Halmyris, cerca de Murighiol (Tulcea)",
            text: "Un sacerdote y un joven discípulo, muertos por su fe en la fortaleza romana de Halmyris, en la desembocadura del Danubio. Sus reliquias fueron halladas por los arqueólogos en la cripta de la basílica del lugar en 2001.",
          },
          w7: {
            name: "La Gran Persecución y los mártires de Niculițel",
            years: "303–311",
            place: "Todo el imperio; Niculițel (Tulcea)",
            text: "Diocleciano ordenó derribar las iglesias, quemar las Escrituras y encarcelar al clero. Muchos cristianos de Dobruja murieron en aquel tiempo. En 1971, en Niculițel, se descubrió bajo una antigua basílica una cripta con los huesos de cuatro mártires, con sus nombres escritos en la pared: Zótico, Átalo, Camasis y Filipo.",
          },
        },
      },
      "evul-mediu": {
        name: "Una Iglesia libre, pero tentada",
        intro: "En el año 313, por el Edicto de Milán, los cristianos obtuvieron permiso para vivir su fe libremente. La Iglesia escapó de la espada de Roma, pero encontró otra tentación: el poder. Con el tiempo, muchos llegaron a ser cristianos solo de nombre, y la Escritura quedó en una lengua que el pueblo ya no entendía. Los que llamaban a volver a la Palabra fueron perseguidos, esta vez por quienes se llamaban Iglesia.",
        verse: {
          text: "El cielo y la tierra pasarán, mas mis palabras no pasarán.",
          ref: "Mateo 24:35",
        },
        w: {
          w1: {
            name: "Sabas el Godo",
            years: "372",
            place: "El río Buzău",
            text: "Un cristiano godo que se negó a comer carne sacrificada a los ídolos. El jefe godo lo ahogó en el río Mousaios, el actual Buzău, el 12 de abril de 372. En aquel tiempo, en la tierra al norte del Danubio, Ulfilas había traducido la Biblia a la lengua goda.",
          },
          w2: {
            name: "Pedro Valdo y los valdenses",
            years: "hacia 1170",
            place: "Lyon, luego los Alpes",
            text: "Un rico comerciante de Lyon que repartió sus bienes e hizo traducir la Escritura a la lengua del pueblo. Sus seguidores predicaban la Biblia por los pueblos. Fueron declarados herejes y perseguidos durante siglos, pero se escondieron en los valles de los Alpes y han llegado hasta hoy.",
          },
          w3: {
            name: "John Wycliffe",
            years: "hacia 1330–1384",
            place: "Oxford, Inglaterra",
            text: "Un profesor de Oxford que enseñaba que la Escritura está por encima del papa y quería que la Biblia se tradujera al inglés. Murió en su cama, pero en 1428 la Iglesia desenterró sus huesos, los quemó y arrojó las cenizas a un río.",
          },
          w4: {
            name: "Jan Hus",
            years: "1415",
            place: "Praga → Constanza",
            text: "Sacerdote y profesor en Praga, predicaba en checo y llamaba a la Iglesia a volver a la Escritura. Fue convocado al Concilio de Constanza con la promesa de que podría irse libremente; lo arrestaron y lo quemaron en la hoguera el 6 de julio de 1415, porque no quiso negar lo que había aprendido de la Biblia.",
          },
        },
      },
      reforma: {
        name: "La Reforma: la Escritura en la lengua del pueblo",
        intro: "Cien años después de Hus, un monje alemán redescubrió en la carta a los Romanos que somos salvados por la fe, como un regalo de Dios, no por obras ni por dinero. La imprenta acababa de aparecer, así que la Escritura podía por fin llegar a las casas. Siguieron cien años de luchas y persecuciones, en los que, por desgracia, los cristianos también se persiguieron unos a otros.",
        verse: {
          text: "Mas el justo vivirá por la fe.",
          ref: "Romanos 1:17",
        },
        w: {
          w1: {
            name: "Martín Lutero",
            years: "1483–1546",
            place: "Wittenberg, Alemania",
            text: "Monje y profesor de teología. El 31 de octubre de 1517 escribió las 95 tesis contra la venta del perdón de los pecados por dinero. En 1521, en la Dieta de Worms, ante el emperador, se negó a retractarse de sus escritos, porque estaba atado a la Palabra de Dios. Fue declarado proscrito; sus amigos lo escondieron en el castillo de Wartburg, donde tradujo el Nuevo Testamento al alemán (1522). Su enseñanza se resume en tres frases: solo la Escritura, solo la gracia, solo la fe. No estuvo libre de faltas: en su vejez escribió palabras duras e injustas contra los judíos, que no podemos aceptar como buenas.",
            quote: "Mi conciencia está cautiva de la Palabra de Dios. No puedo ni quiero retractarme de nada. (Worms, 1521)",
          },
          w2: {
            name: "Félix Manz",
            years: "1527",
            place: "Zúrich, Suiza",
            text: "Uno de los primeros «anabaptistas», que creían que el bautismo es para los que creen y se arrepienten. Las autoridades protestantes de Zúrich lo ahogaron en el río Limmat. Miles de anabaptistas fueron muertos en aquel tiempo, tanto por católicos como por protestantes.",
          },
          w3: {
            name: "William Tyndale",
            years: "1536",
            place: "Vilvoorde, cerca de Bruselas",
            text: "Tradujo el Nuevo Testamento del griego al inglés, aunque estaba prohibido, y lo imprimió en el extranjero; los ejemplares entraban en Inglaterra a escondidas. Fue traicionado, encarcelado, luego estrangulado y quemado. Su traducción está en la raíz de la Biblia inglesa posterior.",
            quote: "¡Señor, abre los ojos del rey de Inglaterra!",
          },
          w4: {
            name: "El diácono Coresi y los primeros libros rumanos",
            years: "1559–1582",
            place: "Brașov, Orăștie",
            text: "En Brașov, en tiempos de la Reforma, el diácono Coresi imprimió los primeros libros en lengua rumana, entre ellos los Evangelios (el Tetraevangelio, 1561). En 1582 se imprimió en Orăștie la Palia, los primeros libros del Antiguo Testamento en rumano. Por primera vez, los rumanos podían oír la Palabra en su propia lengua.",
          },
          w5: {
            name: "La Dieta de Turda",
            years: "1568",
            place: "Turda, Transilvania",
            text: "La Dieta de Transilvania decidió que cada comunidad podía elegir a su predicador, «porque la fe es un don de Dios». Fue una de las primeras leyes de libertad religiosa de Europa. Los rumanos ortodoxos, sin embargo, siguieron siendo solo «tolerados», sin los mismos derechos.",
          },
          w6: {
            name: "Latimer y Ridley",
            years: "1555",
            place: "Oxford, Inglaterra",
            text: "Dos obispos ingleses quemados en la misma hoguera bajo la reina María I, que hizo morir a casi trescientos protestantes. Latimer le dijo a su amigo que tuviera ánimo, porque aquel día encenderían una vela que nunca se apagaría.",
          },
          w7: {
            name: "La matanza de San Bartolomé",
            years: "1572",
            place: "París y Francia",
            text: "En la noche del 24 de agosto, miles de protestantes franceses (hugonotes) fueron asesinados en París y después en otras ciudades. Muchos de los que sobrevivieron huyeron del país.",
          },
          w8: {
            name: "La Biblia en rumano",
            years: "1648–1688",
            place: "Bălgrad (Alba Iulia), Bucarest",
            text: "En 1648 apareció en Bălgrad el Nuevo Testamento en rumano, y en 1688, en Bucarest, la primera Biblia completa en lengua rumana, con el apoyo del príncipe Șerban Cantacuzino.",
          },
        },
      },
      trezire: {
        name: "Avivamiento y misión",
        intro: "Estos siglos trajeron avivamientos espirituales en muchos países y los primeros misioneros que fueron hasta los confines de la tierra, pero también nuevos mártires, bajo los turcos, en las colonias y en los países donde el Evangelio llegaba por primera vez.",
        verse: {
          text: "Jesucristo es el mismo ayer, y hoy, y por los siglos.",
          ref: "Hebreos 13:8",
        },
        w: {
          w1: {
            name: "Constantin Brâncoveanu y sus hijos",
            years: "1714",
            place: "Constantinopla",
            text: "El príncipe de Valaquia fue depuesto y llevado a Constantinopla con sus cuatro hijos y su consejero Ienache. El 15 de agosto de 1714 se les pidió que negaran su fe para salvarse. Se negaron y fueron decapitados, primero los hijos, ante los ojos de su padre, y después el propio príncipe.",
          },
          w2: {
            name: "Los hermanos moravos de Herrnhut",
            years: "1727",
            place: "Sajonia",
            text: "Descendientes de los husitas, refugiados en la finca del conde Zinzendorf, comenzaron una oración que continuó sin interrupción durante cien años y enviaron misioneros entre los esclavos del Caribe, a Groenlandia y a África.",
          },
          w3: {
            name: "Los mártires de China (la rebelión de los Bóxers)",
            years: "1900",
            place: "Norte de China",
            text: "En el levantamiento contra los extranjeros murieron varios cientos de misioneros y más de treinta mil cristianos chinos. En lugar de desaparecer, la Iglesia en China creció en el siglo siguiente hasta decenas de millones.",
          },
        },
      },
      "secolul-xx": {
        name: "El siglo de los mártires",
        intro: "El siglo XX trajo las mayores persecuciones de la historia: el genocidio armenio, el terror soviético, el nazismo y, después de la Segunda Guerra Mundial, el comunismo impuesto también en Rumanía. El Estado ateo quería arrancar la fe del corazón de la gente. No lo consiguió. En las cárceles se aprendían versículos de memoria y se pasaban de unos a otros a través de las paredes.",
        verse: {
          text: "Estando atribulados en todo, mas no angustiados; en apuros, mas no desesperamos; perseguidos, mas no desamparados; abatidos, mas no perecemos.",
          ref: "2 Corintios 4:8–9",
        },
        w: {
          w1: {
            name: "El genocidio armenio",
            years: "1915–1923",
            place: "El Imperio otomano",
            text: "Alrededor de un millón y medio de armenios, el pueblo cristiano más antiguo, fueron asesinados o murieron en las deportaciones. En aquel tiempo perecieron también cientos de miles de cristianos asirios y griegos.",
          },
          w2: {
            name: "Iosif Trifa y el Ejército del Señor",
            years: "1923–1948",
            place: "Sibiu, luego todo el país",
            text: "En 1923, el sacerdote Iosif Trifa inició un movimiento de avivamiento entre los ortodoxos, con la Biblia, himnos y el abandono de la bebida y las blasfemias. Los comunistas lo prohibieron en 1948; sus hermanos se reunieron en secreto durante décadas. El poeta Traian Dorz y el compositor Nicolae Moldoveanu, dos de sus hermanos, pasaron por las cárceles (ver sus historias más abajo).",
          },
          w3: {
            name: "Dumitru Cornilescu",
            years: "1921–1923",
            place: "Stânca-Ștefănești, Bucarest",
            text: "Un joven diácono ortodoxo que tradujo la Biblia a un rumano vivo y claro (1921, revisada en 1924). Al leerla, llegó a una fe personal en Cristo. Fue obligado a salir del país en 1923 y nunca volvió; murió en Suiza en 1975. Su traducción la siguen leyendo hoy millones de rumanos.",
          },
          w4: {
            name: "Dietrich Bonhoeffer",
            years: "1945",
            place: "Flossenbürg, Alemania",
            text: "Un pastor alemán que se opuso a Hitler y ayudó a judíos a escapar. Estuvo preso dos años y fue ahorcado el 9 de abril de 1945, pocas semanas antes del final de la guerra.",
          },
          w5: {
            name: "Los obispos grecocatólicos",
            years: "1948–1970",
            place: "Sighet, Căldărușani, Blaj",
            text: "En 1948 los comunistas suprimieron la Iglesia grecocatólica, se quedaron con sus templos y arrestaron a todos sus obispos. Cinco de ellos murieron en la cárcel o bajo arresto domiciliario; el obispo Iuliu Hossu, que había leído la Declaración de Unión en Alba Iulia el 1 de diciembre de 1918, murió en 1970 sin haber sido nunca liberado.",
          },
          w6: {
            name: "Richard y Sabina Wurmbrand",
            years: "1948–1964",
            place: "Văcărești, Jilava, Gherla",
            text: "Pastor luterano de Bucarest, judío convertido a Cristo. Fue arrestado en 1948 y pasó en total catorce años en cárceles, tres de ellos solo en una celda subterránea; también su esposa Sabina pasó por un campo de trabajo. Liberado en 1964 y rescatado del país, escribió «Torturado por Cristo» y fundó una misión que sigue ayudando hoy a los cristianos perseguidos.",
          },
          w7: {
            name: "Sacerdotes, pastores y creyentes de todas las confesiones",
            years: "1948–1989",
            place: "Aiud, Gherla, Pitești, el Canal",
            text: "Miles de sacerdotes ortodoxos y grecocatólicos, pastores bautistas, pentecostales y adventistas y creyentes de los Hermanos pasaron por cárceles y campos de trabajo. El teólogo Dumitru Stăniloae estuvo preso cinco años. El sacerdote Gheorghe Calciu pasó veintiún años en la cárcel, la última vez por los sermones que dirigió a los jóvenes en 1978. Cristianos de Occidente introducían Biblias en el país a escondidas.",
          },
          w8: {
            name: "Timișoara, diciembre de 1989",
            years: "1989",
            place: "Timișoara",
            text: "La revolución empezó con una cadena de personas de todas las confesiones que se pusieron delante de la casa del pastor reformado László Tőkés para que no lo desalojaran. En la plaza, la multitud gritaba «¡Existe Dios!».",
          },
        },
      },
      azi: {
        name: "La Iglesia perseguida hoy",
        intro: "La persecución no se ha detenido. Según Puertas Abiertas, que sigue la situación cada año, más de 380 millones de cristianos, aproximadamente uno de cada siete, viven hoy en un país donde su fe les puede costar el trabajo, la libertad o la vida: en Corea del Norte, en partes de África, en Oriente Medio, en Asia. Y la Iglesia crece hoy precisamente allí donde es más difícil.",
        verse: {
          text: "Y también todos los que quieren vivir píamente en Cristo Jesús, padecerán persecución.",
          ref: "2 Timoteo 3:12",
        },
        w: {
          w1: {
            name: "Los 21 de la playa de Libia",
            years: "2015",
            place: "Sirte, Libia",
            text: "Veinte trabajadores cristianos coptos de Egipto y un joven de Ghana fueron asesinados por el grupo Estado Islámico. La grabación muestra a muchos de ellos pronunciando el nombre de Jesús en el último momento.",
          },
          w2: {
            name: "Los cristianos de Nigeria",
            years: "hoy",
            place: "Norte y centro de Nigeria",
            text: "Casi cada semana se atacan pueblos enteros y se queman iglesias. Nigeria es el país donde más cristianos mueren por su fe.",
          },
          w3: {
            name: "La Iglesia en Corea del Norte",
            years: "hoy",
            place: "Corea del Norte",
            text: "Tener una Biblia puede enviar a toda una familia a un campo de trabajo. Y aun así, decenas de miles de creyentes oran en secreto.",
          },
          w4: {
            name: "La libertad en Rumanía",
            years: "1990–hoy",
            place: "Rumanía",
            text: "Desde 1989, la Biblia se imprime y se lee libremente en Rumanía. Es un regalo pagado con el sufrimiento de los que vinieron antes que nosotros, y un deber: orar por los que hoy pasan por lo que ellos pasaron.",
          },
        },
      },
    },
    heroesIntro: "La historia de la Iglesia no es solo una lista de sufrimientos. Es también la historia de gente sencilla, de nuestros pueblos y ciudades, que descubrió que Cristo estaba más cerca en una celda de la cárcel de lo que nunca había estado en libertad. Sus historias no están aquí para asustarnos, sino para darnos fuerza.",
    heroes: {
      wurmbrand: {
        name: "Richard Wurmbrand",
        years: "1909–2001",
        who: "Pastor luterano de Bucarest, judío convertido a Cristo. Catorce años en las cárceles comunistas.",
        story: {
          p1: "En 1945 los comunistas reunieron en Bucarest un «Congreso de los Cultos», donde sacerdotes y pastores, uno tras otro, alababan al nuevo régimen. Sabina, su esposa, le dijo: «¡Richard, levántate y lava esta vergüenza del rostro de Cristo!». Él respondió que, si hablaba, ella perdería a su marido. Sabina dijo que no quería un cobarde por marido. Richard se levantó y dijo ante todos que el deber de la Iglesia es anunciar a Cristo, no alabar a los que tienen el poder.",
          p2: "En 1948 se lo llevaron de la calle y desapareció durante años; su familia ni siquiera sabía si seguía vivo. Durante tres años estuvo solo en una celda subterránea, sin libros, sin luz del día, sin ver a nadie más que a los guardias. Para no perder la mente, cada noche componía un sermón y lo predicaba en su cabeza, como si hablara a toda una iglesia. Hablaba con los presos de las celdas vecinas golpeando la pared, letra por letra; así llegó a anunciar el Evangelio a un hombre cuyo rostro nunca vio.",
          p3: "Más tarde contó cómo, repitiéndose las palabras del Señor «Gozaos en aquel día, y alegraos», se levantó en su celda y bailó de alegría. Los guardias pensaron que se había vuelto loco y le trajeron más comida.",
          p4: "Liberado en 1964 y rescatado del país por cristianos de Noruega, se quitó la camisa ante el Senado de los Estados Unidos para mostrar las cicatrices de la tortura. Escribió «Torturado por Cristo» y fundó una misión que sigue ayudando hoy a los cristianos perseguidos. Lo que más repetía: que amaba a los que lo habían torturado y que oraba por ellos.",
        },
        lesson: "La fe no es una idea que se pierde cuando te lo quitan todo. Cuando a Wurmbrand no le quedó nada, descubrió que tenía a Cristo, y eso le bastaba.",
        verse: {
          text: "Gozaos en aquel día, y alegraos; porque he aquí vuestro galardón es grande en los cielos",
          ref: "Lucas 6:23",
        },
      },
      moldoveanu: {
        name: "Nicolae Moldoveanu",
        years: "1922–2007",
        who: "Compositor del Ejército del Señor, «el David del himno rumano». Cinco años de cárcel por escribir himnos.",
        story: {
          p1: "Nació en Movileni, en el distrito de Tecuci (hoy Galați), y perdió a su padre siendo pequeño. Criado en una banda militar para niños pobres, vendía la mitad de su ración de pan y toda su leche para comprar una Biblia y la revista del Ejército del Señor.",
          p2: "En 1959 fue arrestado por «componer cantos religiosos y propaganda religiosa» y condenado a doce años; cumplió cinco. En la cárcel no tenía lápiz, ni papel, ni pentagramas. Y aun así compuso allí trescientos cincuenta himnos, que guardó en la memoria, nota por nota, y solo escribió al salir.",
          p3: "Richard Wurmbrand, que compartió celda con él en Gherla, contó una noche de invierno: no tenían ropa de abrigo, dormían sobre el cemento desnudo, y los guardias los hacían levantarse y acostarse una y otra vez a voces. Los demás maldecían. Moldoveanu alababa a Dios y, tumbado sobre el cemento, le cantó un himno nuevo, lleno de alegría y de esperanza, que hoy se canta en muchos países.",
          p4: "A lo largo de su vida escribió más de siete mil himnos, muchos con letra de Traian Dorz, que se siguen cantando en las iglesias de todo el país. Cuando Wurmbrand volvió a Rumanía en 1990, la primera persona a la que vio fue él.",
        },
        lesson: "Te pueden encerrar, pero no te pueden impedir cantar. Lo que se sembró en la oscuridad se canta hoy en iglesias llenas.",
        verse: {
          text: "Estando atribulados en todo, mas no angustiados; en apuros, mas no desesperamos;",
          ref: "2 Corintios 4:8",
        },
      },
      dorz: {
        name: "Traian Dorz",
        years: "1914–1989",
        who: "Poeta campesino de Livada Beiușului (Bihor), del Ejército del Señor. Casi dieciocho años de cárceles y colonias de trabajo.",
        story: {
          p1: "Hijo de campesinos pobres, recibió como premio escolar un libro del sacerdote Iosif Trifa. Lo leyó, entregó su vida a Cristo a los quince años y enseguida empezó a escribir versos.",
          p2: "Fue arrestado por primera vez en diciembre de 1947, y luego una y otra vez: Oradea, Gherla, Deva, Periprava, el Bărăgan. En 1959 fue condenado a dieciséis años de trabajos forzados; salió en 1964. En un interrogatorio lo pusieron contra una pared con una pistola en la sien, para asustarlo; más tarde contó que entonces pasó por su propia muerte y que ya no tenía nada que temer.",
          p3: "La celda era tan pequeña que no podía estar de pie derecho. No le dejaban escribir, así que componía sus poemas en la cabeza y guardó más de trescientos en la memoria, que escribió después de salir. Su hija le llevaba paquetes que los guardias echaban a los perros; entonces encontró un agujero en la valla, que solo conocían ellos dos, y le dejaba allí la comida.",
          p4: "Incluso después de la cárcel, la Securitate lo vigilaba; cuando veían su lámpara encendida de noche, le gritaban que no tenía permiso para escribir. Él siguió escribiendo. Murió en junio de 1989, medio año antes de la caída del comunismo; aunque las autoridades intentaron impedirlo, más de diez mil personas acudieron a su entierro.",
        },
        lesson: "Lo que guarda el corazón no se puede confiscar. Los poemas escritos a escondidas, a la luz de la lámpara, se cantan hoy en todo el país.",
        verse: {
          text: "Sé fiel hasta la muerte, y yo te daré la corona de la vida.",
          ref: "Apocalipsis 2:10",
        },
      },
    },
    bibleIntro: "Durante mucho tiempo, los rumanos oyeron los oficios de la iglesia en eslavo, una lengua que el sacerdote apenas entendía y el pueblo en absoluto. La Palabra de Dios les llegó en su lengua materna poco a poco, libro a libro, a lo largo de trescientos años.",
    steps: {
      b1: {
        year: "siglos XV–XVI",
        title: "Los primeros textos manuscritos",
        who: "Traductores desconocidos, en Maramureș y el norte de Transilvania",
        text: "Los fragmentos más antiguos de la Biblia en rumano son manuscritos: el Salterio de Schei, el Salterio de Voroneț, el Códice de Voroneț (los Hechos de los Apóstoles y las epístolas). Nos han llegado en copias del siglo XVI y están escritos en el habla del norte. No sabemos con certeza quién los tradujo; algunos historiadores piensan que nacieron bajo el eco de los husitas o de la Reforma.",
      },
      b2: {
        year: "1561",
        title: "El Tetraevangelio de Coresi",
        who: "El diácono Coresi, en Brașov, con el apoyo del juez sajón Hans Benkner",
        text: "El primer libro impreso con los cuatro Evangelios en rumano. Siguieron el Apóstol (1563) y el Salterio (1570). Los prólogos de esos libros dicen por qué: todos los pueblos tenían la Palabra de Dios en su lengua, solo los rumanos no. Sus libros llegaron a las iglesias de los tres países rumanos y pusieron el habla de Valaquia y del sur de Transilvania en la base de la lengua literaria de hoy.",
      },
      b3: {
        year: "1582",
        title: "La Palia de Orăștie",
        who: "El obispo Mihail Tordaș y otros cuatro sacerdotes, con el apoyo de Francisc Geszti",
        text: "La primera traducción al rumano de los primeros libros del Antiguo Testamento: el Génesis y el Éxodo. El prólogo dice a los lectores que se tradujo para que también los rumanos tuvieran la Escritura, como la tienen los demás pueblos.",
      },
      b4: {
        year: "1648",
        title: "El Nuevo Testamento de Bălgrad",
        who: "El metropolita Simion Ștefan de Transilvania, en Alba Iulia",
        text: "El primer Nuevo Testamento completo en rumano, traducido del griego y del latín. En el prólogo, el metropolita escribió que había elegido las palabras que entendían los rumanos de todas las tierras, porque hablaban de forma distinta de una región a otra. Era, abiertamente, un pensamiento por la unidad de la lengua.",
        quote: "Las palabras deben ser como el dinero: buenas son las monedas que corren por todas las tierras; así también son buenas las palabras que todos entienden.",
      },
      b5: {
        year: "1688",
        title: "La Biblia de Bucarest",
        who: "Comenzada bajo Șerban Cantacuzino, terminada bajo Constantin Brâncoveanu; traductores: Nicolae Milescu y los hermanos Radu y Șerban Greceanu",
        text: "La primera Biblia completa en lengua rumana. El Antiguo Testamento partió de la traducción hecha por el erudito moldavo Nicolae Milescu, revisada en Bucarest por los hermanos Greceanu. Por primera vez, Moldavia, Valaquia y Transilvania tenían la misma Biblia, en la misma lengua; fue la lengua de los libros de los rumanos durante más de cien años.",
      },
      b6: {
        year: "1795",
        title: "La Biblia de Blaj",
        who: "Samuil Micu, de la Escuela Transilvana",
        text: "Traducida de nuevo, a partir de la Septuaginta, por un erudito grecocatólico. Pasó por las manos de muchas generaciones de sacerdotes y maestros de Transilvania.",
      },
      b7: {
        year: "1856–1858",
        title: "La Biblia de Șaguna",
        who: "El metropolita Andrei Șaguna, en Sibiu",
        text: "Una edición preparada con cuidado para los creyentes ortodoxos de Transilvania, en una lengua más cercana a la que hablaba la gente.",
      },
      b8: {
        year: "1921–1924",
        title: "La Biblia Cornilescu",
        who: "Dumitru Cornilescu, ayudado por la princesa Ralu Callimachi",
        text: "Un joven diácono ortodoxo tradujo la Biblia a un rumano vivo y claro, que cualquiera puede entender. Al leerla, él mismo llegó a una fe viva en Cristo. La Sociedad Bíblica Británica y Extranjera la adoptó en 1924 y la difundió en cientos de miles de ejemplares. Fue obligado a salir del país en 1923, pero su traducción siguió siendo la Biblia que millones de rumanos tienen junto a la cama.",
      },
      b9: {
        year: "1914–1988",
        title: "Las Biblias sinodales",
        who: "La Iglesia ortodoxa rumana (traducciones de Gala Galaction, Vasile Radu y otros)",
        text: "Ediciones oficiales de la Iglesia ortodoxa, revisadas varias veces. La edición de 1988, impresa bajo los comunistas, llegó a pocas casas; en aquel tiempo era difícil encontrar Biblias.",
      },
    },
    influence: {
      i1: "El rumano escrito nació, en gran parte, de los libros de la Iglesia. Las Biblias y los libros litúrgicos eran lo primero que se leía en cada región, y así ayudaron a crear una lengua común para todos los rumanos, mucho antes de la Unión de 1918. Eminescu decía que la Iglesia y sus libros dieron a los rumanos la unidad de su lengua.",
      i2: "Quien quería leer la Escritura tenía que aprender a leer. Se abrieron escuelas junto a las iglesias, y en Blaj, en 1754, a las escuelas se las llamó «las fuentes de los dones». Durante mucho tiempo, los maestros de los pueblos fueron los cantores de la iglesia.",
      i3: "Cuando la gente sencilla pudo leer la Palabra por sí misma, nacieron los avivamientos: el Ejército del Señor, las iglesias evangélicas, los círculos de oración en los pueblos. La fe dejó de ser solo del sacerdote y pasó a ser de cada uno.",
      i4: "Por eso los comunistas temían a la Biblia más que a muchas armas: un pueblo que lee la Palabra sabe qué es la verdad y ya no se deja engañar fácilmente.",
    },
    bibleVerse: {
      text: "El principio de tus palabras alumbra; hace entender a los simples.",
      ref: "Salmos 119:130",
    },
    endVerses: {
      v1: {
        text: "Si a mí me han perseguido, también a vosotros perseguirán: si han guardado mi palabra, también guardarán la vuestra.",
        ref: "Juan 15:20",
      },
      v2: {
        text: "Bienaventurados los que padecen persecución por causa de la justicia: porque de ellos es el reino de los cielos.",
        ref: "Mateo 5:10",
      },
      v3: {
        text: "Estas cosas os he hablado, para que en mí tengáis paz. En el mundo tendréis aflicción: mas confiad, yo he vencido al mundo.",
        ref: "Juan 16:33",
      },
    },
  },
};
