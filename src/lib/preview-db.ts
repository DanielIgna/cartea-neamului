import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person, tree, treeMember, user } from "@/db/schema";
import { applySchema } from "./bootstrap";
import { auth } from "./auth";
import { writeGedcom } from "./gedcom";
import { demoGedcom } from "./demo-data";
import { importGedcom } from "./gedcom-db";
import { DEMO_EMAIL } from "./demo";

/** Parola contului demo din variantele de probă și de pe calculator (aceeași ca în scripts/seed.ts). */
export const PREVIEW_DEMO_PASSWORD = "demo-parola-123";

/**
 * Variantele de probă de pe Vercel (24.11.2026): baza e PGlite în /tmp, goală la fiecare pornire. Aici primește schema și
 * arborele de exemplu „Neamul Pop din Ieud”, cu contul demo, ca să se poată intra și încerca. Nu rulează niciodată cu DATABASE_URL.
 */
export async function preparePreviewDb() {
  if (process.env.DATABASE_URL) return;
  await applySchema(db);
  const [existing] = await db.select({ id: tree.id }).from(tree).where(eq(tree.name, "Neamul Pop din Ieud")).limit(1);
  if (existing) return;
  let [demo] = await db.select().from(user).where(eq(user.email, DEMO_EMAIL));
  if (!demo) demo = (await auth.api.signUpEmail({ body: { email: DEMO_EMAIL, password: PREVIEW_DEMO_PASSWORD, name: "Andrei Pop (demo)" } })).user as typeof demo;
  const [t] = await db.insert(tree).values({ name: "Neamul Pop din Ieud", region: "Maramureș", ownerId: demo.id }).returning();
  await db.insert(treeMember).values({ treeId: t.id, userId: demo.id, role: "owner" });
  await importGedcom(db, t.id, writeGedcom(demoGedcom(), { source: "Neamul Pop din Ieud (exemplu)" }));
  const [root] = await db.select().from(person).where(and(eq(person.treeId, t.id), eq(person.gedcomXref, "@I1@")));
  if (root) {
    await db.update(tree).set({ rootPersonId: root.id }).where(eq(tree.id, t.id));
    await db.update(person).set({ claimedByUserId: demo.id, privacy: "claimed" }).where(eq(person.id, root.id));
  }
  console.log("Varianta de probă: baza locală e gata, cu contul demo.");
}
