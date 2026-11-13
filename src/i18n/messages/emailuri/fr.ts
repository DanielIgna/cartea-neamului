import type { EmailuriCatalog } from "./ro";

export const frEmailuri: EmailuriCatalog = {
  Emails: {
    "footer": "{operator}, CUI {cui}, Cluj-Napoca, Roumanie",
    "ackSubject": "{app} : nous avons bien reçu votre message",
    "ackHello": "Bonjour,",
    "ackBody": "Nous avons bien reçu votre message et vous répondrons bientôt.",
    "ackIgnore": "Si vous ne nous avez pas écrit, vous pouvez ignorer cet e-mail.",
    "paySubject": "{app} : votre paiement est confirmé",
    "payHello": "Bonjour {name},",
    "payHelloNoName": "Bonjour,",
    "payBody": "Merci ! Votre paiement a été confirmé.",
    "payWhat": "Ce que vous avez payé",
    "payAmount": "Montant",
    "payDate": "Date",
    "payUntil": "Valable jusqu’au",
    "payKinds": {
      "an": "Un an sur {app}, formule {plan}",
      "carte": "Le livre de la famille (PDF)",
      "cadou": "Une année offerte, formule {plan}",
      "pastrare": "Conservation de l’arbre, un an"
    },
    "payWithBook": "{what}, avec le livre de la famille (PDF)",
    "payButton": "Aller à votre compte",
    "payThanks": "Merci de préserver l’histoire de votre famille !"
  },
};
