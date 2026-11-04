/**
 * Codul scurt al unei amintiri, pentru codul QR din Cartea neamului: cele 16 octeți ai UUID-ului scriși în 22 de litere
 * (base64url). Adresa e mai scurtă, așa că și codul QR e mai mic și se citește ușor de pe hârtie.
 */
export const shortCode = (uuid: string) => Buffer.from(uuid.replace(/-/g, ""), "hex").toString("base64url");

/** Înapoi la UUID; `null` pentru orice nu e un cod scurt bun. */
export function fromShortCode(code: string): string | null {
  if (!/^[A-Za-z0-9_-]{22}$/.test(code)) return null;
  const hex = Buffer.from(code, "base64url").toString("hex");
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Calea scurtă a unei amintiri: `/a/<cod>`. Duce la amintire, pentru cine are voie s-o vadă. */
export const memoryShortPath = (id: string) => `/a/${shortCode(id)}`;
