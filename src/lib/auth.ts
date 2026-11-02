import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";

const DEV_SECRET = "dev-secret-cartea-neamului-schimba-in-productie";
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && !process.env.BETTER_AUTH_SECRET) {
  console.warn("BETTER_AUTH_SECRET lipsește: setează-l înainte de lansare (vezi .env.example).");
}

/** Pe Vercel acceptăm și domeniul de producție și adresele de preview, pe lângă BETTER_AUTH_URL. */
const vercelOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL]
  .filter((h): h is string => !!h).map((h) => `https://${h}`);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? DEV_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined),
  trustedOrigins: vercelOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  plugins: [nextCookies()],
});
