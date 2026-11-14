import type { EmailuriCatalog } from "./ro";

export const heEmailuri: EmailuriCatalog = {
  Emails: {
    footer: "{operator}, CUI {cui}, קלוז׳־נאפוקה, רומניה",
    ackSubject: "{app}: קיבלנו את ההודעה שלכם",
    ackHello: "שלום!",
    ackBody: "קיבלנו את ההודעה שלכם, נחזור אליכם בקרוב.",
    ackIgnore: "אם לא אתם כתבתם לנו, אפשר להתעלם מהאימייל הזה.",
    paySubject: "{app}: התשלום אושר",
    payHello: "שלום, {name}!",
    payHelloNoName: "שלום!",
    payBody: "תודה! התשלום שלכם אושר.",
    payWhat: "על מה שילמתם",
    payAmount: "הסכום",
    payDate: "התאריך",
    payUntil: "בתוקף עד",
    payKinds: {
      an: "שנה ב־{app}, תוכנית {plan}",
      carte: "ספר המשפחה (PDF)",
      cadou: "שנה במתנה, תוכנית {plan}",
      pastrare: "שמירת העץ, שנה אחת",
    },
    payWithBook: "{what}, עם ספר המשפחה (PDF)",
    payButton: "לחשבון שלכם",
    payThanks: "תודה ששומרים את סיפור המשפחה!",
  },
};
