/**
 * Pagina /contact (`ContactPage`, pe server) și formularul „Trimite un mesaj” (`Contact`, în browser). Aceleași reguli ca în ../ro.ts.
 * Adresa de email nu apare în niciun text: formularul o știe doar pe server (src/lib/contact.ts).
 */
import type { Widen } from "../types";

export const roContact = {
  ContactPage: {
    seller: "Cartea Neamului e oferită de {name}, CUI {cui}, Nr. ORC {regCom}, cu sediul în {address}.",
    printRequest: "Bună ziua! Aș vrea o ofertă pentru Cartea neamului tipărită. Pagini: {pages}, format {format}. Copertă tare sau moale: … Câte exemplare: … Telefon: …",
    metaTitle: "Contact",
    metaDescription: "Scrie-ne pe WhatsApp sau trimite-ne un mesaj despre Cartea Neamului.",
    menu: "Contact",
    label: "Contact",
    title: "Vrei să ne spui ceva?",
    lead: "O întrebare, o idee sau ceva care nu merge cum trebuie: scrie-ne pe WhatsApp sau trimite-ne un mesaj de aici. Răspundem cât de repede putem.",
    waTitle: "Pe WhatsApp",
    waText: "Cel mai repede: deschide conversația și scrie-ne direct.",
    waCta: "Scrie-ne pe WhatsApp",
    waGreeting: "Bună ziua! Vă scriu de pe Cartea Neamului.",
    waFloat: "Scrie-ne pe WhatsApp",
    mailTitle: "Pe email",
    mailText: "Lasă-ne adresa ta de email, ca să-ți putem răspunde.",
  },
  Contact: {
    name: "Numele tău",
    email: "Adresa ta de email",
    message: "Mesajul",
    messagePlaceholder: "Scrie aici ce vrei să ne spui…",
    send: "Trimite mesajul",
    sending: "Se trimite…",
    sent: "Mulțumim! Mesajul a plecat și îți răspundem pe email.",
    another: "Mai trimite un mesaj",
    errors: {
      name: "Scrie-ți numele, te rog.",
      email: "Adresa de email nu pare bună. Verific-o, te rog.",
      message: "Scrie câteva cuvinte în mesaj.",
      tooMany: "Ai trimis deja mai multe mesaje. Încearcă din nou peste o oră sau scrie-ne pe WhatsApp.",
      failed: "Mesajul nu a plecat acum. Încearcă din nou peste puțin timp sau scrie-ne pe WhatsApp.",
    },
  },
} as const;

export type ContactCatalog = Widen<typeof roContact>;
