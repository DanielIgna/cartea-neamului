/**
 * Rulează la fiecare publicare pe Vercel, înainte de `next build`:
 * aplică migrațiile noi pe baza Neon și completează arborele de exemplu cu persoanele noi din `demo-data.ts`.
 * Ambii pași sunt idempotenți; nu șterg și nu schimbă date existente.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { applySchema } from "../src/lib/bootstrap";
import { tree } from "../src/db/schema";
import { basicPrice49Once, offerNov18Once, startSalesOnce } from "../src/lib/plans";
import { syncDemo } from "../src/lib/demo-sync";
import { testBatchOnce, testDigitalOnce } from "../src/lib/carduri-cadou";
import { startActivationOnce, startGoogleOnce, startSeoEngineOnce } from "../src/lib/autonomie";
import { readFileSync } from "node:fs";
import { seedPressDraftsOnce, seedPressOnce } from "../src/lib/crm-import";
import { fixIgnaTodea, fixCurtuliMaiden, fixAncaSimona } from "../src/lib/corectura-igna-todea";

if (!process.env.DATABASE_URL) {
  console.log("deploy-db: fără DATABASE_URL, nu am ce migra.");
  // Basic 49 lei în loc de 50 (Daniel, 13.11.2026): o singură dată; după aceea prețul se schimbă din Admin.
try { console.log(`deploy-db: prețul Basic 49 lei: ${await basicPrice49Once(db)}`); } catch (e) { console.error("deploy-db: prețul Basic 49 a eșuat", e); }
process.exit(0);
}
// O variantă de probă (Vercel Preview) nu schimbă niciodată baza: dacă cineva pune DATABASE_URL și pentru Preview, ar putea fi
// chiar baza reală, iar o ramură nepublicată i-ar schimba structura și datele (24.11.2026).
if (process.env.VERCEL_ENV === "preview") {
  console.log("deploy-db: variantă de probă, nu schimb baza de date.");
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
// Oferta din 18.11.2026: cartea PDF separată, 39 lei / 8 €, „separat” la toate planurile, fără tipar. O singură dată.
try { console.log(`deploy-db: oferta din 18 noiembrie: ${await offerNov18Once(db)}`); } catch (e) { console.error("deploy-db: oferta din 18 noiembrie a eșuat", e); }
// Carduri cadou (Daniel, 14.11.2026): o singură dată, magazinul „Test Magazin” cu un lot de 5 coduri de verificat.
try { console.log(`deploy-db: carduri cadou de test: ${await testBatchOnce(db)}`); } catch (e) { console.error("deploy-db: lotul de test a eșuat", e); }
// Carduri digitale (Daniel, 14.11.2026): o singură dată, un lot digital de 5 carduri pentru „Test Magazin”.
try { console.log(`deploy-db: carduri digitale de test: ${await testDigitalOnce(db)}`); } catch (e) { console.error("deploy-db: lotul digital de test a eșuat", e); }
// Motorul SEO (Daniel, 16.11.2026: „continuă” după proba pe 20 de pagini): pornit o singură dată, cu primul lot de 50.
try { console.log(`deploy-db: motorul SEO: ${await startSeoEngineOnce(db)}`); } catch (e) { console.error("deploy-db: pornirea motorului SEO a eșuat", e); }
// Activarea (Daniel, 17.11.2026): emailul de 24 h fără arbore și sfaturile pe email (doar cu bifa omului), pornite o singură dată.
try { console.log(`deploy-db: activarea: ${await startActivationOnce(db)}`); } catch (e) { console.error("deploy-db: pornirea activării a eșuat", e); }
try { console.log(`deploy-db: Google: ${await startGoogleOnce(db)}`); } catch (e) { console.error("deploy-db: pornirea anunțurilor Google a eșuat", e); }
// Redacțiile de presă (Daniel, 25.11.2026): intră o singură dată în CRM, la „Presă”; nu se trimite nimic de aici.
try { console.log(`deploy-db: presa în CRM: ${await seedPressOnce(db, readFileSync("src/data/crm-presa.csv", "utf8"))}`); } catch (e) { console.error("deploy-db: lista de presă a eșuat", e); }
try { console.log(`deploy-db: emailuri pentru presă: ${await seedPressDraftsOnce(db, JSON.parse(readFileSync("src/data/crm-presa-mesaje.json", "utf8")))}`); } catch (e) { console.error("deploy-db: emailurile pentru presă au eșuat", e); }
process.exit(0);
