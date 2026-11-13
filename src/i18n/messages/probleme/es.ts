import type { ProblemeCatalog } from "./ro";

/** Español. */
export const esProbleme: ProblemeCatalog = {
  "Problem": {
    "metaTitle": "Informar de un problema",
    "label": "Ayuda",
    "title": "¿Algo no funciona como debería?",
    "lead": "Cuéntanos brevemente qué ha pasado. Si puedes, añade una foto de la pantalla: nos muestra exactamente lo que ves. La página de la que vienes la anotamos nosotros.",
    "kindLabel": "¿De qué se trata?",
    "kinds": {
      "eroare": "Algo no funciona (un error)",
      "arbore": "Vínculos equivocados en el árbol (quién es padre, hermano o cónyuge de quién)",
      "idee": "Una idea o un deseo",
      "altceva": "Otra cosa"
    },
    "message": "Cuéntanos qué ha pasado",
    "messagePlaceholder": "Por ejemplo: «Pulsé Guardar en el abuelo Juan y no pasó nada.» o «María aparece como hermana, pero es prima.»",
    "images": "Fotos de la pantalla (hasta 3, no es obligatorio)",
    "imagesHelp": "En el teléfono, haz una captura de pantalla (normalmente pulsando a la vez el botón de encendido y el de bajar volumen) y elígela aquí. En el ordenador: Windows + Mayús + S; en Mac, Cmd + Mayús + 4.",
    "addImages": "Elegir fotos",
    "remove": "Quitar",
    "pageNote": "Vienes de la página: {page}",
    "privacyNote": "Solo nosotros vemos tu mensaje y tus fotos, para arreglar el problema. Si aparecen datos de la familia, no los usamos para nada más. Más información en la <privacy>Política de privacidad</privacy>.",
    "send": "Enviar",
    "sending": "Enviando…",
    "sent": "¡Gracias! Hemos recibido tu mensaje y lo miraremos lo antes posible. Nuestra respuesta aparecerá abajo, en esta página.",
    "another": "Escribir otra cosa",
    "errors": {
      "message": "Escribe unas palabras sobre el problema.",
      "tooLong": "El mensaje es demasiado largo. Escríbelo un poco más corto.",
      "tooMany": "Hoy has enviado muchos mensajes. Inténtalo mañana o escríbenos por WhatsApp.",
      "tooManyImages": "Puedes añadir 3 fotos como máximo.",
      "tooBig": "Las fotos son demasiado grandes. Elige menos.",
      "imageType": "Solo valen fotos (JPG, PNG o WebP).",
      "storageOff": "Ahora no se pueden subir fotos. Envía solo el texto.",
      "failed": "No se pudo enviar. Inténtalo de nuevo dentro de un rato.",
      "signIn": "Entra en tu cuenta para escribirnos desde aquí.",
      "demo": "Desde la cuenta de ejemplo no se puede enviar. Entra en tu cuenta."
    },
    "mineTitle": "Lo que nos has escrito",
    "mineEmpty": "Todavía no nos has escrito nada desde aquí.",
    "status": {
      "nou": "Recibido",
      "vazut": "Lo estamos mirando",
      "rezolvat": "Resuelto"
    },
    "sentOn": "Enviado el {date}",
    "ourReply": "Nuestra respuesta",
    "newReply": "nuevo",
    "noReply": "Todavía no te hemos respondido.",
    "mailSubject": "Hemos respondido al problema que nos enviaste",
    "mailBody": "¡Hola, {name}! Hemos respondido al mensaje que enviaste desde «Informar de un problema»:",
    "mailLink": "También lo ves aquí: {link}"
  }
};
