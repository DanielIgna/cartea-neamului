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

/**
 * Arhiva sigilată (src/lib/arhivare.ts): cheile care încep cu „arhiva/” pot sta într-o magazie rece, ieftină, compatibilă S3
 * (de pildă Backblaze B2, regiunea din UE), dacă sunt puse cheile ARCHIVE_S3_*. Fără ele, stau în același bucket, doar comprimate.
 * Toate funcțiile de mai jos aleg singure locul după cheie, deci restul site-ului nu trebuie să știe unde e un fișier.
 */
export const ARCHIVE_PREFIX = "arhiva/";
export const isArchiveKey = (key: string) => key.startsWith(ARCHIVE_PREFIX);
const aenv = (name: string) => process.env[`ARCHIVE_S3_${name}`]?.trim();
export const coldArchiveConfigured = () => Boolean(aenv("ENDPOINT") && aenv("BUCKET") && aenv("ACCESS_KEY_ID") && aenv("SECRET_ACCESS_KEY"));
let archiveClient: S3Client | null = null;
const cold = () => (archiveClient ??= new S3Client({
  endpoint: aenv("ENDPOINT"),
  region: aenv("REGION") ?? "eu-central-003",
  credentials: { accessKeyId: aenv("ACCESS_KEY_ID")!, secretAccessKey: aenv("SECRET_ACCESS_KEY")! },
}));
/** Clientul și bucket-ul pentru o cheie: magazia rece pentru arhivă (dacă e pusă), altfel bucket-ul obișnuit. */
const target = (key: string) => (isArchiveKey(key) && coldArchiveConfigured() ? { c: cold(), Bucket: aenv("BUCKET")! } : { c: s3(), Bucket: BUCKET });

export async function bucketReachable() {
  await s3().send(new HeadBucketCommand({ Bucket: BUCKET }));
  return { bucket: BUCKET };
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  if (localStorageMode()) {
    await mkdir(path.dirname(localPath(key)), { recursive: true });
    return writeFile(localPath(key), body);
  }
  const { c, Bucket } = target(key);
  await c.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function getObjectBytes(key: string) {
  if (localStorageMode()) return new Uint8Array(await readFile(localPath(key)));
  const { c, Bucket } = target(key);
  const res = await c.send(new GetObjectCommand({ Bucket, Key: key }));
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
        else { const { c, Bucket } = target(key); await c.send(new DeleteObjectCommand({ Bucket, Key: key })); }
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
export function presignedGetUrl(key: string, expiresIn = 600, downloadName?: string) {
  const { c, Bucket } = target(key);
  // Cu `downloadName`, browserul salvează fișierul cu acest nume, în loc să-l deschidă (invitațiile de nuntă, ZIP-ul).
  const disposition = downloadName ? { ResponseContentDisposition: `attachment; filename="${downloadName.replace(/[^\w.-]+/g, "_")}"` } : {};
  return getSignedUrl(c, new GetObjectCommand({ Bucket, Key: key, ...disposition }), { expiresIn });
}

/** Cheia obiectului: grupată pe arbore, cu un id unic ca să nu suprascriem niciodată un fișier. */
export function documentKey(treeId: string, fileName: string) {
  const safe = fileName.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80) || "fisier";
  return `arbori/${treeId}/documente/${crypto.randomUUID()}-${safe}`;
}
