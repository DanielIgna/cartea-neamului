/**
 * Cine are voie în panoul de admin: adresele din ADMIN_EMAILS (pe Vercel, despărțite prin virgulă) și cel care ține site-ul
 * (OWNER_ADMIN), pe care l-a cerut el însuși, fiindcă setările din Vercel nu se pot pune ușor.
 */
export function adminEmails(raw = process.env.ADMIN_EMAILS): string[] {
  return (raw ?? "").split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
}

export function isAdminEmail(email: string | null | undefined, raw = process.env.ADMIN_EMAILS) {
  return !!email && adminEmails(raw).includes(email.trim().toLowerCase());
}

/**
 * Proprietarii site-ului, cu drepturi depline în panou: Daniel Igna (6 noiembrie 2026) și, la cererea lui (13 noiembrie 2026),
 * soția lui, Cristina Igna, „admin master” și adresa de recuperare. Adresele sunt publice, așa că nu ajunge să-ți faci un cont
 * cu ele: contul trebuie să aibă emailul confirmat (legătura din email sau intrarea cu Google). Contul lui Daniel, făcut înainte
 * de regula asta, e primit și fără confirmare. Unul poate reseta verificarea în 2 pași a celuilalt (Admin → Securitate).
 */
export const OWNERS: { email: string; name: string; createdBefore?: string }[] = [
  { email: "danieligna1@gmail.com", name: "Daniel", createdBefore: "2026-11-06T18:45:00Z" },
  { email: "dr.cristina.igna@gmail.com", name: "Cristina" },
];
/** Păstrat pentru locurile care îl vor doar pe Daniel (primul proprietar). */
export const OWNER_ADMIN = { email: OWNERS[0].email, createdBefore: OWNERS[0].createdBefore! };

export const ownerOf = (email: string | null | undefined) => OWNERS.find((o) => o.email === (email ?? "").trim().toLowerCase()) ?? null;
export const isOwnerEmail = (email: string | null | undefined) => !!ownerOf(email);

type AdminCandidate = { email?: string | null; emailVerified?: boolean | null; createdAt?: Date | string | null } | null | undefined;
/** Proprietar adevărat: adresa e pe listă și contul e confirmat (sau, pentru Daniel, făcut înainte de 6 noiembrie, seara). */
export function isOwnerUser(u: AdminCandidate) {
  const o = ownerOf(u?.email);
  if (!o || !u) return false;
  if (u.emailVerified) return true;
  return !!o.createdBefore && !!u.createdAt && new Date(u.createdAt).getTime() < Date.parse(o.createdBefore);
}

export function isAdminUser(u: AdminCandidate, raw = process.env.ADMIN_EMAILS) {
  if (!u?.email) return false;
  if (isAdminEmail(u.email, raw)) return true;
  return isOwnerUser(u);
}

/** Neon, planul gratuit: 0,5 GB pe proiect. */
export const NEON_FREE_BYTES = 512 * 1024 ** 2;

/** Cheile de mediu de care depinde aplicația: arătăm doar dacă sunt puse, niciodată valoarea. */
export const ENV_KEYS: { key: string; what: string; needed: boolean }[] = [
  { key: "DATABASE_URL", what: "Baza de date Neon (pooled)", needed: true },
  { key: "DATABASE_URL_UNPOOLED", what: "Neon direct, pentru migrații", needed: false },
  { key: "BETTER_AUTH_SECRET", what: "Cheia secretă a sesiunilor", needed: true },
  { key: "BETTER_AUTH_URL", what: "Adresa publică a aplicației", needed: false },
  { key: "ADMIN_EMAILS", what: "Alți oameni în panoul de admin (cel care ține site-ul intră oricum)", needed: false },
  { key: "GOOGLE_CLIENT_ID", what: "„Continuă cu Google”", needed: false },
  { key: "GOOGLE_CLIENT_SECRET", what: "„Continuă cu Google”", needed: false },
  { key: "NEON_STORAGE_ENDPOINT_URL_S3", what: "Poze și documente (bucket assets)", needed: true },
  { key: "NEON_STORAGE_ACCESS_KEY_ID", what: "Poze și documente", needed: true },
  { key: "NEON_STORAGE_SECRET_ACCESS_KEY", what: "Poze și documente", needed: true },
  { key: "NEON_STORAGE_REGION", what: "Poze și documente", needed: false },
  { key: "NEON_REALTIME_URL", what: "Arborele în timp real", needed: false },
  { key: "NEON_REALTIME_SECRET", what: "Arborele în timp real", needed: false },
  { key: "NEON_FUNCTION_HELLO_BASE_URL", what: "Funcția Neon de probă", needed: false },
  { key: "GSC_SERVICE_ACCOUNT_JSON", what: "Admin → SEO: cheia Google Search Console (se poate pune și din panou)", needed: false },
  { key: "GOOGLE_SITE_VERIFICATION", what: "Admin → SEO: codul de verificare Google (se poate pune și din panou)", needed: false },
  { key: "NEON_AI_GATEWAY_BASE_URL", what: "Sugestii de biografie (plan plătit)", needed: false },
  { key: "NEON_AI_GATEWAY_TOKEN", what: "Sugestii de biografie (plan plătit)", needed: false },
];

/** Local, cheile bucket-ului vin ca AWS_* (din `neon env pull`); pe Vercel ca NEON_STORAGE_*. */
export const envSet = (key: string) => !!(process.env[key]?.trim() || (key.startsWith("NEON_STORAGE_") && process.env[key.replace("NEON_STORAGE_", "AWS_")]?.trim()));
