import type { EmailuriCatalog } from "./ro";

export const enGBEmailuri: EmailuriCatalog = {
  Emails: {
    "footer": "{operator}, tax ID (CUI) {cui}, Cluj-Napoca, Romania",
    "ackSubject": "{app}: we have received your message",
    "ackHello": "Hello!",
    "ackBody": "We have received your message and will get back to you soon.",
    "ackIgnore": "If you did not write to us, you can ignore this email.",
    "paySubject": "{app}: your payment is confirmed",
    "payHello": "Hello {name},",
    "payHelloNoName": "Hello,",
    "payBody": "Thank you! Your payment has been confirmed.",
    "payWhat": "What you paid for",
    "payAmount": "Amount",
    "payDate": "Date",
    "payUntil": "Valid until",
    "payKinds": {
      "an": "One year of {app}, {plan} plan",
      "carte": "The family book (PDF)",
      "cadou": "A gifted year, {plan} plan",
      "pastrare": "Tree Keeping, one year"
    },
    "payWithBook": "{what}, with the family book (PDF)",
    "payButton": "Go to your account",
    "payThanks": "Thank you for keeping your family’s story!"
  },
};
