import {
  pgTable, text, integer, boolean, timestamp, uuid, pgEnum, jsonb, index, uniqueIndex, date, doublePrecision, primaryKey, numeric,
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
  propmanageInvitedAt: timestamp("propmanage_invited_at"), // când a cerut contul gratuit PropManage (src/lib/propmanage-cont.ts); null = niciodată
  freeUntil: timestamp("free_until"), // zilele gratuite câștigate prin invitații țin până atunci (src/lib/invitatii.ts); null = niciuna
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
  // „Sursa informației” (Surse publice, 18.11.2026): de unde știe familia ce a scris (o arhivă, un registru), text liber + link.
  infoSource: text("info_source"),
  infoSourceUrl: text("info_source_url"),
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
  // Arhiva sigilată (src/lib/arhivare.ts): poza în mic, păstrată online; când originalul a trecut în arhivă (cheia începe cu
  // „arhiva/”) și când a rămas doar poza în mic.
  previewKey: text("preview_key"),
  archivedAt: timestamp("archived_at"),
  reducedAt: timestamp("reduced_at"),
});

/** Ce urmează pentru un arbore după anul plătit: „arhivare” sau „reducere”, cu ziua și anunțurile trimise (zile înainte → ora). */
export const archivePlan = pgTable("archive_plan", {
  treeId: uuid("tree_id").notNull().references(() => tree.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  dueAt: timestamp("due_at").notNull(),
  notices: jsonb("notices").notNull().default({}),
  doneAt: timestamp("done_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ name: "archive_plan_pk", columns: [t.treeId, t.event] })]);

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
  // Abonamentul Stripe (25.11.2026, src/lib/abonament.ts): clientul și abonamentul din Stripe, perioada (luna / trimestru / an),
  // dacă se mai reînnoiește singur (oprit dintr-un clic = false), suma următoarei plăți, pentru ce dată s-a trimis emailul de
  // dinainte, dacă oprirea n-a ajuns încă la Stripe (se reîncearcă zilnic) și dacă s-a pus deja prețul de reînnoire.
  stripeCustomer: text("stripe_customer"),
  stripeSub: text("stripe_sub"),
  subPeriod: text("sub_period"),
  subRenews: boolean("sub_renews").notNull().default(false),
  subAmount: integer("sub_amount"),
  subCurrency: text("sub_currency"),
  subRemindedFor: timestamp("sub_reminded_for"),
  subCancelPending: boolean("sub_cancel_pending").notNull().default(false),
  subFixed: boolean("sub_fixed").notNull().default(true),
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
  // Codul de reducere folosit (NEAM90, TEST90…); '' = fără cod; null = plată veche, încă neverificată (src/lib/plati-test.ts).
  promo: text("promo"),
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

/* ---------- Vizitele, numărate anonim (Admin → Analiză), vezi src/lib/vizite.ts și migrația 0026 ---------- */
// Fiecare pagină deschisă: ziua și ora (ora României), o amprentă de vizitator care se schimbă zilnic (nu se poate lega de
// cineva), pagina (cele private doar până la primul cuvânt), de unde a venit, felul ecranului, țara (după IP, doar codul).
export const pageView = pgTable("page_view", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at").notNull().defaultNow(),
  day: date("day").notNull(),
  hour: integer("hour").notNull(),
  visitor: text("visitor").notNull(),
  path: text("path").notNull(),
  source: text("source").notNull(),
  referrer: text("referrer"),
  medium: text("medium"),
  campaign: text("campaign"),
  device: text("device").notNull(),
  country: text("country"),
  // Regiunea (codul ISO, la noi județul: „CJ”, „B”) și orașul aproximativ, tot după IP, de la Vercel (migrația 0031). IP-ul nu se păstrează.
  region: text("region"),
  city: text("city"),
  lang: text("lang"),
  logged: boolean("logged").notNull().default(false),
}, (t) => [index("page_view_day_idx").on(t.day), index("page_view_visitor_idx").on(t.visitor, t.at)]);

// Sarea zilei pentru amprenta vizitatorilor; cea de ieri și mai vechi se șterge, ca amprentele vechi să nu mai poată fi refăcute.
export const visitSalt = pgTable("visit_salt", {
  day: date("day").primaryKey(),
  salt: text("salt").notNull(),
});

// Conversiile (cont nou, arbore nou, clic pe un buton de început, plată) cu sursa vizitei din care au venit (migrația 0033).
// Fără id de cont: se pot doar număra pe surse, pagini și campanii, nu lega de un om. Vezi src/lib/conversii.ts.
export const conversion = pgTable("conversion", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at").notNull().defaultNow(),
  day: date("day").notNull(),
  kind: text("kind").notNull(), // cont / arbore / cta / plata-start / plata
  label: text("label"),
  page: text("page"),
  landing: text("landing"),
  source: text("source").notNull(),
  medium: text("medium"),
  campaign: text("campaign"),
  referrer: text("referrer"),
  device: text("device"),
  country: text("country"),
  amount: integer("amount"),
  currency: text("currency"),
  attributed: boolean("attributed").notNull().default(false),
}, (t) => [index("conversion_day_idx").on(t.day, t.kind)]);

/* ---------- Motorul de publicare SEO (Admin → SEO → Motor), vezi src/lib/motor-seo și migrația 0034 ---------- */
// Coada paginilor publice care intră în Google pe rând: fiecare pagină (o comună, mai târziu nume și diaspora) are starea ei
// (în așteptare / generată / publicată / noindex), datele adunate la generare (rezumatul din Wikipedia) și rezultatul controlului.
export const seoQueue = pgTable("seo_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // localitate | nume | diaspora | ghid
  path: text("path").notNull(),
  lang: text("lang").notNull().default("ro"),
  priority: integer("priority").notNull().default(0),
  status: text("status").notNull().default("asteptare"), // asteptare | generat | publicat | noindex
  data: jsonb("data"),
  words: integer("words"),
  uniqueWords: integer("unique_words"),
  facts: integer("facts"),
  similarity: integer("similarity"),
  reasons: text("reasons"),
  generatedAt: timestamp("generated_at"),
  publishedAt: timestamp("published_at"),
  lastmod: timestamp("lastmod"),
  indexed: text("indexed"), // da | nu | null (neverificată)
  inspectedAt: timestamp("inspected_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("seo_queue_path_lang").on(t.path, t.lang), index("seo_queue_status_idx").on(t.status, t.priority)]);

/* ---------- Autonomia (Admin → Autonomie), vezi src/lib/autonomie.ts și migrația 0027 ---------- */
// Fiecare rulare a unei automatizări: cine a pornit-o (ceasul zilnic, butonul din panou, o aprobare), ce a văzut, ce a făcut
// și ce așteaptă aprobarea omului. Nimic din ce atinge bani, conturi sau texte publice nu se face fără aprobare.
export const automationRun = pgTable("automation_run", {
  id: uuid("id").primaryKey().defaultRandom(),
  automation: text("automation").notNull(),
  trigger: text("trigger").notNull(), // ceas / manual / aprobare
  status: text("status").notNull(), // ok / nimic / asteapta / sarit / eroare / oprit
  observed: integer("observed").notNull().default(0),
  acted: integer("acted").notNull().default(0),
  pending: integer("pending").notNull().default(0),
  note: text("note"),
  details: jsonb("details"),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
}, (t) => [index("automation_run_idx").on(t.automation, t.startedAt), index("automation_run_at_idx").on(t.startedAt)]);

// Ce s-a făcut deja o dată (de ex. emailul de sfârșit al zilelor gratuite pentru un cont), ca să nu se repete.
export const automationMark = pgTable("automation_mark", {
  automation: text("automation").notNull(),
  ref: text("ref").notNull(),
  at: timestamp("at").notNull().defaultNow(),
}, (t) => [primaryKey({ name: "automation_mark_pk", columns: [t.automation, t.ref] })]);

// Scorul de autonomie al fiecărei zile, pentru graficul din pagină.
export const autonomySnapshot = pgTable("autonomy_snapshot", {
  day: date("day").primaryKey(),
  score: integer("score").notNull(),
  parts: jsonb("parts").notNull(),
  at: timestamp("at").notNull().defaultNow(),
});

/* ---------- Carduri cadou vândute prin magazine (Admin → Carduri cadou), vezi src/lib/carduri-cadou.ts și migrația 0028 ---------- */
// Magazinele partenere (librării, magazine de cadouri, studiouri foto). Comisionul se socotește pe cardurile vândute.
// `portal_token` + `pin_hash`: pagina simplă /magazin/<token> unde magazinul marchează singur un card vândut, cu PIN.
export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeMagazin: text("nume_magazin").notNull(),
  oras: text("oras"),
  adresa: text("adresa"),
  persoanaContact: text("persoana_contact"),
  telefon: text("telefon"),
  email: text("email"),
  comisionProcent: numeric("comision_procent", { precision: 5, scale: 2, mode: "number" }).notNull().default(25),
  activ: boolean("activ").notNull().default(true),
  note: text("note"),
  portalToken: text("portal_token"),
  pinHash: text("pin_hash"),
  // CRM (migrația 0029): etapa (prospect → necontactat → contactat → discutie → negociere → agreat → activ / pauzat / respins),
  // categoria magazinului, județul (codul: CJ, B...), următorul pas cu data lui (aducerea aminte din panou).
  etapa: text("etapa").notNull().default("prospect"),
  categorie: text("categorie"),
  judet: text("judet"),
  website: text("website"),
  functie: text("functie"),
  sursa: text("sursa"),
  urmatorulPas: text("urmatorul_pas"),
  urmatorulPasLa: timestamp("urmatorul_pas_la"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  tip: text("tip").notNull().default("magazin"), // magazin / firma (firmele cumpără pachete de coduri pentru angajați)
  refCode: text("ref_code"), // legătura de recomandare /r/<cod> de pe afișul din magazin
  plafonZi: integer("plafon_zi").notNull().default(20), // câte carduri digitale poate vinde pe zi (paza unui link scăpat)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("partners_portal_token_idx").on(t.portalToken), uniqueIndex("partners_ref_code_idx").on(t.refCode)]);

// Conturile aduse de un partener prin legătura sau QR-ul de recomandare (/r/<cod>), ținute minte la crearea contului.
export const partnerReferral = pgTable("partner_referral", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  at: timestamp("at").notNull().defaultNow(),
}, (t) => [index("partner_referral_partner_idx").on(t.partnerId, t.at)]);

// Istoricul de contact cu un partener (telefon, vizită, email...), din fișa lui din CRM.
export const partnerContactLog = pgTable("partner_contact_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  canal: text("canal").notNull(),
  nota: text("nota").notNull(),
  at: timestamp("at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
}, (t) => [index("partner_contact_log_idx").on(t.partnerId, t.at)]);

// Un lot de carduri tipărite pentru un magazin: planul, câte luni dă fiecare card și prețul de pe raft.
export const giftCardBatches = pgTable("gift_card_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }),
  plan: text("plan").notNull().default("basic"), // basic / familie / premium
  durataLuni: integer("durata_luni").notNull().default(12),
  pretRaftLei: numeric("pret_raft_lei", { precision: 10, scale: 2, mode: "number" }).notNull().default(49),
  cantitate: integer("cantitate").notNull(),
  digital: boolean("digital").notNull().default(false), // fără tipar: fiecare card are legătura /card/<token>
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
}, (t) => [index("gift_card_batches_partner_idx").on(t.partnerId, t.createdAt)]);

// Fiecare card: codul XXXX-XXXX-XXXX și drumul lui: generat → livrat_magazin → vandut_activat_de_magazin → folosit / anulat.
export const giftCards = pgTable("gift_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").notNull().references(() => giftCardBatches.id, { onDelete: "restrict" }),
  seq: integer("seq").notNull(), // numărul cardului în lot (1, 2, 3...), pentru marcarea pe interval
  cod: text("cod").notNull(),
  status: text("status").notNull().default("generat"),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }),
  soldAt: timestamp("sold_at"),
  redeemedAt: timestamp("redeemed_at"),
  redeemedByUserId: text("redeemed_by_user_id").references(() => user.id, { onDelete: "set null" }),
  // Cardul digital: legătura secretă /card/<token>, pentru cine e și biletul (opționale, scrise la vânzare) și pe unde a plecat.
  shareToken: text("share_token"),
  pentru: text("pentru"),
  mesaj: text("mesaj"),
  sentVia: text("sent_via"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("gift_cards_cod_idx").on(t.cod), uniqueIndex("gift_cards_share_token_idx").on(t.shareToken), index("gift_cards_batch_idx").on(t.batchId, t.seq), index("gift_cards_partner_idx").on(t.partnerId, t.status)]);

// Încercările de cod de pe /activeaza și de PIN de pe /magazin (amprenta IP-ului sau a contului, nu IP-ul), pentru limita pe oră.
export const giftCardAttempt = pgTable("gift_card_attempt", {
  id: uuid("id").primaryKey().defaultRandom(),
  who: text("who").notNull(),
  ok: boolean("ok").notNull().default(false),
  at: timestamp("at").notNull().defaultNow(),
}, (t) => [index("gift_card_attempt_idx").on(t.who, t.at)]);

/* ---------- Coduri de activare pentru cardurile vândute pe alte platforme (Trendyol…), Daniel, 25.11.2026 ---------- */
// Un rând pe cod: CN-FAM-7K4M-Q9XT dă planul pe `durata_luni` luni, o singură dată. Statusul: nefolosit → folosit, sau anulat.
// Separat de cardurile din magazine (gift_cards): aici nu există magazin, lot tipărit sau marcare „vândut”.
export const activationCode = pgTable("activation_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  cod: text("cod").notNull(),
  plan: text("plan").notNull(),
  durataLuni: integer("durata_luni").notNull().default(12),
  sursa: text("sursa").notNull(),
  status: text("status").notNull().default("nefolosit"),
  lot: text("lot"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  usedAt: timestamp("used_at"),
  usedByUserId: text("used_by_user_id").references(() => user.id, { onDelete: "set null" }),
  cancelledAt: timestamp("cancelled_at"),
}, (t) => [uniqueIndex("activation_code_cod_idx").on(t.cod), index("activation_code_status_idx").on(t.status, t.sursa, t.createdAt)]);

/* ---------- Contul gratuit PropManage, oferit după activarea cardului (Daniel, 2026-11-14) ---------- */
// Un rând pentru fiecare cerere: omul a bifat acordul și a apăsat „Vreau contul gratuit”. Rândul e și dovada acordului (data,
// ora, textul exact al bifei, limba). Numele și emailul au plecat la PropManage doar dacă `status` e „trimis”. Dacă omul își
// șterge contul, rândul rămâne fără om (user_id = null), doar ca număr în raportul magazinului.
export const propmanageInvite = pgTable("propmanage_invite", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  consentText: text("consent_text").notNull(),
  consentAt: timestamp("consent_at").notNull(),
  locale: text("locale"),
  place: text("place").notNull(), // activare (pagina /activeaza) / datele-mele
  sursa: text("sursa").notNull().default("cartea-neamului"),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }), // magazinul de la care vine cardul
  cardId: uuid("card_id").references(() => giftCards.id, { onDelete: "set null" }),
  batchId: uuid("batch_id").references(() => giftCardBatches.id, { onDelete: "set null" }),
  status: text("status").notNull(), // trimis / eroare
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("propmanage_invite_user_idx").on(t.userId), index("propmanage_invite_partner_idx").on(t.partnerId, t.status), index("propmanage_invite_batch_idx").on(t.batchId, t.status)]);

/* ---------- Programul de invitații (Daniel, 2026-11-14), vezi src/lib/invitatii.ts și migrația 0034 ---------- */
// Codul personal al fiecăruia (/i/<cod>) și, cu acordul lui, arborele pe care îl vede (doar citire) cine vine prin el.
export const inviteCode = pgTable("invite_code", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  shareTreeId: uuid("share_tree_id").references(() => tree.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("invite_code_code_idx").on(t.code)]);

// Cine pe cine a adus (un rând pe cont nou). status: asteapta / acordat / respins; reason: de ce nu s-a dat (vezi REASONS).
export const inviteReferral = pgTable("invite_referral", {
  referredId: text("referred_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  referrerId: text("referrer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  via: text("via").notNull(), // link (codul personal) / arbore (invitația într-un arbore)
  status: text("status").notNull().default("asteapta"),
  reason: text("reason"),
  daysReferrer: integer("days_referrer").notNull().default(0),
  daysReferred: integer("days_referred").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  rewardedAt: timestamp("rewarded_at"),
}, (t) => [index("invite_referral_referrer_idx").on(t.referrerId, t.status)]);

// Câte deschideri a avut legătura cuiva, pe zile (fără nimic despre cine a deschis-o).
export const inviteClick = pgTable("invite_click", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  clicks: integer("clicks").notNull().default(0),
}, (t) => [uniqueIndex("invite_click_pk").on(t.userId, t.day)]);

// Vești în cont („Ai primit 7 zile gratuite pentru că Ion și-a făcut cont”), arătate sus până le închide omul.
export const userNotice = pgTable("user_notice", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  data: jsonb("data").$type<Record<string, string | number>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
}, (t) => [index("user_notice_user_idx").on(t.userId, t.readAt)]);

/* ---------- Conversia din zilele gratuite în plătit (src/lib/conversie.ts) ---------- */
// Fiecare email din șirul zilelor gratuite, o dată pe om și pas: când a plecat, deschideri, clicuri și plata care a urmat.
export const conversionMail = pgTable("conversion_mail", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  step: text("step").notNull(),
  locale: text("locale").notNull().default("ro"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  openedAt: timestamp("opened_at"),
  opens: integer("opens").notNull().default(0),
  clickedAt: timestamp("clicked_at"),
  clicks: integer("clicks").notNull().default(0),
  paidAt: timestamp("paid_at"),
  paymentId: text("payment_id"),
  amount: integer("amount"),
  currency: text("currency"),
}, (t) => [uniqueIndex("conversion_mail_user_step_idx").on(t.userId, t.step), index("conversion_mail_sent_idx").on(t.sentAt)]);

// Codul unic de reducere de după zilele gratuite (un cod promoțional Stripe, o singură folosire, expiră singur).
export const conversionOffer = pgTable("conversion_offer", {
  code: text("code").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  percent: integer("percent").notNull(),
  stripePromoId: text("stripe_promo_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  paymentId: text("payment_id"),
  amount: integer("amount"),
  currency: text("currency"),
}, (t) => [uniqueIndex("conversion_offer_user_idx").on(t.userId)]);

/* ---------- De unde vine fiecare cont nou (Daniel, 16.11.2026), vezi src/lib/sursa.ts și migrația 0037 ---------- */
// Un rând pe cont nou. Sursa, referrer-ul, pagina de intrare, dispozitivul și țara se scriu DOAR dacă omul acceptase
// cookie-urile de analiză (`analytics`); altfel rămân goale și se păstrează doar răspunsul din formular. Conturile de dinainte
// n-au rând: sursa lor e „necunoscut”. `invite`: venit prin legătura de invitație a cuiva (se socotește recomandare).
export const accountSource = pgTable("account_source", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  analytics: boolean("analytics").notNull().default(false),
  source: text("source"), // sursa first-touch, cheia folosită în Analiză → Surse
  firstSrc: text("first_src"), firstUtmSource: text("first_utm_source"), firstMedium: text("first_medium"), firstCampaign: text("first_campaign"),
  firstReferrer: text("first_referrer"), firstLanding: text("first_landing"), firstAt: timestamp("first_at"),
  lastSource: text("last_source"), lastSrc: text("last_src"), lastMedium: text("last_medium"), lastCampaign: text("last_campaign"),
  lastReferrer: text("last_referrer"), lastLanding: text("last_landing"), lastAt: timestamp("last_at"),
  device: text("device"),
  country: text("country"),
  answer: text("answer"), // facebook-grup / facebook-pagina / google / recomandare / card-cadou / altceva
  answerOther: text("answer_other"),
  answerAuto: boolean("answer_auto").notNull().default(false), // „recomandare” pus singur, la contul venit prin invitație
  invite: boolean("invite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("account_source_source_idx").on(t.source)]);

// Linkurile făcute în Admin → Linkuri cu sursă (carteaneamului.ro/?src=<slug>): click-urile se numără din vizitele anonime
// (page_view.source = slug), conturile din account_source.
export const sourceLink = pgTable("source_link", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  page: text("page").notNull().default("/"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- CRM-ul din Admin (Daniel, 17.11.2026), vezi src/lib/crm.ts, migrația 0040 și docs/crm-inventar.md ---------- */
// Instituții și firme (adrese oficiale publice), nu persoane fizice. `dedupe_key` (emailul sau tip|nume|localitate) face importul
// și ingestia idempotente; `slug` dă linkul ?src=<tip>-<slug>; `partner_id` leagă un magazin/o firmă din City Partners.
export const crmOrganizations = pgTable("crm_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tip: text("tip").notNull(),
  nume: text("nume").notNull(),
  localitate: text("localitate"),
  judet: text("judet"),
  tara: text("tara").notNull().default("RO"),
  site: text("site"),
  emailOficial: text("email_oficial"),
  telefon: text("telefon"),
  sursaDatelor: text("sursa_datelor"),
  status: text("status").notNull().default("nou"),
  owner: text("owner").notNull().default("Daniel"),
  note: text("note"),
  deSunat: boolean("de_sunat").notNull().default(false),
  slug: text("slug"),
  dedupeKey: text("dedupe_key").notNull(),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  cod: text("cod"), // NEAM-XXXX: aceeași reducere ca NEAM90, legată de organizație (Etapa 7)
  stripePromoId: text("stripe_promo_id"),
  schoolId: uuid("school_id").references(() => school.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("crm_organizations_dedupe_idx").on(t.dedupeKey), uniqueIndex("crm_organizations_slug_idx").on(t.slug), uniqueIndex("crm_organizations_cod_idx").on(t.cod), index("crm_organizations_status_idx").on(t.tip, t.status)]);

// Persoane de contact DOAR dacă și-au dat singure datele (au răspuns, au completat formularul), cu dovada consimțământului.
export const crmContacts = pgTable("crm_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => crmOrganizations.id, { onDelete: "cascade" }),
  nume: text("nume"),
  rol: text("rol"),
  email: text("email"),
  telefon: text("telefon"),
  consimtamant: boolean("consimtamant").notNull().default(false),
  sursaConsimtamant: text("sursa_consimtamant"),
  consimtamantAt: timestamp("consimtamant_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("crm_contacts_org_idx").on(t.organizationId)]);

// Tot ce s-a întâmplat cu o organizație sau un utilizator. `external_id` face importul și ingestia idempotente.
export const crmActivities = pgTable("crm_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tip: text("tip").notNull(),
  canal: text("canal"),
  rezumat: text("rezumat"),
  at: timestamp("at").notNull().defaultNow(),
  organizationId: uuid("organization_id").references(() => crmOrganizations.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  externalId: text("external_id"),
  meta: jsonb("meta"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
}, (t) => [uniqueIndex("crm_activities_external_idx").on(t.externalId), index("crm_activities_org_idx").on(t.organizationId, t.at), index("crm_activities_user_idx").on(t.userId, t.at)]);

// Ce vindem unei organizații (coduri pentru școală/clasă, abonamente pentru firmă, carduri în magazin) și etapa discuției.
export const crmDeals = pgTable("crm_deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => crmOrganizations.id, { onDelete: "cascade" }),
  produs: text("produs").notNull(),
  conturiEstimate: integer("conturi_estimate"),
  valoareEstimata: integer("valoare_estimata"), // lei
  etapa: text("etapa").notNull().default("nou"),
  urmatorulPas: text("urmatorul_pas"),
  dataUrmatoruluiPas: timestamp("data_urmatorului_pas"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("crm_deals_etapa_idx").on(t.etapa, t.dataUrmatoruluiPas), index("crm_deals_org_idx").on(t.organizationId)]);

// Coada de aprobări: orice mesaj nou către o persoană sau organizație, în afara unei campanii aprobate, așteaptă aici.
export const crmApprovals = pgTable("crm_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipActiune: text("tip_actiune").notNull(),
  payload: jsonb("payload").$type<{ destinatar?: string; subiect?: string; text?: string; [k: string]: unknown }>().notNull(),
  motiv: text("motiv"),
  risc: text("risc").notNull().default("MEDIUM"),
  status: text("status").notNull().default("in_asteptare"),
  organizationId: uuid("organization_id").references(() => crmOrganizations.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  dedupeKey: text("dedupe_key"),
  cineAAprobat: text("cine_a_aprobat").references(() => user.id, { onDelete: "set null" }),
  cand: timestamp("cand"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("crm_approvals_dedupe_idx").on(t.dedupeKey), index("crm_approvals_status_idx").on(t.status, t.createdAt)]);

// Lista „nu contacta”: o adresă sau un domeniu întreg. Verificată înainte de orice trimitere de marketing (src/lib/crm-suppression.ts).
export const crmSuppression = pgTable("crm_suppression", {
  valoare: text("valoare").primaryKey(),
  tip: text("tip").notNull().default("email"), // email / domeniu
  motiv: text("motiv").notNull(), // dezabonat / refuz / nelivrat / nu_contacta
  sursa: text("sursa"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Scorul și etapa fiecărui utilizator (fără a dubla tabelul `user`), socotite din reguli scrise de mână (src/lib/crm-scor.ts).
export const crmUserSignals = pgTable("crm_user_signals", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  sursa: text("sursa"),
  scor: integer("scor").notNull().default(0),
  etapa: text("etapa").notNull().default("cont"),
  ultimaActivitate: timestamp("ultima_activitate"),
  detalii: jsonb("detalii"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("crm_user_signals_etapa_idx").on(t.etapa, t.scor)]);

// CRM Etapa 5 (Daniel, 18.11.2026; src/lib/crm-campanii.ts): șabloanele, campaniile și fiecare email trimis unei organizații.
export const crmTemplates = pgTable("crm_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  nume: text("nume").notNull(),
  tipOrg: text("tip_org"),
  subiect: text("subiect").notNull(),
  corp: text("corp").notNull(),
  butonText: text("buton_text"),
  butonCale: text("buton_cale"),
  activ: boolean("activ").notNull().default(true),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const crmCampaigns = pgTable("crm_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  nume: text("nume").notNull(),
  templateId: uuid("template_id").notNull().references(() => crmTemplates.id, { onDelete: "restrict" }),
  filtru: jsonb("filtru"),
  status: text("status").notNull().default("ciorna"), // ciorna / pornita / oprita / terminata
  limitaZi: integer("limita_zi").notNull().default(20),
  oraStart: integer("ora_start").notNull().default(9),
  oraSfarsit: integer("ora_sfarsit").notNull().default(16),
  followUpZile: integer("follow_up_zile"),
  followUpTemplateId: uuid("follow_up_template_id").references(() => crmTemplates.id, { onDelete: "set null" }),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const crmSends = pgTable("crm_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => crmCampaigns.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => crmOrganizations.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => crmTemplates.id, { onDelete: "set null" }),
  pas: integer("pas").notNull().default(1), // 1 = primul email, 2 = follow-up (doar dacă e setat)
  email: text("email").notNull(),
  status: text("status").notNull().default("trimis"), // trimis / livrat / deschis / click / nelivrat / dezabonat / blocat / eroare
  motiv: text("motiv"),
  resendId: text("resend_id"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  clicks: integer("clicks").notNull().default(0),
  bouncedAt: timestamp("bounced_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  repliedAt: timestamp("replied_at"),
}, (t) => [uniqueIndex("crm_sends_once_idx").on(t.campaignId, t.organizationId, t.pas), index("crm_sends_org_idx").on(t.organizationId, t.sentAt), index("crm_sends_resend_idx").on(t.resendId), index("crm_sends_day_idx").on(t.sentAt)]);

// CRM Etapa 7: contul adus de o organizație (prin ?src=, codul NEAM-XXXX sau codul școlii), câte unul pe cont.
export const crmOrgAccounts = pgTable("crm_org_accounts", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => crmOrganizations.id, { onDelete: "cascade" }),
  via: text("via").notNull(), // src / cod / scoala / manual
  at: timestamp("at").notNull().defaultNow(),
}, (t) => [index("crm_org_accounts_org_idx").on(t.organizationId)]);

// CRM Etapa 8: sarcinile cu termen (src/lib/crm-sarcini.ts).
export const crmTasks = pgTable("crm_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => crmOrganizations.id, { onDelete: "cascade" }),
  titlu: text("titlu").notNull(),
  scadenta: timestamp("scadenta").notNull(),
  status: text("status").notNull().default("deschisa"), // deschisa / facuta / anulata
  sursa: text("sursa").notNull().default("manual"), // manual / nelivrat / raspuns
  dedupeKey: text("dedupe_key"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  doneAt: timestamp("done_at"),
  doneBy: text("done_by").references(() => user.id, { onDelete: "set null" }),
}, (t) => [uniqueIndex("crm_tasks_dedupe_idx").on(t.dedupeKey), index("crm_tasks_due_idx").on(t.status, t.scadenta), index("crm_tasks_org_idx").on(t.organizationId)]);

/* ---------- Școli (Daniel, 17.11.2026; src/lib/scoli.ts, Admin → Școli) ---------- */
// Cererile din formularul „Vreau coduri pentru clasa mea” de pe /scoala. Codurile se dau doar după aprobarea manuală (conducerea
// școlii a confirmat). Datele de contact sunt ale învățătorului/profesorului, folosite doar pentru răspuns.
export const schoolRequest = pgTable("school_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  school: text("school").notNull(),
  locality: text("locality").notNull(),
  county: text("county"),
  classLabel: text("class_label").notNull(), // „a IV-a B”
  students: integer("students").notNull(),
  teacher: text("teacher"),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  status: text("status").notNull().default("nou"), // nou / aprobat / respins
  schoolId: uuid("school_id"),
  decidedBy: text("decided_by").references(() => user.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("school_request_status_idx").on(t.status, t.createdAt)]);

export const school = pgTable("school", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  locality: text("locality").notNull(),
  county: text("county"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("school_name_locality_idx").on(t.name, t.locality)]);

// Un cod de reducere Stripe pe școală sau pe clasă (cupon pe procent + cod promoțional cu folosiri limitate și expirare).
export const schoolCode = pgTable("school_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => school.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").references(() => schoolRequest.id, { onDelete: "set null" }),
  classLabel: text("class_label"),
  code: text("code").notNull().unique(),
  percent: integer("percent").notNull(),
  maxUses: integer("max_uses").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  stripePromoId: text("stripe_promo_id"),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Contul făcut după linkul codului (/scoala/cod/<COD>) și plățile făcute cu codul: statisticile din Admin → Școli.
export const schoolSignup = pgTable("school_signup", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  codeId: uuid("code_id").notNull().references(() => schoolCode.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const schoolPayment = pgTable("school_payment", {
  paymentId: text("payment_id").primaryKey(),
  codeId: uuid("code_id").notNull().references(() => schoolCode.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CRM Etapa 10 (Daniel, 18.11.2026; src/lib/crm-ambasadori.ts): profesorii ambasadori, elevii aduși și recompensele date.
export const crmAmbassadors = pgTable("crm_ambassadors", {
  id: uuid("id").primaryKey().defaultRandom(),
  nume: text("nume").notNull(),
  email: text("email"),
  telefon: text("telefon"),
  acordLa: timestamp("acord_la"),
  organizationId: uuid("organization_id").references(() => crmOrganizations.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  slug: text("slug").notNull(),
  cod: text("cod"),
  stripePromoId: text("stripe_promo_id"),
  schoolCodeId: uuid("school_code_id").references(() => schoolCode.id, { onDelete: "set null" }),
  activ: boolean("activ").notNull().default(true),
  nota: text("nota"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("crm_ambassadors_slug_idx").on(t.slug), uniqueIndex("crm_ambassadors_cod_idx").on(t.cod)]);
export const crmAmbassadorAccounts = pgTable("crm_ambassador_accounts", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  ambassadorId: uuid("ambassador_id").notNull().references(() => crmAmbassadors.id, { onDelete: "cascade" }),
  via: text("via").notNull(), // src / cod / clasa
  at: timestamp("at").notNull().defaultNow(),
}, (t) => [index("crm_ambassador_accounts_idx").on(t.ambassadorId)]);
export const crmAmbassadorPayouts = pgTable("crm_ambassador_payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ambassadorId: uuid("ambassador_id").notNull().references(() => crmAmbassadors.id, { onDelete: "cascade" }),
  suma: integer("suma").notNull(), // lei
  nota: text("nota"),
  at: timestamp("at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
});

/* ---------- Surse publice: „Nu mai arăta” la cardul „Caută în arhive publice” ---------- */
// Pentru fiecare om și fiecare persoană din arbore: cine l-a închis nu-l mai vede la acea persoană (src/lib/surse-publice-db.ts).
export const archiveHintDismissal = pgTable("archive_hint_dismissal", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => person.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ name: "archive_hint_dismissal_pk", columns: [t.userId, t.personId] })]);

/* ---------- Invitații de nuntă (Daniel, 2026-11-27) ---------- */
// O comandă din rubrica /invitatii-nunta, plătită fără cont: cheia e id-ul sesiunii Stripe (o confirmare primită de două ori se
// trece o singură dată). Separat de `payment` (plățile contului). Tokenul de descărcare nu se ține: doar hash-ul lui (SHA-256),
// iar linkul e valabil până la `expires_at` (30 de zile). Vezi src/lib/invitatii-nunta-server.ts.
export const shopOrder = pgTable("shop_order", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  slug: text("slug").notNull(),
  locale: text("locale").notNull(),
  amount: integer("amount").notNull(), // în bani (lei × 100) sau cenți
  currency: text("currency").notNull(), // ron / eur
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  emailsSent: integer("emails_sent").notNull().default(0),
  lastEmailAt: timestamp("last_email_at"),
  downloads: integer("downloads").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("shop_order_token_idx").on(t.tokenHash), index("shop_order_created_idx").on(t.createdAt)]);
