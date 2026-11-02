import { writeFileSync } from "node:fs";
import { eq, and } from "drizzle-orm";
import { db } from "../src/db";
import { runMigrations } from "../src/db/migrate";
import { tree, person, document, documentLink, treeMember, user } from "../src/db/schema";
import { auth } from "../src/lib/auth";
import { writeGedcom } from "../src/lib/gedcom";
import { demoGedcom } from "../src/lib/demo-data";
import { importGedcom } from "../src/lib/gedcom-db";

await runMigrations(db);
const ged = writeGedcom(demoGedcom(), { source: "Neamul Pop din Ieud (exemplu)" });
writeFileSync("fixtures/familia-pop-ieud.ged", ged);

const existing = await db.select().from(tree).where(eq(tree.name, "Neamul Pop din Ieud"));
if (existing.length) {
  console.log("Arborele de exemplu există deja:", existing[0].id);
  process.exit(0);
}
const DEMO_EMAIL = "demo@cartea-neamului.ro", DEMO_PASS = "demo-parola-123";
let [demo] = await db.select().from(user).where(eq(user.email, DEMO_EMAIL));
if (!demo) demo = (await auth.api.signUpEmail({ body: { email: DEMO_EMAIL, password: DEMO_PASS, name: "Andrei Pop (demo)" } })).user as typeof demo;
const [t] = await db.insert(tree).values({ name: "Neamul Pop din Ieud", region: "Maramureș", ownerId: demo.id }).returning();
await db.insert(treeMember).values({ treeId: t.id, userId: demo.id, role: "owner" });
const res = await importGedcom(db, t.id, ged);
const [root] = await db.select().from(person).where(and(eq(person.treeId, t.id), eq(person.gedcomXref, "@I1@")));
await db.update(tree).set({ rootPersonId: root.id }).where(eq(tree.id, t.id));
await db.update(person).set({ claimedByUserId: demo.id, privacy: "claimed" }).where(eq(person.id, root.id));

const [toader] = await db.select().from(person).where(and(eq(person.treeId, t.id), eq(person.gedcomXref, "@I8@")));
for (const [title, kind, dateText] of [["Act de botez, Parohia greco-catolică Ieud", "act", "1898"], ["Livret militar, Regimentul 85 Infanterie", "act", "1916"]] as const) {
  const [d] = await db.insert(document).values({ treeId: t.id, kind, title, dateText }).returning();
  await db.insert(documentLink).values({ documentId: d.id, personId: toader.id });
}
console.log(`Arbore creat: ${t.id} · ${res.persons} persoane · ${res.relationships} relații`);
console.log(`Cont demo: ${DEMO_EMAIL} / ${DEMO_PASS}`);
process.exit(0);
