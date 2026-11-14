/**
 * Creșterea fără reclame (Daniel, 14 noiembrie 2026; src/lib/crestere.ts):
 * - `News`: întrebarea „Vrei sfaturi pe email?”, comutatorul din „Datele mele” și pagina de dezabonare (merge și în browser);
 * - `NewsMail`: emailurile de bun venit, trimise doar cu acordul omului (doar pe server);
 * - `Share`: butoanele de trimis invitația pe WhatsApp, email sau „Trimite” de pe telefon (în browser).
 * Ton simplu, cald, fără limbaj religios.
 */
import type { Widen } from "../types";

export const roCrestere = {
  News: {
    label: "Sfaturi pe email",
    lead: "Vrei sfaturi pe email?",
    text: "În primele trei săptămâni îți putem trimite 4–5 emailuri scurte, cu pași simpli: cum începi arborele, cum îți chemi rudele, cum înregistrezi glasul bunicilor. Te dezabonezi oricând, dintr-un clic.",
    yes: "Da, trimite-mi",
    no: "Nu, mulțumesc",
    more: "Cum folosim emailul",
    given: "Primești sfaturi pe email din {date}.",
    refused: "Ai spus „Nu” la sfaturile pe email pe {date}.",
    none: "Nu primești sfaturi pe email.",
    start: "Vreau sfaturi pe email",
    stop: "Nu mai vreau sfaturi pe email",
    pending: "Se schimbă…",
    started: "Gata, le primești. Mulțumim!",
    stopped: "Gata, nu mai primești sfaturi pe email.",
    demo: "Contul de demonstrație nu primește emailuri.",
    unsubTitle: "Dezabonare",
    unsubAsk: "Nu mai vrei sfaturile pe email de la {app}?",
    unsubConfirm: "Da, dezabonează-mă",
    unsubDone: "Gata, nu mai primești sfaturi pe email. Emailurile despre cont (parola, plățile) pleacă în continuare.",
    unsubBad: "Legătura nu mai e bună. Te poți dezabona și din „Datele mele”.",
    unsubHome: "Înapoi la prima pagină",
  },
  NewsMail: {
    why: "Primești acest email pentru că ai spus „Da” la sfaturile pe email din {app}.",
    unsubscribe: "Dezabonează-te dintr-un clic",
    e1Subject: "Primii 3 pași în arborele tău",
    e1Body: "Bună, {name}! Mulțumim că ai început {app}.\n\nCel mai ușor începi așa: întâi tu, apoi părinții, apoi bunicii din ambele părți. Dacă nu știi o dată exactă, scrie „cca. 1940” și mergi mai departe.\n\nUn sfat: o poză veche pusă pe fișa bunicilor face arborele viu dintr-odată.",
    e1Button: "Deschide arborele",
    e2Subject: "Cine din familie știe cele mai multe?",
    e2Body: "Bună, {name}! În fiecare familie e cineva care ține minte tot: o mătușă, un unchi, bunica.\n\nTrimite-le invitația pe WhatsApp, din pagina arborelui. Văd arborele și adaugă ce știu ei, cu poze și povești. Cu cât sunteți mai mulți, cu atât crește mai repede.",
    e2Button: "Invită o rudă",
    e3Subject: "Glasul bunicilor: 5 întrebări care deschid amintiri",
    e3Body: "Bună, {name}! Glasul unui bunic e una dintre cele mai frumoase amintiri pe care le poți păstra.\n\nÎntreabă-i: Cum era casa în care ai crescut? Cum v-ați cunoscut? Ce lucrau părinții tăi? Ce zi din copilărie îți amintești cel mai bine? Ce le-ai spune nepoților?\n\nÎnregistrezi direct din telefon, pe fișa lor din arbore.",
    e3Button: "Mai multe întrebări",
    e4Subject: "Arborele tău, ca o carte",
    e4Body: "Bună, {name}! Tot ce adunați în arbore (oameni, poze, povești) se poate face carte: o descarci ca PDF sau o tipărești pentru toată familia.\n\nCa să păstrezi arborele deschis pentru scris și după zilele gratuite, alegi un plan de la {price} pe an. Nu se iau bani automat și nu se șterge nimic.",
    e4Button: "Vezi planurile",
    e5Subject: "Ce ai mai aflat despre familia ta?",
    e5Body: "Bună, {name}! Au trecut trei săptămâni de când ai început. Fiecare nume, dată sau poză adăugată acum e o bucată de istorie pe care copiii voștri n-o vor mai pierde.\n\nDacă ai aflat ceva nou de la rude, pune-l în arbore cât e proaspăt.",
    e5GiftBody: "Bună, {name}! Au trecut trei săptămâni de când ai început. Se apropie sărbătorile: un an în {app} poate fi un dar frumos pentru părinți sau bunici, cu un card de pus sub brad.\n\nIar ce aflați de la rude la masa de sărbători, puneți în arbore cât e proaspăt.",
    e5Button: "Deschide arborele",
    e5GiftButton: "Vezi darul de sărbători",
  },
  Share: {
    whatsapp: "Trimite pe WhatsApp",
    email: "Trimite pe email",
    share: "Trimite…",
    message: "Ți-am făcut loc în arborele familiei noastre, pe {app}. Intră și adaugă ce știi tu: nume, date, poze vechi, povești. {link}",
    subject: "Te aștept în arborele familiei",
  },
} as const;
export type CrestereCatalog = Widen<typeof roCrestere>;
