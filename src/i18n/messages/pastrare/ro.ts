/**
 * „Păstrarea” (Daniel, 2026-11-13): după anul plătit, familia vede și ascultă tot online cu o sumă mică pe an, fără adăugări.
 * Textele pentru /plata, banda de sus, pagina „Arhiva mea” (/arhiva) și emailurile. Aceleași reguli ca în ../ro.ts.
 */
import type { Widen } from "../types";

export const roPastrare = {
  Keep: {
    title: "Păstrarea arborelui",
    text: "Cu Păstrarea, {price} pe an, toată familia vede și ascultă tot online: pozele mari, glasurile, actele și filmul vieții. Nu se mai adaugă nimic nou; pentru asta alegi din nou un plan. O dată pe an primești pe email legătura spre arhiva completă.",
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
  KeepMail: {
    subject: "{app}: arhiva familiei tale",
    body: "Bună, {name}!\n\nPăstrarea arborelui în {app} e pornită până pe {date}: familia vede și ascultă tot online.\n\nArhiva completă (arborii ca GEDCOM, pozele, glasurile și actele) o găsești aici: {link}\nÎți recomandăm să o descarci o dată pe an și să o ții și la tine.\n\nMulțumim că păstrezi povestea familiei!",
  },
};

export type PastrareCatalog = Widen<typeof roPastrare>;
