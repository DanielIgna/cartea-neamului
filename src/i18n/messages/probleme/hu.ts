import type { ProblemeCatalog } from "./ro";

/** Magyar. */
export const huProbleme: ProblemeCatalog = {
  "Problem": {
    "metaTitle": "Hiba bejelentése",
    "label": "Segítség",
    "title": "Valami nem úgy működik, ahogy kellene?",
    "lead": "Írd le röviden, mi történt. Ha tudsz, tegyél mellé egy képet a képernyőről: így pontosan látjuk, amit te látsz. Az oldalt, ahonnan jöttél, mi magunk jegyezzük fel.",
    "kindLabel": "Miről van szó?",
    "kinds": {
      "eroare": "Valami nem működik (hiba)",
      "arbore": "Rossz kapcsolatok a családfában (ki kinek a szülője, testvére vagy házastársa)",
      "idee": "Ötlet vagy kívánság",
      "altceva": "Valami más"
    },
    "message": "Írd le, mi történt",
    "messagePlaceholder": "Például: „Megnyomtam a Mentés gombot János nagyapánál, és nem történt semmi.” vagy „Mária testvérként szerepel, de unokatestvér.”",
    "images": "Képek a képernyőről (legfeljebb 3, nem kötelező)",
    "imagesHelp": "Telefonon készíts képernyőképet (általában a bekapcsoló és a hangerő-le gomb együttes lenyomásával), és válaszd ki itt. Számítógépen: Windows + Shift + S, Macen Cmd + Shift + 4.",
    "addImages": "Képek kiválasztása",
    "remove": "Eltávolítás",
    "pageNote": "Erről az oldalról jöttél: {page}",
    "privacyNote": "Az üzenetedet és a képeket csak mi látjuk, hogy kijavítsuk a hibát. Ha családi adatok látszanak rajtuk, semmi másra nem használjuk őket. Bővebben az <privacy>Adatvédelmi tájékoztatóban</privacy>.",
    "send": "Küldés",
    "sending": "Küldés…",
    "sent": "Köszönjük! Megkaptuk az üzenetedet, és amint tudjuk, megnézzük. A válaszunk lent, ezen az oldalon jelenik meg.",
    "another": "Írok még valamit",
    "errors": {
      "message": "Írj néhány szót a hibáról.",
      "tooLong": "Az üzenet túl hosszú. Írd kicsit rövidebben.",
      "tooMany": "Ma már sok üzenetet küldtél. Próbáld újra holnap, vagy írj nekünk WhatsAppon.",
      "tooManyImages": "Legfeljebb 3 képet tehetsz hozzá.",
      "tooBig": "A képek túl nagyok. Válassz kevesebbet.",
      "imageType": "Csak képek jók (JPG, PNG vagy WebP).",
      "storageOff": "Most nem lehet képeket feltölteni. Csak a szöveget küldd el.",
      "failed": "A küldés nem sikerült. Próbáld újra kicsit később.",
      "signIn": "Jelentkezz be, hogy innen írhass nekünk.",
      "demo": "A mintafiókból nem lehet küldeni. Jelentkezz be a saját fiókodba."
    },
    "mineTitle": "Amit írtál nekünk",
    "mineEmpty": "Innen még nem írtál nekünk semmit.",
    "status": {
      "nou": "Megkaptuk",
      "vazut": "Nézzük",
      "rezolvat": "Megoldva"
    },
    "sentOn": "Elküldve: {date}",
    "ourReply": "A válaszunk",
    "newReply": "új",
    "noReply": "Még nem válaszoltunk.",
    "mailSubject": "Válaszoltunk a bejelentett hibára",
    "mailBody": "Szia, {name}! Válaszoltunk az üzenetre, amelyet a „Hiba bejelentése” oldalról küldtél:",
    "mailLink": "Itt is megnézheted: {link}"
  }
};
