import {
  pgTable, text, integer, boolean, timestamp, uuid, pgEnum, jsonb, index, uniqueIndex, date,
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
  deathDateText: text("death_date_text"),
  deathFrom: date("death_from"),
  deathTo: date("death_to"),
  deathPlace: text("death_place"),
  living: boolean("living").notNull().default(false),
  biography: text("biography"),
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
