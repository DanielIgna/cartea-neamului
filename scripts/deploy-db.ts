/**
 * Rulează la fiecare publicare pe Vercel, înainte de `next build`:
 * aplică migrațiile noi pe baza Neon și completează arborele de exemplu cu persoanele noi din `demo-data.ts`.
 * Ambii pași sunt idempotenți; nu șterg și nu schimbă date existente.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { applySchema } from "../src/lib/bootstrap";
import { tree } from "../src/db/schema";
import { basicPrice49Once, startSalesOnce } from "../src/lib/plans";
import { syncDemo } from "../src/lib/demo-sync";
import { testBatchOnce } from "../src/lib/carduri-cadou";
import { fixIgnaTodea, fixCurtuliMaiden, fixAncaSimona } from "../src/lib/corectura-igna-todea";

if (!process.env.DATABASE_URL) {
  console.log("deploy-db: fără DATABASE_URL, nu am ce migra.");
  // Basic 49 lei în loc de 50 (Daniel, 13.11.2026): o singură dată; după aceea prețul se schimbă din Admin.
try { console.log(`deploy-db: prețul Basic 49 lei: ${await basicPrice49Once(db)}`); } catch (e) { console.error("deploy-db: prețul Basic 49 a eșuat", e); }
process.exit(0);
}
await applySchema(db);
console.log("deploy-db: migrațiile sunt aplicate.");
const [demo] = await db.select({ id: tree.id }).from(tree).where(eq(tree.name, "Neamul Pop din Ieud")).limit(1);
if (demo) console.log(`deploy-db: arborele de exemplu, ${await syncDemo(db, demo.id)} persoane noi.`);
// Corectura din 12.11.2026 (Iosif Todea fiul, Jenica, Anca, Simona, Valeria, Floarea Curtuli): o singură dată; o greșeală nu oprește publicarea.
try { console.log(`deploy-db: corectura Igna–Todea: ${await fixIgnaTodea(db)}`); } catch (e) { console.error("deploy-db: corectura Igna–Todea a eșuat", e); }
try { console.log(`deploy-db: numele de fată Curtuli → Igna: ${await fixCurtuliMaiden(db)}`); } catch (e) { console.error("deploy-db: corectura Curtuli a eșuat", e); }
try { console.log(`deploy-db: Anca și Simona la Iosif fiul: ${await fixAncaSimona(db)}`); } catch (e) { console.error("deploy-db: corectura Anca/Simona a eșuat", e); }
// Pornirea vânzării (Daniel, 13.11.2026): o singură dată; după aceea comutatorul din Admin hotărăște.
try { console.log(`deploy-db: pornirea vânzării: ${await startSalesOnce(db)}`); } catch (e) { console.error("deploy-db: pornirea vânzării a eșuat", e); }
// Basic 49 lei în loc de 50 (Daniel, 13.11.2026): o singură dată; după aceea prețul se schimbă din Admin.
try { console.log(`deploy-db: prețul Basic 49 lei: ${await basicPrice49Once(db)}`); } catch (e) { console.error("deploy-db: prețul Basic 49 a eșuat", e); }
// Carduri cadou (Daniel, 14.11.2026): o singură dată, magazinul „Test Magazin” cu un lot de 5 coduri de verificat.
try { console.log(`deploy-db: carduri cadou de test: ${await testBatchOnce(db)}`); } catch (e) { console.error("deploy-db: lotul de test a eșuat", e); }
process.exit(0);
