import { and, eq, isNull } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { waitUntil } from "@vercel/functions";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { captcha, twoFactor } from "better-auth/plugins";
import { db } from "@/db";
import { user, session, account, verification, twoFactor as twoFactorTable } from "@/db/schema";
import { recordConsent } from "./consent";
import { setPartnerConsent, signupPartnerFromCookie } from "./partners";
import { DEFAULT_LOCALE, localeFromCookieHeader } from "@/i18n/locales";

const DEV_SECRET = "dev-secret-cartea-neamului-schimba-in-productie";
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && !process.env.BETTER_AUTH_SECRET) {
  console.warn("BETTER_AUTH_SECRET lipsește: setează-l înainte de lansare (vezi .env.example).");
}

/**
 * Pe Vercel acceptăm domeniul nostru (carteaneamului.ro, cu și fără www), vechea adresă .vercel.app,
 * domeniul de producție și adresele de preview, pe lângă BETTER_AUTH_URL.
 */
const vercelOrigins = ["carteaneamului.ro", "www.carteaneamului.ro", "cartea-neamului.vercel.app",
  process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL]
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

/**
 * Verificarea „nu ești robot” (Cloudflare Turnstile, gratuită) la contul nou: doar dacă sunt puse cheile în Vercel
 * (NEXT_PUBLIC_TURNSTILE_SITE_KEY și TURNSTILE_SECRET_KEY). Fără ele, formularul merge ca până acum.
 */
const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
export const turnstileSiteKey = () => (turnstileSecret ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "" : "");

export const auth = betterAuth({
  appName: "Cartea Neamului",
  secret: process.env.BETTER_AUTH_SECRET ?? DEV_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined),
  trustedOrigins: vercelOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification, twoFactor: twoFactorTable } }),
  emailAndPassword: {
    enabled: true, minPasswordLength: 8,
    // „Ai uitat parola?”: legătura e valabilă o oră și merge o singură dată; după schimbare se închid toate sesiunile vechi.
    // Răspunsul e același și pentru un email fără cont, ca nimeni să nu poată afla cine are cont.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user: u, url }, request) => {
      const { resetMailLocale, sendResetMail } = await import("./parola-uitata");
      const locale = resetMailLocale(request?.headers.get("cookie"), (u as { locale?: string | null }).locale);
      // Trimis după răspuns, ca timpul răspunsului să nu arate dacă emailul are cont.
      waitUntil(sendResetMail(u.email, u.name, url, locale).catch((e) => console.error("reset mail", e)));
    },
  },
  // Cel mult 3 cereri de parolă nouă pe minut de la aceeași adresă.
  rateLimit: { customRules: { "/request-password-reset": { window: 60, max: 3 }, "/reset-password": { window: 60, max: 10 } } },
  // Cine e intrat în cont: ținut 5 minute într-un cookie semnat, ca fiecare pagină să nu mai întrebe baza de date la fiecare clic.
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  // Limba contului (aleasă din site, nu trimisă la creare): îl urmează pe alt telefon sau calculator.
  user: { additionalFields: { locale: { type: "string", required: false, defaultValue: DEFAULT_LOCALE, input: false } } },
  socialProviders: googleEnabled() ? { google: { clientId: googleId!, clientSecret: googleSecret!, prompt: "select_account" } } : undefined,
  // Cine are deja cont cu un email și intră apoi cu Google pe același email ajunge în același cont (Google verifică emailul).
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  databaseHooks: {
    // Cine își face cont (cu email sau cu Google) e de acord cu Termenii și cu Politica de confidențialitate: ținem minte când și ce versiune.
    user: {
      create: {
        // Contul nou primește limba în care omul citea site-ul când și l-a făcut.
        before: async (u, ctx) => {
          const locale = localeFromCookieHeader(ctx?.headers?.get?.("cookie") ?? ctx?.request?.headers?.get("cookie"));
          return locale ? { data: { ...u, locale } } : undefined;
        },
        after: async (u, ctx) => {
          await recordConsent(db, u.id, "terms", true).catch((e) => console.error("consent terms", e));
          // Bifa separată (nebifată de la sine) pentru beneficiile de la PropManage: doar dacă omul a bifat-o în formular.
          const cookie = ctx?.headers?.get?.("cookie") ?? ctx?.request?.headers?.get("cookie");
          const partner = signupPartnerFromCookie(cookie);
          if (partner) {
            await setPartnerConsent(db, u.id, true, { partner, source: "cont-nou", locale: localeFromCookieHeader(cookie) ?? DEFAULT_LOCALE })
              .catch((e) => console.error("consent partner", e));
          }
        },
      },
    },
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
  plugins: [
    // Verificarea în 2 pași, la alegerea fiecăruia (Daniel, 2026-11-13): un cod din aplicația de pe telefon (Google Authenticator,
    // Microsoft Authenticator…) sau unul din cele 10 coduri de rezervă. Omul are 10 minute să scrie codul după parolă.
    // Blocarea după prea multe coduri greșite e în src/app/api/auth/[...all]/route.ts.
    twoFactor({ issuer: "Cartea Neamului", otpOptions: { period: 10 }, backupCodeOptions: { amount: 10, length: 10 } }),
    ...(turnstileSiteKey() ? [captcha({ provider: "cloudflare-turnstile", secretKey: turnstileSecret!, endpoints: ["/sign-up/email"] })] : []),
    nextCookies(),
  ],
});
