import type { PastrareCatalog } from "./ro";

export const huPastrare: PastrareCatalog = {
  "Keep": {
    "title": "A családfa megőrzése",
    "text": "A Megőrzéssel, évi {price} áron, az egész család mindent lát és hallgat online: a nagy fotókat, a hangokat, az iratokat és az élet filmjét. Új dolgot nem lehet hozzáadni; ehhez újra csomagot választasz. Évente egyszer e-mailben megkapod a teljes archívum linkjét.",
    "freeArch": "Megőrzés nélkül a családfa (nevek, dátumok, kapcsolatok, szövegek) látható marad, a saját feltöltéseidet és a teljes családfát (GEDCOM) pedig bármikor ingyen letöltheted. Az eredeti fotók az éved vége után még {years, plural, one {egy évig} other {# évig}} teljes méretben maradnak, utána csak kicsiben; 90, 30 és 7 nappal előtte e-mailt küldünk.",
    "free": "Megőrzés nélkül sem törlődik semmi: a családfa (nevek, dátumok, kapcsolatok, szövegek) látható marad, a mások által feltöltött fotók csak kicsiben látszanak, a saját feltöltéseidet és a teljes családfát (GEDCOM) pedig bármikor ingyen letöltheted.",
    "keptUntil": "{date} napjáig van Megőrzésed: a család mindent lát és hallgat. Ha újra hozzá akarsz adni, válassz csomagot.",
    "extend": "Újabb év adódik hozzá {date} után.",
    "bundleTitle": "Megőrzés + a családkönyv PDF-ben:",
    "bundleText": "egy év Megőrzés és a választott családfa PDF-könyve, {price} {separate} helyett.",
    "bundleTree": "A könyv családfája",
    "name": "A családfa megőrzése, egy év",
    "bundleName": "A családfa megőrzése + a családkönyv (PDF)",
    "thanks": "Köszönjük! A Megőrzés egy évre bekapcsolva.",
    "archiveLink": "Az archívumom",
    "banner": "{date} napjáig van Megőrzésed: a család mindent lát és hallgat, új hozzáadások nélkül.",
    "bannerOffer": "A mások által feltöltött fotók most csak kicsiben látszanak. Ha azt szeretnéd, hogy a család nagyban lássa őket és hallgassa a hangokat, a Megőrzés évi {price}.",
    "mailNote": "\n\nHa már nem szeretnél hozzáadni, de szeretnéd, hogy a család továbbra is mindent lásson (nagy fotók, hangok), ott a Megőrzés: évi {price}.",
    "noticeLead": "Újdonság: a Megőrzés.",
    "notice": "A kifizetett év után évi {price} áron a család mindent lát és hallgat online, új hozzáadások nélkül. Nélküle sem törlődik semmi: a családfa látható marad, csak a mások fotói látszanak kicsiben, a saját feltöltéseidet pedig bármikor ingyen letöltheted. Frissítettük a Feltételeket.",
    "noticeMore": "A Megőrzés megtekintése",
    "noticeOk": "Értem"
  },
  "Archive": {
    "title": "Az archívumom",
    "intro": "Minden, amit magaddal vihetsz A Család Könyvéből: minden családfát GEDCOM-fájlként (bármely családfaprogram megnyitja), a családkönyvet és a fájlokat. Amit te töltöttél fel, mindig teljes egészében és ingyen letöltheted.",
    "limited": "A kifizetett év vagy Megőrzés nélküli családfákban a mások által feltöltött fotók csak kicsiben látszanak.",
    "gedcom": "A családfa letöltése (GEDCOM)",
    "book": "A családkönyv",
    "files": "Fájlok: {n}",
    "none": "Itt még nincs fájl.",
    "mine": "te töltötted fel",
    "kinds": {
      "photo": "Fotó",
      "audio": "Hang",
      "act": "Irat",
      "letter": "Levél",
      "other": "Dokumentum"
    },
    "memories": "Az Emlékláda fotói és hangjai a ládából nyílnak meg, aszerint, hogy ki láthatja őket.",
    "myData": "A többi adatodat (fiók, emlékek, üzenetek) innen töltheted le:",
    "myDataLink": "Adataim",
    "noTrees": "Még egyik családfában sem vagy benne.",
    "owner": "a te családfád"
  },
  "ArchiveNote": {
    "liber": "Az eredeti fotók és a beszkennelt iratok {date} napjáig teljes méretben maradnak. Utána csak kicsiben maradnak; a hangok, a PDF-iratok és a szövegek mind megmaradnak. Teljes méretben megtarthatod őket a Megőrzéssel (évi {keep}) vagy a PDF-könyvvel ({book}), amely {years, plural, one {egy évig} other {# évig}} a lepecsételt archívumban őrzi őket. Innen bármikor ingyen letöltheted őket.",
    "liberSealed": "Az eredetik {date} napjáig teljes méretben online maradnak. Utána, mivel megvan a PDF-könyv, a lepecsételt archívumba kerülnek, ahol {until} napjáig őrizzük őket.",
    "sigilat": "Az eredetik {until} napjáig a lepecsételt archívumban vannak. Azonnal újra teljes méretben nyílnak meg, ha megújítod az évedet vagy Megőrzést veszel. Bármikor ingyen letöltheted őket.",
    "redus": "A fotók már csak kicsiben látszanak; a hangok, a PDF-iratok, a nevek, a dátumok és a szövegek mind itt vannak.",
    "delete": "Mindent törölnél, az archívummal együtt? Itt teheted meg:",
    "banner": "A(z) „{tree}” eredeti fotói {date} napjáig teljes méretben maradnak.",
    "bookSeal": "A PDF-könyvvel a családfa eredetijei a kifizetett év után is megmaradnak, a lepecsételt archívumban, {years, plural, one {egy évig} other {# évig}}.",
  },
  "ArchiveMail": {
    "arhivare": {
      "subject": "{app}: a(z) „{tree}” eredetijei {date} napján a lepecsételt archívumba kerülnek",
      "body": "Szia, {name}!\n\nA(z) „{tree}” családfa kifizetett éve lejárt, és véget ér az az idő, amikor az eredetik teljes méretben voltak online. Mivel megvan a családi könyv PDF-ben, {date} napján ({days} nap múlva) a fotók, a hangok és az iratok a lepecsételt archívumba kerülnek: tömörítve, a könyv megvásárlásától számítva {years, plural, one {egy évig} other {# évig}} őrizzük őket.\n\nOnline megmarad a családfa (nevek, dátumok, kapcsolatok, szövegek) és a kicsi fotók. Ha megújítod az évedet vagy Megőrzést veszel (évi {keep}), minden azonnal újra teljes méretben nyílik meg.\n\nMindent, ami a tiéd, bármikor ingyen letölthetsz: {link}\nHa mindent törölni szeretnél, az „Adataim” oldalon teheted meg.\n\nMást nem kell tenned.",
    },
    "reducere": {
      "subject": "{app}: a(z) „{tree}” fotói {date} napjától csak kicsiben maradnak",
      "body": "Szia, {name}!\n\n{date} napján ({days} nap múlva) véget ér az az idő, amíg a(z) „{tree}” családfa eredeti fotóit és beszkennelt iratait teljes méretben őrizzük. Utána csak kicsiben maradnak. A hangok, a PDF-iratok, a nevek, a dátumok és a szövegek mind megmaradnak.\n\nHogy megtartsd az eredetiket, három utad van:\n• töltsd le őket most, ingyen: {link}\n• vegyél Megőrzést, évi {keep}: a család mindent lát és hall online;\n• vásárold meg a családi könyvet PDF-ben, {book}: az eredetik a lepecsételt archívumba kerülnek, {years, plural, one {egy évig} other {# évig}} őrizzük őket.\n\nHa mindent törölni szeretnél, az „Adataim” oldalon teheted meg.",
    },
  },
  "KeepMail": {
    "subject": "{app}: a családod archívuma",
    "body": "Szia, {name}!\n\nA családfád Megőrzése a(z) {app} oldalon {date} napjáig be van kapcsolva: a család mindent lát és hallgat online.\n\nA teljes archívumot (családfák GEDCOM-ban, fotók, hangok és iratok) itt találod: {link}\nJavasoljuk, hogy évente egyszer töltsd le, és őrizz meg egy példányt magadnál is.\n\nKöszönjük, hogy megőrzöd a családod történetét!"
  }
};
