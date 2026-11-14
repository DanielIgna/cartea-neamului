/**
 * „Păstrarea” (Daniel, 2026-11-13): după anul plătit, familia vede și ascultă tot online cu o sumă mică pe an, fără adăugări.
 * Textele pentru /plata, banda de sus, pagina „Arhiva mea” (/arhiva) și emailurile. Aceleași reguli ca în ../ro.ts.
 */
import type { Widen } from "../types";

export const roPastrare = {
  Keep: {
    title: "Păstrarea arborelui",
    text: "Cu Păstrarea, {price} pe an, toată familia vede și ascultă tot online: pozele mari, glasurile, actele și filmul vieții. Nu se mai adaugă nimic nou; pentru asta alegi din nou un plan. O dată pe an primești pe email legătura spre arhiva completă.",
    freeArch: "Fără Păstrare, arborele (nume, date, legături, texte) rămâne de văzut, iar ce ai încărcat tu și arborele întreg (GEDCOM) le descarci oricând, gratuit. Originalele pozelor rămân întregi încă {years, plural, one {un an} other {# ani}} după sfârșitul anului, apoi doar în mic; te anunțăm pe email cu 90, 30 și 7 zile înainte.",
    free: "Fără Păstrare nu se șterge nimic: arborele (nume, date, legături, texte) rămâne de văzut, pozele încărcate de alții se văd doar în mic, iar ce ai încărcat tu și arborele întreg (GEDCOM) le descarci oricând, gratuit.",
    keptUntil: "Ai Păstrarea până la {date}: familia vede și ascultă tot. Ca să adaugi din nou, alege un plan.",
    extend: "Încă un an se adaugă după {date}.",
    bundleTitle: "Păstrare + Cartea neamului în PDF:",
    bundleText: "un an de Păstrare și cartea PDF a arborelui ales, {price} în loc de {separate}.",
    bundleTree: "Arborele cărții",
    name: "Păstrarea arborelui, un an",
    bundleName: "Păstrarea arborelui + cartea neamului (PDF)",
    thanks: "Mulțumim! Păstrarea e pornită pentru un an.",
    archiveLink: "Arhiva mea",
    banner: "Ai Păstrarea până la {date}: familia vede și ascultă tot, fără adăugări noi.",
    bannerOffer: "Pozele altora se văd acum doar în mic. Ca familia să le vadă mari și să asculte glasurile, Păstrarea costă {price} pe an.",
    mailNote: "\n\nDacă nu mai vrei să adaugi, dar vrei ca familia să vadă în continuare tot (poze mari, glasuri), există Păstrarea: {price} pe an.",
    noticeLead: "Ce e nou: Păstrarea.",
    notice: "După anul plătit, cu {price} pe an, familia vede și ascultă tot online, fără adăugări noi. Fără ea nu se șterge nimic: arborele rămâne de văzut, doar pozele altora se văd în mic, iar ce ai încărcat tu descarci oricând gratuit. Am actualizat Termenii.",
    noticeMore: "Vezi Păstrarea",
    noticeOk: "Am înțeles",
  },
  Archive: {
    title: "Arhiva mea",
    intro: "Tot ce poți lua cu tine din Cartea Neamului: fiecare arbore ca fișier GEDCOM (îl deschide orice program de genealogie), cartea neamului și fișierele. Ce ai încărcat tu se descarcă mereu întreg și gratuit.",
    limited: "În arborii fără an plătit sau Păstrare, pozele încărcate de alții se văd doar în mic.",
    gedcom: "Descarcă arborele (GEDCOM)",
    book: "Cartea neamului",
    files: "Fișiere: {n}",
    none: "Niciun fișier aici încă.",
    mine: "încărcat de tine",
    kinds: { photo: "Poză", audio: "Glas", act: "Act", letter: "Scrisoare", other: "Document" },
    memories: "Pozele și glasurile din Lada cu amintiri se deschid din ladă, după cine are voie să le vadă.",
    myData: "Restul datelor tale (contul, amintirile, mesajele) le descarci din",
    myDataLink: "Datele mele",
    noTrees: "Nu ești încă în niciun arbore.",
    owner: "arborele tău",
  },
  // Arhiva sigilată (Daniel, 2026-11-14): ce scrie pe „Arhiva mea”, în banda de sus și la cartea PDF. Vezi src/lib/arhivare.ts.
  ArchiveNote: {
    liber: "Originalele pozelor și ale actelor scanate rămân întregi până la {date}. Apoi rămân doar în mic; glasurile, actele PDF și textele rămân. Le păstrezi întregi cu Păstrarea ({keep} pe an) sau cu cartea PDF ({book}), care le ține în arhiva sigilată {years, plural, one {un an} other {# ani}}. Le poți descărca oricând, gratuit, de aici.",
    liberSealed: "Originalele rămân întregi online până la {date}. Apoi, pentru că aveți cartea PDF, intră în arhiva sigilată, păstrată până la {until}.",
    sigilat: "Originalele sunt în arhiva sigilată până la {until}. Se deschid din nou întregi, pe loc, când reînnoiești anul sau iei Păstrarea. Le poți descărca oricând, gratuit.",
    redus: "Au rămas pozele în mic; glasurile, actele PDF, numele, datele și textele sunt toate aici.",
    delete: "Vrei să ștergi tot, cu arhivă cu tot? O faci din",
    banner: "Originalele pozelor din „{tree}” rămân întregi până la {date}.",
    bookSeal: "Cu cartea PDF, originalele arborelui se păstrează și după anul plătit, în arhiva sigilată, {years, plural, one {un an} other {# ani}}.",
  },
  ArchiveMail: {
    arhivare: {
      subject: "{app}: originalele din „{tree}” intră în arhiva sigilată pe {date}",
      body: "Bună, {name}!\n\nAnul plătit pentru arborele „{tree}” s-a terminat, iar timpul în care originalele au stat întregi online se încheie. Pentru că aveți cartea neamului în PDF, pe {date} (peste {days} zile) pozele, glasurile și actele trec în arhiva sigilată: comprimate și păstrate {years, plural, one {un an} other {# ani}} de la cumpărarea cărții.\n\nOnline rămân arborele (nume, date, legături, texte) și pozele în mic. Când reînnoiești anul sau iei Păstrarea ({keep} pe an), totul se deschide din nou întreg, pe loc.\n\nTot ce e al tău îl poți descărca oricând, gratuit: {link}\nDacă vrei să ștergi tot, o faci din „Datele mele”.\n\nNu trebuie să faci nimic altceva.",
    },
    reducere: {
      subject: "{app}: pozele din „{tree}” rămân doar în mic de pe {date}",
      body: "Bună, {name}!\n\nPe {date} (peste {days} zile) se termină timpul în care păstrăm întregi originalele pozelor și ale actelor scanate din arborele „{tree}”. După această zi rămân doar în mic. Glasurile, actele PDF, numele, datele și textele rămân toate.\n\nCa să păstrezi originalele, ai trei căi:\n• le descarci acum, gratuit: {link}\n• iei Păstrarea, {keep} pe an: familia vede și ascultă tot online;\n• cumperi cartea neamului în PDF, {book}: originalele intră în arhiva sigilată, păstrate {years, plural, one {un an} other {# ani}}.\n\nDacă vrei să ștergi tot, o faci din „Datele mele”.",
    },
  },
  KeepMail: {
    subject: "{app}: arhiva familiei tale",
    body: "Bună, {name}!\n\nPăstrarea arborelui în {app} e pornită până pe {date}: familia vede și ascultă tot online.\n\nArhiva completă (arborii ca GEDCOM, pozele, glasurile și actele) o găsești aici: {link}\nÎți recomandăm să o descarci o dată pe an și să o ții și la tine.\n\nMulțumim că păstrezi povestea familiei!",
  },
};

export type PastrareCatalog = Widen<typeof roPastrare>;
