import type { ActivareCatalog } from "./ro";

export const esActivare: ActivareCatalog = {
  QuickStart: {
    title: "Añádete a ti, luego a tus padres y abuelos",
    lead: "Lleva un minuto. Deja en blanco lo que no sepas: lo añades más tarde o te ayudan tus familiares.",
    progress: "Paso {n} de {total}",
    fatherSide: "Abuelos por parte de padre",
    motherSide: "Abuelos por parte de madre",
    grandfatherGiven: "Nombre del abuelo",
    grandmotherGiven: "Nombre de la abuela",
    grandmotherMaiden: "Apellido de soltera de la abuela",
    dontKnow: "No lo sé, siguiente",
    finish: "Listo, crea el árbol",
    later: "Las fechas exactas, las fotos y los lugares los añades después, desde el árbol.",
    otherWays: "¿Te llegó un enlace de un familiar o ya tienes un archivo GEDCOM? Las opciones están más abajo.",
  },
  BranchInvite: {
    titleM: "Invita a {name} a completar su rama",
    titleF: "Invita a {name} a completar su rama",
    text: "Tu árbol ya tiene {count} personas. {name} sabe nombres e historias que nadie más sabe: envíale el enlace por WhatsApp, por correo o cópialo.",
    later: "Más tarde",
    viewOnly: "Durante los días gratuitos, el enlace le deja ver el árbol; para que {name} también escriba, hace falta un año pagado.",
  },
  ActivationMail: {
    subject: "Tu árbol te espera en {app}",
    body: "¡Hola, {name}!\n\nTe creaste una cuenta en {app}, pero tu árbol aún no ha empezado. El primer paso es corto: quién eres, luego tus padres y abuelos, tres líneas por pantalla. Deja en blanco lo que no sepas.\n\nA partir de ahí puedes invitar a tus familiares a completar cada uno su rama.",
    button: "Empieza el árbol",
    why: "Recibes este correo una sola vez, porque te creaste una cuenta en {app}.",
    unsubscribe: "No quiero más correos sobre la cuenta",
  },
};
