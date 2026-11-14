import type { PastrareCatalog } from "./ro";

export const nlPastrare: PastrareCatalog = {
  "Keep": {
    "title": "Bewaren van de stamboom",
    "text": "Met Bewaren, {price} per jaar, ziet en hoort de hele familie alles online: de grote foto’s, de stemmen, de documenten en de levensfilm. Er komt niets nieuws bij; daarvoor kies je opnieuw een abonnement. Eén keer per jaar krijg je per e-mail de link naar het volledige archief.",
    "freeArch": "Zonder Bewaren blijft de stamboom (namen, data, verbanden, teksten) zichtbaar, en wat je zelf uploadde en de hele stamboom (GEDCOM) download je altijd gratis. De originele foto’s blijven nog {years, plural, one {een jaar} other {# jaar}} na het einde van je jaar op volle grootte, daarna alleen klein; we mailen je 90, 30 en 7 dagen van tevoren.",
    "free": "Zonder Bewaren wordt niets verwijderd: de stamboom (namen, data, verbanden, teksten) blijft zichtbaar, foto’s die anderen uploadden zie je alleen klein, en wat je zelf uploadde en de hele stamboom (GEDCOM) download je altijd gratis.",
    "keptUntil": "Je hebt Bewaren tot {date}: de familie ziet en hoort alles. Om weer iets toe te voegen, kies je een abonnement.",
    "extend": "Er komt nog een jaar bij na {date}.",
    "bundleTitle": "Bewaren + het familieboek als pdf:",
    "bundleText": "een jaar Bewaren en het pdf-boek van de gekozen stamboom, {price} in plaats van {separate}.",
    "bundleTree": "Stamboom voor het boek",
    "name": "Bewaren van de stamboom, een jaar",
    "bundleName": "Bewaren van de stamboom + het familieboek (pdf)",
    "thanks": "Bedankt! Bewaren staat aan voor een jaar.",
    "archiveLink": "Mijn archief",
    "banner": "Je hebt Bewaren tot {date}: de familie ziet en hoort alles, zonder nieuwe toevoegingen.",
    "bannerOffer": "Foto’s die anderen uploadden zie je nu alleen klein. Wil je dat de familie ze groot ziet en de stemmen hoort, dan kost Bewaren {price} per jaar.",
    "mailNote": "\n\nWil je niets meer toevoegen, maar wil je dat de familie alles blijft zien (grote foto’s, stemmen)? Dan is er Bewaren: {price} per jaar.",
    "noticeLead": "Nieuw: Bewaren.",
    "notice": "Na je betaalde jaar ziet en hoort de familie voor {price} per jaar alles online, zonder nieuwe toevoegingen. Zonder Bewaren wordt niets verwijderd: de stamboom blijft zichtbaar, alleen foto’s van anderen zie je klein, en wat je zelf uploadde download je altijd gratis. We hebben de Voorwaarden bijgewerkt.",
    "noticeMore": "Bekijk Bewaren",
    "noticeOk": "Begrepen"
  },
  "Archive": {
    "title": "Mijn archief",
    "intro": "Alles wat je uit Het Familieboek kunt meenemen: elke stamboom als GEDCOM-bestand (elk genealogieprogramma opent het), het familieboek en de bestanden. Wat je zelf uploadde, download je altijd volledig en gratis.",
    "limited": "In stambomen zonder betaald jaar of Bewaren zie je foto’s die anderen uploadden alleen klein.",
    "gedcom": "Download de stamboom (GEDCOM)",
    "book": "Het familieboek",
    "files": "Bestanden: {n}",
    "none": "Hier zijn nog geen bestanden.",
    "mine": "door jou geüpload",
    "kinds": {
      "photo": "Foto",
      "audio": "Stem",
      "act": "Akte",
      "letter": "Brief",
      "other": "Document"
    },
    "memories": "Foto’s en stemmen uit de Herinneringskist open je vanuit de kist, volgens wie ze mag zien.",
    "myData": "De rest van je gegevens (account, herinneringen, berichten) download je via",
    "myDataLink": "Mijn gegevens",
    "noTrees": "Je zit nog in geen enkele stamboom.",
    "owner": "jouw stamboom"
  },
  "ArchiveNote": {
    "liber": "De originele foto’s en gescande documenten blijven tot {date} op volle grootte. Daarna blijven ze alleen klein; stemmen, pdf-documenten en teksten blijven allemaal. Je houdt ze op volle grootte met Bewaren ({keep} per jaar) of met het pdf-boek ({book}), dat ze {years, plural, one {een jaar} other {# jaar}} in het verzegelde archief bewaart. Je kunt ze hier altijd gratis downloaden.",
    "liberSealed": "De originelen blijven tot {date} op volle grootte online. Daarna gaan ze, omdat jullie het pdf-boek hebben, naar het verzegelde archief, bewaard tot {until}.",
    "sigilat": "De originelen staan tot {until} in het verzegelde archief. Ze openen meteen weer op volle grootte als je je jaar verlengt of Bewaren neemt. Je kunt ze altijd gratis downloaden.",
    "redus": "De foto’s zijn nu alleen klein; stemmen, pdf-documenten, namen, data en teksten staan er allemaal nog.",
    "delete": "Wil je alles verwijderen, het archief inbegrepen? Dat doe je via",
    "banner": "De originele foto’s in ‘{tree}’ blijven tot {date} op volle grootte.",
    "bookSeal": "Met het pdf-boek worden de originelen van de stamboom ook na het betaalde jaar bewaard, in het verzegelde archief, {years, plural, one {een jaar} other {# jaar}} lang.",
  },
  "ArchiveMail": {
    "arhivare": {
      "subject": "{app}: de originelen in ‘{tree}’ gaan op {date} naar het verzegelde archief",
      "body": "Hallo {name},\n\nHet betaalde jaar voor de stamboom ‘{tree}’ is voorbij, en de tijd waarin de originelen op volle grootte online stonden loopt af. Omdat jullie het familieboek als pdf hebben, gaan de foto’s, stemmen en documenten op {date} (over {days} dagen) naar het verzegelde archief: gecomprimeerd en {years, plural, one {een jaar} other {# jaar}} bewaard vanaf de aankoop van het boek.\n\nOnline blijven de stamboom (namen, data, verbanden, teksten) en de kleine foto’s. Als je je jaar verlengt of Bewaren neemt ({keep} per jaar), opent alles meteen weer op volle grootte.\n\nAlles wat van jou is, kun je altijd gratis downloaden: {link}\nWil je alles verwijderen, dan doe je dat via ‘Mijn gegevens’.\n\nVerder hoef je niets te doen.",
    },
    "reducere": {
      "subject": "{app}: de foto’s in ‘{tree}’ blijven vanaf {date} alleen klein",
      "body": "Hallo {name},\n\nOp {date} (over {days} dagen) eindigt de tijd waarin we de originele foto’s en gescande documenten van de stamboom ‘{tree}’ op volle grootte bewaren. Na die dag blijven ze alleen klein. Stemmen, pdf-documenten, namen, data en teksten blijven allemaal.\n\nOm de originelen te houden heb je drie mogelijkheden:\n• download ze nu, gratis: {link}\n• neem Bewaren, {keep} per jaar: de familie ziet en hoort alles online;\n• koop het familieboek als pdf, {book}: de originelen gaan naar het verzegelde archief, {years, plural, one {een jaar} other {# jaar}} bewaard.\n\nWil je alles verwijderen, dan doe je dat via ‘Mijn gegevens’.",
    },
  },
  "KeepMail": {
    "subject": "{app}: het archief van je familie",
    "body": "Hallo {name}!\n\nBewaren van je stamboom in {app} staat aan tot {date}: de familie ziet en hoort alles online.\n\nHet volledige archief (stambomen als GEDCOM, foto’s, stemmen en documenten) vind je hier: {link}\nWe raden je aan het één keer per jaar te downloaden en ook zelf een kopie te bewaren.\n\nBedankt dat je het verhaal van je familie bewaart!"
  }
};
