/**
 * Activarea (Daniel, 17.11.2026; src/lib/activare.ts):
 * - `QuickStart`: primii pași după înscriere, cel mult 3 câmpuri pe ecran (în browser);
 * - `BranchInvite`: după 5 persoane, „Invită-l pe [nume] să completeze ramura lui” (în browser);
 * - `ActivationMail`: emailul trimis o singură dată celui care n-are arbore după 24 de ore (doar pe server).
 * Ton simplu, cald, fără limbaj religios.
 */
import type { Widen } from "../types";

export const roActivare = {
  QuickStart: {
    title: "Adaugă-te pe tine, apoi pe părinți și bunici",
    lead: "Durează un minut. Ce nu știi lași gol: adaugi mai târziu, sau te ajută rudele.",
    progress: "Pasul {n} din {total}",
    fatherSide: "Bunicii dinspre tată",
    motherSide: "Bunicii dinspre mamă",
    grandfatherGiven: "Prenumele bunicului",
    grandmotherGiven: "Prenumele bunicii",
    grandmotherMaiden: "Numele de fată al bunicii",
    dontKnow: "Nu știu, mai departe",
    finish: "Gata, fă arborele",
    later: "Datele exacte, pozele și locurile le adaugi după aceea, din arbore.",
    otherWays: "Ai primit un link de la o rudă sau ai deja un fișier GEDCOM? Găsești variantele mai jos.",
  },
  TryTree: {
    q1: "Începe chiar acum: cum te cheamă?",
    given: "Prenumele tău",
    surname: "Numele de familie",
    go1: "Vezi-ți arborele",
    q2: "{name}, cum îi cheamă pe părinții tăi?",
    father: "Prenumele tatălui",
    mother: "Prenumele mamei",
    go2: "Salvează arborele, gratuit",
    note2: "Ce nu știi lași gol. Îți faci contul într-un minut și arborele te așteaptă acolo, cu ce ai scris.",
    you: "Tu",
    dad: "tata",
    mom: "mama",
    gf: "bunic",
    gm: "bunică",
    err: "Scrie-ți prenumele ca să pornim.",
    fbHello: "Bine ai venit de pe Facebook! Încearcă în 30 de secunde: scrie-ți numele și vezi cum crește arborele.",
    giftHello: "Cauți un cadou pentru părinți sau bunici? Vezi darul de Crăciun",
    haveAccount: "Ai deja cont?",
    proof: "{count, plural, one {O familie și-a} few {# familii și-au} other {# de familii și-au}} început arborele aici în ultima lună.",
    saved: "Arborele tău e aproape gata: {summary}.",
    savedCta: "Fă-ți contul ca să-l păstrezi. Primele zile sunt gratuite, fără card.",
    dadIs: "tata {name}",
    momIs: "mama {name}",
    quickKept: "Am păstrat ce ai scris pe prima pagină. Mai alege doar dacă ești bărbat sau femeie.",
  },
  BranchInvite: {
    titleM: "Invită-l pe {name} să completeze ramura lui",
    titleF: "Invit-o pe {name} să completeze ramura ei",
    text: "Arborele tău are deja {count} persoane. {name} știe nume și povești pe care nu le știe nimeni altcineva: trimite-i linkul pe WhatsApp, pe email sau copiază-l.",
    later: "Mai târziu",
    viewOnly: "În zilele gratuite, linkul îi arată arborele; ca să scrie și {name} în el, e nevoie de un an plătit.",
  },
  ActivationMail: {
    subject: "Arborele tău te așteaptă în {app}",
    body: "Bună, {name}!\n\nȚi-ai făcut cont în {app}, dar arborele încă n-a pornit. Primul pas e scurt: scrii cine ești, apoi părinții și bunicii, câte trei rânduri pe ecran. Ce nu știi lași gol.\n\nDin acel moment poți chema rudele să completeze fiecare ramura lui.",
    button: "Pornește arborele",
    why: "Primești acest email o singură dată, pentru că ți-ai făcut cont în {app}.",
    unsubscribe: "Nu mai vreau emailuri despre cont",
  },
} as const;

export type ActivareCatalog = Widen<typeof roActivare>;
