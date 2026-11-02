import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";

const DEV_SECRET = "dev-secret-cartea-neamului-schimba-in-productie";
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && !process.env.BETTER_AUTH_SECRET) {
  console.warn("BETTER_AUTH_SECRET lipsește: setează-l înainte de lansare (vezi .env.example).");
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? DEV_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  plugins: [nextCookies()],
});
