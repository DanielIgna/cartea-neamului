import type { ActivareCatalog } from "./ro";

export const frActivare: ActivareCatalog = {
  QuickStart: {
    title: "Ajoutez-vous, puis vos parents et grands-parents",
    lead: "Cela prend une minute. Laissez vide ce que vous ne savez pas : vous l’ajouterez plus tard, ou vos proches vous aideront.",
    progress: "Étape {n} sur {total}",
    fatherSide: "Grands-parents côté père",
    motherSide: "Grands-parents côté mère",
    grandfatherGiven: "Prénom du grand-père",
    grandmotherGiven: "Prénom de la grand-mère",
    grandmotherMaiden: "Nom de jeune fille de la grand-mère",
    dontKnow: "Je ne sais pas, suivant",
    finish: "C’est fait, créer l’arbre",
    later: "Les dates exactes, les photos et les lieux s’ajoutent ensuite, depuis l’arbre.",
    otherWays: "Vous avez reçu un lien d’un proche ou vous avez déjà un fichier GEDCOM ? Les options sont plus bas.",
  },
  BranchInvite: {
    titleM: "Invitez {name} à compléter sa branche",
    titleF: "Invitez {name} à compléter sa branche",
    text: "Votre arbre compte déjà {count} personnes. {name} connaît des noms et des histoires que personne d’autre ne connaît : envoyez le lien sur WhatsApp, par e-mail ou copiez-le.",
    later: "Plus tard",
    viewOnly: "Pendant les jours gratuits, le lien permet de voir l’arbre ; pour que {name} puisse aussi écrire, il faut une année payée.",
  },
  ActivationMail: {
    subject: "Votre arbre vous attend sur {app}",
    body: "Bonjour {name} !\n\nVous avez créé un compte sur {app}, mais votre arbre n’a pas encore commencé. La première étape est courte : qui vous êtes, puis vos parents et grands-parents, trois lignes par écran. Laissez vide ce que vous ne savez pas.\n\nEnsuite, vous pourrez inviter vos proches à compléter chacun sa branche.",
    button: "Commencer l’arbre",
    why: "Vous recevez cet e-mail une seule fois, car vous avez créé un compte sur {app}.",
    unsubscribe: "Ne plus recevoir d’e-mails sur le compte",
  },
};
