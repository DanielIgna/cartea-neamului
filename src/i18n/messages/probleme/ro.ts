/**
 * „Raportează o problemă” (/problema): pagina (pe server) și formularul (în browser), același spațiu `Problem`.
 * Scris simplu, pentru oameni mai în vârstă: fără cuvinte tehnice („bug”, „screenshot”).
 */
import type { Widen } from "../types";

export const roProbleme = {
  Problem: {
    metaTitle: "Raportează o problemă",
    label: "Ajutor",
    title: "Ceva nu merge cum trebuie?",
    lead: "Spune-ne pe scurt ce s-a întâmplat. Dacă poți, pune și o poză a ecranului: ne arată exact ce vezi tu. Pagina din care ai venit o ținem minte noi, singuri.",
    kindLabel: "Despre ce e vorba?",
    kinds: {
      eroare: "Ceva nu merge (o eroare)",
      arbore: "Legături greșite în arbore (cine e părintele, fratele, soțul cui)",
      idee: "O idee sau o dorință",
      altceva: "Altceva",
    },
    message: "Spune-ne ce s-a întâmplat",
    messagePlaceholder: "De pildă: „Am apăsat Salvează la bunicul Ion și n-a mers.” sau „Maria apare ca soră, dar e verișoară.”",
    images: "Poze ale ecranului (cel mult 3, nu e obligatoriu)",
    imagesHelp: "Pe telefon, faci o poză a ecranului (de obicei ții apăsat butonul de pornire și butonul de volum în jos) și o alegi de aici. Pe calculator: Windows + Shift + S, pe Mac Cmd + Shift + 4.",
    addImages: "Alege poze",
    remove: "Scoate",
    pageNote: "Ai venit din pagina: {page}",
    privacyNote: "Mesajul și pozele le vedem doar noi, ca să reparăm problema. Dacă în poze apar date ale familiei, nu le folosim la nimic altceva. Mai multe în <privacy>Politica de confidențialitate</privacy>.",
    send: "Trimite",
    sending: "Se trimite…",
    sent: "Mulțumim! Am primit mesajul și ne uităm cât de repede putem. Răspunsul nostru apare mai jos, pe această pagină.",
    another: "Mai scrie ceva",
    errors: {
      message: "Scrie câteva cuvinte despre problemă.",
      tooLong: "Mesajul e prea lung. Scrie-l ceva mai pe scurt.",
      tooMany: "Ai trimis multe mesaje azi. Încearcă din nou mâine sau scrie-ne pe WhatsApp.",
      tooManyImages: "Poți pune cel mult 3 poze.",
      tooBig: "Pozele sunt prea mari. Alege mai puține.",
      imageType: "Merg doar poze (JPG, PNG sau WebP).",
      storageOff: "Pozele nu se pot încărca acum. Trimite doar textul.",
      failed: "N-a mers trimiterea. Încearcă din nou peste puțin.",
      signIn: "Intră în cont ca să ne scrii de aici.",
      demo: "Din contul de exemplu nu se poate trimite. Intră în contul tău.",
    },
    mineTitle: "Ce ne-ai scris",
    mineEmpty: "Încă nu ne-ai scris nimic de aici.",
    status: {
      nou: "Am primit-o",
      vazut: "Ne uităm la ea",
      rezolvat: "Rezolvată",
    },
    sentOn: "Trimisă pe {date}",
    ourReply: "Răspunsul nostru",
    newReply: "nou",
    noReply: "Încă nu ți-am răspuns.",
    mailSubject: "Ți-am răspuns la problema trimisă",
    mailBody: "Bună, {name}! Ți-am răspuns la mesajul trimis din „Raportează o problemă”:",
    mailLink: "Îl vezi și aici: {link}",
  },
};

export type ProblemeCatalog = Widen<typeof roProbleme>;
