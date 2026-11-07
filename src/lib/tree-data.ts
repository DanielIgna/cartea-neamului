import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { person, tree, document, documentLink, relationship, user } from "@/db/schema";
import type { Rel } from "./kinship";
import { fetchAncestorRows, toAhnentafel } from "./ancestry";
import { parseFuzzyDate } from "./dates";
import { raisedIn, type Raised } from "./raised";
import { memoryMediaIds } from "./lada-db";
import { countryCode, countryName } from "./place-key";

export type PersonView = {
  id: string; name: string; givenName: string; surname: string; birthSurname: string | null; sex: "M" | "F" | "U";
  birthText: string | null; birthPlace: string | null; deathText: string | null; deathPlace: string | null;
  birthCountry: string | null; deathCountry: string | null; residencePlace: string | null; residenceCountry: string | null;
  birthYear: number | null; deathYear: number | null; approx: boolean;
  living: boolean; discreet: boolean; claimed: boolean; occupation: string | null; biography: string | null; notes: string | null;
  createdBy: string | null; claimedBy: string | null; photoId: string | null;
  /** Poza din contul celui care și-a revendicat fișa (de pildă din Google), folosită când fișa nu are o poză încărcată. */
  accountImage?: string | null;
  documents: { id: string; title: string; kind: string; dateText: string | null; hasFile: boolean; description?: string | null; mimeType?: string | null }[];
};

export function toView(p: typeof person.$inferSelect, docs: PersonView["documents"] = [], accountImage: string | null = null): PersonView {
  const b = parseFuzzyDate(p.birthDateText), d = parseFuzzyDate(p.deathDateText);
  return {
    id: p.id, name: `${p.givenName} ${p.surname}`.trim(), givenName: p.givenName, surname: p.surname, birthSurname: p.birthSurname, sex: p.sex,
    birthText: p.birthDateText, birthPlace: p.birthPlace, deathText: p.deathDateText, deathPlace: p.deathPlace,
    birthCountry: p.birthCountry, deathCountry: p.deathCountry, residencePlace: p.residencePlace, residenceCountry: p.residenceCountry,
    birthYear: b.year, deathYear: d.year, approx: b.approx, living: p.living, discreet: p.discreet, claimed: !!p.claimedByUserId,
    occupation: p.occupation, biography: p.biography, notes: p.notes, createdBy: p.createdBy, claimedBy: p.claimedByUserId, photoId: p.photoDocumentId, accountImage, documents: docs,
  };
}

export const MAX_GENERATIONS = 10;

/** Doar pozele de cont venite de la Google (adrese https de pe googleusercontent.com), nu orice adresă pusă în cont. */
export function safeAccountImage(url: string | null | undefined): string | null {
  return url && /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//i.test(url) ? url : null;
}

/** „Huedin” sau „Torino, Italia”: țara se scrie doar când nu e România. */
export function where(place: string | null | undefined, country: string | null | undefined, locale?: string) {
  const c = country?.trim(), cc = countryCode(c);
  return [place?.trim(), c && cc !== "RO" ? (cc && locale ? countryName(cc, locale) : c) : null].filter(Boolean).join(", ");
}

/**
 * Tot ce are nevoie ecranul arborelui: toate persoanele și relațiile arborelui (pentru frați, soți, copii,
 * descendenți și gradul de rudenie), cine pe cine a crescut, plus ascendenții persoanei centrale numerotați Ahnentafel.
 */
export async function loadTreeView(db: Db, treeId: string, centerId?: string, generations = 4) {
  const [t] = await db.select().from(tree).where(eq(tree.id, treeId));
  if (!t) return null;
  const rows = await db.select().from(person).where(eq(person.treeId, treeId));
  const center = centerId && rows.some((p) => p.id === centerId) ? centerId : t.rootPersonId;
  const empty = { tree: t, centerId: null, rootId: t.rootPersonId, slots: {} as Record<number, string>, people: {} as Record<string, PersonView>, rels: [] as Rel[], raised: [] as Raised[] };
  if (!center) return empty;
  const gens = Math.min(Math.max(generations, 1), MAX_GENERATIONS);
  const ahnen = toAhnentafel(await fetchAncestorRows(db, center, gens));
  const relRows: Rel[] = (await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB, start: relationship.startText, created: relationship.createdAt })
    .from(relationship).where(eq(relationship.treeId, treeId))).map((r) => ({ ...r, created: r.created.getTime() }));
  const ids = rows.map((p) => p.id);
  // Pozele și glasul puse la amintiri nu intră în album (le deschide doar cine vede amintirea).
  const media = await memoryMediaIds(db, treeId);
  const links = (ids.length
    ? await db.select({ personId: documentLink.personId, id: document.id, title: document.title, kind: document.kind, dateText: document.dateText, fileKey: document.fileKey, description: document.description, mimeType: document.mimeType })
        .from(documentLink).innerJoin(document, eq(document.id, documentLink.documentId)).where(inArray(documentLink.personId, ids))
    : []).filter((l) => !media.has(l.id));
  // Cine și-a revendicat fișa poate avea poză în cont (din Google): o arătăm când fișa nu are poză încărcată.
  const claimers = [...new Set(rows.map((p) => p.claimedByUserId).filter((u): u is string => !!u))];
  const images = new Map(claimers.length ? (await db.select({ id: user.id, image: user.image }).from(user).where(inArray(user.id, claimers))).map((u) => [u.id, safeAccountImage(u.image)]) : []);
  const people: Record<string, PersonView> = {};
  for (const p of rows) people[p.id] = toView(p, links.filter((l) => l.personId === p.id).map(({ personId: _, fileKey, ...d }) => ({ ...d, hasFile: !!fileKey })), images.get(p.claimedByUserId ?? "") ?? null);
  const slots: Record<number, string> = {};
  for (const [n, id] of ahnen) slots[n] = id;
  return { tree: t, centerId: center, rootId: t.rootPersonId, slots, people, rels: relRows, raised: await raisedIn(db, treeId) };
}

export async function loadTimeline(db: Db, treeId: string) {
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  return people.map((p) => toView(p)).filter((p) => p.birthYear).sort((a, b) => a.birthYear! - b.birthYear!);
}
