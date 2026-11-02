import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Bucket-ul privat din neon.ts pentru poze și documente scanate. */
export const BUCKET = "assets";

/**
 * Neon Object Storage vorbește S3. Cheile, endpoint-ul și regiunea vin din AWS_* (scrise de `neon env pull`),
 * pe care clientul AWS le citește singur; Neon cere doar adresare „path-style”.
 */
export function storageConfigured() {
  return Boolean(process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

let client: S3Client | null = null;
const s3 = () => (client ??= new S3Client({ forcePathStyle: true }));

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await s3().send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function getObjectBytes(key: string) {
  const res = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return res.Body!.transformToByteArray();
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
