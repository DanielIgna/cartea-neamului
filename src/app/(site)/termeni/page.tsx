import LegalText, { legalMetadata } from "@/components/LegalText";
import { TERMS_DATE } from "@/lib/legal";

export const generateMetadata = () => legalMetadata("Terms");

/** Termenii de utilizare, scriși pe înțelesul oricui; textul e în src/i18n/messages/legal/ (româna e cea oficială). */
export default function TermsPage() {
  return <LegalText page="Terms" date={TERMS_DATE} />;
}
