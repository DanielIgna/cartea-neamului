import type { Instrumentation } from "next";

/**
 * O variantă de probă (Vercel Preview) fără DATABASE_URL: baza locală din /tmp primește schema și contul demo înainte de prima
 * cerere, ca paginile să se deschidă. Pe site-ul live (cu DATABASE_URL) nu face nimic.
 */
export async function register() {
  // Importul stă înăuntrul condiției, ca varianta pentru middleware (edge) să nu-l includă.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.VERCEL || process.env.DATABASE_URL) return;
    try {
      const { preparePreviewDb } = await import("./lib/preview-db");
      await preparePreviewDb();
    } catch (e) {
      console.error("Varianta de probă: nu am putut pregăti baza locală.", e);
    }
  }
}

/**
 * Erorile de pe server ajung, pe lângă jurnalul Vercel, și în audit_log (entity „eroare”),
 * ca să le vadă zona Infra & Dev din panoul de admin. Cel mult 20 pe minut pe instanță, ca o avalanșă să nu umple baza.
 */
let windowStart = 0, inWindow = 0;
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // Importul stă înăuntrul condiției, ca varianta pentru middleware (edge, fără baza de date) să nu-l includă deloc.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const now = Date.now();
    if (now - windowStart > 60_000) { windowStart = now; inWindow = 0; }
    if (++inWindow > 20) return;
    try {
      const { recordError } = await import("./lib/errors");
      await recordError(err, { path: request.path, method: request.method, route: context.routePath, kind: context.routeType });
    } catch {
      /* dacă nici baza nu răspunde, eroarea rămâne doar în jurnalul Vercel */
    }
  }
};
