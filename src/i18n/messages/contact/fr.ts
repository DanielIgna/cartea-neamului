import type { ContactCatalog } from "./ro";

/** Français (vous). Espace insécable avant : ; ! ? et à l’intérieur des « ». */
export const frContact: ContactCatalog = {
  "ContactPage": {
    "seller": "Le Livre de la Famille est proposé par {name}, CUI {cui}, n° au registre du commerce {regCom}, sis {address}.",
    "printRequest": "Bonjour ! Je voudrais un devis pour le livre de la famille imprimé : {pages} pages, format {format}. Couverture rigide ou souple : … Nombre d’exemplaires : … Téléphone : …",
    "metaTitle": "Contact",
    "metaDescription": "Écrivez-nous sur WhatsApp ou envoyez-nous un message à propos du Livre de la Famille.",
    "menu": "Contact",
    "label": "Contact",
    "title": "Vous voulez nous dire quelque chose ?",
    "lead": "Une question, une idée ou quelque chose qui ne marche pas comme il faut : écrivez-nous sur WhatsApp ou envoyez-nous un message d’ici. Nous répondons dès que possible.",
    "waTitle": "Sur WhatsApp",
    "waText": "Le plus rapide : ouvrez la conversation et écrivez-nous directement.",
    "waCta": "Écrivez-nous sur WhatsApp",
    "facebook": "Retrouvez-nous aussi sur <link>Facebook</link>, où nous publions les nouveautés.",
    "waGreeting": "Bonjour ! Je vous écris depuis le Livre de la Famille.",
    "waFloat": "Écrivez-nous sur WhatsApp",
    "mailTitle": "Par e-mail",
    "mailText": "Laissez-nous votre adresse e-mail pour que nous puissions vous répondre."
  },
  "Contact": {
    "name": "Votre nom",
    "email": "Votre adresse e-mail",
    "message": "Message",
    "messagePlaceholder": "Écrivez ici ce que vous voulez nous dire…",
    "privacyNote": "Votre message nous parvient par e-mail via FormSubmit (États-Unis). Si vous ne le souhaitez pas, écrivez-nous sur WhatsApp ou à l’adresse indiquée dans la <privacy>Politique de confidentialité</privacy>.",
    "send": "Envoyer le message",
    "sending": "Envoi…",
    "sent": "Merci ! Votre message est parti et nous vous répondrons par e-mail.",
    "another": "Envoyer un autre message",
    "errors": {
      "name": "Écrivez votre nom, s’il vous plaît.",
      "email": "Cette adresse e-mail ne semble pas correcte. Vérifiez-la, s’il vous plaît.",
      "message": "Écrivez quelques mots dans le message.",
      "tooMany": "Vous avez déjà envoyé plusieurs messages. Réessayez dans une heure ou écrivez-nous sur WhatsApp.",
      "failed": "Le message n’a pas pu partir. Réessayez dans un instant ou écrivez-nous sur WhatsApp."
    }
  }
};
