import {
  pgTable, text, integer, boolean, timestamp, uuid, pgEnum, jsonb, index, uniqueIndex, date, doublePrecision,
} from "drizzle-orm/pg-core";

/* ---------- Conturi (tabelele cerute de Better Auth) ---------- */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  locale: text("locale").notNull().default("ro"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false), // verificarea în 2 pași, aleasă de om (src/lib/securitate.ts)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* ---------- Arbori și membri ---------- */
export const treeVisibility = pgEnum("tree_visibility", ["private", "family"]);
export const memberRole = pgEnum("member_role", ["owner", "editor", "contributor", "viewer"]);

export const tree = pgTable("tree", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
  visibility: treeVisibility("visibility").notNull().default("private"),
  region: text("region"),
  rootPersonId: uuid("root_person_id"),
  // Până la ce grad de rudenie își pot scrie mesaje membrii arborelui (soții pot oricând). Îl alege proprietarul.
  chatMaxDegree: integer("chat_max_degree").notNull().default(4),
  // Neamul poate fi găsit de alte familii cu strămoși din aceleași sate (doar satele, numele de familie și anii celor decedați).
  discoverable: boolean("discoverable").notNull().default(false),
  // Cuvântul de la capătul călătoriei în timp: null = textul de bază, gol = ascuns de proprietar, altfel scris de el.
  journeyWord: text("journey_word"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const treeMember = pgTable("tree_member", {
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: memberRole("role").notNull().default("contributor"),
  invitedBy: text("invited_by").references(() => user.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("tree_member_pk").on(t.treeId, t.userId)]);

export const invitation = pgTable("invitation", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  role: memberRole("role").notNull().default("contributor"),
  personId: uuid("person_id"), // persoana din arbore pe care invitatul o poate revendica
  createdBy: text("created_by").references(() => user.id),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedBy: text("accepted_by").references(() => user.id),
  acceptedAt: timestamp("accepted_at"),
});

/* ---------- Persoane și relații ---------- */
export const sex = pgEnum("sex", ["M", "F", "U"]);
export const privacyLevel = pgEnum("privacy_level", ["private_tree", "claimed", "public_memorial"]);

export const person = pgTable("person", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  givenName: text("given_name").notNull().default(""),
  surname: text("surname").notNull().default(""),
  birthSurname: text("birth_surname"),
  sex: sex("sex").notNull().default("U"),
  // Date istorice: textul original ("cca. 1870") + interval calculat pentru sortare și cronologie
  birthDateText: text("birth_date_text"),
  birthFrom: date("birth_from"),
  birthTo: date("birth_to"),
  birthPlace: text("birth_place"),
  birthCountry: text("birth_country"), // țara, ca să putem trece și pe cei născuți în străinătate
  deathDateText: text("death_date_text"),
  deathFrom: date("death_from"),
  deathTo: date("death_to"),
  deathPlace: text("death_place"),
  deathCountry: text("death_country"),
  // Unde locuiește acum (pentru cei în viață): localitate și țară
  residencePlace: text("residence_place"),
  residenceCountry: text("residence_country"),
  living: boolean("living").notNull().default(false),
  // Discret(ă): o fostă soție / un fost soț apare doar în fișele copiilor, nu și în desenele arborelui
  discreet: boolean("discreet").notNull().default(false),
  biography: text("biography"),
  notes: text("notes"),
  photoDocumentId: uuid("photo_document_id"), // poza de profil: o fotografie din albumul persoanei // note suplimentare: surse, întrebări deschise, ce mai trebuie verificat
  occupation: text("occupation"),
  claimedByUserId: text("claimed_by_user_id").references(() => user.id, { onDelete: "set null" }),
  privacy: privacyLevel("privacy").notNull().default("private_tree"),
  gedcomXref: text("gedcom_xref"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("person_tree_idx").on(t.treeId), index("person_name_idx").on(t.surname, t.givenName)]);

export const relationshipType = pgEnum("relationship_type", ["parent_child", "partnership"]);

export const relationship = pgTable("relationship", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  type: relationshipType("type").notNull(),
  // parent_child: personA = părinte, personB = copil. partnership: cei doi parteneri.
  personA: uuid("person_a").notNull().references(() => person.id, { onDelete: "cascade" }),
  personB: uuid("person_b").notNull().references(() => person.id, { onDelete: "cascade" }),
  subtype: text("subtype"), // biologic / adoptiv / vitreg ; casatorie / uniune
  startText: text("start_text"),
  endText: text("end_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("rel_child_idx").on(t.type, t.personB),
  index("rel_parent_idx").on(t.type, t.personA),
  uniqueIndex("rel_unique").on(t.type, t.personA, t.personB),
]);

// „A crescut-o”: cine a crescut un copil fără să-i fie părinte (mama sau tatăl vitreg, bunicii, o mătușă).
// Apare în fișe, în profil și în carte; nu schimbă desenele arborelui și nici gradele de rudenie.
export const raisedBy = pgTable("raised_by", {
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  childId: uuid("child_id").notNull().references(() => person.id, { onDelete: "cascade" }),
  carerId: uuid("carer_id").notNull().references(() => person.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("raised_by_pair").on(t.childId, t.carerId), index("raised_by_tree_idx").on(t.treeId)]);

/* ---------- Arhivă ---------- */
export const documentKind = pgEnum("document_kind", ["act", "photo", "audio", "letter", "other"]);

export const document = pgTable("document", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  kind: documentKind("kind").notNull(),
  title: text("title").notNull(),
  fileKey: text("file_key"), // cheia obiectului în Neon Object Storage (bucket „assets”)
  mimeType: text("mime_type"),
  transcription: text("transcription"),
  description: text("description"), // ce se vede în poză, cine, unde, când
  dateText: text("date_text"),
  place: text("place"),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentLink = pgTable("document_link", {
  documentId: uuid("document_id").notNull().references(() => document.id, { onDelete: "cascade" }),
  personId: uuid("person_id").references(() => person.id, { onDelete: "cascade" }),
  relationshipId: uuid("relationship_id").references(() => relationship.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("subject"), // subject / witness / mentioned
}, (t) => [index("doclink_person_idx").on(t.personId)]);

/* ---------- Cartea familiei ---------- */
export const exportStatus = pgEnum("export_status", ["draft", "paid", "rendering", "ready", "failed"]);

export const bookExport = pgTable("book_export", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  orderedBy: text("ordered_by").references(() => user.id, { onDelete: "set null" }),
  centerPersonId: uuid("center_person_id").references(() => person.id, { onDelete: "set null" }),
  options: jsonb("options").notNull().default({}),
  status: exportStatus("status").notNull().default("draft"),
  pdfKey: text("pdf_key"),
  paymentId: text("payment_id"),
  priceBani: integer("price_bani"), // lei * 100
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- GDPR și audit ---------- */
export const consent = pgTable("consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(), // terms (la crearea contului) / faith (capitolul „Credința”); vezi src/lib/legal.ts
  textVersion: text("text_version").notNull(),
  granted: boolean("granted").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- Securitate: verificarea în 2 pași, dispozitivele cunoscute și jurnalul de securitate (src/lib/securitate.ts) ---------- */
export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(), // cheia aplicației de coduri, criptată de better-auth
  backupCodes: text("backup_codes").notNull(), // codurile de rezervă, criptate
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("two_factor_user_idx").on(t.userId)]);

export const securityEvent = pgTable("security_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // vezi SecurityKind în src/lib/securitate.ts
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  email: text("email"),
  ip: text("ip"),
  device: text("device"), // „Chrome pe Android”, fără alte amănunte
  place: text("place"), // orașul și țara aproximative, după adresa IP (de la Vercel)
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("security_event_kind_idx").on(t.kind, t.createdAt), index("security_event_email_idx").on(t.email, t.createdAt),
  index("security_event_ip_idx").on(t.ip, t.createdAt)]);

export const knownDevice = pgTable("known_device", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  deviceHash: text("device_hash").notNull(),
  label: text("label"),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
}, (t) => [uniqueIndex("known_device_pk").on(t.userId, t.deviceHash)]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").references(() => tree.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  diff: jsonb("diff"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("audit_tree_idx").on(t.treeId, t.createdAt)]);

/* ---------- Planul fiecărui cont și setările planurilor, alese din panoul de admin („Control”) ---------- */
// Nu se văd nicăieri în site și nu opresc pe nimeni cât timp plățile nu sunt pornite: îl ajută pe cel care ține site-ul să-și
// pregătească abonamentul (cine rămâne gratuit pentru totdeauna, cine plătește). Fără rând, contul are planul gratuit, ca toți.
export const accountPlan = pgTable("account_plan", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // gratuit / mereu (gratuit pentru totdeauna) / familie (plătește); vezi src/lib/plans.ts
  note: text("note"),
  paidUntil: timestamp("paid_until"), // până când are plătit (50 lei pe an); după, arborii lui sunt doar de citit. Vezi src/lib/plata.ts
  tier: text("tier"), // planul anului plătit: basic / familie / premium (src/lib/plans.ts); gol = fără an plătit
  keepUntil: timestamp("keep_until"), // „Păstrarea” plătită (25 lei/an): după anul plătit, familia vede tot online, fără adăugări
  remindedFor: timestamp("reminded_for"), // sfârșitul anului pentru care s-a trimis deja aducerea aminte (o dată pe an)
  setBy: text("set_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Plățile primite prin Stripe: „an” (un an în Cartea Neamului) sau „carte” (cartea PDF a unui arbore, pentru cel care a plătit).
// Cheia e id-ul sesiunii de plată din Stripe, ca o confirmare primită de două ori să nu se socotească de două ori. Vezi src/lib/plati.ts.
export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  treeId: uuid("tree_id").references(() => tree.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(), // în bani (lei × 100) sau cenți
  currency: text("currency").notNull(), // ron / eur
  extra: text("extra"), // „carte” = pachetul Basic + cartea PDF (cartea se alege apoi din /plata)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("payment_user_idx").on(t.userId, t.kind)]);

// Setări ale site-ului schimbate din panou (de pildă limitele planului gratuit și prețul), câte una pe cheie.
export const appSetting = pgTable("app_setting", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------- Cât folosesc oamenii site-ul, doar la cei care au spus „Bine” (acordul `usage`) ---------- */
// Pe zile: câte secunde a stat omul în fiecare parte a site-ului („Arborele · Copac”, „Harta neamului”...) și de câte ori a
// deschis-o, plus cât din timp a fost pe telefon și în aplicația pusă pe telefon. Nu se păstrează adresa paginii, ce scrie
// sau pe ce apasă. Se șterge după 13 luni, când omul își retrage acordul și odată cu contul. Vezi src/lib/usage.ts.
export const usageDay = pgTable("usage_day", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  section: text("section").notNull(),
  seconds: integer("seconds").notNull().default(0),
  views: integer("views").notNull().default(0),
  phoneSeconds: integer("phone_seconds").notNull().default(0),
  appSeconds: integer("app_seconds").notNull().default(0),
  /** Ultima bătaie adunată (id dat de browser): aceeași bătaie trimisă de două ori nu se numără de două ori. */
  lastBeat: text("last_beat"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("usage_day_pk").on(t.userId, t.day, t.section), index("usage_day_day_idx").on(t.day)]);

/* ---------- Mesaje între rude ---------- */
export const message = pgTable("message", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  fromUserId: text("from_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  toUserId: text("to_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
}, (t) => [index("message_pair_idx").on(t.treeId, t.fromUserId, t.toUserId), index("message_to_idx").on(t.toUserId, t.readAt)]);

/* ---------- Harta neamului ---------- */
// Un loc pus de mână pe hartă (sau ales dintre mai multe cu același nume): toate fișele cu același text de loc îl folosesc.
export const placePin = pgTable("place_pin", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  key: text("key").notNull(), // textul locului, fără diacritice, plus țara: „domosu|RO”
  placeId: text("place_id"), // „RO:59470” (cod SIRUTA) când a fost ales din listă; gol când a fost pus cu un click pe hartă
  name: text("name").notNull(),
  detail: text("detail"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("place_pin_key").on(t.treeId, t.key)]);

/* ---------- Din aceleași locuri ---------- */
// Satele strămoșilor fiecărui arbore (doar cei decedați), recalculate când se schimbă fișele sau harta.
// După ele își găsesc neamurile cu rădăcini în același sat, dacă amândouă au ales să poată fi găsite.
export const treePlace = pgTable("tree_place", {
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  placeId: text("place_id").notNull(), // „RO:55455” (cod SIRUTA) sau orașul din străinătate
  area: text("area"), // comuna, pentru satele din România („CJ:sancraiu”): neamuri din satele vecine
  name: text("name").notNull(),
  detail: text("detail"),
  people: integer("people").notNull(),
  fromYear: integer("from_year"),
  toYear: integer("to_year"),
  surnames: text("surnames").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("tree_place_pk").on(t.treeId, t.placeId), index("tree_place_place_idx").on(t.placeId), index("tree_place_area_idx").on(t.area)]);

// „Cere legătura”: cineva dintr-un neam scrie proprietarului altui neam cu rădăcini în același sat. După „Acceptă”, își pot scrie.
export const placeContact = pgTable("place_contact", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromUserId: text("from_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fromTreeId: uuid("from_tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  toTreeId: uuid("to_tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  toUserId: text("to_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  place: text("place").notNull(),
  note: text("note"),
  status: text("status").notNull().default("pending"), // pending / accepted / declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
  answeredAt: timestamp("answered_at"),
}, (t) => [uniqueIndex("place_contact_pair").on(t.fromUserId, t.toTreeId), index("place_contact_to_idx").on(t.toUserId, t.status)]);

/* ---------- Intrarea în arbore după nume și data nașterii ---------- */
// Cine își face cont scrie numele și data nașterii și își găsește fișa, trecută deja de o rudă într-un arbore.
// Proprietarul arborelui confirmă că e chiar el; atunci intră în arbore, cu fișa lui revendicată.
export const joinRequest = pgTable("join_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => person.id, { onDelete: "cascade" }),
  note: text("note"),
  status: text("status").notNull().default("pending"), // pending / accepted / declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
  answeredAt: timestamp("answered_at"),
}, (t) => [uniqueIndex("join_request_pair").on(t.userId, t.personId), index("join_request_tree_idx").on(t.treeId, t.status)]);

// Fiecare căutare rămâne scrisă, ca data nașterii cuiva să nu poată fi ghicită încercând zi după zi.
export const joinAttempt = pgTable("join_attempt", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  nameKey: text("name_key").notNull(), // numele de familie căutat, fără diacritice
  found: boolean("found").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("join_attempt_user_idx").on(t.userId, t.createdAt), index("join_attempt_name_idx").on(t.nameKey, t.createdAt)]);

/* ---------- Lada cu amintiri ---------- */
// Povestea celor vii, spusă de ei: fiecare om în viață își adună amintirile, pe capitole, în lada lui.
// O amintire e a celui care o scrie: doar el alege cine o vede și doar el o poate schimba sau șterge.
// „private” = doar el (ciornă); „asker” = doar cel care a pus întrebarea; „close” = familia apropiată, până la un grad; „tree” = tot arborele.
export const memoryVisibility = pgEnum("memory_visibility", ["private", "asker", "close", "tree"]);

export const memory = pgTable("memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => person.id, { onDelete: "cascade" }), // în lada cui e (cine povestește)
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }), // contul care a scris-o
  chapter: text("chapter").notNull().default("altele"),
  question: text("question"), // întrebarea la care răspunde, cum a fost pusă
  questionKey: text("question_key"), // tiparul întrebării de duminică, ca să nu mai fie pusă încă o dată
  askedId: uuid("asked_id"), // întrebarea lăsată de o rudă, dacă răspunde la ea
  title: text("title"),
  body: text("body").notNull(),
  whenText: text("when_text"), // „vara lui 1965”, „cca. 1970”
  whenYear: integer("when_year"),
  place: text("place"),
  photoDocumentId: uuid("photo_document_id").references(() => document.id, { onDelete: "set null" }),
  visibility: memoryVisibility("visibility").notNull().default("tree"),
  maxDegree: integer("max_degree"), // pentru „familia apropiată”: până la ce grad de rudenie; gol = gradul de la mesaje
  inBook: boolean("in_book").notNull().default(false), // autorul a bifat că poate intra în Cartea neamului
  audioDocumentId: uuid("audio_document_id").references(() => document.id, { onDelete: "set null" }), // amintirea spusă cu glasul
  audioSeconds: integer("audio_seconds"),
  // Modul „la bunici”: o rudă (authorId) a înregistrat-o pentru omul fără cont, cu acordul lui spus la început.
  helper: boolean("helper").notNull().default(false),
  consentAt: timestamp("consent_at"),
  consentDocumentId: uuid("consent_document_id").references(() => document.id, { onDelete: "set null" }), // acordul, cu glasul lui
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("memory_person_idx").on(t.personId), index("memory_tree_idx").on(t.treeId)]);

// Cine mai e în amintire: amintirea apare și pe profilul lui, dacă el nu o ascunde.
export const memoryMention = pgTable("memory_mention", {
  memoryId: uuid("memory_id").notNull().references(() => memory.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => person.id, { onDelete: "cascade" }),
  hidden: boolean("hidden").notNull().default(false),
}, (t) => [uniqueIndex("memory_mention_pk").on(t.memoryId, t.personId), index("memory_mention_person_idx").on(t.personId)]);

// „Și eu îmi amintesc”: ce adaugă rudele sub o amintire.
export const memoryReply = pgTable("memory_reply", {
  id: uuid("id").primaryKey().defaultRandom(),
  memoryId: uuid("memory_id").notNull().references(() => memory.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("memory_reply_memory_idx").on(t.memoryId)]);

// O întrebare lăsată de o rudă în lada cuiva („Bunico, cum era la nunta voastră?”).
export const memoryQuestion = pgTable("memory_question", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => person.id, { onDelete: "cascade" }), // în lada cui
  askedBy: text("asked_by").references(() => user.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  memoryId: uuid("memory_id").references(() => memory.id, { onDelete: "set null" }), // răspunsul
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("memory_question_person_idx").on(t.personId)]);

/* ---------- Beneficii de la parteneri (acum doar PropManage), doar cu acordul omului ---------- */
// Un rând pentru fiecare „da” și fiecare „nu” (nu un câmp suprascris), ca să se vadă oricând când și-a dat omul acordul, la ce
// text și de unde (la crearea contului, din „Datele mele” sau din legătura de dezabonare). Ultimul rând spune starea de acum.
// Partenerului îi pleacă doar adresa de email a celor cu acordul dat; vezi src/lib/partners.ts.
export const partnerConsent = pgTable("partner_consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  partner: text("partner").notNull(), // propmanage
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("granted_at"),
  revokedAt: timestamp("revoked_at"),
  textVersion: text("text_version").notNull(),
  locale: text("locale"), // limba în care a citit textul acordului
  source: text("source").notNull(), // cont-nou / datele-mele / dezabonare
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("partner_consent_user_idx").on(t.userId, t.partner, t.createdAt)]);

/* ---------- Casa bătrânească a unui om din arbore ---------- */
// Unde e (adresa sau satul), cine a ridicat-o, în ce an, poze și povestea ei. O vede doar cine alege autorul, ca la amintiri.
export const oldHouse = pgTable("old_house", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => person.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  place: text("place"),
  builtBy: text("built_by"),
  builtYear: integer("built_year"),
  story: text("story"),
  photoIds: jsonb("photo_ids").$type<string[]>().notNull().default([]),
  visibility: memoryVisibility("visibility").notNull().default("tree"),
  maxDegree: integer("max_degree"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("old_house_person_idx").on(t.personId), index("old_house_tree_idx").on(t.treeId)]);

/* ---------- Poze de familie propuse pentru prima pagină ---------- */
// Omul alege o poză din albumul arborelui, bifează acordul și o trimite; adminul o aprobă sau nu. Aprobată, intră în
// rotația bannerului (app_setting „home_images”, upload cu id „p-<id>”). Retrasă sau respinsă, fișierul se șterge.
export const homeSubmission = pgTable("home_submission", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  treeId: uuid("tree_id").references(() => tree.id, { onDelete: "set null" }),
  documentId: uuid("document_id").references(() => document.id, { onDelete: "set null" }),
  fileKey: text("file_key").notNull(),
  mimeType: text("mime_type").notNull(),
  caption: text("caption"),
  status: text("status").notNull().default("pending"), // pending / approved / rejected / withdrawn / removed
  consentTextVersion: text("consent_text_version").notNull(),
  consentAt: timestamp("consent_at").notNull(),
  locale: text("locale"),
  decidedBy: text("decided_by"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("home_submission_user_idx").on(t.userId), index("home_submission_status_idx").on(t.status, t.createdAt)]);

// „Vreau un test ADN” de pe /resurse-genealogie: doar o cerere de informații (nume, email, oraș, mesaj), fără date genetice
// sau medicale. Nu se trimite nimic la laboratoare; cererea o vede doar adminul și se șterge la cerere. Vezi src/lib/resurse.ts.
export const dnaRequest = pgTable("dna_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city").notNull(),
  message: text("message").notNull(),
  locale: text("locale"),
  consentAt: timestamp("consent_at").notNull(), // bifa GDPR, cu data ei
  consentVersion: text("consent_version").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Laboratoarele din lista informativă de pe /resurse-genealogie, puse din Admin. Fără afiliere și fără comision.
export const dnaLab = pgTable("dna_lab", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city"),
  url: text("url").notNull(),
  priceNote: text("price_note"),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Un an dăruit (Daniel, 2026-11-13): cineva plătește planul pentru altcineva (de pildă părinții), cu un bilet scurt. Cine îl
// primește deschide legătura /cadou/<cod> și anul trece pe contul lui. Vezi src/lib/extra.ts.
export const gift = pgTable("gift", {
  id: text("id").primaryKey(), // codul din legătură
  paymentId: text("payment_id").notNull(),
  buyerId: text("buyer_id").references(() => user.id, { onDelete: "set null" }),
  tier: text("tier").notNull(),
  note: text("note"),
  forName: text("for_name"),
  redeemedBy: text("redeemed_by").references(() => user.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zilele în plus pentru cine aduce o rudă care își deschide arborele ei și plătește (o singură dată pentru fiecare rudă adusă).
export const referralBonus = pgTable("referral_bonus", {
  referredId: text("referred_id").primaryKey(),
  referrerId: text("referrer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  days: integer("days").notNull(),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// „Raportează o problemă” (Daniel, 2026-11-13): ce nu merge, spus de om din cont, cu până la 3 poze ale ecranului și pagina
// în care era. Pozele (cheile din bucket) le vede doar el și adminul. Vezi src/lib/probleme.ts și migrația 0024.
export type ProblemImage = { key: string; type: string };
export const problemReport = pgTable("problem_report", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  treeId: uuid("tree_id").references(() => tree.id, { onDelete: "set null" }),
  personId: uuid("person_id"),
  kind: text("kind").notNull().default("eroare"), // eroare / arbore / idee / altceva
  message: text("message").notNull(),
  page: text("page"),
  images: jsonb("images").$type<ProblemImage[]>().notNull().default([]),
  browser: text("browser"),
  screen: text("screen"),
  locale: text("locale"),
  status: text("status").notNull().default("nou"), // nou / vazut / rezolvat
  reply: text("reply"),
  repliedAt: timestamp("replied_at"),
  replySeenAt: timestamp("reply_seen_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("problem_report_user_idx").on(t.userId, t.createdAt), index("problem_report_status_idx").on(t.status, t.createdAt)]);
