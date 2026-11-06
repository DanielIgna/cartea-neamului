import { and, eq, isNull } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { recordConsent } from "./consent";

const DEV_SECRET = "dev-secret-cartea-neamului-schimba-in-productie";
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && !process.env.BETTER_AUTH_SECRET) {
  console.warn("BETTER_AUTH_SECRET lipsește: setează-l înainte de lansare (vezi .env.example).");
}

/** Pe Vercel acceptăm și domeniul de producție și adresele de preview, pe lângă BETTER_AUTH_URL. */
const vercelOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL]
  .filter((h): h is string => !!h).map((h) => `https://${h}`);

const googleId = process.env.GOOGLE_CLIENT_ID, googleSecret = process.env.GOOGLE_CLIENT_SECRET;
/** „Continuă cu Google” apare doar după ce sunt puse pe Vercel cheile Google (GOOGLE_CLIENT_ID și GOOGLE_CLIENT_SECRET). */
export const googleEnabled = () => !!(googleId && googleSecret);

/** Poza din contul Google, din jetonul primit la intrare (câmpul „picture”). */
function pictureOf(idToken: string | null | undefined): string | null {
  try {
    const payload = JSON.parse(Buffer.from((idToken ?? "").split(".")[1] ?? "", "base64url").toString("utf8")) as { picture?: unknown };
    return typeof payload.picture === "string" ? payload.picture : null;
  } catch {
    return null;
  }
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? DEV_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined),
  trustedOrigins: vercelOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: googleEnabled() ? { google: { clientId: googleId!, clientSecret: googleSecret!, prompt: "select_account" } } : undefined,
  // Cine are deja cont cu un email și intră apoi cu Google pe același email ajunge în același cont (Google verifică emailul).
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  databaseHooks: {
    // Cine își face cont (cu email sau cu Google) e de acord cu Termenii și cu Politica de confidențialitate: ținem minte când și ce versiune.
    user: { create: { after: async (u) => { await recordConsent(db, u.id, "terms", true).catch((e) => console.error("consent terms", e)); } } },
    account: {
      create: {
        // Când cineva își leagă contul Google, poza din Google devine poza contului, dacă nu are deja una.
        after: async (acc) => {
          if (acc.providerId !== "google") return;
          const picture = pictureOf(acc.idToken);
          if (picture) await db.update(user).set({ image: picture }).where(and(eq(user.id, acc.userId), isNull(user.image)));
        },
      },
    },
  },
  // Dacă intrarea cu Google nu reușește, omul ajunge înapoi la pagina de intrare, cu un mesaj, nu pe o pagină de eroare în engleză.
  onAPIError: { errorURL: "/intrare" },
  plugins: [nextCookies()],
});
