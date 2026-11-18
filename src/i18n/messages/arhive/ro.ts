/**
 * „Surse publice” (src/lib/surse-publice.ts):
 * - `Archives`: cardul „Caută în arhive publice” din arbore și câmpul „Sursa informației” din fișă;
 * - `ArchivesMail`: emailul trimis o singură dată celor cu strămoși înainte de 1930 (doar pe server).
 * Descrierile surselor rămân în română (sunt arhive românești); ton simplu, cald, pentru toate vârstele.
 */
import type { Widen } from "../types";

export const roArhive = {
  Archives: {
    footer: "Surse publice",
    title: "Caută în arhive publice",
    intro: "Pentru {name} lipsesc: {missing}. Unele arhive publice și gratuite te pot ajuta.",
    missing: { an: "anul nașterii", loc: "locul nașterii", parinti: "părinții", casatorie: "căsătoria", deces: "data morții" },
    whatToSearch: "Ce să cauți",
    surname: "Nume",
    given: "Prenume",
    place: "Localitatea",
    year: "Anul",
    copy: "Copiază datele",
    copied: "Am copiat datele. Le poți lipi în căutarea arhivei.",
    copyFailed: "Nu s-au putut copia; le poți selecta din căsuța de mai sus.",
    where: "Unde să cauți",
    newTab: "se deschide într-o filă nouă",
    account: "cu cont gratuit",
    found: "Am găsit ceva",
    hide: "Nu mai arăta",
    hidden: "Bine, nu mai arătăm sugestia pentru {name}.",
    privacy: "Linkurile duc pe site-urile arhivelor. Nu trimitem acolo nimic din arborele tău: datele le copiezi tu.",
    allSources: "Toate sursele și sfaturile",
    textsInRo: "Descrierile surselor sunt în limba română.",
    sourceLabel: "Sursa informației",
    sourcePlaceholder: "de pildă: registrul de botezuri din Huedin, 1885",
    sourceLink: "Linkul sursei (opțional)",
    sourceHint: "Ca familia să știe de unde vine ce ai scris.",
  },
  ArchivesMail: {
    subject: "Ai strămoși înainte de 1930? Iată unde poți căuta gratuit",
    body: "Bună, {name}!\n\nÎn arborele tău sunt strămoși născuți înainte de 1930 cărora le lipsesc câteva date: anul sau locul nașterii, părinții, căsătoria. Multe se găsesc în arhive publice și gratuite: registre parohiale, acte de stare civilă, recensăminte.\n\nAm adunat într-o singură pagină unde poți căuta și cum. În arbore, la fiecare dintre ei, găsești și cardul „Caută în arhive publice”, cu numele, locul și anul gata de copiat.",
    button: "Vezi unde poți căuta",
    why: "Primești acest email o singură dată, pentru că ai un arbore în {app}.",
    unsubscribe: "Nu mai vreau emailuri despre cont",
  },
} as const;
export type ArhiveCatalog = Widen<typeof roArhive>;
