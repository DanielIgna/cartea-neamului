import type { PastrareCatalog } from "./ro";

export const frPastrare: PastrareCatalog = {
  "Keep": {
    "title": "Conservation de l’arbre",
    "text": "Avec la Conservation, {price} par an, toute la famille voit et écoute tout en ligne : les photos en grand, les voix, les documents et le film de la vie. Rien de nouveau ne s’ajoute ; pour cela, vous choisissez à nouveau une formule. Une fois par an, vous recevez par e-mail le lien vers l’archive complète.",
    "freeArch": "Sans Conservation, l’arbre (noms, dates, liens, textes) reste visible, et ce que vous avez téléversé vous-même ainsi que l’arbre entier (GEDCOM) se téléchargent toujours, gratuitement. Les photos originales restent en taille réelle encore {years, plural, one {un an} other {# ans}} après la fin de votre année, puis seulement en petit ; nous vous prévenons par e-mail 90, 30 et 7 jours avant.",
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
    "notice": "Quand votre année payée se termine, vous pouvez garder l’arbre en ligne pour seulement {price} par an. La famille peut toujours le voir et l’écouter ; seuls les nouveaux ajouts s’arrêtent. Sans la Conservation, rien n’est supprimé : l’arbre reste visible, les photos ajoutées par d’autres s’affichent en plus petit et vous pouvez télécharger vos propres fichiers à tout moment, gratuitement. Nous avons mis à jour les Conditions.",
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
  "ArchiveNote": {
    "liber": "Les photos originales et les documents numérisés restent en taille réelle jusqu’au {date}. Ensuite, ils ne restent qu’en petit ; les voix, les documents PDF et les textes restent tous. Vous pouvez les garder en taille réelle avec la Conservation ({keep} par an) ou avec le livre PDF ({book}), qui les garde dans l’archive scellée pendant {years, plural, one {un an} other {# ans}}. Vous pouvez toujours les télécharger ici, gratuitement.",
    "liberSealed": "Les originaux restent en taille réelle en ligne jusqu’au {date}. Ensuite, comme vous avez le livre PDF, ils entrent dans l’archive scellée, gardée jusqu’au {until}.",
    "sigilat": "Les originaux sont dans l’archive scellée jusqu’au {until}. Ils s’ouvrent de nouveau en taille réelle, tout de suite, quand vous renouvelez votre année ou prenez la Conservation. Vous pouvez toujours les télécharger, gratuitement.",
    "redus": "Les photos ne restent plus qu’en petit ; les voix, les documents PDF, les noms, les dates et les textes sont tous là.",
    "delete": "Vous voulez tout supprimer, archive comprise ? Cela se fait depuis",
    "banner": "Les photos originales de « {tree} » restent en taille réelle jusqu’au {date}.",
    "bookSeal": "Avec le livre PDF, les originaux de l’arbre sont gardés aussi après l’année payée, dans l’archive scellée, pendant {years, plural, one {un an} other {# ans}}.",
  },
  "ArchiveMail": {
    "arhivare": {
      "subject": "{app} : les originaux de « {tree} » entrent dans l’archive scellée le {date}",
      "body": "Bonjour {name},\n\nL’année payée pour l’arbre « {tree} » est terminée, et la période pendant laquelle les originaux sont restés en taille réelle en ligne arrive à son terme. Comme vous avez le livre de la famille en PDF, le {date} (dans {days} jours) les photos, les voix et les documents entrent dans l’archive scellée : compressés et gardés {years, plural, one {un an} other {# ans}} à partir de l’achat du livre.\n\nEn ligne restent l’arbre (noms, dates, liens, textes) et les photos en petit. Quand vous renouvelez votre année ou prenez la Conservation ({keep} par an), tout s’ouvre de nouveau en taille réelle, tout de suite.\n\nVous pouvez toujours télécharger, gratuitement, tout ce qui est à vous : {link}\nSi vous voulez tout supprimer, cela se fait depuis « Mes données ».\n\nVous n’avez rien d’autre à faire.",
    },
    "reducere": {
      "subject": "{app} : les photos de « {tree} » ne resteront qu’en petit à partir du {date}",
      "body": "Bonjour {name},\n\nLe {date} (dans {days} jours) se termine la période pendant laquelle nous gardons en taille réelle les photos originales et les documents numérisés de l’arbre « {tree} ». Après ce jour, ils ne restent qu’en petit. Les voix, les documents PDF, les noms, les dates et les textes restent tous.\n\nPour garder les originaux, vous avez trois possibilités :\n• les télécharger maintenant, gratuitement : {link}\n• prendre la Conservation, {keep} par an : la famille voit et écoute tout en ligne ;\n• acheter le livre de la famille en PDF, {book} : les originaux entrent dans l’archive scellée, gardés {years, plural, one {un an} other {# ans}}.\n\nSi vous voulez tout supprimer, cela se fait depuis « Mes données ».",
    },
  },
  "KeepMail": {
    "subject": "{app} : l’archive de votre famille",
    "body": "Bonjour {name} !\n\nLa Conservation de votre arbre dans {app} est active jusqu’au {date} : la famille voit et écoute tout en ligne.\n\nL’archive complète (arbres en GEDCOM, photos, voix et documents) se trouve ici : {link}\nNous vous conseillons de la télécharger une fois par an et d’en garder une copie chez vous.\n\nMerci de préserver l’histoire de votre famille !"
  }
};
