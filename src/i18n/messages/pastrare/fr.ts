import type { PastrareCatalog } from "./ro";

export const frPastrare: PastrareCatalog = {
  "Keep": {
    "title": "Conservation de l’arbre",
    "text": "Avec la Conservation, {price} par an, toute la famille voit et écoute tout en ligne : les photos en grand, les voix, les documents et le film de la vie. Rien de nouveau ne s’ajoute ; pour cela, vous choisissez à nouveau une formule. Une fois par an, vous recevez par e-mail le lien vers l’archive complète.",
    "free": "Sans Conservation, rien n’est supprimé : l’arbre (noms, dates, liens, textes) reste visible, les photos ajoutées par d’autres ne s’affichent qu’en petit, et ce que vous avez ajouté vous-même ainsi que l’arbre entier (GEDCOM) se téléchargent toujours gratuitement.",
    "keptUntil": "Vous avez la Conservation jusqu’au {date} : la famille voit et écoute tout. Pour ajouter à nouveau, choisissez une formule.",
    "extend": "Une année de plus s’ajoute après le {date}.",
    "bundleTitle": "Conservation + le livre de la famille en PDF :",
    "bundleText": "un an de Conservation et le livre PDF de l’arbre choisi, {price} au lieu de {separate}.",
    "bundleTree": "Arbre du livre",
    "name": "Conservation de l’arbre, un an",
    "bundleName": "Conservation de l’arbre + le livre de la famille (PDF)",
    "thanks": "Merci ! La Conservation est active pour un an.",
    "archiveLink": "Mon archive",
    "banner": "Vous avez la Conservation jusqu’au {date} : la famille voit et écoute tout, sans nouveaux ajouts.",
    "bannerOffer": "Les photos ajoutées par d’autres ne s’affichent plus qu’en petit. Pour que la famille les voie en grand et écoute les voix, la Conservation coûte {price} par an.",
    "mailNote": "\n\nSi vous ne voulez plus rien ajouter mais souhaitez que la famille continue à tout voir (photos en grand, voix), il existe la Conservation : {price} par an.",
    "noticeLead": "Nouveau : la Conservation.",
    "notice": "Après votre année payée, pour {price} par an, la famille voit et écoute tout en ligne, sans nouveaux ajouts. Sans elle, rien n’est supprimé : l’arbre reste visible, seules les photos ajoutées par d’autres s’affichent en petit, et ce que vous avez ajouté se télécharge toujours gratuitement. Nous avons mis à jour les Conditions.",
    "noticeMore": "Voir la Conservation",
    "noticeOk": "J’ai compris"
  },
  "Archive": {
    "title": "Mon archive",
    "intro": "Tout ce que vous pouvez emporter du Livre de la Famille : chaque arbre en fichier GEDCOM (tout logiciel de généalogie l’ouvre), le livre de la famille et les fichiers. Ce que vous avez ajouté vous-même se télécharge toujours en entier, gratuitement.",
    "limited": "Dans les arbres sans année payée ni Conservation, les photos ajoutées par d’autres ne s’affichent qu’en petit.",
    "gedcom": "Télécharger l’arbre (GEDCOM)",
    "book": "Le livre de la famille",
    "files": "Fichiers : {n}",
    "none": "Aucun fichier ici pour l’instant.",
    "mine": "ajouté par vous",
    "kinds": {
      "photo": "Photo",
      "audio": "Voix",
      "act": "Acte",
      "letter": "Lettre",
      "other": "Document"
    },
    "memories": "Les photos et les voix du Coffre à souvenirs s’ouvrent depuis le coffre, selon qui a le droit de les voir.",
    "myData": "Le reste de vos données (compte, souvenirs, messages) se télécharge depuis",
    "myDataLink": "Mes données",
    "noTrees": "Vous n’êtes encore dans aucun arbre.",
    "owner": "votre arbre"
  },
  "KeepMail": {
    "subject": "{app} : l’archive de votre famille",
    "body": "Bonjour {name} !\n\nLa Conservation de votre arbre dans {app} est active jusqu’au {date} : la famille voit et écoute tout en ligne.\n\nL’archive complète (arbres en GEDCOM, photos, voix et documents) se trouve ici : {link}\nNous vous conseillons de la télécharger une fois par an et d’en garder une copie chez vous.\n\nMerci de préserver l’histoire de votre famille !"
  }
};
