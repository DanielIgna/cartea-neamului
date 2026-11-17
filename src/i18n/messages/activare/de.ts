import type { ActivareCatalog } from "./ro";

export const deActivare: ActivareCatalog = {
  QuickStart: {
    title: "Trag dich ein, dann deine Eltern und Großeltern",
    lead: "Das dauert eine Minute. Was du nicht weißt, lässt du leer: später ergänzen oder die Verwandten helfen lassen.",
    progress: "Schritt {n} von {total}",
    fatherSide: "Großeltern väterlicherseits",
    motherSide: "Großeltern mütterlicherseits",
    grandfatherGiven: "Vorname des Großvaters",
    grandmotherGiven: "Vorname der Großmutter",
    grandmotherMaiden: "Geburtsname der Großmutter",
    dontKnow: "Weiß ich nicht, weiter",
    finish: "Fertig, Stammbaum anlegen",
    later: "Genaue Daten, Fotos und Orte ergänzt du danach im Stammbaum.",
    otherWays: "Einen Link von Verwandten bekommen oder schon eine GEDCOM-Datei? Die Möglichkeiten findest du weiter unten.",
  },
  BranchInvite: {
    titleM: "Lade {name} ein, seinen Zweig zu ergänzen",
    titleF: "Lade {name} ein, ihren Zweig zu ergänzen",
    text: "Dein Stammbaum hat schon {count} Personen. {name} kennt Namen und Geschichten, die sonst niemand kennt: schick den Link per WhatsApp, per E-Mail oder kopier ihn.",
    later: "Später",
    viewOnly: "In den Gratistagen zeigt der Link den Stammbaum; damit {name} auch schreiben kann, braucht es ein bezahltes Jahr.",
  },
  ActivationMail: {
    subject: "Dein Stammbaum wartet auf dich bei {app}",
    body: "Hallo {name}!\n\nDu hast ein Konto bei {app} angelegt, aber dein Stammbaum hat noch nicht begonnen. Der erste Schritt ist kurz: wer du bist, dann deine Eltern und Großeltern, drei Zeilen pro Bildschirm. Was du nicht weißt, lässt du leer.\n\nDanach kannst du deine Verwandten einladen, jeweils ihren Zweig zu ergänzen.",
    button: "Stammbaum beginnen",
    why: "Du bekommst diese E-Mail nur einmal, weil du ein Konto bei {app} angelegt hast.",
    unsubscribe: "Keine E-Mails mehr zum Konto",
  },
};
