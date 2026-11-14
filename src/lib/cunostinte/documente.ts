/**
 * Registrul documentelor (Admin → Centru de cunoștințe, doar pentru fondatori). Hotărârile, regulile, auditurile și planurile
 * platformei, scrise o dată aici, în cod, ca să aibă istoric în git. Starea (Activ / De revizuit / Ciornă / Arhivat) se poate
 * schimba din panou; ce se schimbă acolo se ține în app_setting `cunostinte_stare`, iar valoarea de aici rămâne cea de pornire.
 * Doar documentele Active guvernează: o regulă în revizuire sau în ciornă nu se ia drept hotărâre.
 *
 * `governs` = cheile funcțiilor din functii.ts pe care documentul le guvernează (testul verifică că există).
 * `source` = de unde vine hotărârea: PR-ul, notița din memoria proiectului sau fișierul. Nimic inventat: ce nu se știe sigur
 * e scris ca „de confirmat”.
 */
export type DocStatus = "activ" | "revizuire" | "ciorna" | "arhivat";
export type DocKind = "decizie" | "regula" | "audit" | "plan" | "memorie" | "registru";
export type DocCategory = "bani" | "ton" | "date" | "familie" | "securitate" | "tehnic" | "autonomie" | "crestere" | "parteneri" | "limbi" | "lucru";

export const DOC_STATUS: Record<DocStatus, { label: string; tone: string }> = {
  activ: { label: "Activ", tone: "ok" },
  revizuire: { label: "De revizuit", tone: "info" },
  ciorna: { label: "Ciornă", tone: "warn" },
  arhivat: { label: "Arhivat", tone: "" },
};
export const DOC_KIND: Record<DocKind, string> = {
  decizie: "Decizie", regula: "Regulă", audit: "Audit", plan: "Plan", memorie: "Memorie", registru: "Registru",
};
export const DOC_CATEGORY: Record<DocCategory, string> = {
  bani: "Bani și planuri", ton: "Ton și conținut", date: "Date personale și GDPR", familie: "Familie și spițe", securitate: "Securitate",
  tehnic: "Tehnic și găzduire", autonomie: "Autonomie", crestere: "Creștere și SEO", parteneri: "Parteneri", limbi: "Limbi", lucru: "Mod de lucru",
};

export type KDoc = {
  id: string;
  title: string;
  kind: DocKind;
  category: DocCategory;
  status: DocStatus;
  version: string;
  /** Ziua hotărârii sau a ultimei schimbări (AAAA-LL-ZZ). */
  date: string;
  /** Peste câte zile de la ultima revizuire trebuie recitit. */
  reviewEveryDays: number;
  summary: string;
  rules: string[];
  source: string[];
  governs: string[];
  /** Ce mai e de făcut, dacă e ceva (apare în coada de revizuire). */
  open?: string[];
  /** Documentul care îl înlocuiește, la cele arhivate. */
  replacedBy?: string;
};

export const DOCS: KDoc[] = [
  {
    id: "D01", title: "Plățile: 7 zile gratuite, apoi anul plătit", kind: "decizie", category: "bani", status: "activ", version: "1.3", date: "2026-11-13", reviewEveryDays: 60,
    summary: "Cum se plătește Cartea Neamului: proba gratuită, anul, invitații, cartea PDF și cartea tipărită. Banii intră pe PFA, prin Stripe.",
    rules: [
      "7 zile gratuite, fără card; apoi un an plătit (Basic 49 lei / 10 €, prețurile se schimbă din Admin → Manager control).",
      "Fiecare om invitat să scrie are și el 7 zile gratuite, apoi plătește anul ca să scrie mai departe; altfel rămâne doar să vadă.",
      "Cei din beta primesc doar primul an gratuit (nu pentru totdeauna) și cartea PDF gratuită în acel an.",
      "Cartea PDF: 99 lei (20 € în celelalte limbi). Cartea tipărită: la cerere, prin Contact.",
      "Fără reînnoire automată: nimeni nu e taxat fără să apese el „Plătește”.",
      "Exportul datelor și GEDCOM rămân gratuite (lege + Termeni).",
      "Plățile se confirmă doar prin webhook-ul Stripe semnat (/api/plata/stripe), nu din pagina de întoarcere.",
      "Vânzările au fost pornite pe 2026-11-13 la cererea lui Daniel; de atunci comutatorul din Manager control hotărăște.",
    ],
    source: ["PR #88 (reguli de acces)", "PR #89 (plata cu cardul)", "PR #95 (pornirea vânzărilor)", "PR #102 (Basic 49 lei)", "memoria proiectului: Payments"],
    governs: ["plati", "planuri", "carte"],
    open: ["Revizia avocatului pentru Termeni (prețuri, renunțarea la retragere)", "Vercel Pro înainte de vânzări serioase", "Webhook-ul pe adresa care nu redirecționează (www)"],
  },
  {
    id: "D02", title: "Regulile anti-portiță din zilele gratuite", kind: "regula", category: "bani", status: "activ", version: "1.0", date: "2026-11-13", reviewEveryDays: 90,
    summary: "Ca proba gratuită să nu poată fi folosită la nesfârșit invitându-se unii pe alții.",
    rules: [
      "Arborele din probă are cel mult 30 de persoane (se schimbă în Admin: trialPersons), dacă proprietarul n-a plătit anul.",
      "În probă, un singur arbore propriu.",
      "Invitația „să scrie” se poate da doar cu anul plătit; în probă invitațiile sunt doar „să vadă”, iar cererile de intrare se acceptă ca vizitator.",
      "Un invitat aflat în probă nu poate scrie într-un arbore al cărui proprietar a expirat.",
      "În probă: 40 de poze, 10 înregistrări, 10 documente.",
    ],
    source: ["PR #92 (plata nu se ocolește invitându-se)", "PR #93 (Termeni: limitele din zilele gratuite)", "memoria proiectului: anti-loophole"],
    governs: ["planuri", "invitatii"],
  },
  {
    id: "D03", title: "Planurile Basic, Familie și Premium", kind: "decizie", category: "bani", status: "activ", version: "1.1", date: "2026-11-13", reviewEveryDays: 90,
    summary: "Trei planuri anuale, cu plafoane diferite; trecerea pe un plan mai mare se plătește pro rata, fără coborâre în mijlocul anului.",
    rules: [
      "Basic 49 lei / 10 €, Familie 149 lei / 30 € (recomandat, 1 carte PDF pe an), Premium 249 lei / 50 € (PDF pentru toți arborii, 20% la tipar).",
      "Pachet Basic + carte PDF: 129 lei. Toate prețurile și plafoanele se schimbă din Admin → Manager control.",
      "Anul cadou (/cadou/<cod>) și 30 de zile pentru cine aduce o rudă care plătește.",
      "Testele ADN nu se vând și nu au afiliere; nu se păstrează date genetice.",
    ],
    source: ["PR #98", "PR #102", "PR #111 (cadou de sărbători)"],
    governs: ["planuri", "cadou", "adn"],
    open: ["Avocatul recitește Termeni §5 și paragraful ADN din Confidențialitate"],
  },
  {
    id: "D04", title: "Păstrarea după anul plătit (25 lei/an)", kind: "decizie", category: "bani", status: "activ", version: "1.0", date: "2026-11-13", reviewEveryDays: 120,
    summary: "Ce se întâmplă cu arborele cuiva care nu mai reînnoiește: nimic nu se șterge, iar pozele întregi rămân online cu Păstrarea.",
    rules: [
      "Păstrare 25 lei / 5 € pe an: poze și înregistrări întregi pentru familie, arhiva anuală pe email, fără adăugări noi.",
      "Fără Păstrare: arborele text rămâne gratuit, pozele se văd mici, exportul rămâne gratuit.",
      "Pachet Păstrare + carte PDF: 109 lei.",
    ],
    source: ["PR #100", "analiza de costuri: costuri/costuri-gazduire-planuri.md"],
    governs: ["planuri", "documente"],
    open: ["Avocatul recitește Termeni §5 l6 și l10"],
  },
  {
    id: "D05", title: "Cine operează platforma: PFA-ul lui Daniel", kind: "decizie", category: "bani", status: "activ", version: "1.0", date: "2026-11-12", reviewEveryDays: 180,
    summary: "Operatorul din Termeni, Confidențialitate și pagina de plată este PFA-ul lui Igna Ioan Daniel; contul Stripe e pe PFA.",
    rules: [
      "Operator: IGNA IOAN DANIEL PFA (datele complete sunt în Termeni și Confidențialitate).",
      "Contul Stripe e deschis pe PFA, nu pe Vintage Furniture SRL.",
      "Contactul legal: adresa de contact a site-ului.",
    ],
    source: ["PR #90"],
    governs: ["plati", "gdpr"],
    open: ["Contabilul confirmă codul CAEN (de ex. 6312) înainte de încasări"],
  },
  {
    id: "D06", title: "Regula de ton: fără limbaj religios pe platformă", kind: "regula", category: "ton", status: "activ", version: "1.2", date: "2026-11-12", reviewEveryDays: 180,
    summary: "Platforma vorbește neutru. Creștinismul apare discret, ca parte a istoriei; versetele biblice rămân neschimbate.",
    rules: [
      "Fără limbaj religios în titluri și meniuri („Istoria umanității”, nu „arborii Bibliei” sau „istoria Bisericii”).",
      "Fără legături sau îndemnuri „citește Biblia”; doar câteva versete care îi fac pe oameni să se gândească și să caute singuri.",
      "Faptele biblice se marchează „după relatarea biblică”.",
      "Versetele și mesajele biblice rămân cuvânt cu cuvânt; textul care le leagă e neutru, în toate cele 9 limbi.",
      "Paginile vechi redirecționează: /firul-vremii → /istoria-umanitatii, /adam-hristos → /genealogii-vechi, /istoria-bisericii → /libertatea-de-a-crede.",
      "Capitolul de credință din autobiografie rămâne cum e (cu acordul separat al omului).",
    ],
    source: ["PR #80", "PR #85", "memoria proiectului: Tone rule"],
    governs: ["istorie", "calatorie", "autobiografie"],
  },
  {
    id: "D07", title: "Spițele: linia bărbătească a fiecărei familii", kind: "regula", category: "familie", status: "activ", version: "1.1", date: "2026-11-04", reviewEveryDays: 365,
    summary: "O spiță urmează linia tată → tată a unei familii. Fiecare om își alege ce spițe vede.",
    rules: [
      "O spiță merge pe linia bărbătească (tatăl, tatăl lui și tot așa).",
      "Implicit, fiecare vede cele două spițe ale părinților lui: a tatălui și a tatălui mamei.",
      "Fiecare om își poate alege altă spiță; alegerea e a lui și apare în toate vederile (arbore, Copac, carte).",
    ],
    source: ["PR #20, #21, #26, #28, #31"],
    governs: ["spite", "arbore", "carte"],
  },
  {
    id: "D08", title: "Cine apare în arborele desenat", kind: "regula", category: "familie", status: "activ", version: "1.0", date: "2026-11-12", reviewEveryDays: 365,
    summary: "O fostă soție a unui bărbat din arbore apare doar pe profilurile copiilor ei, nu în arborele desenat. Persoanele cu același nume nu se unesc fără verificare.",
    rules: [
      "Fosta soție (căsătorie încheiată) nu se desenează în arbore; apare doar pe profilurile copiilor ei.",
      "Două persoane cu același nume și părinți diferiți nu sunt dubluri (de ex. bunicul și fiul lui cu același prenume).",
      "Ce pare greșit apare pe cardul „De verificat în arbore”, nu se schimbă singur.",
    ],
    source: ["PR #82"],
    governs: ["arbore"],
  },
  {
    id: "D09", title: "Date personale: GDPR, acord, export și ștergere", kind: "regula", category: "date", status: "activ", version: "1.4", date: "2026-11-13", reviewEveryDays: 90,
    summary: "Ce se strânge, doar cu acord, și cum își ia omul datele sau își șterge contul.",
    rules: [
      "„Datele mele”: export complet și ștergerea contului, oricând, gratuit.",
      "Capitolul de credință (date sensibile, Art. 9) are acord separat și nu se numără niciodată în statistici.",
      "Timpul petrecut se măsoară doar cu acordul omului; la retragere se șterge tot.",
      "Vizitele se numără anonim, fără cookie; vizitele se țin 13 luni, jurnalul de securitate 90 de zile.",
      "Un singur anunț despre cookie-uri; legătura „Cookie-uri” în subsol.",
      "Pozele propuse pentru prima pagină apar doar cu acord și după aprobare.",
    ],
    source: ["PR #36", "PR #41", "PR #77", "PR #99 (audit juridic)", "PR #114"],
    governs: ["gdpr", "folosire", "analiza", "autobiografie", "film"],
    open: ["Revizia avocatului pentru Confidențialitate"],
  },
  {
    id: "D10", title: "Securitatea conturilor", kind: "regula", category: "securitate", status: "activ", version: "1.1", date: "2026-11-13", reviewEveryDays: 90,
    summary: "Verificarea în 2 pași e la alegere pentru oameni și obligatorie doar în panoul de admin.",
    rules: [
      "Verificarea în 2 pași nu e niciodată obligatorie pentru clienți.",
      "Panoul de admin cere verificarea în 2 pași (pentru conturile cu parolă).",
      "Blocare după prea multe încercări greșite; email la intrarea de pe un dispozitiv nou.",
      "Doi proprietari, cu recuperare reciprocă; adminii în plus doar din ADMIN_EMAILS.",
    ],
    source: ["PR #107", "PR #109"],
    governs: ["securitate", "conturi", "admin"],
  },
  {
    id: "D11", title: "Autonomia: ce face site-ul singur și ce nu", kind: "regula", category: "autonomie", status: "activ", version: "1.0", date: "2026-11-13", reviewEveryDays: 60,
    summary: "Trei trepte: merge singur, cu acordul tău, cu aprobare. Nimic din ce atinge bani, datele oamenilor sau texte publice nu se aplică singur.",
    rules: [
      "Merg singure: verificarea sănătății, curățenia datelor expirate, sitemap-ul la Google.",
      "Cu acordul tău (oprite până le pornești): emailurile către oameni.",
      "Cu aprobare: orice schimbă ce văd oamenii (de ex. închiderea problemelor).",
      "Trei erori la rând opresc singure o automatizare.",
      "Scorul se calculează doar din verificări reale; fără AI și fără cifre inventate.",
    ],
    source: ["PR #117"],
    governs: ["autonomie", "infra", "probleme", "seo-pagini", "planuri"],
    open: ["CRON_SECRET în Vercel, ca bucla să ruleze singură zilnic"],
  },
  {
    id: "D12", title: "Analiza traficului, fără cookie", kind: "decizie", category: "crestere", status: "activ", version: "1.0", date: "2026-11-13", reviewEveryDays: 180,
    summary: "Vizitele se numără anonim, cu o sare zilnică, fără cookie și fără servicii externe.",
    rules: ["Fără Google Analytics sau alte servicii de urmărire.", "Pâlnia vizită → cont → arbore → plată se socotește din date proprii."],
    source: ["PR #114"],
    governs: ["analiza"],
  },
  {
    id: "D13", title: "Parteneriatul PropManage", kind: "decizie", category: "parteneri", status: "activ", version: "1.1", date: "2026-11-13", reviewEveryDays: 180,
    summary: "Parteneriat cu PropManage (Vintage Furniture SRL): acord GDPR separat, export doar al emailului, dezabonare oricând.",
    rules: ["Acordul pentru parteneri e separat și la alegere.", "Partenerul primește doar emailul, prin export.", "Casa bătrânească e o secțiune separată."],
    source: ["PR #51", "PR #105"],
    governs: ["parteneri"],
  },
  {
    id: "D14", title: "Platforma în 9 limbi", kind: "plan", category: "limbi", status: "revizuire", version: "0.9", date: "2026-11-10", reviewEveryDays: 60,
    summary: "ro, en-GB, en-US, fr, es, nl, de, it, hu. Etapele 1–4 sunt gata; urmează paginile legale și emailurile, apoi un audit complet.",
    rules: ["Numele platformei se traduce pe limbă (The Family Book, Le Livre de la Famille…); domeniul rămâne carteaneamului.ro.", "Cartea de tipărit are limba ei, aleasă la tipar."],
    source: ["PR #44–#47, #49, #50, #55", "PR #70 (numele pe limbi)"],
    governs: ["traduceri"],
    open: ["Etapa 5: paginile legale și emailurile în toate limbile", "Auditul complet al traducerilor"],
  },
  {
    id: "D15", title: "Auditul în 16 puncte (noiembrie 2026)", kind: "audit", category: "tehnic", status: "arhivat", version: "1.0", date: "2026-11-10", reviewEveryDays: 365,
    summary: "Previzualizări, QR, microfon, telefon, antete de securitate, SEO, diacritice. Toate punctele s-au reparat.",
    rules: ["Raportul: audit/raport-audit.md în fișierele proiectului."],
    source: ["PR #52–#54"],
    governs: ["seo-pagini", "infra"],
  },
  {
    id: "D16", title: "Auditul juridic: Termeni, Confidențialitate, plată, contact", kind: "audit", category: "date", status: "revizuire", version: "1.0", date: "2026-11-13", reviewEveryDays: 60,
    summary: "Textele legale au fost refăcute în 9 limbi; mai trebuie citite de un avocat înainte de vânzări serioase.",
    rules: ["Raportul: audit-juridic/raport.md în fișierele proiectului."],
    source: ["PR #99"],
    governs: ["gdpr", "plati"],
    open: ["Revizia unui avocat"],
  },
  {
    id: "D17", title: "Ce mai trebuie înainte de vânzări serioase", kind: "plan", category: "bani", status: "revizuire", version: "0.4", date: "2026-11-13", reviewEveryDays: 30,
    summary: "Lista pașilor care nu se pot face din cod: îi face Daniel (sau contabilul, avocatul).",
    rules: [
      "Revizia avocatului (Termeni, Confidențialitate, retragerea din contract).",
      "Vercel Pro (planul gratuit nu e pentru vânzări).",
      "Codul CAEN potrivit pe PFA.",
      "Webhook-ul Stripe pe adresa fără redirecționare; domeniul fără www ca adresă principală în Vercel.",
      "Cheile în Vercel: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, CRON_SECRET, GOOGLE_CLIENT_ID/SECRET.",
    ],
    source: ["memoria proiectului: Still open"],
    governs: ["plati", "emailuri", "autonomie", "conturi"],
    open: ["Fiecare punct de mai sus, până e făcut"],
  },
  {
    id: "D18", title: "Pe ce rulează platforma", kind: "decizie", category: "tehnic", status: "activ", version: "1.1", date: "2026-11-11", reviewEveryDays: 180,
    summary: "Next.js pe Vercel, Neon (Postgres, conturi, stocare, timp real), pe planuri gratuite cât se poate. Fără Supabase.",
    rules: [
      "Funcțiile rulează în fra1 (Frankfurt), lângă baza Neon.",
      "Stocarea pozelor: bucket-ul Neon `assets`.",
      "Peste ~1.000 de oameni: fișierele pot trece pe Cloudflare R2 (din analiza de costuri).",
    ],
    source: ["PR #71", "analiza de costuri (PR #100)"],
    governs: ["infra", "documente"],
  },
  {
    id: "D19", title: "Domeniul și emailul site-ului", kind: "decizie", category: "tehnic", status: "revizuire", version: "1.0", date: "2026-11-13", reviewEveryDays: 60,
    summary: "carteaneamului.ro (ROTLD, serverele de nume Vercel); contact@ prin ImprovMX; emailurile site-ului prin Resend.",
    rules: ["Vercel redirecționează domeniul fără www spre www; în cod adresa site-ului e fără www.", "Emailurile site-ului pleacă prin Resend, cu RESEND_API_KEY și MAIL_FROM."],
    source: ["PR #66", "PR #101", "PR #103", "PR #108"],
    governs: ["emailuri", "contact", "plati"],
    open: ["De ales o singură adresă principală (cu sau fără www) în Vercel și în cod"],
  },
  {
    id: "D20", title: "Mod de lucru cu Claude", kind: "memorie", category: "lucru", status: "activ", version: "1.0", date: "2026-11-10", reviewEveryDays: 365,
    summary: "Claude face singur commit, push și merge; Daniel nu lucrează în terminal. Firele rulează cu efort mediu.",
    rules: ["Claude face commit, push și merge.", "Pașii care nu se pot desface (producție, ștergeri în masă, mesaje în afară) așteaptă acordul lui Daniel.", "După o oprire din limită, lucrul se reia singur."],
    source: ["memoria proiectului: mod-de-lucru"],
    governs: [],
  },
  {
    id: "D21", title: "Registrul funcțiilor și al dependențelor", kind: "registru", category: "autonomie", status: "activ", version: "1.0", date: "2026-11-14", reviewEveryDays: 30,
    summary: "Harta tuturor funcțiilor platformei, verificată la fiecare deschidere față de codul publicat, tabelele din baza de date și automatizări.",
    rules: [
      "Fiecare funcție nouă se trece în src/lib/cunostinte/functii.ts; testul cunostinte.test.ts pică dacă o legătură duce la un fișier care nu există.",
      "Ce nu se poate verifica apare ca „?”, nu ca bifat.",
      "Sănătatea funcțiilor intră în scorul din Autonomie (partea Dezvoltare).",
    ],
    source: ["acest PR"],
    governs: ["cunostinte"],
  },
  {
    id: "D22", title: "Monetizarea veche: 12 €/an pe arbore", kind: "plan", category: "bani", status: "arhivat", version: "0.1", date: "2026-11-05", reviewEveryDays: 365,
    summary: "Primul plan de bani (freemium, 12 €/an pe arbore, foaie de parcurs până în 2027). Înlocuit de regulile de plată din noiembrie.",
    rules: [],
    source: ["memoria proiectului: monetizare-si-plan"],
    governs: [],
    replacedBy: "D01",
  },
  {
    id: "D23", title: "Lada cu amintiri: ce urmează", kind: "plan", category: "familie", status: "ciorna", version: "0.2", date: "2026-11-06", reviewEveryDays: 60,
    summary: "Pașii 1–2, harta și capitolul „Cu vorbele lor” sunt gata. Urmează scrisorile sigilate și „Anul în amintiri”.",
    rules: ["Scrisori sigilate: se deschid la o dată aleasă.", "„Anul în amintiri”: rezumatul anului pentru familie."],
    source: ["PR #23–#25, #27"],
    governs: ["lada", "scrisori"],
    open: ["De hotărât când se fac scrisorile sigilate"],
  },
  {
    id: "D24", title: "Intrarea cu Google", kind: "plan", category: "securitate", status: "revizuire", version: "1.0", date: "2026-11-11", reviewEveryDays: 30,
    summary: "Codul e gata și publicat; butonul apare după ce Daniel pune cheile Google OAuth în Vercel.",
    rules: ["Contul Google intră fără parolă pe site; paza o face Google."],
    source: ["memoria proiectului: autentificare-google"],
    governs: ["conturi"],
    open: ["GOOGLE_CLIENT_ID și GOOGLE_CLIENT_SECRET în Vercel"],
  },
];

export const docById = (id: string) => DOCS.find((d) => d.id === id);
