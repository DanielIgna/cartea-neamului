import type { Instrumentation } from "next";

export function register() {}

/**
 * Erorile de pe server ajung, pe lângă jurnalul Vercel, și în audit_log (entity „eroare”),
 * ca să le vadă zona Infra & Dev din panoul de admin. Cel mult 20 pe minut pe instanță, ca o avalanșă să nu umple baza.
 */
let windowStart = 0, inWindow = 0;
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const now = Date.now();
  if (now - windowStart > 60_000) { windowStart = now; inWindow = 0; }
  if (++inWindow > 20) return;
  try {
    const { recordError } = await import("./lib/errors");
    await recordError(err, { path: request.path, method: request.method, route: context.routePath, kind: context.routeType });
  } catch {
    /* dacă nici baza nu răspunde, eroarea rămâne doar în jurnalul Vercel */
  }
};
