/**
 * Limitele de editare puse din panoul de admin („Istoric și limite”): unui om (de pildă cineva care a șters din greșeală
 * sau a stricat datele) sau unui arbore întreg. Stau în app_setting, sub o singură cheie; fără limite, totul e ca până acum.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";

const KEY = "edit_limits";

/** Limitele unui om, de la cea mai blândă la cea mai strictă. */
export const USER_MODES = {
  "fara-stergeri": "Fără ștergeri: poate adăuga și corecta, dar nu șterge, nu unește fișe și nu scoate legături",
  "doar-adauga": "Doar adaugă: poate trece oameni noi, dar nu schimbă și nu șterge nimic din ce e deja",
  blocat: "Blocat: doar se uită, nu poate schimba nimic în arbori",
} as const;
/** Limitele unui arbore întreg. */
export const TREE_MODES = {
  editori: "Doar proprietarul și editorii pot schimba ceva (ceilalți doar se uită)",
  proprietar: "Înghețat: doar proprietarul arborelui poate schimba ceva",
} as const;
export type UserMode = keyof typeof USER_MODES;
export type TreeMode = keyof typeof TREE_MODES;

const Entry = <T extends string>(modes: readonly [T, ...T[]]) => z.object({
  mode: z.enum(modes), note: z.string().max(200).nullable().default(null), at: z.string(), by: z.string().nullable().default(null),
});
const UserEntry = Entry(Object.keys(USER_MODES) as [UserMode, ...UserMode[]]);
const TreeEntry = Entry(Object.keys(TREE_MODES) as [TreeMode, ...TreeMode[]]);
const Limits = z.object({ users: z.record(UserEntry).default({}), trees: z.record(TreeEntry).default({}) });
export type EditLimits = z.infer<typeof Limits>;

export async function editLimits(db: Pick<Db, "select">): Promise<EditLimits> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY));
  const parsed = Limits.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : { users: {}, trees: {} };
}

async function save(db: Pick<Db, "insert">, v: EditLimits, by: string, now = new Date()) {
  await db.insert(appSetting).values({ key: KEY, value: v, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: v, updatedBy: by, updatedAt: now } });
}

/** Pune sau scoate (`null`) limita unui om. */
export async function setUserLimit(db: Pick<Db, "select" | "insert">, userId: string, mode: UserMode | null, note: string | null, by: string) {
  const v = await editLimits(db);
  if (mode) v.users[userId] = { mode, note: note?.trim().slice(0, 200) || null, at: new Date().toISOString(), by };
  else delete v.users[userId];
  await save(db, v, by);
}

/** Pune sau scoate (`null`) limita unui arbore. */
export async function setTreeLimit(db: Pick<Db, "select" | "insert">, treeId: string, mode: TreeMode | null, note: string | null, by: string) {
  const v = await editLimits(db);
  if (mode) v.trees[treeId] = { mode, note: note?.trim().slice(0, 200) || null, at: new Date().toISOString(), by };
  else delete v.trees[treeId];
  await save(db, v, by);
}

/** Ce fel de schimbare: o persoană nouă, o corectură (date, legături) sau o ștergere (și unirea a două fișe). */
export type EditOp = "add" | "edit" | "delete";
export type LimitCode = "blocked" | "addOnly" | "noDelete" | "treeEditors" | "treeOwner";

/** De ce nu poate omul face schimbarea, sau `null` dacă poate. Rolul în arbore se verifică separat, ca până acum. */
export function limitFor(l: EditLimits, treeId: string, userId: string, role: string | null, op: EditOp): LimitCode | null {
  const t = l.trees[treeId]?.mode;
  if (t === "proprietar" && role !== "owner") return "treeOwner";
  if (t === "editori" && role !== "owner" && role !== "editor") return "treeEditors";
  const u = l.users[userId]?.mode;
  if (u === "blocat") return "blocked";
  if (u === "doar-adauga" && op !== "add") return "addOnly";
  if (u === "fara-stergeri" && op === "delete") return "noDelete";
  return null;
}
