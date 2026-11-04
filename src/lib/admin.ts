/**
 * Cine are voie în panoul de admin: adresele din ADMIN_EMAILS (pe Vercel, despărțite prin virgulă).
 * Adresele nu stau în cod, fiindcă depozitul e public. Fără ADMIN_EMAILS nu e nimeni admin.
 */
export function adminEmails(raw = process.env.ADMIN_EMAILS): string[] {
  return (raw ?? "").split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
}

export function isAdminEmail(email: string | null | undefined, raw = process.env.ADMIN_EMAILS) {
  return !!email && adminEmails(raw).includes(email.trim().toLowerCase());
}

/** Plan „Familie” propus: gratuit până la 200 de persoane și 1 GB de poze pe arbore, apoi 12 €/an pe arbore. */
export const FREE_PERSONS = 200;
export const FREE_BYTES = 1024 ** 3;
export const PRICE_EUR_YEAR = 12;
/** Neon, planul gratuit: 0,5 GB pe proiect. */
export const NEON_FREE_BYTES = 512 * 1024 ** 2;

/** Cheile de mediu de care depinde aplicația: arătăm doar dacă sunt puse, niciodată valoarea. */
export const ENV_KEYS: { key: string; what: string; needed: boolean }[] = [
  { key: "DATABASE_URL", what: "Baza de date Neon (pooled)", needed: true },
  { key: "DATABASE_URL_UNPOOLED", what: "Neon direct, pentru migrații", needed: false },
  { key: "BETTER_AUTH_SECRET", what: "Cheia secretă a sesiunilor", needed: true },
  { key: "BETTER_AUTH_URL", what: "Adresa publică a aplicației", needed: false },
  { key: "ADMIN_EMAILS", what: "Cine intră în panoul de admin", needed: true },
  { key: "GOOGLE_CLIENT_ID", what: "„Continuă cu Google”", needed: false },
  { key: "GOOGLE_CLIENT_SECRET", what: "„Continuă cu Google”", needed: false },
  { key: "NEON_STORAGE_ENDPOINT_URL_S3", what: "Poze și documente (bucket assets)", needed: true },
  { key: "NEON_STORAGE_ACCESS_KEY_ID", what: "Poze și documente", needed: true },
  { key: "NEON_STORAGE_SECRET_ACCESS_KEY", what: "Poze și documente", needed: true },
  { key: "NEON_STORAGE_REGION", what: "Poze și documente", needed: false },
  { key: "NEON_REALTIME_URL", what: "Arborele în timp real", needed: false },
  { key: "NEON_REALTIME_SECRET", what: "Arborele în timp real", needed: false },
  { key: "NEON_FUNCTION_HELLO_BASE_URL", what: "Funcția Neon de probă", needed: false },
  { key: "NEON_AI_GATEWAY_BASE_URL", what: "Sugestii de biografie (plan plătit)", needed: false },
  { key: "NEON_AI_GATEWAY_TOKEN", what: "Sugestii de biografie (plan plătit)", needed: false },
];

/** Local, cheile bucket-ului vin ca AWS_* (din `neon env pull`); pe Vercel ca NEON_STORAGE_*. */
export const envSet = (key: string) => !!(process.env[key]?.trim() || (key.startsWith("NEON_STORAGE_") && process.env[key.replace("NEON_STORAGE_", "AWS_")]?.trim()));
