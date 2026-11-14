/**
 * Butoanele de început numărate la clic (Admin → Analiză → Conversii): doar linkurile spre aceste adrese, ca „Începe arborele”,
 * „Plătește” sau „Dăruiește”. Fișier fără importuri de pe server, folosit și în browser (src/components/VisitBeacon.tsx).
 */
export const CTA_TARGETS = ["/intrare", "/arbore-nou", "/plata", "/cadou-de-sarbatori", "/activeaza", "/resurse-genealogie", "/contact"] as const;

export function ctaTarget(href: string | null | undefined): string | null {
  if (!href) return null;
  let p: string;
  try {
    const u = new URL(href, "https://carteaneamului.ro");
    if (!/(^|\.)carteaneamului\.ro$|localhost|vercel\.app$/.test(u.hostname)) return null;
    p = u.pathname.replace(/\/+$/, "") || "/";
  } catch { return null; }
  return CTA_TARGETS.find((t) => p === t || p.startsWith(`${t}/`)) ?? null;
}
