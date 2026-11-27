import type { PastrareCatalog } from "./ro";

export const itPastrare: PastrareCatalog = {
  "Keep": {
    "title": "Conservazione dell’albero",
    "text": "Con la Conservazione, {price} all’anno, tutta la famiglia vede e ascolta tutto online: le foto grandi, le voci, i documenti e il film della vita. Non si aggiunge nulla di nuovo; per questo scegli di nuovo un piano. Una volta all’anno ricevi via email il link all’archivio completo.",
    "freeArch": "Senza Conservazione, l’albero (nomi, date, legami, testi) resta visibile, e ciò che hai caricato tu e l’albero intero (GEDCOM) li scarichi sempre, gratis. Le foto originali restano a grandezza piena ancora per {years, plural, one {un anno} other {# anni}} dopo la fine del tuo anno, poi solo in piccolo; ti avvisiamo per email 90, 30 e 7 giorni prima.",
    "free": "Senza Conservazione non si cancella nulla: l’albero (nomi, date, legami, testi) resta visibile, le foto caricate da altri si vedono solo in piccolo, e ciò che hai caricato tu e l’albero intero (GEDCOM) li scarichi sempre gratis.",
    "keptUntil": "Hai la Conservazione fino al {date}: la famiglia vede e ascolta tutto. Per aggiungere di nuovo, scegli un piano.",
    "extend": "Un altro anno si aggiunge dopo il {date}.",
    "bundleTitle": "Conservazione + il libro della famiglia in PDF:",
    "bundleText": "un anno di Conservazione e il libro PDF dell’albero scelto, {price} invece di {separate}.",
    "bundleTree": "Albero del libro",
    "name": "Conservazione dell’albero, un anno",
    "bundleName": "Conservazione dell’albero + il libro della famiglia (PDF)",
    "thanks": "Grazie! La Conservazione è attiva per un anno.",
    "archiveLink": "Il mio archivio",
    "banner": "Hai la Conservazione fino al {date}: la famiglia vede e ascolta tutto, senza nuove aggiunte.",
    "bannerOffer": "Le foto caricate da altri ora si vedono solo in piccolo. Perché la famiglia le veda grandi e ascolti le voci, la Conservazione costa {price} all’anno.",
    "mailNote": "\n\nSe non vuoi più aggiungere nulla ma vuoi che la famiglia continui a vedere tutto (foto grandi, voci), c’è la Conservazione: {price} all’anno.",
    "noticeLead": "Novità: la Conservazione.",
    "notice": "Quando finisce l’anno pagato, puoi tenere l’albero online a soli {price} all’anno. La famiglia può continuare a vederlo e ascoltarlo; si fermano solo le nuove aggiunte. Senza la Conservazione non si cancella nulla: l’albero resta visibile, le foto caricate da altri si vedono più piccole e i tuoi file li scarichi quando vuoi, gratis. Abbiamo aggiornato i Termini.",
    "noticeMore": "Vedi la Conservazione",
    "noticeOk": "Ho capito"
  },
  "Archive": {
    "title": "Il mio archivio",
    "intro": "Tutto ciò che puoi portare con te da Il Libro della Famiglia: ogni albero come file GEDCOM (lo apre qualsiasi programma di genealogia), il libro della famiglia e i file. Ciò che hai caricato tu si scarica sempre per intero e gratis.",
    "limited": "Negli alberi senza anno pagato né Conservazione, le foto caricate da altri si vedono solo in piccolo.",
    "gedcom": "Scarica l’albero (GEDCOM)",
    "book": "Il libro della famiglia",
    "files": "File: {n}",
    "none": "Ancora nessun file qui.",
    "mine": "caricato da te",
    "kinds": {
      "photo": "Foto",
      "audio": "Voce",
      "act": "Atto",
      "letter": "Lettera",
      "other": "Documento"
    },
    "memories": "Le foto e le voci del Baule dei ricordi si aprono dal baule, secondo chi può vederle.",
    "myData": "Il resto dei tuoi dati (account, ricordi, messaggi) lo scarichi da",
    "myDataLink": "I miei dati",
    "noTrees": "Non sei ancora in nessun albero.",
    "owner": "il tuo albero"
  },
  "ArchiveNote": {
    "liber": "Le foto originali e i documenti scansionati restano a grandezza piena fino al {date}. Dopo restano solo in piccolo; le voci, i documenti PDF e i testi restano tutti. Puoi tenerli a grandezza piena con la Conservazione ({keep} all’anno) o con il libro PDF ({book}), che li custodisce nell’archivio sigillato per {years, plural, one {un anno} other {# anni}}. Puoi sempre scaricarli da qui, gratis.",
    "liberSealed": "Gli originali restano a grandezza piena online fino al {date}. Poi, dato che avete il libro PDF, entrano nell’archivio sigillato, custodito fino al {until}.",
    "sigilat": "Gli originali sono nell’archivio sigillato fino al {until}. Si riaprono a grandezza piena, subito, quando rinnovi il tuo anno o prendi la Conservazione. Puoi sempre scaricarli, gratis.",
    "redus": "Le foto sono rimaste solo in piccolo; le voci, i documenti PDF, i nomi, le date e i testi sono tutti qui.",
    "delete": "Vuoi cancellare tutto, archivio compreso? Lo fai da",
    "banner": "Le foto originali di «{tree}» restano a grandezza piena fino al {date}.",
    "bookSeal": "Con il libro PDF, gli originali dell’albero sono custoditi anche dopo l’anno pagato, nell’archivio sigillato, per {years, plural, one {un anno} other {# anni}}.",
  },
  "ArchiveMail": {
    "arhivare": {
      "subject": "{app}: gli originali di «{tree}» entrano nell’archivio sigillato il {date}",
      "body": "Ciao {name},\n\nl’anno pagato per l’albero «{tree}» è finito, e il periodo in cui gli originali sono rimasti a grandezza piena online sta per concludersi. Dato che avete il libro della famiglia in PDF, il {date} (tra {days} giorni) le foto, le voci e i documenti entrano nell’archivio sigillato: compressi e custoditi per {years, plural, one {un anno} other {# anni}} dall’acquisto del libro.\n\nOnline restano l’albero (nomi, date, legami, testi) e le foto in piccolo. Quando rinnovi il tuo anno o prendi la Conservazione ({keep} all’anno), tutto si riapre a grandezza piena, subito.\n\nTutto ciò che è tuo puoi scaricarlo sempre, gratis: {link}\nSe vuoi cancellare tutto, lo fai da «I miei dati».\n\nNon devi fare nient’altro.",
    },
    "reducere": {
      "subject": "{app}: le foto di «{tree}» restano solo in piccolo dal {date}",
      "body": "Ciao {name},\n\nil {date} (tra {days} giorni) finisce il periodo in cui custodiamo a grandezza piena le foto originali e i documenti scansionati dell’albero «{tree}». Dopo quel giorno restano solo in piccolo. Le voci, i documenti PDF, i nomi, le date e i testi restano tutti.\n\nPer tenere gli originali hai tre strade:\n• scaricarli adesso, gratis: {link}\n• prendere la Conservazione, {keep} all’anno: la famiglia vede e ascolta tutto online;\n• comprare il libro della famiglia in PDF, {book}: gli originali entrano nell’archivio sigillato, custoditi per {years, plural, one {un anno} other {# anni}}.\n\nSe vuoi cancellare tutto, lo fai da «I miei dati».",
    },
  },
  "KeepMail": {
    "subject": "{app}: l’archivio della tua famiglia",
    "body": "Ciao {name}!\n\nLa Conservazione del tuo albero in {app} è attiva fino al {date}: la famiglia vede e ascolta tutto online.\n\nL’archivio completo (alberi in GEDCOM, foto, voci e documenti) lo trovi qui: {link}\nTi consigliamo di scaricarlo una volta all’anno e di tenerne una copia anche tu.\n\nGrazie per custodire la storia della tua famiglia!"
  }
};
