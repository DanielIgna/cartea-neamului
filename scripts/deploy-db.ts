/**
 * Rulează la fiecare publicare pe Vercel, înainte de `next build`:
 * aplică migrațiile noi pe baza Neon și completează arborele de exemplu cu persoanele noi din `demo-data.ts`.
 * Ambii pași sunt idempotenți; nu șterg și nu schimbă date existente.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { applySchema } from "../src/lib/bootstrap";
import { tree } from "../src/db/schema";
import { syncDemo } from "../src/lib/demo-sync";
import { fixIgnaTodea, fixCurtuliMaiden } from "../src/lib/corectura-igna-todea";

if (!process.env.DATABASE_URL) {
  console.log("deploy-db: fără DATABASE_URL, nu am ce migra.");
  process.exit(0);
}
await applySchema(db);
console.log("deploy-db: migrațiile sunt aplicate.");
const [demo] = await db.select({ id: tree.id }).from(tree).where(eq(tree.name, "Neamul Pop din Ieud")).limit(1);
if (demo) console.log(`deploy-db: arborele de exemplu, ${await syncDemo(db, demo.id)} persoane noi.`);
// Corectura din 12.11.2026 (Iosif Todea fiul, Jenica, Anca, Simona, Valeria, Floarea Curtuli): o singură dată; o greșeală nu oprește publicarea.
try { console.log(`deploy-db: corectura Igna–Todea: ${await fixIgnaTodea(db)}`); } catch (e) { console.error("deploy-db: corectura Igna–Todea a eșuat", e); }
try { console.log(`deploy-db: numele de fată Curtuli → Igna: ${await fixCurtuliMaiden(db)}`); } catch (e) { console.error("deploy-db: corectura Curtuli a eșuat", e); }
process.exit(0);
