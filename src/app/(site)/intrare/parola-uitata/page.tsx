import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { ForgotPasswordForm } from "@/components/PasswordReset";

export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

/** „Ai uitat parola?”: cere legătura pentru o parolă nouă pe email. */
export default function ForgotPassword() {
  return <div className="card" style={{ maxWidth: 440, margin: "0 auto" }}><ForgotPasswordForm /></div>;
}
