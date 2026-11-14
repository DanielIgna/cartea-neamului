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
    what: "Nume de familie, localități, ghiduri, glosar, sitemap-uri și legătura cu Search Console.",
    engine: ["src/lib/seo.ts", "src/lib/public-pages.ts", "src/lib/page-metadata.ts"],
    pages: ["/nume", "/nume/[slug]", "/localitati", "/localitati/[judet]", "/localitati/[judet]/[localitate]", "/ghid", "/ghid/[slug]", "/glosar", "/glosar/[slug]"],
    api: ["/sitemap.xml", "/sitemaps/[file]"],
    automations: ["sitemap"],
    dashboard: "/admin/seo",
    tests: ["tests/seo.test.ts", "tests/localitati.test.ts"],
    env: ["GSC_SERVICE_ACCOUNT_JSON"],
  },
  {
    key: "istorie", name: "Istoria umanității și paginile istorice", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Regula de ton (D06) se aplică.",
    what: "/istoria-umanitatii, /genealogii-vechi, /libertatea-de-a-crede.",
    engine: ["src/lib/firul-vremii.ts", "src/lib/adam-hristos.ts", "src/lib/istoria-bisericii.ts"],
    pages: ["/istoria-umanitatii", "/genealogii-vechi", "/libertatea-de-a-crede"],
    tests: ["tests/adam-hristos.test.ts", "tests/istoria-bisericii.test.ts"],
  },
  {
    key: "traduceri", name: "Cele 9 limbi", area: "public", lifecycle: "live", risk: "mediu", riskWhy: "Un text lipsă dintr-o limbă strică pagina în acea limbă.",
    what: "Traducerea întregii platforme și alegerea limbii.",
    engine: ["src/i18n/locales.ts", "src/i18n/server.ts", "src/components/LanguagePicker.tsx"],
    tests: ["tests/i18n.test.ts"],
  },
  {
    key: "analiza", name: "Analiza traficului", area: "public", lifecycle: "live", risk: "scazut", riskWhy: "Anonim, fără cookie.",
    what: "Vizite, surse, campanii, țări, județe și orașe (fără IP) și drumul vizită → cont → arbore → plată.",
    engine: ["src/lib/vizite.ts", "src/lib/analiza.ts", "src/components/VisitBeacon.tsx"],
    api: ["/api/vizita", "/admin/analiza/csv"],
    tables: ["page_view", "visit_salt"],
    metric: { table: "page_view", label: "zile-pagină numărate" },
    automations: ["curatenie"],
    dashboard: "/admin/analiza",
    tests: ["tests/analiza.test.ts"],
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
