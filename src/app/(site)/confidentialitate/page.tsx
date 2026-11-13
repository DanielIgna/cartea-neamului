import LegalText, { legalMetadata } from "@/components/LegalText";
import { PRIVACY_DATE } from "@/lib/legal";

export const generateMetadata = () => legalMetadata("Privacy");

/**
 * Politica de confidențialitate, scrisă pe înțelesul oricui; textul e în src/i18n/messages/legal/ (româna e cea oficială).
 * Cine răspunde de date vine din `operator()` (src/lib/legal.ts). Când se schimbă ceva important în ce păstrăm sau cui
 * arătăm, se schimbă textul în toate limbile și PRIVACY_DATE.
 */
export default function PrivacyPage() {
  return <LegalText page="Privacy" date={PRIVACY_DATE} />;
}
