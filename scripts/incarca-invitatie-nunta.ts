/**
 * Urcă ZIP-ul unui model de invitație de nuntă în storage-ul privat (Neon Object Storage), la cheia din catalog
 * (src/lib/invitatii-nunta.ts, `zipKey`, de pildă magazin/invitatii-nunta/maramures.zip). Nu publică nimic: fișierul se poate
 * descărca doar cu linkul primit după plată.
 *
 *   npx tsx --env-file=.env.local scripts/incarca-invitatie-nunta.ts maramures ~/Public/Proiecte/invitatii-nunta/maramures.zip
 *
 * Cheile storage-ului vin din .env.local (AWS_* sau NEON_STORAGE_*). Fără ele, fișierul ajunge în ./.data/files (doar local).
 */
import { readFile } from "node:fs/promises";
import { modelBySlug } from "../src/lib/invitatii-nunta";
import { localStorageMode, putObject } from "../src/lib/storage";

const [slug, file] = process.argv.slice(2);
const model = modelBySlug(slug);
if (!model || !file) {
  console.error("Folosire: npx tsx --env-file=.env.local scripts/incarca-invitatie-nunta.ts <slug> <fisier.zip>");
  process.exit(1);
}
const bytes = new Uint8Array(await readFile(file));
// Un ZIP începe cu „PK\x03\x04”.
if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
  console.error(`${file} nu este un fișier ZIP.`);
  process.exit(1);
}
await putObject(model.zipKey, bytes, "application/zip");
console.log(`Gata: ${(bytes.length / 1_048_576).toFixed(1)} MB urcați la ${model.zipKey}${localStorageMode() ? " (local, în ./.data/files)" : ""}.`);
