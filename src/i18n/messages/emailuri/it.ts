import type { EmailuriCatalog } from "./ro";

export const itEmailuri: EmailuriCatalog = {
  Emails: {
    "footer": "{operator}, CUI {cui}, Cluj-Napoca, Romania",
    "ackSubject": "{app}: abbiamo ricevuto il tuo messaggio",
    "ackHello": "Ciao!",
    "ackBody": "Abbiamo ricevuto il tuo messaggio e ti risponderemo presto.",
    "ackIgnore": "Se non ci hai scritto tu, puoi ignorare questa e-mail.",
    "paySubject": "{app}: il tuo pagamento è confermato",
    "payHello": "Ciao {name},",
    "payHelloNoName": "Ciao,",
    "payBody": "Grazie! Il tuo pagamento è stato confermato.",
    "payWhat": "Cosa hai pagato",
    "payAmount": "Importo",
    "payDate": "Data",
    "payUntil": "Valido fino al",
    "payKinds": {
      "an": "Un anno di {app}, piano {plan}",
      "carte": "Il libro della famiglia (PDF)",
      "cadou": "Un anno regalato, piano {plan}",
      "pastrare": "Conservazione dell’albero, un anno"
    },
    "payWithBook": "{what}, con il libro della famiglia (PDF)",
    "payButton": "Vai al tuo account",
    "payThanks": "Grazie per custodire la storia della tua famiglia!"
  },
};
