import path from "node:path";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Bucket-ul privat din neon.ts pentru poze și documente scanate. */
export const BUCKET = "assets";

/**
 * Neon Object Storage vorbește S3. Local, cheile vin din AWS_* (scrise de `neon env pull`). Pe Vercel numele AWS_* sunt
 * rezervate de platformă, așa că acolo le punem ca NEON_STORAGE_*; Neon cere și adresare „path-style”.
 */
const env = (name: string) => process.env[`NEON_STORAGE_${name}`] || process.env[`AWS_${name}`];

const s3Configured = () => Boolean(env("ENDPOINT_URL_S3") && env("ACCESS_KEY_ID") && env("SECRET_ACCESS_KEY"));
/** Fără chei S3, pe calculatorul de dezvoltare fișierele stau în ./.data/files (niciodată pe Vercel). */
export const localStorageMode = () => !s3Configured() && !process.env.VERCEL && process.env.NODE_ENV !== "test";
const localPath = (key: string) => path.join(process.cwd(), ".data", "files", key);

export function storageConfigured() {
  return s3Configured() || localStorageMode();
}

let client: S3Client | null = null;
const s3 = () => (client ??= new S3Client({
  forcePathStyle: true,
  endpoint: env("ENDPOINT_URL_S3"),
  region: env("REGION") ?? "eu-central-1",
  credentials: { accessKeyId: env("ACCESS_KEY_ID")!, secretAccessKey: env("SECRET_ACCESS_KEY")! },
}));

export async function bucketReachable() {
  await s3().send(new HeadBucketCommand({ Bucket: BUCKET }));
  return { bucket: BUCKET };
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  if (localStorageMode()) {
    await mkdir(path.dirname(localPath(key)), { recursive: true });
    return writeFile(localPath(key), body);
  }
  await s3().send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function getObjectBytes(key: string) {
  if (localStorageMode()) return new Uint8Array(await readFile(localPath(key)));
  const res = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return res.Body!.transformToByteArray();
}

/**
 * Șterge fișierele (pozele, actele, înregistrările) după ce rândurile lor au plecat din baza de date: când cineva își șterge
 * contul, o amintire sau acordul pentru capitolul „Credința”. Câte unul, câte cinci deodată; ce nu merge rămâne scris în jurnal,
 * fără să oprească restul (rândul din baza de date e deja șters, deci fișierul nu se mai poate deschide din site).
 */
export async function deleteObjects(keys: (string | null | undefined)[]) {
  const todo = [...new Set(keys.filter((k): k is string => !!k))];
  if (!todo.length || !storageConfigured()) return { deleted: 0, failed: 0 };
  let deleted = 0, failed = 0;
  for (let i = 0; i < todo.length; i += 5) {
    await Promise.all(todo.slice(i, i + 5).map(async (key) => {
      try {
        if (localStorageMode()) await rm(localPath(key), { force: true });
        else await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        deleted++;
      } catch (e) {
        failed++;
        console.error("deleteObjects", key, e);
      }
    }));
  }
  return { deleted, failed };
}

/** Link temporar (implicit 10 minute) către un obiect privat, fără să expunem cheile. */
export function presignedGetUrl(key: string, expiresIn = 600) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

/** Cheia obiectului: grupată pe arbore, cu un id unic ca să nu suprascriem niciodată un fișier. */
export function documentKey(treeId: string, fileName: string) {
  const safe = fileName.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80) || "fisier";
  return `arbori/${treeId}/documente/${crypto.randomUUID()}-${safe}`;
}
