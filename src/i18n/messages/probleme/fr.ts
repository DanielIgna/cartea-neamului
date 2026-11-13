import type { ProblemeCatalog } from "./ro";

/** Français. */
export const frProbleme: ProblemeCatalog = {
  "Problem": {
    "metaTitle": "Signaler un problème",
    "label": "Aide",
    "title": "Quelque chose ne marche pas comme il faut ?",
    "lead": "Dites-nous en quelques mots ce qui s’est passé. Si vous pouvez, ajoutez une capture de l’écran : elle nous montre exactement ce que vous voyez. Nous notons nous-mêmes la page d’où vous venez.",
    "kindLabel": "De quoi s’agit-il ?",
    "kinds": {
      "eroare": "Quelque chose ne marche pas (une erreur)",
      "arbore": "Liens erronés dans l’arbre (qui est le parent, le frère ou le conjoint de qui)",
      "idee": "Une idée ou un souhait",
      "altceva": "Autre chose"
    },
    "message": "Dites-nous ce qui s’est passé",
    "messagePlaceholder": "Par exemple : « J’ai appuyé sur Enregistrer pour grand-père Jean et rien ne s’est passé. » ou « Marie apparaît comme sœur, mais c’est une cousine. »",
    "images": "Captures de l’écran (3 au maximum, facultatif)",
    "imagesHelp": "Sur un téléphone, faites une capture d’écran (en général en appuyant ensemble sur le bouton marche et le volume bas) puis choisissez-la ici. Sur un ordinateur : Windows + Maj + S, sur Mac Cmd + Maj + 4.",
    "addImages": "Choisir des images",
    "remove": "Retirer",
    "pageNote": "Vous venez de la page : {page}",
    "privacyNote": "Nous seuls voyons votre message et vos images, pour réparer le problème. S’ils montrent des données de la famille, nous ne les utilisons à rien d’autre. Plus de détails dans la <privacy>Politique de confidentialité</privacy>.",
    "send": "Envoyer",
    "sending": "Envoi…",
    "sent": "Merci ! Nous avons bien reçu votre message et nous le regardons dès que possible. Notre réponse apparaîtra ci-dessous, sur cette page.",
    "another": "Écrire autre chose",
    "errors": {
      "message": "Écrivez quelques mots sur le problème.",
      "tooLong": "Le message est trop long. Raccourcissez-le un peu.",
      "tooMany": "Vous avez envoyé beaucoup de messages aujourd’hui. Réessayez demain ou écrivez-nous sur WhatsApp.",
      "tooManyImages": "Vous pouvez ajouter 3 images au maximum.",
      "tooBig": "Les images sont trop lourdes. Choisissez-en moins.",
      "imageType": "Seules les images fonctionnent (JPG, PNG ou WebP).",
      "storageOff": "Les images ne peuvent pas être envoyées pour l’instant. Envoyez seulement le texte.",
      "failed": "L’envoi n’a pas marché. Réessayez dans un instant.",
      "signIn": "Connectez-vous pour nous écrire d’ici.",
      "demo": "Le compte d’exemple ne peut pas envoyer de message. Connectez-vous à votre compte."
    },
    "mineTitle": "Ce que vous nous avez écrit",
    "mineEmpty": "Vous ne nous avez encore rien écrit d’ici.",
    "status": {
      "nou": "Reçu",
      "vazut": "Nous regardons",
      "rezolvat": "Résolu"
    },
    "sentOn": "Envoyé le {date}",
    "ourReply": "Notre réponse",
    "newReply": "nouveau",
    "noReply": "Nous n’avons pas encore répondu.",
    "mailSubject": "Nous avons répondu au problème signalé",
    "mailBody": "Bonjour {name} ! Nous avons répondu au message envoyé depuis « Signaler un problème » :",
    "mailLink": "Vous le retrouvez aussi ici : {link}"
  }
};
