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
  purpose: text("purpose").notNull(), // claim_profile / appear_in_book / professional_profile / external_sync
  textVersion: text("text_version").notNull(),
  granted: boolean("granted").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
