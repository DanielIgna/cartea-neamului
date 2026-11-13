import type { EmailuriCatalog } from "./ro";

export const huEmailuri: EmailuriCatalog = {
  Emails: {
    "footer": "{operator}, CUI {cui}, Kolozsvár (Cluj-Napoca), Románia",
    "ackSubject": "{app}: megkaptuk az üzenetedet",
    "ackHello": "Szia!",
    "ackBody": "Megkaptuk az üzenetedet, hamarosan válaszolunk.",
    "ackIgnore": "Ha nem te írtál nekünk, nyugodtan hagyd figyelmen kívül ezt az e-mailt.",
    "paySubject": "{app}: a fizetésed megerősítve",
    "payHello": "Szia, {name}!",
    "payHelloNoName": "Szia!",
    "payBody": "Köszönjük! A fizetésedet megerősítettük.",
    "payWhat": "Amit kifizettél",
    "payAmount": "Összeg",
    "payDate": "Dátum",
    "payUntil": "Érvényes eddig",
    "payKinds": {
      "an": "Egy év a(z) {app} oldalon, {plan} csomag",
      "carte": "A család könyve (PDF)",
      "cadou": "Ajándék év, {plan} csomag",
      "pastrare": "A családfa megőrzése, egy év"
    },
    "payWithBook": "{what}, a család könyvével (PDF)",
    "payButton": "Tovább a fiókodhoz",
    "payThanks": "Köszönjük, hogy megőrzöd a családod történetét!"
  },
};
