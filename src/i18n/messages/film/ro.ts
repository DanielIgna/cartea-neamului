/**
 * „Filmul vieții” de pe profilul unui om (src/components/FamilyFilm.tsx), cuprinsul profilului și propunerea unei poze
 * de familie pentru bannerul de pe prima pagină. Aceleași reguli ca în ../ro.ts.
 */
import type { Widen } from "../types";

export const roFilm = {
  Film: {
    eyebrow: "Filmul vieții",
    title: "{name}, an cu an",
    lead: "Pozele cu {name} și familia apropiată, puse pe film în ordinea anilor: {count, plural, one {# cadru} few {# cadre} other {# de cadre}}. Apasă pe o poză sau pornește proiecția.",
    empty: "Încă nu sunt poze cu {name} sau cu familia apropiată. Pune câteva în album și filmul pornește singur.",
    addPhotos: "Pune poze în album",
    play: "Pornește proiecția",
    stripLabel: "Banda de film cu pozele, în ordinea anilor",
    frames: "{count, plural, one {# cadru} few {# cadre} other {# de cadre}}",
    reelsTitle: "Rolele de film",
    reelsLead: "Câte o rolă pentru fiecare om din familia apropiată care are poze.",
    roles: {
      self: "Albumul personal",
      father: "Tatăl",
      mother: "Mama",
      grandfather: "Bunicul",
      grandmother: "Bunica",
      spouse: "{sex, select, F {Soția} M {Soțul} other {Soț sau soție}}",
      sibling: "{sex, select, F {Sora} M {Fratele} other {Frate sau soră}}",
      child: "{sex, select, F {Fiica} M {Fiul} other {Copilul}}",
      grandchild: "{sex, select, F {Nepoata} M {Nepotul} other {Nepotul}}",
      memories: "Din lada cu amintiri",
    },
    age: "avea {age, plural, one {# an} few {# ani} other {# de ani}}",
    counter: "{n} din {total}",
    close: "Închide",
    prev: "Poza de dinainte",
    next: "Poza următoare",
    pause: "Pauză",
    resume: "Pornește",
    propose: "Propune pentru prima pagină",
    alreadyProposed: "Ai propus-o deja pentru prima pagină.",
    memoryNote: "Pozele din lada cu amintiri rămân doar în arbore.",
    proposeTitle: "Poza familiei tale pe prima pagină",
    proposeLead: "Dacă e aleasă, poza stă în bannerul de pe prima pagină a site-ului, pe care o vede oricine. Nu apare până nu o aprobăm noi și o poți retrage oricând.",
    captionLabel: "Câteva cuvinte sub poză (nu e obligatoriu)",
    captionPlaceholder: "Familia Pop, Ieud, vara lui 1972",
    consent: "Sunt în poză sau am acordul tuturor celor din ea (pentru copii, al părinților lor) ca poza să apară public pe prima pagină. Știu că o pot retrage oricând.",
    send: "Trimite spre aprobare",
    sent: "Am primit-o, mulțumim! O vezi pe profil, la „Pozele tale propuse”. Îți arătăm acolo dacă a ajuns pe prima pagină.",
    closeForm: "Închide",
    cancel: "Renunță",
    mine: "Pozele tale propuse pentru prima pagină",
    mineNote: "Dacă o retragi, iese de pe prima pagină și o ștergem și de la noi. Poza rămâne în albumul arborelui.",
    status: {
      pending: "Așteaptă aprobarea",
      approved: "E pe prima pagină",
      rejected: "N-a fost aleasă de data asta",
    },
    withdraw: "Retrage",
    nav: {
      label: "Cuprinsul profilului",
      about: "Despre",
      film: "Filmul vieții",
      lada: "Lada cu amintiri",
      album: "Album",
      family: "Familia",
    },
    errors: {
      demo: "Din contul de demonstrație nu se pot propune poze.",
      consent: "Bifează acordul ca să putem pune poza pe prima pagină.",
      photo: "Poza aceasta nu se poate propune.",
      storage: "Locul pentru poze nu e pornit acum. Încearcă mai târziu.",
      already: "Ai propus-o deja pentru prima pagină.",
      tooMany: "Ai deja {count} poze care așteaptă. Așteaptă să le vedem, apoi mai trimite.",
    },
  },
} as const;

export type FilmCatalog = Widen<typeof roFilm>;
