/**
 * Harta funcțiilor platformei (Admin → Centru de cunoștințe → Harta funcțiilor). Fiecare funcție spune din ce e făcută:
 * motorul (fișierele din src/lib și componentele), paginile, adresele API, tabelele din baza de date, metrica, automatizările
 * din Autonomie, panoul din Admin, testele, cheile de mediu și documentele care o guvernează.
 *
 * Ce e scris aici e doar declarația. Pagina verifică la fiecare deschidere că fișierele și adresele există în codul publicat
 * (cod.json, scris la publicare de scripts/harta-cod.ts), că tabelele există în baza de date, că automatizările rulează și că
 * cheile sunt puse. Testul tests/cunostinte.test.ts pică dacă o legătură de aici nu duce nicăieri.
 *
 * O funcție nouă = un rând nou aici.
 */
import type { AutoKey } from "../autonomie";

export type Area = "familie" | "poveste" | "bani" | "conturi" | "comunicare" | "public" | "admin" | "sistem";
export type Lifecycle = "live" | "implementat" | "planificat" | "oprit";
export type Risk = "scazut" | "mediu" | "ridicat";

export const AREA: Record<Area, string> = {
  familie: "Arborele familiei", poveste: "Povești și amintiri", bani: "Bani și planuri", conturi: "Conturi și siguranță",
  comunicare: "Comunicare", public: "Site public", admin: "Panoul de admin", sistem: "Sistem",
};
export const LIFECYCLE: Record<Lifecycle, string> = { live: "Live", implementat: "Gata, așteaptă", planificat: "Planificat", oprit: "Oprit" };
export const RISK: Record<Risk, string> = { scazut: "Scăzut", mediu: "Mediu", ridicat: "Ridicat" };

export type Fn = {
  key: string;
  name: string;
  area: Area;
  lifecycle: Lifecycle;
  risk: Risk;
  riskWhy: string;
  what: string;
  /** Fișierele care fac treaba (src/lib/…, src/components/…). */
  engine: string[];
  /** Paginile pentru oameni (adrese din src/app). */
  pages?: string[];
  /** Adresele API / rutele fără pagină. */
  api?: string[];
  tables?: string[];
  /** Tabelul din care se numără metrica (rânduri, și în ultimele 30 de zile dacă are created_at). */
  metric?: { table: string; label: string };
  automations?: AutoKey[];
  /** Pagina din Admin unde se urmărește. */
  dashboard?: string;
  tests?: string[];
  /** Cheile de mediu fără de care funcția nu merge (doar dacă sunt puse sau nu; niciodată valoarea). */
  env?: string[];
  /** Ce hotărăște omul (nu se face singur). */
  human?: string;
};

export const FUNCTIONS: Fn[] = [
  // Arborele familiei
  {
    key: "arbore", name: "Arborele familiei", area: "familie", lifecycle: "live", risk: "mediu", riskWhy: "Datele de bază ale fiecărei familii; o greșeală se vede la toți.",
    what: "Persoane, părinți, căsătorii, frați, arborele desenat și editarea din profil (Familia apropiată).",
    engine: ["src/lib/tree-data.ts", "src/lib/family.ts", "src/lib/kinship.ts", "src/lib/relatives.ts", "src/lib/tree-layout.ts", "src/components/TreeScreen.tsx", "src/components/PersonForm.tsx"],
    pages: ["/arbore-nou", "/arbore/[id]", "/arbore/[id]/persoana/[pid]"],
    api: ["/api/arbore/[id]/live"],
    tables: ["tree", "tree_member", "person", "relationship", "raised_by"],
    metric: { table: "person", label: "persoane" },
    dashboard: "/admin/oameni",
    tests: ["tests/family.test.ts", "tests/kinship.test.ts", "tests/tree-fold.test.ts"],
  },
  {
    key: "spite", name: "Spițe și Copac 360°", area: "familie", lifecycle: "live", risk: "scazut", riskWhy: "Doar o vedere a datelor; nu schimbă nimic.",
    what: "Spița pe linia bărbătească, alegerea fiecăruia, Copacul cu două rădăcini și roata de 360°.",
    engine: ["src/lib/ancestry.ts", "src/lib/tree360.ts", "src/lib/fan-geometry.ts", "src/components/Tree360.tsx"],
    pages: ["/arbore/[id]"],
    tables: ["person", "relationship"],
    tests: ["tests/spite.test.ts", "tests/tree360.test.ts", "tests/ancestry.test.ts"],
  },
  {
    key: "invitatii", name: "Invitații și cereri de intrare", area: "familie", lifecycle: "live", risk: "ridicat", riskWhy: "Hotărăște cine vede și cine scrie în arborele unei familii.",
    what: "Invitații „să vadă” / „să scrie”, cereri de intrare după data nașterii, unirea arborilor.",
    engine: ["src/lib/invitations.ts", "src/lib/join.ts", "src/lib/merge.ts", "src/components/InvitePanel.tsx", "src/components/JoinTree.tsx"],
    pages: ["/invitatie/[token]", "/a/[code]"],
    tables: ["invitation", "join_request", "join_attempt", "tree_member"],
    metric: { table: "join_request", label: "cereri de intrare" },
    tests: ["tests/join.test.ts", "tests/merge.test.ts"],
  },
  {
    key: "istoric", name: "Istoric, limite și punere înapoi", area: "familie", lifecycle: "live", risk: "mediu", riskWhy: "Singura cale de a desface o ștergere greșită.",
    what: "Jurnalul schimbărilor din arbori, puse înapoi cu un clic, limite de editare pe persoană și pe arbore.",
    engine: ["src/lib/edit-log.ts", "src/lib/edit-limits.ts", "src/lib/admin-istoric.ts"],
    tables: ["audit_log"],
    metric: { table: "audit_log", label: "rânduri în jurnal" },
    dashboard: "/admin/istoric",
  },
  {
    key: "harta", name: "Harta neamului și Din aceleași locuri", area: "familie", lifecycle: "live", risk: "mediu", riskWhy: "Leagă familii străine după loc; cererea de legătură trebuie să rămână la alegere.",
    what: "Locurile familiei pe hartă, alte familii din aceleași sate și cererea de legătură.",
    engine: ["src/lib/map-data.ts", "src/lib/places.ts", "src/lib/shared-places.ts", "src/lib/place-key.ts", "src/components/FamilyMap.tsx", "src/components/NearbyFamilies.tsx"],
    pages: ["/arbore/[id]/harta"],
    tables: ["place_pin", "tree_place", "place_contact"],
    metric: { table: "place_pin", label: "locuri pe hartă" },
  },
  {
    key: "gedcom", name: "Import și export GEDCOM", area: "familie", lifecycle: "live", risk: "mediu", riskWhy: "Un import greșit poate umple un arbore cu dubluri.",
    what: "Aducerea unui arbore din alte programe și luarea lui oricând (gratuit).",
    engine: ["src/lib/gedcom.ts", "src/lib/gedcom-db.ts", "src/components/GedcomImport.tsx"],
    api: ["/api/arbore/[id]/gedcom"],
    tables: ["person", "relationship"],
  },
  // Povești și amintiri
  {
    key: "lada", name: "Lada cu amintiri", area: "poveste", lifecycle: "live", risk: "mediu", riskWhy: "Vocile și poveștile oamenilor; nu se pot reface dacă se pierd.",
    what: "Amintiri scrise și înregistrate, întrebări pentru bunici, răspunsuri și pomeniri.",
    engine: ["src/lib/lada.ts", "src/lib/lada-db.ts", "src/lib/questions.ts", "src/components/MemoryBox.tsx", "src/components/VoiceRecorder.tsx"],
    pages: ["/arbore/[id]/persoana/[pid]/la-bunici"],
    tables: ["memory", "memory_mention", "memory_reply", "memory_question"],
    metric: { table: "memory", label: "amintiri" },
  },
  {
    key: "scrisori", name: "Scrisori sigilate și Anul în amintiri", area: "poveste", lifecycle: "planificat", risk: "mediu", riskWhy: "Scrisori care se deschid la o dată: trebuie să nu se deschidă mai devreme.",
    what: "Următorii pași ai Lăzii cu amintiri (vezi D23).",
    engine: [],
    human: "Daniel hotărăște când se fac.",
  },
  {
    key: "carte", name: "Cartea de tipărit", area: "poveste", lifecycle: "live", risk: "mediu", riskWhy: "Se vinde (PDF 99 lei); greșelile ajung pe hârtie.",
    what: "Cartea neamului în limba aleasă, cu capitolul „Cu vorbele lor” și coduri QR.",
    engine: ["src/lib/book.ts", "src/lib/book-css.ts", "src/components/BookView.tsx"],
    pages: ["/arbore/[id]/carte"],
    tables: ["book_export"],
    metric: { table: "book_export", label: "cărți generate" },
    tests: ["tests/book.test.ts"],
  },
  {
    key: "autobiografie", name: "Autobiografia ghidată", area: "poveste", lifecycle: "live", risk: "mediu", riskWhy: "Conține capitolul de credință (date sensibile, acord separat).",
    what: "Povestea vieții, scrisă pe capitole, de tipărit.",
    engine: ["src/lib/autobiografie.ts", "src/components/AutoBook.tsx"],
    pages: ["/arbore/[id]/persoana/[pid]/autobiografie", "/arbore/[id]/persoana/[pid]/autobiografie/carte"],
    tables: ["consent"],
    tests: ["tests/autobiografie.test.ts"],
  },
  {
    key: "vremuri", name: "Povestea neamului și cronologia", area: "poveste", lifecycle: "live", risk: "scazut", riskWhy: "Texte istorice; se schimbă doar prin cod.",
    what: "Ce se întâmpla în lume și în regiune în anii fiecărui strămoș.",
    engine: ["src/lib/vremuri.ts", "src/lib/history.ts", "src/components/TimesStory.tsx"],
    pages: ["/arbore/[id]/cronologie"],
  },
  {
    key: "calatorie", name: "Călătoria în timp", area: "poveste", lifecycle: "live", risk: "scazut", riskWhy: "Epilogul se editează din Admin → Texte; regula de ton se aplică.",
    what: "Drumul cu nava prin generații, cu cuvântul de la final.",
    engine: ["src/lib/calatorie.ts", "src/lib/cuvant-final.ts", "src/lib/texte.ts", "src/components/TimeJourney.tsx"],
    pages: ["/arbore/[id]/calatorie"],
    dashboard: "/admin/texte",
    tests: ["tests/calatorie.test.ts"],
  },
  {
    key: "film", name: "Filmul vieții și pozele propuse", area: "poveste", lifecycle: "live", risk: "mediu", riskWhy: "Pozele familiilor pot ajunge pe prima pagină: doar cu acord și aprobare.",
    what: "Filmul din pozele unui profil și propunerea lor pentru prima pagină.",
    engine: ["src/lib/family-film.ts", "src/lib/home-submissions.ts", "src/components/FamilyFilm.tsx"],
    api: ["/api/admin/propunere/[id]"],
    tables: ["home_submission"],
    metric: { table: "home_submission", label: "poze propuse" },
    dashboard: "/admin/propuneri",
  },
  {
    key: "documente", name: "Poze, documente și arhiva", area: "poveste", lifecycle: "live", risk: "ridicat", riskWhy: "Fișierele oamenilor; accesul depinde de plan (Păstrare).",
    what: "Pozele, înregistrările și documentele vechi, în bucket-ul Neon, cu acces după plan.",
    engine: ["src/lib/storage.ts", "src/lib/file-type.ts", "src/lib/shrink-photo.ts"],
    pages: ["/arhiva"],
    api: ["/api/arbore/[id]/documente", "/api/document/[docId]"],
    tables: ["document", "document_link"],
    metric: { table: "document", label: "fișiere" },
    env: ["NEON_STORAGE_ENDPOINT_URL_S3", "NEON_STORAGE_ACCESS_KEY_ID", "NEON_STORAGE_SECRET_ACCESS_KEY"],
    dashboard: "/admin/infra",
  },
  // Bani și planuri
  {
    key: "plati", name: "Plata cu cardul (Stripe)", area: "bani", lifecycle: "live", risk: "ridicat", riskWhy: "Bani reali; confirmarea doar prin webhook semnat.",
    what: "Pagina de plată, sesiunea Stripe și confirmarea plății prin webhook.",
    engine: ["src/lib/plati.ts", "src/lib/plata.ts"],
    pages: ["/plata"],
    api: ["/api/plata/start", "/api/plata/stripe"],
    tables: ["payment", "account_plan"],
    metric: { table: "payment", label: "plăți" },
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    dashboard: "/admin/control",
    human: "Prețurile și pornirea vânzărilor le hotărăște Daniel.",
  },
  {
    key: "planuri", name: "Planuri, probă și limite", area: "bani", lifecycle: "live", risk: "ridicat", riskWhy: "Hotărăște cine poate scrie și cât; o greșeală blochează oameni care au plătit.",
    what: "Proba de 7 zile, Basic / Familie / Premium, Păstrarea, plafoanele și emailurile de aducere aminte.",
    engine: ["src/lib/plans.ts", "src/lib/plan-cache.ts", "src/lib/plan-names.ts", "src/lib/pastrare.ts", "src/components/AccessBanner.tsx"],
    api: ["/api/cron/aminteste-plata"],
    tables: ["account_plan", "app_setting"],
    metric: { table: "account_plan", label: "conturi cu plan" },
    automations: ["aminteste-proba", "aminteste-an"],
    dashboard: "/admin/control",
    human: "Pornirea emailurilor către oameni e cu acordul lui Daniel.",
  },
  {
    key: "arhiva-sigilata", name: "Arhiva sigilată după anul plătit", area: "bani", lifecycle: "live", risk: "ridicat", riskWhy: "Mută și micșorează fișierele familiilor; o greșeală pierde originale. Pornită doar din Admin, doar după emailuri.",
    what: "După anul plătit: originalele mai stau un an; cu cartea PDF trec comprimate în arhivă 5 ani, fără ea rămân pozele în mic. Anunțuri 30/7 și 90/30/7 zile, conturile vechi păstrează „nu se șterge nimic”.",
    engine: ["src/lib/arhivare.ts", "src/lib/storage.ts", "src/app/api/document/[docId]/route.ts"],
    pages: ["/arhiva", "/admin/arhiva"],
    tables: ["archive_plan", "document", "payment", "app_setting"],
    metric: { table: "archive_plan", label: "arbori programați" },
    automations: ["arhivare"],
    dashboard: "/admin/arhiva",
    tests: ["tests/arhivare.test.ts"],
    env: ["RESEND_API_KEY"],
    human: "Pornirea regulilor și termenii (1 an, 5 ani) îi hotărăște Daniel; textul din Termeni îl recitește avocatul.",
  },
  {
    key: "cadou", name: "Anul cadou și recomandări", area: "bani", lifecycle: "live", risk: "mediu", riskWhy: "Coduri care dau un an plătit.",
    what: "Cadoul de sărbători, cardul de tipărit și zilele pentru cine aduce o rudă.",
    engine: ["src/lib/cadou-sarbatori.ts"],
    pages: ["/cadou-de-sarbatori", "/cadou/[cod]", "/cadou/[cod]/card"],
    tables: ["gift", "referral_bonus"],
    metric: { table: "gift", label: "cadouri" },
  },
  {
    key: "carduri-cadou", name: "Carduri cadou prin magazine", area: "bani", lifecycle: "live", risk: "ridicat", riskWhy: "Coduri care dau abonament fără plată în site; paza e marcarea „vândut” și limita de încercări.",
    what: "Magazine partenere, loturi de coduri tipărite (CSV, PDF 85×55 mm cu QR), marcare vândut (admin sau magazinul cu PIN), activare pe /activeaza, raport cu comision, comutator general.",
    engine: ["src/lib/carduri-cadou.ts", "src/app/carduri-actions.ts"],
    pages: ["/activeaza", "/magazin/[token]", "/card/[token]", "/admin/carduri", "/admin/carduri/lot/[id]", "/admin/carduri/lot/[id]/tipar"],
    tables: ["partners", "gift_card_batches", "gift_cards", "gift_card_attempt", "app_setting", "audit_log"],
    metric: { table: "gift_cards", label: "carduri" },
    dashboard: "/admin/carduri",
    tests: ["tests/carduri-cadou.test.ts"],
  },
  {
    key: "city-partners", name: "City Partners (CRM parteneri)", area: "bani", lifecycle: "live", risk: "mediu", riskWhy: "Comisioane de plătit și conturi trecute pe parteneri.",
    what: "Magazine și firme de la prospect la activ: etape, filtre, județe, istoric de contact, pași cu termen, alertă 30 de zile, legătura de recomandare /r/<cod>, kit de tipar, raport lunar de plată.",
    engine: ["src/lib/parteneri-crm.ts", "src/app/parteneri-crm-actions.ts"],
    pages: ["/admin/parteneri", "/admin/parteneri/[id]", "/admin/parteneri/[id]/kit"],
    tables: ["partners", "partner_contact_log", "partner_referral", "payment"],
    metric: { table: "partners", label: "parteneri" },
    dashboard: "/admin/parteneri",
    tests: ["tests/carduri-cadou.test.ts"],
  },
  {
    key: "crm", name: "CRM (școli, firme, parteneri)", area: "admin", lifecycle: "live", risk: "mediu", riskWhy: "Ține adrese de instituții și lista „nu contacta”; o greșeală ar putea scrie cuiva care a refuzat.",
    what: "Organizații (doar adrese oficiale publice), activități, deal-uri, coada de aprobări și lista „nu contacta” (verificată înainte de orice email de marketing). Import idempotent din CSV și ingestie cu token pentru emailurile trimise din afară; aplicația nu trimite prospectare. Automatizări (oprite până le pornește Daniel): reactivarea celor „în risc” cu acord, mulțumirea ambasadorilor și ciornele de răspuns, ultimele două doar prin Aprobări. Campanii către organizații (șablon, limită pe zi, luni–vineri, fereastră orară, o trimitere pe organizație, dezabonare, urmărire livrat/deschis/click/nelivrat prin webhook-ul Resend). Răspunsurile citite din Gmail (doar citire, doar de la organizațiile din CRM). Legătura cu banii: conturi aduse (link ?src=, cod NEAM-XXXX, codul școlii), plăți, venit, „client” la prima plată. Sarcini cu termen în „Azi” (automat: de sunat la nelivrat, răspunde la pozitiv) și rezumatul de dimineață. Rapoarte: pâlnia contactat → răspuns → interesat → client cu filtre și rezultatele pe șablon. Profesori ambasadori: link/cod/clasă, elevi aduși, plătitori, recompensă după reguli. Curățenie: dubluri cu previzualizare, istoricul modificărilor, export CSV, ștergere GDPR.",
    engine: ["src/lib/crm.ts", "src/lib/crm-import.ts", "src/lib/crm-ingest.ts", "src/lib/crm-admin.ts", "src/app/crm-actions.ts", "src/components/admin/CrmImport.tsx", "src/components/PartnershipForm.tsx", "src/lib/crm-scor.ts", "src/lib/crm-auto.ts", "src/lib/crm-campanii.ts", "src/app/crm-public-actions.ts", "src/lib/crm-gmail.ts", "src/lib/crm-bani.ts", "src/lib/crm-sarcini.ts", "src/lib/crm-rapoarte.ts", "src/lib/crm-ambasadori.ts", "src/lib/crm-curatenie.ts", "src/lib/crm-sanatate.ts", "scripts/crm-proba.ts"],
    pages: ["/admin/crm", "/admin/crm/org/[id]", "/parteneriate", "/dezabonare-organizatie"],
    api: ["/api/admin/crm/ingest", "/api/crm/o", "/api/crm/c", "/api/crm/dezabonare", "/api/crm/resend", "/api/cron/crm", "/api/cron/crm-dimineata", "/api/admin/crm/gmail/start", "/api/admin/crm/gmail/callback", "/api/admin/crm/export"],
    tables: ["crm_organizations", "crm_contacts", "crm_activities", "crm_deals", "crm_approvals", "crm_suppression", "crm_user_signals", "crm_templates", "crm_campaigns", "crm_sends", "crm_org_accounts", "crm_tasks", "crm_ambassadors", "crm_ambassador_accounts", "crm_ambassador_payouts"],
    metric: { table: "crm_organizations", label: "organizații" },
    dashboard: "/admin/crm",
    automations: ["crm-scor", "crm-reactivare", "crm-ambasador", "crm-ciorne", "crm-campanii", "crm-gmail", "crm-dimineata"],
    tests: ["tests/crm.test.ts", "tests/crm-admin.test.ts", "tests/crm-scor.test.ts", "tests/crm-auto.test.ts", "tests/crm-campanii.test.ts", "tests/crm-gmail.test.ts", "tests/crm-bani.test.ts", "tests/crm-sarcini.test.ts", "tests/crm-rapoarte.test.ts", "tests/crm-ambasadori.test.ts", "tests/crm-curatenie.test.ts", "tests/crm-sanatate.test.ts"],
    env: ["CRM_INGEST_TOKEN", "RESEND_WEBHOOK_SECRET", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "CRM_TEST_RECIPIENT"],
    human: "Pune CRM_INGEST_TOKEN în Vercel (cel puțin 16 semne) și dă-l asistentului care trimite emailurile.",
  },
  // Conturi și siguranță
  {
    key: "conturi", name: "Conturi și intrare", area: "conturi", lifecycle: "live", risk: "ridicat", riskWhy: "Intrarea în cont; o greșeală închide oamenii afară.",
    what: "Cont cu email și parolă, parola uitată, intrarea cu Google (după chei).",
    engine: ["src/lib/auth.ts", "src/lib/account.ts", "src/lib/parola-uitata.ts", "src/components/AuthForm.tsx"],
    pages: ["/intrare", "/intrare/parola-uitata", "/intrare/parola-noua"],
    api: ["/api/auth/[...all]"],
    tables: ["user", "session", "account", "verification"],
    metric: { table: "user", label: "conturi" },
    env: ["BETTER_AUTH_SECRET"],
    dashboard: "/admin/oameni",
    tests: ["tests/account.test.ts"],
  },
  {
    key: "google", name: "Intrarea cu Google", area: "conturi", lifecycle: "live", risk: "mediu", riskWhy: "Depinde de cheile Google.",
    what: "Butonul „Continuă cu Google” (codul e publicat).",
    engine: ["src/lib/auth.ts"],
    api: ["/api/auth/[...all]"],
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    human: "Daniel pune cheile Google OAuth în Vercel.",
  },
  {
    key: "securitate", name: "Securitatea conturilor", area: "conturi", lifecycle: "live", risk: "ridicat", riskWhy: "Paza conturilor și a panoului de admin.",
    what: "Verificarea în 2 pași, blocarea după încercări greșite, emailul la dispozitiv nou, alertele.",
    engine: ["src/lib/securitate.ts", "src/lib/securitate-mail.ts", "src/lib/admin-securitate.ts", "src/components/SecuritySettings.tsx"],
    pages: ["/securitate"],
    tables: ["two_factor", "security_event", "known_device"],
    metric: { table: "security_event", label: "evenimente de securitate" },
    dashboard: "/admin/securitate",
  },
  {
    key: "gdpr", name: "Datele mele, acorduri și ștergere", area: "conturi", lifecycle: "live", risk: "ridicat", riskWhy: "Obligații legale (GDPR).",
    what: "Exportul datelor, ștergerea contului, acordurile, Termenii și Confidențialitatea în 9 limbi.",
    engine: ["src/lib/legal.ts", "src/lib/consent.ts", "src/components/MyDataTools.tsx", "src/components/CookieNotice.tsx"],
    pages: ["/datele-mele", "/confidentialitate", "/termeni"],
    api: ["/api/datele-mele"],
    tables: ["consent"],
    metric: { table: "consent", label: "acorduri" },
    human: "Revizia avocatului.",
  },
  {
    key: "folosire", name: "Timpul petrecut (doar cu acord)", area: "conturi", lifecycle: "live", risk: "mediu", riskWhy: "Măsurare a oamenilor: doar cu acordul lor.",
    what: "Secundele pe secțiuni, doar pentru cine a spus „Bine”.",
    engine: ["src/lib/usage.ts", "src/components/UsageBeat.tsx"],
    api: ["/api/folosire"],
    tables: ["usage_day"],
    metric: { table: "usage_day", label: "zile măsurate" },
    dashboard: "/admin/oameni",
  },
  // Comunicare
  {
    key: "emailuri", name: "Emailurile site-ului (Resend)", area: "comunicare", lifecycle: "live", risk: "mediu", riskWhy: "Fără ele nu pleacă resetarea parolei, alertele și aducerile aminte.",
    what: "Trimiterea emailurilor: parolă uitată, alerte de securitate, plăți, aduceri aminte, răspunsuri.",
    engine: ["src/lib/email.ts", "src/lib/emailuri.ts", "src/lib/email-domeniu.ts"],
    env: ["RESEND_API_KEY"],
    dashboard: "/admin/email",
    tests: ["tests/email.test.ts", "tests/email-domeniu.test.ts"],
  },
  {
    key: "contact", name: "Pagina de contact", area: "comunicare", lifecycle: "live", risk: "scazut", riskWhy: "Formular simplu, adresa e ascunsă.",
    what: "WhatsApp și formularul de email.",
    engine: ["src/lib/contact.ts", "src/components/ContactForm.tsx"],
    pages: ["/contact"],
  },
  {
    key: "mesaje", name: "Mesaje între rude", area: "comunicare", lifecycle: "live", risk: "mediu", riskWhy: "Conversații private.",
    what: "Mesajele din arbore, între oamenii din aceeași familie.",
    engine: ["src/lib/chat.ts", "src/components/ChatBox.tsx"],
    pages: ["/mesaje", "/mesaje/[treeId]/[userId]"],
    tables: ["message"],
    metric: { table: "message", label: "mesaje" },
    tests: ["tests/chat.test.ts"],
  },
  {
    key: "probleme", name: "Probleme raportate", area: "comunicare", lifecycle: "live", risk: "scazut", riskWhy: "Doar comunicare; închiderea automată cere aprobare.",
    what: "„Raportează o problemă” cu poze, răspunsul din Admin și închiderea celor lămurite.",
    engine: ["src/lib/probleme.ts", "src/components/ProblemForm.tsx"],
    pages: ["/problema"],
    api: ["/api/problema", "/api/problema/[id]/[n]"],
    tables: ["problem_report"],
    metric: { table: "problem_report", label: "probleme" },
    automations: ["probleme-vechi"],
    dashboard: "/admin/probleme",
  },
  {
    key: "parteneri", name: "Parteneri (PropManage)", area: "comunicare", lifecycle: "live", risk: "ridicat", riskWhy: "Date trimise unui terț; doar cu acord separat.",
    what: "Acordul pentru parteneri, exportul emailurilor, dezabonarea, Casa bătrânească.",
    engine: ["src/lib/partners.ts", "src/lib/partners-shared.ts", "src/lib/old-house.ts", "src/components/PartnersView.tsx"],
    pages: ["/parteneri", "/parteneri/dezabonare"],
    api: ["/api/parteneri/[partner]/export", "/api/parteneri/dezabonare"],
    tables: ["partner_consent", "old_house"],
    metric: { table: "partner_consent", label: "acorduri pentru parteneri" },
    tests: ["tests/parteneri.test.ts"],
  },
  {
    key: "propmanage-cont", name: "Cont gratuit PropManage după card", area: "comunicare", lifecycle: "live", risk: "ridicat", riskWhy: "Numele și emailul pleacă la altă firmă; doar cu bifa separată, nebifată.",
    what: "Caseta de după „Gata! Cardul este activat” și din Datele mele: bifă de acord, POST semnat HMAC la PropManage, linkul /cont-cadou într-un tab nou, „Conturi PropManage” pe magazin și pe lot, comutator separat (oprit).",
    engine: ["src/lib/propmanage-cont.ts", "src/app/propmanage-actions.ts", "src/components/PropManageOffer.tsx", "src/components/admin/PropManageAdmin.tsx"],
    pages: ["/activeaza", "/datele-mele", "/admin/carduri"],
    tables: ["propmanage_invite", "app_setting"],
    env: ["PROPMANAGE_INVITE_URL", "PARTNER_SHARED_SECRET"],
    metric: { table: "propmanage_invite", label: "cereri de cont PropManage" },
    dashboard: "/admin/carduri",
    tests: ["tests/propmanage-cont.test.ts"],
  },
  {
    key: "adn", name: "Resurse și cererile de test ADN", area: "comunicare", lifecycle: "live", risk: "mediu", riskWhy: "Fără date genetice; doar cererea de contact.",
    what: "/resurse-genealogie: surse gratuite și formularul ADN.",
    engine: ["src/lib/resurse.ts", "src/components/DnaForm.tsx"],
    pages: ["/resurse-genealogie"],
    tables: ["dna_request", "dna_lab"],
    metric: { table: "dna_request", label: "cereri ADN" },
    dashboard: "/admin/adn",
    tests: ["tests/resurse.test.ts"],
  },
  {
    key: "surse-publice", name: "Surse publice (arhive gratuite)", area: "familie", lifecycle: "live", risk: "scazut",
    riskWhy: "Doar linkuri ieșite, fără date preluate de pe alte site-uri și fără date din arbore în adresă; emailul e oprit implicit.",
    what: "Ghidul /surse-publice, cardul „Caută în arhive publice” din fișa strămoșilor de dinainte de 1930 cu date lipsă (Copiază datele, Am găsit ceva, Nu mai arăta), câmpul „Sursa informației” și emailul unic.",
    engine: ["src/lib/surse-publice.ts", "src/lib/surse-publice-db.ts", "src/components/ArchiveHint.tsx", "src/components/InfoSource.tsx"],
    pages: ["/surse-publice", "/arbore/[id]"],
    tables: ["archive_hint_dismissal", "person"],
    automations: ["surse-publice"],
    dashboard: "/admin/surse-publice",
    tests: ["tests/surse-publice.test.ts"],
    env: ["RESEND_API_KEY"],
    human: "Daniel pornește emailul din Admin → Autonomie și verifică linkurile surselor.",
  },
  // Site public
  {
    key: "home", name: "Prima pagină", area: "public", lifecycle: "live", risk: "mediu", riskWhy: "Prima impresie; pozele familiilor doar cu acord.",
    what: "Pagina pentru vizitatori, bannerul, galeria și prețurile.",
    engine: ["src/lib/home-images.ts", "src/lib/home-variants.ts", "src/lib/home-jsonld.ts", "src/components/Landing.tsx"],
    pages: ["/"],
    api: ["/api/poza-acasa/[id]", "/api/admin/poze"],
    dashboard: "/admin/poze",
  },
  {
    key: "seo-pagini", name: "Pagini publice și Google", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Texte publice, fără date ale oamenilor.",
    what: "Nume de familie, localități (județe și toate cele 3.180 de comune, orașe și municipii, cu satele, populația 2021, vecinii și familiile cu rădăcini acolo de la 5 arbori), ghiduri, glosar, sitemap-uri, pragul de indexare (noindex pentru paginile subțiri) motorul de publicare (coadă seo_queue, control de calitate, Wikipedia rescris cu atribuire, ritm 50→200 pe zi) și centrul SEO pe file: Prezentare, Cuvinte cheie, Pagini, Indexare, Secțiuni, Inspector URL, Sitemap, Alerte, Setări, cu CSV. Din 18.11.2026: data din sitemap („lastmod”) e ziua în care s-a schimbat cu adevărat fiecare pagină (amprenta conținutului în src/data/seo-versiuni.json, actualizată cu npx tsx scripts/seo-versiuni.ts), fără changefreq/priority; adresele pe limbi fără traducere (/en/nume…) trimit cu 308 la pagina în română; robots.txt fără Host și cu /cauta?, ?src=, ?utm_ oprite; flux RSS al ghidurilor la /ghid/feed.xml. Tot din 18.11.2026: /cadouri, hubul darurilor, cu 14 pagini pe ocazii și 10 pe destinatari (src/lib/cadouri.ts), prețurile din Admin, ordinea pe sezoane din src/lib/seo/sezon.ts (acum Crăciunul primul; /cadouri/craciun duce la /cadou-de-sarbatori).",
    engine: ["src/lib/seo.ts", "src/lib/seo-audit.ts", "src/lib/seo-inspector.ts", "src/lib/seo-cuvinte.ts", "src/lib/seo-clustere.ts", "src/lib/continut/prag.ts", "src/lib/continut/uat.ts", "src/lib/continut/uat-text.ts", "src/lib/continut/localitati-statistici.ts", "src/lib/motor-seo/motor.ts", "src/lib/motor-seo/calitate.ts", "src/lib/motor-seo/wikipedia.ts", "src/lib/public-pages.ts", "src/lib/page-metadata.ts", "src/lib/seo/versiuni.ts", "src/lib/seo/amprente.ts", "src/lib/traduceri-reale.ts", "src/lib/continut/rss.ts", "src/lib/cadouri.ts", "src/lib/seo/sezon.ts"],
    pages: ["/nume", "/nume/[slug]", "/localitati", "/localitati/[judet]", "/localitati/[judet]/[localitate]", "/ghid", "/ghid/[slug]", "/glosar", "/glosar/[slug]"],
    api: ["/sitemap.xml", "/sitemaps/[file]", "/admin/seo/csv", "/ghid/feed.xml"],
    automations: ["sitemap", "motor-seo"],
    dashboard: "/admin/seo",
    tests: ["tests/seo.test.ts", "tests/localitati.test.ts", "tests/localitati-statistici.test.ts", "tests/motor-seo.test.ts", "tests/seo-etapa1.test.ts", "tests/cadouri.test.ts"],
    env: ["GSC_SERVICE_ACCOUNT_JSON"],
  },
  {
    key: "diaspora", name: "Pagini pentru diaspora", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Texte publice, fără date ale oamenilor; regula de ton (D06) se aplică.",
    what: "/diaspora: 18 țări (istoria emigrației, acte din România cerute din străinătate, arhive locale, comunități), cele 50 de state SUA și 13 provincii canadiene (în Google doar cele cu text propriu), orașe mari și 4 pagini speciale (rădăcini evreiești, moldoveni în Italia și Israel, sași și șvabi, maghiari din Transilvania). Fiecare pagină e scrisă în ro, en și limba țării (it, es, de, fr, he, hu), cu hreflang; în index intră ca un singur fișier, /sitemap-diaspora.xml (fișierele pe limbă /sitemaps/diaspora-<limbă>.xml rămân). Din 17.11.2026 cele 7 țări mari (Italia, Spania, Germania, Marea Britanie, SUA, Canada, Israel) au și ghid propriu, ambasada și consulatele verificate în surse oficiale, particularități și întrebări frecvente (FAQPage), în src/lib/diaspora/extins.ts. Butonul de cont nou poartă ?src=diaspora-<pagină>; Admin → SEO → Diaspora arată afișări, clicuri, poziții și conturi pe țară și oraș.",
    engine: ["src/lib/diaspora/index.ts", "src/lib/diaspora/tari.ts", "src/lib/diaspora/america.ts", "src/lib/diaspora/teme.ts", "src/lib/diaspora/ui.ts", "src/lib/diaspora/extins.ts", "src/components/diaspora/DiasporaPages.tsx"],
    pages: ["/diaspora", "/diaspora/[a]", "/diaspora/[a]/[b]"],
    api: ["/sitemaps/[file]", "/sitemap-diaspora.xml"],
    tests: ["tests/diaspora.test.ts"],
  },
  {
    key: "genealogie-orase", name: "Genealogie pe orașe mari", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Texte publice, fără date ale oamenilor; regula de ton (D06) se aplică.",
    what: "/genealogie și /genealogie/<oraș> pentru 10 orașe mari (București, Cluj-Napoca, Iași, Timișoara, Brașov, Constanța, Craiova, Oradea, Sibiu, Galați): numele vechi ale orașului, confesiunile și registrele lor, arhiva județeană, numele frecvente din regiune, comunele din jur, întrebări frecvente (FAQPage), buton WhatsApp. Sub 300 de cuvinte proprii pagina e noindex. Legăturile spre paginile regionale (/genealogie/regiune/<regiune>) apar când REGION_PAGES_LIVE devine true. Butonul de cont nou poartă ?src=genealogie-<oraș>.",
    engine: ["src/lib/genealogie-orase.ts", "src/components/continut/GenealogieOrase.tsx"],
    pages: ["/genealogie", "/genealogie/[oras]"],
    tests: ["tests/genealogie-orase.test.ts"],
  },
  {
    key: "genealogie-regiuni", name: "Genealogie pe regiuni istorice", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Texte publice, fără date ale oamenilor; regula de ton (D06) se aplică.",
    what: "/genealogie/regiune/<regiune> pentru Transilvania, Banat, Bucovina, Basarabia, Moldova, Dobrogea și Maramureș: istoria administrativă, limbile și confesiunile registrelor, unde sunt actele azi, pași de lucru, FAQPage; legături spre județe, orașe, nume și ghiduri. Paginile de județ și de oraș trimit la regiune. Butonul de cont nou poartă ?src=regiune-<regiune>.",
    engine: ["src/lib/genealogie-regiuni.ts", "src/components/continut/GenealogieRegiuni.tsx"],
    pages: ["/genealogie/regiune/[regiune]"],
    tests: ["tests/genealogie-regiuni.test.ts"],
  },
  {
    key: "istorie", name: "Istoria umanității și paginile istorice", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Regula de ton (D06) se aplică.",
    what: "/istoria-umanitatii, /genealogii-vechi, /libertatea-de-a-crede.",
    engine: ["src/lib/firul-vremii.ts", "src/lib/adam-hristos.ts", "src/lib/istoria-bisericii.ts"],
    pages: ["/istoria-umanitatii", "/genealogii-vechi", "/libertatea-de-a-crede"],
    tests: ["tests/adam-hristos.test.ts", "tests/istoria-bisericii.test.ts"],
  },
  {
    key: "traduceri", name: "Cele 10 limbi", area: "public", lifecycle: "live", risk: "mediu", riskWhy: "Un text lipsă dintr-o limbă strică pagina în acea limbă; o regulă greșită în middleware poate trimite Google pe altă pagină.",
    what: "Traducerea întregii platforme, alegerea limbii (steag și nume în antet), adresele pe limbă (/it/, /en/, /he/…) cu hreflang și canonical, limba ghicită la prima vizită (browserul, apoi țara; româna oriunde în browser câștigă) cu întrebarea „Vezi site-ul în …?”, roboții niciodată redirecționați, prețuri în moneda locală (comutator în Admin → Planuri).",
    engine: ["src/i18n/locales.ts", "src/i18n/server.ts", "src/middleware.ts", "src/lib/page-metadata.ts", "src/components/LanguagePicker.tsx", "src/components/LanguageSuggest.tsx", "src/components/UntranslatedNote.tsx", "src/lib/plati.ts"],
    tests: ["tests/i18n.test.ts", "tests/limba-detectata.test.ts"],
  },
  {
    key: "analiza", name: "Analiza traficului", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Anonim, fără cookie.",
    what: "Vizite, surse, campanii, țări, județe și orașe (fără IP), drumul vizită → cont → arbore → plată și conversiile (cont, arbore, clic pe buton, plată) numărate la sursa și pagina vizitei, fără legătură cu contul.",
    engine: ["src/lib/vizite.ts", "src/lib/analiza.ts", "src/lib/conversii.ts", "src/lib/cta.ts", "src/components/VisitBeacon.tsx", "src/components/admin/AnalizaConversii.tsx"],
    api: ["/api/vizita", "/admin/analiza/csv"],
    tables: ["page_view", "visit_salt", "conversion"],
    metric: { table: "page_view", label: "zile-pagină numărate" },
    automations: ["curatenie"],
    dashboard: "/admin/analiza",
    tests: ["tests/analiza.test.ts"],
  },
  {
    key: "sursa-cont", name: "De unde vine fiecare cont nou", area: "public", lifecycle: "live", risk: "mediu", riskWhy: "Date personale pe cont; cookie-urile de analiză doar cu „Accept” (GDPR).",
    what: "Linkuri ?src= și utm_…, cookie first-touch și last-touch (30 de zile) doar cu acordul pentru analiză, sursa, referrer-ul, pagina de intrare, dispozitivul și țara puse pe cont, întrebarea „De unde ai aflat de noi?”, invitațiile ca recomandare; coloana și filtrul în Oameni, Analiză → Surse și generatorul de linkuri.",
    engine: ["src/lib/sursa.ts", "src/lib/sursa-shared.ts", "src/components/SourceTracker.tsx", "src/components/CookieNotice.tsx", "src/components/CookieChoice.tsx", "src/components/admin/AnalizaSurse.tsx", "src/components/AuthForm.tsx"],
    pages: ["/admin/linkuri", "/admin/analiza", "/admin/oameni", "/admin/oameni/[id]"],
    tables: ["account_source", "source_link"],
    metric: { table: "account_source", label: "conturi cu sursa notată" },
    dashboard: "/admin/linkuri",
    tests: ["tests/sursa.test.ts"],
    human: "Daniel face linkurile pentru fiecare grup sau campanie în Admin → Linkuri cu sursă (și „Generează linkuri pentru grupuri Facebook”).",
  },
  {
    key: "activare", name: "Activarea: primii pași, emailul de 24 h și invitația pe ramură", area: "comunicare", lifecycle: "live", risk: "mediu", riskWhy: "Scrie oamenilor (email) și le arată un îndemn în arbore; doar conturi reale, cu dezabonare.",
    what: "După înscriere omul ajunge direct la primii pași (3 câmpuri pe ecran); cine n-are arbore după 24 h primește o dată un email cu legătura; după 5 persoane, pe arbore apare „Invită-l pe … să completeze ramura lui”; bifa „Vreau sfaturi utile pe email” la înscriere și al doilea prilej după primul arbore; conturile de test (demo, @example.com, test-link-…) ascunse din toate cifrele.",
    engine: ["src/lib/activare.ts", "src/lib/activare-shared.ts", "src/lib/invita-ramura.ts", "src/lib/conturi-test.ts", "src/components/QuickStart.tsx", "src/components/BranchInvite.tsx", "src/components/BranchInviteBox.tsx", "src/components/NewsNotice.tsx"],
    pages: ["/", "/primii-pasi", "/arbore/[id]", "/admin/crestere"],
    tables: ["automation_mark", "consent", "invitation"],
    automations: ["activare", "bun-venit"],
    dashboard: "/admin/crestere",
    tests: ["tests/activare.test.ts"],
    env: ["RESEND_API_KEY"],
  },
  {
    key: "scoli", name: "Pentru școli: fișe gratuite, coduri pe clasă, arborele de tipărit", area: "bani", lifecycle: "live", risk: "mediu", riskWhy: "Face coduri de reducere în Stripe; codurile se fac doar după aprobarea manuală din Admin.",
    what: "/scoala cu paginile pe clase (a III-a, a IV-a, gimnaziu-istorie), fișe PDF gratuite și kitul profesorului (PDF + Word), fișele completabile pe ecran cu cont, formularul „Vreau coduri pentru clasa mea”, Admin → Școli (aprobare, cod Stripe pe clasă cu procent, folosiri și expirare, conturi și plăți pe cod), linkul /scoala-cod/<COD> care ține minte codul și îl pune singur la plată, butonul „Printează pentru proiectul de la școală” (A4/A3).",
    engine: ["src/lib/scoli.ts", "src/lib/scoala.ts", "src/app/scoala-actions.ts", "src/components/scoala/SchoolPageView.tsx", "src/components/scoala/SchoolRequestForm.tsx", "src/components/scoala/SheetEditor.tsx", "scripts/fise-scoala.cjs", "scripts/fise-scoala-docx.py"],
    pages: ["/scoala", "/scoala/[slug]", "/scoala/fisa/[slug]", "/scoala-cod/[cod]", "/arbore/[id]/scoala", "/admin/scoli"],
    tables: ["school_request", "school", "school_code", "school_signup", "school_payment"],
    dashboard: "/admin/scoli",
    tests: ["tests/scoli.test.ts"],
    env: ["STRIPE_SECRET_KEY"],
  },
  {
    key: "autoritate", name: "Autoritate: presă, widgetul „Arborele meu”, raportul SEO săptămânal", area: "public", lifecycle: "live", risk: "scazut",
    riskWhy: "Widgetul arată doar cifre (persoane, generații, cel mai vechi an, locuri), fără nume și fără cei în viață; îl pornește doar proprietarul sau un editor.",
    what: "/presa (kit de presă cu cifre din conținut, unghiuri de articol, sigla, contact), /arborele-meu (prezentarea widgetului cu exemplu), /arbore/<id>/widget (pornire, titlu, cod de pus pe blog), /widget/arbore/<cod> (fișa din iframe, singura adresă care se poate pune pe alte site-uri), Admin → SEO → Raport săptămânal (7 zile față de 7, secțiuni, mișcări, de făcut, istoric 26 de săptămâni salvat lunea de ceasul zilnic) și cuvintele țintă noi.",
    engine: ["src/lib/autoritate.ts", "src/lib/widget-arbore.ts", "src/lib/seo-raport.ts", "src/lib/seo-cuvinte.ts"],
    pages: ["/presa", "/arborele-meu", "/arbore/[id]/widget", "/admin/seo"],
    api: ["/widget/arbore/[token]", "/api/cron/autonomie"],
    tables: ["app_setting"],
    dashboard: "/admin/seo",
    tests: ["tests/autoritate.test.ts"],
  },
  // Admin
  {
    key: "admin", name: "Panoul de admin", area: "admin", lifecycle: "live", risk: "ridicat", riskWhy: "Acces la tot; cere verificarea în 2 pași.",
    what: "Meniul, rezumatul zilei, Oamenii, Business și Manager control.",
    engine: ["src/lib/admin.ts", "src/lib/admin-access.ts", "src/lib/admin-menu.ts", "src/lib/admin-briefing.ts", "src/lib/admin-stats.ts", "src/components/admin/AdminShell.tsx"],
    pages: ["/admin", "/admin/oameni", "/admin/business", "/admin/control"],
    tables: ["app_setting"],
    dashboard: "/admin",
    tests: ["tests/admin.test.ts", "tests/admin-people.test.ts"],
  },
  {
    key: "cunostinte", name: "Centru de cunoștințe și harta funcțiilor", area: "admin", lifecycle: "live", risk: "scazut", riskWhy: "Doar citește; schimbă doar starea documentelor.",
    what: "Documentele, harta funcțiilor și a dependențelor, verificate față de cod și baza de date.",
    engine: ["src/lib/cunostinte/documente.ts", "src/lib/cunostinte/functii.ts", "src/lib/cunostinte/verificare.ts", "scripts/harta-cod.ts"],
    pages: ["/admin/cunostinte", "/admin/cunostinte/functii", "/admin/cunostinte/dependente"],
    api: ["/admin/cunostinte/export"],
    tables: ["app_setting"],
    dashboard: "/admin/cunostinte",
    tests: ["tests/cunostinte.test.ts"],
  },
  // Sistem
  {
    key: "autonomie", name: "Autonomie și bucla zilnică", area: "sistem", lifecycle: "live", risk: "mediu", riskWhy: "Rulează singură; ce atinge oameni sau bani cere acord.",
    what: "Scorul, automatizările cu comutator, aprobările și ceasul zilnic.",
    engine: ["src/lib/autonomie.ts", "src/components/admin/AutonomyForms.tsx"],
    api: ["/api/cron/autonomie"],
    tables: ["automation_run", "automation_mark", "autonomy_snapshot"],
    metric: { table: "automation_run", label: "rulări" },
    automations: ["sanatate", "curatenie"],
    env: ["CRON_SECRET"],
    dashboard: "/admin/autonomie",
    tests: ["tests/autonomie.test.ts"],
  },
  {
    key: "infra", name: "Sănătate, erori și migrații", area: "sistem", lifecycle: "live", risk: "mediu", riskWhy: "Dacă pică, nu mai vede nimeni erorile.",
    what: "Erorile de pe server în jurnal, starea bazei, migrațiile la publicare, cheile de mediu.",
    engine: ["src/lib/errors.ts", "src/instrumentation.ts", "src/lib/verificari.ts", "scripts/deploy-db.ts", "scripts/masoara-viteza.ts", "scripts/test-incarcare.ts"],
    api: ["/api/stare", "/api/ping"],
    tables: ["audit_log"],
    automations: ["sanatate"],
    env: ["DATABASE_URL"],
    dashboard: "/admin/infra",
  },
  {
    key: "timp-real", name: "Arborele în timp real", area: "sistem", lifecycle: "live", risk: "scazut", riskWhy: "Fără el arborele merge, doar nu se actualizează singur.",
    what: "Schimbările făcute de o rudă apar imediat la celelalte (Neon Realtime).",
    engine: ["src/lib/realtime.ts", "src/components/LiveTree.tsx"],
    api: ["/api/arbore/[id]/live"],
    env: ["NEON_REALTIME_URL", "NEON_REALTIME_SECRET"],
  },
  {
    key: "aplicatie", name: "Aplicația de telefon (PWA)", area: "sistem", lifecycle: "live", risk: "scazut", riskWhy: "Doar o scurtătură spre site.",
    what: "Instalarea pe ecranul telefonului.",
    engine: ["src/components/InstallApp.tsx"],
  },
  // Creșterea fără reclame plătite (Daniel, 14 noiembrie 2026; src/lib/crestere.ts)
  {
    key: "invitatii-distribuite", name: "Invitația pe WhatsApp, email și „Trimite”", area: "comunicare", lifecycle: "live", risk: "scazut", riskWhy: "Doar butoane lângă linkul care exista deja.",
    what: "Linkul de invitație pleacă dintr-un clic, cu un mesaj cald gata scris în limba omului și cu semnul „invitatie” pentru Analiză.",
    engine: ["src/components/InvitePanel.tsx", "src/lib/crestere.ts"],
    tables: ["invitation"], metric: { table: "invitation", label: "invitații făcute" }, dashboard: "/admin/crestere",
  },
  {
    key: "sfaturi-email", name: "Sfaturi pe email (bun venit)", area: "comunicare", lifecycle: "implementat", risk: "mediu", riskWhy: "Le scrie oamenilor; doar cu acordul lor și oprit până îl pornește Daniel.",
    what: "5 emailuri în primele 3 săptămâni, doar celor care au spus „Da”, cu dezabonare dintr-un clic.",
    engine: ["src/lib/crestere.ts", "src/components/NewsNotice.tsx", "src/app/vesti-actions.ts"],
    pages: ["/dezabonare"], api: ["/api/vesti/dezabonare"], tables: ["consent", "automation_mark"],
    automations: ["bun-venit"], dashboard: "/admin/crestere", env: ["RESEND_API_KEY"], tests: ["tests/crestere.test.ts"],
    human: "Citește textele și pornește automatizarea „Email: sfaturi de bun venit”.",
  },
  {
    key: "conversie-gratuit-platit", name: "Din gratuit în plătit (emailuri, reducere, pop-up)", area: "bani", lifecycle: "implementat", risk: "mediu",
    riskWhy: "Le scrie oamenilor și face coduri de reducere în Stripe; oprit până îl pornește Daniel, cu dezabonare în fiecare email.",
    what: "Emailurile din zilele gratuite (ziua 1, 3, 5, 7, 8, 14) în limba omului, cu deschideri și clicuri; codul unic de reducere (20%, 48 h, o folosire) aplicat singur la plată; banda cu zilele, fereastra din ultima zi, „Activează un plan” și descărcarea GEDCOM închisă după expirare (fără să se șteargă nimic).",
    engine: ["src/lib/conversie.ts", "src/lib/conversie-mail.ts", "src/components/AccessBanner.tsx", "src/components/LastDayPopup.tsx", "src/components/admin/ConversieStats.tsx"],
    pages: ["/admin/conversie", "/dezabonare"], api: ["/api/conversie/o", "/api/conversie/c", "/api/vesti/dezabonare", "/api/plata/start", "/api/plata/stripe"],
    tables: ["conversion_mail", "conversion_offer", "consent"], metric: { table: "conversion_mail", label: "emailuri trimise" },
    automations: ["conversie"], dashboard: "/admin/conversie", env: ["RESEND_API_KEY", "STRIPE_SECRET_KEY"], tests: ["tests/conversie.test.ts"],
    human: "Citește emailurile în simulator și pornește „Email: din gratuit în plătit” din Autonomie.",
  },
  {
    key: "carduri-distribuire", name: "Cardurile de nume și localitate", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Doar date publice din content/.",
    what: "Poza 1200×630 a fiecărui nume și județ (previzualizarea linkului) și butoanele de distribuit.",
    engine: ["src/components/continut/ShareCard.tsx"], api: ["/api/card"], dashboard: "/admin/crestere",
  },
  {
    key: "calendar-continut", name: "Calendarul de conținut", area: "admin", lifecycle: "live", risk: "scazut", riskWhy: "Doar te ajută să postezi.",
    what: "Ce postezi, unde și când, cu textul gata scris și legătura cu semnele din Analiză.",
    engine: ["src/lib/calendar-continut.ts"], pages: ["/admin/calendar"], tests: ["tests/crestere.test.ts"],
  },
  {
    key: "sanatate-afacere", name: "Sănătatea afacerii", area: "admin", lifecycle: "live", risk: "scazut", riskWhy: "Doar citește.",
    what: "Scoruri pe departamente din date reale, față de ținta de 1000 de abonamente pe lună, cu cauză, impact și pași.",
    engine: ["src/lib/sanatate-afacere.ts"], pages: ["/admin/sanatate"], tests: ["tests/crestere.test.ts"],
  },
  {
    key: "navigator-arhitectura", name: "Navigatorul de arhitectură", area: "admin", lifecycle: "live", risk: "scazut", riskWhy: "Doar citește.",
    what: "Fluxul de la reguli până la client, cu fișierele reale din spatele fiecărui bloc.",
    engine: ["src/lib/cunostinte/arhitectura.ts"], pages: ["/admin/cunostinte/arhitectura"],
  },
  {
    key: "invatare-conversii", name: "Învățare și conversii", area: "admin", lifecycle: "live", risk: "mediu", riskWhy: "Folosește ce fac oamenii în cont; emailul pleacă doar cu acord și după aprobarea ta.",
    what: "Jurnalul recomandărilor cu efectul măsurat, conturile din probă aproape de plată (scor din reguli, mesaj de aprobat) și perspectivele din Analiză.",
    engine: ["src/lib/invatare.ts"], pages: ["/admin/invatare"], tables: ["consent", "automation_mark", "page_view"], tests: ["tests/crestere.test.ts"],
    human: "Citește și aprobă fiecare mesaj; bifează „Făcut” în jurnal.",
  },
  {
    key: "recomandari-admin", name: "Creștere și recomandări", area: "admin", lifecycle: "live", risk: "scazut", riskWhy: "Doar citește și comută.",
    what: "Invitații, rude aduse, daruri, acorduri pentru email și vizitele aduse de distribuiri, cu comutatoarele creșterii.",
    engine: ["src/lib/crestere.ts", "src/app/crestere-actions.ts"], pages: ["/admin/crestere"], tables: ["referral_bonus", "gift"],
  },
  {
    key: "program-invitatii", name: "Program de invitații (zile gratuite)", area: "bani", lifecycle: "live", risk: "mediu",
    riskWhy: "Dă zile gratuite; paza (email, dispozitiv, IP, emailuri temporare, limita lunară) oprește invitarea propriei persoane.",
    what: "Legătura personală /i/<cod> (cookie 30 de zile), contul nou trecut pe cel care a invitat, zilele (implicit 7 + 7) după email confirmat sau Google și o rudă în arbore, vești în cont și pe email, „Invitațiile mele”.",
    engine: ["src/lib/invitatii.ts", "src/app/invitatii-actions.ts", "src/components/InviteShare.tsx", "src/components/UserNotices.tsx"],
    pages: ["/invitatii", "/invitat/[cod]", "/admin/invitatii"], api: ["/i/[cod]"],
    tables: ["invite_code", "invite_referral", "invite_click", "user_notice"],
    metric: { table: "invite_referral", label: "conturi venite din invitații" },
    dashboard: "/admin/invitatii", tests: ["tests/invitatii.test.ts"],
    human: "Alege din Admin → Invitații câte zile primește fiecare parte și limita lunară.",
  },
  // Ce se poate anticipa în drumul spre o platformă autonomă (planificat; fără cod încă)
  {
    key: "copii-siguranta", name: "Copii de siguranță verificate", area: "sistem", lifecycle: "planificat", risk: "ridicat", riskWhy: "Azi refacerea se bazează doar pe istoricul Neon (câteva zile pe planul gratuit).",
    what: "Copie săptămânală a bazei și a fișierelor în alt loc (de ex. Backblaze), cu o probă lunară de refacere.",
    engine: [],
    human: "De ales unde se țin copiile și cât costă.",
  },
  {
    key: "raport-saptamanal", name: "Raportul săptămânal pe email", area: "sistem", lifecycle: "planificat", risk: "scazut", riskWhy: "Doar citește.",
    what: "Luni dimineața: scorul, ce s-a făcut singur, ce așteaptă după tine, documentele de revizuit.",
    engine: [],
    env: ["RESEND_API_KEY", "CRON_SECRET"],
  },
  {
    key: "costuri", name: "Paza costurilor și a limitelor gratuite", area: "sistem", lifecycle: "planificat", risk: "mediu", riskWhy: "Peste limitele planurilor gratuite site-ul se poate opri.",
    what: "Spațiul folosit în Neon și în stocare față de limita planului, cu alertă din timp.",
    engine: [],
  },
];

export const fnByKey = (k: string) => FUNCTIONS.find((f) => f.key === k);
