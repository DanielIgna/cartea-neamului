/**
 * Conversia din zilele gratuite în plătit (Daniel, 16 noiembrie 2026; src/lib/conversie.ts):
 * - `Conversion`: ce se vede în cont (reducerea în bandă, fereastra din ultima zi, „Activează un plan”, dezabonarea);
 * - `ConversionMail`: cele 6 emailuri din zilele gratuite (doar pe server), cu dezabonare dintr-un clic.
 * Ton simplu, cald, fără limbaj religios. Nu se șterge nimic la expirare: textele o spun.
 */
import type { Widen } from "../types";

export const roConversie = {
  Conversion: {
    offerBar: "Ai {percent}% reducere la primul an, până pe {until}. Codul {code} se aplică singur la plată.",
    activate: "Activează un plan",
    activateText: "Activează un plan ca să continui: să adaugi și să schimbi persoane, să descarci arborele și să inviți rude. Nu s-a șters nimic.",
    popupTitle: "Perioada gratuită se încheie azi",
    popupText: "De mâine arborele rămâne de văzut și nu se pierde nimic. Ca să adaugi și să schimbi în continuare, alege un plan: Basic costă {basic} pe an.",
    popupPay: "Alege un plan",
    popupLater: "Mai târziu",
    exportLocked: "Descărcarea arborelui se deschide cu un plan. Datele tale le poți descărca oricând din „Datele mele”.",
    unsubAsk: "Nu mai vrei emailurile din zilele gratuite de la {app}?",
    unsubDone: "Gata, nu mai primești emailurile din zilele gratuite. Emailurile despre cont (parola, plățile) pleacă în continuare.",
    signupNote: "În zilele gratuite îți trimitem câteva emailuri scurte despre cont (cel mult 6, în două săptămâni). Te dezabonezi dintr-un clic.",
    offerPlata: "Reducerea ta de {percent}% se aplică singură la plata anului (codul {code}), până pe {until}.",
  },
  ConversionMail: {
    why: "Primești acest email pentru că ți-ai făcut cont în {app}. În zilele gratuite îți scriem cel mult 6 emailuri, în primele două săptămâni.",
    unsubscribe: "Nu mai vreau aceste emailuri",
    hello: "Bună, {name}!",
    bunvenitSubject: "Bun venit în {app}! 3 pași simpli ca să începi",
    bunvenitIntro: "Mulțumim că ți-ai făcut cont. Ai {days, plural, one {o zi gratuită} few {# zile gratuite} other {# de zile gratuite}} în care folosești totul, fără card.",
    bunvenitStep1: "1. Adaugă-ți părinții: numele și, dacă știi, anul nașterii.",
    bunvenitStep2: "2. Adaugă bunicii din ambele părți. Unde nu știi o dată, scrie „cca. 1940” și mergi mai departe.",
    bunvenitStep3: "3. Invită o rudă care știe multe (o mătușă, un unchi, bunica), ca să adauge ce știe, cu poze și povești.",
    bunvenitButton: "Deschide arborele",
    progresSubject: "Arborele tău are deja {count, plural, one {o persoană} few {# persoane} other {# de persoane}}",
    progresSubjectEmpty: "Arborele tău așteaptă primele nume",
    progresIntro: "Ai început frumos: în arborele tău sunt deja {count, plural, one {o persoană} few {# persoane} other {# de persoane}}.",
    progresIntroEmpty: "Arborele tău e gata să crească. Cel mai ușor începi cu tine, apoi cu părinții și bunicii.",
    progresTip: "Un sfat: întreabă rudele mai în vârstă de porecle, de satul din care au venit și de meseriile părinților lor. Un singur amănunt de felul ăsta deschide adesea o ramură întreagă.",
    progresInvite: "Trimite-le rudelor legătura ta de invitație: pentru fiecare rudă care își face cont prin ea primiți amândoi câte {inviteDays, plural, one {o zi gratuită} few {# zile gratuite} other {# de zile gratuite}} în plus.",
    progresInviteOff: "Rudele le inviți direct din pagina arborelui, pe WhatsApp sau pe email.",
    progresButton: "Trimite invitația",
    planuriSubject: "Ce primești cu un an în {app}",
    planuriIntro: "Mai ai {daysLeft, plural, one {o zi gratuită} few {# zile gratuite} other {# de zile gratuite}}. Ca să adaugi și după ele, alegi un plan pe un an:",
    planuriBasic: "Basic",
    planuriBasicWhat: "{price} pe an: arborele tău, cu persoane, poze și glasuri",
    planuriFamilie: "Familie",
    planuriFamilieWhat: "{price} pe an: rudele care scriu nu plătesc separat, cartea PDF inclusă",
    planuriPremium: "Premium",
    planuriPremiumWhat: "{price} pe an: mai mulți arbori, cartea PDF a tuturor, reducere la tipar",
    planuriBook: "Cartea familiei: tot ce adunați se face carte, în PDF sau tipărită pentru toată familia.",
    planuriNote: "Nu se iau bani automat și nu se șterge nimic.",
    planuriButton: "Vezi planurile",
    ultimaziSubject: "Perioada ta gratuită se încheie azi",
    ultimaziIntro: "Azi e ultima zi gratuită în {app}. De mâine arborele rămâne de văzut și nu se pierde nimic, dar ca să adaugi, să schimbi, să descarci arborele sau să inviți rude îți trebuie un plan.",
    ultimaziPrice: "Basic costă {price} pe an. Nu îți luăm bani automat.",
    ultimaziButton: "Alege planul și plătește",
    reducereSubject: "{percent}% reducere pentru tine, doar {hours, plural, one {o oră} few {# ore} other {# de ore}}",
    reducereIntro: "Zilele gratuite s-au terminat, dar arborele tău e întreg și te așteaptă.",
    reducereOffer: "Îți dăm {percent}% reducere la primul an, pe orice plan. Codul tău: {code}. Se aplică singur când plătești din butonul de mai jos, ține până pe {until} și se poate folosi o singură dată.",
    reducereButton: "Folosește reducerea",
    asteaptaSubject: "Arborele tău te așteaptă",
    asteaptaIntro: "Arborele tău e păstrat întreg, cu {count, plural, one {o persoană} few {# persoane} other {# de persoane}}: nu s-a șters nimic și îl poți vedea oricând.",
    asteaptaIntroEmpty: "Contul tău e păstrat: nu s-a șters nimic și îl poți deschide oricând.",
    asteaptaPlans: "Când vrei să adaugi din nou, să inviți rudele sau să faci cartea familiei, alegi un plan de la {price} pe an.",
    asteaptaLast: "Acesta e ultimul email din zilele gratuite.",
    asteaptaButton: "Deschide arborele",
  },
} as const;
export type ConversieCatalog = Widen<typeof roConversie>;
