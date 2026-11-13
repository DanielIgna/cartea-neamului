/**
 * Emailurile trimise de site prin Resend (Daniel, 2026-11-13): notificarea către noi pentru Contact și „Vreau un test ADN”,
 * confirmarea scurtă către cel care ne-a scris și confirmarea plății. Notificările către noi se scriu mereu în română
 * (adminMailRo, mai jos); cele către oameni, în limba lor. Aceleași reguli ca în ../ro.ts.
 */
import type { Widen } from "../types";

export const roEmailuri = {
  Emails: {
    footer: "{operator}, CUI {cui}, Cluj-Napoca",
    ackSubject: "{app}: am primit mesajul tău",
    ackHello: "Bună!",
    ackBody: "Am primit mesajul tău, revenim în curând.",
    ackIgnore: "Dacă nu tu ne-ai scris, poți ignora acest email.",
    paySubject: "{app}: plata a fost confirmată",
    payHello: "Bună, {name}!",
    payHelloNoName: "Bună!",
    payBody: "Îți mulțumim! Plata ta a fost confirmată.",
    payWhat: "Ce ai plătit",
    payAmount: "Suma",
    payDate: "Data",
    payUntil: "Valabil până la",
    payKinds: {
      an: "Un an în {app}, planul {plan}",
      carte: "Cartea neamului (PDF)",
      cadou: "Un an dăruit, planul {plan}",
      pastrare: "Păstrarea arborelui, un an",
    },
    payWithBook: "{what}, cu cartea neamului (PDF)",
    payButton: "Mergi la contul tău",
    payThanks: "Mulțumim că păstrezi povestea familiei!",
  },
};

/**
 * Notificările către noi (Contact, ADN): mereu în română, de aceea stau în afara cataloagelor de limbi.
 * Parametrii ({name}, {email}) se pun în src/lib/emailuri.ts.
 */
export const adminMailRo = {
  contactSubject: "Mesaj nou din formularul de contact: {name}",
  contactIntro: "Cineva ți-a scris din formularul de pe pagina Contact.",
  dnaSubject: "Cerere nouă „Vreau un test ADN”: {name}",
  dnaIntro: "A venit o cerere nouă de pe pagina Resurse de genealogie. E păstrată și în Admin → ADN.",
  name: "Nume",
  email: "Email",
  phone: "Telefon",
  city: "Oraș",
  message: "Mesaj",
  page: "Pagina",
  language: "Limba",
  replyHint: "Răspunde direct la acest email: răspunsul ajunge la {email}.",
} as const;

export type EmailuriCatalog = Widen<typeof roEmailuri>;
