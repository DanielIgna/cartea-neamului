/** Pagina /resurse-genealogie (`Resources`): surse publice, cererea „Vreau un test ADN” și lista de laboratoare. Fără vânzare, fără date genetice. */
import type { Widen } from "../types";

export const roResurse = {
  Resources: {
    metaTitle: "Resurse gratuite pentru genealogie",
    metaDescription: "Arhive, registre parohiale, recensăminte, Arhivele Naționale, biblioteci digitale și ziare vechi: unde îți cauți gratuit neamul. Genealogie pe înțelesul tuturor.",
    label: "Resurse",
    title: "Resurse gratuite pentru genealogie",
    intro: "Aici găsești legături spre arhive, biblioteci și baze de date gratuite unde îți poți căuta neamul: registre parohiale, recensăminte, ziare vechi și cataloage. Cartea Neamului nu păstrează aceste fonduri și nu preia date de acolo; fiecare legătură se deschide pe site-ul lor. Unele cer un cont gratuit.",
    groups: {
      archives: "Arhive și registre",
      libraries: "Biblioteci și presă veche",
      other: "Alte baze de date",
      dna: "Dacă ai deja un test ADN",
    },
    src: {
      fsGuide: {
        name: "FamilySearch: ghidul pentru România",
        text: "Pe unde începi, ce registre există și unde se află, pe județe și epoci.",
      },
      fsChurch: {
        name: "FamilySearch: registrele bisericești",
        text: "Botezuri, cununii și înmormântări: ce s-a păstrat și cum se caută.",
      },
      fsCensus: {
        name: "FamilySearch: recensăminte",
        text: "Recensămintele vechi din România și unde se pot vedea.",
      },
      anrDiscover: {
        name: "Descoperă Arhivele Naționale",
        text: "Documente scanate de Arhivele Naționale ale României, deschise tuturor.",
      },
      anrOnline: {
        name: "Arhivele Naționale: cercetare online",
        text: "Inventare și instrumente de cercetare, ca să știi ce să ceri la arhivă.",
      },
      hungaricana: {
        name: "Hungaricana: arhive",
        text: "Arhive scanate din Ungaria, cu mult despre Transilvania, Banat și Partium.",
      },
      bnr: {
        name: "Biblioteca Digitală a BNR",
        text: "Cărți, periodice și documente vechi digitizate de Biblioteca Națională.",
      },
      anno: {
        name: "ANNO: ziare austriece vechi",
        text: "Ziare din Austro-Ungaria, utile pentru Transilvania, Banat și Bucovina.",
      },
      bcuCluj: {
        name: "Biblioteca digitală BCU Cluj",
        text: "Colecții digitizate ale Bibliotecii Centrale Universitare din Cluj.",
      },
      bcuIasi: {
        name: "Biblioteca digitală BCU Iași",
        text: "Colecții digitizate ale Bibliotecii Centrale Universitare din Iași.",
      },
      europeana: {
        name: "Europeana",
        text: "Colecții ale muzeelor, arhivelor și bibliotecilor din Europa, în română.",
      },
      jewishGenDb: {
        name: "JewishGen: baze de date pentru România",
        text: "Liste și registre pentru familiile evreiești din România.",
      },
      jewishGenRo: {
        name: "JewishGen: grupul România",
        text: "Grupul de cercetare pentru România, cu ghiduri și proiecte.",
      },
      genealogica: {
        name: "Genealogica: catalog de surse",
        text: "Un catalog de surse românești; unele destinații pot fi cu plată.",
      },
      gedmatch: {
        name: "GEDmatch",
        text: "Un serviciu al altora unde compari rezultatul unui test ADN pe care îl ai deja; compararea se face pe site-ul lor.",
      },
    },
    dnaNote: "Cartea Neamului nu primește, nu stochează și nu transmite fișiere sau rezultate ADN.",
    external: "se deschide pe alt site",
    dnaTitle: "Vreau un test ADN",
    dnaText: "Cartea Neamului nu vinde teste ADN, nu primește comision și nu prelucrează date genetice. Lista de mai jos e doar informativă, iar prețurile sunt ale laboratoarelor și se pot schimba. Nu e un sfat medical. Dacă ai o întrebare, scrie-ne și îți răspundem.",
    labsTitle: "Laboratoare din România",
    labsEmpty: "Lista de laboratoare se completează în curând.",
    formTitle: "Scrie-ne",
    name: "Numele tău",
    email: "Emailul tău",
    phone: "Telefon (dacă vrei)",
    city: "Orașul",
    message: "Mesajul",
    messageHint: "Cel mult 1000 de caractere. Nu scrie aici date despre sănătate sau rezultate ADN.",
    consent: "Sunt de acord ca datele mele să fie folosite doar ca să mi se răspundă la această cerere. Nu sunt date genetice și se pot șterge oricând, la cerere.",
    send: "Trimite cererea",
    sending: "Se trimite…",
    ok: "Mulțumim! Am primit cererea și îți răspundem pe email. Nu am trimis nimic la vreun laborator.",
    err: {
      name: "Scrie-ți numele.",
      email: "Scrie o adresă de email bună.",
      city: "Scrie orașul.",
      message: "Scrie un mesaj de cel mult 1000 de caractere.",
      consent: "Bifează acordul ca să putem primi cererea.",
      tooMany: "Prea multe cereri într-un timp scurt. Încearcă mai târziu.",
      failed: "Ceva n-a mers. Încearcă din nou sau scrie-ne din pagina de contact.",
    },
    footer: "Resurse genealogie",
    contactLink: "Cauți singur prin arhive? Vezi resursele gratuite pentru genealogie.",
  },
} as const;
export type ResurseCatalog = Widen<typeof roResurse>;
