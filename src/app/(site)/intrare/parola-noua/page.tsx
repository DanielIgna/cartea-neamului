import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { NewPasswordForm } from "@/components/PasswordReset";

export const dynamic = "force-dynamic";
// Legătura din email are cheia în adresă: nu o trimitem mai departe altor site-uri.
export const metadata: Metadata = { robots: PRIVATE_ROBOTS, referrer: "no-referrer" };

/** Aici duce legătura din email (better-auth o verifică întâi și trimite aici ?token=… sau ?error=INVALID_TOKEN). */
export default async function NewPassword({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  const ok = !error && typeof token === "string" && /^[\w-]{10,100}$/.test(token);
  return <div className="card" style={{ maxWidth: 440, margin: "0 auto" }}><NewPasswordForm token={ok ? token : null} /></div>;
}
