import type { PastrareCatalog } from "./ro";

export const esPastrare: PastrareCatalog = {
  "Keep": {
    "title": "Conservación del árbol",
    "text": "Con la Conservación, {price} al año, toda la familia ve y escucha todo en línea: las fotos en grande, las voces, los documentos y la película de la vida. No se añade nada nuevo; para eso eliges de nuevo un plan. Una vez al año recibes por correo el enlace al archivo completo.",
    "freeArch": "Sin Conservación, el árbol (nombres, fechas, vínculos, textos) sigue visible, y lo que subiste tú y el árbol entero (GEDCOM) los descargas siempre, gratis. Las fotos originales se quedan a tamaño completo {years, plural, one {un año} other {# años}} más tras el fin de tu año y después solo en pequeño; te avisamos por correo 90, 30 y 7 días antes.",
    "free": "Sin Conservación no se borra nada: el árbol (nombres, fechas, vínculos, textos) sigue visible, las fotos subidas por otros solo se ven en pequeño, y lo que subiste tú y el árbol entero (GEDCOM) los descargas siempre gratis.",
    "keptUntil": "Tienes la Conservación hasta el {date}: la familia ve y escucha todo. Para volver a añadir, elige un plan.",
    "extend": "Se añade otro año después del {date}.",
    "bundleTitle": "Conservación + el libro de la familia en PDF:",
    "bundleText": "un año de Conservación y el libro PDF del árbol elegido, {price} en lugar de {separate}.",
    "bundleTree": "Árbol del libro",
    "name": "Conservación del árbol, un año",
    "bundleName": "Conservación del árbol + el libro de la familia (PDF)",
    "thanks": "¡Gracias! La Conservación está activa durante un año.",
    "archiveLink": "Mi archivo",
    "banner": "Tienes la Conservación hasta el {date}: la familia ve y escucha todo, sin añadir nada nuevo.",
    "bannerOffer": "Las fotos subidas por otros ahora solo se ven en pequeño. Para que la familia las vea en grande y escuche las voces, la Conservación cuesta {price} al año.",
    "mailNote": "\n\nSi ya no quieres añadir nada pero quieres que la familia siga viéndolo todo (fotos en grande, voces), existe la Conservación: {price} al año.",
    "noticeLead": "Novedad: la Conservación.",
    "notice": "Cuando termina tu año pagado, puedes mantener el árbol en línea por solo {price} al año. La familia puede seguir viéndolo y escuchándolo; solo deja de añadirse contenido nuevo. Sin la Conservación no se borra nada: el árbol sigue visible, las fotos subidas por otros se ven más pequeñas y tus propios archivos los descargas cuando quieras, gratis. Hemos actualizado los Términos.",
    "noticeMore": "Ver la Conservación",
    "noticeOk": "Entendido"
  },
  "Archive": {
    "title": "Mi archivo",
    "intro": "Todo lo que puedes llevarte de El Libro de la Familia: cada árbol como archivo GEDCOM (lo abre cualquier programa de genealogía), el libro de la familia y los archivos. Lo que subiste tú se descarga siempre completo y gratis.",
    "limited": "En los árboles sin año pagado ni Conservación, las fotos subidas por otros solo se ven en pequeño.",
    "gedcom": "Descargar el árbol (GEDCOM)",
    "book": "El libro de la familia",
    "files": "Archivos: {n}",
    "none": "Aún no hay archivos aquí.",
    "mine": "subido por ti",
    "kinds": {
      "photo": "Foto",
      "audio": "Voz",
      "act": "Acta",
      "letter": "Carta",
      "other": "Documento"
    },
    "memories": "Las fotos y voces del Baúl de recuerdos se abren desde el baúl, según quién puede verlas.",
    "myData": "El resto de tus datos (cuenta, recuerdos, mensajes) los descargas desde",
    "myDataLink": "Mis datos",
    "noTrees": "Aún no estás en ningún árbol.",
    "owner": "tu árbol"
  },
  "ArchiveNote": {
    "liber": "Las fotos originales y los documentos escaneados se quedan a tamaño completo hasta el {date}. Después solo se quedan en pequeño; las voces, los documentos PDF y los textos se quedan todos. Puedes conservarlos a tamaño completo con la Conservación ({keep} al año) o con el libro PDF ({book}), que los guarda en el archivo sellado durante {years, plural, one {un año} other {# años}}. Siempre puedes descargarlos aquí, gratis.",
    "liberSealed": "Los originales se quedan a tamaño completo en línea hasta el {date}. Después, como tenéis el libro PDF, entran en el archivo sellado, guardado hasta el {until}.",
    "sigilat": "Los originales están en el archivo sellado hasta el {until}. Se abren de nuevo a tamaño completo, al momento, cuando renuevas tu año o tomas la Conservación. Siempre puedes descargarlos, gratis.",
    "redus": "Las fotos se han quedado solo en pequeño; las voces, los documentos PDF, los nombres, las fechas y los textos están todos aquí.",
    "delete": "¿Quieres borrarlo todo, archivo incluido? Lo haces desde",
    "banner": "Las fotos originales de «{tree}» se quedan a tamaño completo hasta el {date}.",
    "bookSeal": "Con el libro PDF, los originales del árbol se guardan también después del año pagado, en el archivo sellado, durante {years, plural, one {un año} other {# años}}.",
  },
  "ArchiveMail": {
    "arhivare": {
      "subject": "{app}: los originales de «{tree}» entran en el archivo sellado el {date}",
      "body": "¡Hola, {name}!\n\nEl año pagado del árbol «{tree}» ha terminado, y el tiempo en que los originales han estado a tamaño completo en línea llega a su fin. Como tenéis el libro de la familia en PDF, el {date} (dentro de {days} días) las fotos, las voces y los documentos entran en el archivo sellado: comprimidos y guardados {years, plural, one {un año} other {# años}} desde la compra del libro.\n\nEn línea se quedan el árbol (nombres, fechas, vínculos, textos) y las fotos en pequeño. Cuando renuevas tu año o tomas la Conservación ({keep} al año), todo se abre de nuevo a tamaño completo, al momento.\n\nTodo lo que es tuyo lo puedes descargar siempre, gratis: {link}\nSi quieres borrarlo todo, lo haces desde «Mis datos».\n\nNo tienes que hacer nada más.",
    },
    "reducere": {
      "subject": "{app}: las fotos de «{tree}» se quedan solo en pequeño desde el {date}",
      "body": "¡Hola, {name}!\n\nEl {date} (dentro de {days} días) termina el tiempo en que guardamos a tamaño completo las fotos originales y los documentos escaneados del árbol «{tree}». Después de ese día solo se quedan en pequeño. Las voces, los documentos PDF, los nombres, las fechas y los textos se quedan todos.\n\nPara conservar los originales tienes tres caminos:\n• descargarlos ahora, gratis: {link}\n• tomar la Conservación, {keep} al año: la familia ve y escucha todo en línea;\n• comprar el libro de la familia en PDF, {book}: los originales entran en el archivo sellado, guardados {years, plural, one {un año} other {# años}}.\n\nSi quieres borrarlo todo, lo haces desde «Mis datos».",
    },
  },
  "KeepMail": {
    "subject": "{app}: el archivo de tu familia",
    "body": "¡Hola, {name}!\n\nLa Conservación de tu árbol en {app} está activa hasta el {date}: la familia ve y escucha todo en línea.\n\nEl archivo completo (árboles en GEDCOM, fotos, voces y documentos) está aquí: {link}\nTe recomendamos descargarlo una vez al año y guardar también una copia tú.\n\n¡Gracias por conservar la historia de tu familia!"
  }
};
