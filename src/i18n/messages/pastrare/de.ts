import type { PastrareCatalog } from "./ro";

export const dePastrare: PastrareCatalog = {
  "Keep": {
    "title": "Aufbewahren des Stammbaums",
    "text": "Mit Aufbewahren, {price} pro Jahr, sieht und hört die ganze Familie alles online: die Fotos in voller Größe, die Stimmen, die Dokumente und den Lebensfilm. Neues kommt nicht hinzu; dafür wählst du wieder einen Tarif. Einmal im Jahr bekommst du per E-Mail den Link zum vollständigen Archiv.",
    "freeArch": "Ohne Aufbewahren bleibt der Stammbaum (Namen, Daten, Verbindungen, Texte) sichtbar, und was du selbst hochgeladen hast sowie den ganzen Stammbaum (GEDCOM) lädst du jederzeit kostenlos herunter. Die Originalfotos bleiben nach dem Ende deines Jahres noch {years, plural, one {ein Jahr} other {# Jahre}} in voller Größe, danach nur noch klein; wir schreiben dir 90, 30 und 7 Tage vorher eine E-Mail.",
    "free": "Ohne Aufbewahren wird nichts gelöscht: Der Stammbaum (Namen, Daten, Verbindungen, Texte) bleibt sichtbar, Fotos, die andere hochgeladen haben, erscheinen nur klein, und was du selbst hochgeladen hast sowie den ganzen Stammbaum (GEDCOM) lädst du jederzeit kostenlos herunter.",
    "keptUntil": "Du hast Aufbewahren bis {date}: Die Familie sieht und hört alles. Um wieder etwas hinzuzufügen, wähle einen Tarif.",
    "extend": "Ein weiteres Jahr kommt nach dem {date} hinzu.",
    "bundleTitle": "Aufbewahren + das Familienbuch als PDF:",
    "bundleText": "ein Jahr Aufbewahren und das PDF-Buch des gewählten Stammbaums, {price} statt {separate}.",
    "bundleTree": "Stammbaum für das Buch",
    "name": "Aufbewahren des Stammbaums, ein Jahr",
    "bundleName": "Aufbewahren des Stammbaums + das Familienbuch (PDF)",
    "thanks": "Danke! Aufbewahren ist für ein Jahr eingeschaltet.",
    "archiveLink": "Mein Archiv",
    "banner": "Du hast Aufbewahren bis {date}: Die Familie sieht und hört alles, ohne neue Einträge.",
    "bannerOffer": "Fotos, die andere hochgeladen haben, erscheinen jetzt nur klein. Damit die Familie sie groß sieht und die Stimmen hört, kostet Aufbewahren {price} pro Jahr.",
    "mailNote": "\n\nWenn du nichts mehr hinzufügen möchtest, aber die Familie weiterhin alles sehen soll (große Fotos, Stimmen), gibt es Aufbewahren: {price} pro Jahr.",
    "noticeLead": "Neu: Aufbewahren.",
    "notice": "Nach deinem bezahlten Jahr sieht und hört die Familie für {price} pro Jahr alles online, ohne neue Einträge. Ohne Aufbewahren wird nichts gelöscht: Der Stammbaum bleibt sichtbar, nur Fotos anderer erscheinen klein, und was du hochgeladen hast, lädst du jederzeit kostenlos herunter. Wir haben die Bedingungen aktualisiert.",
    "noticeMore": "Aufbewahren ansehen",
    "noticeOk": "Verstanden"
  },
  "Archive": {
    "title": "Mein Archiv",
    "intro": "Alles, was du aus Das Familienbuch mitnehmen kannst: jeden Stammbaum als GEDCOM-Datei (jedes Genealogieprogramm öffnet sie), das Familienbuch und die Dateien. Was du selbst hochgeladen hast, lädst du immer vollständig und kostenlos herunter.",
    "limited": "In Stammbäumen ohne bezahltes Jahr oder Aufbewahren erscheinen Fotos, die andere hochgeladen haben, nur klein.",
    "gedcom": "Stammbaum herunterladen (GEDCOM)",
    "book": "Das Familienbuch",
    "files": "Dateien: {n}",
    "none": "Hier gibt es noch keine Dateien.",
    "mine": "von dir hochgeladen",
    "kinds": {
      "photo": "Foto",
      "audio": "Stimme",
      "act": "Urkunde",
      "letter": "Brief",
      "other": "Dokument"
    },
    "memories": "Fotos und Stimmen aus der Erinnerungstruhe öffnest du in der Truhe, je nachdem, wer sie sehen darf.",
    "myData": "Deine übrigen Daten (Konto, Erinnerungen, Nachrichten) lädst du herunter unter",
    "myDataLink": "Meine Daten",
    "noTrees": "Du bist noch in keinem Stammbaum.",
    "owner": "dein Stammbaum"
  },
  "ArchiveNote": {
    "liber": "Die Originalfotos und gescannten Dokumente bleiben bis zum {date} in voller Größe. Danach bleiben sie nur noch klein; Stimmen, PDF-Dokumente und Texte bleiben alle. Du behältst sie in voller Größe mit Aufbewahren ({keep} pro Jahr) oder mit dem PDF-Buch ({book}), das sie {years, plural, one {ein Jahr} other {# Jahre}} lang im versiegelten Archiv aufbewahrt. Du kannst sie hier jederzeit kostenlos herunterladen.",
    "liberSealed": "Die Originale bleiben bis zum {date} in voller Größe online. Danach kommen sie, weil ihr das PDF-Buch habt, ins versiegelte Archiv, aufbewahrt bis zum {until}.",
    "sigilat": "Die Originale liegen bis zum {until} im versiegelten Archiv. Sie öffnen sich sofort wieder in voller Größe, wenn du dein Jahr verlängerst oder Aufbewahren nimmst. Du kannst sie jederzeit kostenlos herunterladen.",
    "redus": "Die Fotos sind jetzt nur noch klein; Stimmen, PDF-Dokumente, Namen, Daten und Texte sind alle da.",
    "delete": "Willst du alles löschen, mit dem Archiv? Das geht über",
    "banner": "Die Originalfotos in „{tree}“ bleiben bis zum {date} in voller Größe.",
    "bookSeal": "Mit dem PDF-Buch werden die Originale des Stammbaums auch nach dem bezahlten Jahr aufbewahrt, im versiegelten Archiv, {years, plural, one {ein Jahr} other {# Jahre}} lang.",
  },
  "ArchiveMail": {
    "arhivare": {
      "subject": "{app}: Die Originale in „{tree}“ kommen am {date} ins versiegelte Archiv",
      "body": "Hallo {name},\n\ndas bezahlte Jahr für den Stammbaum „{tree}“ ist vorbei, und die Zeit, in der die Originale in voller Größe online waren, geht zu Ende. Weil ihr das Familienbuch als PDF habt, kommen die Fotos, Stimmen und Dokumente am {date} (in {days} Tagen) ins versiegelte Archiv: komprimiert und {years, plural, one {ein Jahr} other {# Jahre}} lang ab dem Kauf des Buches aufbewahrt.\n\nOnline bleiben der Stammbaum (Namen, Daten, Verbindungen, Texte) und die kleinen Fotos. Wenn du dein Jahr verlängerst oder Aufbewahren nimmst ({keep} pro Jahr), öffnet sich alles sofort wieder in voller Größe.\n\nAlles, was dir gehört, kannst du jederzeit kostenlos herunterladen: {link}\nWenn du alles löschen willst, geht das über „Meine Daten“.\n\nSonst musst du nichts tun.",
    },
    "reducere": {
      "subject": "{app}: Die Fotos in „{tree}“ bleiben ab dem {date} nur noch klein",
      "body": "Hallo {name},\n\nam {date} (in {days} Tagen) endet die Zeit, in der wir die Originalfotos und gescannten Dokumente des Stammbaums „{tree}“ in voller Größe aufbewahren. Danach bleiben sie nur noch klein. Stimmen, PDF-Dokumente, Namen, Daten und Texte bleiben alle.\n\nUm die Originale zu behalten, hast du drei Wege:\n• lade sie jetzt kostenlos herunter: {link}\n• nimm Aufbewahren, {keep} pro Jahr: Die Familie sieht und hört alles online;\n• kaufe das Familienbuch als PDF, {book}: Die Originale kommen ins versiegelte Archiv, {years, plural, one {ein Jahr} other {# Jahre}} lang aufbewahrt.\n\nWenn du alles löschen willst, geht das über „Meine Daten“.",
    },
  },
  "KeepMail": {
    "subject": "{app}: das Archiv deiner Familie",
    "body": "Hallo {name}!\n\nAufbewahren deines Stammbaums in {app} ist bis {date} eingeschaltet: Die Familie sieht und hört alles online.\n\nDas vollständige Archiv (Stammbäume als GEDCOM, Fotos, Stimmen und Dokumente) findest du hier: {link}\nWir empfehlen, es einmal im Jahr herunterzuladen und selbst eine Kopie aufzubewahren.\n\nDanke, dass du die Geschichte deiner Familie bewahrst!"
  }
};
