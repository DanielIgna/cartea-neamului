import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { invitation, treeMember, person, tree } from "@/db/schema";
import type { Role } from "./access";

/** Cât ține un link de invitație. Tabela nu ține minte când s-a făcut linkul: e cu atâtea zile înainte de expirare. */
export const INVITE_VALID_DAYS = 14;
const VALID_DAYS = INVITE_VALID_DAYS;
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** Creează un link de invitație. În baza de date păstrăm doar hash-ul tokenului. */
export async function createInvitation(db: Db, o: { treeId: string; createdBy: string; role: Exclude<Role, "owner">; personId?: string | null; now?: Date }) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date((o.now ?? new Date()).getTime() + VALID_DAYS * 864e5);
  await db.insert(invitation).values({ treeId: o.treeId, tokenHash: hashToken(token), role: o.role, personId: o.personId ?? null, createdBy: o.createdBy, expiresAt });
  return { token, expiresAt };
}

export async function findInvitation(db: Db, token: string) {
  const [row] = await db.select({ inv: invitation, treeName: tree.name }).from(invitation)
    .innerJoin(tree, eq(tree.id, invitation.treeId)).where(eq(invitation.tokenHash, hashToken(token)));
  return row ?? null;
}

export type AcceptResult = { ok: true; treeId: string; claimed: boolean } | { ok: false; reason: "invalid" | "expired" | "used" };

/** Acceptă invitația: utilizatorul devine membru și, dacă invitația e pentru o persoană din arbore, își revendică fișa. */
export async function acceptInvitation(db: Db, token: string, userId: string, now = new Date()): Promise<AcceptResult> {
  const found = await findInvitation(db, token);
  if (!found) return { ok: false, reason: "invalid" };
  const inv = found.inv;
  if (inv.acceptedBy && inv.acceptedBy !== userId) return { ok: false, reason: "used" };
  if (inv.expiresAt < now) return { ok: false, reason: "expired" };
  await db.insert(treeMember).values({ treeId: inv.treeId, userId, role: inv.role, invitedBy: inv.createdBy }).onConflictDoNothing();
  await db.update(invitation).set({ acceptedBy: userId, acceptedAt: now }).where(eq(invitation.id, inv.id));
  let claimed = false;
  if (inv.personId) {
    const res = await db.update(person).set({ claimedByUserId: userId, privacy: "claimed", updatedAt: now })
      .where(and(eq(person.id, inv.personId), isNull(person.claimedByUserId))).returning({ id: person.id });
    claimed = res.length > 0;
  }
  return { ok: true, treeId: inv.treeId, claimed };
}
