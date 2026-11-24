/**
 * Drumul spre arbore (Daniel, 24.11.2026): „+ Adaugă persoană” în orice desen, „+ Adaugă rudă” în fișă, ghidul în 6 pași cu
 * butonul „?” și butonul „Descarcă GEDCOM” din „Datele mele”. Celelalte limbi: ./altele.ts.
 */
export const roGhidArbore = {
  TreeGuide: {
    addPerson: "+ Adaugă persoană",
    addRelative: "+ Adaugă rudă",
    addFor: "Pe cine adaugi lângă {name}?",
    addHint: "Pentru bunici: deschide fișa tatălui sau a mamei și adaugă-le părinții.",
    helpLabel: "Ghidul arborelui, pas cu pas",
    gedcomButton: "Descarcă GEDCOM",
    title: "Primii pași în arbore",
    stepOf: "Pasul {n} din {total}",
    back: "Înapoi",
    next: "Mai departe",
    finish: "Am înțeles",
    close: "Închide",
    done: "Făcut",
    reopen: "Ghidul se redeschide oricând din butonul „?” de deasupra desenului.",
    steps: {
      open: {
        title: "Deschide arborele",
        text: "Ești în arborele tău. Sus alegi cum arată desenul. Atinge un nume și se deschide <b>fișa</b> lui: pe calculator în dreapta, pe telefon sub desen. De pe orice pagină ajungi înapoi aici din <b>Arborele meu</b>, în meniul de sus.",
      },
      parents: {
        title: "Adaugă părinții",
        text: "Începe cu mama și tata. Ajunge numele: anii și locurile le completezi când le afli. Butonul <b>+ Adaugă persoană</b> stă mereu deasupra desenului.",
        action: "Adaugă părinții",
      },
      grandparents: {
        title: "Adaugă bunicii",
        text: "Bunicii sunt părinții tatălui și ai mamei. Numele de fată al bunicii deschide adesea o ramură întreagă.",
        father: "Părinții tatălui",
        mother: "Părinții mamei",
        needParents: "Adaugă întâi părinții, apoi părinții lor.",
      },
      siblings: {
        title: "Adaugă frații",
        text: "Frații și surorile se leagă singuri de aceiași părinți și apar în desen lângă tine.",
        action: "Adaugă un frate sau o soră",
      },
      photo: {
        title: "O poză și o amintire",
        text: "O poză veche face arborele viu. În <b>lada cu amintiri</b> scrii o întâmplare, o vorbă a bunicii sau înregistrezi glasul cuiva.",
        photo: "Pune o poză",
        memory: "Scrie o amintire",
      },
      invite: {
        title: "Invită o rudă",
        text: "Trimite linkul unui văr, unei mătuși sau unui frate. Ei știu alte ramuri, iar arborele îl văd gratuit.",
        action: "Invită o rudă",
      },
    },
  },
};
